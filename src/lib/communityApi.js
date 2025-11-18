// src/lib/communityApi.js
const API_BASE = "https://youngbin.pythonanywhere.com/api/v1/community";

const getToken = () => localStorage.getItem("token");

// 공통 API 요청 함수
async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };
  
  // FormData인 경우 Content-Type을 설정하지 않음 (브라우저가 자동 설정)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
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

// 게시글 목록 조회
export async function getPosts() {
  return apiRequest("/posts/", { method: "GET" });
}

// 게시글 상세 조회
export async function getPost(postId) {
  return apiRequest(`/posts/${postId}/`, { method: "GET" });
}

// 게시글 작성
export async function createPost(data) {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("content", data.content);
  if (data.image && data.image instanceof File) {
    formData.append("image", data.image);
  }
  
  return apiRequest("/posts/", {
    method: "POST",
    body: formData,
  });
}

// 게시글 수정
export async function updatePost(postId, data) {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("content", data.content);
  
  // 이미지가 File 객체인 경우 (새 이미지 또는 빈 파일로 삭제)
  if (data.image && data.image instanceof File) {
    // 빈 파일인 경우 (이미지 삭제) - 빈 문자열로 전송
    if (data.image.size === 0) {
      formData.append("image", "");
    } else {
      formData.append("image", data.image);
    }
  }
  // image가 명시적으로 null인 경우 이미지 제거
  else if (data.image === null) {
    formData.append("image", "");
  }
  // image가 undefined이면 기존 이미지 유지 (필드 자체를 보내지 않음)
  
  return apiRequest(`/posts/${postId}/`, {
    method: "PUT",
    body: formData,
  });
}

// 게시글 삭제
export async function deletePost(postId) {
  return apiRequest(`/posts/${postId}/`, { method: "DELETE" });
}

// 좋아요 토글
export async function toggleLike(postId) {
  return apiRequest(`/posts/${postId}/like/`, { method: "POST" });
}

// 댓글 목록 조회
export async function getComments(postId) {
  return apiRequest(`/posts/${postId}/comments/`, { method: "GET" });
}

// 댓글 작성
export async function createComment(postId, content) {
  return apiRequest(`/posts/${postId}/comments/`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

// 댓글 수정
export async function updateComment(commentId, content) {
  return apiRequest(`/comments/${commentId}/`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

// 댓글 삭제
export async function deleteComment(commentId) {
  return apiRequest(`/comments/${commentId}/`, { method: "DELETE" });
}

