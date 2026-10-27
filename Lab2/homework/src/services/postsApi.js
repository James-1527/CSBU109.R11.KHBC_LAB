const BASE_URL = 'https://dummyjson.com';

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) throw new Error(`Yêu cầu thất bại (${res.status})`);
  return res.json();
}

const jsonPost = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const getPosts = (limit, skip) => request(`/posts?limit=${limit}&skip=${skip}`);
export const searchPosts = (q) => request(`/posts/search?q=${encodeURIComponent(q)}`);
export const getPost = (id) => request(`/posts/${id}`);
export const getComments = (id) => request(`/posts/${id}/comments`);
export const addPost = (post) => request('/posts/add', jsonPost(post));
export const deletePost = (id) => request(`/posts/${id}`, { method: 'DELETE' });