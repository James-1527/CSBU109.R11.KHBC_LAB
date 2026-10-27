export default function PostCard({ post, onOpen, onDelete }) {
  return (
    <article>
      <h3>{post.title}</h3>
      <div>
        {(post.tags ?? []).map((tag) => (
          <span key={tag}>#{tag} </span>
        ))}
      </div>
      <button onClick={onOpen}>View</button>
      <button onClick={onDelete}>Delete</button>
    </article>
  );
}