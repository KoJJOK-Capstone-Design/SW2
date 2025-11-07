import React, { useState } from "react";
import "./Health.css";

/* 이미지 import */
import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

// --- 초기 더미 데이터 ---
const initialRecords = [
  {
    id: 1,
    type: "visit",
    icon: "🏥",
    title: "정기 검진",
    location: "멍냥 동물 병원",
    date: "2025.08.15",
  },
  {
    id: 2,
    type: "vax",
    icon: "💉",
    title: "종합 백신 5차",
    location: "멍냥 동물 병원",
    date: "2025.08.15",
  },
  {
    id: 3,
    type: "med",
    icon: "💊",
    title: "심장사상충 약 복용",
    location: "넥스가드 스펙트라",
    date: "2025.08.15",
  },
];

const Health = () => {
  /* 기존 상태 */
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);

  /* 건강 기록 상태 */
  const [records, setRecords] = useState(initialRecords);
  const [activeTab, setActiveTab] = useState("all");

  /* ✅ 모달 상태 */
  const [showModal, setShowModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: "visit",
    title: "",
    location: "",
    date: "",
  });

  const symptoms = [
    "구토",
    "식사 부진",
    "식욕 부진",
    "묽은 변",
    "과도한 갈증",
    "피부 발진",
    "비듬",
    "탈모",
    "기력 저하",
    "수면 증가",
    "불안 / 공격성",
    "걸음걸이 이상",
  ];

  /* 증상 선택 */
  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  /* ✅ 모달 열기 */
  const handleAdd = () => {
    setShowModal(true);
  };

  /* 입력 변경 */
  const handleChange = (e) => {
    setNewRecord({
      ...newRecord,
      [e.target.name]: e.target.value,
    });
  };

  /* ✅ 모달 저장 */
  const handleSave = () => {
    if (!newRecord.title || !newRecord.location || !newRecord.date) {
      alert("모든 내용을 입력해주세요!");
      return;
    }

    const iconMap = {
      visit: "🏥",
      vax: "💉",
      med: "💊",
    };

    const created = {
      id: Date.now(),
      type: newRecord.type,
      icon: iconMap[newRecord.type],
      title: newRecord.title,
      location: newRecord.location,
      date: newRecord.date,
    };

    setRecords([created, ...records]);

    setNewRecord({ type: "visit", title: "", location: "", date: "" });
    setShowModal(false);
  };

  /* 삭제 */
  const handleDelete = (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      setRecords(records.filter((r) => r.id !== id));
    }
  };

  /* 필터링 */
  const filteredRecords = records.filter((record) =>
    activeTab === "all" ? true : record.type === activeTab
  );

  return (
    <div className="health-page">

      {/* ✅ ✅ ✅ 모달 UI */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>새로운 건강 기록 추가</h3>

            <label>종류</label>
            <select
              name="type"
              value={newRecord.type}
              onChange={handleChange}
            >
              <option value="visit">병원 방문</option>
              <option value="vax">예방접종</option>
              <option value="med">투약</option>
            </select>

            <label>제목</label>
            <input
              type="text"
              name="title"
              placeholder="예: 종합 백신 5차"
              value={newRecord.title}
              onChange={handleChange}
            />

            <label>장소 / 약 이름</label>
            <input
              type="text"
              name="location"
              placeholder="예: 멍냥 동물 병원"
              value={newRecord.location}
              onChange={handleChange}
            />

            <label>날짜</label>
            <input
              type="date"
              name="date"
              value={newRecord.date}
              onChange={handleChange}
            />

            <div className="modal-buttons">
              <button className="save-btn" onClick={handleSave}>저장</button>
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 네비게이션 */}
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <img src={logoBlue} className="paw" alt="" />
            <span className="brand-text">멍냥멍냥</span>
          </div>
          <nav className="menu">
            <a href="/activity">활동</a>
            <a href="/health" className="active">건강</a>
            <a href="/calendar">캘린더</a>
            <a href="/community">커뮤니티</a>
          </nav>
          <nav className="menulink">
            <a href="/signup">회원가입</a>
            <a href="/signin">로그인</a>
          </nav>
        </div>
      </header>

      {/* ✅ 건강 컨텐츠 */}
      <div className="health-container">

        {/* ✅ 건강 정보 */}
        <section className="health-info">
          <h2 className="hw">냥냥님의 건강 정보</h2>
          <div className="info-grid">
            <div><span>품종</span><b>말티즈</b></div>
            <div><span>현재 체중</span><b>3.5kg</b></div>
            <div><span>나이</span><b>2살</b></div>
            <div><span>BCS</span><b>미입력</b></div>
          </div>
        </section>

        {/* ✅ 체중 그래프 placeholder */}
        <section className="health-info">
          <h2 className="hw">체중 변화 그래프</h2>
          <div className="graph-box">
            <p>그래프 자리</p>
          </div>
        </section>

        {/* ✅ 건강 기록 */}
        <section className="health-info">
          <div className="health-header">
            <h2 className="hw">최근 건강 기록</h2>
            <button className="add-button" onClick={handleAdd}>+</button>
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
                <li key={record.id} className="record-item">
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
                      <button className="edit-btn">
                        <img src={editIcon} className="icon-img" alt="edit" />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(record.id)}
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

        {/* ✅ 증상 체크 */}
        <section className="health-info">
          <h2 className="hw">건강 이상 징후 체크리스트</h2>
          <p>반려동물에게 해당하는 증상을 선택하세요.</p>

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

          <button className="analyze-btn">AI 분석하기</button>
        </section>
      </div>

      {/* ✅ footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="logo-row">

            <div className="logo-stack">
              <img src={logoGray} className="paw-bg" alt="" />
              <span className="wordmark">KoJJOK</span>
            </div>

            <div className="grid">
              <div className="col">
                <h3>Hyeona Kim</h3>
                <p>UI/UX Design</p>
                <a href="https://github.com/ouskxk" className="github-link">
                  <img src={githubpic} className="github-icon" alt="" /> ouskxk
                </a>
              </div>
              <div className="col">
                <h3>Jiun Ko</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/suerte223" className="github-link">
                  <img src={githubpic} className="github-icon" alt="" /> suerte223
                </a>
              </div>
              <div className="col">
                <h3>Seungbeom Han</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/hsb9838" className="github-link">
                  <img src={githubpic} className="github-icon" alt="" /> hsb9838
                </a>
              </div>
              <div className="col">
                <h3>Munjin Yang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/munjun0608" className="github-link">
                  <img src={githubpic} className="github-icon" alt="" /> munjun0608
                </a>
              </div>
              <div className="col">
                <h3>Youngbin Kang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/0bini" className="github-link">
                  <img src={githubpic} className="github-icon" alt="" /> 0bini
                </a>
              </div>
            </div>

            <div className="tech-stack">
              <h3>TECH STACK</h3>
              <img src={reactpic} className="react-icon" alt="" />
              <img src={djangopic} className="django-icon" alt="" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Health;
