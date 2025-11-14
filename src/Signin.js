import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';   // ✅ 추가
import './Signin.css';

function Signin() {
  const [form, setForm] = useState({ id: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id || !form.password) return;

    try {
      setLoading(true);

      // --- 1단계: 로그인 ---
      const loginRes = await axios.post(
        'https://youngbin.pythonanywhere.com/api/v1/users/login/',
        {
          username: form.id,
          password: form.password,
        }
      );

      const token = loginRes.data?.access;   // SimpleJWT 기준
      if (!token) {
        throw new Error('로그인 응답에 Access Token이 없습니다.');
      }
      localStorage.setItem('token', token);

      // --- 2단계: 펫 목록 확인 ---
      const petCheckRes = await axios.get('https://youngbin.pythonanywhere.com/api/v1/pets/', 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
        if (petCheckRes.data && petCheckRes.data.length > 0) {

          const firstPetId = petCheckRes.data[0].id; // 👈 여기엔 "5"만 들어있음
          localStorage.setItem('pet_id', firstPetId); // 👈 "5"만 저장

          navigate('/dashboard');
        }

      console.log('펫 목록 응답:', petCheckRes.data);

      // --- 3단계: pet_id 저장 + 페이지 이동 ---
      let pets = [];

      // 응답이 배열인 경우
      if (Array.isArray(petCheckRes.data)) {
        pets = petCheckRes.data;
      }
      // 응답이 { results: [...] } 형태일 수도 있음
      else if (Array.isArray(petCheckRes.data.results)) {
        pets = petCheckRes.data.results;
      }

      const hasPets = pets.length > 0;

      if (hasPets) {
        const firstPetId = pets[0].id;
        console.log('저장할 pet_id:', firstPetId);
        localStorage.setItem('pet_id', String(firstPetId));  // ✅ 핵심

        navigate('/dashboard');
      } else {
        localStorage.removeItem('pet_id');
        navigate('/Homelogin');
      }
    } catch (err) {
      console.error('로그인 또는 펫 확인 중 오류:', err);
      alert('아이디 또는 비밀번호를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="signin-container">
      <div className="main-content">
        <h1 className="logo-text">멍냥멍냥</h1>
        <p className="sub-text">코쪽이들</p>
      </div>

      <div className="form-container">
        <h2 className="form-title">로그인</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="id"
              placeholder="아이디"
              value={form.id}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="비밀번호"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="sign-in-button"
            disabled={!form.id || !form.password || loading}
          >
            {loading ? 'Sign in' : 'Sign in'}
          </button>

          <p className="signup-link">
            <a href="/signup">계정 만들기</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signin;
