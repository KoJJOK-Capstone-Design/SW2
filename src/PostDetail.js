// src/PostDetail.js
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { NavLink, Link, useNavigate, useParams } from "react-router-dom";
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

// 알림 관련 헬퍼 함수들
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
  const savedCallback = useRef();
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
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
  const [isLiking, setIsLiking] = useState(false); // 좋아요 처리 중 상태

  // 댓글
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // 로그인 상태 및 사용자 정보
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userProfileImage, setUserProfileImage] = useState("https://i.pravatar.cc/80?img=11");
  const [showBellPopup, setShowBellPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  
  // 알림 관련 상태
  const [notifications, setNotifications] = useState([]);
  const [loadingNoti, setLoadingNoti] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const lastKnownNotiIds = useRef(new Set());
  const notiBtnRef = useRef(null);
  const notiRef = useRef(null);

  // 알림 읽음 처리 함수들
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

      const uniqueNotifications = mappedNotifications.reduce((acc, current) => {
        const isDuplicate = acc.some(
          (item) =>
            Math.abs(new Date(item.rawTime) - new Date(current.rawTime)) < 5000 &&
            ((item.user === current.user && item.text === current.text) ||
              ((current.user === "알 수 없는 사용자" ||
                current.text === "새 쪽지가 도착했습니다.") &&
                item.user !== "알 수 없는 사용자" &&
                current.text.includes(item.user)))
        );
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, []);

      uniqueNotifications.sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime));

      const newNotiIds = new Set(uniqueNotifications.map((n) => n.id));
      const newlyArrivedUnread = uniqueNotifications.some(
        (n) => !n.is_read && !lastKnownNotiIds.current.has(n.id)
      );

      if (newlyArrivedUnread) {
        setHasNewNotification(true);
      }

      lastKnownNotiIds.current = newNotiIds;
      setNotifications(uniqueNotifications);
    } catch (err) {
      console.error("알림 불러오기 실패:", err);
    } finally {
      setLoadingNoti(false);
    }
  }, []);

  // 초기 알림 로드
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingNoti(true);
    fetchNotifications();
  }, [fetchNotifications]);

  // 10초마다 알림 새로고침
  useInterval(() => {
    if (showBellPopup) return;
    fetchNotifications();
  }, 10000);

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // LocalStorage에서 저장된 프로필 이미지 URL을 먼저 확인
    const storedImageUrl = localStorage.getItem("user_profile_image_url");
    if (storedImageUrl) {
      setUserProfileImage(storedImageUrl);
    }
    
    if (token) {
      setIsLoggedIn(true);
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
          setUsername(user.nickname || user.username || user.id || "멍냥");
          
          // 프로필 이미지 우선순위: localStorage > API 응답 > 기본 이미지
          const apiImageUrl = user?.profile_image || user?.avatar || user?.user_profile_image_url;
          const finalImageUrl = storedImageUrl || 
            (apiImageUrl 
              ? (apiImageUrl.startsWith("http")
                  ? apiImageUrl
                  : `https://youngbin.pythonanywhere.com${apiImageUrl}`)
              : null);
          
          if (finalImageUrl) {
            setUserProfileImage(finalImageUrl);
            if (!storedImageUrl && finalImageUrl) {
              localStorage.setItem("user_profile_image_url", finalImageUrl);
            }
          }
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

  // 좋아요 상태 확인 여부 추적 (게시글 ID별로)
  const hasCheckedLikeStatus = useRef(false);
  const lastPostId = useRef(null);
  
  // 좋아요 상태 확인 함수
  const checkLikeStatus = useCallback((postData, user) => {
    if (!user || !postData) {
      setLiked(false);
      return;
    }
    
    console.log("좋아요 상태 확인:", {
      postDataLikes: postData.likes,
      postDataLikedBy: postData.likedBy,
      currentUserId: user.id,
      currentUsername: user.username,
      postDataKeys: Object.keys(postData)
    });
    
    // likes 배열이나 likedBy 배열에서 사용자 확인
    const likesArray = postData.likes || postData.likedBy || [];
    
    console.log("좋아요 배열 확인:", {
      likesArray: likesArray,
      likesArrayLength: likesArray.length,
      isArray: Array.isArray(likesArray),
      firstItem: likesArray[0]
    });
    
    if (Array.isArray(likesArray) && likesArray.length > 0) {
      const userLiked = likesArray.some((u) => {
        const userId = typeof u === "object" ? (u.id || u.pk || u.user_id || u.user) : u;
        const result = String(userId) === String(user.id);
        console.log("좋아요 확인:", { 
          userId, 
          currentUserId: user.id, 
          result,
          userObj: typeof u === "object" ? u : null
        });
        return result;
      });
      console.log("✅ 최종 좋아요 상태:", userLiked);
      setLiked(userLiked);
    } else {
      console.log("⚠️ 좋아요 배열이 비어있거나 없음, false로 설정");
      setLiked(false);
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
        if (!authorId) {
          authorId = postData.author_id || postData.authorId || postData.user_id || postData.user || null;
        }
        
        console.log("게시글 작성자 정보 추출:", {
          authorId: authorId,
          authorName: authorName,
          postDataAuthor: postData.author,
          postDataAuthorId: postData.author_id,
          postDataKeys: Object.keys(postData)
        });
        
        const normalized = {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          author: authorName,
          authorId: authorId,
          createdAt: postData.created_at,
          updatedAt: postData.updated_at,
          likes: postData.like_count !== undefined ? postData.like_count : 
                 (postData.likes_count !== undefined ? postData.likes_count :
                 (Array.isArray(postData.likes) ? postData.likes.length : 0)),
          likedBy: Array.isArray(postData.likes) ? postData.likes : 
                   (Array.isArray(postData.liked_by) ? postData.liked_by : 
                   (Array.isArray(postData.likedBy) ? postData.likedBy : [])),
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
          likes: normalized.likes,
          likedBy: normalized.likedBy,
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
        
        // 게시글 ID가 바뀌면 상태 확인 리셋
        if (lastPostId.current !== normalized.id) {
          hasCheckedLikeStatus.current = false;
          lastPostId.current = normalized.id;
        }
        
        // 게시글 로드 시 좋아요 상태 확인 (게시글이 바뀌었거나 아직 확인하지 않았을 때)
        if (!hasCheckedLikeStatus.current && currentUser) {
          console.log("게시글 로드 시 좋아요 상태 확인:", {
            postId: normalized.id,
            postDataLikes: postData.likes,
            normalizedLikedBy: normalized.likedBy,
            currentUserId: currentUser.id,
            postDataKeys: Object.keys(postData)
          });
          // normalized 객체의 likedBy를 사용하여 좋아요 상태 확인
          // 여러 필드에서 좋아요 정보 확인
          const likesForCheck = normalized.likedBy && normalized.likedBy.length > 0 
            ? normalized.likedBy 
            : (Array.isArray(postData.likes) ? postData.likes : 
               (Array.isArray(postData.liked_by) ? postData.liked_by : 
                (Array.isArray(postData.likedBy) ? postData.likedBy : [])));
          
          console.log("게시글 로드 시 좋아요 배열 확인:", {
            normalizedLikedBy: normalized.likedBy,
            normalizedLikedByLength: normalized.likedBy?.length,
            postDataLikes: postData.likes,
            postDataLikesLength: postData.likes?.length,
            postDataLikedBy: postData.liked_by,
            likesForCheck: likesForCheck,
            likesForCheckLength: likesForCheck.length,
            currentUserId: currentUser.id
          });
          
          checkLikeStatus({ 
            likes: likesForCheck,
            likedBy: likesForCheck
          }, currentUser);
          hasCheckedLikeStatus.current = true;
        } else if (!currentUser) {
          // currentUser가 없으면 나중에 확인하도록 리셋
          hasCheckedLikeStatus.current = false;
        }
      } catch (error) {
        console.error("게시글 로딩 실패:", error);
        nav("/community");
      }
    };

    loadPost();
  }, [id, nav, currentUser, checkLikeStatus]);

  // 게시글 ID가 바뀌면 상태 확인 리셋
  useEffect(() => {
    if (id && lastPostId.current !== id) {
      console.log("게시글 ID 변경 감지:", { oldId: lastPostId.current, newId: id });
      hasCheckedLikeStatus.current = false;
      lastPostId.current = id;
    }
  }, [id]);

  // currentUser가 로드되면 좋아요 상태 확인 (단, 좋아요 토글 중이 아닐 때만)
  useEffect(() => {
    // 게시글 ID가 바뀌면 상태 확인 리셋
    if (post?.id && lastPostId.current !== post.id) {
      console.log("게시글 ID 변경 감지 (useEffect):", { oldId: lastPostId.current, newId: post.id });
      hasCheckedLikeStatus.current = false;
      lastPostId.current = post.id;
    }
    
    if (post && currentUser && !isLiking && !hasCheckedLikeStatus.current) {
      // 게시글에서 좋아요 정보 다시 확인
      console.log("currentUser 로드 후 좋아요 상태 재확인:", {
        postId: post.id,
        likedBy: post.likedBy,
        likedByLength: post.likedBy?.length,
        currentUserId: currentUser.id,
        isLiking: isLiking
      });
      // post 객체의 likedBy 배열을 사용하여 좋아요 상태 확인
      checkLikeStatus({ 
        likes: post.likedBy || [],
        likedBy: post.likedBy || []
      }, currentUser);
      hasCheckedLikeStatus.current = true;
    }
  }, [currentUser?.id, post?.id, checkLikeStatus, isLiking]); // 게시글이나 사용자가 바뀔 때만 재확인

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
    if (!post) {
      console.log("isAuthor check: post가 없음");
      return false;
    }
    
    if (!currentUser) {
      console.log("isAuthor check: currentUser가 없음", { hasPost: !!post });
      return false;
    }
    
    console.log("isAuthor 계산 시작:", {
      postAuthorId: post.authorId,
      postAuthor: post.author,
      currentUserId: currentUser.id,
      currentUsername: currentUser.username,
      post: post,
      currentUser: currentUser
    });
    
    // authorId가 있으면 그것을 사용 (타입 변환 포함)
    if (post.authorId != null && post.authorId !== undefined) {
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
    if (post.author && currentUser.username) {
      const result = String(post.author).trim() === String(currentUser.username).trim();
      console.log("isAuthor by name:", { 
        postAuthor: post.author, 
        currentUsername: currentUser.username, 
        result 
      });
      return result;
    }
    
    console.log("isAuthor: 모든 조건 실패", {
      hasAuthorId: post.authorId != null,
      hasAuthor: !!post.author,
      hasCurrentUserId: !!currentUser.id,
      hasCurrentUsername: !!currentUser.username
    });
    return false;
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
    // 중복 클릭 방지
    if (isLiking) {
      console.log("좋아요 처리 중입니다...");
      return;
    }
    
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }
    
    // 현재 상태 저장 (원복용)
    const prevLiked = liked;
    const prevLikeCount = post.likes;
    
    // 낙관적 업데이트 (즉시 UI 업데이트)
    const newLiked = !liked;
    const newLikeCount = liked ? Math.max(0, post.likes - 1) : post.likes + 1;
    
    setIsLiking(true); // 처리 시작
    
    // 즉시 UI 업데이트 (낙관적 업데이트)
    console.log("좋아요 토글 시작:", { 
      prevLiked, 
      newLiked, 
      prevLikeCount, 
      newLikeCount 
    });
    
    // 상태 업데이트를 명시적으로 수행
    setLiked(newLiked);
    setPost({
      ...post,
      likes: newLikeCount,
    });
    
    try {
      const result = await toggleLike(post.id);
      console.log("좋아요 토글 API 응답:", result); // 디버깅용
      
      // 좋아요 토글 후 게시글 정보 다시 가져오기 (최신 좋아요 개수 확인)
      try {
        const updatedPostData = await getPostApi(post.id);
        console.log("좋아요 토글 후 게시글 정보:", updatedPostData); // 디버깅용
        
        // 기존 게시글 로드 로직과 동일하게 작성자 정보 추출 (authorId 유지를 위해)
        let authorId = post.authorId; // 기존 authorId 유지
        let authorName = post.author; // 기존 author 유지
        
        if (updatedPostData?.author !== undefined) {
          if (typeof updatedPostData.author === "object" && updatedPostData.author !== null) {
            authorId = updatedPostData.author.id || updatedPostData.author.pk || updatedPostData.author.user_id || authorId;
            authorName = updatedPostData.author.username || updatedPostData.author.nickname || updatedPostData.author.name || authorName;
          } else if (typeof updatedPostData.author === "number") {
            authorId = updatedPostData.author;
          } else if (typeof updatedPostData.author === "string") {
            authorName = updatedPostData.author;
          }
        }
        
        if (updatedPostData?.author_id !== undefined) {
          authorId = updatedPostData.author_id;
        }
        
        // 기존 게시글 로드 로직과 동일하게 좋아요 개수 계산
        const serverLikeCount = updatedPostData?.like_count !== undefined 
          ? updatedPostData.like_count 
          : (Array.isArray(updatedPostData?.likes) ? updatedPostData.likes.length : newLikeCount);
        
        console.log("서버 좋아요 개수:", serverLikeCount, "클라이언트 예상:", newLikeCount); // 디버깅용
        
        // 서버에서 가져온 실제 값으로 업데이트 (authorId와 author 유지)
        const updatedPost = {
          ...post,
          authorId: authorId,
          author: authorName,
          likes: serverLikeCount,
          likedBy: Array.isArray(updatedPostData?.likes) ? updatedPostData.likes : [],
        };
        
        setPost(updatedPost);
        
        // 좋아요 상태 확인 - 서버 응답에서 직접 확인
        // 서버에서 좋아요 정보를 가져와서 현재 사용자가 좋아요를 눌렀는지 확인
        let serverLiked = newLiked; // 기본값은 낙관적 업데이트 값 (토글한 값)
        
        if (currentUser) {
          // 여러 필드에서 좋아요 정보 확인
          const likesArray = updatedPostData?.likes || updatedPostData?.liked_by || [];
          
          if (Array.isArray(likesArray) && likesArray.length > 0) {
            const foundLiked = likesArray.some((u) => {
              const userId = typeof u === "object" ? (u.id || u.pk || u.user_id || u.user) : u;
              const result = String(userId) === String(currentUser.id);
              console.log("좋아요 사용자 확인:", { 
                userId, 
                currentUserId: currentUser.id, 
                result,
                userObj: typeof u === "object" ? u : null,
                likesArrayLength: likesArray.length
              });
              return result;
            });
            // 서버에서 확인한 값 사용
            serverLiked = foundLiked;
            console.log("서버에서 좋아요 상태 확인:", { serverLiked, newLiked });
          } else {
            // likes 배열이 없거나 비어있으면 낙관적 업데이트 값 유지
            console.log("서버 응답에 likes 배열이 없거나 비어있음, 낙관적 업데이트 값 유지:", newLiked);
            serverLiked = newLiked;
          }
        } else {
          // currentUser가 없으면 낙관적 업데이트 값 유지
          console.log("currentUser가 없음, 낙관적 업데이트 값 유지:", newLiked);
          serverLiked = newLiked;
        }
        
        console.log("✅ 좋아요 상태 최종 설정:", {
          serverLiked,
          newLiked,
          prevLiked,
          likesArray: updatedPostData?.likes,
          currentUserId: currentUser?.id
        });
        
        // 서버에서 확인한 좋아요 상태로 업데이트 (명시적으로 설정)
        setLiked(serverLiked);
        
        console.log("게시글 업데이트 완료:", {
          authorId: updatedPost.authorId,
          author: updatedPost.author,
          likes: updatedPost.likes,
          likedBy: updatedPost.likedBy,
          liked: serverLiked
        });
      } catch (refreshError) {
        console.error("게시글 정보 새로고침 실패:", refreshError);
        // 새로고침 실패 시 낙관적 업데이트 유지 (이미 설정된 상태 유지)
        console.log("새로고침 실패, 낙관적 업데이트 상태 유지:", newLiked);
      }
      
      // 커뮤니티 목록 갱신을 위한 플래그 설정
      localStorage.setItem("community_refresh_needed", "true");
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
      // 실패 시 원래 상태로 되돌리기
      setLiked(prevLiked);
      setPost({
        ...post,
        likes: prevLikeCount,
      });
      alert("좋아요 처리에 실패했습니다.");
    } finally {
      // 처리 완료 후 상태 확인이 다시 호출되지 않도록 약간의 지연 추가
      setTimeout(() => {
        setIsLiking(false); // 처리 완료
      }, 100);
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
      // 커뮤니티 목록 갱신을 위한 플래그 설정
      localStorage.setItem("community_refresh_needed", "true");
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
      // 커뮤니티 목록 갱신을 위한 플래그 설정
      localStorage.setItem("community_refresh_needed", "true");
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
              <Link to="/mypage" className="profile">
                <div className="profile__avatar">
                  <img
                    src={userProfileImage}
                    alt="프로필"
                  />
                </div>
                <span className="profile__name">{currentUser.username}</span>
              </Link>

              {/* 알림 벨 */}
              <div className="icon-wrapper bell">
                <button
                  ref={notiBtnRef}
                  className="icon-btn bell__btn"
                  onClick={() => {
                    setShowBellPopup((v) => !v);
                    setShowChatPopup(false);
                  }}
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
          <button 
            className="stat-item stat-like" 
            onClick={handleToggleLike}
            disabled={isLiking}
            style={{ opacity: isLiking ? 0.6 : 1, cursor: isLiking ? "not-allowed" : "pointer" }}
          >
            <img
              key={`heart-${liked ? 'liked' : 'not-liked'}-${post.id}-${post.likes}`}
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
