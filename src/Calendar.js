/* 라이브러리, 컴포넌트, 이미지, CSS import */
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
import Select from "react-select";
import "./Dashboard.css";
import "./Calendar.css";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

/* 📅 커스텀 달력 (모달 내부용) */
const CustomDatePicker = ({ value, onChange }) => {
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

  const formatDate = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const isToday = (d) =>
    d &&
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const isSelected = (d) =>
    value && new Date(value).getDate() === d && new Date(value).getMonth() === month;

  return (
    <div className="custom-datepicker">
      <div className="calendar-header">
        <button onClick={() => setCurrent(new Date(year, month - 1, 1))}>‹</button>
        <span>
          {year}년 {month + 1}월
        </span>
        <button onClick={() => setCurrent(new Date(year, month + 1, 1))}>›</button>
      </div>

      <div className="calendar-days">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="calendar-day-header">
            {d}
          </div>
        ))}

        {days.map((d, i) => (
          <div
            key={i}
            className={`calendar-date ${d ? "" : "empty"} ${isToday(d) ? "today" : ""} ${
              isSelected(d) ? "selected" : ""
            }`}
            onClick={() => {
              if (!d) return;
              onChange(formatDate(year, month, d));
            }}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
};

/* 📌 Date → YYYY-MM-DD */
function formatYMD(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* 📆 메인 Calendar 컴포넌트 */
export default function Calendar() {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ text: "", date: "", category: "" });
  const [closing, setClosing] = useState(false); // ✅ fade-out 제어

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

  /* 🔹 폼 관련 핸들러들 */
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
      {/* 상단 네비게이션 */}
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <img src={logoBlue} alt="paw logo" className="paw" />
            <span className="brand-text">멍냥멍냥</span>
          </div>
          <nav className="menu">
            <a href="/activity">활동</a>
            <a href="/health">건강</a>
            <a href="/calendar" className="active">
              캘린더
            </a>
            <a href="/community">커뮤니티</a>
          </nav>
          <nav className="menulink">
            <a href="/signup">회원가입</a>
            <a href="/signin">로그인</a>
          </nav>
        </div>
      </header>

      {/* 메인 캘린더 */}
      <main className="calendar-main">
        <div className="calendar-container">
          <ReactCalendar
            onChange={setDate}
            value={date}
            locale="ko-KR"
            formatDay={(locale, d) => d.getDate().toString()}
            tileContent={tileContent}
            next2Label={null}
            prev2Label={null}
          />
          <section className="event-section">
            <h3>
              {date.getMonth() + 1}월 {date.getDate()}일 일정
            </h3>
            {dayEvents.length ? (
              dayEvents.map((ev) => (
                <div className="event-item" key={ev.id}>
                  <div className="event-icon" style={{ backgroundColor: ev.color }}>
                    {categoryMeta[ev.category]?.icon || <FaCircle />}
                  </div>
                  <div className="event-content">
                    <strong>[{ev.category}]</strong> {ev.text}
                  </div>
                  <div className="icon-btn-img" style={{ display: "flex", gap: 8 }}>
                    <button className="icon-btn" onClick={() => openEditForm(ev)}>
                      <img className="icon-img" src={editIcon} alt="edit" />
                    </button>
                    <button className="icon-btn" onClick={() => handleDelete(ev.id)}>
                      <img className="icon-img" src={trashIcon} alt="delete" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-event">등록된 일정이 없습니다.</p>
            )}
            <button className="add-btn" onClick={openAddForm}>
              <FaPlus />
            </button>
          </section>
        </div>
      </main>

      {/* 모달 */}
      {showForm && (
        <div className={`modal-overlay ${closing ? "closing" : ""}`}>
          <div className={`modal ${closing ? "closing" : ""}`}>
            <h2>{editingId ? "일정 수정" : "일정 추가"}</h2>
            <form onSubmit={handleSave}>
              <div className="modal-left">
                <CustomDatePicker
                  value={form.date}
                  onChange={(newDate) => setForm({ ...form, date: newDate })}
                />
              </div>

              <div className="modal-right">
                <label>일정 내용</label>
                <input
                  type="text"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  placeholder="예: 심장사상충 약 먹는 날"
                />

                <label>카테고리</label>
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
                    form.category ? { value: form.category, label: form.category } : null
                  }
                  onChange={(option) =>
                    setForm({ ...form, category: option ? option.value : "" })
                  }
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      fontSize: "16px",
                      borderRadius: "10px",
                      borderColor: state.isFocused ? "#4b7bec" : "#d3d3d3",
                      boxShadow: state.isFocused
                        ? "0 0 5px rgba(75, 123, 236, 0.3)"
                        : "none",
                      minHeight: "48px",
                      letterSpacing: "0.5px",
                      lineHeight: "1.6",
                      paddingLeft: "6px",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      fontSize: "16px",
                      color: "#999",
                      letterSpacing: "0.5px",
                      lineHeight: "1.6",
                      paddingLeft: "2px",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      fontSize: "16px",
                      color: "#333",
                      letterSpacing: "0.5px",
                      lineHeight: "1.6",
                    }),
                  }}
                />
=======
              <label class="date">일정 내용</label>
              <input
                type="text"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="예: 심장사상충 약 먹는 날"
              />
              
              <label class="date">날짜</label>
              <CustomDatePicker
                value={form.date}
                onChange={(newDate) => setForm({ ...form, date: newDate })}
              />
              
              <label class="date">카테고리</label>
              <Select
                placeholder="선택하세요"
                options={[
                  { value: "병원", label: "병원 / 약" },
                  { value: "쇼핑", label: "쇼핑" },
                  { value: "미용", label: "미용" },
                  { value: "생일", label: "생일" },
                  { value: "산책/나들이", label: "산책/나들이" },
                  { value: "기타", label: "기타" },
                ]}
                value={form.category ? { value: form.category, label: form.category } : null}
                onChange={(option) => setForm({ ...form, category: option ? option.value : "" })}
              />
                <div className="form-buttons">
                  <button type="button" onClick={closeForm}>
                    취소
                  </button>
                  <button type="submit">저장</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="logo-row">
            <div className="logo-stack">
              <img src={logoGray} alt="" className="paw-bg" />
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
