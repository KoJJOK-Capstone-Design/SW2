import React, { useMemo, useState } from "react";
import "./Dashboard.css";//헤더, 푸터는 대시보드 css에서 가져옴   
import "./Chat.css";       

// Dashboard와 동일한 자산 사용
import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";
import bell from "./img/bell.png";
import chat from "./img/chat.png";

export default function Chat() {
  const [showBellPopup, setShowBellPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);

  // 더미 스레드/메시지 (API 연동 시 대체)
  const [threads, setThreads] = useState([
    {
      id: "t1",
      name: "냥냥편지",
      preview: "안녕하세요",
      avatar: { bg: "#d9f99d", text: "냥" },
      messages: [
        { id: "m1", from: "them", text: "안녕하세요", at: "오후 10:23" },
        { id: "m2", from: "me",   text: "네에에?",   at: "오후 10:48" },
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
  const [selectedId, setSelectedId] = useState(threads[0].id);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");

  const selected = threads.find(t => t.id === selectedId);
  const filtered = threads.filter(t =>
    (t.name + (t.preview || "")).toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = () => {
    if (!draft.trim()) return;
    const msg = {
      id: "m" + Date.now(),
      from: "me",
      text: draft.trim(),
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setThreads(prev => prev.map(t =>
      t.id === selectedId
        ? { ...t, messages: [...t.messages, msg], preview: msg.text }
        : t
    ));
    setDraft("");
  };

  return (
    <div className="app">
      {/* ===== 헤더 (Dashboard와 동일) ===== */}
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
                <img src={chat} alt="채팅 아이콘" className="icon" />
              </button>
              {showChatPopup && (
                <div className="popup"><p>💬 새로운 메시지가 없습니다.</p></div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ===== DM 본문 ===== */}
      <main className="dm">
        {/* 좌측: 쪽지함 */}
        <aside className="inbox">
          <div className="inbox__title">
            <h1>쪽지함</h1>
            <button className="icon-btn" title="이름 수정">✏️</button>
          </div>

          <label className="search">
            <span className="search__icon">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색"
            />
          </label>

          <ul className="threadlist">
            {filtered.map(t => (
              <li
                key={t.id}
                className={"thread" + (t.id === selectedId ? " is-active" : "")}
                onClick={() => setSelectedId(t.id)}
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

        {/* 우측: 대화 */}
        <section className="chat">
          {selected.messages.length === 0 ? (
            <div className="empty"><p className="empty__hint">새로운 대화를 시작해보세요.</p></div>
          ) : (
            <ul className="messages">
              {selected.messages.map(m => (
                <li key={m.id} className={"msg msg--" + m.from}>
                  <span className="msg__bubble">{m.text}</span>
                  <span className="msg__time">{m.at}</span>
                </li>
              ))}
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
        </section>
      </main>

      {/* ===== 푸터 (Dashboard와 동일) ===== */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="logo-row">
            <div className="logo-stack">
              <img src={logoGray} alt="" className="paw-bg" aria-hidden />
              <span className="wordmark">KoJJOK</span>
            </div>

            <div className="grid">
              <div className="col">
                <h3>Hyeona Kim</h3><p>UI/UX Design</p>
                <a href="https://github.com/ouskxk" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> ouskxk
                </a>
              </div>
              <div className="col">
                <h3>Jiun Ko</h3><p>Front-End Dev</p>
                <a href="https://github.com/suerte223" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> suerte223
                </a>
              </div>
              <div className="col">
                <h3>Seungbeom Han</h3><p>Front-End Dev</p>
                <a href="https://github.com/hsb9838" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> hsb9838
                </a>
              </div>
              <div className="col">
                <h3>Munjin Yang</h3><p>Back-End Dev</p>
                <a href="https://github.com/munjun0608" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> munjun0608
                </a>
              </div>
              <div className="col">
                <h3>Youngbin Kang</h3><p>Back-End Dev</p>
                <a href="https://github.com/0bini" className="github-link">
                  <img src={githubpic} alt="GitHub Logo" className="github-icon" /> 0bini
                </a>
              </div>
            </div>

            <div className="tech-stack">
              <h3>TECH STACK</h3>
              <img src={reactpic}  alt="React Logo"  className="react-icon" />
              <img src={djangopic} alt="Django Logo" className="django-icon" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
