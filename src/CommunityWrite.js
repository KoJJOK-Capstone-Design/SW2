// src/CommunityWrite.js
import React, { useState, useRef, useEffect } from "react";
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

  // 로그인 상태 확인 및 사용자 정보 가져오기
  useEffect(() => {
    const token = localStorage.getItem("token");
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
          // 프로필 이미지가 있으면 사용, 없으면 기본 이미지
          if (res.data?.profile_image || res.data?.avatar) {
            const imgUrl = res.data.profile_image || res.data.avatar;
            setUserProfileImage(
              imgUrl.startsWith("http")
                ? imgUrl
                : `https://youngbin.pythonanywhere.com${imgUrl}`
            );
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
              <div className="icon-wrapper">
                <button
                  className="icon-btn"
                  onClick={() => {
                    setShowBellPopup((v) => !v);
                    setShowChatPopup(false);
                  }}
                >
                  <img src={bell} alt="알림 아이콘" className="icon" />
                </button>
                {showBellPopup && (
                  <div className="popup">
                    <p>📢 새 알림이 없습니다.</p>
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
