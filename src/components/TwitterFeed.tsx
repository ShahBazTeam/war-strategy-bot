import React, { useState, useEffect } from "react";
import { User, Tweet } from "../types";
import { MessageSquare, Heart, Send, Sparkles, AlertCircle, RefreshCw, Globe, Trophy, CheckCircle } from "lucide-react";

interface TwitterFeedProps {
  currentUser: User;
}

export default function TwitterFeed({ currentUser }: TwitterFeedProps) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [newTweetText, setNewTweetText] = useState("");
  const [activeCommentTweetId, setActiveCommentTweetId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTweets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tweets", {
        headers: { "x-user-id": currentUser.id }
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
  };

  useEffect(() => {
    fetchTweets();
    // Auto refresh every 10 seconds for simulated replies
    const interval = setInterval(fetchTweets, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePostTweet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTweetText.trim().length < 5) {
      alert("متن توییت ژئوپلیتیک شما باید حداقل ۵ کاراکتر باشد");
      return;
    }
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/tweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id
        },
        body: JSON.stringify({ text: newTweetText })
      });
      const data = await res.json();
      if (res.ok) {
        setNewTweetText("");
        fetchTweets();
      } else {
        setError(data.error || "خطایی در ثبت توییت دیپلماتیک پیش آمد");
      }
    } catch (err) {
      setError("خطا در ایجاد ارتباط با سرور");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (tweetId: string) => {
    try {
      const res = await fetch(`/api/tweets/${tweetId}/like`, {
        method: "POST",
        headers: { "x-user-id": currentUser.id }
      });
      if (res.ok) {
        // Optimistic local update
        setTweets(prev => prev.map(t => {
          if (t.id === tweetId) {
            const hasLiked = t.likes.includes(currentUser.id);
            const nextLikes = hasLiked
              ? t.likes.filter(id => id !== currentUser.id)
              : [...t.likes, currentUser.id];
            return { ...t, likes: nextLikes };
          }
          return t;
        }));
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
          "x-user-id": currentUser.id
        },
        body: JSON.stringify({ text: commentText })
      });
      if (res.ok) {
        setCommentText("");
        setActiveCommentTweetId(null);
        fetchTweets();
      } else {
        const d = await res.json();
        alert(d.error || "خطا در ثبت دیدگاه");
      }
    } catch (err) {
      console.error("Failed to comment:", err);
    }
  };

  return (
    <div className="space-y-6" id="twitter-feed-view">
      {/* Social Title Banner */}
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/40 p-6">
        <div className="absolute right-0 top-0 h-32 w-32 bg-sky-500/5 rounded-full blur-2xl animate-pulse" />
        <div className="flex items-center gap-4 relative z-10 font-sans">
          <div className="rounded border border-sky-500/30 bg-sky-500/10 p-3.5">
            <Globe className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-white">توییتر بین‌الملل دیپلماتیک (Diplomacy Feed)</h2>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">شبکه غیررسمی گپ‌وگفت روسای ملل و آژانس‌های اطلاعات جهانی. اخبار جنگ‌ها، صلح‌ها، مواضع هسته‌ای و پاسخ‌های طنر خودکار هوش مصنوعی جمینی در اینجا رصد می‌شود!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Feed Column */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 flex items-center gap-2 select-none">
            <RefreshCw className={`h-3 w-3 text-sky-400 ${loading ? "animate-spin" : ""}`} /> 📱 جدول زمانی توییتر دیپلماسی
          </h2>

          {/* New Tweet Draft Box */}
          <div className="rounded-lg border border-white/10 bg-black/40 p-5 space-y-4 font-sans">
            <div className="flex gap-3">
              <span className="text-2xl select-none">{currentUser.country.flagUrl || "🏳️"}</span>
              <div className="flex-1">
                <form onSubmit={handlePostTweet} className="space-y-3">
                  <textarea
                    value={newTweetText}
                    onChange={(e) => setNewTweetText(e.target.value)}
                    placeholder="در گنبد دیپلماسی چه می‌گذرد؟ بیانیه‌ای برای تخریب حریف یا صلح منتشر کنید..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 p-3 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 leading-relaxed font-sans"
                  />
                  {error && (
                    <div className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 border border-red-500/10 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-600 font-mono">کاراکتر: {newTweetText.length}</span>
                    <button
                      type="submit"
                      disabled={posting}
                      className="px-5 py-2 rounded-md bg-sky-505 border border-sky-450 hover:bg-sky-500/20 text-sky-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {posting ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>ارسال صدای ملل</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Tweets Feed */}
          {loading && tweets.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-sky-400" />
              <span>در حال برقراری خط موازنه اطلاعات...</span>
            </div>
          ) : tweets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 bg-black/20 py-20 text-center text-xs text-slate-500 font-sans">
              هیچ توییتی صادر نشده است. اولین نفری باشید که موضع استراتژیک کشور خود را جار می‌زند!
            </div>
          ) : (
            <div className="space-y-4">
              {tweets.map(tweet => {
                const isLikedByMe = tweet.likes.includes(currentUser.id);
                return (
                  <div key={tweet.id} className="rounded-lg border border-white/1s bg-black/40 p-5 space-y-4 font-sans transition-all hover:bg-black/50">
                    {/* Header */}
                    <div className="flex gap-2.5 items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl select-none">{tweet.flagUrl || "🌐"}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-200">{tweet.countryName}</span>
                            {tweet.isVerified && <CheckCircle className="h-3 w-3 text-cyan-400 inline ml-1" />}
                            <span className="bg-sky-500/10 text-sky-400 text-[8px] font-mono border border-sky-500/20 rounded px-1.5 py-0.5">@{tweet.username}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">{new Date(tweet.timestamp).toLocaleTimeString('fa-IR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{tweet.text}</p>

                    {/* Actions Row */}
                    <div className="flex gap-4 items-center border-t border-white/5 pt-3 text-xs text-slate-500">
                      <button
                        onClick={() => handleLike(tweet.id)}
                        className={`flex items-center gap-1.5 transition hover:text-rose-400 cursor-pointer ${isLikedByMe ? "text-rose-450" : ""}`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${isLikedByMe ? "fill-rose-500 text-rose-500" : ""}`} />
                        <span>{tweet.likes.length} لایک</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveCommentTweetId(activeCommentTweetId === tweet.id ? null : tweet.id);
                          setCommentText("");
                        }}
                        className="flex items-center gap-1.5 transition hover:text-sky-400 cursor-pointer text-slate-500"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{tweet.comments.length} دیدگاه ژئوپلیتیک</span>
                      </button>
                    </div>

                    {/* Comment Area Box */}
                    {activeCommentTweetId === tweet.id && (
                      <div className="bg-white/5 rounded p-3 space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="متن پاسخ رسمی یا طعنه دیپلماتیک..."
                            className="flex-1 bg-black/40 border border-white/10 p-2 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                          />
                          <button
                            onClick={() => handlePostComment(tweet.id)}
                            className="bg-sky-505 border border-sky-500/20 hover:bg-sky-500/30 text-sky-400 font-bold text-[10px] px-3 py-1.5 rounded"
                          >
                            ثبت
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Comments list */}
                    {tweet.comments && tweet.comments.length > 0 && (
                      <div className="space-y-2 border-t border-white/5 pt-3.5 mt-2 max-h-48 overflow-y-auto">
                        {tweet.comments.map(comment => (
                          <div key={comment.id} className="bg-black/20 p-2.5 rounded-md text-xs space-y-1 border border-white/5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm select-none">{comment.flagUrl}</span>
                              <span className="font-bold text-slate-300 text-[10px]">{comment.username}</span>
                              <span className="text-[8px] text-slate-600 font-mono">({new Date(comment.timestamp).toLocaleTimeString('fa-IR')})</span>
                            </div>
                            <p className="text-slate-400 text-xs mr-5 leading-normal">{comment.text}</p>
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

        {/* Sidebar News Grid & Live Ticker */}
        <div className="space-y-6">
          {/* Ticker AI info */}
          <div className="rounded-lg border border-white/10 bg-black/40 p-5 space-y-4 font-sans self-start">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 flex items-center gap-1.5 select-none">
              <Sparkles className="h-4 w-4 text-sky-400" /> تحلیلگر هوشمند ملل (IA)
            </h2>
            <div className="bg-sky-505/10 border border-sky-500/20 p-3.5 rounded text-xs leading-relaxed text-slate-300">
              <p className="font-semibold text-sky-400 mb-1">سازوکار بدون محدودیت جمینی:</p>
              هوش مصنوعی بدون وقفه، تمام بیانیه‌ها یا توییت‌های ارسالی شما را به محض انتشار پایش کرده و پاسخ یا طعنه مناسب حقوقی/دیپلماتیک را از سمت دیگر رقبا صبیه‌سازی می‌کند.
            </div>
          </div>

          {/* Guidelines info */}
          <div className="rounded-lg border border-white/10 bg-black/45 p-5 space-y-3 text-xs leading-relaxed text-slate-400 font-sans">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-500" /> موازنه صلح و جنگ توییتر
            </h3>
            <p>شورای امنیت و رسانه‌های ملل، تهدیدات هسته‌ای یا تقاضاهای صلح شما را ملاک قرار می‌دهند. تذکر دیپلماتیک خوب در توییت‌ها می‌تواند رضایت‌ عمومی یا تضعیف اقتصادی حریفِ متجاوز را به بار آورد!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
