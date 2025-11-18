// src/NewFamily.js
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, NavLink, Link } from "react-router-dom";
import axios from "axios";
import "./NewFamily.css";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";
import bell from "./img/bell.png";
import chat from "./img/chat.png";

export default function NewFamily() {
  const navigate = useNavigate();

  // 로그인한 사용자 이름(닉네임)
  const [username, setUsername] = useState("냥냥");

  // DB 필드명 기반 입력 폼
  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    birth_date: "",
    gender: "",
    is_neutered: "",
    weight: "",
    target_activity_minutes: "",
    special_notes: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profileFile, setProfileFile] = useState(null); // 실제 파일

  // 🔹 로그인된 사용자 정보 가져오기 (닉네임 연동)
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

        // 백엔드 응답에 따라 우선순위대로 이름 선택
        const name =
          res.data?.nickname || // 닉네임이 있으면 우선 사용
          res.data?.username || // 없으면 username
          res.data?.id || // 그래도 없으면 id
          "멍냥";

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

  // 🔔 알림 관련
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

  const notiBtnRef = useRef(null);
  const notiRef = useRef(null);

  // 외부 클릭 시 알림창 닫기
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

  // 입력 변경
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (e.target.tagName === "TEXTAREA") {
      e.target.style.height = "auto";
      e.target.style.height = e.target.scrollHeight + "px";
    }
  };

  // 프로필 이미지 업로드
  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("이미지 용량이 너무 커요! 2MB 이하의 사진만 업로드해주세요.");
      e.target.value = "";
      return;
    }

    setProfileFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 제출 → API 전송
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.species || !form.breed || !form.birth_date) {
      alert("기본 정보를 모두 입력해주세요!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();

      fd.append("name", form.name);
      fd.append("species", form.species);
      fd.append("breed", form.breed);
      fd.append("birth_date", form.birth_date);

      if (form.gender) fd.append("gender", form.gender);

      if (form.is_neutered) {
        const boolStr = form.is_neutered === "완료" ? "true" : "false";
        fd.append("is_neutered", boolStr);
      }

      if (form.weight) fd.append("weight", form.weight);
      if (form.target_activity_minutes)
        fd.append("target_activity_minutes", form.target_activity_minutes);
      if (form.special_notes) fd.append("special_notes", form.special_notes);

      if (profileFile) {
        fd.append("profile_photo", profileFile, profileFile.name);
      }

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.post(
        "https://youngbin.pythonanywhere.com/api/v1/pets/",
        fd,
        { headers }
      );

      console.log("반려동물 등록 성공:", res.data);
      alert("등록이 완료되었습니다!");
      navigate("/dashboard");
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      console.error("반려동물 등록 실패:", data || err.message);

      if (
        status === 401 &&
        (data?.code === "token_not_valid" ||
          data?.detail?.includes("Token is expired"))
      ) {
        alert("로그인 시간이 만료되었습니다. 다시 로그인 해주세요.");
        localStorage.removeItem("token");
        navigate("/signin");
        return;
      }

      alert(
        "에러 코드: " +
          status +
          "\n메시지: " +
          JSON.stringify(data, null, 2)
      );
    }
  };

  return (
    <div className="newfamily-page">
      {/* -------------------------
            🔹 헤더 영역 (로그인 헤더)
          ------------------------- */}
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <NavLink to="/home">
              <img src={logoBlue} alt="paw logo" className="paw" />
              <span className="brand-text">멍냥멍냥</span>
            </NavLink>
          </div>

          <nav className="menu">
            <NavLink to="/activity">활동</NavLink>
            <NavLink to="/health">건강</NavLink>
            <NavLink to="/calendar">캘린더</NavLink>
            <NavLink to="/community">커뮤니티</NavLink>
          </nav>

          <nav className="menuicon">
            <Link to="/mypage" className="profile">
              <div className="profile__avatar">
                <img src="https://i.pravatar.cc/80?img=11" alt="프로필" />
              </div>
              {/* ✅ 여기에서 username이 닉네임/아이디로 표시됨 */}
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
                <img src={bell} alt="" className="icon" />
                {hasUnread && <span className="bell__dot" />}
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
                    {notifications.length === 0 ? (
                      <li className="noti__empty">알림이 없습니다.</li>
                    ) : (
                      notifications.map((n) => (
                        <li
                          key={n.id}
                          className={`noti__item ${
                            n.read ? "is-read" : "is-unread"
                          }`}
                          onClick={() => markRead(n.id)}
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
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* 채팅 이동 */}
            <div className="icon-wrapper">
              <NavLink to="/chat" className="icon-btn">
                <img src={chat} alt="채팅" className="icon" />
              </NavLink>
            </div>
          </nav>
        </div>
      </header>

      {/* --------------- 메인 --------------- */}
      <main className="newfamily-form-container">
        <h1>
          새로운 가족을 소개해주세요<span className="title-dot">.</span>
        </h1>
        <p id="information">기본 정보를 입력해주세요.</p>

        <form className="newfamily-form" onSubmit={handleSubmit}>
          {/* 프로필 업로드 */}
          <div className="profile-upload">
            <label htmlFor="profileInput" className="profile-pic">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="미리보기"
                  className="profile-preview"
                />
              ) : (
                "+"
              )}
            </label>
            <input
              id="profileInput"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </div>

          {/* 기본 정보 */}
          <section className="info-section">
            <h2 id="h2">기본 정보</h2>
            <div className="section-grid">
              <div className="form-group">
                <label className="size">이름</label>
                <input
                  type="text"
                  name="name"
                  placeholder="반려동물의 이름"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="size">종류</label>
                <div className="radio-options">
                  <label>
                    <input
                      type="radio"
                      name="species"
                      value="강아지"
                      checked={form.species === "강아지"}
                      onChange={handleChange}
                    />
                    강아지
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="species"
                      value="고양이"
                      checked={form.species === "고양이"}
                      onChange={handleChange}
                    />
                    고양이
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="size">품종</label>
                <input
                  type="text"
                  name="breed"
                  placeholder="품종 입력"
                  value={form.breed}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="size">생년월일</label>
                <input
                  type="date"
                  name="birth_date"
                  value={form.birth_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* 건강 정보 */}
          <section className="info-section">
            <h2 id="h2">건강 정보</h2>
            <div className="section-grid">
              <div className="form-group">
                <label className="size">성별</label>
                <div className="radio-options">
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="수컷"
                      checked={form.gender === "수컷"}
                      onChange={handleChange}
                    />
                    수컷
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="암컷"
                      checked={form.gender === "암컷"}
                      onChange={handleChange}
                    />
                    암컷
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="size">중성화 여부</label>
                <div className="radio-options">
                  <label>
                    <input
                      type="radio"
                      name="is_neutered"
                      value="완료"
                      checked={form.is_neutered === "완료"}
                      onChange={handleChange}
                    />
                    완료
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="is_neutered"
                      value="미완료"
                      checked={form.is_neutered === "미완료"}
                      onChange={handleChange}
                    />
                    미완료
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="size">체중 (kg)</label>
                <input
                  type="number"
                  name="weight"
                  placeholder="예: 3.2"
                  value={form.weight}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="size">하루 목표 활동량 (분)</label>
                <input
                  type="number"
                  name="target_activity_minutes"
                  placeholder="예: 45"
                  value={form.target_activity_minutes}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* 특이사항 */}
          <section className="info-section">
            <h2 id="h2">특이사항 (선택)</h2>
            <textarea
              id="notes"
              name="special_notes"
              placeholder="알레르기, 질병 등 특별한 정보를 입력해주세요."
              value={form.special_notes}
              onChange={handleChange}
              rows="1"
            />
          </section>

          {/* 완료 버튼 */}
          <div className="submit-container">
            <NavLink to="/newfamily" className="add-pet-link">
              새로운 반려동물 등록
            </NavLink>

            <button type="submit" className="submit-btn">
              완료
            </button>
          </div>
        </form>
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
              <img src={reactpic} alt="React Logo" className="react-icon" />
              <img src={djangopic} alt="Django Logo" className="django-icon" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
