import React, { useState, useEffect, useRef, useMemo } from "react";
import "./Dashboard.css";
import "./Chat.css";

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

export default function Chat() {
  // ✅ 알림 상태
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
  const hasUnread = useMemo(() => notifications.some((n) => !n.read), [notifications]);

  useEffect(() => {
    localStorage.setItem("noti_items", JSON.stringify(notifications));
  }, [notifications]);

  const markRead = (id) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  // 패널 외부 클릭/ESC로 닫기
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

  // 기존 팝업(채팅용) — 그대로 두고, 벨은 새 패널 사용
  const [showChatPopup, setShowChatPopup] = useState(false);

  // ------------------ DM(쪽지함) 기존 코드 ------------------
  const [threads, setThreads] = useState([
    {
      id: "t1",
      name: "냥냥편지",
      preview: "안녕하세요",
      avatar: { bg: "#d9f99d", text: "냥" },
      messages: [
        { id: "m1", from: "them", text: "안녕하세요", at: "어제" },
        { id: "m2", from: "me", text: "안녕하세요", at: "오후 10:23" },
      ],
    },
    {
      id: "t2",
      name: "멍돌이주인",
      preview: "사진 보냈어요",
      avatar: { bg: "#fecdd3", text: "멍" },
      messages: [],
    },
  ]);

  const [selectedId, setSelectedId] = useState("t1");
  const selected = useMemo(
    () => threads.find((t) => t.id === selectedId),
    [threads, selectedId]
  );

  const [isComposing, setIsComposing] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipient, setRecipient] = useState(null);

  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");

  const suggestions = useMemo(
    () =>
      threads
        .map((t) => ({ name: t.name, avatar: t.avatar }))
        .filter((s) => s.name.toLowerCase().includes(recipientQuery.toLowerCase())),
    [threads, recipientQuery]
  );

  const filtered = useMemo(
    () =>
      threads.filter((t) =>
        (t.name + (t.preview || "")).toLowerCase().includes(search.toLowerCase())
      ),
    [threads, search]
  );

  // 스크롤 맨 아래 고정
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, selected?.messages.length]);

  // 작성/전송
  const startCompose = () => {
    setIsComposing(true);
    setRecipient(null);
    setRecipientQuery("");
    setDraft("");
  };
  const cancelCompose = () => {
    setIsComposing(false);
    setRecipient(null);
    setRecipientQuery("");
  };
  const pickRecipient = (r) => setRecipient(r);

  const handleSend = () => {
    if (!draft.trim()) return;

    if (isComposing) {
      if (!recipient) return;

      let thread = threads.find((t) => t.name === recipient.name);
      let threadId = thread?.id;

      if (!thread) {
        threadId = "t" + (Date.now() % 100000);
        thread = {
          id: threadId,
          name: recipient.name,
          preview: "",
          avatar: recipient.avatar || {
            bg: "#e9e9e9",
            text: recipient.name?.[0] || "친",
          },
          messages: [],
        };
        setThreads((prev) => [...prev, thread]);
      }

      const msg = {
        id: "m" + Date.now(),
        from: "me",
        text: draft.trim(),
        at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, messages: [...t.messages, msg], preview: msg.text } : t
        )
      );

      setSelectedId(threadId);
      setIsComposing(false);
      setRecipient(null);
      setRecipientQuery("");
      setDraft("");
      return;
    }

    const msg = {
      id: "m" + Date.now(),
      from: "me",
      text: draft.trim(),
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === selectedId ? { ...t, messages: [...t.messages, msg], preview: msg.text } : t
      )
    );
    setDraft("");
  };

  return (
    <div className="app">
      {/* 헤더 */}
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <a href='./dashboard'>
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
            <div className="profile">
              <div className="profile__avatar">
                <img
                  src="https://i.pravatar.cc/80?img=11" // 테스트용 랜덤 이미지
                  alt="프로필"
                />
              </div>
              <span className="profile__name">냥냥</span>
            </div>
            {/* ✅ 알림 벨 */}
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
                {hasUnread && <span className="bell__dot" aria-hidden />}
              </button>

              {openNoti && (
                <div ref={notiRef} className="noti">
                  <div className="noti__header">
                    <strong>알림</strong>
                    <button className="noti__allread" onClick={markAllRead}>
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
                        className={`noti__item ${n.read ? "is-read" : "is-unread"}`}
                        onClick={() => markRead(n.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && markRead(n.id)}
                        title="클릭하면 읽음 처리"
                      >
                        <div className="noti__avatar" style={{ background: n.avatarColor }} />
                        <div className="noti__body">
                          <div className="noti__text">
                            <b>{n.user}</b>
                            <span>{n.text}</span>
                          </div>
                          <div className="noti__meta">
                            <span className="noti__time">{n.time}</span>
                            {!n.read && <span className="noti__badge">안 읽음</span>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 기존 채팅 팝업(간단 안내) */}
            <div className="icon-wrapper">
              <button className="icon-btn">
                <a href='./Chat'>
                  <img src={chat} alt="채팅 아이콘" className="icon" />
                </a>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* 본문 */}
      <main className="dm">
        {/* 좌측: 쪽지함 */}
        <aside className="inbox">
          <div className="inbox__title">
            <p className="message">쪽지함</p>
            <button className="icon-btn" aria-label="새 쪽지" onClick={startCompose}>
              <img className="icon-img" src={editIcon} alt="새 쪽지" />
            </button>
          </div>

          <label className="search">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="search__icon" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색"
            />
          </label>

          <ul className="threadlist">
            {filtered.map((t) => (
              <li
                key={t.id}
                className={"thread" + (t.id === selectedId ? " is-active" : "")}
                onClick={() => {
                  setSelectedId(t.id);
                  setIsComposing(false);
                }}
              >
                <div className="avatar" style={{ background: t.avatar.bg }}>
                  {t.avatar.text}
                </div>
                <div className="thread__meta">
                  <div className="thread__name">{t.name}</div>
                  <div className="thread__preview">{t.preview}</div>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* 우측: 대화/작성 */}
        <section className="chat">
          {isComposing ? (
            <>
              {!recipient ? (
                <div className="compose">
                  <div className="compose__title">받는 사람 검색</div>
                  <input
                    className="compose__search"
                    placeholder="사용자 이름을 입력하세요."
                    value={recipientQuery}
                    onChange={(e) => setRecipientQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const first = suggestions[0];
                        if (first) pickRecipient(first);
                        else
                          pickRecipient({
                            name: recipientQuery.trim(),
                            avatar: {
                              bg: "#e2e8f0",
                              text: (recipientQuery[0] || "친").toUpperCase(),
                            },
                          });
                      }
                    }}
                  />
                  <ul className="compose__suggest">
                    {suggestions.map((s) => (
                      <li key={s.name} className="compose__item" onClick={() => pickRecipient(s)}>
                        <span className="compose__avatar" style={{ background: s.avatar?.bg }}>
                          {s.avatar?.text || s.name[0]}
                        </span>
                        <span className="compose__name">{s.name}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="compose__cancel" onClick={cancelCompose}>취소</button>
                </div>
              ) : (
                <>
                  <div className="compose__header">
                    <span className="compose__avatar" style={{ background: recipient.avatar?.bg }}>
                      {recipient.avatar?.text || recipient.name[0]}
                    </span>
                    <div className="compose__to">
                      <div className="compose__to-label">받는 사람</div>
                      <div className="compose__to-name">{recipient.name}</div>
                    </div>
                    <button className="compose__cancel--link" onClick={cancelCompose}>다시 선택</button>
                  </div>

                  <div className="empty">
                    <p className="empty__hint">대화를 시작해보세요.</p>
                  </div>
                </>
              )}

              <div className="composer">
                <input
                  className="composer__input"
                  placeholder={recipient ? "메시지 보내기…" : "받는 사람을 먼저 선택하세요"}
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
          ) : (
            <>
              {selected?.messages.length === 0 ? (
                <div className="empty">
                  <p className="empty__hint">새로운 대화를 시작해보세요.</p>
                </div>
              ) : (
                <ul className="messages">
                  {selected?.messages.map((m, i) => {
                    const prev = selected.messages[i - 1];
                    const isThem = m.from === "them";
                    const showProfile = isThem && (!prev || prev.from !== "them");
                    return (
                      <li key={m.id} className={"msg " + (isThem ? "msg--them" : "msg--me")}>
                        {isThem ? (
                          <>
                            <div
                              className={"msg__avatar" + (showProfile ? "" : " is-hidden")}
                              style={{ background: selected.avatar.bg }}
                            >
                              {selected.avatar.text}
                            </div>
                            <div className="msg__content">
                              {showProfile && <div className="msg__name">{selected.name}</div>}
                              <div className="msg__row">
                                <span className="msg__bubble">{m.text}</span>
                              </div>
                              <span className="msg__time">{m.at}</span>
                            </div>
                          </>
                        ) : (
                          <div className="msg__content msg__content--me">
                            <span className="msg__time">{m.at}</span>
                            <div className="msg__row">
                              <span className="msg__bubble">{m.text}</span>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </ul>
              )}

              <div className="composer">
                <input
                  className="composer__input"
                  placeholder="메시지 보내기..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button className="composer__send" onClick={handleSend} disabled={!draft.trim()}>
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
                <a href="https://github.com/ouskxk" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> ouskxk
                </a>
              </div>
              <div className="col">
                <h3>Jiun Ko</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/suerte223" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> suerte223
                </a>
              </div>
              <div className="col">
                <h3>Seungbeom Han</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/hsb9838" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> hsb9838
                </a>
              </div>
              <div className="col">
                <h3>Munjun Yang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/munjun0608" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> munjun0608
                </a>
              </div>
              <div className="col">
                <h3>Youngbin Kang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/0bini" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> 0bini
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
