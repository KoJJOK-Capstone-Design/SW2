import React from 'react';
import './Home.css';
import logoBlue from './img/logo_blue.png';
import logoGray from './img/logo_gray.png';
import githubpic from './img/github.png';
import reactpic from './img/react.png';
import djangopic from './img/django.png';


export default function Home() {
  return (
    <div className="home">
      {/* 상단 네비게이션 */}
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            {/* 상단은 파란 로고 */}
            <img src={logoBlue} alt="paw logo" className="paw" />
            <span className="brand-text">멍냥멍냥</span>
          </div>

          <nav className="menu">
            <a href="/activity">활동</a>
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

      <main className="hero">
        <h1 className="title">
          소중한 반려동물을 위한<br/>스마트한 건강 관리
        </h1>
        <p className="subtitle">
          AI와 함께 매일의 식단, 활동, 건강을 체계적으로 기록하고 관리해보세요.
        </p>
        <a className="cta" href="/signup">지금 시작하기</a>
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
            <img src={githubpic} alt="GitHub Logo" className="github-icon" />
            ouskxk
          </a>
        </div>
        <div className="col">
            <h3>Jiun Ko</h3>
            <p>Front-End Dev</p>
            <a href="https://github.com/suerte223" className="github-link">
                <img src={githubpic} alt="GitHub Logo" className="github-icon" />
                suerte223
            </a>
        </div>
        <div className="col">
            <h3>Seungbeom Han</h3>
            <p>Front-End Dev</p>
            <a href="https://github.com/hsb9838" className="github-link">
                <img src={githubpic} alt="GitHub Logo" className="github-icon" />
                hsb9838
            </a>
        </div>
        <div className="col">
            <h3>Munjin Yang</h3>
            <p>Back-End Dev</p>
            <a href="https://github.com/munjun0608" className="github-link">
                <img src={githubpic} alt="GitHub Logo" className="github-icon" />
                munjun0608
            </a>
        </div>
        <div className="col">
            <h3>Youngbin Kang</h3>
            <p>Back-End Dev</p>
            <a href="https://github.com/0bini" className="github-link">
                <img src={githubpic} alt="GitHub Logo" className="github-icon" />
                0bini
            </a>
        </div>
      </div>

      {/* 그룹 3: 기술 스택 */}
      <div className="tech-stack">
        <h3>TECH STACK</h3>
        <img src={reactpic} alt="React Logo" className="react-icon" />
        <img src={djangopic} alt="Django Logo" className="django-icon" />
      </div>
    </div>
  </div>
</footer>
<<<<<<< HEAD
</div>
=======

    </div>
>>>>>>> ab41785348b684f51a58319b0266b3dc2921b5d5
  );
}
