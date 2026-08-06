"use client";

import { useEffect, useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

type Continent = { id: string; name: string; english: string; color: string; emoji: string; fact: string };
type CountryPin = { id: string; name: string; flag: string; continent: string; x: number; y: number; capital: string; fact: string };
type FlagQuestion = { country: string; flag: string; options: string[]; explanation: string };
type WorldTopology = {
  type: "Topology";
  objects: { countries: { type: "GeometryCollection"; geometries: unknown[] } };
  arcs: unknown[];
  transform?: unknown;
};

function WorldCountryLayer({ className = "" }: { className?: string }) {
  const [world, setWorld] = useState<WorldTopology | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/countries-110m.json", { signal: controller.signal })
      .then((response) => response.json() as Promise<WorldTopology>)
      .then(setWorld)
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") console.error("無法載入世界國界資料", error);
      });
    return () => controller.abort();
  }, []);

  const countries = useMemo(() => {
    if (!world) return null;
    return feature(world as never, world.objects.countries as never) as unknown as FeatureCollection<Geometry, GeoJsonProperties>;
  }, [world]);

  const paths = useMemo(() => {
    if (!countries) return [];
    const projection = geoNaturalEarth1().fitSize([1000, 520], countries);
    const path = geoPath(projection);
    return countries.features
      .map((country, index) => ({ id: country.id ?? index, d: path(country) ?? "" }))
      .filter((country) => country.d);
  }, [countries]);

  return <svg className={`country-outline-layer ${className}`} viewBox="0 0 1000 520" role="img" aria-label="世界各國國界輪廓">
    <title>世界各國國界輪廓</title>
    {paths.map((country) => <path key={country.id} d={country.d} className="country-outline" />)}
  </svg>;
}

const continents: Continent[] = [
  { id: "asia", name: "亞洲", english: "ASIA", color: "#f28b55", emoji: "🌅", fact: "亞洲是面積最大、人口最多的洲，珠穆朗瑪峰也在這裡。" },
  { id: "europe", name: "歐洲", english: "EUROPE", color: "#62b5e7", emoji: "🏰", fact: "歐洲有許多歷史悠久、語言文化不同的國家。" },
  { id: "africa", name: "非洲", english: "AFRICA", color: "#edba57", emoji: "🦁", fact: "非洲橫跨赤道，擁有撒哈拉沙漠與豐富的野生動物。" },
  { id: "north-america", name: "北美洲", english: "NORTH AMERICA", color: "#61c19a", emoji: "🦬", fact: "北美洲從北極圈延伸到熱帶，氣候與地形十分多樣。" },
  { id: "south-america", name: "南美洲", english: "SOUTH AMERICA", color: "#d778a8", emoji: "🌿", fact: "亞馬遜雨林與安地斯山脈都位於南美洲。" },
  { id: "oceania", name: "大洋洲", english: "OCEANIA", color: "#8b88e8", emoji: "🐚", fact: "大洋洲由澳洲大陸與許多太平洋島嶼組成。" },
  { id: "antarctica", name: "南極洲", english: "ANTARCTICA", color: "#73d0d0", emoji: "🐧", fact: "南極洲幾乎完全被冰雪覆蓋，沒有主權國家。" },
];

const countryPins: CountryPin[] = [
  { id: "ca", name: "加拿大", flag: "🇨🇦", continent: "北美洲", x: 19, y: 29, capital: "渥太華", fact: "世界面積第二大的國家。" },
  { id: "us", name: "美國", flag: "🇺🇸", continent: "北美洲", x: 21, y: 42, capital: "華盛頓 D.C.", fact: "位於加拿大南方、墨西哥北方。" },
  { id: "mx", name: "墨西哥", flag: "🇲🇽", continent: "北美洲", x: 24, y: 55, capital: "墨西哥城", fact: "位於北美洲南部，連接中美洲。" },
  { id: "br", name: "巴西", flag: "🇧🇷", continent: "南美洲", x: 34, y: 69, capital: "巴西利亞", fact: "南美洲面積最大的國家，亞馬遜雨林很大一部分在境內。" },
  { id: "ar", name: "阿根廷", flag: "🇦🇷", continent: "南美洲", x: 30, y: 84, capital: "布宜諾斯艾利斯", fact: "位於南美洲南部，西側是安地斯山脈。" },
  { id: "fr", name: "法國", flag: "🇫🇷", continent: "歐洲", x: 47, y: 36, capital: "巴黎", fact: "位於歐洲西部，首都是巴黎。" },
  { id: "it", name: "義大利", flag: "🇮🇹", continent: "歐洲", x: 51, y: 43, capital: "羅馬", fact: "像靴子形狀的半島國家。" },
  { id: "no", name: "挪威", flag: "🇳🇴", continent: "歐洲", x: 50, y: 22, capital: "奧斯陸", fact: "位於斯堪地那維亞半島西側。" },
  { id: "eg", name: "埃及", flag: "🇪🇬", continent: "非洲", x: 53, y: 51, capital: "開羅", fact: "尼羅河流經境內，西奈半島連接亞洲。" },
  { id: "ng", name: "奈及利亞", flag: "🇳🇬", continent: "非洲", x: 48, y: 61, capital: "阿布加", fact: "位於西非，是非洲人口最多的國家。" },
  { id: "za", name: "南非", flag: "🇿🇦", continent: "非洲", x: 52, y: 82, capital: "普勒托利亞", fact: "位於非洲最南端附近。" },
  { id: "in", name: "印度", flag: "🇮🇳", continent: "亞洲", x: 65, y: 52, capital: "新德里", fact: "位於南亞，北側是喜馬拉雅山脈。" },
  { id: "cn", name: "中國", flag: "🇨🇳", continent: "亞洲", x: 71, y: 40, capital: "北京", fact: "位於東亞，是世界面積最大的國家之一。" },
  { id: "jp", name: "日本", flag: "🇯🇵", continent: "亞洲", x: 80, y: 42, capital: "東京", fact: "位於亞洲東側，是面向太平洋的島國。" },
  { id: "th", name: "泰國", flag: "🇹🇭", continent: "亞洲", x: 70, y: 60, capital: "曼谷", fact: "位於東南亞中南半島。" },
  { id: "au", name: "澳洲", flag: "🇦🇺", continent: "大洋洲", x: 78, y: 78, capital: "坎培拉", fact: "同時是國家與大陸，位於南半球。" },
  { id: "nz", name: "紐西蘭", flag: "🇳🇿", continent: "大洋洲", x: 88, y: 85, capital: "威靈頓", fact: "位於澳洲東南方的島國。" },
  { id: "aq", name: "南極洲", flag: "🇦🇶", continent: "南極洲", x: 51, y: 94, capital: "無", fact: "地球最南端的洲，沒有主權國家。" },
];

const flagQuestions: FlagQuestion[] = [
  { country: "日本", flag: "🇯🇵", options: ["日本", "孟加拉", "帛琉", "土耳其"], explanation: "日本國旗是白底紅日，象徵太陽，也呼應日本「日出之國」的稱呼。" },
  { country: "巴西", flag: "🇧🇷", options: ["巴西", "葡萄牙", "加彭", "南非"], explanation: "巴西國旗的黃色菱形與藍色圓球很有辨識度。" },
  { country: "加拿大", flag: "🇨🇦", options: ["加拿大", "瑞士", "丹麥", "奧地利"], explanation: "加拿大國旗中央的楓葉是國家象徵。" },
  { country: "法國", flag: "🇫🇷", options: ["法國", "義大利", "愛爾蘭", "羅馬尼亞"], explanation: "法國國旗由藍、白、紅三條直條組成。" },
  { country: "印度", flag: "🇮🇳", options: ["印度", "愛爾蘭", "象牙海岸", "尼日利亞"], explanation: "印度國旗中央的藍色法輪象徵正義、進步與持續運轉。" },
  { country: "南非", flag: "🇿🇦", options: ["南非", "肯亞", "納米比亞", "辛巴威"], explanation: "南非國旗的 Y 字形象徵不同民族與文化走向團結。" },
];

const defaultProgress = { stars: 0, completed: [] as string[], bosses: [] as string[], unlocked: 0 };
function readProgress() { if (typeof window === "undefined") return defaultProgress; try { return { ...defaultProgress, ...JSON.parse(localStorage.getItem("geo-quest-progress") || "{}") }; } catch { return defaultProgress; } }

export default function Home() {
  const [progress, setProgress] = useState(() => readProgress());
  const [screen, setScreen] = useState<"home" | "location" | "boss" | "result">("home");
  const [selectedCountry, setSelectedCountry] = useState<CountryPin | null>(null);
  const [selectedContinent, setSelectedContinent] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => { localStorage.setItem("geo-quest-progress", JSON.stringify(progress)); }, [progress]);
  const continent = continents[selectedContinent];
  const locationTarget = selectedCountry || countryPins[(selectedContinent + questionIndex) % countryPins.length];
  const bossQuestions = useMemo(() => flagQuestions.slice(selectedContinent % 2, (selectedContinent % 2) + 5), [selectedContinent]);
  const flagQuestion = bossQuestions[questionIndex % bossQuestions.length];
  const total = screen === "boss" ? 5 : 3;

  function startLocation(index = Math.min(progress.unlocked, continents.length - 1), country: CountryPin | null = null) { setSelectedContinent(index); setSelectedCountry(country); setQuestionIndex(0); setScore(0); setAnswerState("idle"); setMarker(null); setShowHint(false); setScreen("location"); }
  function startBoss() { setQuestionIndex(0); setScore(0); setAnswerState("idle"); setSelectedAnswer(""); setScreen("boss"); }
  function chooseCountry(country: CountryPin) { setSelectedCountry(country); setSelectedContinent(Math.max(0, continents.findIndex((item) => item.name === country.continent))); }
  function answerMap(x: number, y: number) { if (answerState !== "idle") return; setMarker({ x, y }); const d = Math.sqrt((x - locationTarget.x) ** 2 + (y - locationTarget.y) ** 2); const correct = d < 9; setAnswerState(correct ? "correct" : "wrong"); if (correct) setScore(score + (showHint ? 70 : 100)); }
  function answerFlag(option: string) { if (answerState !== "idle") return; setSelectedAnswer(option); setAnswerState(option === flagQuestion.country ? "correct" : "wrong"); if (option === flagQuestion.country) setScore(score + 100); }
  function nextQuestion() { if (questionIndex + 1 >= total) { const key = screen === "boss" ? continent.id : `${continent.id}-level`; setProgress((old) => ({ ...old, stars: old.stars + Math.max(1, Math.round(score / 10)), completed: screen === "location" && !old.completed.includes(key) ? [...old.completed, key] : old.completed, bosses: screen === "boss" && !old.bosses.includes(key) ? [...old.bosses, key] : old.bosses, unlocked: Math.min(continents.length, Math.max(old.unlocked, selectedContinent + 2)) })); setScreen("result"); return; } setQuestionIndex(questionIndex + 1); setAnswerState("idle"); setSelectedAnswer(""); setMarker(null); setShowHint(false); }
  function resetProgress() { if (window.confirm("確定要清除所有探險紀錄嗎？")) setProgress(defaultProgress); }

  return <main className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => setScreen("home")} aria-label="回到世界地圖"><span className="brand-mark">✦</span><span>GeoQuest <small>世界地理探險隊</small></span></button><div className="top-stats"><span>⭐ {progress.stars}</span><span>🏅 {progress.bosses.length}</span><button className="reset-link" onClick={resetProgress}>重置進度</button></div></header>

    {screen === "home" && <>
      <section className="map-hero"><div className="map-hero-copy"><span className="eyebrow">WORLD MAP · 世界任務中心</span><h1>看地圖，<em>玩遍全世界。</em></h1><p>點擊地圖上的國家，認識它在哪一洲；再用位置題與國旗魔王關，挑戰你的地理直覺。</p><button className="primary-button" onClick={() => startLocation()}>開始世界地圖挑戰 <span>→</span></button><div className="map-legend"><span><i className="legend-dot orange" />亞洲</span><span><i className="legend-dot blue" />歐洲</span><span><i className="legend-dot green" />非洲</span><span><i className="legend-dot pink" />美洲</span></div></div><div className="mini-globe"><WorldCountryLayer className="mini-country-layer" /><span>七大洲<br /><b>19 個國家</b></span></div></section>
      <section className="world-dashboard"><div className="dashboard-head"><div><span className="strip-label">EXPLORE THE WORLD</span><h2>世界互動地圖</h2></div><div className="dashboard-actions"><span>已探索 {progress.completed.length} / 7 洲</span><button onClick={() => startLocation()}>開始定位考驗 →</button></div></div><div className="map-and-info"><div className="interactive-world-map" aria-label="世界互動地圖"><WorldCountryLayer /><div className="map-grid" /><div className="equator" /><span className="equator-label">赤道 EQUATOR</span>{countryPins.map((country) => <button key={country.id} className={`country-pin pin-${country.continent.replace("洲", "")}`} style={{ left: `${country.x}%`, top: `${country.y}%` }} onClick={() => chooseCountry(country)} aria-label={`查看${country.name}`}><i>{country.flag}</i><b>{country.name}</b></button>)}<div className="map-compass">N<br /><span>✦</span></div></div><aside className="country-info">{selectedCountry ? <><div className="country-flag-large">{selectedCountry.flag}</div><span className="eyebrow">{selectedCountry.continent}</span><h3>{selectedCountry.name}</h3><p><b>首都</b> {selectedCountry.capital}</p><p>{selectedCountry.fact}</p><button className="primary-button small" onClick={() => startLocation(continents.findIndex((item) => item.name === selectedCountry.continent), selectedCountry)}>考考我：{selectedCountry.name} →</button></> : <><div className="info-compass">🧭</div><span className="eyebrow">SELECT A COUNTRY</span><h3>點擊地圖上的國家</h3><p>選一個國家查看國旗、首都與地理小知識，再開始定位挑戰。</p><div className="info-tip">💡 先從亞洲試試看！</div></>}</aside></div></section>
      <section className="continent-section compact"><div className="section-heading"><div><span className="strip-label">THE SEVEN CONTINENTS</span><h2>七大洲任務</h2></div></div><div className="continent-grid">{continents.map((item, index) => <button className={`continent-card ${index > progress.unlocked ? "locked" : ""}`} key={item.id} style={{ "--card-color": item.color } as React.CSSProperties} onClick={() => index <= progress.unlocked && startLocation(index)}><span className="continent-emoji">{item.emoji}</span><h3>{item.name}</h3><span className="english">{item.english}</span><p>{item.fact}</p><span className="card-footer">{index > progress.unlocked ? "🔒 完成前一洲後解鎖" : "進入任務 →"}</span></button>)}</div></section>
    </>}

    {screen === "location" && <section className="game-screen"><div className="game-header"><button className="back-button" onClick={() => setScreen("home")}>← 返回世界地圖</button><div className="game-progress"><span>📍 {locationTarget.continent}定位任務</span><div><i style={{ width: `${(questionIndex / total) * 100}%` }} /></div><small>{questionIndex + 1} / {total}</small></div><span className="live-score">⭐ {score}</span></div><div className="question-layout"><aside className="mission-aside"><span className="eyebrow">MAP CHALLENGE</span><h2>請在地圖上找到{locationTarget.name}</h2><p>點擊你認為正確的國家位置。答對會獲得地理小知識！</p><div className="tip-box"><span>💡</span><div><b>探險提示</b><p>{showHint ? `${locationTarget.name}的首都是${locationTarget.capital}。` : "需要線索嗎？"}</p></div></div>{!showHint && <button className="text-button" onClick={() => setShowHint(true)}>顯示提示 →</button>}</aside><div className="map-panel"><div className="interactive-world-map game-map"><WorldCountryLayer /><div className="map-grid" />{marker && <span className={`map-pin ${answerState}`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>📍</span>} {answerState !== "idle" && <span className="answer-target" style={{ left: `${locationTarget.x}%`, top: `${locationTarget.y}%` }}>◎</span>}<button className="map-click-layer" onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); answerMap(((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height * 100)); }} aria-label="點擊世界地圖回答" /></div>{answerState !== "idle" && <div className={`feedback ${answerState}`}><span>{answerState === "correct" ? "🎉" : "🧭"}</span><div><b>{answerState === "correct" ? "定位成功！" : `差一點！正確答案是${locationTarget.name}`}</b><p>{locationTarget.fact}</p></div><button onClick={nextQuestion}>{questionIndex + 1 >= total ? "完成任務" : "下一題 →"}</button></div>}</div></div></section>}

    {screen === "boss" && <section className="game-screen boss-screen"><div className="game-header"><button className="back-button" onClick={() => setScreen("home")}>← 返回世界地圖</button><div className="game-progress"><span>⚔️ {continent.name}國旗魔王</span><div><i style={{ width: `${(questionIndex / total) * 100}%` }} /></div><small>{questionIndex + 1} / {total}</small></div><span className="live-score">⭐ {score}</span></div><div className="boss-intro"><span className="eyebrow">FLAG BOSS · FINAL CHECK</span><h1>國旗辨識魔王關</h1><p>看國旗，選出正確的國家。</p></div><div className="flag-card"><div className="flag-visual">{flagQuestion.flag}</div><div className="flag-question"><span>這是哪一個國家的國旗？</span><h2>選出正確答案</h2><div className="flag-options">{flagQuestion.options.map((option) => <button key={option} className={selectedAnswer === option ? answerState : ""} disabled={answerState !== "idle"} onClick={() => answerFlag(option)}>{option}</button>)}</div>{answerState !== "idle" && <div className={`flag-feedback ${answerState}`}><b>{answerState === "correct" ? "答對了！國旗偵探 🔥" : `答案是：${flagQuestion.country}`}</b><p>{flagQuestion.explanation}</p><button className="primary-button small" onClick={nextQuestion}>{questionIndex + 1 >= total ? "完成魔王關" : "下一面旗 →"}</button></div>}</div></div></section>}

    {screen === "result" && <section className="result-screen"><div className="result-badge">🏆</div><span className="eyebrow">MISSION COMPLETE</span><h1>任務完成！</h1><p>你已經完成這次地理挑戰，繼續探索下一個洲吧。</p><div className="result-stats"><div><strong>{score}</strong><span>本次分數</span></div><div><strong>⭐ {Math.max(1, Math.round(score / 10))}</strong><span>獲得星星</span></div></div><div className="result-actions"><button className="primary-button" onClick={startBoss}>挑戰國旗魔王 <span>⚔️</span></button><button className="secondary-button" onClick={() => setScreen("home")}>回到世界地圖</button></div></section>}
    <footer className="site-footer"><span>GeoQuest © 2026</span><span>探索．思考．認識世界</span></footer>
  </main>;
}
