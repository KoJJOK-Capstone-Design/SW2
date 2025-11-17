// src/Community.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink} from "react-router-dom";
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

const POSTS_KEY = "community_posts";
const PER_PAGE = 4;

export default function Community() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(POSTS_KEY) || "[]");
    setPosts(saved);
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
                <a href="/Chat"><img src={chat} alt="채팅 아이콘" className="icon" /></a>
              </button>
            </div>
          </nav>
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
              <p className="section-sub">다른 집사님들과 자유롭게 소통해보세요!</p>
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
                    onChange={(e) => { setPage(1); setQuery(e.target.value); }}
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
          <Link key={p.id} to={`/community/${p.id}`} className="post-card link-reset">
            <h3 className="post-title">{p.title}</h3>
            <p className="post-content">{p.content}</p>
            <div className="post-meta">
              <span>{p.author} · {p.timeLabel || ""}</span>
              <span className="meta-right">좋아요 {p.likes ?? 0}개 댓글 {(p.commentsArr?.length ?? p.comments ?? 0)}개</span>
            </div>
          </Link>
        ))}

          {/* 페이지네이션 */}
          {filtered.length > 0 && (
            <div className="pager" aria-label="페이지네이션">
              <button
                className="pager-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="이전 페이지"
              >
                〈
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`pager-num ${page === i + 1 ? "is-active" : ""}`}
                  onClick={() => setPage(i + 1)}
                  aria-current={page === i + 1 ? "page" : undefined}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className="pager-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
                <a href="https://github.com/ouskxk" className="github-link">
                  <img src={githubpic} alt="" className="github-icon" />ouskxk
                </a>
              </div>
              <div className="col">
                <h3>Jiun Ko</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/suerte223" className="github-link">
                  <img src={githubpic} alt="" className="github-icon" />suerte223
                </a>
              </div>
              <div className="col">
                <h3>Seungbeom Han</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/hsb9838" className="github-link">
                  <img src={githubpic} alt="" className="github-icon" />hsb9838
                </a>
              </div>
              <div className="col">
                <h3>Munjun Yang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/munjun0608" className="github-link">
                  <img src={githubpic} alt="" className="github-icon" />munjun0608
                </a>
              </div>
              <div className="col">
                <h3>Youngbin Kang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/0bini" className="github-link">
                  <img src={githubpic} alt="" className="github-icon" />0bini
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