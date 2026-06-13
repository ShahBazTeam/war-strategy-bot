import React, { useState, useEffect, useRef, useCallback } from "react";
import { User, Tweet } from "../types";
import {
  MessageSquare,
  Heart,
  Send,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Globe,
  Trophy,
  CheckCircle,
  Zap,
  TrendingUp,
  Hash,
  Filter,
  Quote,
  X,
  ChevronDown,
  Newspaper,
  Shield,
  UserIcon,
  Clock,
  Loader2,
} from "lucide-react";

interface TwitterFeedProps {
  currentUser: User;
}

interface TrendingData {
  countries: { name: string; count: number }[];
  keywords: { word: string; count: number }[];
}

type FilterTab = "all" | "news" | "warroom" | "mine";

function relativeTime(ts: string): string {
  const now = Date.now();
  const then = new Date(ts).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function getTweetBorderClass(tweet: Tweet): string {
  if (tweet.userId === "warroom_system" || tweet.userId === "news_system") {
    if (tweet.userId === "warroom_system") return "border-l-red-500";
    return "border-l-blue-500";
  }
  return "border-l-white/20";
}

function getTweetTypeLabel(tweet: Tweet): { label: string; color: string } {
  if (tweet.userId === "warroom_system")
    return { label: "War Room", color: "text-red-400 bg-red-500/10 border-red-500/20" };
  if (tweet.userId === "news_system")
    return { label: "News", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
  return { label: "User", color: "text-slate-400 bg-white/5 border-white/10" };
}

function isSystemOrAi(tweet: Tweet): boolean {
  return (
    tweet.isAiGenerated === true ||
    tweet.userId === "news_system" ||
    tweet.userId === "warroom_system"
  );
}

export default function TwitterFeed({ currentUser }: TwitterFeedProps) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [newTweetText, setNewTweetText] = useState("");
  const [activeCommentTweetId, setActiveCommentTweetId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [trending, setTrending] = useState<TrendingData | null>(null);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [generatingNews, setGeneratingNews] = useState(false);
  const [quoteTweetId, setQuoteTweetId] = useState<string | null>(null);
  const [quoteText, setQuoteText] = useState("");
  const tickerRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const fetchTweets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tweets", {
        headers: { "x-user-id": currentUser.id },
      });
      const data = await res.json();
      if (data.tweets) {
        setTweets(data.tweets);
      }
    } catch (err) {
      console.error("Failed to fetch tweets:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  const fetchTrending = useCallback(async () => {
    setTrendingLoading(true);
    try {
      const res = await fetch("/api/tweets/trending", {
        headers: { "x-user-id": currentUser.id },
      });
      const data = await res.json();
      setTrending(data);
    } catch (err) {
      console.error("Failed to fetch trending:", err);
    } finally {
      setTrendingLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchTweets();
    fetchTrending();
    const interval = setInterval(fetchTweets, 10000);
    const trendInterval = setInterval(fetchTrending, 30000);
    return () => {
      clearInterval(interval);
      clearInterval(trendInterval);
    };
  }, [fetchTweets, fetchTrending]);

  useEffect(() => {
    if (activeCommentTweetId && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [activeCommentTweetId]);

  const handlePostTweet = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = quoteTweetId
      ? `${quoteText}\n\n--- Quoted tweet ---`
      : newTweetText;
    if (text.trim().length < 5) {
      alert("Tweet must be at least 5 characters");
      return;
    }
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/tweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewTweetText("");
        setQuoteTweetId(null);
        setQuoteText("");
        fetchTweets();
      } else {
        setError(data.error || "Failed to post tweet");
      }
    } catch {
      setError("Connection error");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (tweetId: string) => {
    try {
      const res = await fetch(`/api/tweets/${tweetId}/like`, {
        method: "POST",
        headers: { "x-user-id": currentUser.id },
      });
      if (res.ok) {
        setTweets((prev) =>
          prev.map((t) => {
            if (t.id === tweetId) {
              const hasLiked = t.likes.includes(currentUser.id);
              const nextLikes = hasLiked
                ? t.likes.filter((id) => id !== currentUser.id)
                : [...t.likes, currentUser.id];
              return { ...t, likes: nextLikes };
            }
            return t;
          })
        );
      }
    } catch (err) {
      console.error("Failed to like tweet:", err);
    }
  };

  const handlePostComment = async (tweetId: string) => {
    if (commentText.trim().length < 2) return;
    try {
      const res = await fetch(`/api/tweets/${tweetId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({ text: commentText }),
      });
      if (res.ok) {
        setCommentText("");
        setActiveCommentTweetId(null);
        fetchTweets();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to post comment");
      }
    } catch (err) {
      console.error("Failed to comment:", err);
    }
  };

  const handleGenerateNews = async () => {
    setGeneratingNews(true);
    try {
      const res = await fetch("/api/tweets/generate-news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
      });
      if (res.ok) {
        fetchTweets();
        fetchTrending();
      }
    } catch (err) {
      console.error("Failed to generate news:", err);
    } finally {
      setGeneratingNews(false);
    }
  };

  const filteredTweets = tweets.filter((t) => {
    if (activeFilter === "news") return t.userId === "news_system";
    if (activeFilter === "warroom") return t.userId === "warroom_system";
    if (activeFilter === "mine") return t.userId === currentUser.id;
    return true;
  });

  const newsTickerTweets = tweets
    .filter((t) => t.isAiGenerated || t.userId === "news_system")
    .slice(0, 10);

  const quotedTweet = quoteTweetId ? tweets.find((t) => t.id === quoteTweetId) : null;

  const filterTabs: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "All", icon: <Globe className="h-3 w-3" /> },
    { key: "news", label: "News", icon: <Newspaper className="h-3 w-3" /> },
    { key: "warroom", label: "War Room", icon: <Shield className="h-3 w-3" /> },
    { key: "mine", label: "My Tweets", icon: <UserIcon className="h-3 w-3" /> },
  ];

  return (
    <div className="space-y-4" id="twitter-feed-view">
      {/* ── News Ticker ── */}
      {newsTickerTweets.length > 0 && (
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-blue-900/30 via-black/60 to-red-900/30 backdrop-blur-md">
          <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-r from-black/80 via-black/60 to-transparent px-3">
            <Zap className="h-4 w-4 text-yellow-400 animate-pulse" />
            <span className="ml-1.5 text-[10px] font-black uppercase tracking-widest text-yellow-400 whitespace-nowrap">
              Breaking
            </span>
          </div>
          <div
            ref={tickerRef}
            className="flex gap-12 animate-marquee whitespace-nowrap py-2.5 pl-28 pr-4"
          >
            {[...newsTickerTweets, ...newsTickerTweets].map((t, i) => (
              <span key={`${t.id}-${i}`} className="inline-flex items-center gap-2 text-xs text-slate-300">
                <span className="text-sm">{t.flagUrl || "🌐"}</span>
                <span className="text-slate-500">•</span>
                <span className="font-semibold text-white/80">{t.countryName}</span>
                <span className="max-w-[300px] truncate text-slate-400">{t.text}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Title Banner ── */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-sky-950/40 via-black/60 to-sky-950/40 backdrop-blur-md p-5">
        <div className="absolute -right-8 -top-8 h-40 w-40 bg-sky-500/5 rounded-full blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 backdrop-blur-sm">
            <Globe className="h-5 w-5 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              Geopolitical Intelligence Feed
              <span className="text-[9px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded px-1.5 py-0.5">
                LIVE
              </span>
            </h2>
            <p className="text-slate-500 text-[11px] mt-1 leading-relaxed truncate">
              AI-powered diplomatic intelligence. War updates, peace negotiations, and automated analyst responses.
            </p>
          </div>
          <button
            onClick={handleGenerateNews}
            disabled={generatingNews}
            className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {generatingNews ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate News
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ═══ Main Feed Column ═══ */}
        <div className="md:col-span-2 space-y-3">
          {/* ── Tweet Composer ── */}
          <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4 space-y-3">
            {quoteTweetId && quotedTweet && (
              <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 relative">
                <button
                  onClick={() => {
                    setQuoteTweetId(null);
                    setQuoteText("");
                  }}
                  className="absolute top-2 right-2 text-slate-500 hover:text-white transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm">{quotedTweet.flagUrl}</span>
                  <span className="text-[10px] font-bold text-slate-300">{quotedTweet.countryName}</span>
                  <span className="text-[8px] text-slate-600">@{quotedTweet.username}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{quotedTweet.text}</p>
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-lg">
                {currentUser.country.flagUrl || "🏳️"}
              </div>
              <form onSubmit={handlePostTweet} className="flex-1 space-y-2.5">
                <textarea
                  value={quoteTweetId ? quoteText : newTweetText}
                  onChange={(e) =>
                    quoteTweetId ? setQuoteText(e.target.value) : setNewTweetText(e.target.value)
                  }
                  placeholder={
                    quoteTweetId
                      ? "Add your commentary..."
                      : "What's happening in geopolitics?"
                  }
                  rows={quoteTweetId ? 2 : 3}
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 leading-relaxed resize-none transition-all"
                />
                {error && (
                  <div className="text-[11px] text-red-400 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-600 font-mono">
                    {(quoteTweetId ? quoteText : newTweetText).length} chars
                  </span>
                  <button
                    type="submit"
                    disabled={posting}
                    className="px-4 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500/30 hover:bg-sky-500/30 text-sky-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {posting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    <span>Post</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Filter Tabs ── */}
          <div className="flex gap-1 p-1 rounded-lg bg-black/30 border border-white/5 backdrop-blur-sm">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeFilter === tab.key
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Feed ── */}
          {loading && tweets.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-sky-400" />
              <span className="text-xs text-slate-500">Loading intelligence feed...</span>
            </div>
          ) : filteredTweets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/20 py-16 text-center">
              <Filter className="h-6 w-6 mx-auto mb-2 text-slate-600" />
              <p className="text-xs text-slate-500">No tweets match this filter</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTweets.map((tweet) => {
                const isLikedByMe = tweet.likes.includes(currentUser.id);
                const typeInfo = getTweetTypeLabel(tweet);
                const borderClass = getTweetBorderClass(tweet);
                const verified = isSystemOrAi(tweet);

                return (
                  <div
                    key={tweet.id}
                    className={`rounded-xl border border-l-[3px] ${borderClass} border-white/10 bg-black/40 backdrop-blur-md p-4 space-y-3 transition-all hover:bg-black/50 hover:border-white/15 group`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg overflow-hidden">
                          {tweet.flagUrl || "🌐"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[13px] text-white truncate">
                              {tweet.countryName}
                            </span>
                            {verified && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-sky-500/10 border border-sky-500/20 px-1 py-px">
                                <CheckCircle className="h-2.5 w-2.5 text-sky-400" />
                                <span className="text-[8px] font-bold text-sky-400 uppercase">AI</span>
                              </span>
                            )}
                            <span className={`inline-flex items-center rounded border px-1.5 py-px text-[8px] font-bold uppercase ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-600 font-mono">@{tweet.username}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {relativeTime(tweet.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-[13px] text-slate-200 leading-relaxed pl-[46px]">{tweet.text}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-1 pl-[46px]">
                      <button
                        onClick={() => handleLike(tweet.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
                          isLikedByMe
                            ? "text-rose-400 bg-rose-500/10"
                            : "text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        }`}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${isLikedByMe ? "fill-rose-500" : ""}`}
                        />
                        <span className="font-medium">{tweet.likes.length}</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveCommentTweetId(
                            activeCommentTweetId === tweet.id ? null : tweet.id
                          );
                          setCommentText("");
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
                          activeCommentTweetId === tweet.id
                            ? "text-sky-400 bg-sky-500/10"
                            : "text-slate-500 hover:text-sky-400 hover:bg-sky-500/10"
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="font-medium">{tweet.comments.length}</span>
                      </button>

                      <button
                        onClick={() => {
                          setQuoteTweetId(tweet.id);
                          setQuoteText("");
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all cursor-pointer"
                      >
                        <Quote className="h-3.5 w-3.5" />
                        <span className="font-medium">Quote</span>
                      </button>
                    </div>

                    {/* Comment Input */}
                    {activeCommentTweetId === tweet.id && (
                      <div className="pl-[46px] space-y-2">
                        <div className="flex gap-2">
                          <input
                            ref={commentInputRef}
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handlePostComment(tweet.id);
                            }}
                            placeholder="Write a reply..."
                            className="flex-1 bg-white/5 border border-white/10 p-2 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all"
                          />
                          <button
                            onClick={() => handlePostComment(tweet.id)}
                            className="bg-sky-500/20 border border-sky-500/30 hover:bg-sky-500/30 text-sky-400 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Comments List */}
                    {tweet.comments.length > 0 && (
                      <div className="pl-[46px] space-y-1.5 border-t border-white/5 pt-2.5 mt-1 max-h-44 overflow-y-auto scrollbar-thin">
                        {tweet.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-white/5 rounded-lg p-2.5 border border-white/5 hover:bg-white/[0.07] transition-all"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{comment.flagUrl}</span>
                              <span className="font-bold text-slate-300 text-[11px]">
                                {comment.username}
                              </span>
                              {comment.isVerified && (
                                <CheckCircle className="h-2.5 w-2.5 text-sky-400" />
                              )}
                              <span className="text-[9px] text-slate-600 font-mono flex items-center gap-0.5">
                                <Clock className="h-2 w-2" />
                                {relativeTime(comment.timestamp)}
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px] mt-1 ml-5 leading-relaxed">
                              {comment.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ Sidebar ═══ */}
        <div className="space-y-3">
          {/* ── AI Analyst Card ── */}
          <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              AI Analyst
            </h3>
            <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
              <p className="text-[11px] leading-relaxed text-slate-400">
                AI monitors all posts in real-time and generates diplomatic/intel responses from rival nations.
              </p>
            </div>
          </div>

          {/* ── Trending Countries ── */}
          <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Trending Countries
            </h3>
            {trendingLoading ? (
              <div className="py-4 text-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-slate-600" />
              </div>
            ) : trending?.countries && trending.countries.length > 0 ? (
              <div className="space-y-1">
                {trending.countries.slice(0, 8).map((c, i) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-600 w-4">{i + 1}</span>
                      <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                        {c.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-600 bg-white/5 rounded px-1.5 py-0.5">
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-600 py-2 text-center">No trending data</p>
            )}
          </div>

          {/* ── Trending Keywords ── */}
          <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-violet-400" />
              Trending Keywords
            </h3>
            {trending?.keywords && trending.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {trending.keywords.slice(0, 12).map((kw) => (
                  <span
                    key={kw.word}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                  >
                    <span className="text-slate-600">#</span>
                    {kw.word}
                    <span className="text-[8px] font-mono text-slate-600">{kw.count}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-600 py-2 text-center">No keywords yet</p>
            )}
          </div>

          {/* ── Guidelines ── */}
          <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4 space-y-2.5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              Rules of Engagement
            </h3>
            <div className="space-y-2 text-[11px] text-slate-500 leading-relaxed">
              <p>Diplomatic posts affect public opinion and can weaken rival economies.</p>
              <p>AI analysts auto-respond to your posts with realistic geopolitical reactions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
