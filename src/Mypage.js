import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, NavLink } from "react-router-dom"; 

import "./Dashboard.css";
import "./Mypage.css"; 

// 이미지들 불러오기
import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";
import bell from "./img/bell.png";
import chat from "./img/chat.png";
import plusicon from "./img/plusicon.png"; 


// =========================================================
// 🧩 임시 그래프 렌더링 함수 (JSX 내에서 직접 사용)
// =========================================================
const renderActivityGraph = () => {
    return (
        <div className="activity-chart-placeholder">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="chart-svg">
               <path d="M 10 90 L 30 70 L 50 60 L 70 80 L 90 50" fill="none" stroke="#007bff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
        </div>
    );
};

// =========================================================
// 🧩 마이페이지 모달 컴포넌트
// =========================================================
const MyPageModal = ({ 
    currentModal, closeModal, 
    petFormData, setPetFormData, handlePetFormChange, handlePetInfoSave, handleDeletePet, petInfo, setCurrentModal,
    handleWithdraw, accountFormData, handleAccountFormChange, handleAccountSettingsSave
}) => {
    
    // 폼/뷰에 따라 다른 제목을 설정
    const getModalTitle = () => {
        switch (currentModal) {
            case 'settings': return '계정 설정';
            case 'edit': return '정보 수정';
            case 'withdraw': return '회원 탈퇴';
            case 'deletePet': return '반려동물 해제';
            default: return '모달';
        }
    };

    // 모달 내용 렌더링
    const renderModalContent = () => {
        switch (currentModal) {
            case 'settings':
                return (
                    <form onSubmit={handleAccountSettingsSave}>
                        <div className="form-group">
                            <label htmlFor="nickname">닉네임</label>
                            <input 
                                type="text" 
                                id="nickname" 
                                name="nickname" 
                                value={accountFormData.nickname} 
                                onChange={handleAccountFormChange} 
                            />
                        </div>
                        <div className="form-group">
                            <label>새 비밀번호</label>
                            <input 
                                type="password" 
                                name="newPassword" 
                                placeholder="새 비밀번호 입력" 
                                value={accountFormData.newPassword}
                                onChange={handleAccountFormChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>새 비밀번호 확인</label>
                            <input 
                                type="password" 
                                name="confirmNewPassword" 
                                placeholder="새 비밀번호 확인" 
                                value={accountFormData.confirmNewPassword}
                                onChange={handleAccountFormChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>비밀번호 확인</label>
                            <input 
                                type="password" 
                                name="currentPassword" 
                                placeholder="현재 비밀번호 확인" 
                                value={accountFormData.currentPassword}
                                onChange={handleAccountFormChange}
                            />
                        </div>
                        
                        <div className="form-actions form-actions-settings">
                            <button 
                                type="button" 
                                className="btn btn-red-text" 
                                onClick={() => setCurrentModal('withdraw')}
                            >
                                탈퇴하기
                            </button>
                            <div className="button-group">
                                <button type="button" className="btn btn-cancel" onClick={closeModal}>취소</button>
                                <button type="submit" className="btn btn-primary">저장</button>
                            </div>
                        </div>
                    </form>
                );

            case 'edit':
                return (
                    <form onSubmit={handlePetInfoSave}>
                        {/* ⭐️ 반려동물 사진 섹션 */}
                        <section className="modal-section-group">
                            <h2 className="modal-section-title">
                                <span className="section-title-bar"></span> 
                                <span className="section-title-text">반려동물 사진</span> 
                            </h2>
                            <div className="form-group file-input-wrapper">
                                <input 
                                    type="file" 
                                    id="petImage" 
                                    name="imageFile" 
                                    accept="image/*" 
                                    onChange={handlePetFormChange} 
                                />
                                <div className="file-input-display-box">
                                    <label htmlFor="petImage" className="file-select-file">파일 선택</label>
                                    <span className="file-name-filedisplay">
                                        {petFormData.imageFile ? petFormData.imageFile.name : '선택된 파일 없음'}
                                    </span>
                                </div>
                                {/* 선택된 이미지 미리보기 */}
                                {petFormData.imageUrl && (
                                    <div className="pet-image-preview">
                                        <img src={petFormData.imageUrl} alt="반려동물 미리보기" style={{ maxWidth: '100px', maxHeight: '100px', marginTop: '10px', borderRadius: '5px' }} />
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ⭐️ 기본 정보 섹션 - 2열 그리드 */}
                        <section className="modal-section-group">
                            <h2 className="modal-section-title">
                                <span className="section-title-bar"></span> 
                                <span className="section-title-text">기본 정보</span> 
                            </h2>
                            <div className="form-row-two-cols">
                                <div className="form-group">
                                    <label htmlFor="petName">이름</label>
                                    <input type="text" id="petName" name="name" placeholder="반려동물의 이름" value={petFormData.name} onChange={handlePetFormChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="petBreed">품종</label>
                                    <input type="text" id="petBreed" name="breed" placeholder="품종 입력" value={petFormData.breed} onChange={handlePetFormChange} />
                                </div>
                            </div>
                            <div className="form-row-two-cols">
                                <div className="form-group">
                                    <label htmlFor="petSpecies">종류</label>
                                    <div className="radio-group-horizontal">
                                        <label><input type="radio" name="species" value="강아지" checked={petFormData.species === '강아지'} onChange={handlePetFormChange} /> 강아지</label>
                                        <label><input type="radio" name="species" value="고양이" checked={petFormData.species === '고양이'} onChange={handlePetFormChange} /> 고양이</label>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="petBirth">생년월일</label>
                                    <input type="date" id="petBirth" name="birthdate" value={petFormData.birthdate} onChange={handlePetFormChange} />
                                </div>
                            </div>
                        </section>

                        {/* ⭐️ 건강 정보 섹션 - 2열 그리드 */}
                        <section className="modal-section-group">
                            <h2 className="modal-section-title">
                                <span className="section-title-bar"></span> 
                                <span className="section-title-text">건강 정보</span> 
                            </h2>
                            <div className="form-row-two-cols">
                                <div className="form-group">
                                    <label htmlFor="petGender">성별</label>
                                    <div className="radio-group-horizontal">
                                        <label><input type="radio" name="gender" value="수컷" checked={petFormData.gender === '수컷'} onChange={handlePetFormChange} /> 수컷</label>
                                        <label><input type="radio" name="gender" value="암컷" checked={petFormData.gender === '암컷'} onChange={handlePetFormChange} /> 암컷</label>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="petNeutered">중성화 여부</label>
                                    <div className="radio-group-horizontal">
                                        {/* ⭐️ 초기값 null과 비교하여 체크 해제 */}
                                        <label><input type="radio" name="neutered" value={true} checked={petFormData.neutered === true} onChange={() => setPetFormData(prev => ({...prev, neutered: true}))} /> 완료</label>
                                        <label><input type="radio" name="neutered" value={false} checked={petFormData.neutered === false} onChange={() => setPetFormData(prev => ({...prev, neutered: false}))} /> 미완료</label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-row-two-cols">
                                <div className="form-group">
                                    <label htmlFor="petWeight">체중 (kg)</label>
                                    <input type="number" step="0.1" id="petWeight" name="weight" placeholder="예: 3.2" value={petFormData.weight} onChange={handlePetFormChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="petActivity">하루 목표 활동량 (분)</label>
                                    <input type="number" id="petActivity" name="target_activity_minutes" placeholder="예: 45" value={petFormData.target_activity_minutes} onChange={handlePetFormChange} />
                                </div>
                            </div>
                        </section>
                        
                        {/* ⭐️ 특이 사항 섹션 */}
                        <section className="modal-section-group">
                            <h2 className="modal-section-title">
                                <span className="section-title-bar"></span> 
                                <span className="section-title-text">특이 사항 (선택)</span> 
                            </h2>
                            <div className="form-group">
                                <textarea 
                                    id="petMemo" 
                                    name="memo" 
                                    rows="3" 
                                    placeholder="알레르기, 질병 등 특별한 정보를 입력해주세요." 
                                    value={petFormData.memo} 
                                    onChange={handlePetFormChange} 
                                />
                            </div>
                        </section>

                        <div className="form-actions form-actions-edit">
                            <button type="button" className="btn btn-red-text" onClick={() => setCurrentModal('deletePet')}>이 반려동물 등록 해제</button>
                            <div className="button-group">
                                <button type="button" className="btn btn-cancel" onClick={closeModal}>취소</button>
                                <button type="submit" className="btn btn-primary">저장</button>
                            </div>
                        </div>
                    </form>
                );

            case 'withdraw':
                return (
                    <div className="withdraw-content">
                        <div className="withdraw-info">
                            <h3>정말로 탈퇴하시겠습니까?</h3>
                            <p>탈퇴 시 회원님의 모든 기록과 정보가 삭제되며, 복구는 불가능합니다.</p>
                        </div>
                        <form className="withdraw-form">
                            <div className="form-group"><label>비밀번호 확인</label><input type="password" placeholder="비밀번호 입력" /></div>
                            <div className="form-actions form-actions-withdraw">
                                <button type="button" className="btn btn-cancel" onClick={closeModal}>취소</button>
                                <button type="button" className="btn btn-danger" onClick={handleWithdraw}>탈퇴</button>
                            </div>
                        </form>
                    </div>
                );

            case 'deletePet':
                return (
                    <div className="delete-pet-content">
                        <p className="delete-pet-prompt">
                            **{petInfo.name}**의 정보를 해제하시겠습니까?
                        </p>
                        <div className="pet-detail-card pet-detail-card--delete-confirm">
                             <div className="pet-info-header">
                                <span className="pet-name-and-type">
                                    {petInfo.name} ({petInfo.species === 'cat' ? '고양이' : '강아지'})
                                </span>
                            </div>
                            <p className="pet-description-line">
                                {petInfo.breed}, {petInfo.age}살, {petInfo.neutered ? '중성화 완료' : '중성화 안함'}, {petInfo.weight}kg
                            </p>
                        </div>

                        <div className="form-actions form-actions-delete-pet">
                            <button type="button" className="btn btn-cancel" onClick={closeModal}>취소</button>
                            <button type="button" className="btn btn-danger" onClick={handleDeletePet}>삭제</button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">{getModalTitle()}</h2>
                <div className="modal-body">
                    {renderModalContent()}
                </div>
            </div>
        </div>
    );
};

// =========================================================
// ⭐️ 메인 컴포넌트
// =========================================================

export default function MyPage() {
    // 닉네임 상태
    const [username, setUsername] = useState("VV");
    const [userEmail, setUserEmail] = useState("wldns@naver.com");
    const [userId, setUserId] = useState("DogAndCatDAC"); 
    // 사용자 프로필 이미지 URL 상태 (NewFamily.js와 연동)
    const [userProfileImageUrl, setUserProfileImageUrl] = useState("https://i.pravatar.cc/120?img=11");

    const [modalOpen, setModalOpen] = useState(false);
    const [currentModal, setCurrentModal] = useState(null); 

    // 계정 설정 폼 상태
    const [accountFormData, setAccountFormData] = useState({
        nickname: "VV", 
        newPassword: '',
        confirmNewPassword: '',
        currentPassword: '', 
    });
    
    // 펫 상태
    const [petFormData, setPetFormData] = useState({
        name: "냥냥이", 
        // ⭐️ 초기값을 빈 문자열로 설정하여 체크 해제
        species: "", 
        breed: "코리안숏헤어", 
        birth_date: "2023-10-12",
        // ⭐️ 초기값을 빈 문자열로 설정하여 체크 해제
        gender: "", 
        // ⭐️ 초기값을 null로 설정하여 체크 해제
        neutered: null, 
        weight: "4.2", 
        memo: "기타사항 1",
        imageFile: null, 
        imageUrl: null,
        target_activity_minutes: "45", // 목표 활동량 추가
    });

    const [petInfo, setPetInfo] = useState({
        id: 1, name: "냥냥이", species: "cat", breed: "코리안숏헤어", age: 2, 
        neutered: true, weight: 4.2, 
        upcoming: [{ id: 101, content: "정기 검진일", date: "D-1", color: '#f59e0b' }],
        activityGraph: [{ value: 1 }, { value: 3 }, { value: 2 }, { value: 4 }, { value: 3 }, { value: 5 }] 
    });
    
    const [showBellPopup, setShowBellPopup] = useState(false);
    const [showChatPopup, setShowChatPopup] = useState(false);

    // API 호출: 닉네임, ID, 이미지 URL 가져오기
    useEffect(() => {
        const token = localStorage.getItem("token");
        
        // LocalStorage에서 저장된 URL을 먼저 확인합니다.
        const storedImageUrl = localStorage.getItem("user_profile_image_url");

        if (storedImageUrl) {
            setUserProfileImageUrl(storedImageUrl);
        }

        if (!token) return;

        const fetchUser = async () => {
            try {
                const res = await axios.get(
                    "https://youngbin.pythonanywhere.com/api/v1/users/profile/",
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                const fetchedUsername = res.data?.nickname || res.data?.username || "멍냥";
                const fetchedUserId = res.data?.username || "DogAndCatDAC"; 
                // API 응답 URL이 있다면 사용, 없으면 LocalStorage URL 사용
                const fetchedProfileImage = res.data?.user_profile_image_url || storedImageUrl || "https://i.pravatar.cc/120?img=11";

                setUsername(fetchedUsername);
                setUserId(fetchedUserId);
                setUserEmail(res.data?.email || "이메일 정보 없음");
                
                setUserProfileImageUrl(fetchedProfileImage);
                setAccountFormData(prev => ({ ...prev, nickname: fetchedUsername }));

            } catch (err) {
                console.error("유저 정보 불러오기 실패:", err.response?.data || err.message);
            }
        };

        fetchUser();
    }, []);
    
    // 모달 열기 핸들러
    const openModal = (view) => {
        setCurrentModal(view);
        setModalOpen(true);
    };

    // 모달 닫기 핸들러
    const closeModal = () => {
        setModalOpen(false);
        // 모달이 완전히 닫힌 후 상태를 리셋하여 메모리 누수 방지 (특히 URL.createObjectURL)
        setTimeout(() => {
            setCurrentModal(null);
            if (petFormData.imageUrl && petFormData.imageUrl.startsWith("blob:")) {
                URL.revokeObjectURL(petFormData.imageUrl);
            }
            // 모달 닫을 때마다 이미지 정보 리셋
            setPetFormData(prev => ({ ...prev, imageFile: null, imageUrl: null }));
        }, 300); 
    };

    // 폼 변경 핸들러 (반려동물)
    const handlePetFormChange = (e) => {
        if (e.target.name === "imageFile") {
            const file = e.target.files[0];
            if (file) {
                const imageUrl = URL.createObjectURL(file); // 미리보기 URL 생성
                setPetFormData(prev => ({ ...prev, imageFile: file, imageUrl: imageUrl }));
                // 사용자 프로필 사진도 이 이미지로 임시 업데이트
                setUserProfileImageUrl(imageUrl);
            } else {
                setPetFormData(prev => ({ ...prev, imageFile: null, imageUrl: null }));
            }
        } else {
            setPetFormData({ ...petFormData, [e.target.name]: e.target.value });
        }
    };

    // 폼 변경 핸들러 (계정 설정)
    const handleAccountFormChange = (e) => {
        setAccountFormData({ ...accountFormData, [e.target.name]: e.target.value });
    };

    // 저장 핸들러 (반려동물)
    const handlePetInfoSave = (e) => {
        e.preventDefault();
        alert("반려동물 정보가 저장되었습니다. (실제 서버 업로드는 백엔드 연동 필요)");
        closeModal();
    };

    // 저장 핸들러 (계정 설정)
    const handleAccountSettingsSave = (e) => {
        e.preventDefault();
        alert(`계정 정보 (닉네임: ${accountFormData.nickname})가 저장되었습니다.`);
        setUsername(accountFormData.nickname); 
        closeModal();
    };

    // 탈퇴 핸들러
    const handleWithdraw = () => {
        try {
            if (window.confirm("회원 탈퇴를 계속 진행하시겠습니까?")) {
                alert("회원 탈퇴가 완료되었습니다.");
                if (typeof closeModal === 'function') {
                    closeModal();
                }
            }
        } catch (error) {
            console.error("handleWithdraw 함수 실행 중 오류 발생:", error);
            alert("회원 탈퇴 처리 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
        }
    };
    
    const handleDeletePet = () => {
        if (window.confirm(`${petInfo.name}의 정보를 삭제하시겠습니까?`)) {
            alert(`${petInfo.name} 정보가 삭제되었습니다.`);
            setPetInfo(null); // 더미 데이터 삭제
            closeModal();
        }
    };


    return (
        <div className="app mypage-container">
            {/* 헤더 */}
            <header className="nav">
                <div className="nav-inner">
                    <div className="brand">
                        <a href="./dashboard">
                            <img src={logoBlue} alt="paw logo" className="paw" />
                            <span className="brand-text">멍냥멍냥</span>
                        </a>
                    </div>

                    <nav className="menu">
                        <NavLink to="/activity">활동</NavLink>
                        <NavLink to="/health">건강</NavLink>
                        <NavLink to="/calendar">캘린더</NavLink>
                        <NavLink to="/community">커뮤니티</NavLink>
                    </nav>

                    <nav className="menuicon">
                        <div className="profile">
                            <span className="profile__name">{username}</span> 
                            <div className="profile__avatar">
                                <img src={userProfileImageUrl} alt="프로필" />
                            </div>
                        </div>

                        <div className="icon-wrapper">
                            <button className="icon-btn" onClick={() => { setShowBellPopup((v) => !v); setShowChatPopup(false); }}>
                                <img src={bell} alt="알림 아이콘" className="icon" />
                            </button>
                            {showBellPopup && (<div className="popup"><p>📢 새 알림이 없습니다.</p></div>)}
                        </div>

                        <div className="icon-wrapper">
                            <button className="icon-btn" onClick={() => { setShowChatPopup((v) => !v); setShowChatPopup(false); }}>
                                <Link to="/chat"><img src={chat} alt="채팅 아이콘" className="icon" /></Link>
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            <main className="main mypage-main">
                <section className="mypage-header-section">
                    <div className="mypage-title-bar">
                        <h1 className="title">마이페이지</h1>
                    </div>
                    <p className="description">내 정보와 반려동물 기록을 관리해요.</p>
                </section>

                <div className="mypage-content-area">
                    {/* 사용자 정보 섹션 */}
                    <section className="mypage-section user-info-section">
                        <div className="user-profile-card">
                            <div className="user-avatar">
                                <img src={userProfileImageUrl} alt="사용자 프로필" />
                            </div>
                            <div className="user-details">
                                <p className="user-nickname">{username}</p> 
                                <p className="user-id">{userId}</p> 
                                <p className="user-email">{userEmail}</p>
                            </div>
                            <button className="btn btn-settings" onClick={() => openModal('settings')}>계정 설정</button>
                        </div>
                    </section>

                    {/* 나의 반려동물 섹션 */}
                    <section className="mypage-section pet-management-section">
                        <h2 className="section__title section__title--no-bullet">나의 반려동물</h2>
                        <div className="pet-list-container">
                            {/* ⭐️ 펫 목록 (좌측) */}
                            <div className="pet-list">
                                {/* ⭐️ 활성화된 펫: 배경 투명, 글자색 진함 */}
                                <div className="pet-item pet-item--active">
                                    <div className="pet-color-indicator pet-color-indicator--pink"></div>
                                    <span className="pet-name">냥냥이</span>
                                </div>
                                {/* ⭐️ 비활성화된 펫: 배경 투명, 글자색 연함 */}
                                <div className="pet-item">
                                    <div className="pet-color-indicator pet-color-indicator--yellow"></div>
                                    <span className="pet-name pet-name--inactive">멍멍이</span>
                                </div>
                                <Link to="/NewFamily" className="pet-add-button">
                                    <span className="icon-plus-small">+</span> 
                                    <span className="pet-add-text">추가하기</span>
                        </Link>
                            </div>

                            {/* ⭐️ 펫 상세 정보 및 대시보드 요약 (우측) - 인라인화된 내용 */}
                            <div className="pet-detail-card-wrapper">
                                <div className="pet-name-and-edit">
                                    <span className="pet-detail-name">냥냥이 (고양이)</span>
                                    <button className="btn btn-edit-pet" onClick={() => openModal('edit')}>정보 수정</button>
                                </div>
                                
                                <p className="pet-description-line">
                                    코리안숏헤어, 2살, 중성화 완료, 4.2kg
                                </p>

                                <div className="pet-dashboard-summary">
                                    {/* 다가오는 일정 */}
                                    <div className="upcoming-events-mypage">
                                        <div className="section-header-inline">
                                            <h3>다가오는 일정</h3>
                                            <Link to="/activity" className="view-more">자세히 보기</Link>
                                        </div>
                                        {/* ⭐️ 정기 검진일 아이템 (디자인 일치) */}
                                         {/* <div className="event-item-mypage event-item-mypage--detail">
                                            <div className="event-icon-box">
                                                <span className="event-icon-emoji">🏥</span>
                                            </div>
                                            <div className="event-item-text">
                                                <span className="event-title">정기 검진일</span>
                                                <span className="event-date">10월 15일</span>
                                            </div>
                                        </div> */}
                                        <span className="event-empty">최근 일주일간 일정이 없습니다.</span>
                                    </div>

                                    {/* 주간 활동 분석 */}
                                    <div className="weekly-activity-mypage">
                                        <div className="section-header-inline">
                                            <h3>주간 활동 분석</h3>
                                            <Link to="/activity" className="view-more">자세히 보기</Link>
                                        </div>
                                        {/* <div className="activity-chart-box">
                                            <div className="chart-y-axis-labels">
                                                <span>3.50</span><span>3.45</span><span>3.40</span><span>3.35</span><span>3.30</span><span>3.25</span><span>3.20</span>
                                            </div>
                                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="chart-svg">
                                                <path d="M 10 90 L 30 70 L 50 60 L 70 80 L 90 50" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                                            </svg>
                                            <div className="chart-x-labels-only">
                                                <span>9월</span><span>10월</span><span>11월</span><span>12월</span><span>1일</span><span>2일</span><span>3일</span><span>4일</span><span>5일</span>
                                            </div> 
                                        </div> */}
                                        <span className="event-empty">최근 일주일간 활동이 없습니다.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* ⭐️ 5가지 뷰를 포함하는 메인 모달 */}
            {modalOpen && (
                <MyPageModal 
                    currentModal={currentModal}
                    closeModal={closeModal}
                    petFormData={petFormData}
                    setPetFormData={setPetFormData}
                    handlePetFormChange={handlePetFormChange}
                    handlePetInfoSave={handlePetInfoSave}
                    handleWithdraw={handleWithdraw}
                    handleDeletePet={handleDeletePet}
                    petInfo={petInfo}
                    setCurrentModal={setCurrentModal} 
                    // 계정 설정 폼 상태 및 핸들러 전달
                    accountFormData={accountFormData}
                    handleAccountFormChange={handleAccountFormChange}
                    handleAccountSettingsSave={handleAccountSettingsSave}
                />
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
                            <div className="col"><h3>Hyeona Kim</h3><p>UI/UX Design</p><a href="https://github.com/ouskxk" className="github-link"><img src={githubpic} alt="GitHub Logo" className="github-icon"/>ouskxk</a></div>
                            <div className="col"><h3>Jiun Ko</h3><p>Front-End Dev</p><a href="https://github.com/suerte223" className="github-link"><img src={githubpic} alt="GitHub Logo" className="github-icon"/>suerte223</a></div>
                            <div className="col"><h3>Seungbeom Han</h3><p>Front-End Dev</p><a href="https://github.com/hsb9838" className="github-link"><img src={githubpic} alt="GitHub Logo" className="github-icon"/>hsb9838</a></div>
                            <div className="col"><h3>Munjun Yang</h3><p>Back-End Dev</p><a href="https://github.com/munjun0608" className="github-link"><img src={githubpic} alt="GitHub Logo" className="github-icon"/>munjun0608</a></div>
                            <div className="col"><h3>Youngbin Kang</h3><p>Back-End Dev</p><a href="https://github.com/0bini" className="github-link"><img src={githubpic} alt="GitHub Logo" className="github-icon"/>0bini</a></div>
                        </div>
                        <div className="tech-stack"><h3>TECH STACK</h3><img src={reactpic} alt="React Logo" className="react-icon"/><img src={djangopic} alt="Django Logo" className="django-icon"/></div>
                    </div>
                </div>
            </footer>
        </div>
    );
}