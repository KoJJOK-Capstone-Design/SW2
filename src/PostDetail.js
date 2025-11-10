// src/PostDetail.js
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import "./Home.css";
import "./Community.css";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

// 아이콘
import favoriteIcon from "./img/Favorite_fill.png";
import favoriteRedIcon from "./img/Favorite_red_fill.png";
import chatIcon from "./img/Chat2.png";

import { getPost, deletePost, updatePost } from "./lib/communityStore";

const CURRENT_USER = "냥냥";

function timeLabel(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000),
    h = Math.floor(m / 60),
    d = Math.floor(h / 24);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  if (h < 24) return `${h}시간 전`;
  return `${d}일 전`;
}

export default function PostDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [post, setPost] = useState(null);

  // 삭제 모달
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 좋아요
  const [liked, setLiked] = useState(false);

  // 댓글
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    const p = getPost(id);
    if (!p) return nav("/community");

    // 구조 정리(이전 데이터 호환)
    const normalized = {
      ...p,
      commentsArr: Array.isArray(p.commentsArr) ? p.commentsArr : [],
      likedBy: Array.isArray(p.likedBy) ? p.likedBy : [],
      likes: typeof p.likes === "number" ? p.likes : 0,
    };

    setPost(normalized);
    setLiked(normalized.likedBy.includes(CURRENT_USER));
  }, [id, nav]);

  // ESC로 모달 닫기
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setConfirmOpen(false);
    if (confirmOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

  const isAuthor = useMemo(() => post && post.author === CURRENT_USER, [post]);

  const askDelete = () => setConfirmOpen(true);
  const cancelDelete = () => setConfirmOpen(false);
  const confirmDelete = () => {
    if (!post) return;
    deletePost(post.id);
    setConfirmOpen(false);
    nav("/community");
  };

  if (!post) return null;

  // ------- 좋아요 토글 -------
  const toggleLike = () => {
    const likedNow = !liked;
    setLiked(likedNow);

    let likes = post.likes ?? 0;
    let likedBy = Array.isArray(post.likedBy) ? [...post.likedBy] : [];

    if (likedNow) {
      if (!likedBy.includes(CURRENT_USER)) likedBy.push(CURRENT_USER);
      likes += 1;
    } else {
      likedBy = likedBy.filter((u) => u !== CURRENT_USER);
      likes = Math.max(0, likes - 1);
    }

    const updated = { ...post, likes, likedBy };
    setPost(updated);
    updatePost(updated);
  };

  // ------- 댓글 등록 -------
  const addComment = () => {
    const text = commentText.trim();
    if (!text) return;

    const newComment = {
      id: Date.now(),
      author: CURRENT_USER,
      text,
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...post,
      commentsArr: [...post.commentsArr, newComment],
      // 구버전과 동시 사용 중이면 숫자 필드도 함께 관리
      comments: (post.commentsArr.length + 1),
    };

    setPost(updated);
    setCommentText("");
    updatePost(updated);
  };

  // ------- 댓글 삭제 -------
  const deleteComment = (cid) => {
    const updatedArr = post.commentsArr.filter((c) => c.id !== cid);
    const updated = { ...post, commentsArr: updatedArr, comments: updatedArr.length };
    setPost(updated);
    updatePost(updated);
  };

  // ------- 댓글 수정 시작/취소/확인 -------
  const startEdit = (cid, text) => {
    setEditingId(cid);
    setEditingText(text);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };
  const confirmEdit = () => {
    if (!editingText.trim()) return;
    const updatedArr = post.commentsArr.map((c) =>
      c.id === editingId ? { ...c, text: editingText } : c
    );
    const updated = { ...post, commentsArr: updatedArr, comments: updatedArr.length };
    setPost(updated);
    updatePost(updated);
    cancelEdit();
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

          <nav className="menulink">
            <NavLink to="/signup">회원가입</NavLink>
            <NavLink to="/signin">로그인</NavLink>
          </nav>
        </div>
      </header>

      {/* Body */}
      <main className="community-container post-detail-page">
        <NavLink to="/community" className="crumb">
          ← 커뮤니티로 돌아가기
        </NavLink>

        <div className="post-detail-head">
          <div className="avatar" aria-hidden />
          <div className="who">
            <div className="name">{post.author || "익명"}</div>
            <div className="when">
              {new Date(post.createdAt).toLocaleString()} · {timeLabel(post.createdAt)}
            </div>
          </div>

          {isAuthor && (
            <div className="post-actions">
              <NavLink className="link-btn" to={`/community/${post.id}/edit`}>
                수정
              </NavLink>
              <button className="link-btn danger" onClick={askDelete}>
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 제목/본문 넓게 */}
        <div className="post-detail-body detail-wide">
          <h1 className="detail-title detail-title-xl">{post.title}</h1>
          <div className="detail-content detail-content-wide">{post.content}</div>
        </div>

        {/* 좋아요 / 댓글(아이콘 + 숫자) */}
        <div className="detail-stats">
          <button className="stat-item stat-like" onClick={toggleLike}>
            <img
              src={liked ? favoriteRedIcon : favoriteIcon}
              alt="좋아요"
              className="stat-icon"
            />
            좋아요 {post.likes ?? 0}
          </button>

          <span className="stat-item">
            <img src={chatIcon} alt="댓글" className="stat-icon" />
            댓글 {post.commentsArr.length}
          </span>
        </div>

        {/* 댓글 리스트 */}
        <div className="comments">
          {post.commentsArr.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="comment-avatar" />
              <div className="comment-main">
                <div className="comment-meta">
                  <span className="comment-author">
                    {c.author} {c.author === CURRENT_USER ? "(나)" : ""}
                  </span>
                  <span className="comment-when">{timeLabel(c.createdAt)}</span>

                  {c.author === CURRENT_USER && editingId !== c.id && (
                    <span className="comment-actions">
                      <button
                        className="c-action"
                        onClick={() => startEdit(c.id, c.text)}
                      >
                        수정
                      </button>
                      <button
                        className="c-action danger"
                        onClick={() => deleteComment(c.id)}
                      >
                        삭제
                      </button>
                    </span>
                  )}
                </div>

                {/* 일반 모드 / 수정 모드 */}
                {editingId === c.id ? (
                  <div className="comment-editing">
                    <textarea
                      className="comment-editbox"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={2}
                    />
                    <div className="comment-edit-actions">
                      <button className="c-btn primary" onClick={confirmEdit}>
                        확인
                      </button>
                      <button className="c-btn ghost" onClick={cancelEdit}>
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="comment-text">{c.text}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 댓글 입력줄 */}
        <div className="comment-input-row">
          <input
            className="comment-input"
            placeholder="댓글을 입력하세요..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addComment()}
          />
          <button className="comment-submit" onClick={addComment}>
            등록
          </button>
        </div>
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

      {/* 삭제 확인 모달 */}
      {confirmOpen && (
        <div className="modal-backdrop" onClick={cancelDelete}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">정말 삭제하시겠습니까?</h3>
            <p className="modal-sub">이 기록은 복구할 수 없습니다.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cancelDelete}>
                취소
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
