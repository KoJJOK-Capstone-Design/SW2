// src/PostDetail.js
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import "./Home.css";
import "./Community.css";
import axios from "axios";

import logoBlue from "./img/logo_blue.png";
import logoGray from "./img/logo_gray.png";
import githubpic from "./img/github.png";
import reactpic from "./img/react.png";
import djangopic from "./img/django.png";

// 아이콘
import favoriteIcon from "./img/Favorite_fill.png";
import favoriteRedIcon from "./img/Favorite_red_fill.png";
import chatIcon from "./img/Chat2.png";
import bell from "./img/bell.png";
import chat from "./img/chat.png";

import {
  getPost as getPostApi,
  deletePost as deletePostApi,
  toggleLike,
  getComments,
  createComment,
  updateComment,
  deleteComment as deleteCommentApi,
} from "./lib/communityApi";

// 경과 시간 레이블
function timeLabel(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  if (h < 24) return `${h}시간 전`;
  return `${d}일 전`;
}

export default function PostDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [post, setPost] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [imageBlobUrl, setImageBlobUrl] = useState(null); // 이미지 blob URL

  // 삭제 모달
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 좋아요
  const [liked, setLiked] = useState(false);

  // 댓글
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("https://youngbin.pythonanywhere.com/api/v1/users/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const user = res.data;
          const userObj = {
            id: user.id,
            username: user.nickname || user.username || user.id || "멍냥",
          };
          console.log("Current user loaded:", userObj);
          setCurrentUser(userObj);
        })
        .catch((err) => {
          console.error("사용자 정보 로딩 실패:", err);
          // 로그인하지 않은 경우에도 빈 객체로 설정
          setCurrentUser(null);
        });
    } else {
      setCurrentUser(null);
    }
  }, []);

  // 게시글 상세 및 댓글 로드
  useEffect(() => {
    if (!id) return;
    
    const loadPost = async () => {
      try {
        const [postData, commentsData] = await Promise.all([
          getPostApi(id),
          getComments(id),
        ]);

        if (!postData) {
          nav("/community");
          return;
        }

        // API 응답을 프론트엔드 형식으로 변환
        console.log("Raw postData.author:", postData.author, "Type:", typeof postData.author);
        console.log("Full postData:", postData);
        
        // authorId 추출 - 여러 가능성 시도
        let authorId = null;
        let authorName = "익명";
        
        if (typeof postData.author === "object" && postData.author !== null) {
          authorId = postData.author.id || postData.author.pk || postData.author.user_id || null;
          authorName = postData.author.username || postData.author.nickname || postData.author.name || String(postData.author.id || "익명");
        } else if (typeof postData.author === "number") {
          // author가 숫자 ID만 반환하는 경우
          authorId = postData.author;
          authorName = String(postData.author);
        } else if (typeof postData.author === "string") {
          authorName = postData.author;
        }
        
        // author 필드가 없는 경우 author_id 필드 확인
        if (!authorId && postData.author_id) {
          authorId = postData.author_id;
        }
        
        const normalized = {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          author: authorName,
          authorId: authorId,
          createdAt: postData.created_at,
          updatedAt: postData.updated_at,
          likes: postData.like_count || (Array.isArray(postData.likes) ? postData.likes.length : 0),
          likedBy: Array.isArray(postData.likes) ? postData.likes : [],
          image: (() => {
            // 모든 가능한 필드명 확인
            const img = postData.image || 
                       postData.image_url || 
                       postData.attachment || 
                       postData.photo ||
                       postData.file ||
                       postData.media;
            
            console.log("=== Image Debug ===");
            console.log("All postData keys:", Object.keys(postData));
            console.log("Image data:", { 
              img, 
              type: typeof img,
              postDataImage: postData.image,
              postDataImageUrl: postData.image_url,
              postDataAttachment: postData.attachment,
            });
            
            if (!img) {
              console.log("No image found in any field");
              return null;
            }
            
            // 문자열인 경우
            if (typeof img === "string") {
              // 빈 문자열 체크
              if (img.trim() === "") {
                console.log("Image string is empty");
                return null;
              }
              
              // 이미 전체 URL인 경우
              if (img.startsWith("http://") || img.startsWith("https://")) {
                console.log("Full URL image:", img);
                return img;
              }
              
              // 상대 경로인 경우
              const fullUrl = `https://youngbin.pythonanywhere.com${img.startsWith("/") ? img : "/" + img}`;
              console.log("Constructed image URL:", fullUrl);
              return fullUrl;
            }
            
            // 객체인 경우
            if (typeof img === "object" && img !== null) {
              const imgUrl = img.url || img.file || img.path || img.src || img.media_url;
              if (imgUrl && typeof imgUrl === "string") {
                const finalUrl = imgUrl.startsWith("http") 
                  ? imgUrl 
                  : `https://youngbin.pythonanywhere.com${imgUrl.startsWith("/") ? imgUrl : "/" + imgUrl}`;
                console.log("Object image URL:", finalUrl);
                return finalUrl;
              }
              console.log("Image object but no valid URL field:", img);
            }
            
            console.log("Image format not recognized:", img);
            return null;
          })(),
          commentsArr: Array.isArray(commentsData)
            ? commentsData.map((c) => {
                console.log("Raw comment data:", c);
                console.log("Raw comment author:", c.author, "Type:", typeof c.author);
                
                // 댓글 authorId 추출 - 여러 가능성 시도
                let commentAuthorId = null;
                let commentAuthorName = "익명";
                
                if (typeof c.author === "object" && c.author !== null) {
                  // 객체인 경우 모든 가능한 필드 확인
                  commentAuthorId = c.author.id || c.author.pk || c.author.user_id || c.author.user || null;
                  commentAuthorName = c.author.username || c.author.nickname || c.author.name || String(c.author.id || "익명");
                } else if (typeof c.author === "number") {
                  // 숫자인 경우 그 자체가 ID
                  commentAuthorId = c.author;
                  commentAuthorName = String(c.author);
                } else if (typeof c.author === "string") {
                  // 문자열인 경우 이름만
                  commentAuthorName = c.author;
                }
                
                // author_id, authorId, user_id 등 별도 필드 확인
                if (!commentAuthorId) {
                  commentAuthorId = c.author_id || c.authorId || c.user_id || c.user || null;
                }
                
                console.log("Extracted comment author:", { commentAuthorId, commentAuthorName });
                
                return {
                  id: c.id,
                  author: commentAuthorName,
                  authorId: commentAuthorId,
                  text: c.content,
                  createdAt: c.created_at,
                };
              })
            : [],
        };

        console.log("Post loaded:", {
          postId: normalized.id,
          postAuthor: normalized.author,
          postAuthorId: normalized.authorId,
          postAuthorIdType: typeof normalized.authorId,
          currentUser: currentUser,
          currentUserId: currentUser?.id,
          currentUserIdType: typeof currentUser?.id,
          image: normalized.image,
          rawPostData: postData, // 전체 API 응답 확인
        });
        
        // 이미지가 null이면 경고
        if (!normalized.image) {
          console.warn("⚠️ 이미지가 없습니다. postData:", postData);
          setImageBlobUrl(null);
        } else {
          console.log("✅ 이미지 URL:", normalized.image);
          // 이미지를 fetch로 가져와서 blob URL 생성 (인증 헤더 포함)
          loadImageAsBlob(normalized.image);
        }
        setPost(normalized);
        // 현재 사용자가 좋아요를 눌렀는지 확인
        if (currentUser && Array.isArray(postData.likes)) {
          const userLiked = postData.likes.some(
            (u) =>
              (typeof u === "object" ? u.id : u) === currentUser.id
          );
          setLiked(userLiked);
        }
      } catch (error) {
        console.error("게시글 로딩 실패:", error);
        nav("/community");
      }
    };

    loadPost();
  }, [id, nav, currentUser]);

  // 이미지를 fetch로 가져와서 blob URL로 변환 (인증 헤더 포함)
  // 백엔드 URL 문제일 수 있으므로 원본 URL을 직접 사용
  const loadImageAsBlob = async (imageUrl) => {
    // 일단 원본 URL을 바로 사용 (백엔드가 정적 파일을 직접 제공하는 경우)
    console.log("이미지 URL (원본 사용):", imageUrl);
    setImageBlobUrl(imageUrl);
    
    // 필요시 blob 방식도 시도 (주석 처리)
    /*
    try {
      console.log("이미지 로드 시작:", imageUrl);
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(imageUrl, { headers });
      console.log("이미지 fetch 응답:", response.status, response.statusText);
      
      if (!response.ok) {
        console.error("이미지 fetch 실패:", response.status, response.statusText);
        // fetch 실패 시 원본 URL 사용
        setImageBlobUrl(imageUrl);
        return;
      }

      const blob = await response.blob();
      console.log("Blob 생성 성공, 크기:", blob.size);
      const blobUrl = URL.createObjectURL(blob);
      setImageBlobUrl(blobUrl);
      console.log("이미지 blob URL 생성 성공:", blobUrl);
    } catch (error) {
      console.error("이미지 로드 에러:", error);
      // 에러 발생 시 원본 URL 사용
      setImageBlobUrl(imageUrl);
    }
    */
  };

  // 컴포넌트 언마운트 시 blob URL 정리
  useEffect(() => {
    return () => {
      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl);
      }
    };
  }, [imageBlobUrl]);

  // ESC로 모달 닫기
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setConfirmOpen(false);
    if (confirmOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

  const isAuthor = useMemo(() => {
    if (!post || !currentUser) {
      console.log("isAuthor check:", { hasPost: !!post, hasCurrentUser: !!currentUser });
      return false;
    }
    // authorId가 있으면 그것을 사용 (타입 변환 포함)
    if (post.authorId != null) {
      const result = String(post.authorId) === String(currentUser.id);
      console.log("isAuthor by ID:", { 
        postAuthorId: post.authorId, 
        postAuthorIdType: typeof post.authorId,
        currentUserId: currentUser.id,
        currentUserIdType: typeof currentUser.id,
        result 
      });
      return result;
    }
    // authorId가 없는 경우 author 문자열과 비교 (하위 호환성)
    const result = String(post.author) === String(currentUser.username);
    console.log("isAuthor by name:", { 
      postAuthor: post.author, 
      currentUsername: currentUser.username, 
      result 
    });
    return result;
  }, [post, currentUser]);

  const askDelete = () => setConfirmOpen(true);
  const cancelDelete = () => setConfirmOpen(false);
  const confirmDelete = async () => {
    if (!post) return;
    try {
      await deletePostApi(post.id);
      setConfirmOpen(false);
      nav("/community");
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
      alert("게시글 삭제에 실패했습니다.");
    }
  };

  if (!post) return null;

  // ------- 좋아요 토글 -------
  const handleToggleLike = async () => {
    try {
      const result = await toggleLike(post.id);
      // API 응답에 따라 좋아요 상태 업데이트
      setLiked(!liked);
      setPost({
        ...post,
        likes: liked ? post.likes - 1 : post.likes + 1,
      });
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
    }
  };

  // ------- 댓글 등록 -------
  const addComment = async () => {
    const text = commentText.trim();
    if (!text) return;

    try {
      const newComment = await createComment(post.id, text);
      console.log("New comment response:", newComment);
      
      // API 응답을 프론트엔드 형식으로 변환 (게시글 로드와 동일한 로직 사용)
      let commentAuthorId = null;
      let commentAuthorName = "익명";
      
      if (typeof newComment.author === "object" && newComment.author !== null) {
        commentAuthorId = newComment.author.id || newComment.author.pk || newComment.author.user_id || newComment.author.user || null;
        commentAuthorName = newComment.author.username || newComment.author.nickname || newComment.author.name || String(newComment.author.id || "익명");
      } else if (typeof newComment.author === "number") {
        commentAuthorId = newComment.author;
        commentAuthorName = String(newComment.author);
      } else if (typeof newComment.author === "string") {
        commentAuthorName = newComment.author;
      }
      
      if (!commentAuthorId) {
        commentAuthorId = newComment.author_id || newComment.authorId || newComment.user_id || newComment.user || null;
      }
      
      // currentUser 정보가 있으면 그것을 사용
      if (!commentAuthorId && currentUser) {
        commentAuthorId = currentUser.id;
        commentAuthorName = currentUser.username;
      }
      
      const comment = {
        id: newComment.id,
        author: commentAuthorName,
        authorId: commentAuthorId,
        text: newComment.content,
        createdAt: newComment.created_at,
      };
      
      console.log("Created comment:", comment);
      
      setPost({
        ...post,
        commentsArr: [...post.commentsArr, comment],
      });
      setCommentText("");
    } catch (error) {
      console.error("댓글 작성 실패:", error);
      alert("댓글 작성에 실패했습니다.");
    }
  };

  // ------- 댓글 삭제 -------
  const handleDeleteComment = async (cid) => {
    try {
      await deleteCommentApi(cid);
      const updatedArr = post.commentsArr.filter((c) => c.id !== cid);
      setPost({ ...post, commentsArr: updatedArr });
    } catch (error) {
      console.error("댓글 삭제 실패:", error);
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  // ------- 댓글 수정 시작/취소/확인 -------
  const startEdit = (cid, text) => {
    setEditingId(cid);
    setEditingText(text);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };
  const confirmEdit = async () => {
    if (!editingText.trim()) return;
    try {
      await updateComment(editingId, editingText);
      const updatedArr = post.commentsArr.map((c) =>
        c.id === editingId ? { ...c, text: editingText } : c
      );
      setPost({ ...post, commentsArr: updatedArr });
      cancelEdit();
    } catch (error) {
      console.error("댓글 수정 실패:", error);
      alert("댓글 수정에 실패했습니다.");
    }
  };

  return (
    <div className="home">
      {/* Header */}
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

          {currentUser ? (
            <nav className="menuicon">
              {/* 프로필 */}
              <div className="profile">
                <div className="profile__avatar">
                  <img
                    src="https://i.pravatar.cc/80?img=11"
                    alt="프로필"
                  />
                </div>
                <span className="profile__name">{currentUser.username}</span>
              </div>

              {/* 알림 벨 */}
              <div className="icon-wrapper">
                <button className="icon-btn">
                  <img src={bell} alt="알림 아이콘" className="icon" />
                </button>
              </div>

              {/* 채팅 */}
              <div className="icon-wrapper">
                <button className="icon-btn">
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

      {/* Body */}
      <main className="community-container post-detail-page">
        <NavLink to="/community" className="crumb">
          ← 커뮤니티로 돌아가기
        </NavLink>

        <div className="post-detail-head">
          <div className="avatar" aria-hidden />
          <div className="who">
            <div className="name">{post.author || "익명"}</div>
            <div className="when">
              {new Date(post.createdAt).toLocaleString()} · {timeLabel(post.createdAt)}
            </div>
          </div>

          {isAuthor && (
            <div className="post-actions">
              <NavLink className="link-btn" to={`/community/${post.id}/edit`}>
                수정
              </NavLink>
              <button className="link-btn danger" onClick={askDelete}>
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 제목/본문 + 이미지 */}
        <div className="post-detail-body detail-wide">
          <h1 className="detail-title detail-title-xl">{post.title}</h1>
          <div className="detail-content detail-content-wide">
            {post.content}
          </div>

          {/* 첨부 이미지 표시 */}
          {post.image ? (
            <div className="detail-images">
              {imageBlobUrl ? (
                <img
                  src={imageBlobUrl}
                  alt="첨부 이미지"
                  onError={(e) => {
                    console.error("Image load error (blob):", imageBlobUrl, e);
                    // blob URL 실패 시 원본 URL로 재시도
                    e.target.src = post.image;
                  }}
                  onLoad={() => {
                    console.log("Image loaded successfully (blob):", imageBlobUrl);
                  }}
                  style={{
                    width: "200px",
                    height: "auto",
                    display: "block",
                    marginTop: "8px",
                    borderRadius: "8px",
                  }}
                />
              ) : (
                <img
                  src={post.image}
                  alt="첨부 이미지"
                  onError={(e) => {
                    console.error("Image load error (original):", post.image, e);
                    e.target.style.display = "none";
                  }}
                  onLoad={() => {
                    console.log("Image loaded successfully (original):", post.image);
                  }}
                  style={{
                    width: "200px",
                    height: "auto",
                    display: "block",
                    marginTop: "8px",
                    borderRadius: "8px",
                  }}
                />
              )}
            </div>
          ) : null}
        </div>

        {/* 좋아요 / 댓글(아이콘 + 숫자) */}
        <div className="detail-stats">
          <button className="stat-item stat-like" onClick={handleToggleLike}>
            <img
              src={liked ? favoriteRedIcon : favoriteIcon}
              alt="좋아요"
              className="stat-icon"
            />
            좋아요 {post.likes ?? 0}
          </button>

          <span className="stat-item">
            <img src={chatIcon} alt="댓글" className="stat-icon" />
            댓글 {post.commentsArr?.length || 0}
          </span>
        </div>

        {/* 댓글 리스트 */}
        <div className="comments">
          {post.commentsArr?.map((c) => {
            // 댓글 작성자 확인 - 더 유연한 비교
            const isCommentAuthor = (() => {
              if (!currentUser) return false;
              
              // authorId로 비교 (우선)
              if (c.authorId != null) {
                const result = String(c.authorId) === String(currentUser.id);
                console.log("isCommentAuthor by ID:", { 
                  commentAuthorId: c.authorId, 
                  currentUserId: currentUser.id, 
                  result 
                });
                return result;
              }
              
              // authorId가 없으면 author 이름으로 비교
              const result = String(c.author) === String(currentUser.username);
              console.log("isCommentAuthor by name:", { 
                commentAuthor: c.author, 
                currentUsername: currentUser.username, 
                result 
              });
              return result;
            })();
            
            console.log("isCommentAuthor final check:", {
              commentId: c.id,
              commentAuthorId: c.authorId,
              commentAuthorIdType: typeof c.authorId,
              commentAuthor: c.author,
              currentUserId: currentUser?.id,
              currentUserIdType: typeof currentUser?.id,
              currentUsername: currentUser?.username,
              isCommentAuthor,
            });
            return (
              <div key={c.id} className="comment-item">
                <div className="comment-avatar" />
                <div className="comment-main">
                  <div className="comment-meta">
                    <span className="comment-author">
                      {c.author} {isCommentAuthor ? "(나)" : ""}
                    </span>
                    <span className="comment-when">{timeLabel(c.createdAt)}</span>

                    {isCommentAuthor && editingId !== c.id && (
                      <span className="comment-actions">
                        <button
                          className="c-action"
                          onClick={() => startEdit(c.id, c.text)}
                        >
                          수정
                        </button>
                        <button
                          className="c-action danger"
                          onClick={() => handleDeleteComment(c.id)}
                        >
                          삭제
                        </button>
                      </span>
                    )}
                  </div>

                  {/* 일반 모드 / 수정 모드 */}
                  {editingId === c.id ? (
                    <div className="comment-editing">
                      <textarea
                        className="comment-editbox"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={2}
                      />
                      <div className="comment-edit-actions">
                        <button className="c-btn primary" onClick={confirmEdit}>
                          확인
                        </button>
                        <button className="c-btn ghost" onClick={cancelEdit}>
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="comment-text">{c.text}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 댓글 입력줄 */}
        <div className="comment-input-row">
          <input
            className="comment-input"
            placeholder="댓글을 입력하세요..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addComment()}
          />
          <button className="comment-submit" onClick={addComment}>
            등록
          </button>
        </div>
      </main>

      {/* Footer */}
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
                  <img src={githubpic} alt="" className="github-icon" />
                  ouskxk
                </a>
              </div>
              <div className="col">
                <h3>Jiun Ko</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/suerte223" className="github-link">
                  <img src={githubpic} alt="" className="github-icon" />
                  suerte223
                </a>
              </div>
              <div className="col">
                <h3>Seungbeom Han</h3>
                <p>Front-End Dev</p>
                <a href="https://github.com/hsb9838" className="github-link">
                  <img src={githubpic} alt="" className="github-icon" />
                  hsb9838
                </a>
              </div>
              <div className="col">
                <h3>Munjin Yang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/munjun0608" className="github-link">
                  <img src={githubpic} alt="" className="github-icon" />
                  munjun0608
                </a>
              </div>
              <div className="col">
                <h3>Youngbin Kang</h3>
                <p>Back-End Dev</p>
                <a href="https://github.com/0bini" className="github-link">
                  <img src={githubpic} alt="" className="github-icon" />
                  0bini
                </a>
              </div>
            </div>
            <div className="tech-stack">
              <h3>TECH STACK</h3>
              <img src={reactpic} alt="React" className="react-icon" />
              <img src={djangopic} alt="Django" className="django-icon" />
            </div>
          </div>
        </div>
      </footer>

      {/* 삭제 확인 모달 */}
      {confirmOpen && (
        <div className="modal-backdrop" onClick={cancelDelete}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">정말 삭제하시겠습니까?</h3>
            <p className="modal-sub">이 기록은 복구할 수 없습니다.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cancelDelete}>
                취소
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
