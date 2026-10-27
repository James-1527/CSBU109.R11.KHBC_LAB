import { useEffect, useState } from 'react';
import { getPost, getComments } from '../services/postsApi.js';

export default function PostDetailPage({ postId, onBack }) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState({ likes: 0, dislikes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    Promise.all([getPost(postId), getComments(postId)])
      .then(([p, c]) => {
        if (!ignore) {
          setPost(p);
          setComments(c.comments);
          // shortcut: Like just save in page, not save in server.
          setReactions(
            typeof p.reactions === 'object'
              ? p.reactions
              : { likes: p.reactions ?? 0, dislikes: 0 }
          );
        }
      })
      .catch((err) => { if (!ignore) setError(err.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [postId]);

  function react(kind) {
    setReactions((r) => ({ ...r, [kind]: (r[kind] ?? 0) + 1 }));
  }

  return (
    <main>
      <button onClick={onBack}>← Back</button>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {post && (
        <article>
          <h1>{post.title}</h1>
          <p>{post.body}</p>
          <div>
            {(post.tags ?? []).map((tag) => (
              <span key={tag}>#{tag} </span>
            ))}
          </div>
          <p>👍 {reactions.likes ?? 0} · 👎 {reactions.dislikes ?? 0}</p>
          <button onClick={() => react('likes')}>Like</button>
          <button onClick={() => react('dislikes')}>Dislike</button>
          <h2>Comments ({comments.length})</h2>
          {comments.length === 0 && <p>No comments.</p>}
          <ul>
            {comments.map((c) => (
              <li key={c.id}>
                <strong>{c.user.username}</strong>: {c.body}
              </li>
            ))}
          </ul>
        </article>
      )}
    </main>
  );
}