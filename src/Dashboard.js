import React, { useMemo, useState } from "react";
import "./Dashboard.css";
import "./Activity.css";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";
import trashIcon from "./img/Trash_2.png";
import bell from "./img/bell.png";
import chat from "./img/chat.png";
import circle from "./img/circle.png";
import plusicon from "./img/plusicon.png";

export default function Dashboard() {
  // 오늘 날짜
  const todayStr = useMemo(() => {
    const d = new Date();
    const week = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${week}요일`;
  }, []);

  const [showBellPopup, setShowBellPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);

  // 할 일
  const [tasks, setTasks] = useState([
    { id: 1, text: "산책하기", done: true },
    { id: 2, text: "밥주기", done: false },
    { id: 3, text: "양치시키기", done: false },
    { id: 4, text: "물주기", done: false },
  ]);
  const [newTask, setNewTask] = useState("");

  const progress = useMemo(() => {
    const total = tasks.length || 1;
    const done = tasks.filter((t) => t.done).length;
    return Math.round((done / total) * 100);
  }, [tasks]);

  const toggleTask = (id) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const removeTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const addTask = () => {
    const text = newTask.trim();
    if (!text) return;
    setTasks((prev) => [...prev, { id: prev.at(-1)?.id + 1 || 1, text, done: false }]);
    setNewTask("");
  };

  return (
    <div className="app">
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
            <a href="/calendar">캘린더</a>
            <a href="/community">커뮤니티</a>
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

      {/* 본문 */}
      <main className="main">
        {/* 인트로 */}
        <section className="section section--intro">
          <h1 className="title">오늘의 대시보드</h1>
          <p className="date">{todayStr}</p>
        </section>

        {/* 케어 리스트 */}
        <section className="section">
          <h2 className="section__title">
            <span className="section__bullet section__bullet--blue" />
            오늘의 케어 리스트
          </h2>

          <div className="card card--todo">
            <div className="todolist">오늘 할 일</div>
            <div className="progress">
              <div className="progress__bar" style={{ width: `${progress}%` }} />
            </div>

            <ul className="todo">
              {tasks.map((t) => (
                <li key={t.id} className="todo__item">
                  <label className="todo__label">
                    <input
                      type="checkbox"
                      className="todo__checkbox"
                      checked={t.done}
                      onChange={() => toggleTask(t.id)}
                    />
                    <span className={`todo__text ${t.done ? "is-done" : ""}`}>
                      {t.text}
                    </span>
                  </label>
                  <button
                    className="icon-btn"
                    onClick={() => removeTask(t.id)}
                    aria-label="삭제"
                    title="삭제"
                  >
                    {/* ✅ 수정: hover 효과 적용을 위해 icon-img 클래스 추가 */}
                    <img src={trashIcon} alt="삭제 아이콘" className="icon-img" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="todo__add">
              <input
                className="todo__input"
                placeholder="오늘 할 일 입력해주세요."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <button className="todo__addbtn" onClick={addTask} aria-label="추가">
                <img src={circle} alt="" className="circle" aria-hidden />
                <img src={plusicon} alt="추가" className="plus" />
              </button>
            </div>
          </div>
        </section>

        {/* 다가오는 일정 & 건강 추세 */}
        <section className="section">
          <h2 className="section__title">
            <span className="section__bullet section__bullet--blue" />
            다가오는 일정 & 건강 추세
          </h2>

          {/* 2열 그리드 */}
          <div className="section--grid">
            {/* 좌측: 일정 리스트 */}
            <div className="card card--event">
              <div className="event">
                <span className="event__icon event__icon--cart" />
                <div className="event__body">
                  <div className="event__title">사료 세일</div>
                  <div className="event__date">10월 5일</div>
                </div>
                <div className="event__badge event__badge--soft">3일 남음</div>
              </div>

              <div className="event">
                <span className="event__icon event__icon--steth" />
                <div className="event__body">
                  <div className="event__title">정기 검진일</div>
                  <div className="event__date">10월 7일</div>
                </div>
                <div className="event__badge event__badge--danger">5일 남음</div>
              </div>
            </div>

            {/* 우측: 차트 */}
            <div className="card card--chart">
              <div className="chart__header">
                <span className="chart__caption">
                  최근 1개월간 <b className="text--green">0.1kg 증가</b>했어요.
                </span>
              </div>
              <div className="dashboard">
                <div className="chart">
                  <div className="chart__grid" />
                  <svg
                    viewBox="0 0 100 60"
                    preserveAspectRatio="none"
                    className="chart__svg"
                    aria-hidden
                  >
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor="#3b82f6" />
                        <stop offset="1" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M5,45 C20,30 35,40 50,28 C65,18 80,26 95,20"
                      fill="none"
                      stroke="url(#lineGrad)"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    <circle cx="95" cy="20" r="1.8" fill="#3b82f6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 음식 가이드 */}
        <section className="section">
          <h2 className="section__title">
            <span className="section__bullet section__bullet--blue" />
            음식 가이드
          </h2>

          <div className="food-guide">
            <div className="food-group">
              <h3 className="food-group__title food-group__title--ok">먹어도 괜찮아요!</h3>
              <div className="food-grid">
                <div className="food-card food-card--ok">
                  <div className="food-card__name">당근, 고구마, 브로콜리</div>
                  <div className="food-card__note">익혀서 적당 소량 급여</div>
                  <span className="badge badge--ok">권장</span>
                </div>
                <div className="food-card food-card--ok">
                  <div className="food-card__name">사과, 배, 바나나</div>
                  <div className="food-card__note">씨 제거 후 급여</div>
                  <span className="badge badge--ok">권장</span>
                </div>
              </div>
            </div>

            <div className="food-group">
              <h3 className="food-group__title food-group__title--no">절대 주면 안돼요!</h3>
              <div className="food-grid">
                <div className="food-card food-card--no">
                  <div className="food-card__name">초콜릿</div>
                  <div className="food-card__note">테오브로민 독성</div>
                  <span className="badge badge--no">금지</span>
                </div>
                <div className="food-card food-card--no">
                  <div className="food-card__name">양파, 마늘, 파</div>
                  <div className="food-card__note">적혈구 손상 위험</div>
                  <span className="badge badge--no">금지</span>
                </div>
              </div>
            </div>
          </div>
        </section>
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
