// src/Activity.js

import React, { useState, useEffect, useMemo } from "react";
import "./Home.css";
import "./Activity.css";
import { NavLink, Link } from "react-router-dom";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";
import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";
import bell from "./img/bell.png";
import chat from "./img/chat.png";

// Chart.js 모듈 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// ====== 상수 & 유틸 ======
const ACTIVITY_CATEGORIES = [
  { key: "walk", label: "산책", color: "#D7EFFF", icon: "🐾" },
  { key: "play", label: "놀이", color: "#E6FFE3", icon: "🎾" },
  { key: "train", label: "훈련", color: "#FFF7CC", icon: "🏆" },
  { key: "outing", label: "외출", color: "#EFE4FF", icon: "🚗" },
  { key: "other", label: "기타", color: "#E9ECEF", icon: "⚫" },
];

const WEEK_LABELS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

// ✅ 수정됨: API_BASE 경로 수정
const API_BASE = "https://youngbin.pythonanywhere.com/api/v1/pets";

// localStorage 에서 pet_id / token 가져오기
const getPetId = () => {
  const stored = localStorage.getItem("pet_id");
  const n = parseInt(stored, 10);
  return Number.isNaN(n) ? 1 : n;
};

const getToken = () => localStorage.getItem("token");

// 공통 API 요청 함수
async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("API Error:", res.status, text);
    alert(
      `API 오류 (${res.status})\n${
        text || "서버에서 에러 메시지를 보내지 않았습니다."
      }`
    );
    throw new Error(`API Error ${res.status}`);
  }

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getCategory(label) {
  if (label === "선택하세요") {
    return ACTIVITY_CATEGORIES.find((cat) => cat.key === "other");
  }
  const found = ACTIVITY_CATEGORIES.find((cat) => label.includes(cat.label));
  return found || ACTIVITY_CATEGORIES.find((cat) => cat.key === "other");
}

function formatDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// 백엔드 응답을 화면용 walk 객체로 변환
function mapActivityToWalk(a) {
  const rawDateStr =
    a.log_date ||
    (a.created_at ? a.created_at.slice(0, 10) : null);
  const dateObj = rawDateStr ? new Date(rawDateStr) : new Date();

  return {
    id: a.id,
    type: a.log_type,
    title: `${a.log_type} 기록`,
    minutes: a.duration,
    km: a.distance,
    date: formatDate(dateObj),
    rawDate: dateObj,
  };
}

// ====== 컴포넌트 ======
export default function Activity() {
  const [showBellPopup, setShowBellPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  
  // 로그인 상태 및 사용자 정보
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userProfileImage, setUserProfileImage] = useState("https://i.pravatar.cc/80?img=11");

  // 로그인 상태 확인 및 사용자 정보 가져오기
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      axios
        .get("https://youngbin.pythonanywhere.com/api/v1/users/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const name =
            res.data?.nickname ||
            res.data?.username ||
            res.data?.id ||
            "멍냥";
          setUsername(name);
          // 프로필 이미지가 있으면 사용, 없으면 기본 이미지
          if (res.data?.profile_image || res.data?.avatar) {
            const imgUrl = res.data.profile_image || res.data.avatar;
            setUserProfileImage(
              imgUrl.startsWith("http")
                ? imgUrl
                : `https://youngbin.pythonanywhere.com${imgUrl}`
            );
          }
        })
        .catch((err) => {
          console.error("유저 정보 불러오기 실패:", err);
          setIsLoggedIn(false);
        });
    } else {
      setIsLoggedIn(false);
    }
  }, []);
  const [walks, setWalks] = useState([]);
  const [loading, setLoading] = useState(false);

  // 모달/폼 상태
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: "선택하세요",
    minutes: "",
    distance: "",
  });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [edit, setEdit] = useState({
    open: false,
    id: null,
    type: "",
    minutes: "",
    distance: "",
  });
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);

  // ====== 초기 로딩: 활동 목록 불러오기 ======
  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      setLoading(true);
      const petId = getPetId();
      // ✅ 수정됨: URL 경로 수정
      const data = await apiRequest(`${API_BASE}/activities/${petId}/`, {
        method: "GET",
      });
      const arr = Array.isArray(data) ? data : [];
      const mapped = arr.map(mapActivityToWalk);
      setWalks(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ====== 폼 공통 ======
  const handleChange = (field) => (e) => {
    const value = e?.target?.value ?? "";
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (minutesStr, distanceStr) => {
    const minutesNum = parseInt(minutesStr, 10);
    if (Number.isNaN(minutesNum) || minutesNum <= 0) {
      alert("내용(분)을 1 이상의 숫자로 입력해 주세요.");
      return { ok: false };
    }

    const distanceNum = distanceStr === "" ? null : parseFloat(distanceStr);
    if (distanceStr !== "" && (Number.isNaN(distanceNum) || distanceNum < 0)) {
      alert("이동 거리(km)는 0 이상의 숫자여야 합니다.");
      return { ok: false };
    }

    return { ok: true, minutesNum, distanceNum };
  };

  // ====== 활동 추가 저장 ======
  const handleSave = async (e) => {
    e.preventDefault();
    if (form.type === "선택하세요") {
      alert("활동 종류를 선택해 주세요.");
      return;
    }

    const v = validate(form.minutes, form.distance);
    if (!v.ok) return;

    try {
      const petId = getPetId();
      const payload = {
        log_type: form.type,
        duration: v.minutesNum,
      };
      if (v.distanceNum != null) payload.distance = v.distanceNum;

      // ✅ 수정됨: POST URL 경로 수정
      const created = await apiRequest(`${API_BASE}/activities/logs/${petId}/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const newWalk = created && created.id
        ? mapActivityToWalk(created)
        : {
            id: Date.now(),
            type: form.type,
            title: `${form.type} 기록`,
            minutes: v.minutesNum,
            km: v.distanceNum,
            date: formatDate(),
            rawDate: new Date(),
          };

      setWalks((prev) => [...prev, newWalk]);
      setShowModal(false);
      setIsAddDropdownOpen(false);
      setForm({ type: "선택하세요", minutes: "", distance: "" });
    } catch (err) {
      console.error(err);
    }
  };

  // ====== 삭제 ======
  const openConfirm = (id) => setConfirm({ open: true, id });
  const closeConfirm = () => setConfirm({ open: false, id: null });

  const confirmDelete = async () => {
    try {
      const targetId = confirm.id;
      if (!targetId) return;

      // ✅ 수정됨: DELETE URL 경로 수정 (petId 제거)
      await apiRequest(`${API_BASE}/activities/logs/items/${targetId}/`, {
        method: "DELETE",
      });

      setWalks((prev) => prev.filter((w) => w.id !== targetId));
    } catch (err) {
      console.error(err);
    } finally {
      closeConfirm();
    }
  };

  // ====== 수정 모달 ======
  const openEdit = (w) => {
    setEdit({
      open: true,
      id: w.id,
      type: w.type || getCategory(w.title)?.label || "산책",
      minutes: String(w.minutes ?? ""),
      distance: w.km == null ? "" : String(w.km),
    });
    setIsEditDropdownOpen(false);
  };

  const handleEditChange = (field) => (e) => {
    const value = e?.target?.value ?? "";
    setEdit((prev) => ({ ...prev, [field]: value }));
  };

  const closeEdit = () => {
    setEdit({ open: false, id: null, type: "", minutes: "", distance: "" });
    setIsEditDropdownOpen(false);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const v = validate(edit.minutes, edit.distance);
    if (!v.ok) return;

    try {
      const payload = {
        log_type: edit.type,
        duration: v.minutesNum,
      };
      if (v.distanceNum != null) payload.distance = v.distanceNum;

      // ✅ 수정됨: PUT URL 경로 수정 (petId 제거)
      const updated = await apiRequest(`${API_BASE}/activities/logs/items/${edit.id}/`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const updatedWalk = updated && updated.id
        ? mapActivityToWalk(updated)
        : {
            id: edit.id,
            type: edit.type,
            title: `${edit.type} 기록`,
            minutes: v.minutesNum,
            km: v.distanceNum,
          };

      setWalks((prev) =>
        prev.map((w) => (w.id === updatedWalk.id ? { ...w, ...updatedWalk } : w))
      );
      closeEdit();
    } catch (err) {
      console.error(err);
    }
  };

  // ====== 드롭다운 선택 ======
  const handleAddDropdownSelect = (label) => {
    setForm((prev) => ({ ...prev, type: label }));
    setIsAddDropdownOpen(false);
  };

  const handleEditDropdownSelect = (label) => {
    setEdit((prev) => ({ ...prev, type: label }));
    setIsEditDropdownOpen(false);
  };

  const closeAddModal = () => {
    setShowModal(false);
    setIsAddDropdownOpen(false);
    setForm({ type: "선택하세요", minutes: "", distance: "" });
  };

  // ====== 파생 데이터: 오늘의 합계 / 주간 분석 ======
  const todayStr = formatDate();
  const today = useMemo(
    () =>
      walks.filter((w) => w.date === todayStr || !w.date),
    [walks, todayStr]
  );

  const todayMinutes = today.reduce((sum, w) => sum + (w.minutes || 0), 0);
  const todayDistance = today.reduce(
    (sum, w) => sum + (w.km || 0),
    0
  );

  const weeklyMinutes = useMemo(() => {
    const arr = Array(7).fill(0);
    walks.forEach((w) => {
      const d = w.rawDate || new Date();
      const idx = d.getDay();
      arr[idx] += w.minutes || 0;
    });
    return arr;
  }, [walks]);

  const hasWeeklyData = weeklyMinutes.some((v) => v > 0);

  const chartData = {
    labels: WEEK_LABELS,
    datasets: hasWeeklyData
      ? [
          {
            label: "활동 시간(분)",
            data: weeklyMinutes,
            backgroundColor: "#D6E4FF",
            borderRadius: 12,
            borderSkipped: false,
          },
        ]
      : [],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 10 },
        border: { display: false },
        grid: { color: "#F0F0F0" },
      },
    },
  };

  return (
    <div className="home">
      <header className="nav">
        <div className="nav-inner">
          <Link to="/dashboard" className="brand">
            <img src={logoBlue} alt="paw logo" className="paw" />
            <span className="brand-text">멍냥멍냥</span>
          </Link>
          <nav className="menu">
            <NavLink to="/activity">활동</NavLink>
            <NavLink to="/health">건강</NavLink>
            <NavLink to="/calendar">캘린더</NavLink>
            <NavLink to="/community">커뮤니티</NavLink>
          </nav>
          {isLoggedIn ? (
            <nav className="menuicon">
              {/* 프로필 */}
              <Link to="/mypage" className="profile">
                <div className="profile__avatar">
                  <img src={userProfileImage} alt="프로필" />
                </div>
                <span className="profile__name">{username}</span>
              </Link>

              {/* 알림 벨 */}
              <div className="icon-wrapper">
                <button
                  className="icon-btn"
                  onClick={() => {
                    setShowBellPopup((v) => !v);
                    setShowChatPopup(false);
                  }}
                >
                  <img src={bell} alt="알림 아이콘" className="icon" />
                </button>
                {showBellPopup && (
                  <div className="popup">
                    <p>📢 새 알림이 없습니다.</p>
                  </div>
                )}
              </div>

              {/* 채팅 */}
              <div className="icon-wrapper">
                <button
                  className="icon-btn"
                  onClick={() => {
                    setShowChatPopup((v) => !v);
                    setShowBellPopup(false);
                  }}
                >
                  <NavLink to="/Chat">
                    <img src={chat} alt="채팅 아이콘" className="icon" />
                  </NavLink>
                </button>
              </div>
            </nav>
          ) : (
            <nav className="menulink">
              <NavLink to="/signup">회원가입</NavLink>
              <NavLink to="/signin">로그인</NavLink>
            </nav>
          )}
        </div>
      </header>

      <main className="activity-container">
        {/* 오늘의 활동 */}
        <section className="section">
          <div className="section-title">
            <span className="blue-stick" />
            <h2 id="h2">오늘의 활동</h2>
          </div>
          <div className="metrics">
            <Metric label="시간" value={todayMinutes} unit="분" />
            <Metric
              label="거리"
              value={todayDistance.toFixed(1)}
              unit="km"
            />
          </div>
        </section>

        {/* 주간 활동 분석 */}
        <section className="section">
          <div className="section-title">
            <span className="blue-stick" />
            <h2 id="h2">주간 활동 분석</h2>
          </div>
          <div className="graph-box">
            {loading ? (
              <div className="graph-loading">로딩 중...</div>
            ) : (
              <Bar options={chartOptions} data={chartData} />
            )}
          </div>
        </section>

        {/* 최근 산책 기록 */}
        <section className="section recent-walks">
          <div className="section-title">
            <span className="blue-stick" />
            <h2 id="h2">최근 산책 기록</h2>
          </div>
          <button
            className="css-plus-button"
            aria-label="빠른 추가"
            onClick={() => setShowModal(true)}
          ></button>
          {walks.map((w) => {
            const category = getCategory(w.type || w.title);
            return (
              <div className="walk-card" key={w.id}>
                <div className="walk-left">
                  <div
                    className="avatar"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon}
                  </div>
                  <div className="walk-text">
                    <div className="walk-title">{w.title}</div>
                    <div className="walk-sub">
                      {w.minutes}분{" "}
                      {w.km != null ? `| ${w.km}km` : ""} · {w.date}
                    </div>
                  </div>
                </div>
                <div className="walk-right">
                  <div className="walk-actions">
                    <button
                      className="icon-btn"
                      aria-label="수정"
                      onClick={() => openEdit(w)}
                    >
                      <img className="icon-img" src={editIcon} alt="" />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="삭제"
                      onClick={() => openConfirm(w.id)}
                    >
                      <img className="icon-img" src={trashIcon} alt="" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* 추가 모달 */}
      {showModal && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={closeAddModal} />
          <form className="modal-panel" onSubmit={handleSave}>
            <h2 className="modal-title">활동 기록 추가</h2>
            <div className="form-field">
              <label className="form-label">활동 종류</label>
              <div className="activity-select-wrapper">
                <button
                  type="button"
                  className={`form-input activity-select-trigger ${
                    form.type === "선택하세요" ? "placeholder" : ""
                  }`}
                  onClick={() =>
                    setIsAddDropdownOpen((prev) => !prev)
                  }
                >
                  <div>
                    {form.type !== "선택하세요" && (
                      <span className="dropdown-icon">
                        {getCategory(form.type)?.icon}
                      </span>
                    )}
                    {form.type}
                  </div>
                </button>
                {isAddDropdownOpen && (
                  <div className="activity-select-options">
                    {ACTIVITY_CATEGORIES.map((cat) => (
                      <div
                        key={cat.key}
                        className="activity-select-option"
                        onClick={() =>
                          handleAddDropdownSelect(cat.label)
                        }
                      >
                        <div>
                          <span className="dropdown-icon">
                            {cat.icon}
                          </span>{" "}
                          {cat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">내용 (분)</label>
              <input
                className="form-input"
                type="number"
                placeholder="예 : 30"
                value={form.minutes}
                onChange={handleChange("minutes")}
              />
            </div>
            <div className="form-field">
              <label className="form-label">이동 거리 (km, 선택)</label>
              <input
                className="form-input"
                type="number"
                step="0.1"
                placeholder="예 : 1.5"
                value={form.distance}
                onChange={handleChange("distance")}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeAddModal}
              >
                취소
              </button>
              <button type="submit" className="btn btn-primary">
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 수정 모달 */}
      {edit.open && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={closeEdit} />
          <form className="modal-panel" onSubmit={saveEdit}>
            <h2 className="modal-title">활동 기록 수정</h2>
            <div className="form-field">
              <label className="form-label">활동 종류</label>
              <div className="activity-select-wrapper">
                <button
                  type="button"
                  className="form-input activity-select-trigger"
                  onClick={() =>
                    setIsEditDropdownOpen((prev) => !prev)
                  }
                >
                  <div>
                    <span className="dropdown-icon">
                      {getCategory(edit.type)?.icon}
                    </span>{" "}
                    {edit.type}
                  </div>
                </button>
                {isEditDropdownOpen && (
                  <div className="activity-select-options">
                    {ACTIVITY_CATEGORIES.map((cat) => (
                      <div
                        key={cat.key}
                        className="activity-select-option"
                        onClick={() =>
                          handleEditDropdownSelect(cat.label)
                        }
                      >
                        <div>
                          <span className="dropdown-icon">
                            {cat.icon}
                          </span>{" "}
                          {cat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">내용 (분)</label>
              <input
                className="form-input"
                type="number"
                value={edit.minutes}
                onChange={handleEditChange("minutes")}
              />
            </div>
            <div className="form-field">
              <label className="form-label">이동 거리 (km, 선택)</label>
              <input
                className="form-input"
                type="number"
                step="0.1"
                value={edit.distance}
                onChange={handleEditChange("distance")}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeEdit}
              >
                취소
              </button>
              <button type="submit" className="btn btn-primary">
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {confirm.open && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={closeConfirm} />
          <div className="modal-panel confirm-panel">
            <h3 className="confirm-title">정말 삭제하시겠습니까?</h3>
            <p className="confirm-desc">
              이 기록은 복구할 수 없습니다.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeConfirm}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="logo-row">
            <div className="logo-stack">
              <img src={logoGray} alt="" className="paw-bg" aria-hidden />
              <span className="wordmark">KoJJOK</span>
            </div>
            <div className="grid">
              <div className="col">
                <h3>Hyeona Kim</h3>
                <p>UI/UX Design</p>
                <a
                  href="https://github.com/ouskxk"
                  className="github-link"
                >
                  <img
                    src={githubpic}
                    alt="GitHub Logo"
                    className="github-icon"
                  />
                  ouskxk
                </a>
              </div>
              <div className="col">
                <h3>Jiun Ko</h3>
                <p>Front-End Dev</p>
                <a
                  href="https://github.com/suerte223"
                  className="github-link"
                >
                  <img
                    src={githubpic}
                    alt="GitHub Logo"
                    className="github-icon"
                  />
                  suerte223
                </a>
              </div>
              <div className="col">
                <h3>Seungbeom Han</h3>
                <p>Front-End Dev</p>
                <a
                  href="https://github.com/hsb9838"
                  className="github-link"
                >
                  <img
                    src={githubpic}
                    alt="GitHub Logo"
                    className="github-icon"
                  />
                  hsb9838
                </a>
              </div>
              <div className="col">
                <h3>Munjun Yang</h3>
                <p>Back-End Dev</p>
                <a
                  href="https://github.com/munjun0608"
                  className="github-link"
                >
                  <img
                    src={githubpic}
                    alt="GitHub Logo"
                    className="github-icon"
                  />
                  munjun0608
                </a>
              </div>
              <div className="col">
                <h3>Youngbin Kang</h3>
                <p>Back-End Dev</p>
                <a
                  href="https://github.com/0bini"
                  className="github-link"
                >
                  <img
                    src={githubpic}
                    alt="GitHub Logo"
                    className="github-icon"
                  />
                  0bini
                </a>
              </div>
            </div>
            <div className="tech-stack">
              <h3>TECH STACK</h3>
              <img src={reactpic} alt="React Logo" className="react-icon" />
              <img
                src={djangopic}
                alt="Django Logo"
                className="django-icon"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Metric({ label, value, unit }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        <span className="metric-number">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
    </div>
  );
}