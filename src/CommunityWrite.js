// src/CommunityWrite.js
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Home.css";
import "./CommunityWrite.css";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";
import bell from "./img/bell.png";
import chat from "./img/chat.png";

import { createPost } from "./lib/communityApi";

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

export default function CommunityWrite() {
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  // 로그인 상태 및 사용자 정보
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userProfileImage, setUserProfileImage] = useState("https://i.pravatar.cc/80?img=11");
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

  // 파일 / 첨부 이미지 정보
  const [files, setFiles] = useState([]);           // File[]
  const [attachments, setAttachments] = useState([]); // { name, size, dataUrl }[]

  const editorRef = useRef(null); // 내용 입력 칸 DOM 참조

  // 내용 입력 시 텍스트만 상태에 저장
  const onEditorInput = (e) => {
    setContent(e.currentTarget.innerText);
  };

  // 파일 선택 시
  const onChangeFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);

    if (list.length === 0) {
      setAttachments([]);
      return;
    }

    // FileReader로 dataURL 만들기
    const readers = list.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ file, dataUrl: reader.result });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((results) => {
      const newAttachments = results.map((r) => ({
        name: r.file.name,
        size: r.file.size,
        dataUrl: r.dataUrl,
      }));
      setAttachments(newAttachments);

      // 에디터 안에 이미지 삽입
      const editor = editorRef.current;
      if (!editor) return;

      newAttachments.forEach((att, index) => {
        const img = document.createElement("img");
        img.src = att.dataUrl;
        img.alt = "첨부 이미지";

        // 이미지 200px 고정
        img.style.width = "200px";
        img.style.height = "auto";
        img.style.display = "block";
        img.style.marginTop = "8px";
        img.style.borderRadius = "8px";
        img.style.cursor = "pointer"; // 삭제 가능함을 표시

        // 이미지에 인덱스 정보 저장 (삭제 시 files 배열에서도 제거하기 위해)
        img.dataset.attachmentIndex = index;

        // 더블클릭 시 이미지 삭제
        img.addEventListener("dblclick", () => {
          const attachmentIndex = parseInt(img.dataset.attachmentIndex);
          
          // files 배열에서 해당 인덱스의 파일 제거
          setFiles((prevFiles) => {
            const newFiles = [...prevFiles];
            newFiles.splice(attachmentIndex, 1);
            return newFiles;
          });
          
          // attachments 배열에서도 제거
          setAttachments((prevAttachments) => {
            const newAttachments = [...prevAttachments];
            newAttachments.splice(attachmentIndex, 1);
            return newAttachments;
          });
          
          // DOM에서 이미지 제거
          img.remove();
          
          // 이미지 삭제 후 텍스트 상태 갱신
          setContent(editor.innerText);
        });

        editor.appendChild(img);
      });

      // 이미지가 들어간 뒤 텍스트 상태 갱신
      setContent(editor.innerText);
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("제목을 입력해 주세요.");
    if (!content.trim()) return alert("내용을 입력해 주세요.");

    try {
      // 첫 번째 이미지 파일만 전송 (API가 단일 이미지만 받는 경우)
      const imageFile = files.length > 0 ? files[0] : null;
      
      const response = await createPost({
        title: title.trim(),
        content: content.trim(),
        image: imageFile,
      });
      
      console.log("게시글 작성 응답:", response);
      console.log("응답 이미지 필드:", {
        image: response?.image,
        image_url: response?.image_url,
        attachment: response?.attachment,
        photo: response?.photo,
        allKeys: response ? Object.keys(response) : [],
      });
      
      nav("/community");
    } catch (error) {
      console.error("게시글 작성 실패:", error);
      alert("게시글 작성에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="home">
      {/* Header */}
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

      {/* Body */}
      <main className="write-container">
        <NavLink to="/community" className="crumb">
          ← 커뮤니티로 돌아가기
        </NavLink>
        <h1 className="write-title">게시글 작성</h1>

        <form className="write-form" onSubmit={onSubmit}>
          {/* 제목 입력 */}
          <input
            className="write-input"
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* 내용 입력: contentEditable로 이미지 들어가게 */}
          <div
            className="write-textarea"
            contentEditable
            ref={editorRef}
            onInput={onEditorInput}
            data-placeholder="내용을 입력하세요..."
          />

          {/* 사진 첨부 */}
          <div className="write-attach-row">
            <span className="attach-label">사진 첨부</span>

            <div className="attach-controls">
              <label className="attach-btn">
                파일 선택
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onChangeFiles}
                />
              </label>
              <span className="attach-hint">
                {files.length === 0
                  ? "선택된 파일 없음"
                  : `${files.length}개 선택됨`}
              </span>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="write-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => nav("/community")}
            >
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              등록
            </button>
          </div>
        </form>
      </main>

      {/* Footer */}
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
                  <img src={githubpic} alt="" className="github-icon" />
                  ouskxk
                </a>
              </div>
              <div className="col">
                <h3>Jiun Ko</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/suerte223" className="github-link">
                  <img src={githubpic} alt="" className="github-icon" />
                  suerte223
                </a>
              </div>
              <div className="col">
                <h3>Seungbeom Han</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/hsb9838" className="github-link">
                  <img src={githubpic} alt="" className="github-icon" />
                  hsb9838
                </a>
              </div>
              <div className="col">
                <h3>Munjin Yang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/munjun0608" className="github-link">
                  <img src={githubpic} alt="" className="github-icon" />
                  munjun0608
                </a>
              </div>
              <div className="col">
                <h3>Youngbin Kang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/0bini" className="github-link">
                  <img src={githubpic} alt="" className="github-icon" />
                  0bini
                </a>
              </div>
            </div>

            <div className="tech-stack">
              <h3>TECH STACK</h3>
              <img src={reactpic} alt="React" className="react-icon" />
              <img src={djangopic} alt="Django" className="django-icon" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
