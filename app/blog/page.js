import SiteChrome from "../SiteChrome";
import PostCard from "./PostCard";
import { posts } from "./posts";
import "./blog-index.css";

export const metadata = {
  title: "Blog | Megha Karnwal",
  description: "Notes on analytics, measurement and AI for marketing teams. Every claim links to a dated source.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const [latest, ...rest] = posts;
  return (
    <>
      <SiteChrome home={false} current="blog" />
      <main className="wrap bl-page">
        <header className="bl-head">
          <span className="bl-cat">Blog</span>
          <h1>Notes from <em>the data</em>.</h1>
          <p>Analytics, measurement and AI for marketing teams. Every claim links to a dated source, and anything I could not verify is marked as unknown.</p>
        </header>
        {latest && <PostCard post={latest} featured loc="blog_index" />}
        {rest.length > 0 && (
          <div className="bl-grid">
            {rest.map((p) => <PostCard key={p.slug} post={p} loc="blog_index" />)}
          </div>
        )}
      </main>
    </>
  );
}
