import SiteChrome from "../SiteChrome";
import PostCard from "./PostCard";
import BlogSlideshow from "./BlogSlideshow";
import BlogMotion from "./BlogMotion";
import { posts, fmtDate } from "./posts";
import { pageMeta } from "../lib/seo";
import "./blog-index.css";

export const metadata = pageMeta({
  title: "Blog | Megha Karnwal",
  description: "Notes on analytics, measurement and AI for marketing teams. Every claim links to a dated source.",
  path: "/blog",
});

export default function BlogIndex() {
  const slides = posts.slice(0, 4).map((p) => ({
    slug: p.slug, category: p.category, title: p.title, description: p.description,
    publishedAt: p.publishedAt, date: fmtDate(p.publishedAt), readMinutes: p.readMinutes, image: p.shareImage,
  }));
  return (
    <>
      <SiteChrome home={false} current="blog" />
      <BlogMotion />
      <main className="wrap bl-page">
        <header className="bl-head">
          <span className="bl-cat">Blog</span>
          <h1>Notes from <em>the data</em>.</h1>
          <p>Analytics, measurement and AI for marketing teams. Every claim links to a dated source, and anything I could not verify is marked as unknown.</p>
        </header>
        <BlogSlideshow slides={slides} />
        <h2 className="bl-all-h">All posts</h2>
        <div className="bl-grid bl-grid-img">
          {posts.map((p) => <PostCard key={p.slug} post={p} loc="blog_index" image />)}
        </div>
      </main>
    </>
  );
}
