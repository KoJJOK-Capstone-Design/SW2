import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import "./Dashboard.css";
import "./Activity.css";
import "./Health.css";

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

// ================== Local Storage 캘린더 관련 상수 및 함수 ==================
const CALENDAR_STORAGE_KEY = 'calendarEvents'; // Calendar.jsx와 동일한 키

/**
 * 날짜 문자열을 받아 오늘로부터의 D-day를 계산합니다.
 * @param {string} dateStr 'YYYY-MM-DD' 형식의 날짜
 * @returns {number} 오늘(0), 내일(1), 어제(-1) 등
 */
const getDDay = (dateStr) => {
  if (!dateStr) return 9999; // 유효하지 않은 날짜는 뒤로 보냄

  const today = new Date();
  // 시간 정보를 초기화하여 정확한 날짜 차이만 계산
  today.setHours(0, 0, 0, 0);

  const scheduleDate = new Date(dateStr);
  scheduleDate.setHours(0, 0, 0, 0);

  const diffTime = scheduleDate.getTime() - today.getTime();
  // Math.round를 사용하여 시간대 차이로 인한 반올림 오류 방지
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
};
// =======================================================================


export default function Dashboard() {
  // ================== 오늘 날짜 ==================
  const todayStr = useMemo(() => {
    const d = new Date();
    const week = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${week}요일`;
  }, []);

  // ================== 헤더 - 로그인 유저 이름 ==================
  const [username, setUsername] = useState("멍냥");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("토큰이 없습니다. 비로그인 상태일 수 있어요.");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await axios.get(
          "https://youngbin.pythonanywhere.com/api/v1/users/profile/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const name =
          res.data?.nickname ||
          res.data?.username ||
          res.data?.id ||
          "멍냥";

        setUsername(name);
      } catch (err) {
        console.error(
          "유저 정보 불러오기 실패:",
          err.response?.data || err.message
        );
      }
    };

    fetchUser();
  }, []);

  // ================== 팝업 상태 ==================
  const [showBellPopup, setShowBellPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);

  // ================== 대시보드 데이터 상태 ==================
  // 할 일 목록 (백엔드 care_list.items -> tasks 로 매핑)
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  // 다가오는 일정 (Local Storage 일정 포함)
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);

  // 건강 추세
  const [healthTrend, setHealthTrend] = useState(null);

  // 음식 가이드
  const [foodGuide, setFoodGuide] = useState({
    good_foods: [],
    bad_foods: [],
  });

  // 로딩 / 에러 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================== 진행률 ==================
  const progress = useMemo(() => {
    const total = tasks.length || 1;
    const done = tasks.filter((t) => t.done).length;
    return Math.round((done / total) * 100);
  }, [tasks]);

  // 체크박스 토글 (프론트에서만 동작, 아직 백엔드 동기화 없음)
  const toggleTask = (id) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const removeTask = (id) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  const addTask = () => {
    const text = newTask.trim();
    if (!text) return;
    setTasks((prev) => [
      ...prev,
      { id: prev.at(-1)?.id + 1 || 1, text, done: false },
    ]);
    setNewTask("");
  };

  // ================== 체중 그래프 path 계산 ==================
  const chartPath = useMemo(() => {
    if (!healthTrend?.graph_data || healthTrend.graph_data.length === 0) {
      // 데이터 없으면 가로선 표시
      return "M5,45 L95,45";
    }

    const data = healthTrend.graph_data;
    const weights = data.map((d) => d.weight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const range = maxW - minW || 1;

    return data
      .map((d, i) => {
        const x =
          data.length === 1 ? 50 : 5 + (90 * i) / (data.length - 1);
        const norm = (d.weight - minW) / range;
        const y = 50 - norm * 40; // 10~50 사이
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }, [healthTrend]);

  // ================== D-day 표시 ==================
  const getDDayLabel = (d) => {
    if (d === 0) return "오늘";
    if (d === 1) return "D-1";
    if (d > 1) return `D-${d}`;
    return "지남";
  };

  const getDDayClass = (d) => {
    if (d <= 1) return "event__badge event__badge--danger";
    if (d <= 3) return "event__badge event__badge--soft";
    return "event__badge";
  };

  // ================== 대시보드 API 호출 및 로컬 스케줄 병합 ==================
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const petId = localStorage.getItem("pet_id");

        if (!token) {
          setError("로그인이 필요합니다. 먼저 로그인 후 다시 시도해 주세요.");
          setLoading(false);
          return;
        }

        if (!petId) {
          setError("반려동물 정보를 찾을 수 없습니다. 펫 등록 후 이용해 주세요.");
          setLoading(false);
          return;
        }

        // 1. 로컬 캘린더 일정 불러오기 및 가공
        let combinedSchedules = [];
        try {
            const savedEvents = localStorage.getItem(CALENDAR_STORAGE_KEY);
            if (savedEvents) {
                const events = JSON.parse(savedEvents);
                const todayDDay = getDDay(new Date().toISOString().slice(0, 10)); // 오늘 D-day (0)

                const localSchedules = events
                    .map(event => ({
                        // 로컬 일정 ID 충돌 방지를 위해 접두사 추가
                        id: `local-${event.id}`, 
                        content: `[${event.category}] ${event.text}`,
                        schedule_date: event.date,
                        d_day: getDDay(event.date), // D-day 계산
                    }))
                    .filter(schedule => schedule.d_day >= todayDDay); // 오늘 또는 미래 일정만 포함

                combinedSchedules = localSchedules;
            }
        } catch (localErr) {
            console.error("Local Calendar events load error:", localErr);
        }

        const url = `https://youngbin.pythonanywhere.com/api/v1/pets/dashboard/${petId}/`;

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`, // SimpleJWT
          },
        });

        const data = res.data;
        console.log("📌 대시보드 응답:", data);

        // care_list → tasks로 세팅
        if (data.care_list && Array.isArray(data.care_list.items)) {
          setTasks(
            data.care_list.items.map((item) => ({
              id: item.id,
              text: item.content,
              done: !!item.is_complete,
            }))
          );
        }

        // 2. API 일정 불러와 로컬 일정과 병합 및 정렬
        if (Array.isArray(data.upcoming_schedules)) {
            // API 일정에도 충돌 방지 접두사 추가 (선택 사항이지만 안전함)
            const apiSchedules = data.upcoming_schedules.map(s => ({
                ...s,
                id: `api-${s.id}` 
            }));
            
            // API 일정 병합
            combinedSchedules = [...combinedSchedules, ...apiSchedules];
        }

        // d_day 기준으로 정렬 (가장 가까운 일정부터)
        combinedSchedules.sort((a, b) => a.d_day - b.d_day);
        
        // 최종적으로 upcomingSchedules 상태 업데이트
        setUpcomingSchedules(combinedSchedules);

        // health_trend
        if (data.health_trend) {
          setHealthTrend(data.health_trend);
        }

        // food_guide
        if (data.food_guide) {
          setFoodGuide({
            good_foods: data.food_guide.good_foods || [],
            bad_foods: data.food_guide.bad_foods || [],
          });
        }
      } catch (err) {
        console.error(
          "🚨 대시보드 에러:",
          err.response?.status,
          err.response?.data
        );

        if (err.response?.status === 401) {
          setError("로그인 정보가 만료되었어요. 다시 로그인 후 이용해 주세요.");
        } else if (err.response?.status === 404) {
          setError("대시보드 데이터를 찾을 수 없어요. (404)");
        } else {
          setError("대시보드 데이터를 불러오지 못했어요.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // ================== 로딩 / 에러 화면 ==================
  if (loading) {
    return <div className="app">대시보드 불러오는 중...</div>;
  }

  if (error) {
    return <div className="app">에러: {error}</div>;
  }

  // ================== 실제 화면 렌더 ==================
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
            {/* 🔹 프로필 영역 */}
            <Link to="/mypage" className="profile">
              <div className="profile__avatar">
                <img
                  src="https://i.pravatar.cc/80?img=11"
                  alt="프로필"
                />
              </div>
              <span className="profile__name">{username}</span>
            </Link>

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

            <div className="icon-wrapper">
              <button
                className="icon-btn"
                onClick={() => {
                  setShowChatPopup((v) => !v);
                  setShowBellPopup(false);
                }}
              >
                <a href="/Chat">
                  <img src={chat} alt="채팅 아이콘" className="icon" />
                </a>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* 본문 이하 그대로 */}
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
              <div
                className="progress__bar"
                style={{ width: `${progress}%` }}
              />
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
                    <span
                      className={`todo__text ${t.done ? "is-done" : ""}`}
                    >
                      {t.text}
                    </span>
                  </label>
                  <button
                    className="icon-btn"
                    onClick={() => removeTask(t.id)}
                    aria-label="삭제"
                    title="삭제"
                  >
                    <img
                      src={trashIcon}
                      alt="삭제 아이콘"
                      className="icon-img"
                    />
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
              <button
                className="todo__addbtn"
                onClick={addTask}
                aria-label="추가"
              >
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
              {upcomingSchedules.length === 0 ? (
                <p className="event__empty">등록된 일정이 없어요.</p>
              ) : (
                upcomingSchedules.map((s) => (
                  <div key={s.id} className="event">
                    <span className="event__icon event__icon--steth" />
                    <div className="event__body">
                      {/* Local Storage 이벤트는 [카테고리] 접두사가 이미 붙어있습니다. */}
                      <div className="event__title">{s.content}</div>
                      <div className="event__date">{s.schedule_date}</div>
                    </div>
                    <div className={getDDayClass(s.d_day)}>
                      {getDDayLabel(s.d_day)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 우측: 차트 */}
            <div className="card card--chart">
              <div className="chart__header">
                <span className="chart__caption">
                  최근 1개월간{" "}
                  <b className="text--green">
                    {healthTrend?.recent_change || "변동 없음"}
                  </b>
                  했어요.
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
                      <linearGradient
                        id="lineGrad"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0" stopColor="#3b82f6" />
                        <stop offset="1" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>
                    <path
                      d={chartPath}
                      fill="none"
                      stroke="url(#lineGrad)"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
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
              <h3 className="food-group__title food-group__title--ok">
                먹어도 괜찮아요!
              </h3>
              <div className="food-grid">
                {foodGuide.good_foods.length === 0 ? (
                  <p className="food-empty">등록된 추천 음식이 없어요.</p>
                ) : (
                  foodGuide.good_foods.map((f) => (
                    <div key={f.id} className="food-card food-card--ok">
                      <div className="food-card__name">{f.name}</div>
                      <div className="food-card__note">
                        {f.description}
                      </div>
                      <span className="badge badge--ok">권장</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="food-group">
              <h3 className="food-group__title food-group__title--no">
                절대 주면 안돼요!
              </h3>
              <div className="food-grid">
                {foodGuide.bad_foods.length === 0 ? (
                  <p className="food-empty">등록된 주의 음식이 없어요.</p>
                ) : (
                  foodGuide.bad_foods.map((f) => (
                    <div key={f.id} className="food-card food-card--no">
                      <div className="food-card__name">{f.name}</div>
                      <div className="food-card__note">
                        {f.description}
                      </div>
                      <span className="badge badge--no">금지</span>
                    </div>
                  ))
                )}
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