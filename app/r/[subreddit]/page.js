import Header from "@/components/Header";
import Feed from "@/components/Feed";

export async function generateMetadata({ params }) {
  const { subreddit } = await params;
  return { title: `r/${subreddit} - scroller` };
}

export default async function SubredditPage({ params }) {
  const { subreddit } = await params;
  return (
    <>
      <Header />
      <Feed subreddit={subreddit} title={`r/${subreddit}`} />
    </>
  );
}
