// src/HomeLogin.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import axios from "axios";

import "./Home.css";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";
import bell from "./img/bell.png";
import chat from "./img/chat.png";

export default function HomeLogin() {
  const [username, setUsername] = useState("냥냥");

  // ✅ 로그인한 사용자 정보 불러오기
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
          "냥냥";

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

  // ================= 알림(벨) 상태 =================
  const [openNoti, setOpenNoti] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("noti_items");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "n1",
            user: "냥냥편지",
            text: "으로부터 새로운 쪽지가 도착했습니다.",
            time: "5분 전",
            read: false,
            avatarColor: "#dbeafe",
          },
          {
            id: "n2",
            user: "멍멍집사",
            text: "님이 회원님의 게시글에 댓글을 남겼습니다.",
            time: "5분 전",
            read: true,
            avatarColor: "#e5e7eb",
          },
        ];
  });

  const hasUnread = useMemo(
    () => notifications.some((n) => !n.read),
    [notifications]
  );

  useEffect(() => {
    localStorage.setItem("noti_items", JSON.stringify(notifications));
  }, [notifications]);

  const markRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  // 알림 패널 외부 클릭/ESC로 닫기
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

  // ================= JSX =================
  return (
    <div className="home">
      {/* 상단 네비게이션 (Chat 헤더 구조 적용) */}
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <NavLink to="/home">
              <img src={logoBlue} alt="paw logo" className="paw" />
              <span className="brand-text">멍냥멍냥</span>
            </NavLink>
          </div>

          {/* 중앙 메뉴 (Home.js와 같은 구조 유지) */}
          <nav className="menu">
            <NavLink to="/activity">활동</NavLink>
            <NavLink to="/health">건강</NavLink>
            <NavLink to="/calendar">캘린더</NavLink>
            <NavLink to="/community">커뮤니티</NavLink>
          </nav>

          {/* 오른쪽 - 로그인 상태 (프로필 + 알림 + 채팅아이콘) */}
          <nav className="menuicon">
            <Link to="/mypage" className="profile">
              <div className="profile__avatar">
                <img
                  src="https://i.pravatar.cc/80?img=11"
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
                onClick={() => setOpenNoti((v) => !v)}
              >
                <img src={bell} alt="" className="icon" aria-hidden />
                {hasUnread && <span className="bell__dot" aria-hidden />}
              </button>

              {openNoti && (
                <div ref={notiRef} className="noti">
                  <div className="noti__header">
                    <strong>알림</strong>
                    <button
                      className="noti__allread"
                      onClick={markAllRead}
                    >
                      모두 읽음
                    </button>
                  </div>
                  <ul className="noti__list">
                    {notifications.length === 0 && (
                      <li className="noti__empty">알림이 없습니다.</li>
                    )}
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className={`noti__item ${
                          n.read ? "is-read" : "is-unread"
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
                            {!n.read && (
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

            {/* 채팅 이동 아이콘 */}
            <div className="icon-wrapper">
              <button className="icon-btn" aria-label="쪽지">
                <NavLink to="/chat">
                  <img src={chat} alt="채팅 아이콘" className="icon" />
                </NavLink>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* 메인 히어로 영역 (로그인 버전) */}
      <main className="hero">
        <h1 className="title">{username}님, 환영합니다!</h1>
        <p className="subtitle">
          이제 나의 소중한 가족, 반려동물을 등록해볼까요?
        </p>
        <a className="cta" href="/NewFamily">반려동물 등록하기</a>
      </main>

      {/* 푸터 (Home.js와 동일) */}
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
