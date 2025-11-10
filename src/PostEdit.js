// src/PostEdit.js
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import "./Home.css";
import "./CommunityWrite.css";          // 작성 화면과 동일 CSS 재사용

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

import { getPost, updatePost } from "./lib/communityStore";

export default function PostEdit() {
  const { id } = useParams();
  const nav = useNavigate();

  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 작성 페이지와 동일한 파일 상태
  const [files, setFiles] = useState([]);       // File[]
  const [previews, setPreviews] = useState([]); // objectURL[]

  useEffect(() => {
    const p = getPost(id);
    if (!p) {
      nav("/community");
      return;
    }
    setPost(p);
    setTitle(p.title || "");
    setContent(p.content || "");
  }, [id, nav]);

  // 파일 선택 (작성과 동일)
  const onChangeFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    // 미리보기 URL (필수는 아님, 작성과 맞춰 둠)
    setPreviews((old) => {
      old.forEach((u) => URL.revokeObjectURL(u));
      return list.map((f) => URL.createObjectURL(f));
    });
  };

  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("제목을 입력해 주세요.");
    if (!content.trim()) return alert("내용을 입력해 주세요.");

    // 작성 페이지와 동일하게 로컬스토리지에는 파일 자체가 아니라 메타만 저장
    const nextAttachments =
      files.length > 0
        ? files.map((f) => ({ name: f.name, size: f.size }))
        : (post.attachments || []);

    const updated = {
      ...post,
      title: title.trim(),
      content: content.trim(),
      attachments: nextAttachments,
    };

    updatePost(updated);
    nav(`/community/${post.id}`);
  };

  if (!post) return null;

  return (
    <div className="home">
      {/* Header (작성 화면과 동일) */}
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

      {/* Body: CommunityWrite와 동일한 구조/클래스 */}
      <main className="write-container">
        <NavLink to={`/community/${post.id}`} className="crumb">← 커뮤니티로 돌아가기</NavLink>
        <h1 className="write-title">게시글 수정</h1>

        <form className="write-form" onSubmit={onSubmit}>
          {/* 제목 입력 */}
          <input
            className="write-input"
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* 내용 입력 */}
          <textarea
            className="write-textarea"
            placeholder="내용을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {/* 사진 첨부 (작성 페이지와 완전 동일 UI/위치) */}
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
                {files.length > 0
                  ? `${files.length}개 선택됨`
                  : (post.attachments?.length
                      ? `${post.attachments.length}개 첨부됨`
                      : "선택된 파일 없음")}
              </span>
            </div>
          </div>

          {/* 액션 버튼 (작성과 동일) */}
          <div className="write-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => nav(`/community/${post.id}`)}
            >
              취소
            </button>
            <button type="submit" className="btn btn-primary">완료</button>
          </div>
        </form>
      </main>

      {/* Footer (작성 화면과 동일) */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="logo-row">
            <div className="logo-stack">
              <img src={logoGray} alt="" className="paw-bg" aria-hidden />
              <span className="wordmark">KoJJOK</span>
            </div>

            <div className="grid">
              <div className="col"><h3>Hyeona Kim</h3><p>UI/UX Design</p>
                <a href="https://github.com/ouskxk" className="github-link"><img src={githubpic} alt="" className="github-icon" />ouskxk</a></div>
              <div className="col"><h3>Jiun Ko</h3><p>Front-End Dev</p>
                <a href="https://github.com/suerte223" className="github-link"><img src={githubpic} alt="" className="github-icon" />suerte223</a></div>
              <div className="col"><h3>Seungbeom Han</h3><p>Front-End Dev</p>
                <a href="https://github.com/hsb9838" className="github-link"><img src={githubpic} alt="" className="github-icon" />hsb9838</a></div>
              <div className="col"><h3>Munjin Yang</h3><p>Back-End Dev</p>
                <a href="https://github.com/munjun0608" className="github-link"><img src={githubpic} alt="" className="github-icon" />munjun0608</a></div>
              <div className="col"><h3>Youngbin Kang</h3><p>Back-End Dev</p>
                <a href="https://github.com/0bini" className="github-link"><img src={githubpic} alt="" className="github-icon" />0bini</a></div>
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
