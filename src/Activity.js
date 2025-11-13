import React, { useState } from "react";
import "./Home.css";
import "./Activity.css";
import { NavLink } from 'react-router-dom';

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

import editIcon from "./img/Edit_fill.png";
import trashIcon from "./img/Trash_2.png";
import plusIcon from "./img/plusicon.png";
import circleImg from "./img/circle.png";

/* 주간 활동 더미 데이터 */
const weekly = [
  { label: "일요일", value: 20 },
  { label: "월요일", value: 50 },
  { label: "화요일", value: 28 },
  { label: "수요일", value: 38 },
  { label: "목요일", value: 9 },
  { label: "금요일", value: 31 },
  { label: "토요일", value: 48 },
];

const yTicks = [0, 10, 20, 30, 40, 50, 60, 70];

function formatDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export default function Activity() {
  /* 최근 산책 기록 목록 */
  const [walks, setWalks] = useState([
    { id: 1, title: "저녁 산책", minutes: 22, km: 1.1, date: "2025.08.15" },
  ]);

  /* 추가 모달 + 폼 */
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: "산책",
    minutes: "",
    distance: "",
  });

  /* 삭제 확인 모달 */
  const [confirm, setConfirm] = useState({ open: false, id: null });

  /* 수정 모달 + 폼 */
  const [edit, setEdit] = useState({
    open: false,
    id: null,
    type: "",
    minutes: "",
    distance: "",
  });

  /* ---------- 공통 핸들러 ---------- */
  const handleChange = (field) => (e) => {
    const value = e?.target?.value ?? "";
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (minutesStr, distanceStr) => {
    const minutesNum = parseInt(minutesStr, 10);
    if (Number.isNaN(minutesNum) || minutesNum <= 0) {
      alert("내용(분)을 1 이상의 숫자로 입력해 주세요.");
      return { ok: false };
    }
    const distanceNum =
      distanceStr === "" ? null : parseFloat(distanceStr);
    if (distanceStr !== "" && (Number.isNaN(distanceNum) || distanceNum < 0)) {
      alert("이동 거리(km)는 0 이상의 숫자여야 합니다.");
      return { ok: false };
    }
    return { ok: true, minutesNum, distanceNum };
  };

  /* ---------- 추가 저장 ---------- */
  const handleSave = (e) => {
    e.preventDefault();

    const v = validate(form.minutes, form.distance);
    if (!v.ok) return;

    const newItem = {
      id: Date.now(),
      title: `${form.type} 기록`,
      minutes: v.minutesNum,
      km: v.distanceNum,
      date: formatDate(),
    };

    // 아래에 추가
    setWalks((prev) => [...prev, newItem]);
    setShowModal(false);
    setForm({ type: "산책", minutes: "", distance: "" });
  };

  /* ---------- 삭제(확인 모달) ---------- */
  const openConfirm = (id) => setConfirm({ open: true, id });
  const closeConfirm = () => setConfirm({ open: false, id: null });
  const confirmDelete = () => {
    setWalks((prev) => prev.filter((w) => w.id !== confirm.id));
    closeConfirm();
  };

  /* ---------- 수정(열기/변경/저장) ---------- */
  const openEdit = (w) => {
    setEdit({
      open: true,
      id: w.id,
      type: w.title.replace(" 기록", "") || "산책", // 제목에서 활동종류 추정
      minutes: String(w.minutes ?? ""),
      distance: w.km == null ? "" : String(w.km),
    });
  };

  const handleEditChange = (field) => (e) => {
    const value = e?.target?.value ?? "";
    setEdit((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = (e) => {
    e.preventDefault();

    const v = validate(edit.minutes, edit.distance);
    if (!v.ok) return;

    setWalks((prev) =>
      prev.map((w) =>
        w.id === edit.id
          ? {
              ...w,
              title: `${edit.type} 기록`,
              minutes: v.minutesNum,
              km: v.distanceNum,
              // 날짜는 수정하지 않음. 필요하면 formatDate()로 갱신.
            }
          : w
      )
    );
    setEdit({ open: false, id: null, type: "", minutes: "", distance: "" });
  };

  const closeEdit = () =>
    setEdit({ open: false, id: null, type: "", minutes: "", distance: "" });

  return (
    <div className="home">
      {/* 헤더 */}
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

      {/* 본문 */}
      <main className="activity-container">
        {/* 오늘의 활동 */}
        <section className="section">
          <div className="section-title">
            <span className="blue-stick" />
            <h2>오늘의 활동</h2>
          </div>

          <div className="metrics">
            <Metric label="시간" value="45" unit="분" />
            <Metric label="거리" value="2.1" unit="km" />
          </div>
        </section>

        {/* 주간 활동 분석 */}
        <section className="section">
          <div className="section-title">
            <span className="blue-stick" />
            <h2>주간 활동 분석</h2>
          </div>

          <div className="chart">
            <div className="y-grid">
              {yTicks.map((n) => (
                <div className="y-row" key={n}>
                  <span className="y-label">{n}</span>
                </div>
              ))}
            </div>

            <div className="bars">
              {weekly.map((d) => (
                <div className="bar-wrap" key={d.label}>
                  <div
                    className="bar"
                    style={{ height: `${d.value * 8}px` }}
                    title={`${d.label} ${d.value}분`}
                  />
                  <div className="bar-label">{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 최근 산책 기록 */}
        <section className="section recent-walks">
          <div className="section-title">
            <span className="blue-stick" />
            <h2>최근 산책 기록</h2>
          </div>

          {/* 섹션 우상단 고정 +버튼 (한 개만) */}
          <button
            className="walk-fab"
            aria-label="빠른 추가"
            onClick={() => setShowModal(true)}
          >
            <img src={circleImg} alt="" className="walk-fab-circle" />
            <img src={plusIcon}  alt="" className="walk-fab-plus" />
          </button>

          {walks.map((w) => (
            <div className="walk-card" key={w.id}>
              <div className="walk-left">
                <div className="avatar" />
                <div className="walk-text">
                  <div className="walk-title">{w.title}</div>
                  <div className="walk-sub">
                    {w.minutes}분 {w.km != null ? `| ${w.km}km` : ""}
                  </div>
                </div>
              </div>

              <div className="walk-right">
                <div className="walk-date">{w.date}</div>

                <div className="walk-actions">
                  <button
                    className="icon-btn"
                    aria-label="수정"
                    onClick={() => openEdit(w)}
                  >
                    <img className="icon-img" src={editIcon} alt="" />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label="삭제"
                    onClick={() => openConfirm(w.id)}
                  >
                    <img className="icon-img" src={trashIcon} alt="" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* 추가 모달 */}
      {showModal && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <form className="modal-panel" onSubmit={handleSave}>
            <h2 className="modal-title">활동 기록 추가</h2>

            <div className="form-field">
              <label className="form-label">활동 종류</label>
              <input
                className="form-input"
                type="text"
                placeholder="예 : 아침 산책"
                value={form.type}
                onChange={handleChange("type")}
              />
            </div>

            <div className="form-field">
              <label className="form-label">내용</label>
              <input
                className="form-input"
                type="text"
                placeholder="예 : 30"
                value={form.minutes}
                onChange={handleChange("minutes")}
              />
            </div>

            <div className="form-field">
              <label className="form-label">이동 거리 (km, 선택)</label>
              <input
                className="form-input"
                type="text"
                placeholder="예 : 1.5"
                value={form.distance}
                onChange={handleChange("distance")}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button type="submit" className="btn btn-primary">
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 수정 모달 */}
      {edit.open && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={closeEdit} />
          <form className="modal-panel" onSubmit={saveEdit}>
            <h2 className="modal-title">활동 기록 수정</h2>

            <div className="form-field">
              <label className="form-label">활동 종류</label>
              <input
                className="form-input"
                type="text"
                value={edit.type}
                onChange={handleEditChange("type")}
              />
            </div>

            <div className="form-field">
              <label className="form-label">내용</label>
              <input
                className="form-input"
                type="text"
                value={edit.minutes}
                onChange={handleEditChange("minutes")}
              />
            </div>

            <div className="form-field">
              <label className="form-label">이동 거리 (km, 선택)</label>
              <input
                className="form-input"
                type="text"
                value={edit.distance}
                onChange={handleEditChange("distance")}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeEdit}
              >
                취소
              </button>
              <button type="submit" className="btn btn-primary">
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {confirm.open && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={closeConfirm} />
          <div className="modal-panel confirm-panel">
            <h3 className="confirm-title">정말 삭제하시겠습니까?</h3>
            <p className="confirm-desc">이 기록은 복구할 수 없습니다.</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={closeConfirm}>
                취소
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

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

function Metric({ label, value, unit }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        <span className="metric-number">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
    </div>
  );
}
