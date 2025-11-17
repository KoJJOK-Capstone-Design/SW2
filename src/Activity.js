import React, { useState, useEffect } from "react"; // useEffect를 추가했습니다.
import "./Home.css";
import "./Activity.css";
import { NavLink, Link } from "react-router-dom";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";

import bell from "./img/bell.png";
import chat from "./img/chat.png";

// 초기 기본 기록 정의
const INITIAL_WALKS = [
  { id: 1, title: "산책 기록", minutes: 3, km: 2, date: "2025.11.14" },
];

const ACTIVITY_CATEGORIES = [
  { key: 'walk', label: '산책', color: '#D7EFFF ', icon: '🐾' },
  { key: 'play', label: '놀이', color: '#E6FFE3', icon: '🎾' },
  { key: 'train', label: '훈련', color: '#FFF7CC', icon: '🏆' },
  { key: 'outing', label: '외출', color: '#EFE4FF', icon: '🚗' },
  { key: 'other', label: '기타', color: '#E9ECEF', icon: '⚫' }
];

function getCategory(label) {
  const found = ACTIVITY_CATEGORIES.find(cat => label.includes(cat.label));
  return found || ACTIVITY_CATEGORIES.find(cat => cat.key === 'other');
}

const weekly = [
  { label: "일요일", value: 20 },
  { label: "월요일", value: 50 },
  { label: "화요일", value: 28 },
  { label: "수요일", value: 38 },
  { label: "목요일", value: 9 },
  { label: "금요일", value: 31 },
  { label: "토요일", value: 48 },
];

const yTicks = [0, 10, 20, 30, 40, 50, 60, 70];

function formatDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// Local Storage에서 활동 기록을 불러오는 함수
const loadWalks = () => {
  try {
    const savedWalks = localStorage.getItem('activityWalks');
    // 저장된 데이터가 있으면 JSON 파싱, 없으면 초기 기본 기록을 사용
    return savedWalks ? JSON.parse(savedWalks) : INITIAL_WALKS;
  } catch (error) {
    console.error("Local Storage에서 기록을 불러오는 데 실패했습니다.", error);
    return INITIAL_WALKS;
  }
};

export default function Activity() {
  const [showBellPopup, setShowBellPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);

  // 이 상태를 Local Storage에서 불러온 값으로 초기화합니다.
  const [walks, setWalks] = useState(loadWalks); 

  // Local Storage에 데이터를 저장하는 useEffect 훅을 추가합니다.
  useEffect(() => {
    try {
      // walks 상태가 변경될 때마다 Local Storage에 저장합니다.
      localStorage.setItem('activityWalks', JSON.stringify(walks));
    } catch (error) {
      console.error("Local Storage에 기록을 저장하는 데 실패했습니다.", error);
    }
  }, [walks]); // walks가 의존성 배열에 있어, walks가 변경될 때마다 실행됩니다.

  const [tasks, setTasks] = useState([
    { id: 1, text: "산책하기", done: true },
    { id: 2, text: "밥주기", done: false },
    { id: 3, text: "양치시키기", done: false },
    { id: 4, text: "물주기", done: false },
  ]);
  const [newTask, setNewTask] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: "산책",
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

  const handleSave = (e) => {
    e.preventDefault();

    const v = validate(form.minutes, form.distance);
    if (!v.ok) return;

    const newItem = {
      id: Date.now(),
      title: `${form.type} 기록`,
      minutes: v.minutesNum,
      km: v.distanceNum,
      date: formatDate(),
    };

    setWalks((prev) => [...prev, newItem]); // setWalks 호출 시 useEffect가 Local Storage에 저장합니다.
    setShowModal(false);
    setIsAddDropdownOpen(false); 
    setForm({ type: "산책", minutes: "", distance: "" });
  };

  const openConfirm = (id) => setConfirm({ open: true, id });
  const closeConfirm = () => setConfirm({ open: false, id: null });
  const confirmDelete = () => {
    setWalks((prev) => prev.filter((w) => w.id !== confirm.id)); // setWalks 호출 시 useEffect가 Local Storage에 저장합니다.
    closeConfirm();
  };

  const openEdit = (w) => {
    setEdit({
      open: true,
      id: w.id,
      type: getCategory(w.title)?.label || "산책", 
      minutes: String(w.minutes ?? ""),
      distance: w.km == null ? "" : String(w.km),
    });
    setIsEditDropdownOpen(false); 
  };

  const handleEditChange = (field) => (e) => {
    const value = e?.target?.value ?? "";
    setEdit((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleAddDropdownSelect = (label) => {
    setForm(prev => ({ ...prev, type: label }));
    setIsAddDropdownOpen(false);
  };
  
  const handleEditDropdownSelect = (label) => {
    setEdit(prev => ({ ...prev, type: label }));
    setIsEditDropdownOpen(false);
  };

  const saveEdit = (e) => {
    e.preventDefault();

    const v = validate(edit.minutes, edit.distance);
    if (!v.ok) return;

    setWalks((prev) => // setWalks 호출 시 useEffect가 Local Storage에 저장합니다.
      prev.map((w) =>
        w.id === edit.id
          ? {
              ...w,
              title: `${edit.type} 기록`,
              minutes: v.minutesNum,
              km: v.distanceNum,
            }
          : w
      )
    );
    setEdit({ open: false, id: null, type: "", minutes: "", distance: "" });
    setIsEditDropdownOpen(false); 
  };

  const closeEdit = () => {
    setEdit({ open: false, id: null, type: "", minutes: "", distance: "" });
    setIsEditDropdownOpen(false); 
  };
  
  const closeAddModal = () => {
    setShowModal(false);
    setIsAddDropdownOpen(false); 
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
          <nav className="menuicon">
            <div className="icon-wrapper">
              <button
                className="icon-btn"
                onClick={() => { setShowBellPopup(v => !v); setShowChatPopup(false); }}
              >
                <img src={bell} alt="알림 아이콘" className="icon" />
              </button>
              {showBellPopup && (
                <div className="popup"><p>📢 새 알림이 없습니다.</p></div>
              )}
            </div>

            <div className="icon-wrapper">
              <button
                className="icon-btn"
                onClick={() => { setShowChatPopup(v => !v); setShowBellPopup(false); }}
              >
                <a href="/Chat"><img src={chat} alt="채팅 아이콘" className="icon" /></a>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="activity-container">
        <section className="section">
          <div className="section-title">
            <span className="blue-stick" />
            <h2 id='h2'>오늘의 활동</h2>
          </div>

          <div className="metrics">
            <Metric label="시간" value="45" unit="분" />
            <Metric label="거리" value="2.1" unit="km" />
          </div>
        </section>

        <section className="section">
          <div className="section-title">
            <span className="blue-stick" />
            <h2 id='h2'>주간 활동 분석</h2>
          </div>

          <div className="chart">
            <div className="y-grid">
              {yTicks.map((n) => (
                <div className="y-row" key={n}>
                  <span className="y-label">{n}</span>
                </div>
              ))}
            </div>

            <div className="bars">
              {weekly.map((d) => (
                <div className="bar-wrap" key={d.label}>
                  <div
                    className="bar"
                    style={{ height: `${d.value * 8}px` }}
                    title={`${d.label} ${d.value}분`}
                  />
                  <div className="bar-label">{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section recent-walks">
          <div className="section-title">
            <span className="blue-stick" />
            <h2 id='h2'>최근 산책 기록</h2>
          </div>

          <button
            className="css-plus-button"
            aria-label="빠른 추가"
            onClick={() => setShowModal(true)}
          > 
          </button>

          {walks.map((w) => {
            const category = getCategory(w.title);
            
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
                      {w.minutes}분 {w.km != null ? `| ${w.km}km` : ""}
                    </div>
                  </div>
                </div>

                <div className="walk-right">
                  <div className="walk-date">{w.date}</div>

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
                  className="form-input activity-select-trigger"
                  onClick={() => setIsAddDropdownOpen(prev => !prev)}
                >
                  {/* 아이콘 크기 수정을 위해 <span> 분리 */}
                  <div>
                    <span className="dropdown-icon">{getCategory(form.type)?.icon}</span> {form.type}
                  </div>
                </button>
                {isAddDropdownOpen && (
                  <div className="activity-select-options">
                    {ACTIVITY_CATEGORIES.map(cat => (
                      <div
                        key={cat.key}
                        className="activity-select-option"
                        onClick={() => handleAddDropdownSelect(cat.label)}
                      >
                        {/* 아이콘 크기 수정을 위해 <span> 분리 */}
                        <div>
                          <span className="dropdown-icon">{cat.icon}</span> {cat.label}
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
                  onClick={() => setIsEditDropdownOpen(prev => !prev)}
                >
                  {/* 아이콘 크기 수정을 위해 <span> 분리 */}
                  <div>
                    <span className="dropdown-icon">{getCategory(edit.type)?.icon}</span> {edit.type}
                  </div>
                </button>
                {isEditDropdownOpen && (
                  <div className="activity-select-options">
                    {ACTIVITY_CATEGORIES.map(cat => (
                      <div
                        key={cat.key}
                        className="activity-select-option"
                        onClick={() => handleEditDropdownSelect(cat.label)}
                      >
                        <div>
                          <span className="dropdown-icon">{cat.icon}</span> {cat.label}
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
              <button type="button" className="btn btn-ghost" onClick={closeEdit}>
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
            <p className="confirm-desc">이 기록은 복구할 수 없습니다.</p>
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
                <a href="https://github.com/ouskxk" className="github-link">
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
                <a href="https://github.com/suerte223" className="github-link">
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
                <a href="https://github.com/hsb9838" className="github-link">
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
                <a href="https://github.com/munjun0608" className="github-link">
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
                <a href="https://github.com/0bini" className="github-link">
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
              <img src={djangopic} alt="Django Logo" className="django-icon" />
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