import { useState } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';
import { usePosts, PAGE_SIZE } from '../hooks/usePosts.js';
import PostCard from '../components/PostCard.jsx';
import PostForm from '../components/PostForm.jsx';

export default function PostsPage({ onOpenPost }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [actionError, setActionError] = useState(null);
  const query = useDebounce(search.trim(), 400);
  const { posts, total, loading, error, addPost, removePost } = usePosts(query, page);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setPage(0);
  }

  async function handleDelete(post) {
    if (!window.confirm(`Delete page "${post.title}"?`)) return;
    setActionError(null);
    try {
      await removePost(post.id);
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <main>
      <h1>Mini Blog Manager</h1>

      <PostForm onSubmit={addPost} />

      <input
        placeholder="Search…"
        value={search}
        onChange={handleSearchChange}
      />

      {actionError && <p style={{ color: 'red' }}>{actionError}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading…</p>}
      {!loading && !error && posts.length === 0 && <p>No posts.</p>}

      <ul>
        {posts.map((post) => (
          <li key={post.id}>
              <PostCard
              post={post}
              onOpen={() => onOpenPost(post.id)}
              onDelete={() => handleDelete(post)}
              onReact={(kind) => react(post.id, kind)}
            />
          </li>
        ))}
      </ul>

      {!query && (
        <div>
          <button disabled={loading || page === 0} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <span> Page {page + 1} / {totalPages} </span>
          <button
            disabled={loading || (page + 1) * PAGE_SIZE >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}