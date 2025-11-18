import React, { useState } from 'react'; // useState를 최상단에 import
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Signin from './Signin';
import Signup from './Signup';
import Dashboard from './Dashboard';
import NewFamily from './NewFamily';
import Activity from './Activity';
import Community from './Community';
import CommunityWrite from "./CommunityWrite";
import PostDetail from "./PostDetail";  
import PostEdit from "./PostEdit";       
import Calendar from './Calendar';
import Chat from './Chat';
import Health from './Health';
import BcsTest from './BcsTest';
import Homelogin from './Homelogin';
import Mypage from './Mypage';

export default function App(){
  // ✅ [통합] user, pet 상태를 App.js에서 관리 (예시 데이터)
  const [currentUser, setCurrentUser] = useState({ nickname: '', id: 'user1' });
  const [currentPet, setCurrentPet] = useState({ 
    name: '@@', 
    breed: '미입력', 
    weight: '미입력', 
    age: '미입력', 
    bcs: '미입력'// BCS
  });

  // ✅ [통합] BCS를 업데이트하는 함수
  const handleBcsUpdate = (newBcsScore) => {
    setCurrentPet(prevPet => ({
      ...prevPet,
      bcs: `${newBcsScore}단계` // 새 BCS 점수로 업데이트
    }));
    alert(`BCS 점수가 ${newBcsScore}점으로 업데이트 되었습니다!`);
    // TODO: 서버에 BCS 업데이트 요청 보내는 로직 추가
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Signin" element={<Signin />} />
        <Route path="/Signup" element={<Signup />} />
        
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/NewFamily" element={<NewFamily />} />
      
        <Route path="/Activity" element={<Activity />} />
        <Route path="/Calendar" element={<Calendar />} />
        <Route path="/BcsTest" element={<BcsTest />} />
        <Route path="/NewFamily" element={<NewFamily />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/write" element={<CommunityWrite />} />
        <Route path="/community/:id" element={<PostDetail />} />
        <Route path="/community/:id/edit" element={<PostEdit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/Chat" element={<Chat />} />
        <Route path="/Homelogin" element={<Homelogin />} />
        {/* Health 페이지로 user와 pet 정보 전달 */}
        <Route 
          path="/Health" 
          element={<Health user={currentUser} pet={currentPet} />} 
        /> 
        
        {/* BcsTest 페이지로 user와 onUpdateBcs 함수 전달 */}
        <Route 
          path="/BcsTest" 
          element={<BcsTest user={currentUser} onUpdateBcs={handleBcsUpdate} />} 
        />
        <Route path = "/Mypage" element={<Mypage />} />
        
        {/* Fallback 경로 */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/Mypage" element={<Mypage/>}/>
      </Routes>
    </BrowserRouter>
  );
}