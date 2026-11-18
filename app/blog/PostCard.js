import { fmtDate } from "./posts";

// One post card, used on /blog and in the home page strip.
// Pass `image` to show a thumbnail on top (the /blog grid does; the home strip stays text-only).
export default function PostCard({ post, featured = false, loc, image = false }) {
  const body = (
    <>
      <span className="bl-cat">{post.category}</span>
      <h3 className="bl-title">{post.title}</h3>
      <p className="bl-desc">{post.description}</p>
      <span className="bl-meta">
        <time dateTime={post.publishedAt}>{fmtDate(post.publishedAt)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readMinutes} min read</span>
        <span className="bl-go" aria-hidden="true">Read →</span>
      </span>
    </>
  );
  return (
    <a className={`bl-card${featured ? " bl-feature" : ""}${image ? " bl-card-img" : ""}`} href={`/blog/${post.slug}`} data-track="blog_click" data-loc={loc} {...(image ? { "data-reveal": "" } : {})}>
      {image ? (
        <>
          <span className="bl-thumb"><img src={post.shareImage} alt="" width="1200" height="630" loading="lazy" /></span>
          <span className="bl-body">{body}</span>
        </>
      ) : body}
    </a>
  );
}
