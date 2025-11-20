import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { Link, NavLink, useNavigate } from "react-router-dom";

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
// 🌟 공통 상수 및 헬퍼 함수 정의
// =========================================================

const CATEGORY_OPTIONS = [
    { value: "병원/약", label: "병원/약", color: "#ebc3bcff", icon: "🏥" },
    { value: "미용", label: "미용", color: "#d6ebfaff", icon: "✂️" },
    { value: "행사", label: "행사", color: "#fff9ecff", icon: "🎂" },
    { value: "기타", label: "기타", color: "#E9ECEF", icon: "⚫" },
];

const getCategoryDetails = (categoryValue) => {
    // 값에 해당하는 옵션을 찾고, 없으면 '기타'를 기본값으로 사용
    return CATEGORY_OPTIONS.find(opt => opt.value === categoryValue) || CATEGORY_OPTIONS.find(opt => opt.value === "기타") || CATEGORY_OPTIONS[3];
};

const getDDay = (dateStr) => {
    if (!dateStr || dateStr.includes('D-')) return 9999; 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduleDate = new Date(dateStr);
    scheduleDate.setHours(0, 0, 0, 0);
    const diffTime = scheduleDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
};

const getDDayLabel = (d) => {
    if (d === 0) return "오늘";
    if (d === 1) return "D-1";
    if (d > 1) return `D-${d}`;
    return "지남";
};

const getDDayClass = (d) => {
    // 뱃지 색상을 결정하는 클래스
    if (d <= 0) return "event-badge--danger"; // 오늘 또는 지남
    if (d <= 3) return "event-badge--soft"; // 3일 이내
    return "event-badge--default";
};

// 알림 관련 헬퍼 함수들 (기존 코드 유지)
const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    if (Number.isNaN(past.getTime())) return dateString;
    
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
        return `${diffInSeconds}초 전`;
    } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}분 전`;
    } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    } else if (diffInSeconds < 2592000) {
        return `${Math.floor(diffInSeconds / 86400)}일 전`;
    }
    return past.toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const cleanAlertText = (message) => {
    if (!message) return "새 알림";
    const match = message.match(/^'[^']+'님으로부터 (.*)/);
    if (match && match.length > 1) {
        return match[1].trim();
    }
    const matchNoQuote = message.match(/^([^']+)님으로부터 (.*)/);
    if (matchNoQuote && matchNoQuote.length > 2) {
        return matchNoQuote[2].trim();
    }
    return message;
};

const extractNickname = (message) => {
    let match = message.match(/'([^']+)'님으로부터/);
    if (match) return match[1];
    match = message.match(/^([^']+)님으로부터/);
    if (match) return match[1];
    return null;
};

// Interval Custom Hook
function useInterval(callback, delay) {
    const savedCallback = React.useRef();
    
    React.useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);
    
    React.useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}

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
                                    <input type="date" id="petBirth" name="birthdate" value={petFormData.birth_date || ""} onChange={handlePetFormChange} />
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
                                <input 
                                    type="text"
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
// 🌟 메인 컴포넌트
// =========================================================

export default function MyPage() {
    const navigate = useNavigate();
    
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
        // 🚨 테스트 데이터: 필터링 전 데이터를 가정하여 포함
        upcoming: [
            { id: 101, content: "정기 검진일", date: "2025-11-20", category: "병원/약" }, 
            { id: 102, content: "미용 예약", date: "2025-11-21", category: "미용" }
        ],
        activityGraph: [{ value: 1 }, { value: 3 }, { value: 2 }, { value: 4 }, { value: 3 }, { value: 5 }] 
    });
    
    // 반려동물 목록 상태
    const [petsList, setPetsList] = useState([]);
    const [selectedPetId, setSelectedPetId] = useState(null);
    const [upcomingSchedules, setUpcomingSchedules] = useState([]);
    const [weeklyActivity, setWeeklyActivity] = useState([]);
    
    const [showBellPopup, setShowBellPopup] = useState(false);
    const [showChatPopup, setShowChatPopup] = useState(false);
    
    // 알림 관련 상태
    const [notifications, setNotifications] = useState([]);
    const [loadingNoti, setLoadingNoti] = useState(false);
    const [hasNewNotification, setHasNewNotification] = useState(false);
    const lastKnownNotiIds = useRef(new Set());
    const notiBtnRef = useRef(null);
    const notiRef = useRef(null);

    // 나이 계산 함수
    const calculateAge = (birthDate) => {
        if (!birthDate) return 0;
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // 일정 날짜 포맷팅 함수 (YYYY-MM-DD -> YYYY-MM-DD 형식으로 변환)
    const formatScheduleDate = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            // ISO-8601 형식으로 변환 후 시간 부분 제거
            return date.toISOString().slice(0, 10);
        } catch (e) {
            return dateString;
        }
    };

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

    // 반려동물 목록 가져오기
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const fetchPets = async () => {
            try {
                const res = await axios.get(
                    "https://youngbin.pythonanywhere.com/api/v1/pets/",
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (res.data && res.data.length > 0) {
                    setPetsList(res.data);
                    // 첫 번째 반려동물을 기본 선택
                    const firstPet = res.data[0];
                    setSelectedPetId(firstPet.id);
                    // localStorage에 pet_id 저장 (다른 페이지에서 사용)
                    localStorage.setItem("pet_id", String(firstPet.id));
                    // 선택된 반려동물 정보 설정
                    setPetInfo(prev => ({
                        ...prev, // 기존 upcoming, activityGraph 데이터는 유지
                        id: firstPet.id,
                        name: firstPet.name,
                        species: firstPet.species === "고양이" ? "cat" : "dog",
                        breed: firstPet.breed,
                        age: calculateAge(firstPet.birth_date),
                        neutered: firstPet.is_neutered,
                        weight: firstPet.weight,
                    }));
                    // 폼 데이터도 업데이트
                    setPetFormData(prev => ({
                        ...prev,
                        name: firstPet.name,
                        species: firstPet.species,
                        breed: firstPet.breed,
                        birth_date: firstPet.birth_date,
                        gender: firstPet.gender,
                        neutered: firstPet.is_neutered,
                        weight: firstPet.weight.toString(),
                        memo: firstPet.special_notes || "",
                        target_activity_minutes: firstPet.target_activity_minutes?.toString() || "45",
                        imageUrl: firstPet.profile_photo || null
                    }));
                }
            } catch (err) {
                console.error("반려동물 목록 불러오기 실패:", err.response?.data || err.message);
            }
        };

        fetchPets();
    }, []);

    // 선택된 반려동물의 다가오는 일정 가져오기
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token || !selectedPetId) return;

        const fetchDashboard = async () => {
            try {
                const res = await axios.get(
                    `https://youngbin.pythonanywhere.com/api/v1/pets/dashboard/${selectedPetId}/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (res.data?.upcoming_schedules) {
                    const incomingSchedules = res.data.upcoming_schedules;
                    
                    // 1. D-day 계산 필드 추가
                    const processedSchedules = incomingSchedules.map(schedule => ({
                        id: schedule.id,
                        content: schedule.content,
                        date: schedule.schedule_date, // YYYY-MM-DD
                        category: schedule.category,
                        d_day: getDDay(schedule.schedule_date), // D-day 계산
                    }));
                    
                    // 2. 오늘 (0) 또는 미래 일정 (> 0)만 필터링
                    const futureSchedules = processedSchedules.filter(s => s.d_day >= 0);
                    
                    // 3. D-day 순으로 정렬 (가까운 순)
                    futureSchedules.sort((a, b) => a.d_day - b.d_day);
                    
                    // 4. 최대 7개의 항목만 표시하도록 슬라이싱 (일주일 분량)
                    const limitedSchedules = futureSchedules.slice(0, 7);

                    setUpcomingSchedules(incomingSchedules); 

                    // petInfo의 upcoming 업데이트
                    setPetInfo(prev => ({
                        ...prev,
                        upcoming: limitedSchedules // 필터링되고 제한된 데이터 사용
                    }));
                }
            } catch (err) {
                console.error("다가오는 일정 불러오기 실패:", err.response?.data || err.message);
            }
        };

        fetchDashboard();
    }, [selectedPetId]);

    // 선택된 반려동물의 주간 활동 분석 가져오기
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token || !selectedPetId) return;

        const fetchActivities = async () => {
            try {
                const res = await axios.get(
                    `https://youngbin.pythonanywhere.com/api/v1/pets/activities/${selectedPetId}/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (res.data?.weekly_analysis) {
                    const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
                    const dayOrderEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const dayOrderNum = [0, 1, 2, 3, 4, 5, 6]; 
                    
                    const sortedActivity = [...res.data.weekly_analysis].sort((a, b) => {
                        const getDayIndex = (item) => {
                            if (item.day) {
                                const dayStr = String(item.day).toLowerCase();
                                const koIndex = dayOrder.findIndex(d => dayStr.includes(d));
                                if (koIndex !== -1) return koIndex;
                                const enIndex = dayOrderEn.findIndex(d => dayStr.includes(d.toLowerCase()));
                                if (enIndex !== -1) return enIndex;
                            }
                            if (item.day_of_week !== undefined) {
                                return item.day_of_week;
                            }
                            return 0;
                        };
                        return getDayIndex(a) - getDayIndex(b);
                    });
                    
                    let finalActivity = sortedActivity;
                    if (sortedActivity.length === 7) {
                        const hasDayOfWeek = sortedActivity.some(item => item.day_of_week !== undefined);
                        if (hasDayOfWeek) {
                            finalActivity = dayOrderNum.map(dayNum => 
                                sortedActivity.find(item => item.day_of_week === dayNum) || 
                                sortedActivity.find(item => item.day === dayOrder[dayNum]) ||
                                sortedActivity.find(item => item.day === dayOrderEn[dayNum]) ||
                                { duration: 0, day: dayOrder[dayNum] }
                            );
                        } else {
                            finalActivity = dayOrder.map(day => 
                                sortedActivity.find(item => String(item.day).includes(day)) ||
                                sortedActivity.find(item => String(item.day).includes(dayOrderEn[dayOrder.indexOf(day)])) ||
                                { duration: 0, day: day }
                            );
                        }
                    }
                    
                    setWeeklyActivity(finalActivity);
                    // petInfo의 activityGraph 업데이트
                    setPetInfo(prev => ({
                        ...prev,
                        activityGraph: finalActivity.map(item => ({ value: item.duration }))
                    }));
                }
            } catch (err) {
                console.error("주간 활동 분석 불러오기 실패:", err.response?.data || err.message);
            }
        };

        fetchActivities();
    }, [selectedPetId]);
    
    // 알림 읽음 처리 함수들 (기존 로직 유지)
    const markNotificationAsReadOnServer = async (id) => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            await axios.post(
                `https://youngbin.pythonanywhere.com/api/v1/notifications/${id}/read/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error(`알림 ${id} 서버 읽음 처리 실패:`, err);
        }
    };

    const markAllNotificationsReadOnServer = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            await axios.post(
                "https://youngbin.pythonanywhere.com/api/v1/notifications/read-all/",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error("모든 알림 서버 읽음 처리 실패:", err);
        }
    };

    const markRead = (id) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        markNotificationAsReadOnServer(id);
    };

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setHasNewNotification(false);
        markAllNotificationsReadOnServer();
    };

    const hasUnreadInList = useMemo(
        () => notifications.some((n) => !n.is_read),
        [notifications]
    );

    // 알림 패널 외부 클릭/ESC로 닫기
    useEffect(() => {
        if (!showBellPopup) return;
        const onClick = (e) => {
            if (
                notiRef.current &&
                !notiRef.current.contains(e.target) &&
                notiBtnRef.current &&
                !notiBtnRef.current.contains(e.target)
            ) {
                setShowBellPopup(false);
                setHasNewNotification(false);
            }
        };
        const onEsc = (e) => e.key === "Escape" && setShowBellPopup(false);
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onEsc);
        };
    }, [showBellPopup]);

    // 알림 API 호출 함수
    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(
                "https://youngbin.pythonanywhere.com/api/v1/notifications/",
                { headers }
            );

            const rawNotifications = Array.isArray(res.data)
                ? res.data
                : res.data.results || [];

            const mappedNotifications = rawNotifications.map((n) => {
                const senderName =
                    n.sender_nickname && n.sender_nickname.trim()
                        ? n.sender_nickname.trim()
                        : n.sender_id
                        ? `사용자 ${n.sender_id}`
                        : extractNickname(n.message || "") || "알 수 없는 사용자";

                const cleanedText = cleanAlertText(n.message);

                return {
                    id: n.id,
                    user: senderName,
                    text: cleanedText,
                    time: getTimeAgo(n.created_at),
                    rawTime: n.created_at,
                    is_read: n.is_read,
                    avatarColor: n.is_read ? "#e5e7eb" : "#dbeafe",
                };
            });

            setNotifications(mappedNotifications);

            // 새 알림 감지
            const currentIds = new Set(mappedNotifications.map((n) => n.id));
            const prevIds = lastKnownNotiIds.current;
            const hasNew = mappedNotifications.some((n) => !n.is_read) ||
                (prevIds.size > 0 && Array.from(currentIds).some((id) => !prevIds.has(id)));

            setHasNewNotification(hasNew);
            lastKnownNotiIds.current = currentIds;
        } catch (err) {
            console.error("알림 불러오기 실패:", err);
        } finally {
            setLoadingNoti(false);
        }
    }, []);

    // 초기 알림 로드 및 주기적 폴링
    useEffect(() => {
        setLoadingNoti(true);
        fetchNotifications();
    }, [fetchNotifications]);

    useInterval(() => {
        fetchNotifications();
    }, 10000);
    
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
        } else if (e.target.name === "birthdate") {
            // birthdate 필드 처리
            setPetFormData({ ...petFormData, birth_date: e.target.value });
        } else {
            setPetFormData({ ...petFormData, [e.target.name]: e.target.value });
        }
    };

    // 폼 변경 핸들러 (계정 설정)
    const handleAccountFormChange = (e) => {
        setAccountFormData({ ...accountFormData, [e.target.name]: e.target.value });
    };

    // 저장 핸들러 (반려동물)
    const handlePetInfoSave = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            alert("로그인이 필요합니다.");
            return;
        }

        try {
            const formData = new FormData();
            
            // 필수 필드 추가
            if (petFormData.name) formData.append("name", petFormData.name);
            if (petFormData.species) formData.append("species", petFormData.species);
            if (petFormData.breed) formData.append("breed", petFormData.breed);
            if (petFormData.birth_date) formData.append("birth_date", petFormData.birth_date);
            if (petFormData.gender) formData.append("gender", petFormData.gender);
            if (petFormData.neutered !== null) formData.append("is_neutered", petFormData.neutered);
            if (petFormData.weight) formData.append("weight", parseFloat(petFormData.weight));
            if (petFormData.target_activity_minutes) formData.append("target_activity_minutes", parseInt(petFormData.target_activity_minutes));
            if (petFormData.memo) formData.append("special_notes", petFormData.memo);
            
            // 이미지 파일 추가
            if (petFormData.imageFile) {
                formData.append("profile_photo", petFormData.imageFile);
            }

            if (petInfo && petInfo.id) {
                // 기존 반려동물 수정 (PATCH)
                const res = await axios.patch(
                    `https://youngbin.pythonanywhere.com/api/v1/pets/${petInfo.id}/`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "multipart/form-data"
                        }
                    }
                );
                
                alert("반려동물 정보가 수정되었습니다.");
                // 목록 새로고침
                const petsRes = await axios.get(
                    "https://youngbin.pythonanywhere.com/api/v1/pets/",
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (petsRes.data) {
                    setPetsList(petsRes.data);
                    const updatedPet = petsRes.data.find(p => p.id === petInfo.id);
                    if (updatedPet) {
                        const profilePhotoUrl = updatedPet.profile_photo 
                            ? (updatedPet.profile_photo.startsWith('http') 
                                ? updatedPet.profile_photo 
                                : `https://youngbin.pythonanywhere.com${updatedPet.profile_photo}`)
                            : null;
                        
                        setPetInfo(prev => ({
                            ...prev,
                            id: updatedPet.id,
                            name: updatedPet.name,
                            species: updatedPet.species === "고양이" ? "cat" : "dog",
                            breed: updatedPet.breed,
                            age: calculateAge(updatedPet.birth_date),
                            neutered: updatedPet.is_neutered,
                            weight: updatedPet.weight,
                        }));
                        
                        // localStorage에 pet_id 저장 (업데이트된 반려동물)
                        localStorage.setItem("pet_id", String(updatedPet.id));
                        
                        // 프로필 이미지도 업데이트
                        if (profilePhotoUrl) {
                            setUserProfileImageUrl(profilePhotoUrl);
                            localStorage.setItem("user_profile_image_url", profilePhotoUrl);
                        }
                        
                        // 폼 데이터도 업데이트
                        setPetFormData(prev => ({
                            ...prev,
                            imageUrl: profilePhotoUrl,
                            imageFile: null
                        }));
                    }
                }
            } else {
                // 새 반려동물 추가 (POST)
                const res = await axios.post(
                    "https://youngbin.pythonanywhere.com/api/v1/pets/",
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "multipart/form-data"
                        }
                    }
                );
                
                alert("반려동물이 추가되었습니다.");
                // 목록 새로고침
                const petsRes = await axios.get(
                    "https://youngbin.pythonanywhere.com/api/v1/pets/",
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (petsRes.data) {
                    setPetsList(petsRes.data);
                    setSelectedPetId(res.data.id);
                    // localStorage에 새로 추가된 반려동물의 id 저장
                    localStorage.setItem("pet_id", String(res.data.id));
                }
            }
            
            closeModal();
        } catch (err) {
            console.error("반려동물 정보 저장 실패:", err.response?.data || err.message);
            alert(`반려동물 정보 저장 실패: ${err.response?.data?.message || err.message}`);
        }
    };

    // 저장 핸들러 (계정 설정)
    const handleAccountSettingsSave = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            alert("로그인이 필요합니다.");
            return;
        }

        try {
            const updateData = {};
            
            // 닉네임이 변경되었으면 추가 (빈 문자열 체크)
            if (accountFormData.nickname && accountFormData.nickname.trim() !== "" && accountFormData.nickname !== username) {
                updateData.nickname = accountFormData.nickname.trim();
            }
            
            // 새 비밀번호가 입력되었으면 추가
            if (accountFormData.newPassword && accountFormData.newPassword.trim() !== "") {
                if (accountFormData.newPassword !== accountFormData.confirmNewPassword) {
                    alert("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
                    return;
                }
                if (accountFormData.newPassword.length < 8) {
                    alert("비밀번호는 최소 8자 이상이어야 합니다.");
                    return;
                }
                updateData.new_password = accountFormData.newPassword;
            }

            // 변경할 데이터가 없으면 리턴
            if (Object.keys(updateData).length === 0) {
                alert("변경할 정보가 없습니다.");
                return;
            }

            console.log("계정 정보 수정 요청 데이터:", updateData);

            const res = await axios.patch(
                "https://youngbin.pythonanywhere.com/api/v1/users/profile/",
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            alert("계정 정보가 수정되었습니다.");
            setUsername(res.data?.nickname || accountFormData.nickname);
            setAccountFormData(prev => ({
                ...prev,
                newPassword: '',
                confirmNewPassword: '',
                currentPassword: ''
            }));
            closeModal();
        } catch (err) {
            console.error("계정 정보 수정 실패:", err.response?.data || err.message);
            console.error("에러 상세:", err.response);
            
            // 에러 메시지 파싱
            let errorMessage = "계정 정보 수정에 실패했습니다.";
            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response.data.error) {
                    errorMessage = err.response.data.error;
                } else if (err.response.data.nickname) {
                    errorMessage = `닉네임 오류: ${Array.isArray(err.response.data.nickname) ? err.response.data.nickname[0] : err.response.data.nickname}`;
                } else if (err.response.data.new_password) {
                    errorMessage = `비밀번호 오류: ${Array.isArray(err.response.data.new_password) ? err.response.data.new_password[0] : err.response.data.new_password}`;
                } else {
                    errorMessage = JSON.stringify(err.response.data);
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            alert(`계정 정보 수정 실패: ${errorMessage}`);
        }
    };

    // 탈퇴 핸들러
    const handleWithdraw = async () => {
        if (!window.confirm("회원 탈퇴를 계속 진행하시겠습니까?\n탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.")) {
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("로그인이 필요합니다.");
            return;
        }

        try {
            // 탈퇴 API 호출 (DELETE 메서드 사용)
            console.log("탈퇴 API 호출 시작...");
            const response = await axios.delete(
                "https://youngbin.pythonanywhere.com/api/v1/users/profile/",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            console.log("탈퇴 API 응답:", response.data);
            console.log("탈퇴 API 상태 코드:", response.status);

            // 탈퇴 성공 시 처리
            // localStorage 정리
            localStorage.removeItem("token");
            localStorage.removeItem("pet_id");
            localStorage.removeItem("user_profile_image_url");
            
            // 모달 닫기
            if (typeof closeModal === 'function') {
                closeModal();
            }
            
            alert("회원 탈퇴가 완료되었습니다.");
            
            // 홈 페이지로 리다이렉트
            navigate("/");
            
        } catch (err) {
            console.error("회원 탈퇴 실패:", err.response?.data || err.message);
            
            // 404, 405, 501 등 서버에서 탈퇴 API를 지원하지 않는 경우
            // 클라이언트 측에서만 로그아웃 처리
            if (err.response?.status === 404 || err.response?.status === 405 || err.response?.status === 501) {
                // API 엔드포인트가 없거나 지원하지 않는 경우에도 로컬 정리
                localStorage.removeItem("token");
                localStorage.removeItem("pet_id");
                localStorage.removeItem("user_profile_image_url");
                
                // 모달 닫기
                if (typeof closeModal === 'function') {
                    closeModal();
                }
                
                alert("회원 탈퇴가 완료되었습니다.\n(서버에서 탈퇴 API를 지원하지 않아 로컬 정보만 삭제되었습니다.)");
                navigate("/");
            } else {
                let errorMessage = "회원 탈퇴에 실패했습니다.";
                if (err.response?.data) {
                    if (typeof err.response.data === 'string') {
                        errorMessage = err.response.data;
                    } else if (err.response.data.detail) {
                        errorMessage = err.response.data.detail;
                    } else if (err.response.data.message) {
                        errorMessage = err.response.data.message;
                    } else if (err.response.data.error) {
                        errorMessage = err.response.data.error;
                    } else {
                        errorMessage = JSON.stringify(err.response.data);
                    }
                } else if (err.message) {
                    errorMessage = err.message;
                }
                alert(`회원 탈퇴 실패: ${errorMessage}`);
            }
        }
    };
    
    const handleDeletePet = async () => {
        if (!window.confirm(`${petInfo.name}의 정보를 삭제하시겠습니까?`)) {
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("로그인이 필요합니다.");
            return;
        }

        try {
            await axios.delete(
                `https://youngbin.pythonanywhere.com/api/v1/pets/${petInfo.id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(`${petInfo.name} 정보가 삭제되었습니다.`);
            
            // 목록에서 제거
            const updatedList = petsList.filter(p => p.id !== petInfo.id);
            setPetsList(updatedList);
            
            // 다른 반려동물이 있으면 첫 번째로 선택
            if (updatedList.length > 0) {
                const firstPet = updatedList[0];
                setSelectedPetId(firstPet.id);
                // localStorage에 pet_id 저장
                localStorage.setItem("pet_id", String(firstPet.id));
                setPetInfo({
                    id: firstPet.id,
                    name: firstPet.name,
                    species: firstPet.species === "고양이" ? "cat" : "dog",
                    breed: firstPet.breed,
                    age: calculateAge(firstPet.birth_date),
                    neutered: firstPet.is_neutered,
                    weight: firstPet.weight,
                    upcoming: [],
                    activityGraph: []
                });
            } else {
                setPetInfo(null);
                setSelectedPetId(null);
                // 반려동물이 없으면 localStorage에서 pet_id 제거
                localStorage.removeItem("pet_id");
            }
            
            closeModal();
        } catch (err) {
            console.error("반려동물 삭제 실패:", err.response?.data || err.message);
            alert(`반려동물 삭제 실패: ${err.response?.data?.message || err.message}`);
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
                        <Link to="/mypage" className="profile">
                            <span className="profile__name">{username}</span> 
                            <div className="profile__avatar">
                                <img src={userProfileImageUrl} alt="프로필" />
                            </div>
                        </Link>

                        <div className="icon-wrapper bell">
                            <button
                                ref={notiBtnRef}
                                className="icon-btn bell__btn"
                                onClick={() => {
                                    setShowBellPopup((v) => !v);
                                    setShowChatPopup(false);
                                }}
                                type="button"
                            >
                                <img src={bell} alt="알림 아이콘" className="icon" />
                                {hasNewNotification && <span className="bell__dot" />}
                            </button>
                            {showBellPopup && (
                                <div ref={notiRef} className="noti">
                                    <div className="noti__header">
                                        <strong>알림</strong>
                                        <button
                                            className="noti__allread"
                                            onClick={markAllRead}
                                            disabled={!hasUnreadInList}
                                        >
                                            모두 읽음
                                        </button>
                                    </div>
                                    <ul className="noti__list">
                                        {loadingNoti && (
                                            <li className="noti__empty">알림 불러오는 중...</li>
                                        )}
                                        {!loadingNoti && notifications.length === 0 && (
                                            <li className="noti__empty">알림이 없습니다.</li>
                                        )}
                                        {!loadingNoti &&
                                            notifications.map((n) => (
                                                <li
                                                    key={n.id}
                                                    className={`noti__item ${
                                                        !n.is_read ? "is-unread" : "is-read"
                                                    }`}
                                                    onClick={() => markRead(n.id)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) =>
                                                        e.key === "Enter" && markRead(n.id)
                                                    }
                                                    title="클릭하면 읽음 처리"
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
                                                            {!n.is_read && (
                                                                <span className="noti__badge">안 읽음</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )}
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
                                {petsList.map((pet, index) => {
                                    const isActive = selectedPetId === pet.id;
                                    const colorIndicators = ["pink", "yellow", "blue", "green", "purple"];
                                    const colorClass = `pet-color-indicator--${colorIndicators[index % colorIndicators.length]}`;
                                    
                                    // 현재 선택된 반려동물이고 이미지가 선택된 경우 미리보기 이미지 사용
                                    const displayImage = isActive && petFormData.imageUrl 
                                        ? petFormData.imageUrl 
                                        : (pet.profile_photo 
                                            ? (pet.profile_photo.startsWith('http') 
                                                ? pet.profile_photo 
                                                : `https://youngbin.pythonanywhere.com${pet.profile_photo}`)
                                            : null);
                                    
                                    return (
                                        <div 
                                            key={pet.id}
                                            className={`pet-item ${isActive ? "pet-item--active" : ""}`}
                                            onClick={() => {
                                                setSelectedPetId(pet.id);
                                                // localStorage에 pet_id 저장 (다른 페이지에서 사용)
                                                localStorage.setItem("pet_id", String(pet.id));
                                                setPetInfo(prev => ({
                                                    ...prev,
                                                    id: pet.id,
                                                    name: pet.name,
                                                    species: pet.species === "고양이" ? "cat" : "dog",
                                                    breed: pet.breed,
                                                    age: calculateAge(pet.birth_date),
                                                    neutered: pet.is_neutered,
                                                    weight: pet.weight,
                                                    upcoming: [],
                                                    activityGraph: []
                                                }));
                                                setPetFormData(prev => ({
                                                    ...prev,
                                                    name: pet.name,
                                                    species: pet.species,
                                                    breed: pet.breed,
                                                    birth_date: pet.birth_date,
                                                    gender: pet.gender,
                                                    neutered: pet.is_neutered,
                                                    weight: pet.weight.toString(),
                                                    memo: pet.special_notes || "",
                                                    target_activity_minutes: pet.target_activity_minutes?.toString() || "45",
                                                    imageUrl: pet.profile_photo 
                                                        ? (pet.profile_photo.startsWith('http') 
                                                            ? pet.profile_photo 
                                                            : `https://youngbin.pythonanywhere.com${pet.profile_photo}`)
                                                        : null
                                                }));
                                            }}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {displayImage ? (
                                                <img 
                                                    src={displayImage} 
                                                    alt={pet.name}
                                                    className="pet-list-thumbnail"
                                                />
                                            ) : (
                                                <div className={`pet-color-indicator ${colorClass}`}></div>
                                            )}
                                            <span className={isActive ? "pet-name" : "pet-name pet-name--inactive"}>
                                                {pet.name}
                                            </span>
                                        </div>
                                    );
                                })}
                                <Link to="/NewFamily" className="pet-add-button">
                                    <span className="icon-plus-small">+</span> 
                                    <span className="pet-add-text">추가하기</span>
                                </Link>
                            </div>

                            {/* ⭐️ 펫 상세 정보 및 대시보드 요약 (우측) - 인라인화된 내용 */}
                            {petInfo ? (
                                <div className="pet-detail-card-wrapper">
                                    <div className="pet-name-and-edit">
                                        <span className="pet-detail-name">
                                            {petInfo.name} ({petInfo.species === "cat" ? "고양이" : "강아지"})
                                        </span>
                                        <button className="btn btn-edit-pet" onClick={() => openModal('edit')}>정보 수정</button>
                                    </div>
                                    
                                    <p className="pet-description-line">
                                        {petInfo.breed}, {petInfo.age}살, {petInfo.neutered ? "중성화 완료" : "중성화 안함"}, {petInfo.weight}kg
                                    </p>

                                    <div className="pet-dashboard-summary">
                                        {/* 다가오는 일정 */}
                                        <div className="upcoming-events-mypage">
                                            <div className="section-header-inline">
                                                <h3>다가오는 일정</h3>
                                                <Link to="/calendar" className="view-more">자세히 보기</Link>
                                            </div>
                                            {petInfo.upcoming && petInfo.upcoming.length > 0 ? (
                                                petInfo.upcoming.map((event) => {
                                                    // 🌟 1. D-day 및 카테고리 정보 계산
                                                    const dDayValue = getDDay(event.date); // event.date는 YYYY-MM-DD 형태
                                                    const badgeClass = getDDayClass(dDayValue);
                                                    const badgeLabel = getDDayLabel(dDayValue);
                                                    const { icon, color } = getCategoryDetails(event.category || "기타"); 

                                                    return (
                                                        <div key={event.id} className="event-item-mypage event-item-mypage--detail">
                                                            {/* 🌟 좌측 컨테이너: 아이콘 + 텍스트를 묶습니다. */}
                                                            <div className="event-item-left"> 
                                                                
                                                                {/* 🌟 2. 동적 아이콘 및 배경색 적용 */}
                                                                <div className="event-icon-box" style={{ backgroundColor: color }}>
                                                                    <span className="event-icon-emoji">{icon}</span>
                                                                </div>
                                                                
                                                                <div className="event-item-text">
                                                                    {/* 제목 */}
                                                                    <span className="event-title">{event.content}</span>
                                                                    {/* 날짜 (YYYY-MM-DD 포맷) */}
                                                                    <span className="event-date">{formatScheduleDate(event.date)}</span> 
                                                                </div>
                                                            </div>
                                                            
                                                            {/* 🌟 3. D-day 뱃지 추가 (오른쪽 끝에 배치됨) */}
                                                            <div className={`event-badge-mypage ${badgeClass}`}>
                                                                {badgeLabel}
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <span className="event-empty">최근 일주일간 일정이 없습니다.</span>
                                            )}
                                        </div>

                                        {/* 주간 활동 분석 */}
                                        <div className="weekly-activity-mypage">
                                            <div className="section-header-inline">
                                                <h3>주간 활동 분석</h3>
                                                <Link to="/activity" className="view-more">자세히 보기</Link>
                                            </div>
                                            {weeklyActivity && weeklyActivity.length > 0 ? (
                                                <div className="activity-chart-box-mypage">
                                                    <svg viewBox="0 0 300 120" preserveAspectRatio="xMidYMid meet" className="chart-svg-mypage">
                                                        {/* 그리드 라인 */}
                                                        <defs>
                                                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                                <stop offset="0%" stopColor="#D6E4FF" stopOpacity="0.3" />
                                                                <stop offset="100%" stopColor="#D6E4FF" stopOpacity="0" />
                                                            </linearGradient>
                                                        </defs>
                                                        
                                                        {/* Y축 그리드 라인 */}
                                                        {[0, 1, 2, 3, 4].map((i) => (
                                                            <line
                                                                key={`grid-y-${i}`}
                                                                x1="30"
                                                                y1={20 + (i * 20)}
                                                                x2="280"
                                                                y2={20 + (i * 20)}
                                                                stroke="#F0F0F0"
                                                                strokeWidth="1"
                                                            />
                                                        ))}
                                                        
                                                        {/* 최대값 계산 및 데이터 렌더링 */}
                                                        {(() => {
                                                            const maxValue = Math.max(...weeklyActivity.map(item => item.duration || 0));
                                                            const maxY = maxValue > 0 ? maxValue : 100;
                                                            const step = maxY / 4;
                                                            
                                                            return (
                                                                <>
                                                                    {/* Y축 레이블 */}
                                                                    {[0, 1, 2, 3, 4].map((i) => {
                                                                        const value = Math.round(maxY - (i * step));
                                                                        return (
                                                                            <text
                                                                                key={`y-label-${i}`}
                                                                                x="25"
                                                                                y={25 + (i * 20)}
                                                                                textAnchor="end"
                                                                                fontSize="10"
                                                                                fill="#666"
                                                                            >
                                                                                {value}
                                                                            </text>
                                                                        );
                                                                    })}
                                                                    
                                                                    {/* 데이터 영역 채우기 */}
                                                                    <path
                                                                        d={`M 30 ${100} ${weeklyActivity.map((item, idx) => {
                                                                            const x = 30 + (idx * 35);
                                                                            const value = item.duration || 0;
                                                                            const y = 100 - (value / maxY * 80);
                                                                            return `L ${x} ${y}`;
                                                                        }).join(" ")} L ${30 + ((weeklyActivity.length - 1) * 35)} ${100} Z`}
                                                                        fill="url(#areaGradient)"
                                                                    />
                                                                    
                                                                    {/* 데이터 라인 */}
                                                                    <path
                                                                        d={`M ${weeklyActivity.map((item, idx) => {
                                                                            const x = 30 + (idx * 35);
                                                                            const value = item.duration || 0;
                                                                            const y = 100 - (value / maxY * 80);
                                                                            return idx === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                                                                        }).join(" ")}`}
                                                                        fill="none"
                                                                        stroke="#3b82f6"
                                                                        strokeWidth="2.5"
                                                                        strokeLinejoin="round"
                                                                        strokeLinecap="round"
                                                                    />
                                                                    
                                                                    {/* 데이터 포인트 */}
                                                                    {weeklyActivity.map((item, idx) => {
                                                                        const x = 30 + (idx * 35);
                                                                        const value = item.duration || 0;
                                                                        const y = 100 - (value / maxY * 80);
                                                                        return (
                                                                            <g key={`point-${idx}`}>
                                                                                <circle
                                                                                    cx={x}
                                                                                    cy={y}
                                                                                    r="4"
                                                                                    fill="#3b82f6"
                                                                                    stroke="#fff"
                                                                                    strokeWidth="2"
                                                                                />
                                                                                {/* 값 표시 */}
                                                                                <text
                                                                                    x={x}
                                                                                    y={y - 8}
                                                                                    textAnchor="middle"
                                                                                    fontSize="9"
                                                                                    fill="#3b82f6"
                                                                                    fontWeight="600"
                                                                                >
                                                                                    {value}
                                                                                </text>
                                                                            </g>
                                                                        );
                                                                    })}
                                                                    
                                                                    {/* X축 레이블 - 일요일부터 순서대로 */}
                                                                    {weeklyActivity.map((item, idx) => {
                                                                        const x = 30 + (idx * 35);
                                                                        const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
                                                                        let dayLabel = item.day;
                                                                        if (!dayLabel || dayLabel === '') {
                                                                            dayLabel = dayLabels[idx % 7];
                                                                        } else {
                                                                            // 영어 요일을 한국어로 변환
                                                                            const dayMap = {
                                                                                'Sun': '일', 'Sunday': '일',
                                                                                'Mon': '월', 'Monday': '월',
                                                                                'Tue': '화', 'Tuesday': '화',
                                                                                'Wed': '수', 'Wednesday': '수',
                                                                                'Thu': '목', 'Thursday': '목',
                                                                                'Fri': '금', 'Friday': '금',
                                                                                'Sat': '토', 'Saturday': '토'
                                                                            };
                                                                            const dayStr = String(dayLabel);
                                                                            dayLabel = dayMap[dayStr] || dayLabels[idx % 7];
                                                                        }
                                                                        return (
                                                                            <text
                                                                                key={`x-label-${idx}`}
                                                                                x={x}
                                                                                y={115}
                                                                                textAnchor="middle"
                                                                                fontSize="11"
                                                                                fill="#666"
                                                                                fontWeight="500"
                                                                            >
                                                                                {dayLabel}
                                                                            </text>
                                                                        );
                                                                    })}
                                                                </>
                                                            );
                                                        })()}
                                                        
                                                    </svg>
                                                </div>
                                            ) : (
                                                <span className="event-empty">최근 일주일간 활동이 없습니다.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="pet-detail-card-wrapper">
                                    <p className="event-empty">등록된 반려동물이 없습니다.</p>
                                </div>
                            )}
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
