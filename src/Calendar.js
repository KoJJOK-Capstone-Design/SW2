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

import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Select from "react-select";
import "./Calendar.css";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

/* 모달 내에서 사용할 커스텀 날짜 선택기(Date Picker) 컴포넌트 */
const CustomDatePicker = ({ value, onChange }) => {
  const today = new Date();
  /* 현재 표시 중인 월 상태 */
  const [current, setCurrent] = useState(
    value ? new Date(value) : new Date()
  );

  const year = current.getFullYear();
  const month = current.getMonth();

  /* 현재 월의 시작/끝 날짜 및 요일 계산 */
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const startDay = start.getDay();
  const totalDays = end.getDate();

  /* 달력 그리드를 위한 날짜 배열 생성 (앞쪽 빈 칸은 null) */
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  /* 날짜를 'YYYY-MM-DD' 문자열로 변환하는 헬퍼 함수 */
  const formatDate = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  /* '오늘' 날짜인지 확인하는 헬퍼 함수 */
  const isToday = (d) =>
    d &&
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  /* '선택된 날'인지 확인하는 헬퍼 함수 */
  const isSelected = (d) =>
    value && new Date(value).getDate() === d && new Date(value).getMonth() === month;

  /* 커스텀 달력 UI 렌더링 (헤더, 요일, 날짜) */
  return (
    <div className="custom-datepicker">
      <div className="calendar-header">
        {/* 이전 월 이동 버튼 */}
        <button onClick={() => setCurrent(new Date(year, month - 1, 1))}>‹</button>
        <span>{year}년 {month + 1}월</span>
        {/* 다음 월 이동 버튼 */}
        <button onClick={() => setCurrent(new Date(year, month + 1, 1))}>›</button>
      </div>

            <div className="calendar-days">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}

        {days.map((d, i) => (
          <div
            key={i}
            className={`calendar-date ${
              d ? "" : "empty"
            } ${isToday(d) ? "today" : ""} ${
              isSelected(d) ? "selected" : ""
            }`}
            /* 날짜 클릭 시 부모 컴포넌트의 onChange 함수 호출 */
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

/* Date 객체 또는 날짜 문자열을 YYYY-MM-DD 형식으로 변환 */
function formatYMD(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* 캘린더 페이지 메인 컴포넌트 */
export default function Calendar() {
  /* 컴포넌트의 주요 상태 변수들 (선택 날짜, 일정 목록, 모달 상태 등) */
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ text: "", date: "", category: "" });

  /* 카테고리별 색상 및 아이콘 메타데이터 정의 */
  const categoryMeta = {
    병원: { color: "#BFC8D7", icon: <FaClinicMedical /> },
    약: { color: "#E2D2D2", icon: <FaClinicMedical /> },
    쇼핑: { color: "#E3E2B4", icon: <FaShoppingCart /> },
    미용: { color: "#A2B59F", icon: <FaCut /> },
    생일: { color: "#E8E7D2", icon: <FaBirthdayCake /> },
    "산책/나들이": { color: "#C9BA9B", icon: <FaTree /> },
    기타: { color: "#D2D5B8", icon: <FaCircle /> },
  };

  /* 선택된 날짜 문자열(YYYY-MM-DD) 및 해당 날짜의 일정 목록 필터링 */
  const selectedDateStr = formatYMD(date);
  const dayEvents = events.filter((e) => e.date === selectedDateStr);

  /* react-calendar에 일정이 있는 날짜에 점을 표시하기 위한 함수 */
  const tileContent = ({ date: tileDate, view }) => {
    if (view !== "month") return null;
    const dStr = formatYMD(tileDate);
    const dayEv = events.filter((e) => e.date === dStr);
    if (!dayEv.length) return null;
    /* 최대 4개의 점 표시 */
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

  /* '일정 추가' 모달을 여는 함수 (폼 초기화) */
  const openAddForm = () => {
    setEditingId(null);
    setForm({ text: "", date: selectedDateStr, category: "" });
    setShowForm(true);
  };

  /* '일정 수정' 모달을 여는 함수 (기존 데이터로 폼 채우기) */
  const openEditForm = (ev) => {
    setEditingId(ev.id);
    setForm({ text: ev.text, date: ev.date, category: ev.category });
    setShowForm(true);
  };

  /* 모달을 닫고 폼 상태를 초기화하는 함수 */
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ text: "", date: "", category: "" });
  };

  /* '저장' 버튼 클릭 시, 새 일정 추가 또는 기존 일정 수정 처리 */
  const handleSave = (e) => {
    e.preventDefault();
    /* 기본 유효성 검사 */
    if (!form.text || !form.date || !form.category) {
      alert("일정 내용/날짜/카테고리를 모두 입력해주세요.");
      return;
    }

    const meta = categoryMeta[form.category] || categoryMeta["기타"];
    
    /* 수정 모드일 때 */
    if (editingId) {
      setEvents((prev) =>
        prev.map((it) =>
          it.id === editingId
            ? { ...it, text: form.text, date: form.date, category: form.category, color: meta.color }
            : it
        )
      );
    } else {
      /* 추가 모드일 때 */
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

  /* '삭제' 버튼 클릭 시, 확인 창 후 일정 삭제 처리 */
  const handleDelete = (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  /* 전체 캘린더 페이지 UI 렌더링 */
  return (
    <div className="calendar-page">
      {/* 상단 네비게이션 바 */}
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

      {/* 메인 컨텐츠 영역 */}
      <main className="calendar-main">
        <div className="calendar-container">
          <div className="calendar-box">
            {/* react-calendar 라이브러리 컴포넌트 렌더링 */}
            <ReactCalendar
              onChange={setDate}
              value={date}
              locale="ko-KR"      // ← 핵심: 미국식 (일요일 시작)
              formatDay={(locale, d) => d.getDate().toString()}
              tileContent={tileContent}
              next2Label={null}
              prev2Label={null}
            />
          </div>

          {/* 선택된 날짜의 일정 목록을 표시하는 섹션 */}
          <section className="event-section">
            <h3>{date.getMonth() + 1}월 {date.getDate()}일 일정</h3>

            {/* 일정이 있을 때와 없을 때 분기 처리 */}
            {dayEvents.length ? (
              /* 해당 날짜의 일정 목록을 순회하며 UI 생성 */
              dayEvents.map((ev) => (
                <div className="event-item" key={ev.id}>
                  <div className="event-icon" style={{ backgroundColor: ev.color }}>
                    {categoryMeta[ev.category]?.icon || <FaCircle />}
                  </div>
                  <div className="event-content">
                    <strong>[{ev.category}]</strong> {ev.text}
                  </div>
                  {/* 수정 및 삭제 버튼 */}
                  <div class="icon-btn-img" style={{ display: "flex", gap: 8 }}>
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

            {/* 일정 추가 버튼 (+) */}
            <button className="add-btn" onClick={openAddForm}>
              <FaPlus />
            </button>
          </section>
        </div>
      </main>

      {/* 일정 추가/수정 모달 (showForm이 true일 때만 렌더링) */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "일정 수정" : "일정 추가"}</h2>
            <form onSubmit={handleSave}>
              <label>일정 내용</label>
              <input
                type="text"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="예: 심장사상충 약 먹는 날"
              />

              <label>날짜</label>
              {/* 모달 내에서 날짜 선택을 위해 커스텀 데이트 피커 사용 */}
              <CustomDatePicker
                value={form.date}
                onChange={(newDate) => setForm({ ...form, date: newDate })}
              />

              <label>카테고리</label>
              {/* 카테고리 선택을 위한 react-select 라이브러리 사용 */}
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
                styles={{
                  /* react-select 커스텀 스타일 */
                  control: (base, state) => ({
                    ...base,
                    borderRadius: "10px",
                    borderColor: state.isFocused ? "#3d7eff" : "#ccc",
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(61, 126, 255, 0.1)"
                      : "none",
                    "&:hover": { borderColor: "#3d7eff" },
                    fontSize: "1rem",
                  }),
                }}
              />

              {/* 모달 내 '취소', '저장' 버튼 */}
              <div className="form-buttons">
                <button type="button" onClick={closeForm}>취소</button>
                <button type="submit">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 하단 푸터 영역 */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="logo-row">
            <div className="logo-stack">
              <img src={logoGray} alt="" className="paw-bg" />
              <span className="wordmark">KoJJOK</span>
            </div>

            {/* 팀원 정보 */}
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

            {/* 기술 스택 정보 */}
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