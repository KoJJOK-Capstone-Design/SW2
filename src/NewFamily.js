import React, { useState } from 'react';
import { useNavigate } from "react-router-dom"; 
import './NewFamily.css';

import logoBlue from './img/logo_blue.png';
import logoGray from './img/logo_gray.png';
import githubpic from './img/github.png';
import reactpic from './img/react.png';
import djangopic from './img/django.png';

export default function NewFamily() {
  const navigate = useNavigate(); 
  const [form, setForm] = useState({
    name: '',
    type: '',      
    breed: '',
    birth: '',
    gender: '',     
    neutered: '',   
    weight: '',
    activity: '',
    notes: ''
  });

  const [profileImage, setProfileImage] = useState(null);

  // 입력값 변경
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // textarea 자동 높이 조절
    if (e.target.tagName === "TEXTAREA") {
      e.target.style.height = "auto";
      e.target.style.height = e.target.scrollHeight + "px";
    }
  };

  // 프로필 이미지 업로드
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 완료 버튼 클릭 시
  const handleSubmit = (e) => {
    e.preventDefault();

    // 기본정보 4개 확인
    if (!form.name || !form.type || !form.breed || !form.birth) {
      alert("기본 정보를 모두 입력해주세요!");
      return;
    }

    console.log("입력된 데이터:", form);
    console.log("업로드된 이미지:", profileImage);

    // 등록 완료 알림
    alert("등록이 완료되었습니다!");
    navigate("/dashboard");
  };

  return (
    <div className="newfamily-page">
      {/* 네비게이션 */}
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <img src={logoBlue} alt="paw logo" className="paw" />
            <span className="brand-text">멍냥멍냥</span>
          </div>
          <nav className="menu">
            <a href="#activity">활동</a>
            <a href="#health">건강</a>
            <a href="#calendar">캘린더</a>
            <a href="#community">커뮤니티</a>
          </nav>
          <nav className="menulink">
            <a href="/signup">회원가입</a>
            <a href="/signin">로그인</a>
          </nav>
        </div>
      </header>

      {/* 메인 영역 */}
      <main className="newfamily-form-container">
        <h1>새로운 가족을 소개해주세요<span className="title-dot">.</span></h1>
        <p id="information">기본 정보를 입력해주세요.</p>

        <form className="newfamily-form" onSubmit={handleSubmit}>

          {/* 프로필 업로드 */}
          <div className="profile-upload">
            <label htmlFor="profileInput" className="profile-pic">
              {profileImage ? (
                <img src={profileImage} alt="프로필 미리보기" className="profile-preview" />
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
                <label htmlFor="name" className="size">이름</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="반려동물의 이름을 등록해주세요."
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
                      name="type"
                      value="강아지"
                      checked={form.type === '강아지'}
                      onChange={handleChange}
                    />
                    강아지
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="type"
                      value="고양이"
                      checked={form.type === '고양이'}
                      onChange={handleChange}
                    />
                    고양이
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="breed" className="size">품종</label>
                <input
                  type="text"
                  id="breed"
                  name="breed"
                  placeholder="품종을 입력해주세요."
                  value={form.breed}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="birth" className="size">생년월일</label>
                <input
                  type="date"
                  id="birth"
                  name="birth"
                  value={form.birth}
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
                      checked={form.gender === '수컷'}
                      onChange={handleChange}
                    />
                    수컷
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="암컷"
                      checked={form.gender === '암컷'}
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
                      name="neutered"
                      value="완료"
                      checked={form.neutered === '완료'}
                      onChange={handleChange}
                    />
                    완료
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="neutered"
                      value="미완료"
                      checked={form.neutered === '미완료'}
                      onChange={handleChange}
                    />
                    미완료
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="weight" className="size">체중 (kg)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  placeholder="예: 8.2"
                  value={form.weight}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="activity" className="size">하루 목표 활동량 (분)</label>
                <input
                  type="number"
                  id="activity"
                  name="activity"
                  placeholder="예: 45"
                  value={form.activity}
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
              name="notes"
              placeholder="알레르기, 질병 등 특별한 정보를 입력해주세요."
              value={form.notes}
              onChange={handleChange}
              rows="1"
            />
          </section>

          {/* 완료 버튼 */}
          <div className="submit-container">
            <a href="/newfamily" className="add-pet-link">새로운 반려동물 등록</a>
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
                <h3>Munjin Yang</h3>
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
