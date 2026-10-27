import { useState } from 'react';
import PostsPage from './pages/PostsPage.jsx';
import PostDetailPage from './pages/PostDetailPage.jsx';

export default function App() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <div hidden={selectedId !== null}>
        <PostsPage onOpenPost={setSelectedId} />
      </div>
      {selectedId !== null && (
        <PostDetailPage postId={selectedId} onBack={() => setSelectedId(null)} />
      )}
    </>
  );
}