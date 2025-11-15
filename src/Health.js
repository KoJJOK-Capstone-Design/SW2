import React, { useState, useEffect } from "react";
import "./Health.css";
import { NavLink, Link } from "react-router-dom";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

import bell from "./img/bell.png";
import chat from "./img/chat.png";
import circle from "./img/circle.png";
import plusicon from "./img/plusicon.png";

// Chart.js
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// 초기 더미 데이터
const initialRecords = []; 

const Health = ({ user, pet }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [records, setRecords] = useState(initialRecords);
  const [activeTab, setActiveTab] = useState("all");

  // 추가 모달
  const [showModal, setShowModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: "",
    title: "",
    location: "",
    date: "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 수정 모달
  const [showEditModal, setShowEditModal] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);

  // 삭제 모달
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // AI 분석
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 헤더 팝업 관련 state
  const [showBellPopup, setShowBellPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);

  // 할 일
  const [tasks, setTasks] = useState([
    { id: 1, text: "산책하기", done: true },
    { id: 2, text: "밥주기", done: false },
    { id: 3, text: "양치시키기", done: false },
    { id: 4, text: "물주기", done: false },
  ]);
  const [newTask, setNewTask] = useState("");


  // 체중 그래프 (데이터만; 실제 렌더는 필요할 때 추가)
  const weightData = {
    labels: ["9월", "10월", "11월", "12월", "1월", "2월", "3월", "4월", "5월"],
    datasets: [
      {
        label: "체중 (kg)",
        data: [3.2, 3.4, 3.35, 3.5, 3.6, 3.45, 3.5, 3.55, 3.52],
        borderColor: "#4b7bec",
        tension: 0.4,
        fill: true,
        backgroundColor: "rgba(75,123,236,0.1)",
        pointBackgroundColor: "#fff",
        pointBorderColor: "#4b7bec",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#dfebfa",
        titleColor: "#000",
        bodyColor: "#0c0c0c",
        padding: 12,
        cornerRadius: 8,
        borderColor: "#dfebfa",
        borderWidth: 3,
        caretSize: 0,
        displayColors: false,
        boxPadding: 8,
        bodyFont: {
          size: 14,
          family: "Pretendard",
        },
        titleFont: {
          size: 12,
          family: "Pretendard",
        },
      },
    },
    scales: {
      y: {
        min: 3.0,
        grid: {
          color: "#e9e9e9",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const symptoms = [
    "구토",
    "설사",
    "식사 부진",
    "복부 팽만",
    "과도한 갈증",
    "피부 발진",
    "비듬",
    "탈모",
    "기력 저하",
    "수면 증가",
    "불안 / 공격성",
    "걸음걸이 이상",
  ];

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  // 추가 모달
  const handleAdd = () => {
    setShowModal(true);
    setIsDropdownOpen(false);
  };

  const handleChange = (e) => {
    setNewRecord({
      ...newRecord,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    if (
      !newRecord.type ||
      !newRecord.title ||
      !newRecord.location ||
      !newRecord.date
    ) {
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSave();
  };

  // 수정 모달
  const handleEditClick = (record) => {
    setRecordToEdit(record);
    setShowEditModal(true);
    setIsEditDropdownOpen(false);
  };

  const handleEditChange = (e) => {
    setRecordToEdit({
      ...recordToEdit,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateSave = () => {
    if (
      !recordToEdit.type ||
      !recordToEdit.title ||
      !recordToEdit.location ||
      !recordToEdit.date
    ) {
      alert("모든 내용을 입력해주세요!");
      return;
    }
    const iconMap = { visit: "🏥", vax: "💉", med: "💊" };
    const updatedRecord = {
      ...recordToEdit,
      icon: iconMap[recordToEdit.type],
    };
    setRecords(
      records.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );
    setShowEditModal(false);
    setRecordToEdit(null);
    setIsEditDropdownOpen(false);
  };

  const handleEditFormSubmit = (e) => {
    e.preventDefault();
    handleUpdateSave();
  };

  // 삭제 모달
  const handleDeleteClick = (id) => {
    setRecordToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      setRecords(records.filter((r) => r.id !== recordToDelete));
    }
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };

  // AI 분석 (더미)
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
    console.log("fake send:", analysisData);

    setTimeout(() => {
      const fakeResponse = {
        illness_name: "복합적 문제",
        illness_details: `선택하신 '${selectedSymptoms.join(
          ", "
        )}' 증상은 급성 위장염의 가능성을 시사합니다. 소화기관의 염증으로 인해 발생할 수 있으며, 탈수 증상으로 이어질 수 있어 주의가 필요합니다.`,
        recommendations: [
          "유산균을 급여하고 식단을 점검해주세요.",
          "탈수 방지를 위해 수분 섭취에 신경써주세요.",
          "편안한 환경에서 충분히 쉴 수 있도록 해주세요.",
          "다른 증상이 동반되거나 24시간 내 호전되지 않으면 수의사와 상담하세요.",
        ],
      };
      setAnalysisResult(fakeResponse);
      setIsLoading(false);
    }, 1500);
  };

  const filteredRecords = records.filter((record) =>
    activeTab === "all" ? true : record.type === activeTab
  );

  return (
    <div className="health-page">
      
      {/* --- 모달들 --- */}
      {showModal && (
        <div className="health-add-overlay" onClick={() => setIsDropdownOpen(false)}>
          <div className="health-add-modal" onClick={(e) => e.stopPropagation()}>

            <h2>새로운 건강 기록 추가</h2>

            <div className="health-add-group">
              <label>종류</label>

              <div className="health-select-wrapper">
                <button
                  type="button"
                  className={`health-select-trigger ${newRecord.type === "" ? "placeholder" : ""}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>
                    {newRecord.type === ""
                      ? "선택하세요"
                      : newRecord.type === "visit"
                        ? "병원 방문"
                        : newRecord.type === "vax"
                          ? "예방접종"
                          : "투약"}
                  </span>

                  <span className="health-select-arrow">▼</span>
                </button>

                {isDropdownOpen && (
                  <div className="health-select-options">
                    <div
                      className="health-select-option"
                      onClick={() => {
                        setNewRecord({ ...newRecord, type: "visit" });
                        setIsDropdownOpen(false);
                      }}
                    >
                      병원 방문
                    </div>

                    <div
                      className="health-select-option"
                      onClick={() => {
                        setNewRecord({ ...newRecord, type: "vax" });
                        setIsDropdownOpen(false);
                      }}
                    >
                      예방접종
                    </div>

                    <div
                      className="health-select-option"
                      onClick={() => {
                        setNewRecord({ ...newRecord, type: "med" });
                        setIsDropdownOpen(false);
                      }}
                    >
                      투약
                    </div>
                  </div>
                )}
              </div>
            </div>


            <div className="health-add-group">
              <label>제목</label>
              <input className="health-add-input" name="title" value={newRecord.title}
                onChange={handleChange} placeholder="예: 종합 백신 5차" required />
            </div>

            <div className="health-add-group">
              <label>장소 / 약 이름</label>
              <input className="health-add-input" name="location" value={newRecord.location}
                onChange={handleChange} placeholder="예: 멍냥 동물병원" required />
            </div>

            <div className="health-add-group">
              <label>날짜</label>
              <input className="health-add-input" name="date" type="date"
                value={newRecord.date} onChange={handleChange} required />
            </div>

            <div className="health-add-buttons">
              <button className="health-add-btn cancel" onClick={() => setShowModal(false)}>취소</button>
              <button className="health-add-btn save" onClick={handleFormSubmit}>저장</button>
            </div>

          </div>
        </div>
      )}


      {/* 수정 모달 */}
      {showEditModal && recordToEdit && (
        <div
          className="health-modal-overlay"
          onClick={() => {
            if (isEditDropdownOpen) setIsEditDropdownOpen(false);
            setShowEditModal(false);
          }}
        >
          <div
            className="health-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>건강 기록 수정</h2>
            <form onSubmit={handleEditFormSubmit}>
              <div className="form-group">
                <label>종류</label>
                <div className="custom-select-wrapper">
                  <button
                    type="button"
                    className={`custom-select-trigger ${recordToEdit.type === "" ? "placeholder" : ""
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditDropdownOpen(!isEditDropdownOpen);
                    }}
                  >
                    {recordToEdit.type === "visit" && "병원 방문"}
                    {recordToEdit.type === "vax" && "예방접종"}
                    {recordToEdit.type === "med" && "투약"}
                    {recordToEdit.type === "" && "선택하세요"}
                  </button>
                  {isEditDropdownOpen && (
                    <ul className="custom-options">
                      <li
                        className="custom-option"
                        onClick={() => {
                          setRecordToEdit({
                            ...recordToEdit,
                            type: "visit",
                          });
                          setIsEditDropdownOpen(false);
                        }}
                      >
                        병원 방문
                      </li>
                      <li
                        className="custom-option"
                        onClick={() => {
                          setRecordToEdit({
                            ...recordToEdit,
                            type: "vax",
                          });
                          setIsEditDropdownOpen(false);
                        }}
                      >
                        예방접종
                      </li>
                      <li
                        className="custom-option"
                        onClick={() => {
                          setRecordToEdit({
                            ...recordToEdit,
                            type: "med",
                          });
                          setIsEditDropdownOpen(false);
                        }}
                      >
                        투약
                      </li>
                    </ul>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>제목</label>
                <input
                  className="input"
                  type="text"
                  name="title"
                  placeholder="예: 종합 백신 5차"
                  value={recordToEdit.title}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>장소 / 약 이름</label>
                <input
                  className="input"
                  type="text"
                  name="location"
                  placeholder="예: 멍냥 동물 병원"
                  value={recordToEdit.location}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>날짜</label>
                <input
                  className="input"
                  type="date"
                  name="date"
                  placeholder="연도-월-일"
                  value={recordToEdit.date}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowEditModal(false)}
                >
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 모달 */}
      {showDeleteModal && (
        <div className className="health-modal-overlay" onClick={handleCancelDelete}>
          <div
            className="health-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>정말 삭제하시겠습니까?</h2>
            <p className="delete-confirm-text">이 기록은 복구할 수 없습니다.</p>
            <div className="form-buttons">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancelDelete}
              >
                취소
              </button>
              <button
                type="button"
                className="btn-delete-confirm"
                onClick={handleConfirmDelete}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 헤더 --- */}
      <header className="nav">
        <div className="nav-inner">
          <Link to="/dashboard" className="brand">
            <img src={logoBlue} alt="paw logo" className="paw" />
            <span className="brand-text">멍냥멍냥</span>
          </Link>

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
      
      {/* --- 본문 --- */}
      <div className="health-container">
        {/* 펫 정보 */}
        <section className="health-info">
          <h2 className="hw">
            {pet ? pet.name : "반려동물"}님의 건강 정보
          </h2>
          <div className="info-grid">
            <div>
              <span>품종</span>
              <b>{pet ? pet.breed : "미입력"}</b>
            </div>
            <div>
              <span>현재 체중</span>
              <b>{pet ? pet.weight : "미입력"}</b>
            </div>
            <div>
              <span>나이</span>
              <b>{pet ? pet.age : "미입력"}</b>
            </div>
            <div>
              <span>BCS</span>
              {pet && pet.bcs && pet.bcs !== "미입력" ? (
                <b>{pet.bcs}</b>
              ) : (
                <>
                  <b>미입력</b>
                  <span
                    className="test"
                    onClick={() => (window.location.href = "/BcsTest")}
                  >
                    진단하기
                  </span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* 최근 건강 기록 */}
        <section className="health-info">
          <div className="health-header">
            <h2 className="hw">최근 건강 기록</h2>
            <button className="add-button" onClick={handleAdd}></button>
          </div>

          <nav className="health-tabs">
            <button
              className={activeTab === "all" ? "active" : ""}
              onClick={() => setActiveTab("all")}
            >
              전체
            </button>
            <button
              className={activeTab === "vax" ? "active" : ""}
              onClick={() => setActiveTab("vax")}
            >
              예방접종
            </button>
            <button
              className={activeTab === "visit" ? "active" : ""}
              onClick={() => setActiveTab("visit")}
            >
              병원 방문
            </button>
            <button
              className={activeTab === "med" ? "active" : ""}
              onClick={() => setActiveTab("med")}
            >
              투약
            </button>
          </nav>

          <ul className="health-record-list">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <li
                  key={record.id}
                  className="record-item"
                  data-type={record.type}
                >
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
                      <button
                        className="edit-btn"
                        onClick={() => handleEditClick(record)}
                      >
                        <img
                          src={editIcon}
                          className="icon-img"
                          alt="edit"
                        />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteClick(record.id)}
                      >
                        <img
                          src={trashIcon}
                          className="icon-img"
                          alt="delete"
                        />
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

        {/* 증상 체크 */}
        <section className="health-info">
          <h2 className="hw">건강 이상 징후 체크리스트</h2>
          <p>반려동물에게 해당하는 증상을 모두 선택하고 AI 분석 버튼을 눌러주세요.</p>

          <div className="symptom-grid">
            {symptoms.map((symptom) => (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={
                  selectedSymptoms.includes(symptom) ? "selected" : ""
                }
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

        {/* AI 분석 결과 */}
        {analysisResult && (
          <section className="ai-result-section">
            <h2 className="hw">AI 분석 결과</h2>

            <div className="result-box danger">
              <span className="box-title">
                의심 질환 : {analysisResult.illness_name}
              </span>
              <p>{analysisResult.illness_details}</p>
            </div>

            <div className="result-box info">
              <span className="box-title">권장 대처 방안</span>
              <ul>
                {analysisResult.recommendations.map((action, idx) => (
                  <li key={idx}>{action}</li>
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
                  <a
                    href={`https://github.com/${id}`}
                    className="github-link"
                  >
                    <img
                      src={githubpic}
                      alt="GitHub Logo"
                      className="github-icon"
                    />
                    {id}
                  </a>
                </div>
              ))}
            </div>

            <div className="tech-stack">
              <h3>TECH STACK</h3>
              <img src={reactpic} alt="React Logo" className="react-icon" />
              <img
                src={djangopic}
                alt="Django Logo"
                className="django-icon"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Health;