import React, { useState } from "react";
import "./Health.css";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

// ✅ [추가 1] Chart.js 라이브러리 import
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// ✅ [추가 2] Chart.js에 필요한 기능 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- 초기 더미 데이터 ---
const initialRecords = [
  // (필요시 여기에 초기 데이터를 추가하세요)
];

// ✅ [수정] 부모로부터 user와 pet 데이터를 props로 받음
const Health = ({ user, pet }) => {
  /* --- 기존 상태들 --- */
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [records, setRecords] = useState(initialRecords);
  const [activeTab, setActiveTab] = useState("all");

  /* '추가' 모달 상태 */
  const [showModal, setShowModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: "", 
    title: "",
    location: "",
    date: "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  /* '수정' 모달 상태 */
  const [showEditModal, setShowEditModal] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);

  /* '삭제' 모달 상태 */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null); 

  /* AI 분석 결과 상태 */
  const [analysisResult, setAnalysisResult] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);

  /* --- ✅ [추가 3] 그래프용 '가짜' 데이터 (컴포넌트 내부로 이동) --- */
  const weightData = {
    labels: ["9월", "10월", "11월", "12월", "1월", "2월", "3월", "4월", "5월"],
    datasets: [
      {
        label: "체중 (kg)",
        data: [3.20, 3.40, 3.35, 3.50, 3.60, 3.45, 3.50, 3.55, 3.52],
        
        /* --- 선 스타일 --- */
        borderColor: "#4b7bec", // 🔵 선 색상
        tension: 0.4, // 〰️ 선의 부드러운 정도
        
        /* --- 영역 채우기 (그라데이션) --- */
        fill: true, 
        backgroundColor: "rgba(75, 123, 236, 0.1)", // 옅은 파란색
        
        /* --- 점(포인트) 스타일 --- */
        pointBackgroundColor: "#fff", // ⚪ 점 배경색 (흰색)
        pointBorderColor: "#4b7bec", // 🔵 점 테두리색 (파란색)
        pointBorderWidth: 2, // 점 테두리 두께
        pointRadius: 5, // 점 크기
        pointHoverRadius: 7, // 마우스 올렸을 때 점 크기
      },
    ],
  };

  const chartOptions = {
    responsive: true, // 반응형
    maintainAspectRatio: false, // 👈 .graph-box 높이에 맞게 꽉 차게
    
    plugins: {
      legend: {
        display: false, // 그래프 위 '체중 (kg)' 라벨 숨기기
      },
      /* --- ✅ [수정] 툴팁(설명창) 스타일 --- */
      tooltip: {
        enabled: true, // 툴팁 활성화
        backgroundColor: "#dfebfaff", 
        titleColor: "#000000ff",     
        bodyColor: "#0c0c0cff",      
        padding: 12,            
        cornerRadius: 8,      
        borderColor: "#dfebfaff",
        borderWidth: 3,        
        
        // 툴팁 박스에 그림자 추가
        caretSize: 0, // 툴팁의 뾰족한 꼬리 제거
        displayColors: false, // 색상 사각형 숨기기
        boxPadding: 8,
        
        // 폰트 설정 (Pretendard가 적용되도록)
        bodyFont: {
          size: 14,
          family: "Pretendard", 
        },
        titleFont: {
          size: 12,
          family: "Pretendard",
        }
      },
      /* --- ✅ --- */
    },
    
    // --- 축 스타일 ---
    scales: {
      y: {
        min: 3.0, // y축 최소값
        grid: {
          color: "#e9e9e9", // 📉 y축 그리드 선 색상
        },
      },
      x: {
        grid: {
          display: false, // 👈 x축 그리드 선 숨기기
        },
      },
    }
  };
  /* --- ✅ --- */

  const symptoms = [
    "구토", "설사", "식사 부진", "복부 팽만",
    "과도한 갈증", "피부 발진", "비듬", "탈모",
    "기력 저하", "수면 증가", "불안 / 공격성", "걸음걸이 이상",
  ];

  /* 증상 선택 */
  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  /* --- '추가', '수정', '삭제' 모달 관련 함수들 --- */

  /* '추가' 모달 열기 */
  const handleAdd = () => {
    setShowModal(true);
    setIsDropdownOpen(false); 
  };

  /* '추가' 모달 입력 변경 */
  const handleChange = (e) => {
    setNewRecord({
      ...newRecord,
      [e.target.name]: e.target.value,
    });
  };

  /* '추가' 모달 저장 (가짜) */
  const handleSave = () => {
    if (!newRecord.type || !newRecord.title || !newRecord.location || !newRecord.date) {
      alert("모든 내용을 입력해주세요!");
      return;
    }
    const iconMap = { visit: "🏥", vax: "💉", med: "💊" };
    const created = {
      id: Date.now(),
      type: newRecord.type,
      icon: iconMap[newRecord.type],
      title: newRecord.title,
      location: newRecord.location,
      date: newRecord.date,
    };
    setRecords([created, ...records]);
    setNewRecord({ type: "", title: "", location: "", date: "" });
    setShowModal(false);
    setIsDropdownOpen(false);
  };

  /* '추가' 모달 폼 제출 */
  const handleFormSubmit = (e) => {
    e.preventDefault(); 
    handleSave();
  };

  /* '수정' 모달 열기 */
  const handleEditClick = (record) => {
    setRecordToEdit(record); 
    setShowEditModal(true); 
    setIsEditDropdownOpen(false); 
  };

  /* '수정' 모달 입력 변경 */
  const handleEditChange = (e) => {
    setRecordToEdit({
      ...recordToEdit,
      [e.target.name]: e.target.value,
    });
  };

  /* '수정' 모달 저장 (가짜) */
  const handleUpdateSave = () => {
    if (!recordToEdit.type || !recordToEdit.title || !recordToEdit.location || !recordToEdit.date) {
      alert("모든 내용을 입력해주세요!");
      return;
    }
    const iconMap = { visit: "🏥", vax: "💉", med: "💊" };
    const updatedRecord = {
      ...recordToEdit,
      icon: iconMap[recordToEdit.type]
    };
    setRecords(records.map(r => (r.id === updatedRecord.id ? updatedRecord : r)));
    setShowEditModal(false);
    setRecordToEdit(null);
    setIsEditDropdownOpen(false);
  };

  /* '수정' 모달 폼 제출 */
  const handleEditFormSubmit = (e) => {
    e.preventDefault();
    handleUpdateSave();
  };

  /* '삭제' 모달 열기 */
  const handleDeleteClick = (id) => {
    setRecordToDelete(id);
    setShowDeleteModal(true);
  };

  /* '삭제' 모달 > '취소' */
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };

  /* '삭제' 모달 > '삭제' (가짜) */
  const handleConfirmDelete = () => {
    if (recordToDelete) {
      setRecords(records.filter((r) => r.id !== recordToDelete));
    }
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };


  /* AI 분석 요청 함수 */
  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) {
      alert("먼저 증상을 선택해주세요!");
      return;
    }
    setIsLoading(true); 
    setAnalysisResult(null);

    const analysisData = {
      petInfo: {
        breed: pet ? pet.breed : "반려동물",
        age: pet ? pet.age : "알 수 없음",
      },
      symptoms: selectedSymptoms,
    };
    
    // --- (시연용) 가짜 백엔드 응답 (2초 딜레이) ---
    setTimeout(() => {
      const fakeResponse = {
        illness_name: "복합적 문제",
        illness_details: `선택하신 '${selectedSymptoms.join(", ")}' 증상은 급성 위장염의 가능성을 시사합니다. 소화기관의 염증으로 인해 발생할 수 있으며, 탈수 증상으로 이어질 수 있어 주의가 필요합니다.`,
        recommendations: [
          "유산균을 급여하고 식단을 점검해주세요.",
          "탈수 방지를 위해 수분 섭취에 신경써주세요.",
          "편안한 환경에서 충분히 쉴 수 있도록 해주세요.",
          "다른 증상이 동반되거나 24시간 내 호전되지 않으면 수의사와 상담하세요."
        ]
      };
      setAnalysisResult(fakeResponse); 
      setIsLoading(false);
    }, 1500);
  };

  /* 필터링 */
  const filteredRecords = records.filter((record) =>
    activeTab === "all" ? true : record.type === activeTab
  );

  return (
    <div className="health-page">

      {/* --- '추가' 모달 UI --- */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { if (isDropdownOpen) setIsDropdownOpen(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>새로운 건강 기록 추가</h2>
            <form onSubmit={handleFormSubmit}>
              <label>종류</label>
              <div className="custom-select-wrapper">
                <button
                  type="button"
                  className={`custom-select-trigger ${newRecord.type === "" ? "placeholder" : ""}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {newRecord.type === "visit" && "병원 방문"}
                  {newRecord.type === "vax" && "예방접종"}
                  {newRecord.type === "med" && "투약"}
                  {newRecord.type === "" && "선택하세요"}
                </button>
                {isDropdownOpen && (
                  <ul className="custom-options">
                    <li className="custom-option" onClick={() => { setNewRecord({ ...newRecord, type: "visit" }); setIsDropdownOpen(false); }}>병원 방문</li>
                    <li className="custom-option" onClick={() => { setNewRecord({ ...newRecord, type: "vax" }); setIsDropdownOpen(false); }}>예방접종</li>
                    <li className="custom-option" onClick={() => { setNewRecord({ ...newRecord, type: "med" }); setIsDropdownOpen(false); }}>투약</li>
                  </ul>
                )}
              </div>
              <label>제목</label>
              <input type="text" name="title" placeholder="예: 종합 백신 5차"
                value={newRecord.title} onChange={handleChange} required />
              <label>장소 / 약 이름</label>
              <input type="text" name="location" placeholder="예: 멍냥 동물 병원"
                value={newRecord.location} onChange={handleChange} required />
              <label>날짜</label>
              <input type="date" name="date" placeholder="연도-월-일"
                value={newRecord.date} onChange={handleChange} required />
              <div className="form-buttons">
                <button type="submit">저장</button>
                <button type="button" onClick={() => setShowModal(false)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- '수정' 모달 UI --- */}
      {showEditModal && recordToEdit && (
        <div className="modal-overlay" onClick={() => { if (isEditDropdownOpen) setIsEditDropdownOpen(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>건강 기록 수정</h2>
            <form onSubmit={handleEditFormSubmit}>
              <label>종류</label>
              <div className="custom-select-wrapper">
                <button
                  type="button"
                  className={`custom-select-trigger ${recordToEdit.type === "" ? "placeholder" : ""}`}
                  onClick={() => setIsEditDropdownOpen(!isEditDropdownOpen)}
                >
                  {recordToEdit.type === "visit" && "병원 방문"}
                  {recordToEdit.type === "vax" && "예방접종"}
                  {recordToEdit.type === "med" && "투약"}
                  {recordToEdit.type === "" && "선택하세요"}
                </button>
                {isEditDropdownOpen && (
                  <ul className="custom-options">
                    <li className="custom-option" onClick={() => { setRecordToEdit({ ...recordToEdit, type: "visit" }); setIsEditDropdownOpen(false); }}>병원 방문</li>
                    <li className="custom-option" onClick={() => { setRecordToEdit({ ...recordToEdit, type: "vax" }); setIsEditDropdownOpen(false); }}>예방접종</li>
                    <li className="custom-option" onClick={() => { setRecordToEdit({ ...recordToEdit, type: "med" }); setIsEditDropdownOpen(false); }}>투약</li>
                  </ul>
                )}
              </div>
              <label>제목</label>
              <input type="text" name="title" placeholder="예 : 종합 백신 5차"
                value={recordToEdit.title} onChange={handleEditChange} required />
              <label>장소 / 약 이름</label>
              <input type="text" name="location" placeholder="예 : 멍냥 동물 병원"
                value={recordToEdit.location} onChange={handleEditChange} required />
              <label>날짜</label>
              <input type="date" name="date" placeholder="연도-월-일"
                value={recordToEdit.date} onChange={handleEditChange} required />
              <div className="form-buttons">
                <button type="submit">저장</button>
                <button type="button" onClick={() => setShowEditModal(false)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- '삭제 확인' 모달 UI  --- */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal modal-delete-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>정말 삭제하시겠습니까?</h2>
            <p className="delete-confirm-text">이 기록은 복구할 수 없습니다.</p>
            <div className="form-buttons">
              <button type="button" className="btn-cancel" onClick={handleCancelDelete}>
                취소
              </button>
              <button type="button" className="btn-delete-confirm" onClick={handleConfirmDelete}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

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
            {user ? (
              <span className="welcome-msg">{user.nickname}님</span>
            ) : (
              <>
                <a href="/signup">회원가입</a>
                <a href="/signin">로그인</a>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* --- 건강 컨텐츠 --- */}
      <div className="health-container">

        {/* 펫 정보 (props로 받음) */}
        <section className="health-info">
          <h2 className="hw">{pet ? pet.name : '반려동물'}님의 건강 정보</h2>
          <div className="info-grid">
            <div><span>품종</span><b>{pet ? pet.breed : '미입력'}</b></div>
            <div><span>현재 체중</span><b>{pet ? pet.weight : '미입력'}</b></div>
            <div><span>나이</span><b>{pet ? pet.age : '미입력'}</b></div>
            <div><span>BCS</span><b>{pet ? pet.bcs : '미입력'}</b></div>

          </div>
        </section>

        {/* --- ✅ [수정] 체중 변화 그래프 --- */}
        <section className="health-info">
          <h2 className="hw">체중 변화 그래프</h2>
          <div className="graph-box">
            {/* "그래프 자리" p 태그 대신 <Line> 컴포넌트 삽입 */}
            <Line options={chartOptions} data={weightData} />
          </div>
        </section>
        
        {/* --- 건강 기록 목록 --- */}
        <section className="health-info">
          <div className="health-header">
            <h2 className="hw">최근 건강 기록</h2>
            <button className="add-button" onClick={handleAdd}></button> 
          </div>

          {/* 탭 */}
          <nav className="health-tabs">
            <button
              className={activeTab === "all" ? "active" : ""}
              onClick={() => setActiveTab("all")}
            >전체</button>

            <button
              className={activeTab === "vax" ? "active" : ""}
              onClick={() => setActiveTab("vax")}
            >예방접종</button>

            <button
              className={activeTab === "visit" ? "active" : ""}
              onClick={() => setActiveTab("visit")}
            >병원 방문</button>

            <button
              className={activeTab === "med" ? "active" : ""}
              onClick={() => setActiveTab("med")}
            >투약</button>
          </nav>

          <ul className="health-record-list">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <li key={record.id} className="record-item" data-type={record.type}>
                  <div className="record-icon">{record.icon}</div>
                  <div className="record-content">
                    <span className="record-title">{record.title}</span>
                    <small className="record-location">
                      {record.location}
                    </small>
                  </div>
                  <div className="record-details">
                    <small className="record-date">{record.date}</small>
                    <div className="record-actions">
                      <button className="edit-btn" onClick={() => handleEditClick(record)}>
                        <img src={editIcon} className="icon-img" alt="edit" />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteClick(record.id)} 
                      >
                        <img src={trashIcon} className="icon-img" alt="delete" />
                      </button>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="no-records">기록이 없습니다.</li>
            )}
          </ul>
        </section>
        
        {/* --- 증상 체크 --- */}
        <section className="health-info">
          <h2 className="hw">건강 이상 징후 체크리스트</h2>
          <p>반려동물에게 해당하는 증상을 모두 선택하고 AI 분석 버튼을 눌러주세요.</p>

          <div className="symptom-grid">
            {symptoms.map((symptom) => (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={selectedSymptoms.includes(symptom) ? "selected" : ""}
              >
                {symptom}
              </button>
            ))}
          </div>

          <button 
            className="analyze-btn" 
            onClick={handleAnalyze} 
            disabled={isLoading}
          >
            {isLoading ? "분석 중..." : "AI 분석하기"}
          </button>
        </section>

        {/* --- AI 분석 결과 섹션 --- */}
        {analysisResult && (
          <section className="ai-result-section">
            <h2 className="hw">AI 분석 결과</h2>
            
            <div className="result-box danger">
              <span className="box-title">의심 질환 : {analysisResult.illness_name}</span>
              <p>{analysisResult.illness_details}</p>
            </div>
            
            <div className="result-box info">
              <span className="box-title">권장 대처 방안</span>
              <ul>
                {analysisResult.recommendations.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>

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

export default Health;