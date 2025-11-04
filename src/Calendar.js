import React, { useState } from "react";
import {
  FaPlus,
  FaClinicMedical,
  FaShoppingCart,
  FaCut,
  FaBirthdayCake,
  FaTree,
  FaCircle,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Calendar.css";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

function formatYMD(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Calendar() {
  const [date, setDate] = useState(new Date());
  // 초기 이벤트 비워두거나 테스트 용으로 샘플 넣어도 됨
  const [events, setEvents] = useState([
    // 예시:
    // { id: 1, text: "심장사상충 약 먹는 날", date: "2025-10-15", category: "병원", color: "#e74c3c", iconKey: "병원" }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ text: "", date: "", category: "" });

  const categoryMeta = {
    병원: { color: "#e74c3c", icon: <FaClinicMedical /> },
    약: { color: "#e74c3c", icon: <FaClinicMedical /> },
    쇼핑: { color: "#9b59b6", icon: <FaShoppingCart /> },
    미용: { color: "#ff69b4", icon: <FaCut /> },
    생일: { color: "#f1c40f", icon: <FaBirthdayCake /> },
    "산책/나들이": { color: "#2ecc71", icon: <FaTree /> },
    기타: { color: "#7f8c8d", icon: <FaCircle /> },
  };

  const selectedDateStr = formatYMD(date);
  const dayEvents = events.filter((e) => e.date === selectedDateStr);

  // 캘린더의 각 날짜 아래에 동그라미 표시
  const tileContent = ({ date: tileDate, view }) => {
    if (view !== "month") return null;
    const dStr = formatYMD(tileDate);
    const dayEv = events.filter((e) => e.date === dStr);
    if (!dayEv.length) return null;
    return (
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
    );
  };

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
    setShowForm(false);
    setEditingId(null);
    setForm({ text: "", date: "", category: "" });
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
            ? { ...it, text: form.text, date: form.date, category: form.category, color: meta.color }
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

  const handleDelete = (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="calendar-page">
      {/* HEADER */}
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

      {/* MAIN */}
      <main className="calendar-main">
        <div className="calendar-container">
          <div className="calendar-box">
            <ReactCalendar
              onChange={setDate}
              value={date}
              locale="ko-KR"
              formatDay={(locale, d) => d.getDate().toString()}
              tileContent={tileContent}
              // calendarType prop은 환경에 따라 에러날 수 있음 -> CSS로 요일 순서 제어
            />
          </div>

          <section className="event-section">
            <h3>{date.getMonth() + 1}월 {date.getDate()}일 일정</h3>

            {dayEvents.length ? (
              dayEvents.map((ev) => (
                <div className="event-item" key={ev.id}>
                  <div className="event-icon" style={{ backgroundColor: ev.color }}>
                    {/* 아이콘은 카테고리별로 보여주기 */}
                    {categoryMeta[ev.category]?.icon || <FaCircle />}
                  </div>
                  <div className="event-content">
                    <strong>[{ev.category}]</strong> {ev.text}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="icon-btn" onClick={() => openEditForm(ev)} title="수정">
                      <img className="icon-img" src={editIcon} alt="" />
                    </button>
                    <button className="icon-btn" onClick={() => handleDelete(ev.id)} title="삭제">
                      <img className="icon-img" src={trashIcon} alt="" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-event">등록된 일정이 없습니다.</p>
            )}

            <button className="add-btn" onClick={openAddForm} title="일정 추가">
              <FaPlus />
            </button>
          </section>
        </div>
      </main>

      {/* 모달 (추가 / 수정) */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="calender-add">{editingId ? "일정 수정" : "일정 추가"}</h2>
            <form onSubmit={handleSave}>
              <label>일정 내용</label>
              <input
                type="text"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="예: 심장사상충 약 먹는 날"
              />

              <label>날짜</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />

              <label>카테고리</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">선택하세요</option>
                <option value="병원">병원 / 약</option>
                <option value="쇼핑">쇼핑</option>
                <option value="미용">미용</option>
                <option value="생일">생일</option>
                <option value="산책/나들이">산책/나들이</option>
                <option value="기타">기타</option>
              </select>

              <div className="form-buttons">
                <button type="button" onClick={closeForm}>취소</button>
                <button type="submit">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="logo-row">
            <div className="logo-stack">
              <img src={logoGray} alt="" className="paw-bg" aria-hidden />
              <span className="wordmark">KoJJOK</span>
            </div>

            <div className="grid">
              {[
                ["Hyeona Kim", "UI/UX Design", "ouskxk"],
                ["Jiun Ko", "Front-End Dev", "suerte223"],
                ["Seungbeom Han", "Front-End Dev", "hsb9838"],
                ["Munjin Yang", "Back-End Dev", "munjun0608"],
                ["Youngbin Kang", "Back-End Dev", "0bini"],
              ].map(([name, role, id]) => (
                <div className="col" key={id}>
                  <h3>{name}</h3>
                  <p>{role}</p>
                  <a href={`https://github.com/${id}`} className="github-link">
                    <img src={githubpic} alt="GitHub Logo" className="github-icon" />
                    {id}
                  </a>
                </div>
              ))}
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
