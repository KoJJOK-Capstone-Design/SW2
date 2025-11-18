import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./Health.css";
import { NavLink, Link, useLocation } from "react-router-dom";
import axios from "axios";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

import bell from "./img/bell.png";
import chat from "./img/chat.png";
import plusicon from "./img/plusicon.png";

// Chart.js
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

// ====== API 설정 ======
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

// localStorage에서 pet_id / token 가져오기
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

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("API Error:", res.status, text);
    
    // JSON 응답인 경우 파싱해서 더 읽기 쉽게 표시
    let errorMessage = text || "서버에서 에러 메시지를 보내지 않았습니다.";
    try {
      const errorJson = JSON.parse(text);
      if (errorJson.error) {
        errorMessage = errorJson.error;
      } else if (errorJson.message) {
        errorMessage = errorJson.message;
      } else if (typeof errorJson === 'object') {
        errorMessage = JSON.stringify(errorJson, null, 2);
      }
    } catch (e) {
      // JSON이 아니면 원본 텍스트 사용
    }
    
    // API 키 관련 오류인 경우 더 친절한 메시지
    if (errorMessage.includes('GOOGLE_GEMINI_API_KEY') || errorMessage.includes('API_KEY')) {
      errorMessage = "AI 분석 기능을 사용할 수 없습니다.\n서버 설정이 필요합니다.\n관리자에게 문의해주세요.";
    }
    
    alert(`API 오류 (${res.status})\n${errorMessage}`);
    throw new Error(`API Error ${res.status}`);
  }

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// UI 값과 API 값 간 매핑
const UI_TO_API_TYPE = {
  visit: "병원 방문",
  vax: "예방접종",
  med: "투약",
};

const API_TO_UI_TYPE = {
  "병원 방문": "visit",
  "예방접종": "vax",
  "투약": "med",
  // 영문 값도 지원 (혹시 모를 경우)
  hospital: "visit",
  vaccination: "vax",
  medication: "med",
};

// API 응답을 UI 형식으로 변환하는 함수
function mapHealthLogToRecord(log) {
  const iconMap = { visit: "🏥", vax: "💉", med: "💊" };
  const uiType = API_TO_UI_TYPE[log.log_type] || log.log_type;
  return {
    id: log.id,
    type: uiType,
    icon: iconMap[uiType] || "🏥",
    title: log.content,
    location: log.location || "",
    date: log.log_date || (log.created_at ? log.created_at.slice(0, 10) : ""),
  };
}

const Health = ({ user, pet }) => {
  const location = useLocation();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  
  // 알림 관련 상태
  const [showBellPopup, setShowBellPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
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
  
  // 펫 정보 상태 (서버에서 가져온 최신 정보)
  const [petInfo, setPetInfo] = useState({
    breed: pet?.breed || "미입력",
    weight: pet?.weight || "미입력",
    age: pet?.age || "미입력",
    bcs: pet?.bcs || "미입력",
  });

  // 건강 페이지 정보 및 기록 목록 불러오기
  useEffect(() => {
    loadHealthData(); // loadHealthData에서 pet_info도 함께 불러옴
  }, []);

  // 페이지 이동 시 펫 정보 다시 불러오기 (BCS 업데이트 반영)
  useEffect(() => {
    // 페이지가 마운트되거나 경로가 변경될 때마다 건강 페이지 정보 다시 불러오기
    if (location.pathname === '/health' || location.pathname === '/Health') {
      loadHealthData();
    }
  }, [location.pathname]);

  // 페이지 포커스 시 펫 정보 다시 불러오기 (BCS 업데이트 반영)
  useEffect(() => {
    const handleFocus = () => {
      loadHealthData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 펫 정보 불러오기 (건강 페이지 정보 API에서 가져온 pet_info 사용)
  async function loadPetInfo() {
    // loadHealthData에서 이미 pet_info를 불러오므로 여기서는 별도로 호출하지 않음
    // 필요시 loadHealthData를 다시 호출
  }

  async function loadHealthData() {
    try {
      setLoading(true);
      const petId = getPetId();
      
      // pet_id가 없으면 반려동물 등록 안내
      if (!petId) {
        alert("반려동물을 먼저 등록해주세요.\n마이페이지에서 반려동물을 추가할 수 있습니다.");
        setLoading(false);
        return;
      }
      
      // 건강 페이지 정보 조회 (기록 목록 포함)
      const data = await apiRequest(`${API_BASE}/health/${petId}/`, {
        method: "GET",
      });
      
      console.log("건강 페이지 정보 API 응답:", data); // 디버깅용
      console.log("건강 페이지 정보 API 응답의 pet_info:", data?.pet_info); // 디버깅용
      
      // 최신 BCS 체크업 기록 확인 (잘못된 pet_info.bcs 대신 사용)
      let latestBcsCheckup = null;
      
      // 방법 1: Health API 응답에 recent_bcs_checkups가 있는지 확인
      if (data?.recent_bcs_checkups && Array.isArray(data.recent_bcs_checkups) && data.recent_bcs_checkups.length > 0) {
        // 최신 BCS 체크업 기록 찾기 (날짜 기준)
        latestBcsCheckup = data.recent_bcs_checkups.sort((a, b) => {
          const dateA = new Date(a.checkup_date || a.created_at || 0);
          const dateB = new Date(b.checkup_date || b.created_at || 0);
          return dateB - dateA;
        })[0];
        console.log("최신 BCS 체크업 기록 (Health API):", latestBcsCheckup); // 디버깅용
      }
      
      // 방법 2: Health API 응답에 없으면 로컬 스토리지에서 확인
      if (!latestBcsCheckup) {
        const storedBcs = localStorage.getItem('latest_bcs_score');
        if (storedBcs) {
          try {
            const parsedBcs = JSON.parse(storedBcs);
            if (parsedBcs.score && parsedBcs.timestamp) {
              // 24시간 이내의 값만 사용
              const now = Date.now();
              const oneDay = 24 * 60 * 60 * 1000;
              if (now - parsedBcs.timestamp < oneDay) {
                latestBcsCheckup = { stage_number: parsedBcs.score };
                console.log("최신 BCS 체크업 기록 (로컬 스토리지):", latestBcsCheckup); // 디버깅용
              }
            }
          } catch (e) {
            console.warn("로컬 스토리지 BCS 파싱 실패:", e);
          }
        }
      }
      
      // 건강 페이지 정보에 펫 정보가 포함되어 있을 수 있음 (pet_info 또는 pet)
      const petData = data?.pet_info || data?.pet;
      if (petData) {
        console.log("petData 전체:", petData); // 디버깅용
        
        // 나이 처리 - pet_info에는 이미 계산된 age가 있을 수 있음
        let ageText = "미입력";
        if (petData.age !== undefined && petData.age !== null) {
          // 이미 계산된 나이 값이 있으면 사용
          if (typeof petData.age === 'number') {
            ageText = `${petData.age}세`;
          } else if (typeof petData.age === 'string') {
            ageText = petData.age;
          }
        } else if (petData.birth_date) {
          // birth_date가 있으면 계산
          const birthDate = new Date(petData.birth_date);
          const today = new Date();
          const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                              (today.getMonth() - birthDate.getMonth());
          if (ageInMonths < 12) {
            ageText = `${ageInMonths}개월`;
          } else {
            const years = Math.floor(ageInMonths / 12);
            const months = ageInMonths % 12;
            ageText = months > 0 ? `${years}세 ${months}개월` : `${years}세`;
          }
        }
        
        // 체중 처리 - current_weight 또는 weight
        let weightText = "미입력";
        const weightValue = petData.current_weight !== undefined ? petData.current_weight : petData.weight;
        if (weightValue !== undefined && weightValue !== null && weightValue !== "") {
          weightText = `${weightValue}kg`;
        }
        
        // BCS 값 처리
        // ⚠️ 중요: 최신 BCS 체크업 기록이 있으면 그것을 우선 사용 (pet_info.bcs는 BCS 체크업 API가 잘못 저장한 값일 수 있음)
        let bcsValue = null;
        
        if (latestBcsCheckup && latestBcsCheckup.stage_number !== undefined && latestBcsCheckup.stage_number !== null) {
          // 최신 BCS 체크업 기록의 stage_number 사용
          bcsValue = latestBcsCheckup.stage_number;
          console.log("최신 BCS 체크업 기록 사용:", bcsValue, "(pet_info.bcs 무시)"); // 디버깅용
        } else {
          // 최신 BCS 체크업 기록이 없으면 pet_info.bcs 사용
          bcsValue = petData.bcs !== undefined ? petData.bcs : 
                    petData.bcs_score !== undefined ? petData.bcs_score :
                    petData.body_condition_score !== undefined ? petData.body_condition_score :
                    null;
          console.log("pet_info.bcs 사용:", bcsValue); // 디버깅용
        }
        
        console.log("BCS 원본 값:", bcsValue, "타입:", typeof bcsValue); // 디버깅용
        
        let bcsText = "미입력";
        if (bcsValue !== null && bcsValue !== undefined && bcsValue !== "") {
          // 이미 "X단계" 형식인 문자열인지 확인
          if (typeof bcsValue === 'string' && bcsValue.includes('단계')) {
            // 이미 "X단계" 형식이면 그대로 사용
            bcsText = bcsValue;
          } else if (typeof bcsValue === 'number') {
            // 숫자인 경우 "단계" 추가
            bcsText = `${bcsValue}단계`;
          } else if (typeof bcsValue === 'string') {
            // 문자열이지만 "단계"가 없는 경우
            // "측정 안함" 같은 특수 문자열 처리
            if (bcsValue === '측정 안함' || bcsValue.toLowerCase() === 'null' || bcsValue === '') {
              bcsText = "미입력";
            } else {
              // 숫자로 변환 가능한 문자열인지 확인
              const numValue = parseFloat(bcsValue);
              if (!isNaN(numValue) && isFinite(numValue)) {
                bcsText = `${numValue}단계`;
              } else {
                // 숫자로 변환 불가능한 문자열이면 그대로 표시
                bcsText = bcsValue;
              }
            }
          }
        }
        
        console.log("건강 페이지에서 가져온 값들:", {
          weight: weightValue,
          age: petData.age,
          bcs: bcsValue,
          "→ 표시": { weight: weightText, age: ageText, bcs: bcsText }
        }); // 디버깅용
        
        setPetInfo({
          breed: petData.breed || "미입력",
          weight: weightText,
          age: ageText,
          bcs: bcsText,
        });
      }
      
      // 기록 목록이 배열로 오는 경우 (recent_health_logs 또는 logs)
      const logs = data?.recent_health_logs || data?.logs;
      if (logs && Array.isArray(logs)) {
        const mapped = logs.map(mapHealthLogToRecord);
        setRecords(mapped);
      } else if (data && Array.isArray(data)) {
        const mapped = data.map(mapHealthLogToRecord);
        setRecords(mapped);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error("건강 데이터 불러오기 실패:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  // 추가 모달
  const [showModal, setShowModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: "",
    title: "",
    location: "",
    date: "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 수정 모달
  const [showEditModal, setShowEditModal] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);

  // 삭제 모달
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // AI 분석
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 로그인 상태 및 사용자 정보
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userProfileImage, setUserProfileImage] = useState("https://i.pravatar.cc/80?img=11");

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

  // 증상 목록
  const symptoms = [
    "구토",
    "설사",
    "식사 부진",
    "복부 팽만",
    "과도한 갈증",
    "피부 발진",
    "비듬",
    "탈모",
    "기력 저하",
    "수면 증가",
    "불안 / 공격성",
    "걸음걸이 이상",
  ];

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  // ============= 추가 모달 동작 =============
  const handleAdd = () => {
    setShowModal(true);
    setIsDropdownOpen(false);
  };

  const handleChange = (e) => {
    setNewRecord({
      ...newRecord,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!newRecord.type || !newRecord.title || !newRecord.date) {
      alert("종류, 제목, 날짜는 필수 입력 항목입니다!");
      return;
    }

    try {
      const petId = getPetId();
      
      // pet_id가 없으면 반려동물 등록 안내
      if (!petId) {
        alert("반려동물을 먼저 등록해주세요.\n마이페이지에서 반려동물을 추가할 수 있습니다.");
        return;
      }
      
      // UI 값("visit", "vax", "med")을 API 값("병원 방문", "예방접종", "투약")으로 변환
      const apiLogType = UI_TO_API_TYPE[newRecord.type] || newRecord.type;
      const payload = {
        log_type: apiLogType,
        content: newRecord.title,
        log_date: newRecord.date,
      };
      
      if (newRecord.location) {
        payload.location = newRecord.location;
      }

      const created = await apiRequest(`${API_BASE}/health/logs/${petId}/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (created && created.id) {
        const newRecordMapped = mapHealthLogToRecord(created);
        setRecords([newRecordMapped, ...records]);
      }

      setNewRecord({ type: "", title: "", location: "", date: "" });
      setShowModal(false);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("건강 기록 생성 실패:", error);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSave();
  };

  // ============= 수정 모달 =============
  const handleEditClick = (record) => {
    setRecordToEdit(record);
    setShowEditModal(true);
    setIsEditDropdownOpen(false);
  };

  const handleEditChange = (e) => {
    setRecordToEdit({
      ...recordToEdit,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateSave = async () => {
    if (!recordToEdit.type || !recordToEdit.title || !recordToEdit.date) {
      alert("종류, 제목, 날짜는 필수 입력 항목입니다!");
      return;
    }

    try {
      // UI 값("visit", "vax", "med")을 API 값("병원 방문", "예방접종", "투약")으로 변환
      const apiLogType = UI_TO_API_TYPE[recordToEdit.type] || recordToEdit.type;
      const payload = {
        log_type: apiLogType,
        content: recordToEdit.title,
        log_date: recordToEdit.date,
      };
      
      if (recordToEdit.location) {
        payload.location = recordToEdit.location;
      }

      const updated = await apiRequest(`${API_BASE}/health/logs/items/${recordToEdit.id}/`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (updated && updated.id) {
        const updatedRecordMapped = mapHealthLogToRecord(updated);
        setRecords(records.map((r) => (r.id === updatedRecordMapped.id ? updatedRecordMapped : r)));
      }

      setShowEditModal(false);
      setRecordToEdit(null);
      setIsEditDropdownOpen(false);
    } catch (error) {
      console.error("건강 기록 수정 실패:", error);
    }
  };

  const handleEditFormSubmit = (e) => {
    e.preventDefault();
    handleUpdateSave();
  };
  const closeAddModal = () => {
    setShowModal(false);
    setIsDropdownOpen(false);
    setNewRecord({ type: "", title: "", location: "", date: "" }); // 폼 리셋
  };
  // ============= 삭제 모달 =============
  const handleDeleteClick = (id) => {
    setRecordToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };

  const handleConfirmDelete = async () => {
    try {
      await apiRequest(`${API_BASE}/health/logs/items/${recordToDelete}/`, {
        method: "DELETE",
      });

      setRecords(records.filter((r) => r.id !== recordToDelete));
      setShowDeleteModal(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error("건강 기록 삭제 실패:", error);
    }
  };

  // ============= AI 분석 =============
  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) {
      alert("먼저 증상을 선택해주세요!");
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const petId = getPetId();
      
      // pet_id가 없으면 반려동물 등록 안내
      if (!petId) {
        alert("반려동물을 먼저 등록해주세요.\n마이페이지에서 반려동물을 추가할 수 있습니다.");
        setIsLoading(false);
        return;
      }
      
      const payload = {
        symptoms: selectedSymptoms,
      };

      const result = await apiRequest(`${API_BASE}/health/ai-checkup/${petId}/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log("AI 분석 API 응답:", result); // 디버깅용
      console.log("AI 분석 API 응답의 모든 키:", result ? Object.keys(result) : "null"); // 디버깅용

      if (result) {
        // analysis_result 객체 안에 실제 데이터가 있음
        const analysisData = result.analysis_result || result;
        
        console.log("analysis_result 내용:", analysisData); // 디버깅용
        console.log("analysis_result의 모든 키:", analysisData ? Object.keys(analysisData) : "null"); // 디버깅용
        
        // analysis 객체 안에 질환 정보가 있을 수 있음
        const analysis = analysisData.analysis || {};
        console.log("analysis 객체 내용:", analysis); // 디버깅용
        console.log("analysis 객체의 모든 키:", analysis ? Object.keys(analysis) : "null"); // 디버깅용
        
        // API 응답 구조에 맞게 필드명 확인 (analysis 객체 우선, 없으면 analysisData에서)
        const illnessName = analysis.illness_name || 
                           analysis.disease_name || 
                           analysis.질환명 || 
                           analysis.suspected_disease ||
                           analysisData.illness_name || 
                           analysisData.disease_name || 
                           analysisData.질환명 || 
                           analysisData.suspected_disease ||
                           "의심 질환";
        
        const illnessDetails = analysis.illness_details || 
                              analysis.details || 
                              analysis.disease_details || 
                              analysis.상세 || 
                              analysis.description ||
                              analysis.diagnosis ||
                              analysisData.illness_details || 
                              analysisData.details || 
                              analysisData.disease_details || 
                              analysisData.상세 || 
                              analysisData.description ||
                              analysisData.diagnosis ||
                              "";
        
        const recommendations = analysisData.recommendations || 
                                analysisData.recommendation || 
                                analysisData.권장사항 || 
                                analysisData.대처방안 ||
                                analysisData.actions ||
                                [];
        
        console.log("파싱된 결과:", { illnessName, illnessDetails, recommendations }); // 디버깅용
        
        setAnalysisResult({
          illness_name: illnessName,
          illness_details: illnessDetails,
          recommendations: Array.isArray(recommendations) ? recommendations : (recommendations ? [recommendations] : []),
        });
      }
    } catch (error) {
      console.error("AI 분석 실패:", error);
      // apiRequest에서 이미 alert를 표시하므로 여기서는 추가 알림 없음
      // 필요시 더 구체적인 에러 메시지 표시 가능
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords =
    activeTab === "all" ? records : records.filter((r) => r.type === activeTab);

  // ============= ⭐️ 렌더링 시작 ⭐️ =============
  return (
    <div className="health-page">

      {/* ============ 추가 모달 ============ */}
      {showModal && (
        <div className="health-add-overlay" onClick={closeAddModal}> {/* ⭐️ 리셋 함수로 변경 */}
          <div className="health-add-modal" onClick={(e) => e.stopPropagation()}>
            <h2>건강 기록 추가</h2>
            <form onSubmit={handleFormSubmit}>
              {/* 종류 드롭다운 */}
              <div className="health-add-group">
                <label>종류</label>
                <div className="activity-select-wrapper">
                  <button
                    type="button"
                    className={`activity-select-trigger ${newRecord.type === "" ? "placeholder" : ""}`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    {/* ⭐️ 1. 버튼 래퍼 <div> */}
                    <div>
                      {newRecord.type === "" && "선택하세요"}
                      {newRecord.type === "visit" && (
                        <><span className="dropdown-icon">🏥</span> 병원 방문</>
                      )}
                      {newRecord.type === "vax" && (
                        <><span className="dropdown-icon">💉</span> 예방접종</>
                      )}
                      {newRecord.type === "med" && (
                        <><span className="dropdown-icon">💊</span> 투약</>
                      )}
                    </div>
                  </button>

                  {isDropdownOpen && (
                    <div className="activity-select-options">
                      {/* ⭐️ 2. 옵션 래퍼 <div> */}
                      <div
                        className="activity-select-option"
                        onClick={() => {
                          setNewRecord({ ...newRecord, type: "visit" });
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div><span className="dropdown-icon">🏥</span> 병원 방문</div>
                      </div>
                      <div
                        className="activity-select-option"
                        onClick={() => {
                          setNewRecord({ ...newRecord, type: "vax" });
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div><span className="dropdown-icon">💉</span> 예방접종</div>
                      </div>
                      <div
                        className="activity-select-option"
                        onClick={() => {
                          setNewRecord({ ...newRecord, type: "med" });
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div><span className="dropdown-icon">💊</span> 투약</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ... (이하 폼 내용) ... */}
              <div className="health-add-group">
                <label>제목</label>
                <input
                  type="text"
                  name="title"
                  className="health-add-input"
                  placeholder="예: 심장사상충약 투약 완료" required
                  value={newRecord.title}
                  onChange={handleChange}
                />
              </div>
              <div className="health-add-group">
                <label>장소 / 약 이름</label>
                <input
                  type="text"
                  name="location"
                  className="health-add-input"
                  placeholder="예: 넥스가드 스펙트라 (3.6kg 용)"
                  value={newRecord.location}
                  onChange={handleChange}
                />
              </div>
              <div className="health-add-group">
                <label>날짜</label>
                <input
                  type="date"
                  name="date"
                  className="health-add-input"
                  value={newRecord.date}
                  onChange={handleChange}
                />
              </div>
              <div className="health-add-buttons">
                <button type="button" className="health-add-btn cancel" onClick={closeAddModal}>
                  취소
                </button>
                <button type="submit" className="health-add-btn save">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ 수정 모달 ============ */}
      {showEditModal && recordToEdit && (
        <div className="health-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="health-modal" onClick={(e) => e.stopPropagation()}>
            <h2>건강 기록 수정</h2>
            <form onSubmit={handleEditFormSubmit}>
              {/* 종류 */}
              <div className="form-group">
                <label>종류</label>
                <div className="activity-select-wrapper">
                  <button
                    type="button"
                    className={`activity-select-trigger ${recordToEdit.type === "" ? "placeholder" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditDropdownOpen(!isEditDropdownOpen);
                    }}
                  >
                    {/* ⭐️ 1. 버튼 래퍼 <div> */}
                    <div>
                      {recordToEdit.type === "visit" && (
                        <><span className="dropdown-icon">🏥</span> 병원 방문</>
                      )}
                      {recordToEdit.type === "vax" && (
                        <><span className="dropdown-icon">💉</span> 예방접종</>
                      )}
                      {recordToEdit.type === "med" && (
                        <><span className="dropdown-icon">💊</span> 투약</>
                      )}
                      {recordToEdit.type === "" && "선택하세요"}
                    </div>
                  </button>

                  {isEditDropdownOpen && (
                    <div className="activity-select-options">
                      {/* ⭐️ 2. 옵션 래퍼 <div> */}
                      <div
                        className="activity-select-option"
                        onClick={() => {
                          setRecordToEdit({ ...recordToEdit, type: "visit" });
                          setIsEditDropdownOpen(false);
                        }}
                      >
                        <div><span className="dropdown-icon">🏥</span> 병원 방문</div>
                      </div>
                      <div
                        className="activity-select-option"
                        onClick={() => {
                          setRecordToEdit({ ...recordToEdit, type: "vax" });
                          setIsEditDropdownOpen(false);
                        }}
                      >
                        <div><span className="dropdown-icon">💉</span> 예방접종</div>
                      </div>
                      <div
                        className="activity-select-option"
                        onClick={() => {
                          setRecordToEdit({ ...recordToEdit, type: "med" });
                          setIsEditDropdownOpen(false);
                        }}
                      >
                        <div><span className="dropdown-icon">💊</span> 투약</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ... (이하 폼 내용) ... */}
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  name="title"
                  className="input"
                  value={recordToEdit.title}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group">
                <label>장소 / 약 이름</label>
                <input
                  type="text"
                  name="location"
                  className="input"
                  value={recordToEdit.location}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group">
                <label>날짜</label>
                <input
                  type="date"
                  name="date"
                  className="input"
                  value={recordToEdit.date}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-buttons">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ 삭제 모달 ============ */}
      {showDeleteModal && (
        <div className="health-modal-overlay" onClick={handleCancelDelete}>
          <div className="health-modal" onClick={(e) => e.stopPropagation()}>
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
      {/* ================= 헤더 ================= */}
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

      {/* ================= 본문 ================= */}
      <div className="health-container">

        {/* 펫 정보 */}
        <section className="health-info">
          <h2 className="hw">나!님의 건강 정보</h2>

          <div className="info-grid">
            <div><span>품종</span><b>{petInfo.breed}</b></div>
            <div><span>현재 체중</span><b>{petInfo.weight}</b></div>
            <div><span>나이</span><b>{petInfo.age}</b></div>
            <div>
              <span>BCS</span>
              {petInfo.bcs && petInfo.bcs !== "미입력" ? (
                <>
                  <b>{petInfo.bcs}</b>
                  <span className="test" onClick={() => (window.location.href = "/BcsTest")}>
                    다시 진단하기
                  </span>
                </>
              ) : (
                <>
                  <b>미입력</b>
                  <span className="test" onClick={() => (window.location.href = "/BcsTest")}>
                    진단하기
                  </span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* 최근 건강 기록 */}
        <section className="health-info">
          <div className="health-header">
            <h2 className="hw">최근 건강 기록</h2>
            <button className="add-button" onClick={handleAdd}></button>
          </div>

          {/* 탭 */}
          <nav className="health-tabs">
            <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
              전체
            </button>
            <button className={activeTab === "vax" ? "active" : ""} onClick={() => setActiveTab("vax")}>
              예방접종
            </button>
            <button className={activeTab === "visit" ? "active" : ""} onClick={() => setActiveTab("visit")}>
              병원 방문
            </button>
            <button className={activeTab === "med" ? "active" : ""} onClick={() => setActiveTab("med")}>
              투약
            </button>
          </nav>

          <ul className="health-record-list">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <li key={record.id} className="record-item" data-type={record.type}>

                  <div className="record-icon">{record.icon}</div>
                  <div className="record-content">
                    <span className="record-title">{record.title}</span>
                    <small className="record-location">{record.location}</small>
                  </div>

                  <div className="record-details">
                    <small className="record-date">{record.date}</small>
                    <div className="record-actions">
                      <button className="edit-btn" onClick={() => handleEditClick(record)}>
                        <img src={editIcon} className="icon-img" alt="edit" />
                      </button>
                      <button className="delete-btn" onClick={() => handleDeleteClick(record.id)}>
                        <img src={trashIcon} className="icon-img" alt="delete" />
                      </button>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="no-records">기록이 없습니다.</li>
            )}
          </ul>
        </section>

        {/* 증상 체크 */}
        <section className="health-info">
          <h2 className="hw">건강 이상 징후 체크리스트</h2>
          <p>반려동물에게 해당하는 증상을 모두 선택하고 AI 분석 버튼을 눌러주세요.</p>

          <div className="symptom-grid">
            {symptoms.map((symptom) => (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={selectedSymptoms.includes(symptom) ? "selected" : ""}
              >
                {symptom}
              </button>
            ))}
          </div>

          <button className="analyze-btn" onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? "분석 중..." : "AI 분석하기"}
          </button>
        </section>

        {/* 분석 결과 */}
        {analysisResult && (
          <section className="ai-result-section">
            <h2 className="hw">AI 분석 결과</h2>

            <div className="result-box danger">
              <span className="box-title">
                {analysisResult.illness_name && analysisResult.illness_name !== "의심 질환" 
                  ? `의심 질환 : ${analysisResult.illness_name}` 
                  : "의심 질환"}
              </span>
              <p>{analysisResult.illness_details}</p>
            </div>

            <div className="result-box info">
              <span className="box-title">권장 대처 방안</span>
              <ul>
                {analysisResult.recommendations.map((text, idx) => (
                  <span key={idx}>{text}<br></br></span>
                ))}
              </ul>
            </div>
          </section>
        )}

      </div>

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
                ["Munjun Yang", "Back-End Dev", "munjun0608"],
                ["Youngbin Kang", "Back-End Dev", "0bini"]
              ].map(([name, role, id]) => (
                <div className="col" key={id}>
                  <h3>{name}</h3>
                  <p>{role}</p>
                  <a href={`https://github.com/${id}`} className="github-link">
                    <img src={githubpic} className="github-icon" alt="GitHub" />
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
};

export default Health;