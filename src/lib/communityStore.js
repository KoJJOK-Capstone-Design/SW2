// src/lib/communityStore.js
const KEY = "community_posts";

export function loadPosts() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}
export function savePosts(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}
export function addPost(post) {
  const list = loadPosts();
  list.unshift(post);
  savePosts(list);
  return post.id;
}
export function getPost(id) {
  return loadPosts().find(p => String(p.id) === String(id)) || null;
}
export function updatePost(updated) {
  const list = loadPosts().map(p => (p.id === updated.id ? updated : p));
  savePosts(list);
}
export function deletePost(id) {
  const list = loadPosts().filter(p => String(p.id) !== String(id));
  savePosts(list);
}

/* 댓글 helpers: post.commentsArr = [{id, author, content, createdAt}] */
export function addComment(postId, comment) {
  const list = loadPosts();
  const idx = list.findIndex(p => String(p.id) === String(postId));
  if (idx < 0) return;
  const post = { ...list[idx] };
  post.commentsArr = post.commentsArr || [];
  post.commentsArr.push(comment);
  post.comments = post.commentsArr.length; // 카드용 집계
  list[idx] = post;
  savePosts(list);
}
export function updateComment(postId, comment) {
  const list = loadPosts();
  const idx = list.findIndex(p => String(p.id) === String(postId));
  if (idx < 0) return;
  const post = { ...list[idx] };
  post.commentsArr = (post.commentsArr || []).map(c => c.id === comment.id ? comment : c);
  post.comments = post.commentsArr.length;
  list[idx] = post;
  savePosts(list);
}
export function deleteComment(postId, commentId) {
  const list = loadPosts();
  const idx = list.findIndex(p => String(p.id) === String(postId));
  if (idx < 0) return;
  const post = { ...list[idx] };
  post.commentsArr = (post.commentsArr || []).filter(c => c.id !== commentId);
  post.comments = post.commentsArr.length;
  list[idx] = post;
  savePosts(list);
}
