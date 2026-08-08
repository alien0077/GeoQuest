"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { geoCentroid, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { countryStudyData, countryStudyNames, taiwanAllyMapNames, type CountryStudy } from "./country-data";

type Continent = { id: string; name: string; english: string; color: string; emoji: string; fact: string };
type CountryPin = CountryStudy & { id: string; x: number; y: number };
type FlagQuestion = { country: string; flag: string; options: string[]; explanation: string };
type WorldTopology = {
  type: "Topology";
  objects: { countries: { type: "GeometryCollection"; geometries: unknown[] } };
  arcs: unknown[];
  transform?: unknown;
};
type StudyMode = "continent" | "country" | "allies";
type Spotlight = { x: number; y: number; label: string };
type MapCountrySelection = { name: string; x: number; y: number };
type MapPosition = { x: number; y: number };
type MapColorMode = "country" | "revealed" | "highlighted";

const mapNameByCountryId: Record<string, string> = {
  ca: "Canada", us: "United States of America", mx: "Mexico", br: "Brazil", ar: "Argentina",
  fr: "France", it: "Italy", no: "Norway", eg: "Egypt", ng: "Nigeria", za: "South Africa",
  in: "India", cn: "China", tw: "Taiwan", jp: "Japan", th: "Thailand", au: "Australia", nz: "New Zealand", aq: "Antarctica",
};

const continentSpotlights: Record<string, Spotlight> = {
  asia: { x: 71, y: 43, label: "亞洲位置" }, europe: { x: 50, y: 31, label: "歐洲位置" }, africa: { x: 52, y: 62, label: "非洲位置" },
  "north-america": { x: 20, y: 38, label: "北美洲位置" }, "south-america": { x: 32, y: 70, label: "南美洲位置" },
  oceania: { x: 80, y: 78, label: "大洋洲位置" }, antarctica: { x: 51, y: 93, label: "南極洲位置" },
};

const countryPalette = ["#f2a07b", "#f5c85f", "#8fc9df", "#d98caf", "#a9d477", "#b9a0dc", "#efa2a2", "#79c6b8", "#e2b879", "#9fb9e8", "#d2a7d1", "#c4d98a"];

function countryColor(mapName: string) {
  const hash = [...mapName].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 7);
  return countryPalette[hash % countryPalette.length];
}

function WorldCountryLayer({ className = "", highlightedNames = [], coloredNames = [], revealedNames = [], selectedName, muted = false, preserveAspectRatio = "none", colorMode = "country", focusContinent, onCountrySelect, onCountryPositions }: { className?: string; highlightedNames?: string[]; coloredNames?: string[]; revealedNames?: string[]; selectedName?: string; muted?: boolean; preserveAspectRatio?: "none" | "xMidYMid meet"; colorMode?: MapColorMode; focusContinent?: string; onCountrySelect?: (country: MapCountrySelection) => void; onCountryPositions?: (positions: Record<string, MapPosition>) => void }) {
  const [world, setWorld] = useState<WorldTopology | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const basePath = window.location.pathname.startsWith("/GeoQuest") ? "/GeoQuest/" : "/";
    fetch(`${basePath}data/countries-110m.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`國界資料載入失敗：${response.status}`);
        return response;
      })
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
    const focusFeatures = focusContinent
      ? countries.features.filter((country) => countryStudyData[String(country.properties?.name)]?.continent === focusContinent)
      : [];
    const projectionTarget = focusFeatures.length > 0
      ? { type: "FeatureCollection", features: focusFeatures }
      : countries;
    const projection = geoNaturalEarth1().fitExtent(focusContinent ? [[28, 24], [972, 496]] : [[0, 0], [1000, 520]], projectionTarget as never);
    const path = geoPath(projection);
    return countries.features
      .map((country, index) => {
        const point = projection(geoCentroid(country));
        return { id: country.id ?? index, name: country.properties?.name, x: point?.[0] ?? 500, y: point?.[1] ?? 260, d: path(country) ?? "" };
      })
      .filter((country) => country.d);
  }, [countries, focusContinent]);

  useEffect(() => {
    if (onCountryPositions && paths.length) onCountryPositions(Object.fromEntries(paths.map((country) => [String(country.name), { x: (country.x / 1000) * 100, y: (country.y / 520) * 100 }])));
  }, [onCountryPositions, paths]);

  return <svg className={`country-outline-layer ${className}`} viewBox="0 0 1000 520" preserveAspectRatio={preserveAspectRatio} role="img" aria-label="世界各國國界輪廓">
    <title>世界各國國界輪廓</title>
    {paths.map((country) => {
      const countryName = String(country.name);
      const handleSelect = () => onCountrySelect?.({ name: countryName, x: (country.x / 1000) * 100, y: (country.y / 520) * 100 });
      const hasCountryColor = colorMode === "country" || coloredNames.includes(countryName) || revealedNames.includes(countryName) || (colorMode === "highlighted" && highlightedNames.includes(countryName));
      return <path key={country.id} data-country-name={countryName} d={country.d} className={`country-outline ${muted ? "country-outline-muted" : ""} ${countryName === "Taiwan" ? "country-outline-taiwan" : ""} ${hasCountryColor ? "country-outline-revealed" : ""} ${highlightedNames.includes(countryName) ? "country-outline-active" : ""} ${selectedName === countryName ? "country-outline-selected" : ""}`} style={hasCountryColor ? { "--country-fill": countryColor(countryName) } as React.CSSProperties : undefined} onClick={onCountrySelect ? handleSelect : undefined} onKeyDown={onCountrySelect ? (event) => { if (event.key === "Enter" || event.key === " ") handleSelect(); } : undefined} role={onCountrySelect ? "button" : undefined} tabIndex={onCountrySelect ? 0 : undefined} aria-label={onCountrySelect ? `選擇${countryName}` : undefined} />;
    })}
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

const countryIdByMapName = Object.fromEntries(Object.entries(mapNameByCountryId).map(([id, mapName]) => [mapName, id]));
const featuredCoordinates: Record<string, { x: number; y: number }> = {
  Canada: { x: 19, y: 29 }, "United States of America": { x: 21, y: 42 }, Mexico: { x: 24, y: 55 }, Brazil: { x: 34, y: 69 }, Argentina: { x: 30, y: 84 },
  France: { x: 47, y: 36 }, Italy: { x: 51, y: 43 }, Norway: { x: 50, y: 22 }, Egypt: { x: 53, y: 51 }, Nigeria: { x: 48, y: 61 }, "South Africa": { x: 52, y: 82 },
  India: { x: 65, y: 52 }, China: { x: 71, y: 40 }, Taiwan: { x: 76, y: 49 }, Japan: { x: 80, y: 42 }, Thailand: { x: 70, y: 60 }, Australia: { x: 78, y: 78 }, "New Zealand": { x: 88, y: 85 }, Antarctica: { x: 51, y: 94 },
};

function buildCountryPin(mapName: string, x = 50, y = 50, id = countryIdByMapName[mapName] || `map-${mapName}`): CountryPin {
  const study = countryStudyData[mapName];
  if (!study) throw new Error(`缺少國家學習資料：${mapName}`);
  return { ...study, id, x, y };
}

const countryPins = Object.entries(featuredCoordinates).map(([mapName, position]) => buildCountryPin(mapName, position.x, position.y));
const allCountryPins = countryStudyNames.map((mapName) => buildCountryPin(mapName, featuredCoordinates[mapName]?.x, featuredCoordinates[mapName]?.y));
const taiwanAllyCoordinates: Record<string, { x: number; y: number }> = {
  "Marshall Islands": { x: 98.02, y: 44.76 }, Palau: { x: 87.74, y: 44.52 }, Tuvalu: { x: 100.21, y: 54.55 }, eSwatini: { x: 54, y: 80 }, "Holy See": { x: 53.2, y: 22.93 },
  Belize: { x: 26, y: 52 }, Guatemala: { x: 25, y: 55 }, Haiti: { x: 34, y: 53 }, Paraguay: { x: 32, y: 77 }, "St. Kitts and Nevis": { x: 32.6, y: 38.35 }, "Saint Lucia": { x: 33.01, y: 40.52 }, "Saint Vincent and the Grenadines": { x: 32.92, y: 40.99 },
};
const taiwanAllyPins = taiwanAllyMapNames.map((mapName) => buildCountryPin(mapName, taiwanAllyCoordinates[mapName].x, taiwanAllyCoordinates[mapName].y));
const taiwanPin = countryPins.find((country) => country.mapName === "Taiwan") || buildCountryPin("Taiwan");
function clampMapValue(value: number, minimum: number, maximum: number) { return Math.max(minimum, Math.min(maximum, value)); }
function oceanLabelPosition(country: CountryPin, anchor: MapPosition) {
  const y = clampMapValue(anchor.y, 8, 90);
  if (country.mapName === "Taiwan") return { x: 88, y: clampMapValue(anchor.y - 3, 8, 90) };
  if (country.continent === "非洲") return { x: 40, y };
  if (country.continent === "歐洲") return { x: anchor.x > 58 ? 68 : 42, y: clampMapValue(anchor.y - 4, 8, 90) };
  if (country.continent === "亞洲") return { x: 88, y };
  if (country.continent === "北美洲") return { x: anchor.x < 30 ? 11 : 46, y };
  if (country.continent === "南美洲") return { x: anchor.x < 35 ? 20 : 45, y };
  if (country.continent === "南極洲") return { x: 65, y: 94 };
  return { x: 92, y };
}

function MapCountryMarker({ country, anchor, selected, ally = false, taiwan = false, onClick }: { country: CountryPin; anchor: MapPosition; selected: boolean; ally?: boolean; taiwan?: boolean; onClick: () => void }) {
  const label = oceanLabelPosition(country, anchor);
  const dx = label.x - anchor.x;
  const dy = label.y - anchor.y;
  const verticalScale = 520 / 1000;
  const length = Math.sqrt(dx ** 2 + (dy * verticalScale) ** 2);
  const angle = Math.atan2(dy * verticalScale, dx) * (180 / Math.PI);
  const percent = (value: number) => `${value.toFixed(2)}%`;
  return <>
    {length > 1 && <span className="map-leader-line" data-country-id={country.id} aria-hidden="true" style={{ left: percent(anchor.x), top: percent(anchor.y), width: percent(length), transform: `rotate(${angle.toFixed(2)}deg)` }} />}
    <button className={`country-pin ${ally ? "ally-pin" : ""} ${taiwan ? "taiwan-pin" : ""} ${selected ? "study-selected-pin" : ""}`} data-country-id={country.id} style={{ left: percent(label.x), top: percent(label.y) }} onClick={onClick} aria-label={`查看${country.name}`}><i>{country.flag}</i><b>{country.name}</b></button>
  </>;
}

function StudyCard({ mode, continent, country, onStart, onSelectCountry, allies, selectedAlly, onClearAlly, canStart = true }: { mode: StudyMode; continent: Continent; country: CountryPin; onStart: () => void; onSelectCountry: (country: CountryPin) => void; allies: CountryPin[]; selectedAlly: CountryPin | null; onClearAlly: () => void; canStart?: boolean }) {
  if (mode === "allies" && selectedAlly) {
    return <aside className="country-info study-card ally-country-study-card">
      <span className="eyebrow">TAIWAN ALLIES · 台灣邦交國</span>
      <div className="country-flag-large">{selectedAlly.flag}</div>
      <span className="eyebrow">{selectedAlly.continent}</span>
      <h3>{selectedAlly.name}</h3>
      <div className="country-facts">
        <p><b>首都</b><span>{selectedAlly.capital}</span></p>
        <p><b>人口</b><span>{selectedAlly.population}</span></p>
        <p><b>發展概略</b><span>{selectedAlly.development}</span></p>
        <p><b>政體</b><span>{selectedAlly.government}</span></p>
        <p><b>歷史</b><span>{selectedAlly.history}</span></p>
        <p><b>產業／資源</b><span>{selectedAlly.economy}</span></p>
      </div>
      <div className="study-card-note"><b>在地圖上看</b><span>亮起的國家輪廓就是{selectedAlly.name}的位置。</span></div>
      <button className="text-button" onClick={onClearAlly}>← 返回邦交國列表</button>
      {canStart && <button className="primary-button small" onClick={onStart}>學會了，開始定位考驗 →</button>}
    </aside>;
  }
  if (mode === "allies") {
    return <aside className="country-info study-card ally-study-card">
      <span className="eyebrow">TAIWAN ALLIES · 台灣邦交國</span>
      <div className="study-card-icon">🤝</div>
      <h3>台灣邦交國</h3>
      <p>先從地圖認識台灣的邦交國分布，再點選任一國家查看完整學習卡片。</p>
      <div className="ally-summary"><b>{allies.length} 個邦交國</b><span>亞太、非洲、歐洲與拉丁美洲及加勒比海</span></div>
      <div className="ally-list">{allies.map((ally) => <button key={ally.id} onClick={() => onSelectCountry(ally)}><span>{ally.flag} {ally.name}</span><small>{ally.continent}</small></button>)}</div>
    </aside>;
  }
  if (mode === "continent") {
    const examples = allCountryPins.filter((item) => item.continent === continent.name).slice(0, 4);
    return <aside className="country-info study-card">
      <span className="eyebrow">CONTINENT STUDY · 考前先學習</span>
      <div className="study-card-icon">{continent.emoji}</div>
      <h3>{continent.name}</h3>
      <span className="english">{continent.english}</span>
      <p>{continent.fact}</p>
      <div className="study-card-note"><b>在地圖上看</b><span>位於世界地圖的{continent.name}區域，亮起的國家是此洲的學習範例。</span></div>
      <div className="study-examples">{examples.map((item) => <span key={item.id}>{item.flag} {item.name}</span>)}</div>
      {canStart ? <button className="primary-button small" onClick={onStart}>學會了，開始定位考驗 →</button> : <div className="study-card-note"><b>學習提示</b><span>先觀察它與台灣及鄰近國家的相對位置。</span></div>}
    </aside>;
  }

  return <aside className="country-info study-card">
    <span className="eyebrow">COUNTRY STUDY · 考前先學習</span>
    <div className="country-flag-large">{country.flag}</div>
    <span className="eyebrow">{country.continent}</span>
    <h3>{country.name}</h3>
    <div className="country-facts">
      <p><b>首都</b><span>{country.capital}</span></p>
      <p><b>人口</b><span>{country.population}</span></p>
      <p><b>發展概略</b><span>{country.development}</span></p>
      <p><b>政體</b><span>{country.government}</span></p>
      <p><b>歷史</b><span>{country.history}</span></p>
      <p><b>產業／資源</b><span>{country.economy}</span></p>
    </div>
    <div className="study-card-note"><b>在地圖上看</b><span>亮起的國家輪廓就是{country.name}的位置。</span></div>
    {canStart ? <button className="primary-button small" onClick={onStart}>學會了，開始定位考驗 →</button> : <div className="study-card-note"><b>學習提示</b><span>先觀察它與台灣及鄰近國家的相對位置。</span></div>}
  </aside>;
}

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

const flagExplanations: Record<string, string> = {
  日本: "白底紅日象徵太陽，也呼應日本「日出之國」的稱呼。",
  巴西: "黃色菱形、藍色圓球與星空是巴西國旗的重要辨識特徵。",
  加拿大: "中央楓葉是加拿大的國家象徵。",
  法國: "藍、白、紅三條直條組成法國國旗。",
  印度: "中央藍色法輪象徵正義、進步與持續運轉。",
  南非: "Y 字形象徵不同民族與文化走向團結。",
};

const flagQuestionPool: FlagQuestion[] = allCountryPins.map((country) => ({
  country: country.name,
  flag: country.flag,
  options: [country.name],
  explanation: flagExplanations[country.name] || `${country.name}的國旗是辨識這個國家的重要線索。`,
}));

function buildFlagQuestionSet(continentName: string) {
  const countryPool = allCountryPins.filter((country) => country.continent === continentName);
  const questionPool = countryPool.length >= 5 ? countryPool : allCountryPins;
  return shuffle(questionPool).slice(0, 5).map((country) => {
    const distractors = shuffle(questionPool.filter((candidate) => candidate.id !== country.id)).slice(0, 3).map((candidate) => candidate.name);
    const base = flagQuestionPool.find((question) => question.country === country.name) || flagQuestionPool[0];
    return { ...base, options: shuffle([country.name, ...distractors]) };
  });
}

function buildInitialFlagQuestionSet(continentName: string) {
  const countryPool = allCountryPins.filter((country) => country.continent === continentName);
  const questionPool = countryPool.length >= 5 ? countryPool : allCountryPins;
  return questionPool.slice(0, 5).map((country, index) => {
    const distractors = questionPool.filter((candidate) => candidate.id !== country.id).slice(index, index + 3).map((candidate) => candidate.name);
    const base = flagQuestionPool.find((question) => question.country === country.name) || flagQuestionPool[0];
    return { ...base, options: [country.name, ...distractors] };
  });
}

const defaultProgress = { stars: 0, completed: [] as string[], bosses: [] as string[], unlocked: 0 };
function readProgress() { if (typeof window === "undefined") return defaultProgress; try { return { ...defaultProgress, ...JSON.parse(localStorage.getItem("geo-quest-progress") || "{}") }; } catch { return defaultProgress; } }

export default function Home() {
  const [progress, setProgress] = useState(defaultProgress);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [screen, setScreen] = useState<"home" | "location" | "boss" | "result">("home");
  const [selectedCountry, setSelectedCountry] = useState<CountryPin | null>(null);
  const [selectedContinent, setSelectedContinent] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [locationQuestions, setLocationQuestions] = useState<CountryPin[]>([]);
  const [score, setScore] = useState(0);
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [clickedCountryName, setClickedCountryName] = useState<string | null>(null);
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [studyMode, setStudyMode] = useState<StudyMode>("continent");
  const [studyContinentId, setStudyContinentId] = useState("asia");
  const [studyCountryId, setStudyCountryId] = useState("jp");
  const [studyMapCountry, setStudyMapCountry] = useState<CountryPin | null>(null);
  const [mapPositions, setMapPositions] = useState<Record<string, MapPosition>>({});
  const [bossQuestions, setBossQuestions] = useState<FlagQuestion[]>(() => buildInitialFlagQuestionSet(continents[0].name));

  useEffect(() => { const storedProgress = readProgress(); startTransition(() => { setProgress(storedProgress); setProgressLoaded(true); }); }, []);
  useEffect(() => { if (progressLoaded) localStorage.setItem("geo-quest-progress", JSON.stringify(progress)); }, [progress, progressLoaded]);
  const continent = continents[selectedContinent];
  const scheduledTarget = locationQuestions[questionIndex] || selectedCountry || countryPins[(selectedContinent + questionIndex) % countryPins.length];
  const locationTarget = { ...scheduledTarget, ...(mapPositions[scheduledTarget.mapName] || {}) };
  const studyContinent = continents.find((item) => item.id === studyContinentId) || continents[0];
  const studyCountry = studyMapCountry || allCountryPins.find((item) => item.id === studyCountryId) || allCountryPins[0];
  const studyCountryPosition = mapPositions[studyCountry.mapName] || { x: studyCountry.x, y: studyCountry.y };
  const studySpotlight = studyMode === "country" ? { ...studyCountryPosition, label: `${studyCountry.name}位置` } : studyMode === "allies" ? { x: 56, y: 58, label: "台灣邦交國分布" } : continentSpotlights[studyContinent.id];
  const studyHighlightNames = studyMode === "country"
    ? [studyCountry.mapName]
    : studyMode === "allies" ? taiwanAllyMapNames : allCountryPins.filter((item) => item.continent === studyContinent.name).map((item) => item.mapName);
  const studyColoredNames = studyMode === "allies" && studyMapCountry ? [studyMapCountry.mapName] : studyHighlightNames;
  const studyBoundaryNames = studyMode === "allies" ? [] : studyHighlightNames;
  const studyFocusContinent = studyMode === "continent" ? studyContinent.name : studyMode === "country" || studyMapCountry ? studyCountry.continent : undefined;
  const visibleStudyPins = studyMode === "country" ? [studyCountry] : studyMapCountry ? [studyMapCountry] : [];
  const flagQuestion = bossQuestions[questionIndex % bossQuestions.length] || flagQuestionPool[0];
  const total = screen === "boss" ? 5 : 3;

  function startLocation(index = Math.min(progress.unlocked, continents.length - 1), country: CountryPin | null = null) {
    const continentName = continents[index]?.name || continents[0].name;
    const pool = allCountryPins.filter((item) => item.continent === continentName);
    const shuffledPool = shuffle(pool.length ? pool : countryPins);
    const questions = country ? [country, ...shuffledPool.filter((item) => item.id !== country.id)] : shuffledPool;
    setSelectedContinent(index); setSelectedCountry(country); setLocationQuestions(questions); setQuestionIndex(0); setScore(0); setAnswerState("idle"); setSelectedAnswer(""); setClickedCountryName(null); setMarker(null); setShowHint(false); setScreen("location");
  }
  function startBoss() { setBossQuestions(buildFlagQuestionSet(continent.name)); setQuestionIndex(0); setScore(0); setAnswerState("idle"); setSelectedAnswer(""); setScreen("boss"); }
  function chooseCountry(country: CountryPin) { setSelectedCountry(country); setStudyMode("country"); setStudyCountryId(country.id); setStudyMapCountry(null); setSelectedContinent(Math.max(0, continents.findIndex((item) => item.name === country.continent))); }
  function chooseStudyAlly(country: CountryPin) {
    setStudyMode("allies"); setStudyMapCountry(country); setSelectedCountry(null); setStudyCountryId(country.id); setSelectedContinent(Math.max(0, continents.findIndex((item) => item.name === country.continent)));
  }
  function chooseMapCountry(mapCountry: MapCountrySelection) {
    const country = countryStudyData[mapCountry.name];
    if (!country) return;
    const selected = buildCountryPin(mapCountry.name, mapCountry.x, mapCountry.y);
    if (studyMode === "allies") {
      if (taiwanAllyMapNames.includes(mapCountry.name)) chooseStudyAlly(selected);
      return;
    }
    chooseCountry(selected);
    setStudyMapCountry(selected);
  }
  function chooseStudyContinent(id: string) { setStudyMode("continent"); setStudyContinentId(id); setStudyMapCountry(null); setSelectedCountry(null); }
  function chooseStudyAllies() { setStudyMode("allies"); setStudyMapCountry(null); setSelectedCountry(null); }
  function chooseStudyCountry(id: string) { const country = allCountryPins.find((item) => item.id === id); if (!country) return; setStudyMode("country"); setStudyCountryId(id); setStudyMapCountry(null); setSelectedCountry(null); }
  function startStudyChallenge() { const target = studyMode === "country" || (studyMode === "allies" && studyMapCountry) ? studyCountry : allCountryPins.find((item) => item.continent === studyContinent.name) || allCountryPins[0]; const continentIndex = continents.findIndex((item) => item.name === target.continent); if (continentIndex >= 0) startLocation(continentIndex, target); }
  function answerMap(x: number, y: number, selectedMapName?: string) { if (answerState !== "idle") return; if (selectedMapName) setClickedCountryName(selectedMapName); setMarker({ x, y }); const d = Math.sqrt((x - locationTarget.x) ** 2 + (y - locationTarget.y) ** 2); const correct = selectedMapName ? selectedMapName === locationTarget.mapName : d < 9; setAnswerState(correct ? "correct" : "wrong"); if (correct) setScore(score + (showHint ? 70 : 100)); }
  function answerFlag(option: string) { if (answerState !== "idle") return; setSelectedAnswer(option); setAnswerState(option === flagQuestion.country ? "correct" : "wrong"); if (option === flagQuestion.country) setScore(score + 100); }
  function nextQuestion() { if (questionIndex + 1 >= total) { const key = screen === "boss" ? continent.id : `${continent.id}-level`; setProgress((old) => ({ ...old, stars: old.stars + Math.max(1, Math.round(score / 10)), completed: screen === "location" && !old.completed.includes(key) ? [...old.completed, key] : old.completed, bosses: screen === "boss" && !old.bosses.includes(key) ? [...old.bosses, key] : old.bosses, unlocked: Math.min(continents.length, Math.max(old.unlocked, selectedContinent + 2)) })); setScreen("result"); return; } setQuestionIndex(questionIndex + 1); setAnswerState("idle"); setSelectedAnswer(""); setClickedCountryName(null); setMarker(null); setShowHint(false); }
  function resetProgress() { if (window.confirm("確定要清除所有探險紀錄嗎？")) setProgress(defaultProgress); }

  return <main className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => setScreen("home")} aria-label="回到世界地圖"><span className="brand-mark">✦</span><span>GeoQuest <small>世界地理探險隊</small></span></button><div className="top-stats"><span>⭐ {progress.stars}</span><span>🏅 {progress.bosses.length}</span><button className="reset-link" onClick={resetProgress}>重置進度</button></div></header>

    {screen === "home" && <>
      <section className="map-hero"><div className="map-hero-copy"><span className="eyebrow">WORLD MAP · 世界任務中心</span><h1>看地圖，<em>玩遍全世界。</em></h1><p>點擊地圖上的國家，認識它在哪一洲；再用位置題與國旗魔王關，挑戰你的地理直覺。</p><button className="primary-button" onClick={() => startLocation()}>開始世界地圖挑戰 <span>→</span></button><div className="map-legend"><span><i className="legend-dot orange" />亞洲</span><span><i className="legend-dot blue" />歐洲</span><span><i className="legend-dot green" />非洲</span><span><i className="legend-dot pink" />美洲</span></div></div><div className="mini-globe-wrap"><div className="mini-globe"><WorldCountryLayer className="mini-country-layer" muted preserveAspectRatio="xMidYMid meet" /></div><span className="mini-globe-card">七大洲<br /><b>20 個國家</b></span></div></section>
      <section className="world-dashboard">
        <div className="dashboard-head"><div><span className="strip-label">BEFORE THE QUIZ</span><h2>考前先學習</h2><p className="dashboard-subtitle">先選一個洲或國家，從地圖認識它的位置，再開始考驗。</p></div><div className="dashboard-actions"><span>已探索 {progress.completed.length} / 7 洲</span><button onClick={() => startLocation()}>直接開始定位 →</button></div></div>
        <div className="study-toolbar">
          <div className="study-tabs" role="tablist" aria-label="學習分類"><button className={`study-tab ${studyMode === "continent" ? "active" : ""}`} onClick={() => chooseStudyContinent(studyContinent.id)} role="tab" aria-selected={studyMode === "continent"}>先學七大洲</button><button className={`study-tab ${studyMode === "country" ? "active" : ""}`} onClick={() => chooseStudyCountry(studyCountry.id)} role="tab" aria-selected={studyMode === "country"}>先學國家位置</button><button className={`study-tab ${studyMode === "allies" ? "active" : ""}`} onClick={chooseStudyAllies} role="tab" aria-selected={studyMode === "allies"}>台灣邦交國</button></div>
          {studyMode === "continent" ? <div className="study-choice-row" aria-label="選擇洲">{continents.map((item) => <button key={item.id} className={`study-choice ${studyContinent.id === item.id ? "active" : ""}`} onClick={() => chooseStudyContinent(item.id)}><span>{item.emoji}</span>{item.name}</button>)}</div> : studyMode === "allies" ? <div className="ally-toolbar"><span>🤝 台灣邦交國</span><b>{taiwanAllyPins.length} 國</b><small>點選地圖標記或右側卡片查看介紹</small></div> : <label className="study-select-label">選擇國家<select value={studyCountry.id} onChange={(event) => chooseStudyCountry(event.target.value)}>{continents.map((item) => <optgroup key={item.id} label={`${item.emoji} ${item.name}`}>{allCountryPins.filter((country) => country.continent === item.name).map((country) => <option key={country.id} value={country.id}>{country.flag} {country.name}</option>)}</optgroup>)}</select></label>}
        </div>
        <div className="map-and-info"><div className="interactive-world-map" aria-label="世界互動地圖"><WorldCountryLayer colorMode="highlighted" coloredNames={studyColoredNames} focusContinent={studyFocusContinent} highlightedNames={studyBoundaryNames} selectedName={studyMode === "country" ? studyCountry.mapName : undefined} onCountrySelect={chooseMapCountry} onCountryPositions={setMapPositions} /><div className="map-grid" />{studyMode === "country" && studySpotlight && <><div className={`study-spotlight ${studyMode}`} style={{ left: `${studySpotlight.x}%`, top: `${studySpotlight.y}%` }} aria-hidden="true"><span>✦</span></div><span className="study-location-label" style={{ left: `${studySpotlight.x}%`, top: `${studySpotlight.y}%` }}>{studySpotlight.label}</span></>}<div className="equator" /><span className="equator-label">赤道 EQUATOR</span>{visibleStudyPins.filter((country) => country.mapName !== "Taiwan").map((country) => <MapCountryMarker key={country.id} country={country} anchor={mapPositions[country.mapName] || { x: country.x, y: country.y }} selected={(studyMode === "country" || studyMode === "allies") && studyCountry.id === country.id} ally={studyMode === "allies"} onClick={() => studyMode === "allies" ? chooseStudyAlly(country) : chooseCountry(country)} />)}<MapCountryMarker key="taiwan-reference" country={taiwanPin} taiwan anchor={mapPositions[taiwanPin.mapName] || { x: taiwanPin.x, y: taiwanPin.y }} selected={studyMode === "country" && studyCountry.id === taiwanPin.id} onClick={() => chooseCountry(taiwanPin)} /><div className="map-compass">N<br /><span>✦</span></div></div><StudyCard mode={studyMode} continent={studyContinent} country={studyCountry} onStart={startStudyChallenge} onSelectCountry={studyMode === "allies" ? chooseStudyAlly : chooseCountry} allies={taiwanAllyPins} selectedAlly={studyMapCountry} onClearAlly={() => setStudyMapCountry(null)} canStart={continents.some((item) => item.name === studyCountry.continent)} /></div>
      </section>
      <section className="continent-section compact"><div className="section-heading"><div><span className="strip-label">THE SEVEN CONTINENTS</span><h2>七大洲任務</h2></div></div><div className="continent-grid">{continents.map((item, index) => <button className={`continent-card ${index > progress.unlocked ? "locked" : ""}`} key={item.id} style={{ "--card-color": item.color } as React.CSSProperties} onClick={() => index <= progress.unlocked && startLocation(index)}><span className="continent-emoji">{item.emoji}</span><h3>{item.name}</h3><span className="english">{item.english}</span><p>{item.fact}</p><span className="card-footer">{index > progress.unlocked ? "🔒 完成前一洲後解鎖" : "進入任務 →"}</span></button>)}</div></section>
    </>}

    {screen === "location" && <section className="game-screen"><div className="game-header"><button className="back-button" onClick={() => setScreen("home")}>← 返回世界地圖</button><div className="game-progress"><span>📍 {locationTarget.continent}定位任務</span><div><i style={{ width: `${(questionIndex / total) * 100}%` }} /></div><small>{questionIndex + 1} / {total}</small></div><span className="live-score">⭐ {score}</span></div><div className="question-layout"><aside className="mission-aside"><span className="eyebrow">MAP CHALLENGE</span><h2>請在地圖上找到{locationTarget.name}</h2><p>點擊你認為正確的國家位置。答對會獲得地理小知識！</p><div className="tip-box"><span>💡</span><div><b>探險提示</b><p>{showHint ? `${locationTarget.name}的首都是${locationTarget.capital}。` : "需要線索嗎？"}</p></div></div>{!showHint && <button className="text-button" onClick={() => setShowHint(true)}>顯示提示 →</button>}</aside><div className="map-panel"><div className="interactive-world-map game-map"><WorldCountryLayer colorMode="revealed" focusContinent={locationTarget.continent} revealedNames={[clickedCountryName, ...(answerState !== "idle" ? [locationTarget.mapName] : [])].filter((name): name is string => Boolean(name))} onCountryPositions={setMapPositions} onCountrySelect={(mapCountry) => answerMap(mapCountry.x, mapCountry.y, mapCountry.name)} /><div className="map-grid" />{marker && <span className={`map-pin ${answerState}`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>📍</span>} {answerState !== "idle" && <span className="answer-target" style={{ left: `${locationTarget.x}%`, top: `${locationTarget.y}%` }}>◎</span>}<button className="map-click-layer" onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); answerMap(((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100); }} aria-label="點擊世界地圖回答" /></div>{answerState !== "idle" && <div className={`feedback ${answerState}`}><span>{answerState === "correct" ? "🎉" : "🧭"}</span><div><b>{answerState === "correct" ? "定位成功！" : `差一點！正確答案是${locationTarget.name}`}</b><p>{locationTarget.history}</p></div><button onClick={nextQuestion}>{questionIndex + 1 >= total ? "完成任務" : "下一題 →"}</button></div>}</div></div></section>}

    {screen === "boss" && <section className="game-screen boss-screen"><div className="game-header"><button className="back-button" onClick={() => setScreen("home")}>← 返回世界地圖</button><div className="game-progress"><span>⚔️ {continent.name}國旗魔王</span><div><i style={{ width: `${(questionIndex / total) * 100}%` }} /></div><small>{questionIndex + 1} / {total}</small></div><span className="live-score">⭐ {score}</span></div><div className="boss-intro"><span className="eyebrow">FLAG BOSS · FINAL CHECK</span><h1>國旗辨識魔王關</h1><p>看國旗，選出正確的國家。</p></div><div className="flag-card"><div className="flag-visual">{flagQuestion.flag}</div><div className="flag-question"><span>這是哪一個國家的國旗？</span><h2>選出正確答案</h2><div className="flag-options">{flagQuestion.options.map((option) => <button key={option} className={selectedAnswer === option ? answerState : ""} disabled={answerState !== "idle"} onClick={() => answerFlag(option)}>{option}</button>)}</div>{answerState !== "idle" && <div className={`flag-feedback ${answerState}`}><b>{answerState === "correct" ? "答對了！國旗偵探 🔥" : `答案是：${flagQuestion.country}`}</b><p>{flagQuestion.explanation}</p><button className="primary-button small" onClick={nextQuestion}>{questionIndex + 1 >= total ? "完成魔王關" : "下一面旗 →"}</button></div>}</div></div></section>}

    {screen === "result" && <section className="result-screen"><div className="result-badge">🏆</div><span className="eyebrow">MISSION COMPLETE</span><h1>任務完成！</h1><p>你已經完成這次地理挑戰，繼續探索下一個洲吧。</p><div className="result-stats"><div><strong>{score}</strong><span>本次分數</span></div><div><strong>⭐ {Math.max(1, Math.round(score / 10))}</strong><span>獲得星星</span></div></div><div className="result-actions"><button className="primary-button" onClick={startBoss}>挑戰國旗魔王 <span>⚔️</span></button><button className="secondary-button" onClick={() => setScreen("home")}>回到世界地圖</button></div></section>}
    <footer className="site-footer"><span>GeoQuest © 2026</span><span>探索．思考．認識世界</span></footer>
  </main>;
}
