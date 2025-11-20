import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
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

// ✅ Chart.js - 라인 그래프용
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Chart.js에 필요한 모듈 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// ================== Custom Hook: Local Storage 상태 관리 ==================
/**
 * LocalStorage에 값을 저장하고 불러오는 useState 대체 훅
 * @param {string} key LocalStorage에 저장할 키
 * @param {any} initialValue 초기 값
 * @returns {[any, (value: any) => void]} [상태, 상태 설정 함수]
 */
function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue) {
        return JSON.parse(storedValue);
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

// 알림 관련 헬퍼 함수들
const getTimeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  if (Number.isNaN(past.getTime())) return dateString;

  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}초 전`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}분 전`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  } else if (diffInSeconds < 2592000) {
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  }
  return past.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const cleanAlertText = (message) => {
  if (!message) return "새 알림";
  const match = message.match(/^'[^']+'님으로부터 (.*)/);
  if (match && match.length > 1) {
    return match[1].trim();
  }
  const matchNoQuote = message.match(/^([^']+)님으로부터 (.*)/);
  if (matchNoQuote && matchNoQuote.length > 2) {
    return matchNoQuote[2].trim();
  }
  return message;
};

const extractNickname = (message) => {
  let match = message.match(/'([^']+)'님으로부터/);
  if (match) return match[1];
  match = message.match(/^([^']+)님으로부터/);
  if (match) return match[1];
  return null;
};

// Interval Custom Hook
function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// ================== Local Storage 캘린더 관련 상수 및 함수 ==================
const CALENDAR_STORAGE_KEY = "calendarEvents"; // Calendar.jsx와 동일한 키
// To-Do 리스트와 입력 내용에 사용할 Local Storage 키
const TODO_STORAGE_KEY = "dashboardTasks";
const NEWTASK_STORAGE_KEY = "dashboardNewTaskDraft";

/**
 * 날짜 문자열을 받아 오늘로부터의 D-day를 계산합니다.
 * @param {string} dateStr 'YYYY-MM-DD' 형식의 날짜
 * @returns {number} 오늘(0), 내일(1), 어제(-1) 등
 */
const getDDay = (dateStr) => {
  if (!dateStr) return 9999; // 유효하지 않은 날짜는 뒤로 보냄

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scheduleDate = new Date(dateStr);
  scheduleDate.setHours(0, 0, 0, 0);

  const diffTime = scheduleDate.getTime() - today.getTime();
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

  // 프로필 이미지 상태
  const [userProfileImage, setUserProfileImage] = useState(
    "https://i.pravatar.cc/80?img=11"
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("토큰이 없습니다. 비로그인 상태일 수 있어요.");
      return;
    }

    const fetchUser = async () => {
      try {
        // LocalStorage에서 저장된 프로필 이미지 URL을 먼저 확인
        const storedImageUrl = localStorage.getItem("user_profile_image_url");
        if (storedImageUrl) {
          setUserProfileImage(storedImageUrl);
        }

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

        // 프로필 이미지 우선순위: localStorage > API 응답 > 기본 이미지
        const apiImageUrl =
          res.data?.profile_image ||
          res.data?.avatar ||
          res.data?.user_profile_image_url;
        const finalImageUrl =
          storedImageUrl ||
          (apiImageUrl
            ? apiImageUrl.startsWith("http")
              ? apiImageUrl
              : `https://youngbin.pythonanywhere.com${apiImageUrl}`
            : null);

        if (finalImageUrl) {
          setUserProfileImage(finalImageUrl);
          if (!storedImageUrl && finalImageUrl) {
            localStorage.setItem("user_profile_image_url", finalImageUrl);
          }
        }
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

  // 알림 관련 상태
  const [notifications, setNotifications] = useState([]);
  const [loadingNoti, setLoadingNoti] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const lastKnownNotiIds = useRef(new Set());
  const notiBtnRef = useRef(null);
  const notiRef = useRef(null);

  // ================== 대시보드 데이터 상태 ==================
  // 할 일 목록 (Local Storage에 상태 유지)
  const [tasks, setTasks] = useLocalStorageState(TODO_STORAGE_KEY, []);

  // 새로운 할 일 입력창 (Local Storage에 상태 유지)
  const [newTask, setNewTask] = useLocalStorageState(NEWTASK_STORAGE_KEY, "");

  // 다가오는 일정 (Local Storage 일정 포함)
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);

  // 건강 추세 (백엔드 dashboard API에서 가져옴)
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
  const toggleTask = useCallback(
    (id) =>
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      ),
    [setTasks]
  );

  const removeTask = useCallback(
    (id) => setTasks((prev) => prev.filter((t) => t.id !== id)),
    [setTasks]
  );

  const addTask = useCallback(() => {
    const text = newTask.trim();
    if (!text) return;

    setTasks((prev) => [
      ...prev,
      { id: Date.now(), text, done: false },
    ]);
    setNewTask("");
  }, [newTask, setTasks, setNewTask]);

  // ================== 건강 추세 그래프 데이터 (Chart.js용) ==================
  const healthTrendChartData = useMemo(() => {
    if (!healthTrend?.graph_data || healthTrend.graph_data.length === 0) {
      return null;
    }

    const labels = healthTrend.graph_data.map((d, idx) => {
      // 백엔드에서 month가 "11월" 이런 식으로 온다고 가정
      return d.month || d.label || `${idx + 1}회차`;
    });

    const weights = healthTrend.graph_data
      .map((d) => Number(d.weight ?? d.value ?? d.current_weight))
      .filter((v) => !Number.isNaN(v));

    if (weights.length === 0) return null;

    return {
      labels,
      datasets: [
        {
          label: "체중 (kg)",
          data: weights,
          borderColor: "#4b7bec",
          tension: 0.4,
          fill: true,
          backgroundColor: "rgba(75, 123, 236, 0.12)",
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#4b7bec",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [healthTrend]);

  const healthTrendChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          backgroundColor: "#dfebfaff",
          titleColor: "#000000ff",
          bodyColor: "#0c0c0cff",
          padding: 12,
          cornerRadius: 8,
          borderColor: "#dfebfaff",
          borderWidth: 2,
          caretSize: 0,
          displayColors: false,
          bodyFont: {
            size: 13,
            family: "Pretendard",
          },
          titleFont: {
            size: 11,
            family: "Pretendard",
          },
        },
      },
      scales: {
        y: {
          grid: {
            color: "#e5e7eb",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    }),
    []
  );

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
            const todayDDay = getDDay(
              new Date().toISOString().slice(0, 10)
            );

            const localSchedules = events
              .map((event) => ({
                id: `local-${event.id}`,
                content: `[${event.category}] ${event.text}`,
                schedule_date: event.date,
                d_day: getDDay(event.date),
              }))
              .filter((schedule) => schedule.d_day >= todayDDay);

            combinedSchedules = localSchedules;
          }
        } catch (localErr) {
          console.error("Local Calendar events load error:", localErr);
        }

        const url = `https://youngbin.pythonanywhere.com/api/v1/pets/dashboard/${petId}/`;

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = res.data;
        console.log("📌 대시보드 응답:", data);

        // care_list → tasks로 세팅 (API 데이터가 있으면 로컬 덮어쓰기)
        if (data.care_list && Array.isArray(data.care_list.items)) {
          setTasks(
            data.care_list.items.map((item) => ({
              id: item.id,
              text: item.content,
              done: !!item.is_complete,
            }))
          );
        }

        // API 일정 추가
        if (Array.isArray(data.upcoming_schedules)) {
          const apiSchedules = data.upcoming_schedules.map((s) => ({
            ...s,
            id: `api-${s.id}`,
          }));

          combinedSchedules = [...combinedSchedules, ...apiSchedules];
        }

        combinedSchedules.sort((a, b) => a.d_day - b.d_day);
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
  }, [setTasks]);

  // 알림 읽음 처리 함수들
  const markNotificationAsReadOnServer = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.post(
        `https://youngbin.pythonanywhere.com/api/v1/notifications/${id}/read/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error(`알림 ${id} 서버 읽음 처리 실패:`, err);
    }
  };

  const markAllNotificationsReadOnServer = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.post(
        "https://youngbin.pythonanywhere.com/api/v1/notifications/read-all/",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("모든 알림 서버 읽음 처리 실패:", err);
    }
  };

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    markNotificationAsReadOnServer(id);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setHasNewNotification(false);
    markAllNotificationsReadOnServer();
  };

  const hasUnreadInList = useMemo(
    () => notifications.some((n) => !n.is_read),
    [notifications]
  );

  

  // 알림 패널 외부 클릭/ESC로 닫기
  useEffect(() => {
    if (!showBellPopup) return;
    const onClick = (e) => {
      if (
        notiRef.current &&
        !notiRef.current.contains(e.target) &&
        notiBtnRef.current &&
        !notiBtnRef.current.contains(e.target)
      ) {
        setShowBellPopup(false);
        setHasNewNotification(false);
      }
    };
    const onEsc = (e) => e.key === "Escape" && setShowBellPopup(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showBellPopup]);

  // 알림 API 호출 함수
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(
        "https://youngbin.pythonanywhere.com/api/v1/notifications/",
        { headers }
      );

      const rawNotifications = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      const mappedNotifications = rawNotifications.map((n) => {
        const senderName =
          n.sender_nickname && n.sender_nickname.trim()
            ? n.sender_nickname.trim()
            : n.sender_id
            ? `사용자 ${n.sender_id}`
            : extractNickname(n.message || "") || "알 수 없는 사용자";

        const cleanedText = cleanAlertText(n.message);

        return {
          id: n.id,
          user: senderName,
          text: cleanedText,
          time: getTimeAgo(n.created_at),
          rawTime: n.created_at,
          is_read: n.is_read,
          avatarColor: n.is_read ? "#e5e7eb" : "#dbeafe",
        };
      });

      setNotifications(mappedNotifications);

      const currentIds = new Set(mappedNotifications.map((n) => n.id));
      const prevIds = lastKnownNotiIds.current;
      const hasNew =
        mappedNotifications.some((n) => !n.is_read) ||
        (prevIds.size > 0 &&
          Array.from(currentIds).some((id) => !prevIds.has(id)));

      setHasNewNotification(hasNew);
      lastKnownNotiIds.current = currentIds;
    } catch (err) {
      console.error("알림 불러오기 실패:", err);
    } finally {
      setLoadingNoti(false);
    }
  }, []);

  // 초기 알림 로드 및 주기적 폴링
  useEffect(() => {
    setLoadingNoti(true);
    fetchNotifications();
  }, [fetchNotifications]);

  useInterval(() => {
    fetchNotifications();
  }, 10000);

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
          <Link to="/dashboard" className="brand">
            <img src={logoBlue} alt="paw logo" className="paw" />
            <span className="brand-text">멍냥멍냥</span>
          </Link>

          <nav className="menu">
            <a href="/activity">활동</a>
            <a href="/health">건강</a>
            <a href="/calendar">캘린더</a>
            <a href="/community">커뮤니티</a>
          </nav>

          <nav className="menuicon">
            {/* 프로필 */}
            <Link to="/mypage" className="profile">
              <div className="profile__avatar">
                <img src={userProfileImage} alt="프로필" />
              </div>
              <span className="profile__name">{username}</span>
            </Link>

            {/* 알림 벨 */}
            <div className="icon-wrapper bell">
              <button
                ref={notiBtnRef}
                className="icon-btn bell__btn"
                onClick={() => {
                  setShowBellPopup((v) => !v);
                  setShowChatPopup(false);
                }}
                type="button"
              >
                <img src={bell} alt="알림 아이콘" className="icon" />
                {hasNewNotification && <span className="bell__dot" />}
              </button>
              {showBellPopup && (
                <div ref={notiRef} className="noti">
                  <div className="noti__header">
                    <strong>알림</strong>
                    <button
                      className="noti__allread"
                      onClick={markAllRead}
                      disabled={!hasUnreadInList}
                    >
                      모두 읽음
                    </button>
                  </div>
                  <ul className="noti__list">
                    {loadingNoti && (
                      <li className="noti__empty">알림 불러오는 중...</li>
                    )}
                    {!loadingNoti && notifications.length === 0 && (
                      <li className="noti__empty">알림이 없습니다.</li>
                    )}
                    {!loadingNoti &&
                      notifications.map((n) => (
                        <li
                          key={n.id}
                          className={`noti__item ${
                            !n.is_read ? "is-unread" : "is-read"
                          }`}
                          onClick={() => markRead(n.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) =>
                            e.key === "Enter" && markRead(n.id)
                          }
                          title="클릭하면 읽음 처리"
                        >
                          <div
                            className="noti__avatar"
                            style={{ background: n.avatarColor }}
                          />
                          <div className="noti__body">
                            <div className="noti__text">
                              <b>{n.user}</b>
                              <span>{n.text}</span>
                            </div>
                            <div className="noti__meta">
                              <span className="noti__time">{n.time}</span>
                              {!n.is_read && (
                                <span className="noti__badge">안 읽음</span>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
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
                <a href="/Chat">
                  <img src={chat} alt="채팅 아이콘" className="icon" />
                </a>
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
            <div className="todolist">
              오늘 할 일 ({tasks.filter((t) => t.done).length}/{tasks.length})
            </div>
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
              {tasks.length === 0 && (
                <li
                  className="todo__item"
                  style={{
                    justifyContent: "center",
                    color: "#94a3b8",
                  }}
                >
                  할 일을 추가해 주세요.
                </li>
              )}
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

            {/* 우측: Chart.js 건강 추세 그래프 */}
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

              <div className="graph-box">
                {healthTrendChartData ? (
                  <Line
                    options={healthTrendChartOptions}
                    data={healthTrendChartData}
                  />
                ) : (
                  <p className="event__empty">
                    아직 건강 추세 데이터가 없어요.
                    <br />
                    건강 페이지에서 체중 기록을 남기면
                    <br />
                    이곳에 그래프로 보여드릴게요.
                  </p>
                )}
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
            <div className="food-group food-group--ok">
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

            <div className="food-group food-group--no">
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
              <img
                src={reactpic}
                alt="React Logo"
                className="react-icon"
              />
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
