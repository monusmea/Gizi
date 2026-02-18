import { useState, useEffect, useCallback } from "react";
import { Moon, Sun, Droplets, Leaf, Heart, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

const EMPTY_ENTRY = {
  sleep: { bedtime: "", waketime: "", quality: [], disruptions: [], morningState: [] },
  habits: { walk: false, focus: false, stretching: false, vitamins: false, reading: false, water: 0, period: false },
  nutrition: { plants: [], digestiveSymptoms: [], digestiveCause: "" },
  wellbeing: { energy: 5, mood: 5, physical: 5, mentalClarity: 5 },
  reflection: { win: "", struggle: "", catTime: "" },
  dayColor: "",
  tomorrowGoal: ""
};

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  return new Date(date);
}

function getWeekDates(startDate) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function deepMerge(base, override) {
  const result = { ...base };
  for (const key of Object.keys(override || {})) {
    if (override[key] !== null && typeof override[key] === "object" && !Array.isArray(override[key])) {
      result[key] = deepMerge(base[key] || {}, override[key]);
    } else if (override[key] !== undefined) {
      result[key] = override[key];
    }
  }
  return result;
}

function fmt(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export default function App() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [view, setView] = useState("home");
  const [activeDate, setActiveDate] = useState(todayStr);
  const [allEntries, setAllEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("gizi-entries");
    if (saved) {
      try {
        setAllEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load data:", e);
      }
    }
    setLoading(false);
  }, []);

  const persist = useCallback((newAll) => {
    try {
      localStorage.setItem("gizi-entries", JSON.stringify(newAll));
      setSaveStatus("Saved ✓");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      setSaveStatus("Save failed ✗");
      console.error("Failed to save:", e);
    }
  }, []);

  const entry = deepMerge(EMPTY_ENTRY, allEntries[activeDate] || {});

  const updateEntry = useCallback((patch) => {
    const updated = deepMerge(entry, patch);
    const newAll = { ...allEntries, [activeDate]: updated };
    setAllEntries(newAll);
    persist(newAll);
  }, [entry, allEntries, activeDate, persist]);

  const toggleChip = (category, subcategory, value) => {
    const current = entry[category][subcategory] || [];
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    updateEntry({ [category]: { [subcategory]: next } });
  };

  const weekStats = (wStart) => {
    const dates = getWeekDates(wStart);
    const wEntries = dates.map(d => allEntries[d]).filter(Boolean);
    const colors = { Green: 0, Yellow: 0, Red: 0 };
    wEntries.forEach(e => { if (e.dayColor) colors[e.dayColor]++; });
    const plants = new Set();
    wEntries.forEach(e => e.nutrition?.plants?.forEach(p => plants.add(p)));
    const avgWater = wEntries.length ? (wEntries.reduce((s, e) => s + (e.habits?.water || 0), 0) / wEntries.length).toFixed(1) : 0;
    const habitTotals = {};
    ["walk","focus","stretching","vitamins","reading"].forEach(k => {
      habitTotals[k] = dates.filter(d => allEntries[d]?.habits?.[k]).length;
    });
    return { colors, plants: plants.size, avgWater, habitTotals };
  };

  const SLEEP_QUALITY = ["😴 Restful","😐 Okay","😵 Poor","🔄 Restless"];
  const DISRUPTIONS = ["🌙 Woke during night","🐱 Cat care","💭 Racing thoughts","🚽 Bathroom","🔥 Too hot","❄️ Too cold","🛏️ Uncomfortable","💪 Back/body pain","🔊 Noise"];
  const MORNING_STATE = ["⚡ Energized","😊 Rested","😑 Tired but okay","🥱 Exhausted","🤕 Groggy"];
  const DIGESTIVE = ["🔥 Reflux","💨 Bloating","😣 Discomfort","🩸 Period","😴 Fatigue","🤕 Headache"];
  const COMMON_PLANTS = ["Avocado","Broccoli","Apple","Raspberry","Oats","Cinnamon","Ginger","Lentils","Chickpeas","Spinach","Kale","Carrot","Banana","Blueberry","Pumpkin seeds","Walnut","Flaxseed","Garlic","Turmeric","Onion","Sweet potato","Beetroot","Parsley","Dill","Cumin","Fennel","Rye","Barley","Brown rice","Quinoa"];

  const Chip = ({ label, active, color, onClick }) => {
    const cls = {
      indigo: active ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200",
      rose: active ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200",
      amber: active ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200",
      orange: active ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200",
    };
    return <button onClick={onClick} className={`px-3 py-2 rounded-full text-sm transition-all ${cls[color] || cls.indigo}`}>{label}</button>;
  };

  const Slider = ({ label, val, onChange }) => (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm text-gray-600">{label}</label>
        <span className="text-xl font-light text-indigo-500">{val}</span>
      </div>
      <input type="range" min="1" max="10" value={val} onChange={e => onChange(parseInt(e.target.value))} className="w-full accent-indigo-500" />
    </div>
  );

  const DateBar = () => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      return d.toISOString().split("T")[0];
    });
    return (
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4">
        {dates.map(d => {
          const e = allEntries[d];
          const isToday = d === todayStr;
          const isActive = d === activeDate;
          const dayLabel = new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short" });
          const dayNum = new Date(d + "T12:00:00").getDate();
          return (
            <button key={d} onClick={() => setActiveDate(d)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all min-w-[52px] ${
                isActive ? "bg-indigo-500 text-white shadow-md" : "bg-white/70 text-gray-600 hover:bg-gray-100"
              }`}>
              <span className="text-xs opacity-70">{dayLabel}</span>
              <span className="text-base font-medium">{dayNum}</span>
              {e?.dayColor && (
                <span className={`w-2 h-2 rounded-full mt-1 ${
                  e.dayColor === "Green" ? "bg-green-400" :
                  e.dayColor === "Yellow" ? "bg-yellow-400" : "bg-red-400"
                }`} />
              )}
              {isToday && <span className="text-xs opacity-60 mt-0.5">today</span>}
            </button>
          );
        })}
        <div className="flex-shrink-0 flex flex-col items-center justify-center px-2">
          <input type="date" value={activeDate} max={todayStr}
            onChange={e => setActiveDate(e.target.value)}
            className="text-xs text-indigo-500 bg-transparent border border-indigo-200 rounded-lg p-1 cursor-pointer w-10 opacity-60 hover:opacity-100" />
          <span className="text-xs text-gray-400 mt-1">older</span>
        </div>
      </div>
    );
  };

  const MorningView = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Moon className="text-indigo-500" size={26} />
        <div>
          <h2 className="text-xl font-light">Morning Check-in</h2>
          <p className="text-xs text-gray-400">{fmt(activeDate)}</p>
        </div>
      </div>
      <DateBar />

      <div className="grid grid-cols-2 gap-3">
        {[["Bedtime", "bedtime"],["Wake time", "waketime"]].map(([lbl, k]) => (
          <div key={k}>
            <label className="block text-sm text-gray-600 mb-1">{lbl}</label>
            <input type="time" value={entry.sleep[k]}
              onChange={e => updateEntry({ sleep: { [k]: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm" />
          </div>
        ))}
      </div>

      {entry.sleep.bedtime && entry.sleep.waketime && (() => {
        const [bh, bm] = entry.sleep.bedtime.split(":").map(Number);
        const [wh, wm] = entry.sleep.waketime.split(":").map(Number);
        let mins = (wh * 60 + wm) - (bh * 60 + bm);
        if (mins < 0) mins += 1440;
        const h = Math.floor(mins / 60), m = mins % 60;
        return <div className="text-center text-sm text-indigo-400 bg-indigo-50 rounded-xl py-2">Sleep duration: <strong>{h}h {m}m</strong></div>;
      })()}

      <div>
        <label className="block text-sm text-gray-600 mb-2">Sleep quality</label>
        <div className="flex flex-wrap gap-2">{SLEEP_QUALITY.map(o => <Chip key={o} label={o} active={entry.sleep.quality.includes(o)} color="indigo" onClick={() => toggleChip("sleep","quality",o)} />)}</div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-2">What disrupted your sleep?</label>
        <div className="flex flex-wrap gap-2">{DISRUPTIONS.map(o => <Chip key={o} label={o} active={entry.sleep.disruptions.includes(o)} color="rose" onClick={() => toggleChip("sleep","disruptions",o)} />)}</div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-2">How do you feel this morning?</label>
        <div className="flex flex-wrap gap-2">{MORNING_STATE.map(o => <Chip key={o} label={o} active={entry.sleep.morningState.includes(o)} color="amber" onClick={() => toggleChip("sleep","morningState",o)} />)}</div>
      </div>

      <button onClick={() => setView("home")} className="w-full bg-indigo-500 text-white py-3 rounded-xl hover:bg-indigo-600 transition-colors font-medium">
        Done ✨
      </button>
    </div>
  );

  const EveningView = () => {
    const [plantInput, setPlantInput] = useState("");
    const [winText, setWinText] = useState(entry.reflection.win || "");
    const [struggleText, setStruggleText] = useState(entry.reflection.struggle || "");
    const [goalText, setGoalText] = useState(entry.tomorrowGoal || "");
    
    const addPlant = (p) => {
      const name = (p || "").trim();
      if (!name || entry.nutrition.plants.includes(name)) return;
      updateEntry({ nutrition: { plants: [...entry.nutrition.plants, name] } });
      setPlantInput("");
    };
    const removePlant = (p) => updateEntry({ nutrition: { plants: entry.nutrition.plants.filter(x => x !== p) } });

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Sun className="text-amber-500" size={26} />
          <div>
            <h2 className="text-xl font-light">Evening Check-in</h2>
            <p className="text-xs text-gray-400">{fmt(activeDate)}</p>
          </div>
        </div>
        <DateBar />

        <div>
          <label className="block text-sm text-gray-600 mb-2">How was this day?</label>
          <div className="flex gap-3">
            {[["Green","bg-green-500"],["Yellow","bg-yellow-400"],["Red","bg-red-500"]].map(([c, bg]) => (
              <button key={c} onClick={() => updateEntry({ dayColor: c })}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${entry.dayColor === c ? `${bg} text-white shadow-md` : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Habits</label>
          <div className="grid grid-cols-2 gap-2">
            {[["walk","🚶 Morning walk"],["focus","🎯 Deep focus"],["stretching","🧘 Core stretching"],["vitamins","💊 Vitamins"],["reading","📖 Reading"],["period","🩸 Period day"]].map(([k, lbl]) => (
              <label key={k} className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${entry.habits[k] ? "bg-indigo-50 border border-indigo-200" : "bg-gray-50 border border-transparent hover:bg-gray-100"}`}>
                <input type="checkbox" checked={entry.habits[k]} onChange={e => updateEntry({ habits: { [k]: e.target.checked } })} className="w-4 h-4 accent-indigo-500" />
                <span className="text-sm">{lbl}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2"><Droplets className="inline mr-1" size={13} />Water (glasses)</label>
          <div className="flex items-center gap-4">
            <button onClick={() => updateEntry({ habits: { water: Math.max(0, (entry.habits.water||0) - 1) } })} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-xl">−</button>
            <span className="text-3xl font-light text-indigo-500 w-10 text-center">{entry.habits.water}</span>
            <button onClick={() => updateEntry({ habits: { water: (entry.habits.water||0) + 1 } })} className="w-10 h-10 rounded-full bg-indigo-100 hover:bg-indigo-200 text-xl text-indigo-600">+</button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2"><Leaf className="inline mr-1" size={13} />Plants — <span className="text-green-600 font-medium">{entry.nutrition.plants.length} logged</span></label>
          <div className="flex gap-2 mb-2">
            <input type="text" value={plantInput} onChange={e => setPlantInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPlant(plantInput); } }}
              placeholder="Type a plant & press Enter..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            <button onClick={() => addPlant(plantInput)} className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600">Add</button>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {COMMON_PLANTS.filter(p => !entry.nutrition.plants.includes(p)).map(p => (
              <button key={p} onClick={() => addPlant(p)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200">+ {p}</button>
            ))}
          </div>
          {entry.nutrition.plants.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {entry.nutrition.plants.map(p => (
                <span key={p} onClick={() => removePlant(p)} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors">{p} ×</span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Digestive symptoms?</label>
          <div className="flex flex-wrap gap-2 mb-2">{DIGESTIVE.map(o => <Chip key={o} label={o} active={entry.nutrition.digestiveSymptoms.includes(o)} color="orange" onClick={() => toggleChip("nutrition","digestiveSymptoms",o)} />)}</div>
          {entry.nutrition.digestiveSymptoms.length > 0 && (
            <input type="text" value={entry.nutrition.digestiveCause}
              onChange={e => updateEntry({ nutrition: { digestiveCause: e.target.value } })}
              placeholder="What might have caused it?"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 mt-1" />
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2"><Heart className="inline mr-1 text-pink-400" size={13} />Cat time today</label>
          <div className="flex gap-2">
            {["Light","Moderate","Intensive"].map(o => (
              <button key={o} onClick={() => updateEntry({ reflection: { catTime: o } })}
                className={`flex-1 py-2 rounded-xl text-sm transition-all ${entry.reflection.catTime === o ? "bg-pink-400 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{o}</button>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-xl space-y-4">
          <h3 className="text-sm font-medium text-gray-600">Wellbeing</h3>
          {[["energy","Energy"],["mood","Mood"],["physical","Physical"],["mentalClarity","Mental Clarity"]].map(([k, lbl]) => (
            <Slider key={k} label={lbl} val={entry.wellbeing[k]} onChange={v => updateEntry({ wellbeing: { [k]: v } })} />
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">✨ One win</label>
            <textarea 
              value={winText} 
              onChange={e => setWinText(e.target.value)}
              onBlur={() => updateEntry({ reflection: { win: winText } })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none" 
              rows={2} 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">🌧 One struggle</label>
            <textarea 
              value={struggleText} 
              onChange={e => setStruggleText(e.target.value)}
              onBlur={() => updateEntry({ reflection: { struggle: struggleText } })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none" 
              rows={2} 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">🎯 Tomorrow's goal</label>
            <input 
              type="text" 
              value={goalText} 
              onChange={e => setGoalText(e.target.value)}
              onBlur={() => updateEntry({ tomorrowGoal: goalText })}
              placeholder="What's your focus tomorrow?"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" 
            />
          </div>
        </div>

        <button onClick={() => setView("home")} className="w-full bg-amber-500 text-white py-3 rounded-xl hover:bg-amber-600 transition-colors font-medium">
          Save & Finish 💚
        </button>
      </div>
    );
  };

  const WeekView = () => {
    const stats = weekStats(weekStart);
    const dates = getWeekDates(weekStart);
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d); }} className="p-2 hover:bg-gray-100 rounded-xl"><ChevronLeft size={20} /></button>
          <h2 className="text-base font-light">{weekStart.toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – {new Date(dates[6]).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</h2>
          <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d); }} className="p-2 hover:bg-gray-100 rounded-xl"><ChevronRight size={20} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["M","T","W","T","F","S","S"].map((d, i) => {
            const e = allEntries[dates[i]];
            const isToday = dates[i] === todayStr;
            return (
              <button key={i} onClick={() => { setActiveDate(dates[i]); setView("evening"); }}
                className={`flex flex-col items-center py-2 rounded-xl transition-all text-xs ${isToday ? "ring-2 ring-indigo-300" : ""} ${
                  e?.dayColor === "Green" ? "bg-green-500 text-white" :
                  e?.dayColor === "Yellow" ? "bg-yellow-400 text-white" :
                  e?.dayColor === "Red" ? "bg-red-500 text-white" :
                  "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                <span className="opacity-70">{d}</span>
                <span className="font-medium">{new Date(dates[i]).getDate()}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-center text-gray-400">Tap a day to edit it</p>

        <div className="grid grid-cols-3 gap-2">
          {[["Green","bg-green-50 text-green-700",stats.colors.Green],["Yellow","bg-yellow-50 text-yellow-700",stats.colors.Yellow],["Red","bg-red-50 text-red-700",stats.colors.Red]].map(([lbl,cls,val]) => (
            <div key={lbl} className={`p-3 rounded-xl ${cls} text-center`}>
              <div className="text-2xl font-light">{val}</div>
              <div className="text-xs opacity-70">{lbl}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-50 p-4 rounded-xl">
            <div className="text-2xl font-light text-indigo-600">{stats.plants}<span className="text-sm text-gray-400">/30</span></div>
            <div className="text-xs text-gray-500 mb-2">Plants this week</div>
            <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${Math.min(100,(stats.plants/30)*100)}%` }} />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl">
            <div className="text-2xl font-light text-blue-600">{stats.avgWater}<span className="text-sm text-gray-400"> 🥛</span></div>
            <div className="text-xs text-gray-500">Avg water / day</div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Habit completion</h3>
          <div className="space-y-2">
            {[["walk","🚶 Walk"],["focus","🎯 Focus"],["stretching","🧘 Stretch"],["vitamins","💊 Vitamins"],["reading","📖 Reading"]].map(([k,lbl]) => (
              <div key={k} className="flex items-center gap-3">
                <span className="text-xs w-20 text-gray-600">{lbl}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${(stats.habitTotals[k]/7)*100}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{stats.habitTotals[k]}/7</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center">
      <p className="text-gray-400">Loading Gizi...</p>
    </div>
  );

  const todayEntry = deepMerge(EMPTY_ENTRY, allEntries[todayStr] || {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <div className="max-w-lg mx-auto p-5 pb-16">

        {saveStatus && (
          <div className="fixed top-4 right-4 bg-white shadow-lg rounded-xl px-4 py-2 text-sm text-gray-600 z-50 border border-gray-100">
            {saveStatus}
          </div>
        )}

        {view === "home" && (
          <div className="space-y-5">
            <div className="text-center pt-6 pb-2">
              <h1 className="text-5xl font-light tracking-wide mb-1">Gizi</h1>
              <p className="text-gray-400 text-sm">Your gentle rebuild companion 🐱</p>
            </div>

            <div className="bg-white/70 p-3 rounded-2xl border border-white/80 shadow-sm">
              <p className="text-xs text-gray-400 mb-2 text-center">Select a day to log or edit</p>
              <div className="flex gap-1 overflow-x-auto">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - 6 + i);
                  const ds = d.toISOString().split("T")[0];
                  const e = allEntries[ds];
                  const isToday = ds === todayStr;
                  const isActive = ds === activeDate;
                  return (
                    <button key={ds} onClick={() => setActiveDate(ds)}
                      className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all min-w-[48px] ${
                        isActive ? "bg-indigo-500 text-white" : "hover:bg-gray-100 text-gray-600"}`}>
                      <span className="text-xs opacity-70">{d.toLocaleDateString("en-GB",{weekday:"short"})}</span>
                      <span className="font-medium">{d.getDate()}</span>
                      {e?.dayColor ? (
                        <span className={`w-2 h-2 rounded-full mt-0.5 ${e.dayColor==="Green"?"bg-green-400":e.dayColor==="Yellow"?"bg-yellow-400":"bg-red-400"}`} />
                      ) : <span className="w-2 h-2 mt-0.5" />}
                      {isToday && <span className="text-xs opacity-60">today</span>}
                    </button>
                  );
                })}
              </div>
              {activeDate !== todayStr && (
                <p className="text-xs text-center text-indigo-400 mt-2">Editing: {fmt(activeDate)}</p>
              )}
            </div>

            <div className="space-y-3">
              <button onClick={() => setView("morning")} className="w-full bg-gradient-to-r from-amber-500 to-orange-400 text-white p-5 rounded-2xl hover:shadow-lg transition-all text-left flex items-center gap-4">
                <Moon size={26} />
                <div className="flex-1">
                  <div className="font-medium">Morning Check-in</div>
                  <div className="text-amber-100 text-sm">Log your sleep</div>
                </div>
                {allEntries[activeDate]?.sleep?.bedtime && <span className="text-white text-xl">✓</span>}
              </button>

              <button onClick={() => setView("evening")} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-5 rounded-2xl hover:shadow-lg transition-all text-left flex items-center gap-4">
                <Sun size={26} />
                <div className="flex-1">
                  <div className="font-medium">Evening Check-in</div>
                  <div className="text-indigo-100 text-sm">Habits, plants & reflection</div>
                </div>
                {allEntries[activeDate]?.dayColor && <span className="text-amber-100 text-xl">✓</span>}
              </button>

              <button onClick={() => setView("week")} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-5 rounded-2xl hover:shadow-lg transition-all text-left flex items-center gap-4">
                <TrendingUp size={26} />
                <div className="flex-1">
                  <div className="font-medium">Week View</div>
                  <div className="text-emerald-100 text-sm">See your patterns</div>
                </div>
              </button>

              <button onClick={() => {
  const data = localStorage.getItem("gizi-entries");
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gizi-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
}} className="w-full bg-gradient-to-r from-slate-500 to-gray-600 text-white p-5 rounded-2xl hover:shadow-lg transition-all text-left flex items-center gap-4">
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
  <div className="flex-1">
    <div className="font-medium">Export Data</div>
    <div className="text-gray-200 text-sm">Download backup file</div>
  </div>
</button>


<button onClick={() => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "*/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target.result;
          localStorage.setItem("gizi-entries", data);
          setAllEntries(JSON.parse(data));
          alert("Data imported successfully! ✓");
        } catch (err) {
          alert("Failed to import data ✗");
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}} className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-5 rounded-2xl hover:shadow-lg transition-all text-left flex items-center gap-4">
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
  <div className="flex-1">
    <div className="font-medium">Import Data</div>
    <div className="text-emerald-100 text-sm">Restore from backup</div>
  </div>
</button>

            </div>

            <div className="bg-white/70 p-4 rounded-2xl border border-white/80 shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 mb-3">
                {activeDate === todayStr ? "Today" : fmt(activeDate)} at a glance
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="flex justify-between pr-4"><span className="text-gray-400">Sleep</span>
                  <span>{allEntries[activeDate]?.sleep?.bedtime ? `${allEntries[activeDate].sleep.bedtime} → ${allEntries[activeDate].sleep.waketime}` : "○"}</span>
                </div>
                <div className="flex justify-between pr-4"><span className="text-gray-400">Day</span>
                  <span className={allEntries[activeDate]?.dayColor === "Green" ? "text-green-500 font-medium" : allEntries[activeDate]?.dayColor === "Yellow" ? "text-yellow-500 font-medium" : allEntries[activeDate]?.dayColor === "Red" ? "text-red-500 font-medium" : "text-gray-300"}>
                    {allEntries[activeDate]?.dayColor || "○"}
                  </span>
                </div>
                <div className="flex justify-between pr-4"><span className="text-gray-400">Plants</span><span className="text-green-600 font-medium">{allEntries[activeDate]?.nutrition?.plants?.length || 0}</span></div>
                <div className="flex justify-between pr-4"><span className="text-gray-400">Water</span><span className="text-blue-500 font-medium">{allEntries[activeDate]?.habits?.water || 0} 🥛</span></div>
              </div>
            </div>
          </div>
        )}

        {view === "morning" && <MorningView />}
        {view === "evening" && <EveningView />}
        {view === "week" && <WeekView />}

        {view !== "home" && (
          <button onClick={() => setView("home")} className="mt-5 text-gray-400 hover:text-gray-600 text-sm">← Back to Home</button>
        )}
      </div>
    </div>
  );
}