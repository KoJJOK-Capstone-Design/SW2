import React, { useState } from "react";

// (아이콘 import 등은 동일)
import {
  FaClinicMedical,
  FaShoppingCart,
  FaCut,
  FaBirthdayCake,
  FaTree,
  FaCircle,
} from "react-icons/fa";
// ReactCalendar import는 이제 필요 없으므로 삭제합니다.
// import ReactCalendar from "react-calendar";
// import "react-calendar/dist/Calendar.css";
import Select from "react-select";
import { Link } from "react-router-dom";
// ko import는 이제 CustomDatePicker를 쓰므로 필요 없습니다.
// import { ko } from 'date-fns/locale';
import "./Dashboard.css";
import "./Calendar.css"; // (이 CSS 안에 .event-dots 스타일이 이미 있어야 합니다)

// (이미지 import 등은 동일)
import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

/* * 📅 커스텀 달력
 * [수정됨] 메인 캘린더로 사용하기 위해 'events' prop을 받아 점을 찍도록 수정
 */
const CustomDatePicker = ({ value, onChange, events }) => {
  // 1. 'events' prop 받기
  const today = new Date();
  const [current, setCurrent] = useState(value ? new Date(value) : new Date());

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
    new Date(value).getMonth() === month;

  return (
    <div className="custom-datepicker">
      {/* 캘린더 헤더 (변경 없음) */}
      <div className="calendar-header">
        <button
          type="button"
          onClick={() => setCurrent(new Date(year, month - 1, 1))}
        >
          ‹
        </button>
        <span>
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={() => setCurrent(new Date(year, month + 1, 1))}
        >
          ›
        </button>
      </div>

      {/* 요일 헤더 (변경 없음) */}
      <div className="calendar-days">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="calendar-day-header">
            {d}
          </div>
        ))}

        {/* --- [수정됨] 날짜 + 이벤트 점 렌더링 --- */}
        {days.map((d, i) => {
          // 2. 그날짜(d)에 해당하는 이벤트 찾기
          const dStr = d ? formatDate(year, month, d) : null;
          const dayEv =
            dStr && events ? events.filter((e) => e.date === dStr) : [];

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
              {/* --- 3. 찾은 이벤트를 점으로 렌더링 --- */}
              {dayEv.length > 0 && (
                <div className="event-dots">
                  {dayEv.slice(0, 4).map((ev, i) => (
                    <span
                      key={i}
                      className="event-dot"
                      title={`${ev.category}: ${ev.text}`}
                      style={{ backgroundColor: ev.color }}
                    />
                  ))}
                </div>
              )}
              {/* ---------------------------------- */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* Date → YYYY-MM-DD (변경 없음) */
function formatYMD(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* 메인 Calendar 컴포넌트 */
export default function Calendar() {
  // --- [수정됨] user 상태 추가 (예시: null로 초기화) ---
  const [user, setUser] = useState(null);
  // ---------------------------------------------

  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ text: "", date: "", category: "" });
  const [closing, setClosing] = useState(false);

  /* 삭제 모달 상태 (변경 없음) */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  /* 카테고리 메타 (변경 없음) */
  const categoryMeta = {
    병원: { color: "#BFC8D7", icon: <FaClinicMedical /> },
    약: { color: "#E2D2D2", icon: <FaClinicMedical /> },
    쇼핑: { color: "#E3E2B4", icon: <FaShoppingCart /> },
    미용: { color: "#A2B59F", icon: <FaCut /> },
    생일: { color: "#E8E7D2", icon: <FaBirthdayCake /> },
    "산책/나들이": { color: "#C9BA9B", icon: <FaTree /> },
    기타: { color: "#D2D5B8", icon: <FaCircle /> },
  };

  const selectedDateStr = formatYMD(date);
  const dayEvents = events.filter((e) => e.date === selectedDateStr);

  /*
   * [삭제됨] tileContent 함수는 ReactCalendar 전용이므로 삭제합니다.
   * 이 기능은 CustomDatePicker 내부 로직으로 이동했습니다.
   */
  // const tileContent = ({ date: tileDate, view }) => { ... };

  /* 폼 관련 핸들러들 (변경 없음) */
  const openAddForm = () => {
    setEditingId(null);
    setForm({ text: "", date: selectedDateStr, category: "" });
    setShowForm(true);
  };

  const openEditForm = (ev) => {
    setEditingId(ev.id);
    setForm({ text: ev.text, date: ev.date, category: ev.category });
    setShowForm(true);
  };

  const closeForm = () => {
    setClosing(true);
    setTimeout(() => {
      setShowForm(false);
      setClosing(false);
      setEditingId(null);
      setForm({ text: "", date: "", category: "" });
    }, 250);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.text || !form.date || !form.category) {
      alert("일정 내용/날짜/카테고리를 모두 입력해주세요.");
      return;
    }

    const meta = categoryMeta[form.category] || categoryMeta["기타"];
    if (editingId) {
      setEvents((prev) =>
        prev.map((it) =>
          it.id === editingId
            ? {
                ...it,
                text: form.text,
                date: form.date,
                category: form.category,
                color: meta.color,
              }
            : it
        )
      );
    } else {
      const newEv = {
        id: Date.now(),
        text: form.text,
        date: form.date,
        category: form.category,
        color: meta.color,
      };
      setEvents((prev) => [...prev, newEv]);
    }
    closeForm();
  };

  /* 삭제 관련 핸들러들 (변경 없음) */
  const handleDeleteClick = (id) => {
    setRecordToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      setEvents((prev) => prev.filter((e) => e.id !== recordToDelete));
    }
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };

  return (
    <div className="calendar-page">
      {/* --- 네비게이션 --- */}
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <img src={logoBlue} className="paw" alt="logo" />
            <span className="brand-text">멍냥멍냥</span>
          </div>
          <nav className="menu">
            <a href="/activity">활동</a>
            <a href="/health" className="active">
              건강
            </a>
            <a href="/calendar">캘린더</a>
            <a href="/community">커뮤니티</a>
          </nav>
          <nav className="menulink">
            {user ? (
              <span className="welcome-msg">{user.nickname}님</span>
            ) : (
              <>
                <a href="/signup">회원가입</a>
                <a href="/signin">로그인</a>
              </>
            )}
          </nav>
        </div>
      </header>
      {/* --- [수정됨] 메인 캘린더 --- */}
      <main className="calendar-main">
        <div className="calendar-container">
          {/* 1. 기존의 버그난 ReactCalendar는 완전히 삭제합니다. */}
          {/* <ReactCalendar
                ...
              />
            */}

          {/* 2. '이벤트 점' 기능이 추가된 CustomDatePicker를 사용합니다. */}
          <CustomDatePicker
            value={formatYMD(date)} // Date 객체 -> "YYYY-MM-DD" 문자열
            onChange={(newDateStr) => {
              setDate(new Date(newDateStr)); // "YYYY-MM-DD" 문자열 -> Date 객체
            }}
            events={events} // 'events' state를 넘겨줘서 점을 찍도록 함
          />

          {/* --- [수정됨] 일정 표시 섹션 --- */}
          <section className="event-section">
            <h3>
              {date.getMonth() + 1}월 {date.getDate()}일 일정
            </h3>

            {/* [추가] 스크롤을 담당할 컨테이너 (개수에 따라 클래스 변경) */}
            <div
              className={
                dayEvents.length >= 5 ? "event-list-scrollable" : "event-list"
              }
            >
              {dayEvents.length ? (
                dayEvents.map((ev) => (
                  <div className="event-item" key={ev.id}>
                    <div
                      className="event-icon"
                      style={{ backgroundColor: ev.color }}
                    >
                      {categoryMeta[ev.category]?.icon || <FaCircle />}
                    </div>
                    <div className="event-content">
                      <strong>[{ev.category}]</strong> {ev.text}
                    </div>
                    <div
                      className="icon-btn-img"
                      style={{ display: "flex", gap: 8 }}
                    >
                      <button
                        className="icon-btn"
                        onClick={() => openEditForm(ev)}
                      >
                        <img className="icon-img" src={editIcon} alt="edit" />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => handleDeleteClick(ev.id)}
                      >
                        <img className="icon-img" src={trashIcon} alt="delete" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-event">등록된 일정이 없습니다.</p>
              )}
            </div>
            {/* [추가] 스크롤 컨테이너 끝 */}

            {/* + 버튼은 스크롤 컨테이너 밖에 위치 */}
            <button className="add-btn" onClick={openAddForm}></button>
          </section>
        </div>
      </main>

      {/* '추가/수정' 모달 (변경 없음) */}
      {showForm && (
        <div
          className={`modal-overlay ${closing ? "closing" : ""}`}
          onClick={closeForm}
        >
          <div
            className={`modal ${closing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingId ? "일정 수정" : "일정 추가"}</h2>
            <form onSubmit={handleSave}>
              <div className="modal-calendar-layout">
                <div className="modal-calendar-left">
                  <label className="date">날짜</label>
                  {/* 모달에서는 'events' prop을 안 넘겨주면 점이 안 찍힘 (정상) */}
                  <CustomDatePicker
                    value={form.date}
                    onChange={(newDate) => setForm({ ...form, date: newDate })}
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
                  <Select
                    classNamePrefix="react-select"
                    placeholder="선택하세요"
                    options={[
                      { value: "병원", label: "병원 / 약" },
                      { value: "쇼핑", label: "쇼핑" },
                      { value: "미용", label: "미용" },
                      { value: "생일", label: "생일" },
                      { value: "산책/나들이", label: "산책/나들이" },
                      { value: "기타", label: "기타" },
                    ]}
                    value={
                      form.category
                        ? { value: form.category, label: form.category }
                        : null
                    }
                    onChange={(option) =>
                      setForm({ ...form, category: option ? option.value : "" })
                    }
                  />
                </div>
              </div>

              <div className="form-buttons">
                <button type="submit" className="save">
                  저장
                </button>
                <button type="button" className="cancel" onClick={closeForm}>
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 모달 (변경 없음) */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div
            className="modal modal-delete-confirm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>정말 삭제하시겠습니까?</h2>
            <p className="delete-confirm-text">이 기록은 복구할 수 없습니다.</p>
            <div className="form-buttons">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancelDelete}
              >
                취소
              </button>
              <button
                type="button"
                className="btn-delete-confirm"
                onClick={handleConfirmDelete}
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
                <h3>Munjin Yang</h3>
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