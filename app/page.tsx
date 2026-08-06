"use client";

import { useEffect, useMemo, useState } from "react";

type Continent = {
  id: string;
  name: string;
  english: string;
  color: string;
  emoji: string;
  countries: string;
  fact: string;
  position: string;
};

type LocationQuestion = {
  id: string;
  prompt: string;
  answer: string;
  hint: string;
  explanation: string;
  x: number;
  y: number;
  region: string;
};

type FlagQuestion = {
  id: string;
  country: string;
  flag: string;
  options: string[];
  explanation: string;
};

const continents: Continent[] = [
  { id: "asia", name: "亞洲", english: "ASIA", color: "#f58a54", emoji: "🌅", countries: "中國、日本、印度、泰國", fact: "亞洲是面積最大、人口最多的洲。世界最高峰珠穆朗瑪峰也在這裡。", position: "位於歐洲以東、印度洋以北，橫跨北半球與東半球。" },
  { id: "europe", name: "歐洲", english: "EUROPE", color: "#68b5e8", emoji: "🏰", countries: "法國、義大利、挪威、希臘", fact: "歐洲雖然面積不大，卻有許多不同語言、歷史悠久的國家。", position: "位於亞洲西側、非洲北側，主要在北半球。" },
  { id: "africa", name: "非洲", english: "AFRICA", color: "#edbd5b", emoji: "🦁", countries: "埃及、肯亞、南非、摩洛哥", fact: "非洲擁有世界最大的沙漠撒哈拉沙漠，以及豐富的野生動物。", position: "橫跨赤道，位於大西洋與印度洋之間。" },
  { id: "north-america", name: "北美洲", english: "NORTH AMERICA", color: "#65c49a", emoji: "🦬", countries: "加拿大、美國、墨西哥、古巴", fact: "北美洲從北極圈延伸到熱帶地區，氣候與地形十分多樣。", position: "位於西半球北部，南方連接中美洲。" },
  { id: "south-america", name: "南美洲", english: "SOUTH AMERICA", color: "#db7caa", emoji: "🌿", countries: "巴西、阿根廷、智利、秘魯", fact: "亞馬遜雨林與安地斯山脈都位於南美洲。", position: "位於西半球，赤道穿過北部，大部分在南半球。" },
  { id: "oceania", name: "大洋洲", english: "OCEANIA", color: "#8f8be8", emoji: "🐚", countries: "澳洲、紐西蘭、斐濟、巴布亞紐幾內亞", fact: "大洋洲由澳洲大陸與許多太平洋島嶼組成。", position: "位於亞洲東南方，主要分布在太平洋與南半球。" },
  { id: "antarctica", name: "南極洲", english: "ANTARCTICA", color: "#79d6d4", emoji: "🐧", countries: "沒有主權國家", fact: "南極洲幾乎完全被冰雪覆蓋，是地球最寒冷、乾燥且多風的洲。", position: "位於地球最南端，南極點就在這裡。" },
];

const locationQuestions: LocationQuestion[] = [
  { id: "jp", prompt: "請在地圖上找到日本", answer: "日本", hint: "想想看：它在亞洲東側，是一串面向太平洋的島嶼。", explanation: "日本位於亞洲東部、太平洋西側，由北海道、本州、四國、九州等島嶼組成。", x: 72, y: 34, region: "亞洲" },
  { id: "br", prompt: "請在地圖上找到巴西", answer: "巴西", hint: "它是南美洲面積最大的國家，亞馬遜雨林有很大一部分在境內。", explanation: "巴西位於南美洲東部，面向大西洋，也是世界上使用葡萄牙語人口最多的國家。", x: 32, y: 66, region: "南美洲" },
  { id: "eg", prompt: "請在地圖上找到埃及", answer: "埃及", hint: "它位於非洲東北角，尼羅河流經這裡。", explanation: "埃及位於非洲東北部，西奈半島則連接亞洲，是少數橫跨兩洲的國家。", x: 54, y: 50, region: "非洲" },
  { id: "us", prompt: "請在地圖上找到美國", answer: "美國", hint: "它在北美洲，位於加拿大南方、墨西哥北方。", explanation: "美國位於北美洲中部，東臨大西洋、西臨太平洋，阿拉斯加與夏威夷也是美國的一部分。", x: 21, y: 42, region: "北美洲" },
  { id: "au", prompt: "請在地圖上找到澳洲", answer: "澳洲", hint: "這是一個國家也是一個大陸，在亞洲的東南方。", explanation: "澳洲位於南半球，是世界面積第六大的國家，也是大洋洲的核心陸地。", x: 78, y: 74, region: "大洋洲" },
  { id: "fr", prompt: "請在地圖上找到法國", answer: "法國", hint: "它在歐洲西部，西邊靠近大西洋。", explanation: "法國位於歐洲西部，是歐洲面積較大的國家之一，首都是巴黎。", x: 48, y: 38, region: "歐洲" },
];

const flagQuestions: FlagQuestion[] = [
  { id: "tw", country: "臺灣", flag: "🇹🇼", options: ["臺灣", "日本", "韓國", "蒙古"], explanation: "臺灣國旗以紅色為底，左上角有藍色方形與白色太陽。" },
  { id: "jp", country: "日本", flag: "🇯🇵", options: ["日本", "孟加拉", "帛琉", "土耳其"], explanation: "日本國旗是白底紅日，象徵太陽，也呼應日本『日出之國』的稱呼。" },
  { id: "br", country: "巴西", flag: "🇧🇷", options: ["巴西", "葡萄牙", "加彭", "南非"], explanation: "巴西國旗的黃色菱形與藍色圓球很有辨識度，藍球上有南十字星。" },
  { id: "ca", country: "加拿大", flag: "🇨🇦", options: ["加拿大", "瑞士", "丹麥", "奧地利"], explanation: "加拿大國旗中央的楓葉是國家象徵，兩側的紅色代表加拿大的歷史與文化。" },
  { id: "za", country: "南非", flag: "🇿🇦", options: ["南非", "肯亞", "納米比亞", "辛巴威"], explanation: "南非國旗有鮮明的 Y 字形，象徵不同民族與文化走向團結。" },
  { id: "fr", country: "法國", flag: "🇫🇷", options: ["法國", "義大利", "愛爾蘭", "羅馬尼亞"], explanation: "法國國旗由藍、白、紅三條直條組成，常被稱為三色旗。" },
  { id: "au", country: "澳洲", flag: "🇦🇺", options: ["澳洲", "紐西蘭", "英國", "斐濟"], explanation: "澳洲國旗上有英國米字旗、聯邦星，以及代表南十字星的五顆星。" },
  { id: "eg", country: "埃及", flag: "🇪🇬", options: ["埃及", "葉門", "敘利亞", "伊拉克"], explanation: "埃及國旗由紅、白、黑三色組成，中央有金色的薩拉丁之鷹。" },
  { id: "us", country: "美國", flag: "🇺🇸", options: ["美國", "利比亞", "賴比瑞亞", "馬來西亞"], explanation: "美國國旗的星星代表州，條紋代表最初的十三個殖民地。" },
  { id: "in", country: "印度", flag: "🇮🇳", options: ["印度", "愛爾蘭", "象牙海岸", "尼日利亞"], explanation: "印度國旗的中央有藍色法輪，象徵正義、進步與持續運轉。" },
];

const defaultProgress = { unlocked: 0, completed: [] as string[], bosses: [] as string[], stars: 0, best: 0 };

function getStoredProgress() {
  if (typeof window === "undefined") return defaultProgress;
  try { return { ...defaultProgress, ...JSON.parse(localStorage.getItem("geo-quest-progress") || "{}") }; } catch { return defaultProgress; }
}

export default function Home() {
  const [progress, setProgress] = useState(() => getStoredProgress());
  const [screen, setScreen] = useState<"home" | "level" | "boss" | "result">("home");
  const [selectedContinent, setSelectedContinent] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [mapMarker, setMapMarker] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("geo-quest-progress", JSON.stringify(progress)); }, [progress]);

  const continent = continents[selectedContinent];
  const locationQuestion = locationQuestions[(selectedContinent + questionIndex) % locationQuestions.length];
  const bossQuestions = useMemo(() => flagQuestions.slice(selectedContinent, selectedContinent + 5), [selectedContinent]);
  const flagQuestion = bossQuestions[questionIndex % bossQuestions.length];
  const currentQuestionCount = screen === "boss" ? bossQuestions.length : 3;
  const completedCount = progress.completed.length;

  function startLevel(index: number) {
    setSelectedContinent(index); setQuestionIndex(0); setScore(0); setStreak(0); setAnswerState("idle"); setSelectedAnswer(""); setShowHint(false); setMapMarker(null); setScreen("level");
  }

  function startBoss(index: number) {
    setSelectedContinent(index); setQuestionIndex(0); setScore(0); setStreak(0); setAnswerState("idle"); setSelectedAnswer(""); setScreen("boss");
  }

  function finishRound(kind: "level" | "boss") {
    const key = kind === "boss" ? continent.id : `${continent.id}-level`;
    const next = { ...progress, completed: kind === "level" && !progress.completed.includes(key) ? [...progress.completed, key] : progress.completed, bosses: kind === "boss" && !progress.bosses.includes(continent.id) ? [...progress.bosses, continent.id] : progress.bosses, stars: progress.stars + Math.max(1, Math.round(score / 10)), best: Math.max(progress.best, score), unlocked: Math.min(continents.length, Math.max(progress.unlocked, selectedContinent + 2)) };
    setProgress(next); setScreen("result");
  }

  function answerLocation(x: number, y: number) {
    if (answerState !== "idle") return;
    setMapMarker({ x, y });
    const distance = Math.sqrt(Math.pow(x - locationQuestion.x, 2) + Math.pow(y - locationQuestion.y, 2));
    const correct = distance < 11;
    setAnswerState(correct ? "correct" : "wrong");
    setStreak(correct ? streak + 1 : 0);
    if (correct) setScore(score + (showHint ? 70 : 100) + streak * 10);
  }

  function answerFlag(option: string) {
    if (answerState !== "idle") return;
    const correct = option === flagQuestion.country;
    setSelectedAnswer(option); setAnswerState(correct ? "correct" : "wrong"); setStreak(correct ? streak + 1 : 0);
    if (correct) setScore(score + 100 + streak * 10);
  }

  function nextQuestion() {
    if (questionIndex + 1 >= currentQuestionCount) { finishRound(screen as "level" | "boss"); return; }
    setQuestionIndex(questionIndex + 1); setAnswerState("idle"); setSelectedAnswer(""); setShowHint(false); setMapMarker(null);
  }

  function resetProgress() {
    if (window.confirm("確定要清除所有探險紀錄嗎？")) setProgress(defaultProgress);
  }

  return (
    <main className="app-shell">
      <div className="sun-glow" />
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("home")} aria-label="回到首頁"><span className="brand-mark">✦</span><span>GeoQuest <small>世界地理探險隊</small></span></button>
        <div className="top-stats"><span>⭐ {progress.stars}</span><span>🏅 {progress.bosses.length}</span><button className="reset-link" onClick={resetProgress}>重置進度</button></div>
      </header>

      {screen === "home" && <>
        <section className="hero">
          <div className="hero-copy"><div className="eyebrow">WORLD EXPLORER · 任務 01</div><h1>把世界，<em>玩進腦袋裡。</em></h1><p>從七大洲出發，找到世界各國的位置，破解國旗密碼，成為真正的地理探險家。</p><button className="primary-button" onClick={() => startLevel(Math.min(progress.unlocked, continents.length - 1))}>開始探險 <span>→</span></button><div className="hero-note"><span className="avatar-stack"><i>🧭</i><i>🌍</i><i>🗺️</i></span><span>已經有 <strong>12,480</strong> 位探險家出發</span></div></div>
          <div className="hero-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="globe">🌍</div><div className="float-card card-top">✈️<b>今天的任務</b><small>找到 3 個國家</small></div><div className="float-card card-bottom">🏆<b>下一個徽章</b><small>洲別探險家</small></div><div className="coordinate">24°N<br /><span>120°E</span></div></div>
        </section>
        <section className="mission-strip"><div><span className="strip-label">YOUR JOURNEY</span><h2>你的世界任務</h2></div><div className="progress-line"><span style={{ width: `${Math.max(5, (completedCount / continents.length) * 100)}%` }} /></div><div className="progress-text"><strong>{completedCount}</strong> / {continents.length} 洲<br /><small>已完成</small></div></section>
        <section className="continent-section"><div className="section-heading"><div><span className="strip-label">CHOOSE A REGION</span><h2>選擇你的目的地</h2></div><span className="swipe-hint">滑動探索 <b>→</b></span></div><div className="continent-grid">{continents.map((item, index) => { const unlocked = index <= progress.unlocked; const done = progress.completed.includes(`${item.id}-level`); const bossDone = progress.bosses.includes(item.id); return <article className={`continent-card ${!unlocked ? "locked" : ""} ${done ? "done" : ""}`} key={item.id} style={{ "--card-color": item.color } as React.CSSProperties} onClick={() => unlocked && startLevel(index)}><div className="card-topline"><span className="continent-emoji">{item.emoji}</span>{done && <span className="done-pill">✓ 已完成</span>}{!unlocked && <span className="lock">🔒</span>}</div><h3>{item.name}</h3><span className="english">{item.english}</span><p>{item.countries}</p><div className="card-footer"><span>{bossDone ? "🏆 魔王已擊破" : unlocked ? "3 個任務 · 1 個魔王關" : "完成前一洲後解鎖"}</span><span className="arrow">→</span></div></article>; })}</div></section>
      </>}

      {screen === "level" && <section className="game-screen"><div className="game-header"><button className="back-button" onClick={() => setScreen("home")}>← 返回地圖</button><div className="game-progress"><span>{continent.emoji} {continent.name}任務</span><div><i style={{ width: `${((questionIndex) / currentQuestionCount) * 100}%` }} /></div><small>{questionIndex + 1} / {currentQuestionCount}</small></div><span className="live-score">⭐ {score}</span></div><div className="question-layout"><aside className="mission-aside"><span className="eyebrow">LOCATION QUEST</span><h2>{locationQuestion.prompt}</h2><p>點擊你認為正確的地圖位置。距離越近，探險分數越高！</p><div className="tip-box"><span>💡</span><div><b>探險提示</b><p>{showHint ? locationQuestion.hint : "需要一點線索嗎？"}</p></div></div>{!showHint && <button className="text-button" onClick={() => setShowHint(true)}>使用提示（扣 30 分） →</button>}</aside><div className="map-panel"><div className="map-label left">WEST</div><div className="map-label right">EAST</div><div className="world-map" role="button" tabIndex={0} aria-label="世界地圖，點擊選擇位置" onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); answerLocation(((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100); }} onKeyDown={(event) => { if (event.key === "Enter") answerLocation(50, 50); }}><div className="map-grid" /><div className="land land-na" /><div className="land land-sa" /><div className="land land-eu" /><div className="land land-af" /><div className="land land-asia" /><div className="land land-au" /><div className="land land-greenland" />{mapMarker && <span className={`map-pin ${answerState}`} style={{ left: `${mapMarker.x}%`, top: `${mapMarker.y}%` }}>📍</span>}{answerState !== "idle" && <span className="answer-target" style={{ left: `${locationQuestion.x}%`, top: `${locationQuestion.y}%` }}>◎</span>}<div className="map-compass">N<br /><span>✦</span></div></div>{answerState !== "idle" && <div className={`feedback ${answerState}`}><span>{answerState === "correct" ? "🎉" : "🧭"}</span><div><b>{answerState === "correct" ? "定位成功！" : `差一點點！正確位置是${locationQuestion.answer}`}</b><p>{locationQuestion.explanation}</p></div><button onClick={nextQuestion}>{questionIndex + 1 >= currentQuestionCount ? "完成任務" : "下一題 →"}</button></div>}</div></div></section>}

      {screen === "boss" && <section className="game-screen boss-screen"><div className="game-header"><button className="back-button" onClick={() => setScreen("home")}>← 返回地圖</button><div className="game-progress"><span>⚔️ {continent.name}魔王關</span><div><i style={{ width: `${((questionIndex) / currentQuestionCount) * 100}%` }} /></div><small>{questionIndex + 1} / {currentQuestionCount}</small></div><span className="live-score">⭐ {score}</span></div><div className="boss-intro"><span className="eyebrow">FLAG BOSS · FINAL CHECK</span><h1>國旗辨識魔王關</h1><p>認出這面旗幟，證明你真的了解這個洲！</p></div><div className="flag-card"><div className="flag-visual">{flagQuestion.flag}</div><div className="flag-question"><span>這是哪一個國家的國旗？</span><h2>選出正確答案</h2><div className="flag-options">{flagQuestion.options.map((option) => <button key={option} className={selectedAnswer === option ? answerState : ""} disabled={answerState !== "idle"} onClick={() => answerFlag(option)}>{option}</button>)}</div>{answerState !== "idle" && <div className={`flag-feedback ${answerState}`}><b>{answerState === "correct" ? "答對了！你是國旗偵探 🔥" : `答案是：${flagQuestion.country}`}</b><p>{flagQuestion.explanation}</p><button className="primary-button small" onClick={nextQuestion}>{questionIndex + 1 >= currentQuestionCount ? "完成魔王關" : "下一面旗 →"}</button></div>}</div></div><div className="boss-footer">⚔️ 魔王關需要答對 4 / 5 題　 ·　每一面國旗，都是一段地理故事</div></section>}

      {screen === "result" && <section className="result-screen"><div className="confetti">✦　✧　✦　✧　✦</div><div className="result-badge">🏆</div><span className="eyebrow">MISSION COMPLETE</span><h1>任務完成！</h1><p>{progress.bosses.includes(continent.id) ? `你擊破了${continent.name}魔王關，離世界地理大師更近一步！` : `你已經完成${continent.name}的地理定位任務。`}</p><div className="result-stats"><div><strong>{score}</strong><span>本次分數</span></div><div><strong>⭐ {Math.max(1, Math.round(score / 10))}</strong><span>獲得星星</span></div><div><strong>{streak}</strong><span>最高連擊</span></div></div><div className="result-actions"><button className="primary-button" onClick={() => startBoss(selectedContinent)}>挑戰國旗魔王 <span>⚔️</span></button><button className="secondary-button" onClick={() => setScreen("home")}>回到世界地圖</button></div></section>}
      <footer className="site-footer"><span>GeoQuest © 2026</span><span>探索．思考．認識世界</span></footer>
    </main>
  );
}
