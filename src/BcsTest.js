import React, { useState } from "react";
// ✅ [추가] useNavigate 훅 import
import { useNavigate } from 'react-router-dom'; 
import "./BcsTest.css";

/* 이미지 import (기존 Health/Calendar 파일에서 가져온 것으로 가정) */
import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

// ✅ [수정] user, onUpdateBcs prop을 받도록 수정
const BcsTest = ({ user, onUpdateBcs }) => { 
  
  // ✅ [추가] useNavigate 훅 사용
  const navigate = useNavigate(); 
  
  // 각 질문의 선택 상태를 관리하는 state
  const [q1, setQ1] = useState(null); // Q1: 갈비뼈
  const [q2, setQ2] = useState(null); // Q2: 위에서 내려다보기
  const [q3, setQ3] = useState(null); // Q3: 옆에서 살펴보기

  // BCS 결과 표시를 위한 상태
  const [bcsResult, setBcsResult] = useState(null); 

  const questions = [
    {
      id: 1,
      title: "Q1. 갈비뼈 만져보기",
      subtitle: "반려동물 옆구리를 부드럽게 쓰다듬었을 때, 갈비뼈가 어떻게 느껴지나요?",
      options: [
        { text: "뼈마디가 도드라지게 느껴져요.", value: "score_2" },
        { text: "약간의 지방 아래로 부드럽게 느껴져요.", value: "score_5" },
        { text: "지방이 많아 손으로 눌러야 겨우 느껴져요.", value: "score_8" },
        { text: "갈비뼈를 만지기가 거의 불가능해요.", value: "score_9" }, 
      ],
      setter: setQ1,
      state: q1,
    },
    {
      id: 2,
      title: "Q2. 위에서 내려다보기",
      subtitle: "반려동물이 서 있을 때 위에서 내려다보면, 허리 라인이 어떻게 보이나요?",
      options: [
        { text: "모래시계처럼 허리가 아주 잘록해요.", value: "score_3" },
        { text: "약간의 지방 아래로 부드럽게 느껴져요.", value: "score_5" },
        { text: "허리 라인이 거의 없거나 아주 둥글어요.", value: "score_7" },
        { text: "지방이 많아 허리 구분이 불가능해요.", value: "score_9" }, 
      ],
      setter: setQ2,
      state: q2,
    },
    {
      id: 3,
      title: "Q3. 옆에서 살펴보기",
      subtitle: "반려동물 옆을 봤을 때 배 라인이 어떻게 보이나요?",
      options: [
        { text: "갈비뼈 뒤쪽 배가 훅 올라가 있어요.", value: "score_3" },
        { text: "배가 두툼하게 위로 올라가 있어요. (이상적)", value: "score_5" },
        { text: "배가 완만한 곡선을 그리며 올라가 있어요.", value: "score_7" },
        { text: "배가 거의 일직선이거나 약간 처져있어요.", value: "score_8" },
        { text: "배가 아래로 축 쳐져 흔들려요.", value: "score_9" },
      ],
      setter: setQ3,
      state: q3,
    },
  ];

  const handleCheckResult = () => {
    // 1. 모든 질문에 답했는지 확인
    if (!q1 || !q2 || !q3) {
      alert("모든 문항에 답해주세요!");
      return;
    }

    // 2. 선택된 값 (score_N)들을 분석
    const scores = [q1, q2, q3].map(val => parseInt(val.split('_')[1]));
    let finalBcs = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length); 

    let resultText = "";
    let detailText = "";

    if (finalBcs <= 3) {
      resultText = "저체중";
      detailText = "갈비뼈, 허리가 너무 잘 보입니다. 체중 증가가 필요하며, 수의사와 상담하여 건강 상태를 확인해주세요.";
    } else if (finalBcs <= 5) { // 4-5가 이상적
      resultText = "이상적인 체중";
      detailText = "갈비뼈를 만질 때 약간의 지방이 느껴지지만 허리선이 뚜렷합니다. 현재의 상태를 잘 유지해주세요.";
    } else if (finalBcs <= 7) { // 6-7이 과체중
      resultText = "다소 과체중";
      detailText = "갈비뼈를 만질 때 안정적인 약간의 지방이 느껴집니다. 허리선이 뚜렷하지 않을 수 있습니다. 간식 양을 조절할 필요가 있습니다.";
    } else { // 8-9가 비만
      resultText = "비만";
      detailText = "갈비뼈를 만지기 어렵고, 허리선 구분이 거의 불가능합니다. 즉시 수의사와 상담하고 체계적인 다이어트가 필요합니다.";
    }

    setBcsResult({
      score: finalBcs,
      resultText: resultText,
      detailText: detailText,
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleUpdateBcs = () => {
    if (bcsResult && onUpdateBcs) {
      onUpdateBcs(bcsResult.score); 
      navigate('/health');
    }
  };

  const renderNavLinks = () => {
    if (user && user.nickname) {
      return (
        <span className="welcome-msg">{user.nickname}님</span>
      );
    }
    return (
      <>
        <a href="/signup">회원가입</a>
        <a href="/signin">로그인</a>
      </>
    );
  };


  return (
    <div className="bcs-page">
      {/* --- 네비게이션 --- */}
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <img src={logoBlue} className="paw" alt="logo" />
            <span className="brand-text">멍냥멍냥</span>
          </div>
          <nav className="menu">
            <a href="/activity">활동</a>
            <a href="/health" className="active">건강</a>
            <a href="/calendar">캘린더</a>
            <a href="/community">커뮤니티</a>
          </nav>
          <nav className="menulink">
            {/* {user ? (
              <span className="welcome-msg">{user.nickname}</span>
            ) : ( */}
              <>
                <a href="/signup">회원가입</a>
                <a href="/signin">로그인</a>
              </>

          </nav>
        </div>
      </header>
      
      {/* --- 메인 컨텐츠 영역 --- */}
      <main className="bcs-main-content">
        <div className="bcs-container">

          <h2 className="bcs-title">BCS 자가진단</h2>
          
          {/* bcsResult가 있을 때만 결과 섹션 표시 */}
          {bcsResult && (
            <section className="bcs-result-section">
              <h3 className="result-title">자가 진단 결과</h3>
              <p className="result-score">{bcsResult.score}단계</p>
              <p className="result-text">{bcsResult.resultText}</p>

              <div className="result-detail-box">
                <span className="box-title">상세 설명 및 관리 팁</span>
                <p>{bcsResult.detailText}</p>
              </div>

              <button className="update-bcs-btn" onClick={handleUpdateBcs}>
                이 결과로 업데이트 하기
              </button>
            </section>
          )}

          {/* 질문 리스트 렌더링 */}
          {questions.map(q => (
            <div className="bcs-question-box" key={q.id}>
              <h3>{q.title}</h3>
              <p className="bcs-subtitle">{q.subtitle}</p>

              <div className="bcs-options">
                {q.options.map((option, index) => (
                  <button
                    key={index}
                    className={`bcs-option ${q.state === option.value ? 'selected' : ''}`}
                      /* --- ✅ [수정] 토글(선택/취소) 로직 --- */
                    onClick={() => q.setter(prevValue => 
                        prevValue === option.value ? null : option.value
                      )}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* 결과 확인 버튼 */}
          <button className="check-result-btn" onClick={handleCheckResult}>
            결과 확인하기
          </button>
        </div>
      </main>
      {/* --- 푸터 --- */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="logo-row">
            <div className="logo-stack">
              <img src={logoGray} alt="" className="paw-bg" />
              <span className="wordmark">KoJJOK</span>
            </div>

            <div className="grid">
              {[
                ["Hyeona Kim", "UI/UX Design", "ouskxk"],
                ["Jiun Ko", "Front-End Dev", "suerte223"],
                ["Seungbeom Han", "Front-End Dev", "hsb9838"],
                ["Munjin Yang", "Back-End Dev", "munjun0608"],
                ["Youngbin Kang", "Back-End Dev", "0bini"],
              ].map(([name, role, id]) => (
                <div className="col" key={id}>
                  <h3>{name}</h3>
                  <p>{role}</p>
                  <a href={`https://github.com/${id}`} className="github-link">
                    <img src={githubpic} alt="GitHub Logo" className="github-icon" />
                    {id}
                  </a>
                </div>
              ))}
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
export default BcsTest;