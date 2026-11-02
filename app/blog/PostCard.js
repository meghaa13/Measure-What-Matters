import { fmtDate } from "./posts";

// One post card, used on /blog and in the home page strip.
export default function PostCard({ post, featured = false, loc }) {
  return (
    <a className={`bl-card${featured ? " bl-feature" : ""}`} href={`/blog/${post.slug}`} data-track="blog_click" data-loc={loc}>
      <span className="bl-cat">{post.category}</span>
      <h3 className="bl-title">{post.title}</h3>
      <p className="bl-desc">{post.description}</p>
      <span className="bl-meta">
        <time dateTime={post.publishedAt}>{fmtDate(post.publishedAt)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readMinutes} min read</span>
        <span className="bl-go" aria-hidden="true">Read →</span>
      </span>
    </a>
  );
}
