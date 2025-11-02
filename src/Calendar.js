import React, { useState } from "react";
import {
  FaPlus,
  FaClinicMedical,
  FaShoppingCart,
  FaCut,
  FaBirthdayCake,
  FaTree,
  FaCircle,
} from "react-icons/fa";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Calendar.css";

/* 이미지 import */
import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

const categoryDetails = {
  hospital: { icon: <FaClinicMedical />, text: "[병원/약]" },
  shopping: { icon: <FaShoppingCart />, text: "[쇼핑]" },
  grooming: { icon: <FaCut />, text: "[미용]" },
  birthday: { icon: <FaBirthdayCake />, text: "[생일]" },
  walk: { icon: <FaTree />, text: "[산책/나들이]" },
  other: { icon: <FaCircle />, text: "[기타]" },
};

// 날짜 포맷 함수
function formatDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function Calendar() {
  const [date, setDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [newItemText, setNewItemText] = useState("");
  const [newItemDate, setNewItemDate] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [editingId, setEditingId] = useState(null);

  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  const handleAddClick = () => {
    setEditingId(null);
    setNewItemText("");
    setNewItemDate(formatDate(date));
    setNewItemCategory("");
    setShowModal(true);
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setNewItemText(item.text);
    setNewItemDate(item.date);
    setNewItemCategory(item.category);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewItemText("");
    setNewItemDate("");
    setNewItemCategory("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setSchedules((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, text: newItemText, date: newItemDate, category: newItemCategory }
            : item
        )
      );
    } else {
      const newItem = {
        id: Date.now(),
        text: newItemText,
        date: newItemDate,
        category: newItemCategory,
      };
      setSchedules((prev) => [...prev, newItem]);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      setSchedules((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // 일정 점 표시
  const renderEventDot = ({ date, view }) => {
    if (view === "month") {
      const dateStr = formatDate(date);
      const events = schedules.filter((s) => s.date === dateStr);
      if (events.length > 0) {
        return (
          <div className="dot-container">
            {events.map((e, idx) => (
              <div key={idx} className={`event-dot ${e.category}`}></div>
            ))}
          </div>
        );
      }
    }
    return null;
  };

  const selectedDateStr = formatDate(date);
  const filteredSchedules = schedules.filter((s) => s.date === selectedDateStr);

  return (
    <div className="calendar-page">
      {/* 헤더 */}
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <img src={logoBlue} alt="paw logo" className="paw" />
            <span className="brand-text">멍냥멍냥</span>
          </div>
          <nav className="menu">
            <a href="/activity">활동</a>
            <a href="/health">건강</a>
            <a href="/calendar" className="active">캘린더</a>
            <a href="/community">커뮤니티</a>
          </nav>
          <nav className="menulink">
            <a href="/signup">회원가입</a>
            <a href="/signin">로그인</a>
          </nav>
        </div>
      </header>

      {/* 본문 */}
      <main className="calendar-main">
        <div className="calendarBox">
          <ReactCalendar
            onChange={setDate}
            value={date}
            locale="ko-KR"
            formatDay={(locale, date) => date.getDate().toString()}
            tileContent={renderEventDot}
            formatShortWeekday={(locale, date) => dayLabels[date.getDay()]}
          />
          <button className="walk-fab" onClick={handleAddClick}>
            <FaPlus className="walk-fab-plus" />
          </button>
        </div>

        {filteredSchedules.length > 0 ? (
          filteredSchedules.map((item) => (
            <div className="scheduleItem" key={item.id}>
              <div className={`iconCircle category-${item.category || "other"}`}>
                {categoryDetails[item.category]?.icon || <FaCircle />}
              </div>
              <div className="scheduleContent">
                <div className="scheduleType">
                  {categoryDetails[item.category]?.text || "[기타]"}
                </div>
                <div className="scheduleText">{item.text}</div>
                <div className="scheduleDateDisplay">{item.date}</div>
              </div>
              <div className="scheduleActions">
                <button className="icon-btn edit" onClick={() => handleEditClick(item)}>
                  <img src={editIcon} alt="edit" className="icon-img" />
                </button>
                <button className="icon-btn delete" onClick={() => handleDelete(item.id)}>
                  <img src={trashIcon} alt="delete" className="icon-img" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="schedule-empty">선택한 날짜에 일정이 없습니다.</div>
        )}
      </main>

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
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" />
                  ouskxk
                </a>
              </div>
              <div className="col">
                <h3>Jiun Ko</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/suerte223" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" />
                  suerte223
                </a>
              </div>
              <div className="col">
                <h3>Seungbeom Han</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/hsb9838" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" />
                  hsb9838
                </a>
              </div>
              <div className="col">
                <h3>Munjin Yang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/munjun0608" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" />
                  munjun0608
                </a>
              </div>
              <div className="col">
                <h3>Youngbin Kang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/0bini" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" />
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
