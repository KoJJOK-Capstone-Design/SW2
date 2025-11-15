// src/CommunityWrite.js
import React, { useState, useEffect } from "react";
import {NavLink, useNavigate } from "react-router-dom";
import "./Home.css";
import "./CommunityWrite.css";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

const KEY = "community_posts";

export default function CommunityWrite() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 추가: 파일 상태 및 미리보기
  const [files, setFiles] = useState([]);           // File[]
  const [previews, setPreviews] = useState([]);     // objectURL[]

  const onChangeFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setPreviews(list.map((f) => URL.createObjectURL(f)));
  };

  // 메모리 정리
  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("제목을 입력해 주세요.");
    if (!content.trim()) return alert("내용을 입력해 주세요.");

    const now = new Date();
    const newPost = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      author: "냥냥",
      likes: 0,
      comments: 0,
      createdAt: now.toISOString(),
      timeLabel: "방금 전",
      // 참고: 현재는 로컬스토리지라 파일 자체 저장은 하지 않고 파일명만 남김
      attachments: files.map((f) => ({ name: f.name, size: f.size })),
    };

    const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
    saved.unshift(newPost);
    localStorage.setItem(KEY, JSON.stringify(saved));
    nav("/community");
  };

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

          <nav className="menulink">
            <NavLink to="/signup">회원가입</NavLink>
            <NavLink to="/signin">로그인</NavLink>
          </nav>
        </div>
      </header>

      <main className="write-container">
        <NavLink to="/community" className="crumb">← 커뮤니티로 돌아가기</NavLink>
        <h1 className="write-title">게시글 작성</h1>

        <form className="write-form" onSubmit={onSubmit}>
          <input
            className="write-input"
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="write-textarea"
            placeholder="내용을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

        <div className="write-attach-row">

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
            {files.length === 0 ? "선택된 파일 없음" : `${files.length}개 선택됨`}
          </span>
        </div>
      </div>


          <div className="write-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => nav("/community")}
            >
              취소
            </button>
            <button type="submit" className="btn btn-primary">등록</button>
          </div>
        </form>
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
                <h3>Munjin Yang</h3>
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
