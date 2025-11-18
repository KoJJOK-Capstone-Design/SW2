import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

import bell from "./img/bell.png";
import chat from "./img/chat.png";
import circle from "./img/circle.png";
import plusicon from "./img/plusicon.png";

import { Link, NavLink } from "react-router-dom";

import "./Dashboard.css";
import "./Calendar.css";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

const API_BASE = "https://youngbin.pythonanywhere.com/api/v1/pets";

// API 요청 헬퍼 함수
const getToken = () => localStorage.getItem("token");
const getPetId = () => localStorage.getItem("pet_id");

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("API Error:", res.status, text);
    console.error("Request URL:", `${API_BASE}${path}`);
    console.error("Request Method:", options.method || "GET");
    const errorMsg = text || "서버에서 에러 메시지를 보내지 않았습니다.";
    // 405 에러는 alert를 표시하지 않고 콘솔에만 출력 (너무 많은 alert 방지)
    if (res.status !== 405) {
      alert(`API 오류 (${res.status})\n${errorMsg}`);
    }
    throw new Error(`API Error ${res.status}`);
  }

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const CustomDatePicker = ({ value, onChange, events }) => {
  const today = new Date();
  const initialDate = value ? new Date(value) : new Date();
  const [current, setCurrent] = useState(initialDate);

  // value prop이 변경되면 current 상태도 업데이트
  useEffect(() => {
    if (value) {
      const newDate = new Date(value);
      setCurrent(newDate);
    }
  }, [value]);

  const year = current.getFullYear();
  const month = current.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const startDay = start.getDay();
  const totalDays = end.getDate();

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);
  while (days.length < 42) days.push(null);

  const formatDate = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const isToday = (d) =>
    d &&
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const isSelected = (d) =>
    value &&
    new Date(value).getDate() === d &&
    new Date(value).getMonth() === month &&
    new Date(value).getFullYear() === year; // 연도 비교 추가

  return (
    <div className="custom-datepicker">
      <div className="calendar-header">
        <button
          type="button"
          onClick={() => {
            const newDate = new Date(year, month - 1, 1);
            setCurrent(newDate);
            onChange(formatDate(year, month - 1, 1));
          }}
        >
          ‹
        </button>
        <span>
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={() => {
            const newDate = new Date(year, month + 1, 1);
            setCurrent(newDate);
            onChange(formatDate(year, month + 1, 1));
          }}
        >
          ›
        </button>
      </div>

      <div className="calendar-days">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="calendar-day-header">
            {d}
          </div>
        ))}

        {days.map((d, i) => {
          const dStr = d ? formatDate(year, month, d) : null;
          const dayEv = dStr && events ? events.filter((e) => e.date === dStr) : [];

          return (
            <div
              key={i}
              className={`calendar-date ${d ? "" : "empty"} ${
                isToday(d) ? "today" : ""
              } ${isSelected(d) ? "selected" : ""}`}
              onClick={() => {
                if (!d) return;
                onChange(formatDate(year, month, d));
              }}
            >
              {d}
              {dayEv.length > 0 && (
                <div className="event-dots">
                  {dayEv.slice(0, 4).map((ev, idx) => (
                    <span
                      key={idx}
                      className="event-dot"
                      title={`${ev.category}: ${ev.text}`}
                      style={{ backgroundColor: ev.color }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* Date → YYYY-MM-DD */
function formatYMD(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ---------------- Main Calendar Component ---------------- */
export default function Calendar() {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const [form, setForm] = useState({ text: "", date: "", category: "병원/약" });
  const [closing, setClosing] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const [showBellPopup, setShowBellPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);

  // 프로필 정보
  const [username, setUsername] = useState("멍냥");
  const [userProfileImage, setUserProfileImage] = useState("https://i.pravatar.cc/80?img=11");

  // 프로필 정보 가져오기
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
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
        });
    }
  }, []);

  const CATEGORY_OPTIONS = [
    { value: "병원/약", label: "병원/약", color: "#ebc3bcff", icon: "🏥" },
    { value: "미용", label: "미용", color: "#d6ebfaff", icon: "✂️" },
    { value: "행사", label: "행사", color: "#fff9ecff", icon: "🎂" },
    { value: "기타", label: "기타", color: "#E9ECEF", icon: "⚫" },
  ];

  const categoryMeta = CATEGORY_OPTIONS.reduce((acc, cat) => {
    acc[cat.value] = { color: cat.color, icon: cat.icon };
    return acc;
  }, {});

  // 월별 일정 조회 API 호출
  const fetchCalendarEvents = useCallback(async (year, month) => {
    const petId = getPetId();
    if (!petId) {
      console.warn("pet_id가 없습니다.");
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest(
        `/calendar/${petId}/?year=${year}&month=${month}`,
        { method: "GET" }
      );

      // API 응답을 내부 이벤트 형식으로 변환
      const transformedEvents = (data || []).map((schedule) => ({
        id: schedule.id,
        text: schedule.content,
        date: schedule.schedule_date,
        category: schedule.category,
        color: categoryMeta[schedule.category]?.color || "#E9ECEF",
      }));

      setEvents(transformedEvents);
    } catch (error) {
      console.error("캘린더 일정 조회 실패:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 현재 월의 일정 조회
  useEffect(() => {
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1;
    fetchCalendarEvents(currentYear, currentMonth);
  }, [date, fetchCalendarEvents]);

  const getCategory = (value) =>
    CATEGORY_OPTIONS.find((cat) => cat.value === value) ||
    CATEGORY_OPTIONS[CATEGORY_OPTIONS.length - 1];

  const selectedDateStr = formatYMD(date);
  const dayEvents = events.filter((e) => e.date === selectedDateStr);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ text: "", date: selectedDateStr, category: "병원/약" });
    setShowForm(true);
  };

  const openEditForm = (ev) => {
    setEditingId(ev.id);
    setForm({ text: ev.text, date: ev.date, category: ev.category });
    setShowForm(true);
  };

  const closeForm = () => {
    setClosing(true);
    setIsCategoryDropdownOpen(false);
    setTimeout(() => {
      setShowForm(false);
      setClosing(false);
      setEditingId(null);
      setForm({ text: "", date: "", category: "병원/약" });
    }, 200);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.text || !form.date || !form.category) {
      alert("일정 내용/날짜/카테고리를 모두 입력해주세요.");
      return;
    }

    const petId = getPetId();
    if (!petId) {
      alert("펫 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    try {
      setLoading(true);
      const meta = categoryMeta[form.category] || categoryMeta["기타"];

      if (editingId) {
        // 일정 수정 - 서버가 PUT/PATCH를 허용하지 않을 수 있으므로 POST로 시도
        // 또는 실제 서버 엔드포인트가 다를 수 있음
        console.log("일정 수정 시도 - schedule_id:", editingId);
        await apiRequest(
          `/calendar/schedules/items/${editingId}/`,
          {
            method: "PUT",
            body: JSON.stringify({
              schedule_date: form.date,
              content: form.text,
              category: form.category,
            }),
          }
        );
      } else {
        // 일정 생성
        await apiRequest(
          `/calendar/schedules/${petId}/`,
          {
            method: "POST",
            body: JSON.stringify({
              schedule_date: form.date,
              content: form.text,
              category: form.category,
            }),
          }
        );
      }

      // 수정/생성 후 일정 목록 다시 불러오기
      const currentYear = date.getFullYear();
      const currentMonth = date.getMonth() + 1;
      await fetchCalendarEvents(currentYear, currentMonth);

      closeForm();
    } catch (error) {
      console.error("일정 저장 실패:", error);
      // 에러가 이미 apiRequest에서 alert로 표시되었으므로 여기서는 추가 alert 없음
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setRecordToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) {
      setShowDeleteModal(false);
      setRecordToDelete(null);
      return;
    }

    try {
      setLoading(true);
      await apiRequest(`/calendar/schedules/items/${recordToDelete}/`, {
        method: "DELETE",
      });

      // 삭제 후 일정 목록 다시 불러오기
      const currentYear = date.getFullYear();
      const currentMonth = date.getMonth() + 1;
      await fetchCalendarEvents(currentYear, currentMonth);

      setShowDeleteModal(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error("일정 삭제 실패:", error);
      // 에러가 이미 apiRequest에서 alert로 표시되었으므로 여기서는 추가 alert 없음
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (value) => {
    setForm((prev) => ({ ...prev, category: value }));
    setIsCategoryDropdownOpen(false);
  };

  /* ---------------- 스크롤바 보정 포함한 모달 스크롤 락 ---------------- */
  useEffect(() => {
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    if (showForm || showDeleteModal) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0px";
    }

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0px";
    };
  }, [showForm, showDeleteModal]);

  return (
    <div className="calendar-page">
      {/* --- 네비게이션 --- */}
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
            {/* 프로필 */}
            <div className="profile">
              <div className="profile__avatar">
                <img src={userProfileImage} alt="프로필" />
              </div>
              <span className="profile__name">{username}</span>
            </div>

            <div className="icon-wrapper">
              <button
                className="icon-btn"
                onClick={() => {
                  setShowBellPopup((v) => !v);
                  setShowChatPopup(false);
                }}
                type="button"
              >
                <img src={bell} alt="알림 아이콘" className="icon" />
              </button>
              {showBellPopup && <div className="popup"><p>📢 새 알림이 없습니다.</p></div>}
            </div>

            <div className="icon-wrapper">
              <button
                className="icon-btn"
                onClick={() => {
                  setShowChatPopup((v) => !v);
                  setShowBellPopup(false);
                }}
                type="button"
              >
                <a href="/Chat"><img src={chat} alt="채팅 아이콘" className="icon" /></a>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* --- 캘린더 메인 --- */}
      <main className="calendar-main">
        <div className="calendar-container">
          <CustomDatePicker
            value={formatYMD(date)}
            onChange={(newDateStr) => {
              setDate(new Date(newDateStr));
            }}
            events={events}
          />

          <section className="event-section">
            <h3>
              {date.getMonth() + 1}월 {date.getDate()}일 일정
            </h3>

            <div className={dayEvents.length >= 5 ? "event-list-scrollable" : "event-list"}>
              {dayEvents.length ? (
                dayEvents.map((ev) => (
                  <div className="event-item" key={ev.id}>
                    <div
                      className="event-icon"
                      style={{ backgroundColor: categoryMeta[ev.category]?.color || ev.color }}
                    >
                      {/* ✅✅✅ 기본 아이콘도 이모지로 수정 ✅✅✅ */}
                      {categoryMeta[ev.category]?.icon || "⚫"}
                    </div>
                    <div className="event-content">
                      <strong>[{ev.category}]</strong> {ev.text}
                    </div>

                    <div className="icon-btn-img" style={{ display: "flex", gap: 8 }}>
                      <button className="icon-btn" onClick={() => openEditForm(ev)} type="button">
                        <img className="icon-img" src={editIcon} alt="edit" />
                      </button>
                      <button className="icon-btn" onClick={() => handleDeleteClick(ev.id)} type="button">
                        <img className="icon-img" src={trashIcon} alt="delete" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-event">등록된 일정이 없습니다.</p>
              )}
            </div>

            <button className="add-btn" onClick={openAddForm} type="button">
            </button>
          </section>
        </div>
      </main>

      {/* ---------------- 모달: 일정 추가/수정 ---------------- */}
      {showForm && (
        <div className={`modal-overlay ${closing ? "closing" : ""}`} onClick={closeForm}>
          <div className={`modal ${closing ? "closing" : ""}`} onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "일정 수정" : "일정 추가"}</h2>

            <form onSubmit={handleSave}>
              <div className="modal-calendar-layout">
                <div className="modal-calendar-left">
                  <label className="date">날짜</label>
                  <CustomDatePicker
                    value={form.date}
                    onChange={(newDate) => setForm({ ...form, date: newDate })}
                    events={[]}  // 모달은 이벤트 점 비활성화
                  />
                </div>

                <div className="modal-calendar-right">
                  <label className="date">일정 내용</label>
                  <input
                    type="text"
                    value={form.text}
                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                    placeholder="예: 심장사상충 약 먹는 날"
                  />

                  <label className="date">카테고리</label>
                  <div className="activity-select-wrapper">
                    <button
                      type="button"
                      className="form-input activity-select-trigger"
                      onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                    >
                      <div>
                        {/* ✅✅✅ 이모지는 <span> 태그 안에 렌더링됩니다 ✅✅✅ */}
                        <span className="dropdown-icon" style={{ color: getCategory(form.category)?.color }}>
                          {getCategory(form.category)?.icon}
                        </span>{" "}
                        {getCategory(form.category)?.label}
                      </div>
                    </button>

                    {isCategoryDropdownOpen && (
                      <div className="activity-select-options">
                        {CATEGORY_OPTIONS.map((cat) => (
                          <div
                            key={cat.value}
                            className="activity-select-option"
                            onClick={() => handleCategorySelect(cat.value)}
                          >
                            <div>
                              <span className="dropdown-icon" style={{ color: cat.color }}>
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
              </div>

              <div className="form-buttons">
                <button type="button" className="cancel" onClick={closeForm}>
                  취소
                </button>
                <button type="submit" className="save">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 모달 */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-modal-delete-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>정말 삭제하시겠습니까?</h2>
            <p className="delete-confirm-text">이 기록은 복구할 수 없습니다.</p>
            <div className="form-buttons">
              <button type="button" className="btn-cancel" onClick={handleCancelDelete}>
                취소
              </button>
              <button type="button" className="btn-delete-confirm" onClick={handleConfirmDelete}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 푸터 --- */}
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
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> ouskxk
                </a>
              </div>
              <div className="col">
                <h3>Jiun Ko</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/suerte223" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> suerte223
                </a>
              </div>
              <div className="col">
                <h3>Seungbeom Han</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/hsb9838" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> hsb9838
                </a>
              </div>
              <div className="col">
                <h3>Munjun Yang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/munjun0608" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> munjun0608
                </a>
              </div>
              <div className="col">
                <h3>Youngbin Kang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/0bini" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> 0bini
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