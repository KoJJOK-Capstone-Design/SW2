// src/Community.js
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link, NavLink } from "react-router-dom";
import axios from "axios";
import "./Home.css";
import "./Community.css";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

import searchIcon from "./img/Search_alt.png";
import editIcon from "./img/Edit_fill.png";
// import문
import bell from "./img/bell.png";
import chat from "./img/chat.png";
import circle from "./img/circle.png";
import plusicon from "./img/plusicon.png";

import { getPosts } from "./lib/communityApi";

const PER_PAGE = 4;

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

// 경과 시간 표시용 함수
function timeAgo(iso) {
  if (!iso) return "";

  const created = new Date(iso);
  const diffMs = Date.now() - created.getTime();
  if (Number.isNaN(diffMs)) return "";

  const m = Math.floor(diffMs / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  if (h < 24) return `${h}시간 전`;
  return `${d}일 전`;
}

export default function Community() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState([]);
  
  // 로그인 상태 및 사용자 정보
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userProfileImage, setUserProfileImage] = useState("https://i.pravatar.cc/80?img=11");

  // API에서 게시글 목록 가져오기
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await getPosts();
        // API 응답을 프론트엔드 형식으로 변환
        const mappedPosts = Array.isArray(data) ? data.map((p) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          author: typeof p.author === "object" ? p.author.username || p.author.nickname || "익명" : p.author || "익명",
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          likes: p.like_count || (Array.isArray(p.likes) ? p.likes.length : 0),
          likedBy: Array.isArray(p.likes) ? p.likes : [],
          comments: 0, // 댓글 수는 상세 페이지에서 가져옴
          image: p.image,
        })) : [];
        setPosts(mappedPosts);
      } catch (error) {
        console.error("게시글 목록 로딩 실패:", error);
      }
    };
    loadPosts();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    );
  }, [posts, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const current = filtered.slice(start, start + PER_PAGE);

  // 총 페이지 수가 변할 때 현재 페이지 보정
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [totalPages, page]);

  const [showBellPopup, setShowBellPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);

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

  return (
    <div className="home">
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <img src={logoBlue} alt="paw logo" className="paw" />
            <span className="brand-text">멍냥멍냥</span>
          </div>
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

      <main className="community-container">
        <section className="section">
          {/* 상단: 왼쪽 타이틀 / 오른쪽 검색+글쓰기 묶음 */}
          <div className="comm-header">
            <div className="comm-left">
              <div className="section-title">
                <span className="blue-stick" />
                <h2 className="comm-title-lg">커뮤니티</h2>
              </div>
              <p className="section-sub">
                다른 집사님들과 자유롭게 소통해보세요!
              </p>
            </div>

            <div className="comm-right">
              <div className="comm-toolbar">
                <div className="search-wrap">
                  <img src={searchIcon} alt="" className="search-icon" />
                  <input
                    className="search-input"
                    type="text"
                    placeholder="글 제목, 내용 검색"
                    value={query}
                    onChange={(e) => {
                      setPage(1);
                      setQuery(e.target.value);
                    }}
                  />
                </div>

                <Link className="write-btn" to="/community/write">
                  <img src={editIcon} alt="" className="write-icon" />
                  <span>글쓰기</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 게시글 리스트 */}
          {current.map((p) => (
            <Link
              key={p.id}
              to={`/community/${p.id}`}
              className="post-card link-reset"
            >
              <h3 className="post-title">{p.title}</h3>
              <p className="post-content">{p.content}</p>
              <div className="post-meta">
                <span>
                  {p.author} ·{" "}
                  {timeAgo(p.createdAt) || ""}
                </span>
                <span className="meta-right">
                  좋아요 {p.likes ?? 0}개 댓글{" "}
                  {p.commentsArr?.length ?? p.comments ?? 0}개
                </span>
              </div>
            </Link>
          ))}

          {/* 페이지네이션 */}
          {filtered.length > 0 && (
            <div className="pager" aria-label="페이지네이션">
              <button
                className="pager-btn"
                disabled={page === 1}
                onClick={() =>
                  setPage((p) => Math.max(1, p - 1))
                }
                aria-label="이전 페이지"
              >
                〈
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`pager-num ${
                    page === i + 1 ? "is-active" : ""
                  }`}
                  onClick={() => setPage(i + 1)}
                  aria-current={page === i + 1 ? "page" : undefined}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className="pager-btn"
                disabled={page === totalPages}
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                aria-label="다음 페이지"
              >
                〉
              </button>
            </div>
          )}
        </section>
      </main>

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
                    alt=""
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
                    alt=""
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
                    alt=""
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
                    alt=""
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
                    alt=""
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
                alt="React"
                className="react-icon"
              />
              <img
                src={djangopic}
                alt="Django"
                className="django-icon"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
