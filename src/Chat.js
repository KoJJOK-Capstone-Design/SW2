import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import "./Dashboard.css";
import "./Chat.css";

// 이미지 import는 그대로 유지
import editIcon from "./img/Edit_fill.png";
import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";
import bell from "./img/bell.png";
import chat from "./img/chat.png";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";


// =========================================================================
// 📦📦📦 [HEADER.JS로 분리할 코드 모음] 📦📦📦
// 이 블록에 있는 모든 코드를 복사하여 별도의 Header.js 파일에 붙여넣으세요.
// =========================================================================

/**
 * 헬퍼: 이름 결정 로직 (Header와 Chat.js 모두 사용)
 */
const getDisplayName = (user) => {
  const rawNickname = (user?.nickname || "").trim();
  const rawUsername = (user?.username || "").trim();
  const rawId = user?.id != null ? String(user.id) : "";

  return (
    rawNickname || 
    rawUsername || 
    (rawId ? `사용자 ${rawId}` : "냥냥")
  );
};

/**
 * 헬퍼: 시간 포맷 로직 (Header와 Chat.js 모두 사용)
 */
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

/**
 * 헬퍼: 알림 메시지 정리 로직 (Header와 Chat.js 모두 사용)
 * - '닉네임'님으로부터 부분을 제거하고 메시지 내용만 반환
 */
const cleanAlertText = (message) => {
    if (!message) return "새 알림";
    // '닉네임'님으로부터 (메시지)
    const match = message.match(/^'[^']+'님으로부터 (.*)/);

    if (match && match.length > 1) {
        return match[1].trim();
    }
    // 닉네임님으로부터 (메시지) - 홑따옴표 없는 경우
    const matchNoQuote = message.match(/^([^']+)님으로부터 (.*)/);
    if (matchNoQuote && matchNoQuote.length > 2) {
        // 첫 번째 캡처 그룹(닉네임)을 제거한 나머지 텍스트를 반환
        return matchNoQuote[2].trim();
    }

    return message;
};

/**
 * 헬퍼: 메시지에서 닉네임 추출 로직 (Header와 Chat.js 모두 사용)
 */
const extractNickname = (message) => {
    // '닉네임'님으로부터
    let match = message.match(/'([^']+)'님으로부터/);
    if (match) return match[1];

    // 닉네임님으로부터
    match = message.match(/^([^']+)님으로부터/);
    if (match) return match[1];

    return null;
};

/**
 * Header 컴포넌트 (이 함수를 Header.js의 default export로 사용하세요)
 * @param {object} props 
 * @param {string} props.username 현재 로그인한 사용자 닉네임
 * @param {boolean} props.openNoti 알림창 열림 상태
 * @param {function} props.setOpenNoti 알림창 상태 변경 함수
 * @param {boolean} props.hasNewNotification 새 알림 여부 (빨간 점 표시용)
 * @param {Array<object>} props.notifications 알림 목록
 * @param {boolean} props.loadingNoti 알림 로딩 상태
 * @param {boolean} props.hasUnreadInList 목록 내 읽지 않은 알림 존재 여부
 * @param {function} props.markAllRead 모든 알림 읽음 처리 함수
 * @param {function} props.markRead 특정 알림 읽음 처리 함수
 * @param {React.Ref} props.notiBtnRef 알림 버튼 Ref
 * @param {React.Ref} props.notiRef 알림창 컨테이너 Ref
 * @param {function} props.setShowChatPopup 채팅 팝업 상태 변경 (Chat.js에서는 false 고정)
 */
function HeaderComponent({
  username, openNoti, setOpenNoti, hasNewNotification, notifications, loadingNoti, 
  hasUnreadInList, markAllRead, markRead, notiBtnRef, notiRef, setShowChatPopup,
  userProfileImage
}) {
  // Chat.js에서 이미지를 import 했으므로 여기서는 props로 넘겨받지 않고 직접 사용
  // 만약 Header.js로 옮긴다면, 이 이미지들을 Header.js에서도 import 해야 합니다.
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="brand">
          <a href="./dashboard">
            <img src={logoBlue} alt="paw logo" className="paw" />
            <span className="brand-text">멍냥멍냥</span>
          </a>
        </div>

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
              <img
                src={userProfileImage || "https://i.pravatar.cc/80?img=11"}
                alt="프로필"
              />
            </div>
            <span className="profile__name">{username}</span>
          </Link>

          {/* 알림 벨 */}
          <div className="icon-wrapper bell">
            <button
              ref={notiBtnRef}
              className="icon-btn bell__btn"
              aria-label="알림"
              onClick={() => {
                setOpenNoti((v) => !v);
                setShowChatPopup(false);
              }}
            >
              <img src={bell} alt="" className="icon" aria-hidden />
              {/* 새 알림 표시 (빨간 점) */}
              {hasNewNotification && <span className="bell__dot" aria-hidden />} 
            </button>

            {openNoti && (
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
                  {!loadingNoti && notifications.map((n) => (
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
                          {/* 굵은 글씨: 발신자 닉네임/ID */}
                          <b>{n.user}</b>
                          {/* 일반 글씨: 정리된 메시지 내용 */}
                          <span>{n.text}</span>
                        </div>
                        <div className="noti__meta">
                          <span className="noti__time">
                            {n.time}
                          </span>
                          {!n.is_read && (
                            <span className="noti__badge">
                              안 읽음
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 채팅 아이콘 */}
          <div className="icon-wrapper">
            <button className="icon-btn">
              <a href="./Chat">
                <img src={chat} alt="채팅 아이콘" className="icon" />
              </a>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

// =========================================================================
// 📦📦📦 [Header.js로 분리할 코드 모음 끝] 📦📦📦
// =========================================================================


// ===================== 헬퍼: Interval Custom Hook (Chat.js에 남겨둠) =====================
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
// ==========================================================

export default function Chat() {
  // (기존 헬퍼 함수들은 Chat 컴포넌트 내부에 그대로 유지)
  const makeDisplayTime = (sentAt) => {
    if (!sentAt) return "";
    const d = new Date(sentAt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ===================== 로그인 유저 정보 =====================
  const [currentUser, setCurrentUser] = useState(null); 
  const [username, setUsername] = useState("멍냥");
  const [userProfileImage, setUserProfileImage] = useState("https://i.pravatar.cc/80?img=11"); 

  // ===================== 쪽지/스레드 상태 =====================
  const [threads, setThreads] = useState([]); 
  const [selectedId, setSelectedId] = useState(null);
  const selected = useMemo(
    () => threads.find((t) => t.id === selectedId),
    [threads, selectedId]
  );

  const [loadingMessages, setLoadingMessages] = useState(true);
  const [dmError, setDmError] = useState("");

  // ===================== 헤더 알림 상태 (API 연동) =====================
  const [openNoti, setOpenNoti] = useState(false);
  const [notifications, setNotifications] = useState([]); 
  const [loadingNoti, setLoadingNoti] = useState(false);

  // '새로운' 알림이 도착했는지 여부를 나타내는 상태 (빨간 점 표시용)
  const [hasNewNotification, setHasNewNotification] = useState(false); 

  // '읽지 않은' 알림이 하나라도 있으면 true (모두 읽음 버튼 활성화용)
  const hasUnreadInList = useMemo(
    () => notifications.some((n) => !n.is_read), 
    [notifications]
  );

  // 마지막으로 알려준 알림 목록의 ID 배열을 저장하는 Ref
  const lastKnownNotiIds = useRef(new Set()); 


  const notiBtnRef = useRef(null);
  const notiRef = useRef(null);
  useEffect(() => {
    if (!openNoti) return;
    const onClick = (e) => {
      if (
        notiRef.current &&
        !notiRef.current.contains(e.target) &&
        notiBtnRef.current &&
        !notiBtnRef.current.contains(e.target)
      ) {
        setOpenNoti(false);
        // 알림창 닫을 때 빨간색 뱃지 해제
        setHasNewNotification(false);
      }
    };
    const onEsc = (e) => e.key === "Escape" && setOpenNoti(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [openNoti]);


  // ===================== 🚨 새로 추가된 함수: 서버에 알림 읽음 상태 반영 🚨 =====================
  
  /** 서버에 특정 알림을 읽음 처리 요청 */
  /** 서버에 특정 알림을 읽음 처리 요청 */
const markNotificationAsReadOnServer = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
        // ❌ 기존: PATCH .../notifications/${id}/
        // ✅ 수정: POST .../notifications/${id}/read/
        await axios.post(
            `https://youngbin.pythonanywhere.com/api/v1/notifications/${id}/read/`,
            {}, // body 비워둠 (백엔드에서 필요 없음)
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✅ 알림 ${id} 서버에 읽음 처리 완료`);
    } catch (err) {
        console.error(`❌ 알림 ${id} 서버 읽음 처리 실패:`, err.response?.status, err.message);
    }
};

/** 서버에 모든 알림을 읽음 처리 요청 */
const markAllNotificationsReadOnServer = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
        // ❌ 기존: .../mark_all_read/
        // ✅ 수정: .../read-all/
        await axios.post(
            "https://youngbin.pythonanywhere.com/api/v1/notifications/read-all/",
            {}, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("✅ 모든 알림 서버에 읽음 처리 완료");
    } catch (err) {
        console.error("❌ 모든 알림 서버 읽음 처리 실패:", err.response?.status, err.message);
    }
};
  // ===================== 🚨 수정된 함수: 클라이언트 상태 업데이트 후 서버 통신 추가 🚨 =====================

  const markRead = (id) => {
    // 1. 클라이언트 상태 업데이트 (UI 즉시 반영)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    // 2. 서버에 읽음 상태 반영 (새로고침 시 유지)
    markNotificationAsReadOnServer(id); 
  };
  
  const markAllRead = () => {
    // 1. 클라이언트 상태 업데이트 (UI 즉시 반영)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    // 모두 읽음 처리 시 빨간색 뱃지 해제
    setHasNewNotification(false);
    // 2. 서버에 읽음 상태 반영 (새로고침 시 유지)
    markAllNotificationsReadOnServer(); 
  }

  // ===================== 알림 API 호출 함수 (중복/발신자 오류 해결 로직 적용) =====================
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return; 

    console.log("🔔 알림 Polling 시작:", new Date().toLocaleTimeString());

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(
        "https://youngbin.pythonanywhere.com/api/v1/notifications/",
        { headers }
      );

      const rawNotifications = Array.isArray(res.data) 
        ? res.data 
        : res.data.results || [];
      
      const mappedNotifications = rawNotifications.map(n => {
        // 1. 발신자 이름 결정 (n.user에 들어갈 굵은 글씨)
        const senderName = 
          (n.sender_nickname && n.sender_nickname.trim())
          ? n.sender_nickname.trim() // 1순위: API 제공 닉네임
          : n.sender_id
            ? `사용자 ${n.sender_id}` // 2순위: 사용자 ID
            : extractNickname(n.message || "") || "알 수 없는 사용자"; // 3순위: 메시지에서 추출 또는 최종 대체
        
        // 2. 메시지 내용 정리 (중복 제거)
        const cleanedText = cleanAlertText(n.message);

        return {
          id: n.id,
          user: senderName, // 👈 굵은 글씨로 표시될 닉네임
          text: cleanedText, // 👈 중복이 제거된 메시지 내용
          time: getTimeAgo(n.created_at), 
          rawTime: n.created_at,
          is_read: n.is_read,
          avatarColor: n.is_read ? "#e5e7eb" : "#dbeafe", 
        };
      });

      // 🚨 최종 수정: 중복 알림 필터링 로직 강화 🚨
      const uniqueNotifications = mappedNotifications.reduce((acc, current) => {
          
          // 5초 이내에 도착한 모든 이전 알림을 확인
          const isDuplicate = acc.some(item => 
              Math.abs(new Date(item.rawTime) - new Date(current.rawTime)) < 5000 && 
              (
                // Case 1: 알림의 발신자가 같고 메시지 내용이 완전히 같을 때 (일반 중복)
                (item.user === current.user && item.text === current.text) ||

                // Case 2: '알 수 없는 사용자' 알림 (중복 세트의 불필요한 알림)
                // 현재 알림이 '알 수 없는 사용자' 또는 내용이 불완전할 때, 
                // 5초 이내에 도착한 유효한 발신자의 알림이 이미 목록에 있고
                // 현재 알림의 텍스트에 유효한 발신자 이름이 포함되어 있으면 중복으로 간주
                (
                    (current.user === "알 수 없는 사용자" || current.text === "새 쪽지가 도착했습니다.") && 
                    item.user !== "알 수 없는 사용자" && 
                    current.text.includes(item.user) 
                )
              )
          );
          
          if (!isDuplicate) {
              acc.push(current);
          }
          return acc;
      }, []);


      uniqueNotifications.sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime));

      // 🔔🔔🔔 새 알림 도착 여부 판단 🔔🔔🔔
      const newNotiIds = new Set(uniqueNotifications.map(n => n.id));
      
      const newlyArrivedUnread = uniqueNotifications.some(n => 
        !n.is_read && // 읽지 않았고
        !lastKnownNotiIds.current.has(n.id) // 이전에 없던 알림인 경우
      );

      if (newlyArrivedUnread) {
          setHasNewNotification(true);
      }
      
      lastKnownNotiIds.current = newNotiIds;
      setNotifications(uniqueNotifications);
      
      console.log("✅ 알림 Polling 성공, 총 알림 수:", uniqueNotifications.length);

    } catch (err) {
      console.error("❌ 알림 Polling 실패:", err.response?.status, err.message);
    } finally {
      setLoadingNoti(false);
    }
  }, []);

  // 10초마다 알림을 새로고침 (Polling)
  useInterval(() => {
    if (openNoti) {
        console.log("🔔 알림창 열림: Polling Skip");
        return;
    }
    fetchNotifications();
  }, 10000); 

  // (이하 생략: showChatPopup, search, draft, isComposing, recipient, recipientQuery, userSuggestions 상태는 그대로 유지)
  const [showChatPopup, setShowChatPopup] = useState(false); 

  // ===================== 검색 / 작성 상태 =====================
  const [search, setSearch] = useState(""); 
  const [draft, setDraft] = useState(""); 

  // 새 쪽지 모드
  const [isComposing, setIsComposing] = useState(false);
  const [recipient, setRecipient] = useState(null); 
  const [recipientQuery, setRecipientQuery] = useState(""); 
  const [userSuggestions, setUserSuggestions] = useState([]); 

  const filteredThreads = useMemo(
    () =>
      threads.filter((t) =>
        (t.name + (t.preview || ""))
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [threads, search]
  );

  // 스크롤 맨 아래 고정
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, selected?.messages.length]);


  // ===================== 프로필 이미지 로드 =====================
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // LocalStorage에서 저장된 프로필 이미지 URL을 먼저 확인
    const storedImageUrl = localStorage.getItem("user_profile_image_url");
    if (storedImageUrl) {
      setUserProfileImage(storedImageUrl);
    }
    
    if (token) {
      axios
        .get("https://youngbin.pythonanywhere.com/api/v1/users/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
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
        });
    }
  }, []);

  // ===================== 프로필 + 쪽지 + 최초 알림 API 호출 =====================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setDmError("로그인이 필요합니다. 다시 로그인 후 이용해주세요.");
      setLoadingMessages(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = async () => {
      try {
        setLoadingMessages(true);
        setDmError("");

        const [userRes, msgRes] = await Promise.all([
          axios.get(
            "https://youngbin.pythonanywhere.com/api/v1/users/profile/",
            { headers }
          ),
          axios.get(
            "https://youngbin.pythonanywhere.com/api/v1/messages/",
            { headers }
          ),
        ]);

        const user = userRes.data;
        setCurrentUser(user);

        setUsername(getDisplayName(user));
        
        // 프로필 이미지 업데이트 (API 응답에서)
        const apiImageUrl = user?.profile_image || user?.avatar || user?.user_profile_image_url;
        if (apiImageUrl) {
          const finalImageUrl = apiImageUrl.startsWith("http")
            ? apiImageUrl
            : `https://youngbin.pythonanywhere.com${apiImageUrl}`;
          setUserProfileImage(finalImageUrl);
          localStorage.setItem("user_profile_image_url", finalImageUrl);
        }

        // 최초 알림 로딩 시에는 loadingNoti 상태를 사용
        setLoadingNoti(true);
        try {
            const notiRes = await axios.get(
              "https://youngbin.pythonanywhere.com/api/v1/notifications/",
              { headers }
            );

            const rawNotifications = Array.isArray(notiRes.data) 
              ? notiRes.data 
              : notiRes.data.results || [];
            
            const mappedNotifications = rawNotifications.map(n => {
                // 1. 발신자 이름 결정 (n.user에 들어갈 굵은 글씨)
                const senderName = 
                  (n.sender_nickname && n.sender_nickname.trim())
                  ? n.sender_nickname.trim() // 1순위: API 제공 닉네임
                  : n.sender_id
                    ? `사용자 ${n.sender_id}` // 2순위: 사용자 ID
                    : extractNickname(n.message || "") || "알 수 없는 사용자"; // 3순위: 메시지에서 추출 또는 최종 대체
                
                // 2. 메시지 내용 정리 (중복 제거)
                const cleanedText = cleanAlertText(n.message);

                return {
                  id: n.id,
                  user: senderName, 
                  text: cleanedText, // 👈 중복이 제거된 메시지 내용
                  time: getTimeAgo(n.created_at), 
                  rawTime: n.created_at,
                  is_read: n.is_read,
                  avatarColor: n.is_read ? "#e5e7eb" : "#dbeafe", 
                };
              });

            // 🚨 최종 수정: 중복 알림 필터링 로직 강화 (fetchNotifications와 동일하게 적용)
            const uniqueNotifications = mappedNotifications.reduce((acc, current) => {
                const isDuplicate = acc.some(item => 
                    Math.abs(new Date(item.rawTime) - new Date(current.rawTime)) < 5000 && 
                    (
                        (item.user === current.user && item.text === current.text) ||
                        (
                            (current.user === "알 수 없는 사용자" || current.text === "새 쪽지가 도착했습니다.") && 
                            item.user !== "알 수 없는 사용자" && 
                            current.text.includes(item.user) 
                        )
                    )
                );
                
                if (!isDuplicate) {
                    acc.push(current);
                }
                return acc;
            }, []);

            uniqueNotifications.sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime));

            // 최초 로딩 시, 읽지 않은 알림이 있으면 뱃지 표시
            if (uniqueNotifications.some(n => !n.is_read)) {
                setHasNewNotification(true);
            }

            // 최초 알림 ID 세트 저장
            lastKnownNotiIds.current = new Set(uniqueNotifications.map(n => n.id));

            setNotifications(uniqueNotifications);
        } catch (err) {
            console.error("❌ 최초 알림 로딩 실패:", err.response?.status, err.message);
        } finally {
            setLoadingNoti(false);
        }
        
        const meId = String(user.id);
        const messages = Array.isArray(msgRes.data)
          ? msgRes.data
          : msgRes.data.results || [];

        // (이하 생략: 메시지 스레드 그룹화 로직은 그대로 유지)
        const threadsMap = {};

        messages.forEach((msg) => {
          const isMeSender = String(msg.sender) === meId;

          const partnerIdRaw = isMeSender ? msg.receiver : msg.sender;
          const partnerId =
            partnerIdRaw !== null && partnerIdRaw !== undefined
              ? String(partnerIdRaw)
              : "unknown";

          const partnerInfo = isMeSender
            ? {
                nickname: msg.receiver_nickname,
                username: msg.receiver_username, 
                id: msg.receiver,
              }
            : {
                nickname: msg.sender_nickname,
                username: msg.sender_username, 
                id: msg.sender,
              };

          const nick = getDisplayName(partnerInfo);


          if (!threadsMap[partnerId]) {
            threadsMap[partnerId] = {
              id: partnerId,
              name: nick,
              avatar: {
                bg: "#e2e8f0",
                text: nick[0] || "친",
              },
              messages: [],
              preview: "",
            };
          }

          threadsMap[partnerId].messages.push({
            id: msg.id,
            from: isMeSender ? "me" : "them",
            text: msg.content,
            at: makeDisplayTime(msg.sent_at),
            rawTime: msg.sent_at,
            is_read: msg.is_read,
          });
        });

        const threadsArr = Object.values(threadsMap);

        threadsArr.forEach((t) => {
          t.messages.sort(
            (a, b) =>
              new Date(a.rawTime).getTime() -
              new Date(b.rawTime).getTime()
          );
          const last = t.messages[t.messages.length - 1];
          t.preview = last ? last.text : "";
        });

        threadsArr.sort((a, b) => {
          const at =
            a.messages[a.messages.length - 1]?.rawTime || 0;
          const bt =
            b.messages[b.messages.length - 1]?.rawTime || 0;
          return new Date(bt).getTime() - new Date(at).getTime();
        });

        setThreads(threadsArr);
        setSelectedId(threadsArr[0]?.id || null);
      } catch (err) {
        console.error(
          "데이터 불러오기 실패:",
          err.response?.status,
          err.response?.data || err.message
        );
        if (err.response?.status === 401) {
          setDmError("로그인 정보가 만료되었습니다. 다시 로그인해주세요.");
        } else {
          setDmError("데이터를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchAll();
  }, [fetchNotifications]); 

  // (이하 생략: 유저 검색, 새 쪽지 모드, 메시지 전송 로직은 그대로 유지)

  // ===================== 새 쪽지: 유저 검색 API =====================
  useEffect(() => {
    const q = recipientQuery.trim();
    if (!q) {
      setUserSuggestions([]);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        const res = await axios.get(
          "https://youngbin.pythonanywhere.com/api/v1/users/search/",
          {
            params: { q }, 
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );

        const raw = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];

        const meId = currentUser ? String(currentUser.id) : null;

        const mapped = raw
          .filter((u) => (meId ? String(u.id) !== meId : true))
          .map((u) => {
            const displayName = getDisplayName(u);

            return {
              id: String(u.id),
              name: displayName,
              avatar: {
                bg: "#e2e8f0",
                text: displayName[0] || "친",
              },
            };
          });

        setUserSuggestions(mapped);
      } catch (err) {
        if (err.name === "CanceledError") return;
        console.error("유저 검색 실패:", err.response?.data || err.message);
        setUserSuggestions([]);
      }
    };

    fetchUsers();

    return () => controller.abort();
  }, [recipientQuery, currentUser]);

  // ===================== 새 쪽지 모드 =====================
  const startCompose = () => {
    setIsComposing(true);
    setSelectedId(null); 
    setRecipient(null);
    setRecipientQuery("");
    setDraft("");
  };

  const cancelCompose = () => {
    setIsComposing(false);
    setRecipient(null);
    setRecipientQuery("");
    setDraft(""); 
    if (threads.length > 0) {
      setSelectedId(threads[0].id);
    }
  };

  const pickRecipient = (r) => {
    setRecipient(r);
    setUserSuggestions([]); 
  };

  // ===================== 공통 메시지 전송 함수 (POST /messages/) =====================
  const postMessage = async (receiverId, text, headers) => {
    const res = await axios.post(
      "https://youngbin.pythonanywhere.com/api/v1/messages/",
      {
        receiver: receiverId,
        content: text,
      },
      { headers }
    );

    const msg = res.data;

    const msgItem = {
      id: msg.id,
      from: "me",
      text: msg.content,
      at: makeDisplayTime(msg.sent_at),
      rawTime: msg.sent_at,
      is_read: msg.is_read,
    };

    return { msg, msgItem };
  };

  // ===================== 전송 =====================
  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // ---- 새 쪽지 모드 ----
    if (isComposing) {
      if (!recipient || !recipient.id) {
        alert("받는 사람을 선택해주세요.");
        return;
      }

      const receiverId = recipient.id;

      try {
        const { msg, msgItem } = await postMessage(
          receiverId,
          text,
          headers
        );

        setThreads((prev) => {
          let exists = false;
          let updated = prev.filter((t) => t.id !== String(receiverId)); 

          const existingThread = prev.find((t) => t.id === String(receiverId));
          if (existingThread) {
            exists = true;
            const updatedThread = {
              ...existingThread,
              messages: [...existingThread.messages, msgItem],
              preview: msgItem.text,
            };
            updated.unshift(updatedThread);
          }

          if (!exists) {
            const nick = getDisplayName({
                nickname: msg.receiver_nickname || recipient.name,
                username: msg.receiver_username,
                id: receiverId
            });

            const newThread = {
              id: String(receiverId),
              name: nick,
              avatar: {
                bg: "#e2e8f0",
                text: nick[0] || "친",
              },
              messages: [msgItem],
              preview: msgItem.text,
            };

            updated.unshift(newThread); 
          }

          return updated;
        });

        setSelectedId(String(receiverId));
        setIsComposing(false);
        setRecipient(null);
        setRecipientQuery("");
        setDraft("");
      } catch (err) {
        console.error(
          "쪽지 전송 실패:",
          err.response?.data || err.message
        );
        alert("쪽지 전송에 실패했습니다.");
      }

      return;
    }

    // ---- 기존 대화방에서 전송 ----
    if (!selected) return;

    const receiverId = selected.id;

    try {
      const { msgItem } = await postMessage(receiverId, text, headers);

      setThreads((prev) => {
        let sentThread = null;
        const otherThreads = prev.filter(t => {
            if (t.id === String(receiverId)) {
                sentThread = {
                    ...t,
                    messages: [...t.messages, msgItem],
                    preview: msgItem.text,
                };
                return false;
            }
            return true;
        });
        
        return [sentThread, ...otherThreads].filter(Boolean);
      });

      setDraft("");
    } catch (err) {
      console.error(
        "쪽지 전송 실패:",
        err.response?.data || err.message
      );
      alert("쪽지 전송에 실패했습니다.");
    }
  };

  // ===================== 렌더링 =====================
  return (
    <div className="app">
      {/* Header 컴포넌트 사용. 실제 사용 시 HeaderComponent 대신 import한 Header를 사용하세요. */}
      {/* 예: <Header 
               username={username}
               ...
            /> 
      */}
      <HeaderComponent
        username={username}
        openNoti={openNoti}
        setOpenNoti={setOpenNoti}
        hasNewNotification={hasNewNotification}
        notifications={notifications}
        loadingNoti={loadingNoti}
        hasUnreadInList={hasUnreadInList}
        markAllRead={markAllRead}
        markRead={markRead}
        notiBtnRef={notiBtnRef}
        notiRef={notiRef}
        setShowChatPopup={setShowChatPopup} // Chat.js에서는 false 고정으로 사용
        userProfileImage={userProfileImage}
      />
      
      {/* (이하 생략: main, footer는 기존 코드 그대로 유지) */}
      <main className="dm">
        {/* 좌측: 쪽지함 */}
        <aside className="inbox">
          <div className="inbox__title">
            <p className="message">쪽지함</p>
            <button
              className="icon-btn"
              aria-label="새 쪽지"
              onClick={startCompose}
            >
              <img className="icon-img" src={editIcon} alt="새 쪽지" />
            </button>
          </div>

          <label className="search">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="search__icon"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색"
            />
          </label>

          {loadingMessages ? (
            <div className="inbox__loading">쪽지 불러오는 중...</div>
          ) : dmError ? (
            <div className="inbox__error">{dmError}</div>
          ) : threads.length === 0 && !isComposing ? (
            <div className="inbox__empty">
              아직 주고받은 쪽지가 없어요.
            </div>
          ) : (
            <ul className="threadlist">
              {filteredThreads.map((t) => (
                <li
                  key={t.id}
                  className={
                    "thread" + (t.id === selectedId && !isComposing ? " is-active" : "")
                  }
                  onClick={() => {
                    setSelectedId(t.id);
                    setIsComposing(false);
                  }}
                >
                  <div
                    className="avatar"
                    style={{ background: t.avatar.bg }}
                  >
                    {t.avatar.text}
                  </div>
                  <div className="thread__meta">
                    <div className="thread__name">{t.name}</div>
                    <div className="thread__preview">
                      {t.preview}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* 우측: 대화/작성 영역 */}
        <section className="chat">
          {loadingMessages ? (
            <div className="empty">
              <p className="empty__hint">쪽지를 불러오는 중입니다...</p>
            </div>
          ) : dmError ? (
            <div className="empty">
              <p className="empty__hint">{dmError}</p>
            </div>
          ) : isComposing ? (
            <>
              {/* 새 쪽지 모드 */}
              {!recipient ? (
                // 1. 받는 사람 검색
                <div className="compose">
                  <div className="compose__title">받는 사람 검색</div>
                  <input
                    className="compose__search"
                    placeholder="닉네임 또는 아이디를 입력하세요."
                    value={recipientQuery}
                    onChange={(e) =>
                      setRecipientQuery(e.target.value)
                    }
                  />
                  <ul className="compose__suggest">
                    {userSuggestions.map((s) => (
                      <li
                        key={s.id}
                        className="compose__item"
                        onClick={() => pickRecipient(s)}
                      >
                        <span
                          className="compose__avatar"
                          style={{ background: s.avatar?.bg }}
                        >
                          {s.avatar?.text || s.name[0]}
                        </span>
                        <span className="compose__name">
                          {s.name}
                        </span>
                      </li>
                    ))}

                    {userSuggestions.length === 0 &&
                      recipientQuery.trim() && (
                        <li className="compose__empty">
                          검색 결과가 없습니다.
                        </li>
                      )}
                  </ul>
                  <button
                    className="compose__cancel"
                    onClick={cancelCompose}
                  >
                    취소
                  </button>
                </div>
              ) : (
                // 2. 받는 사람 선택 완료 및 메시지 작성 준비
                <>
                  <div className="compose__header">
                    <span
                      className="compose__avatar"
                      style={{ background: recipient.avatar?.bg }}
                    >
                      {recipient.avatar?.text ||
                        recipient.name[0]}
                    </span>
                    <div className="compose__to">
                      <div className="compose__to-label">
                        받는 사람
                      </div>
                      <div className="compose__to-name">
                        {recipient.name}
                      </div>
                    </div>
                    <button
                      className="compose__cancel--link"
                      onClick={() => setRecipient(null)} // 다시 검색 모드로
                    >
                      다시 선택
                    </button>
                  </div>

                  <div className="empty">
                    <p className="empty__hint">
                      **{recipient.name}**님과의 대화를 시작해보세요.
                    </p>
                  </div>
                </>
              )}

              {/* 새 쪽지 입력 창 */}
              <div className="composer">
                <input
                  className="composer__input"
                  placeholder={
                    recipient
                      ? "메시지 보내기…"
                      : "받는 사람을 먼저 선택하세요"
                  }
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={!recipient}
                />
                <button
                  className="composer__send"
                  onClick={handleSend}
                  disabled={!recipient || !draft.trim()}
                >
                  전송
                </button>
              </div>
            </>
          ) : !selected ? (
            <div className="empty">
              <p className="empty__hint">
                {threads.length === 0
                  ? "아직 대화가 없습니다. 새 쪽지를 보내 대화를 시작해보세요."
                  : "쪽지함에서 대화할 상대를 선택하세요."}
              </p>
            </div>
          ) : selected.messages.length === 0 ? (
            <div className="empty">
              <p className="empty__hint">
                **{selected.name}**님과의 새로운 대화를 시작해보세요.
              </p>
            </div>
          ) : (
            // 기존 대화방
            <>
              <ul className="messages">
                {selected.messages.map((m, i) => {
                  const prev = selected.messages[i - 1];
                  const isThem = m.from === "them";
                  const showProfile =
                    isThem && (!prev || prev.from !== "them");
                  return (
                    <li
                      key={m.id}
                      className={
                        "msg " + (isThem ? "msg--them" : "msg--me")
                      }
                    >
                      {isThem ? (
                        <>
                          <div
                            className={
                              "msg__avatar" +
                              (showProfile ? "" : " is-hidden")
                            }
                            style={{ background: selected.avatar.bg }}
                          >
                            {selected.avatar.text}
                          </div>
                          <div className="msg__content">
                            {showProfile && (
                              <div className="msg__name">
                                {selected.name}
                              </div>
                            )}
                            <div className="msg__row">
                              <span className="msg__bubble">
                                {m.text}
                              </span>
                            </div>
                            <span className="msg__time">
                              {m.at}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="msg__content msg__content--me">
                          <span className="msg__time">{m.at}</span>
                          <div className="msg__row">
                            <span className="msg__bubble">
                              {m.text}
                            </span>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
                <div ref={messagesEndRef} />
              </ul>

              <div className="composer">
                <input
                  className="composer__input"
                  placeholder="메시지 보내기..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  className="composer__send"
                  onClick={handleSend}
                  disabled={!draft.trim()}
                >
                  전송
                </button>
              </div>
            </>
          )}
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
                  />{" "}
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
                  />{" "}
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
                  />{" "}
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
                  />{" "}
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
                  />{" "}
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