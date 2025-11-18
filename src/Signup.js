import React, { useState } from 'react';
import axios from 'axios';
import './Signup.css';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    nickname: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 유효성 검증
    if (!formData.username || !formData.username.trim()) {
      alert('아이디를 입력해주세요.');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      alert('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (!formData.email || !formData.email.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }
    if (!formData.nickname || !formData.nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    try {
      const payload = {
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim(),
        nickname: formData.nickname.trim(),
      };

      console.log('회원가입 요청 데이터:', payload);

      const res = await axios.post(
        'https://youngbin.pythonanywhere.com/api/v1/users/register/',
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('회원가입 성공:', res.data);
      alert('회원가입이 성공적으로 완료되었습니다!');
      setFormData({ username: '', password: '', email: '', nickname: '' });

      window.location.href = '/signin';
    } catch (err) {
      console.error('회원가입 에러:', err.response?.data || err.message);
      console.error('에러 상세:', err.response);
      
      // 에러 메시지 파싱
      let errorMessage = '회원가입에 실패했습니다.';
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
          // 필드별 에러 메시지 처리
          const fieldErrors = [];
          if (err.response.data.username) {
            fieldErrors.push(`아이디: ${Array.isArray(err.response.data.username) ? err.response.data.username[0] : err.response.data.username}`);
          }
          if (err.response.data.password) {
            fieldErrors.push(`비밀번호: ${Array.isArray(err.response.data.password) ? err.response.data.password[0] : err.response.data.password}`);
          }
          if (err.response.data.email) {
            fieldErrors.push(`이메일: ${Array.isArray(err.response.data.email) ? err.response.data.email[0] : err.response.data.email}`);
          }
          if (err.response.data.nickname) {
            fieldErrors.push(`닉네임: ${Array.isArray(err.response.data.nickname) ? err.response.data.nickname[0] : err.response.data.nickname}`);
          }
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('\n');
          } else {
            errorMessage = JSON.stringify(err.response.data);
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(`회원가입 실패:\n${errorMessage}`);
    }
  };

  return (
    <div className="signup-container">
      <div className="main-content">
        <h1 className="logo-text">멍냥멍냥</h1>
        <p className="sub-text">코쪽이들</p>
      </div>
      <div className="form-container">
        <h2 className="form-title">회원가입</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="아이디"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="이메일"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              name="nickname"
              placeholder="닉네임"
              value={formData.nickname}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="sign-in-button">
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

export default Signup;
