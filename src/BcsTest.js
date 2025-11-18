import React, { useState, useEffect } from "react";
// ✅ [추가] useNavigate 훅 import
import { useNavigate, NavLink, Link } from 'react-router-dom'; 
import axios from "axios";
import "./BcsTest.css";
import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";
import bell from "./img/bell.png";
import chat from "./img/chat.png";

// ====== API 설정 ======
const API_BASE = "https://youngbin.pythonanywhere.com/api/v1/pets";

const getPetId = () => {
  const stored = localStorage.getItem("pet_id");
  const n = parseInt(stored, 10);
  return Number.isNaN(n) ? 1 : n;
};

const getToken = () => localStorage.getItem("token");

// 공통 API 요청 함수
async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("API Error:", res.status, text);
    alert(
      `API 오류 (${res.status})\n${
        text || "서버에서 에러 메시지를 보내지 않았습니다."
      }`
    );
    throw new Error(`API Error ${res.status}`);
  }

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const BcsTest = ({ user, onUpdateBcs }) => { 
  const navigate = useNavigate(); 
  
  // 각 질문의 선택 상태를 관리하는 state
  const [q1, setQ1] = useState(null); // Q1: 갈비뼈
  const [q2, setQ2] = useState(null); // Q2: 위에서 내려다보기
  const [q3, setQ3] = useState(null); // Q3: 옆에서 살펴보기

  // BCS 결과 표시를 위한 상태
  const [bcsResult, setBcsResult] = useState(null);

  // 다시 진단하기 함수
  const handleResetDiagnosis = () => {
    setBcsResult(null);
    setQ1(null);
    setQ2(null);
    setQ3(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 헤더 팝업
  const [showBellPopup, setShowBellPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);

  // 로그인 상태 및 사용자 정보
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userProfileImage, setUserProfileImage] = useState("https://i.pravatar.cc/80?img=11");

  // 로그인 상태 확인 및 사용자 정보 가져오기
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      axios
        .get("https://youngbin.pythonanywhere.com/api/v1/users/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const name =
            res.data?.nickname ||
            res.data?.username ||
            res.data?.id ||
            "멍냥";
          setUsername(name);
          // 프로필 이미지가 있으면 사용, 없으면 기본 이미지
          if (res.data?.profile_image || res.data?.avatar) {
            const imgUrl = res.data.profile_image || res.data.avatar;
            setUserProfileImage(
              imgUrl.startsWith("http")
                ? imgUrl
                : `https://youngbin.pythonanywhere.com${imgUrl}`
            );
          }
        })
        .catch((err) => {
          console.error("유저 정보 불러오기 실패:", err);
          setIsLoggedIn(false);
        });
    } else {
      setIsLoggedIn(false);
    }
  }, []); 

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

  const handleCheckResult = async () => {
    // 1. 모든 질문에 답했는지 확인
    if (!q1 || !q2 || !q3) {
      alert("모든 문항에 답해주세요!");
      return;
    }

    // 2. 선택된 값 (score_N)들을 분석
    const scores = [q1, q2, q3].map(val => parseInt(val.split('_')[1]));
    let finalBcs = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    console.log("BCS 계산:", {
      q1: q1,
      q2: q2,
      q3: q3,
      scores: scores,
      finalBcs: finalBcs
    }); // 디버깅용 

    try {
      // API 호출
      const petId = getPetId();
      const token = getToken();
      
      const response = await fetch(`https://youngbin.pythonanywhere.com/api/v1/pets/health/bcs-checkup/${petId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          q1_score: parseInt(q1.split('_')[1]),
          q2_score: parseInt(q2.split('_')[1]),
          q3_score: parseInt(q3.split('_')[1]),
          final_bcs: finalBcs,
        }),
      });

      const text = await response.text();
      let apiResult = null;
      
      if (response.ok && text) {
        try {
          apiResult = JSON.parse(text);
          console.log("BCS 체크업 API 응답:", apiResult); // 디버깅용
          console.log("BCS 체크업 API 응답의 모든 키:", apiResult ? Object.keys(apiResult) : "null"); // 디버깅용
        } catch (e) {
          console.error("응답 파싱 실패:", e);
        }
      }

      // ⚠️ 중요: 프론트엔드에서 계산한 finalBcs 값을 우선 사용
      // API 응답의 stage_number는 무시하고 프론트엔드 계산값 사용
      console.log("프론트엔드 계산값 (finalBcs):", finalBcs); // 디버깅용
      if (apiResult && apiResult.stage_number) {
        console.log("API 응답의 stage_number:", apiResult.stage_number, "(무시하고 프론트엔드 계산값 사용)"); // 디버깅용
      }

      // API 응답이 있으면 텍스트만 사용, BCS 점수는 프론트엔드 계산값 사용
      let resultText = "";
      let detailText = "";

      // API 응답의 텍스트가 있고, 프론트엔드 계산값과 API 응답값이 같을 때만 사용
      if (apiResult && apiResult.result_text && apiResult.stage_number === finalBcs) {
        resultText = apiResult.result_text;
        detailText = apiResult.detail_text || apiResult.details || "";
        console.log("API 응답의 텍스트 사용 (점수 일치)"); // 디버깅용
      } else {
        // 프론트엔드 계산값으로 텍스트 생성
        if (finalBcs <= 3) {
          resultText = "저체중";
          detailText = "갈비뼈, 허리가 너무 잘 보입니다. 체중 증가가 필요하며, 수의사와 상담하여 건강 상태를 확인해주세요.";
        } else if (finalBcs <= 5) {
          resultText = "이상적인 체중";
          detailText = "갈비뼈를 만질 때 약간의 지방이 느껴지지만 허리선이 뚜렷합니다. 현재의 상태를 잘 유지해주세요.";
        } else if (finalBcs <= 7) {
          resultText = "다소 과체중";
          detailText = "갈비뼈를 만질 때 안정적인 약간의 지방이 느껴집니다. 허리선이 뚜렷하지 않을 수 있습니다. 간식 양을 조절할 필요가 있습니다.";
        } else {
          resultText = "비만";
          detailText = "갈비뼈를 만지기 어렵고, 허리선 구분이 거의 불가능합니다. 즉시 수의사와 상담하고 체계적인 다이어트가 필요합니다.";
        }
        console.log("프론트엔드 계산값으로 텍스트 생성"); // 디버깅용
      }

      // ⚠️ 중요: 프론트엔드에서 계산한 finalBcs 값을 사용 (API 응답의 stage_number 무시)
      setBcsResult({
        score: finalBcs, // 프론트엔드 계산값 사용
        resultText: resultText,
        detailText: detailText,
      });
      
      // 로컬 스토리지에 최신 BCS 값 저장 (Health 페이지에서 사용)
      try {
        localStorage.setItem('latest_bcs_score', JSON.stringify({
          score: finalBcs,
          timestamp: Date.now()
        }));
        console.log("로컬 스토리지에 BCS 값 저장:", finalBcs); // 디버깅용
      } catch (e) {
        console.warn("로컬 스토리지 저장 실패:", e);
      }
      
      console.log("최종 BCS 결과:", { score: finalBcs, resultText, detailText }); // 디버깅용

      // BCS 체크업 API 호출 시 자동으로 BCS 업데이트 시도
      // ⚠️ 중요: BCS 체크업 API가 잘못된 값을 저장할 수 있으므로, 프론트엔드 계산값으로 즉시 덮어쓰기
      try {
        console.log("BCS 체크업 후 자동 업데이트 시도 (프론트엔드 계산값:", finalBcs, "사용)..."); // 디버깅용
        const petId = getPetId();
        
        // BCS 업데이트 시도 (여러 필드명으로)
        const updatePromises = [
          apiRequest(`${API_BASE}/${petId}/`, {
            method: "PATCH",
            body: JSON.stringify({ bcs: finalBcs }),
          }).catch(() => null),
          apiRequest(`${API_BASE}/${petId}/`, {
            method: "PATCH",
            body: JSON.stringify({ bcs_score: finalBcs }),
          }).catch(() => null),
          apiRequest(`${API_BASE}/${petId}/`, {
            method: "PATCH",
            body: JSON.stringify({ body_condition_score: finalBcs }),
          }).catch(() => null),
        ];
        
        await Promise.allSettled(updatePromises);
        console.log("BCS 자동 업데이트 시도 완료"); // 디버깅용
        
        // 업데이트 후 건강 페이지 정보 확인
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // 서버 반영 대기
          const healthInfo = await apiRequest(`${API_BASE}/health/${petId}/`, {
            method: "GET",
          });
          console.log("BCS 자동 업데이트 후 건강 페이지 정보:", healthInfo?.pet_info?.bcs); // 디버깅용
        } catch (err) {
          console.warn("건강 페이지 정보 확인 실패:", err);
        }
      } catch (updateError) {
        console.warn("BCS 자동 업데이트 실패 (수동 업데이트 버튼 사용 가능):", updateError);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("BCS 진단 API 호출 실패:", error);
      // API 실패 시에도 로컬 계산 결과 표시
      const scores = [q1, q2, q3].map(val => parseInt(val.split('_')[1]));
      let finalBcs = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      
      let resultText = "";
      let detailText = "";

      if (finalBcs <= 3) {
        resultText = "저체중";
        detailText = "갈비뼈, 허리가 너무 잘 보입니다. 체중 증가가 필요하며, 수의사와 상담하여 건강 상태를 확인해주세요.";
      } else if (finalBcs <= 5) {
        resultText = "이상적인 체중";
        detailText = "갈비뼈를 만질 때 약간의 지방이 느껴지지만 허리선이 뚜렷합니다. 현재의 상태를 잘 유지해주세요.";
      } else if (finalBcs <= 7) {
        resultText = "다소 과체중";
        detailText = "갈비뼈를 만질 때 안정적인 약간의 지방이 느껴집니다. 허리선이 뚜렷하지 않을 수 있습니다. 간식 양을 조절할 필요가 있습니다.";
      } else {
        resultText = "비만";
        detailText = "갈비뼈를 만지기 어렵고, 허리선 구분이 거의 불가능합니다. 즉시 수의사와 상담하고 체계적인 다이어트가 필요합니다.";
      }

      setBcsResult({
        score: finalBcs,
        resultText: resultText,
        detailText: detailText,
      });

      // API 실패 시에도 로컬 계산 결과로 BCS 업데이트 시도
      try {
        console.log("BCS 진단 실패 후 자동 업데이트 시도 (로컬 계산 결과)..."); // 디버깅용
        const petId = getPetId();
        
        // BCS 업데이트 시도 (여러 필드명으로)
        const updatePromises = [
          apiRequest(`${API_BASE}/${petId}/`, {
            method: "PATCH",
            body: JSON.stringify({ bcs: finalBcs }),
          }).catch(() => null),
          apiRequest(`${API_BASE}/${petId}/`, {
            method: "PATCH",
            body: JSON.stringify({ bcs_score: finalBcs }),
          }).catch(() => null),
          apiRequest(`${API_BASE}/${petId}/`, {
            method: "PATCH",
            body: JSON.stringify({ body_condition_score: finalBcs }),
          }).catch(() => null),
        ];
        
        await Promise.allSettled(updatePromises);
        console.log("BCS 자동 업데이트 시도 완료 (로컬 계산 결과)"); // 디버깅용
      } catch (updateError) {
        console.warn("BCS 자동 업데이트 실패 (수동 업데이트 버튼 사용 가능):", updateError);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleUpdateBcs = async () => {
    console.log("=== BCS 업데이트 함수 시작 ==="); // 디버깅용
    console.log("bcsResult:", bcsResult); // 디버깅용
    
    if (!bcsResult) {
      console.warn("BCS 진단 결과가 없습니다."); // 디버깅용
      alert("BCS 진단 결과가 없습니다. 먼저 진단을 완료해주세요.");
      return;
    }

    try {
      const petId = getPetId();
      console.log("펫 ID:", petId); // 디버깅용
      console.log("BCS 업데이트 요청 값:", bcsResult.score); // 디버깅용
      
      // 방법 1: bcs 필드로 업데이트 시도
      console.log("방법 1: bcs 필드로 업데이트 시도 중..."); // 디버깅용
      try {
        const updatedPet1 = await apiRequest(`${API_BASE}/${petId}/`, {
          method: "PATCH",
          body: JSON.stringify({
            bcs: bcsResult.score,
          }),
        });
        console.log("✅ 방법 1 성공 - BCS 업데이트 후 펫 정보 (bcs 필드):", updatedPet1); // 디버깅용
        console.log("updatedPet1.bcs:", updatedPet1?.bcs); // 디버깅용
      } catch (err1) {
        console.error("❌ 방법 1 실패 - bcs 필드로 업데이트 실패:", err1); // 디버깅용
        console.error("에러 상세:", err1.message, err1); // 디버깅용
      }
      
      // 방법 2: bcs_score 필드로 업데이트 시도
      console.log("방법 2: bcs_score 필드로 업데이트 시도 중..."); // 디버깅용
      try {
        const updatedPet2 = await apiRequest(`${API_BASE}/${petId}/`, {
          method: "PATCH",
          body: JSON.stringify({
            bcs_score: bcsResult.score,
          }),
        });
        console.log("✅ 방법 2 성공 - BCS 업데이트 후 펫 정보 (bcs_score 필드):", updatedPet2); // 디버깅용
        console.log("updatedPet2.bcs_score:", updatedPet2?.bcs_score); // 디버깅용
      } catch (err2) {
        console.error("❌ 방법 2 실패 - bcs_score 필드로 업데이트 실패:", err2); // 디버깅용
        console.error("에러 상세:", err2.message, err2); // 디버깅용
      }
      
      // 방법 3: body_condition_score 필드로 업데이트 시도
      console.log("방법 3: body_condition_score 필드로 업데이트 시도 중..."); // 디버깅용
      try {
        const updatedPet3 = await apiRequest(`${API_BASE}/${petId}/`, {
          method: "PATCH",
          body: JSON.stringify({
            body_condition_score: bcsResult.score,
          }),
        });
        console.log("✅ 방법 3 성공 - BCS 업데이트 후 펫 정보 (body_condition_score 필드):", updatedPet3); // 디버깅용
        console.log("updatedPet3.body_condition_score:", updatedPet3?.body_condition_score); // 디버깅용
      } catch (err3) {
        console.error("❌ 방법 3 실패 - body_condition_score 필드로 업데이트 실패:", err3); // 디버깅용
        console.error("에러 상세:", err3.message, err3); // 디버깅용
      }
      
      // 업데이트 후 다시 펫 정보를 가져와서 확인
      const verifyPet = await apiRequest(`${API_BASE}/${petId}/`, {
        method: "GET",
      });
      console.log("BCS 업데이트 확인 (재조회 - 펫 정보):", verifyPet); // 디버깅용
      console.log("verifyPet의 모든 키:", Object.keys(verifyPet || {})); // 디버깅용
      console.log("verifyPet.bcs:", verifyPet?.bcs); // 디버깅용
      console.log("verifyPet.bcs_score:", verifyPet?.bcs_score); // 디버깅용
      console.log("verifyPet.body_condition_score:", verifyPet?.body_condition_score); // 디버깅용
      
      // 건강 페이지 정보도 확인 (pet_info에 BCS가 있을 수 있음)
      try {
        const healthInfo = await apiRequest(`${API_BASE}/health/${petId}/`, {
          method: "GET",
        });
        console.log("건강 페이지 정보 확인 (BCS 업데이트 후):", healthInfo); // 디버깅용
        console.log("pet_info:", healthInfo?.pet_info); // 디버깅용
        console.log("pet_info.bcs:", healthInfo?.pet_info?.bcs); // 디버깅용
        console.log("pet_info.bcs_score:", healthInfo?.pet_info?.bcs_score); // 디버깅용
        console.log("pet_info.body_condition_score:", healthInfo?.pet_info?.body_condition_score); // 디버깅용
      } catch (err) {
        console.error("건강 페이지 정보 확인 실패:", err);
      }

      // 로컬 상태도 업데이트 (App.js의 onUpdateBcs 호출)
      if (onUpdateBcs) {
        onUpdateBcs(bcsResult.score);
      }

      // 업데이트 후 건강 페이지 정보를 다시 확인하여 반영 여부 확인
      try {
        console.log("업데이트 후 건강 페이지 정보 재확인 중..."); // 디버깅용
        await new Promise(resolve => setTimeout(resolve, 1000)); // 서버 반영 대기
        
        const healthInfoAfterUpdate = await apiRequest(`${API_BASE}/health/${petId}/`, {
          method: "GET",
        });
        console.log("업데이트 후 건강 페이지 정보:", healthInfoAfterUpdate?.pet_info?.bcs); // 디버깅용
        
        if (healthInfoAfterUpdate?.pet_info?.bcs) {
          const currentBcs = healthInfoAfterUpdate.pet_info.bcs;
          const expectedBcs = `${bcsResult.score}단계`;
          console.log("현재 BCS:", currentBcs, "예상 BCS:", expectedBcs); // 디버깅용
          
          if (currentBcs !== expectedBcs && !currentBcs.includes(String(bcsResult.score))) {
            console.warn("⚠️ BCS 업데이트가 반영되지 않았습니다. 백엔드에서 BCS 필드를 지원하지 않을 수 있습니다."); // 디버깅용
            alert(`BCS 점수 업데이트를 시도했습니다 (${bcsResult.score}단계), 하지만 서버에 반영되지 않았을 수 있습니다.\n현재 서버 값: ${currentBcs}\n\n백엔드 개발자에게 BCS 필드 지원을 요청해주세요.`);
          } else {
            alert(`BCS 점수가 ${bcsResult.score}단계로 업데이트 되었습니다!`);
          }
        } else {
          alert(`BCS 점수가 ${bcsResult.score}단계로 업데이트 되었습니다!`);
        }
      } catch (err) {
        console.error("건강 페이지 정보 확인 실패:", err);
        alert(`BCS 점수가 ${bcsResult.score}단계로 업데이트 되었습니다!`);
      }
      
      // 업데이트가 완료된 후 약간의 지연을 두고 페이지 이동
      setTimeout(() => {
        // 페이지를 완전히 새로고침하여 Health 페이지가 최신 정보를 불러오도록 함
        // 캐시를 무시하고 강제로 새로고침
        window.location.href = '/health?t=' + Date.now();
      }, 500); // 추가 대기 시간
    } catch (error) {
      console.error("=== BCS 업데이트 전체 실패 ==="); // 디버깅용
      console.error("에러 객체:", error); // 디버깅용
      console.error("에러 메시지:", error?.message); // 디버깅용
      console.error("에러 스택:", error?.stack); // 디버깅용
      alert("BCS 업데이트 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
    console.log("=== BCS 업데이트 함수 종료 ==="); // 디버깅용
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
            <NavLink to="/activity">활동</NavLink>
            <NavLink to="/health" className="active">건강</NavLink>
            <NavLink to="/calendar">캘린더</NavLink>
            <NavLink to="/community">커뮤니티</NavLink>
          </nav>
          {isLoggedIn ? (
            <nav className="menuicon">
              {/* 프로필 */}
              <Link to="/mypage" className="profile">
                <div className="profile__avatar">
                  <img src={userProfileImage} alt="프로필" />
                </div>
                <span className="profile__name">{username}</span>
              </Link>

              {/* 알림 벨 */}
              <div className="icon-wrapper">
                <button
                  className="icon-btn"
                  onClick={() => {
                    setShowBellPopup((v) => !v);
                    setShowChatPopup(false);
                  }}
                >
                  <img src={bell} alt="알림 아이콘" className="icon" />
                </button>
                {showBellPopup && (
                  <div className="popup">
                    <p>📢 새 알림이 없습니다.</p>
                  </div>
                )}
              </div>

              {/* 채팅 */}
              <div className="icon-wrapper">
                <button
                  className="icon-btn"
                  onClick={() => {
                    setShowChatPopup((v) => !v);
                    setShowBellPopup(false);
                  }}
                >
                  <NavLink to="/Chat">
                    <img src={chat} alt="채팅 아이콘" className="icon" />
                  </NavLink>
                </button>
              </div>
            </nav>
          ) : (
            <nav className="menulink">
              <NavLink to="/signup">회원가입</NavLink>
              <NavLink to="/signin">로그인</NavLink>
            </nav>
          )}
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

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="update-bcs-btn" onClick={handleUpdateBcs}>
                  이 결과로 업데이트 하기
                </button>
                <button 
                  className="update-bcs-btn" 
                  onClick={handleResetDiagnosis}
                  style={{ backgroundColor: '#6c757d', borderColor: '#6c757d' }}
                >
                  다시 진단하기
                </button>
              </div>
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