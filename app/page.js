import Header from "@/components/Header";
import Feed from "@/components/Feed";

const QUICK_LINKS = [
  "popular",
  "all",
  "funny",
  "AskReddit",
  "todayilearned",
  "pics",
  "worldnews",
  "technology",
  "gaming",
  "aww",
];

export default function HomePage() {
  return (
    <>
      <Header />
      <div className="container">
        <div className="quick-links">
          {QUICK_LINKS.map((name) => (
            <a key={name} className="quick-link" href={`/r/${name}`}>
              r/{name}
            </a>
          ))}
        </div>
      </div>
      <Feed subreddit="popular" title="r/popular" />
    </>
  );
}
