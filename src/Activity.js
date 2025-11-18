// src/Activity.js

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import "./Home.css";
import "./Activity.css";
import { NavLink, Link } from "react-router-dom";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";
import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";
import bell from "./img/bell.png";
import chat from "./img/chat.png";

// Chart.js 모듈 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// ====== 상수 & 유틸 ======
const ACTIVITY_CATEGORIES = [
  { key: "walk", label: "산책", color: "#D7EFFF", icon: "🐾" },
  { key: "play", label: "놀이", color: "#E6FFE3", icon: "🎾" },
  { key: "train", label: "훈련", color: "#FFF7CC", icon: "🏆" },
  { key: "outing", label: "외출", color: "#EFE4FF", icon: "🚗" },
  { key: "other", label: "기타", color: "#E9ECEF", icon: "⚫" },
];

const WEEK_LABELS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

// ✅ 수정됨: API_BASE 경로 수정
const API_BASE = "https://youngbin.pythonanywhere.com/api/v1/pets";

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

// localStorage 에서 pet_id / token 가져오기
const getPetId = () => {
  const stored = localStorage.getItem("pet_id");
  if (!stored) return null;
  const n = parseInt(stored, 10);
  return Number.isNaN(n) ? null : n;
};

const getToken = () => localStorage.getItem("token");

// 공통 API 요청 함수
async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 요청 정보 로깅
  console.log("API 요청:", {
    url: path,
    method: options.method || "GET",
    headers: { ...headers, Authorization: token ? "Bearer ***" : "없음" },
    body: options.body ? JSON.parse(options.body) : null
  });

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const text = await res.text();
  console.log("API 응답:", {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
    body: text
  });

  if (!res.ok) {
    console.error("API Error:", res.status, text);
    
    // 에러 메시지 파싱
    let errorMessage = text || "서버에서 에러 메시지를 보내지 않았습니다.";
    try {
      const errorJson = JSON.parse(text);
      if (errorJson.error) {
        errorMessage = errorJson.error;
      } else if (errorJson.detail) {
        errorMessage = errorJson.detail;
      } else if (errorJson.message) {
        errorMessage = errorJson.message;
      } else if (typeof errorJson === 'object') {
        // 객체 전체를 문자열로 변환
        errorMessage = JSON.stringify(errorJson, null, 2);
      }
    } catch (e) {
      // JSON 파싱 실패 시 원본 텍스트 사용
      console.error("에러 메시지 파싱 실패:", e);
    }
    
    // 404 오류인 경우 더 친절한 메시지
    if (res.status === 404) {
      if (errorMessage.includes("반려동물") || errorMessage.includes("pet")) {
        errorMessage = "반려동물 정보를 찾을 수 없습니다.\n마이페이지에서 반려동물을 등록해주세요.";
      }
    }
    
    alert(`API 오류 (${res.status})\n${errorMessage}`);
    throw new Error(`API Error ${res.status}: ${errorMessage}`);
  }

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getCategory(label) {
  if (label === "선택하세요") {
    return ACTIVITY_CATEGORIES.find((cat) => cat.key === "other");
  }
  const found = ACTIVITY_CATEGORIES.find((cat) => label.includes(cat.label));
  return found || ACTIVITY_CATEGORIES.find((cat) => cat.key === "other");
}

function formatDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// 백엔드 응답을 화면용 walk 객체로 변환
function mapActivityToWalk(a) {
  const rawDateStr =
    a.log_date ||
    (a.created_at ? a.created_at.slice(0, 10) : null);
  const dateObj = rawDateStr ? new Date(rawDateStr) : new Date();

  return {
    id: a.id,
    type: a.log_type,
    title: `${a.log_type} 기록`,
    minutes: a.duration,
    km: a.distance,
    date: formatDate(dateObj),
    rawDate: dateObj,
  };
}

// ====== 컴포넌트 ======
export default function Activity() {
  const location = useLocation();
  const [showBellPopup, setShowBellPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  
  // 로그인 상태 및 사용자 정보
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userProfileImage, setUserProfileImage] = useState("https://i.pravatar.cc/80?img=11");

  // 알림 관련 상태
  const [notifications, setNotifications] = useState([]);
  const [loadingNoti, setLoadingNoti] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const lastKnownNotiIds = useRef(new Set());
  const notiBtnRef = useRef(null);
  const notiRef = useRef(null);

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

      const uniqueNotifications = mappedNotifications.reduce((acc, current) => {
        const isDuplicate = acc.some(
          (item) =>
            Math.abs(new Date(item.rawTime) - new Date(current.rawTime)) < 5000 &&
            ((item.user === current.user && item.text === current.text) ||
              ((current.user === "알 수 없는 사용자" ||
                current.text === "새 쪽지가 도착했습니다.") &&
                item.user !== "알 수 없는 사용자" &&
                current.text.includes(item.user)))
        );
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, []);

      uniqueNotifications.sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime));

      const newNotiIds = new Set(uniqueNotifications.map((n) => n.id));
      const newlyArrivedUnread = uniqueNotifications.some(
        (n) => !n.is_read && !lastKnownNotiIds.current.has(n.id)
      );

      if (newlyArrivedUnread) {
        setHasNewNotification(true);
      }

      lastKnownNotiIds.current = newNotiIds;
      setNotifications(uniqueNotifications);
    } catch (err) {
      console.error("알림 불러오기 실패:", err);
    } finally {
      setLoadingNoti(false);
    }
  }, []);

  // 초기 알림 로드
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingNoti(true);
    fetchNotifications();
  }, [fetchNotifications]);

  // 10초마다 알림 새로고침
  useInterval(() => {
    if (showBellPopup) return;
    fetchNotifications();
  }, 10000);

  // 로그인 상태 확인 및 사용자 정보 가져오기
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // LocalStorage에서 저장된 프로필 이미지 URL을 먼저 확인
    const storedImageUrl = localStorage.getItem("user_profile_image_url");
    if (storedImageUrl) {
      setUserProfileImage(storedImageUrl);
    }
    
    if (token) {
      setIsLoggedIn(true);
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
          
          // 프로필 이미지 우선순위: localStorage > API 응답 > 기본 이미지
          const apiImageUrl = res.data?.profile_image || res.data?.avatar || res.data?.user_profile_image_url;
          const finalImageUrl = storedImageUrl || 
            (apiImageUrl 
              ? (apiImageUrl.startsWith("http")
                  ? apiImageUrl
                  : `https://youngbin.pythonanywhere.com${apiImageUrl}`)
              : null);
          
          if (finalImageUrl) {
            setUserProfileImage(finalImageUrl);
            if (!storedImageUrl && finalImageUrl) {
              localStorage.setItem("user_profile_image_url", finalImageUrl);
            }
          }
        })
        .catch((err) => {
          console.error("유저 정보 불러오기 실패:", err);
          setIsLoggedIn(false);
        });
    } else {
      setIsLoggedIn(false);
    }
  }, []);
  const [walks, setWalks] = useState([]);
  const [loading, setLoading] = useState(false);

  // 모달/폼 상태
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: "선택하세요",
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

  // ====== 초기 로딩: 활동 목록 불러오기 ======
  useEffect(() => {
    loadActivities();
  }, []);

  // 페이지 이동 후 돌아올 때 데이터 다시 불러오기
  useEffect(() => {
    // Activity 페이지로 이동할 때마다 데이터 다시 불러오기
    if (location.pathname === '/activity' || location.pathname === '/Activity') {
      loadActivities();
    }
  }, [location.pathname]);

  // 페이지 포커스 시 데이터 다시 불러오기 (다른 탭에서 돌아올 때)
  useEffect(() => {
    const handleFocus = () => {
      if (location.pathname === '/activity' || location.pathname === '/Activity') {
        loadActivities();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [location.pathname]);

  async function loadActivities() {
    try {
      setLoading(true);
      const petId = getPetId();
      
      // pet_id가 없으면 반려동물 등록 안내
      if (!petId) {
        alert("반려동물을 먼저 등록해주세요.\n마이페이지에서 반려동물을 추가할 수 있습니다.");
        setWalks([]);
        return;
      }
      
      // ✅ 수정됨: URL 경로 수정
      const data = await apiRequest(`${API_BASE}/activities/${petId}/`, {
        method: "GET",
      });
      
      console.log("활동 데이터 로드 응답:", data);
      
      // API 응답이 배열인지 확인 (다양한 응답 형식 대응)
      let arr = [];
      if (Array.isArray(data)) {
        arr = data;
      } else if (data && Array.isArray(data.recent_logs)) {
        // API 응답이 {recent_logs: [...]} 형식인 경우
        arr = data.recent_logs;
      } else if (data && Array.isArray(data.activities)) {
        arr = data.activities;
      } else if (data && Array.isArray(data.logs)) {
        arr = data.logs;
      } else if (data && typeof data === 'object' && data.id) {
        // 단일 객체인 경우 배열로 변환
        arr = [data];
      }
      
      const mapped = arr.map(mapActivityToWalk);
      console.log("매핑된 활동 데이터:", mapped);
      setWalks(mapped);
    } catch (e) {
      console.error(e);
      // 404 오류인 경우 반려동물 정보가 없다는 메시지 표시
      if (e.message && e.message.includes("404")) {
        setWalks([]);
        // alert는 apiRequest 함수에서 이미 표시되므로 중복 표시하지 않음
      }
    } finally {
      setLoading(false);
    }
  }

  // ====== 폼 공통 ======
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

  // ====== 활동 추가 저장 ======
  const handleSave = async (e) => {
    e.preventDefault();
    if (form.type === "선택하세요") {
      alert("활동 종류를 선택해 주세요.");
      return;
    }

    const v = validate(form.minutes, form.distance);
    if (!v.ok) return;

    try {
      const petId = getPetId();
      
      // pet_id가 없으면 반려동물 등록 안내
      if (!petId) {
        alert("반려동물을 먼저 등록해주세요.\n마이페이지에서 반려동물을 추가할 수 있습니다.");
        return;
      }
      
      const payload = {
        log_type: form.type,
        duration: v.minutesNum,
      };
      if (v.distanceNum != null) payload.distance = v.distanceNum;

      console.log("활동 저장 요청:", { petId, payload });

      // ✅ 수정됨: POST URL 경로 수정
      const created = await apiRequest(`${API_BASE}/activities/logs/${petId}/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log("활동 저장 성공:", created);

      // 저장 성공 후 서버에서 최신 데이터 다시 불러오기
      await loadActivities();

      alert("활동 기록이 저장되었습니다.");
      setShowModal(false);
      setIsAddDropdownOpen(false);
      setForm({ type: "선택하세요", minutes: "", distance: "" });
    } catch (err) {
      console.error("활동 저장 실패:", err);
      console.error("에러 상세:", err.message, err.stack);
      let errorMessage = "활동 기록 저장에 실패했습니다.";
      if (err.message) {
        errorMessage += `\n${err.message}`;
      }
      alert(errorMessage);
    }
  };

  // ====== 삭제 ======
  const openConfirm = (id) => setConfirm({ open: true, id });
  const closeConfirm = () => setConfirm({ open: false, id: null });

  const confirmDelete = async () => {
    try {
      const targetId = confirm.id;
      if (!targetId) return;

      // ✅ 수정됨: DELETE URL 경로 수정 (petId 제거)
      await apiRequest(`${API_BASE}/activities/logs/items/${targetId}/`, {
        method: "DELETE",
      });

      console.log("활동 삭제 성공");

      // 삭제 성공 후 서버에서 최신 데이터 다시 불러오기
      await loadActivities();
    } catch (err) {
      console.error("활동 삭제 실패:", err);
      alert("활동 기록 삭제에 실패했습니다. 다시 시도해주세요.");
    } finally {
      closeConfirm();
    }
  };

  // ====== 수정 모달 ======
  const openEdit = (w) => {
    setEdit({
      open: true,
      id: w.id,
      type: w.type || getCategory(w.title)?.label || "산책",
      minutes: String(w.minutes ?? ""),
      distance: w.km == null ? "" : String(w.km),
    });
    setIsEditDropdownOpen(false);
  };

  const handleEditChange = (field) => (e) => {
    const value = e?.target?.value ?? "";
    setEdit((prev) => ({ ...prev, [field]: value }));
  };

  const closeEdit = () => {
    setEdit({ open: false, id: null, type: "", minutes: "", distance: "" });
    setIsEditDropdownOpen(false);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const v = validate(edit.minutes, edit.distance);
    if (!v.ok) return;

    try {
      const payload = {
        log_type: edit.type,
        duration: v.minutesNum,
      };
      if (v.distanceNum != null) payload.distance = v.distanceNum;

      // ✅ 수정됨: PUT URL 경로 수정 (petId 제거)
      const updated = await apiRequest(`${API_BASE}/activities/logs/items/${edit.id}/`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      console.log("활동 수정 성공:", updated);

      // 수정 성공 후 서버에서 최신 데이터 다시 불러오기
      await loadActivities();

      closeEdit();
    } catch (err) {
      console.error("활동 수정 실패:", err);
      alert("활동 기록 수정에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // ====== 드롭다운 선택 ======
  const handleAddDropdownSelect = (label) => {
    setForm((prev) => ({ ...prev, type: label }));
    setIsAddDropdownOpen(false);
  };

  const handleEditDropdownSelect = (label) => {
    setEdit((prev) => ({ ...prev, type: label }));
    setIsEditDropdownOpen(false);
  };

  const closeAddModal = () => {
    setShowModal(false);
    setIsAddDropdownOpen(false);
    setForm({ type: "선택하세요", minutes: "", distance: "" });
  };

  // ====== 파생 데이터: 오늘의 합계 / 주간 분석 ======
  const todayStr = formatDate();
  const today = useMemo(
    () =>
      walks.filter((w) => w.date === todayStr || !w.date),
    [walks, todayStr]
  );

  const todayMinutes = today.reduce((sum, w) => sum + (w.minutes || 0), 0);
  const todayDistance = today.reduce(
    (sum, w) => sum + (w.km || 0),
    0
  );

  const weeklyMinutes = useMemo(() => {
    const arr = Array(7).fill(0);
    walks.forEach((w) => {
      const d = w.rawDate || new Date();
      const idx = d.getDay();
      arr[idx] += w.minutes || 0;
    });
    return arr;
  }, [walks]);

  const hasWeeklyData = weeklyMinutes.some((v) => v > 0);

  const chartData = {
    labels: WEEK_LABELS,
    datasets: hasWeeklyData
      ? [
          {
            label: "활동 시간(분)",
            data: weeklyMinutes,
            backgroundColor: "#D6E4FF",
            borderRadius: 12,
            borderSkipped: false,
          },
        ]
      : [],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 10 },
        border: { display: false },
        grid: { color: "#F0F0F0" },
      },
    },
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
          {isLoggedIn ? (
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
                  <NavLink to="/Chat">
                    <img src={chat} alt="채팅 아이콘" className="icon" />
                  </NavLink>
                </button>
              </div>
            </nav>
          ) : (
            <nav className="menulink">
              <NavLink to="/signup">회원가입</NavLink>
              <NavLink to="/signin">로그인</NavLink>
            </nav>
          )}
        </div>
      </header>

      <main className="activity-container">
        {/* 오늘의 활동 */}
        <section className="section">
          <div className="section-title">
            <span className="blue-stick" />
            <h2 id="h2">오늘의 활동</h2>
          </div>
          <div className="metrics">
            <Metric label="시간" value={todayMinutes} unit="분" />
            <Metric
              label="거리"
              value={todayDistance.toFixed(1)}
              unit="km"
            />
          </div>
        </section>

        {/* 주간 활동 분석 */}
        <section className="section">
          <div className="section-title">
            <span className="blue-stick" />
            <h2 id="h2">주간 활동 분석</h2>
          </div>
          <div className="graph-box">
            {loading ? (
              <div className="graph-loading">로딩 중...</div>
            ) : (
              <Bar options={chartOptions} data={chartData} />
            )}
          </div>
        </section>

        {/* 최근 산책 기록 */}
        <section className="section recent-walks">
          <div className="section-title">
            <span className="blue-stick" />
            <h2 id="h2">최근 산책 기록</h2>
          </div>
          <button
            className="css-plus-button"
            aria-label="빠른 추가"
            onClick={() => setShowModal(true)}
          ></button>
          {walks.map((w) => {
            const category = getCategory(w.type || w.title);
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
                      {w.minutes}분{" "}
                      {w.km != null ? `| ${w.km}km` : ""} · {w.date}
                    </div>
                  </div>
                </div>
                <div className="walk-right">
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
                  className={`form-input activity-select-trigger ${
                    form.type === "선택하세요" ? "placeholder" : ""
                  }`}
                  onClick={() =>
                    setIsAddDropdownOpen((prev) => !prev)
                  }
                >
                  <div>
                    {form.type !== "선택하세요" && (
                      <span className="dropdown-icon">
                        {getCategory(form.type)?.icon}
                      </span>
                    )}
                    {form.type}
                  </div>
                </button>
                {isAddDropdownOpen && (
                  <div className="activity-select-options">
                    {ACTIVITY_CATEGORIES.map((cat) => (
                      <div
                        key={cat.key}
                        className="activity-select-option"
                        onClick={() =>
                          handleAddDropdownSelect(cat.label)
                        }
                      >
                        <div>
                          <span className="dropdown-icon">
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
                  onClick={() =>
                    setIsEditDropdownOpen((prev) => !prev)
                  }
                >
                  <div>
                    <span className="dropdown-icon">
                      {getCategory(edit.type)?.icon}
                    </span>{" "}
                    {edit.type}
                  </div>
                </button>
                {isEditDropdownOpen && (
                  <div className="activity-select-options">
                    {ACTIVITY_CATEGORIES.map((cat) => (
                      <div
                        key={cat.key}
                        className="activity-select-option"
                        onClick={() =>
                          handleEditDropdownSelect(cat.label)
                        }
                      >
                        <div>
                          <span className="dropdown-icon">
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
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeEdit}
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

      {/* 삭제 확인 모달 */}
      {confirm.open && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={closeConfirm} />
          <div className="modal-panel confirm-panel">
            <h3 className="confirm-title">정말 삭제하시겠습니까?</h3>
            <p className="confirm-desc">
              이 기록은 복구할 수 없습니다.
            </p>
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
              <img src={reactpic} alt="React Logo" className="react-icon" />
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