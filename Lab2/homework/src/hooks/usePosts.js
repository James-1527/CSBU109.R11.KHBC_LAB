import { useEffect, useState } from 'react';
import * as api from '../services/postsApi.js';

export const PAGE_SIZE = 10;

export function usePosts(query, page) {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    const request = query
      ? api.searchPosts(query)
      : api.getPosts(PAGE_SIZE, page * PAGE_SIZE);
    request
      .then((data) => {
        if (!ignore) {
          setPosts(data.posts);
          setTotal(data.total);
        }
      })
      .catch((err) => { if (!ignore) setError(err.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [query, page]);

  async function addPost(input) {
    const created = await api.addPost(input);
    setPosts((prev) => [created, ...prev]);
    setTotal((t) => t + 1);
    return created;
  }

  async function removePost(id) {
    const result = await api.deletePost(id);
    if (result.isDeleted) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
    }
    return result;
  }

  function react(id, kind) {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const r = typeof p.reactions === 'object'
          ? p.reactions
          : { likes: p.reactions ?? 0, dislikes: 0 };
        return { ...p, reactions: { ...r, [kind]: (r[kind] ?? 0) + 1 } };
      })
    );
  }

  return { posts, total, loading, error, addPost, removePost };
}