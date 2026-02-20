import { useState, useEffect, useCallback } from "react";
import { Moon, Sun, Droplets, Leaf, Heart, TrendingUp, ChevronLeft, ChevronRight, Download, Upload } from "lucide-react";

/* ─── Design Tokens ─────────────────────────────────────────── */
// bg:        #f9f6f1  (warm off-white)
// text:      #3A3D38  (near-black warm)
// muted:     #999
// morning:   #CA9BAB  (dusty rose/mauve)
// evening:   #5B3C44  (deep plum)
// week:      #8B8D78  (sage olive)
// selected:  #b7ad76  (olive gold, date border)
// card:      #ffffff
// chip-bg:   #f0ede8  (warm chip default)

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

/* ─── Chip component ─────────────────────────────────────────── */
function Chip({ label, active, theme = "morning", onClick }) {
  const themes = {
    morning: active
      ? "background:#CA9BAB;color:white;border-color:#CA9BAB"
      : "background:#f0ede8;color:#3A3D38;border-color:transparent",
    evening: active
      ? "background:#5B3C44;color:white;border-color:#5B3C44"
      : "background:#f0ede8;color:#3A3D38;border-color:transparent",
    green: active
      ? "background:#4a7c59;color:white;border-color:#4a7c59"
      : "background:#f0ede8;color:#3A3D38;border-color:transparent",
    cat: active
      ? "background:#CA9BAB;color:white;border-color:#CA9BAB"
      : "background:#f0ede8;color:#3A3D38;border-color:transparent",
  };
  return (
    <button
      onClick={onClick}
      style={{ cssText: themes[theme] }}
      className="px-3 py-2 rounded-full text-sm border transition-all"
    >
      {label}
    </button>
  );
}

/* ─── Slider component ───────────────────────────────────────── */
function Slider({ label, val, onChange }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label style={{ color: "#666", fontSize: 13 }}>{label}</label>
        <span style={{ color: "#5B3C44", fontSize: 20, fontWeight: 300 }}>{val}</span>
      </div>
      <input
        type="range" min="1" max="10" value={val}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full"
        style={{ accentColor: "#5B3C44" }}
      />
    </div>
  );
}

export default function App() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [view, setView] = useState("home");
  const [activeDate, setActiveDate] = useState(todayStr);
  const [allEntries, setAllEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [saveStatus, setSaveStatus] = useState("");

  /* Load Google Font for title */
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Zen+Antique+Soft&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("gizi-entries");
    if (saved) {
      try { setAllEntries(JSON.parse(saved)); } catch (e) { console.error(e); }
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
    const avgWater = wEntries.length
      ? (wEntries.reduce((s, e) => s + (e.habits?.water || 0), 0) / wEntries.length).toFixed(1)
      : 0;
    const habitTotals = {};
    ["walk","focus","stretching","vitamins","reading"].forEach(k => {
      habitTotals[k] = dates.filter(d => allEntries[d]?.habits?.[k]).length;
    });
    return { colors, plants: plants.size, avgWater, habitTotals };
  };

  const SLEEP_QUALITY  = ["😴 Restful","😐 Okay","😵 Poor","🔄 Restless"];
  const DISRUPTIONS    = ["🌙 Woke during night","🐱 Cat care","💭 Racing thoughts","🚽 Bathroom","🔥 Too hot","❄️ Too cold","🛏️ Uncomfortable","💪 Back/body pain","🔊 Noise"];
  const MORNING_STATE  = ["⚡ Energized","😊 Rested","😑 Tired but okay","🥱 Exhausted","🤕 Groggy"];
  const DIGESTIVE      = ["🔥 Reflux","💨 Bloating","😣 Discomfort","🩸 Period","😴 Fatigue","🤕 Headache"];
  const COMMON_PLANTS  = ["Avocado","Broccoli","Apple","Raspberry","Oats","Cinnamon","Ginger","Lentils","Chickpeas","Spinach","Kale","Carrot","Banana","Blueberry","Pumpkin seeds","Walnut","Flaxseed","Garlic","Turmeric","Onion","Sweet potato","Beetroot","Parsley","Dill","Cumin","Fennel","Rye","Barley","Brown rice","Quinoa"];

  /* ─── Date Bar (shared) ────────────────────────────────────── */
  const DateBar = () => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 6 + i);
      return d.toISOString().split("T")[0];
    });
    return (
      <div style={{ marginBottom: 20 }}>
        {activeDate !== todayStr && (
          <button
            onClick={() => setActiveDate(todayStr)}
            style={{ color: "#b7ad76", fontSize: 13, marginBottom: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            ← Back to today
          </button>
        )}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {dates.map(d => {
            const e = allEntries[d];
            const isToday = d === todayStr;
            const isActive = d === activeDate;
            const dayLabel = new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short" });
            const dayNum   = new Date(d + "T12:00:00").getDate();
            return (
              <button key={d} onClick={() => setActiveDate(d)}
                style={{
                  flexShrink: 0, minWidth: 52, padding: "10px 8px",
                  borderRadius: 12, textAlign: "center", cursor: "pointer",
                  background: "white",
                  border: isActive ? "3px solid #b7ad76" : "3px solid transparent",
                  color: isActive ? "#3A3D38" : "#666",
                  transition: "all 0.15s"
                }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 3 }}>{dayLabel}</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{dayNum}</div>
                {e?.dayColor ? (
                  <div style={{
                    width: 7, height: 7, borderRadius: "50%", margin: "4px auto 0",
                    background: e.dayColor === "Green" ? "#6bb87a" : e.dayColor === "Yellow" ? "#f5a623" : "#e05c5c"
                  }} />
                ) : <div style={{ height: 11 }} />}
                {isToday && <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>today</div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  /* ─── Morning View ─────────────────────────────────────────── */
  const MorningView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Moon size={24} color="#CA9BAB" />
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 400, color: "#3A3D38" }}>Morning Check-in</h2>
          <div style={{ fontSize: 12, color: "#999" }}>{fmt(activeDate)}</div>
        </div>
      </div>

      <DateBar />

      {/* Times */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[["Bedtime","bedtime"],["Wake time","waketime"]].map(([lbl, k]) => (
          <div key={k}>
            <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 8 }}>{lbl}</label>
            <input type="time" value={entry.sleep[k]}
              onChange={e => updateEntry({ sleep: { [k]: e.target.value } })}
              style={{
                width: "100%", padding: "10px 12px", border: "2px solid #e0dcd6",
                borderRadius: 12, fontSize: 16, color: "#3A3D38", background: "white",
                outline: "none"
              }}
              onFocus={e => e.target.style.borderColor = "#CA9BAB"}
              onBlur={e => e.target.style.borderColor = "#e0dcd6"}
            />
          </div>
        ))}
      </div>

      {/* Duration */}
      {entry.sleep.bedtime && entry.sleep.waketime && (() => {
        const [bh, bm] = entry.sleep.bedtime.split(":").map(Number);
        const [wh, wm] = entry.sleep.waketime.split(":").map(Number);
        let mins = (wh * 60 + wm) - (bh * 60 + bm);
        if (mins < 0) mins += 1440;
        const h = Math.floor(mins / 60), m = mins % 60;
        return (
          <div style={{ textAlign: "center", fontSize: 13, color: "#CA9BAB", background: "#f7f0f3", borderRadius: 12, padding: "10px 0" }}>
            Sleep duration: <strong>{h}h {m}m</strong>
          </div>
        );
      })()}

      {/* Sleep chips */}
      {[
        ["Sleep quality", SLEEP_QUALITY, "quality"],
        ["What disrupted your sleep?", DISRUPTIONS, "disruptions"],
        ["How do you feel this morning?", MORNING_STATE, "morningState"],
      ].map(([lbl, opts, key]) => (
        <div key={key}>
          <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 10 }}>{lbl}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {opts.map(o => (
              <Chip key={o} label={o} active={entry.sleep[key].includes(o)} theme="morning"
                onClick={() => toggleChip("sleep", key, o)} />
            ))}
          </div>
        </div>
      ))}

      <button onClick={() => setView("home")}
        style={{ width: "100%", padding: "15px 0", borderRadius: 16, border: "none", background: "#CA9BAB", color: "white", fontSize: 16, fontWeight: 500, cursor: "pointer" }}>
        Done ✨
      </button>
    </div>
  );

  /* ─── Evening View ─────────────────────────────────────────── */
  const EveningView = () => {
    const [plantInput, setPlantInput]   = useState("");
    const [winText, setWinText]         = useState(entry.reflection.win || "");
    const [struggleText, setStruggle]   = useState(entry.reflection.struggle || "");
    const [goalText, setGoalText]       = useState(entry.tomorrowGoal || "");

    const addPlant = (p) => {
      const name = (p || "").trim();
      if (!name || entry.nutrition.plants.includes(name)) return;
      updateEntry({ nutrition: { plants: [...entry.nutrition.plants, name] } });
      setPlantInput("");
    };
    const removePlant = (p) => updateEntry({ nutrition: { plants: entry.nutrition.plants.filter(x => x !== p) } });

    const inputStyle = {
      width: "100%", padding: "11px 14px", border: "2px solid #e0dcd6",
      borderRadius: 12, fontSize: 14, color: "#3A3D38", background: "white",
      fontFamily: "inherit", outline: "none", boxSizing: "border-box"
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Sun size={24} color="#5B3C44" />
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 400, color: "#3A3D38" }}>Evening Check-in</h2>
            <div style={{ fontSize: 12, color: "#999" }}>{fmt(activeDate)}</div>
          </div>
        </div>

        <DateBar />

        {/* Day color */}
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 10 }}>How was this day?</label>
          <div style={{ display: "flex", gap: 10 }}>
            {[["Green","#4a7c59"],["Yellow","#c8973a"],["Red","#c0484a"]].map(([c, col]) => (
              <button key={c} onClick={() => updateEntry({ dayColor: c })}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer",
                  fontWeight: 500, fontSize: 14, transition: "all 0.15s",
                  background: entry.dayColor === c ? col : "#f0ede8",
                  color: entry.dayColor === c ? "white" : "#3A3D38",
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Habits */}
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 10 }}>Habits</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[["walk","🚶 Morning walk"],["focus","🎯 Deep focus"],["stretching","🧘 Core stretching"],["vitamins","💊 Vitamins"],["reading","📖 Reading"],["period","🩸 Period day"]].map(([k, lbl]) => (
              <button key={k} onClick={() => updateEntry({ habits: { [k]: !entry.habits[k] } })}
                style={{
                  padding: "8px 16px", borderRadius: 20, fontSize: 13, border: "none", cursor: "pointer",
                  background: entry.habits[k] ? "#5B3C44" : "#f0ede8",
                  color: entry.habits[k] ? "white" : "#3A3D38",
                  transition: "all 0.15s"
                }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Water */}
        <div style={{ background: "white", padding: 20, borderRadius: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#666", marginBottom: 14 }}>
            <Droplets size={14} />Water (dl)
          </label>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <button onClick={() => updateEntry({ habits: { water: Math.max(0, (entry.habits.water||0) - 1) } })}
              style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: "#f0ede8", fontSize: 24, cursor: "pointer", color: "#3A3D38" }}>−</button>
            <span style={{ fontSize: 32, fontWeight: 300, color: "#3A3D38", minWidth: 80, textAlign: "center" }}>{entry.habits.water} dl</span>
            <button onClick={() => updateEntry({ habits: { water: (entry.habits.water||0) + 1 } })}
              style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: "#f0ede8", fontSize: 24, cursor: "pointer", color: "#3A3D38" }}>+</button>
          </div>
        </div>

        {/* Plants */}
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 10 }}>
            <Leaf size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
            Plants — <span style={{ color: "#4a7c59", fontWeight: 600 }}>{entry.nutrition.plants.length} logged</span>
          </label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input type="text" value={plantInput}
              onChange={e => setPlantInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPlant(plantInput); } }}
              placeholder="Type a plant & press Enter..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={() => addPlant(plantInput)}
              style={{ padding: "0 18px", background: "#4a7c59", color: "white", border: "none", borderRadius: 12, fontSize: 14, cursor: "pointer" }}>
              Add
            </button>
          </div>
          {/* Quick-add chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: entry.nutrition.plants.length ? 10 : 0 }}>
            {COMMON_PLANTS.filter(p => !entry.nutrition.plants.includes(p)).map(p => (
              <button key={p} onClick={() => addPlant(p)}
                style={{ padding: "4px 12px", background: "#f0ede8", color: "#3A3D38", border: "none", borderRadius: 20, fontSize: 12, cursor: "pointer" }}>
                + {p}
              </button>
            ))}
          </div>
          {/* Logged plants */}
          {entry.nutrition.plants.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {entry.nutrition.plants.map(p => (
                <span key={p} onClick={() => removePlant(p)}
                  style={{ padding: "4px 12px", background: "#e4f0e8", color: "#3a6646", borderRadius: 20, fontSize: 12, cursor: "pointer" }}>
                  {p} ×
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Digestive */}
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 10 }}>Digestive symptoms?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {DIGESTIVE.map(o => (
              <Chip key={o} label={o} active={entry.nutrition.digestiveSymptoms.includes(o)} theme="evening"
                onClick={() => toggleChip("nutrition","digestiveSymptoms",o)} />
            ))}
          </div>
          {entry.nutrition.digestiveSymptoms.length > 0 && (
            <input type="text" value={entry.nutrition.digestiveCause}
              onChange={e => updateEntry({ nutrition: { digestiveCause: e.target.value } })}
              placeholder="What might have caused it?"
              style={inputStyle}
            />
          )}
        </div>

        {/* Cat time */}
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 10 }}>
            <Heart size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, color: "#CA9BAB" }} />
            Cat time today
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {["Light","Moderate","Intensive"].map(o => (
              <Chip key={o} label={o} active={entry.reflection.catTime === o} theme="cat"
                onClick={() => updateEntry({ reflection: { catTime: o } })} />
            ))}
          </div>
        </div>

        {/* Wellbeing sliders */}
        <div style={{ background: "#f0ede8", padding: 20, borderRadius: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 16 }}>Wellbeing</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[["energy","Energy"],["mood","Mood"],["physical","Physical"],["mentalClarity","Mental Clarity"]].map(([k, lbl]) => (
              <Slider key={k} label={lbl} val={entry.wellbeing[k]} onChange={v => updateEntry({ wellbeing: { [k]: v } })} />
            ))}
          </div>
        </div>

        {/* Reflection */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            ["✨ One win", winText, setWinText, v => updateEntry({ reflection: { win: v } }), true],
            ["🌧 One struggle", struggleText, setStruggle, v => updateEntry({ reflection: { struggle: v } }), true],
          ].map(([lbl, val, setter, onBlur, isTextarea]) => (
            <div key={lbl}>
              <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 6 }}>{lbl}</label>
              <textarea value={val} rows={2}
                onChange={e => setter(e.target.value)}
                onBlur={e => onBlur(e.target.value)}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>
          ))}
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 6 }}>🎯 Tomorrow's goal</label>
            <input type="text" value={goalText}
              onChange={e => setGoalText(e.target.value)}
              onBlur={e => updateEntry({ tomorrowGoal: e.target.value })}
              placeholder="What's your focus tomorrow?"
              style={inputStyle}
            />
          </div>
        </div>

        <button onClick={() => setView("home")}
          style={{ width: "100%", padding: "15px 0", borderRadius: 16, border: "none", background: "#5B3C44", color: "#f9f6f1", fontSize: 16, fontWeight: 500, cursor: "pointer" }}>
          Save & Finish 💚
        </button>
      </div>
    );
  };

  /* ─── Week View ────────────────────────────────────────────── */
  const WeekView = () => {
    const stats = weekStats(weekStart);
    const dates = getWeekDates(weekStart);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Week navigator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d); }}
            style={{ padding: 8, border: "none", background: "#f0ede8", borderRadius: 10, cursor: "pointer" }}>
            <ChevronLeft size={20} color="#3A3D38" />
          </button>
          <h2 style={{ fontSize: 15, fontWeight: 400, color: "#3A3D38" }}>
            {weekStart.toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – {new Date(dates[6]).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
          </h2>
          <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d); }}
            style={{ padding: 8, border: "none", background: "#f0ede8", borderRadius: 10, cursor: "pointer" }}>
            <ChevronRight size={20} color="#3A3D38" />
          </button>
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {["M","T","W","T","F","S","S"].map((d, i) => {
            const e = allEntries[dates[i]];
            const isToday = dates[i] === todayStr;
            const bg = e?.dayColor === "Green" ? "#4a7c59"
              : e?.dayColor === "Yellow" ? "#c8973a"
              : e?.dayColor === "Red"    ? "#c0484a"
              : "#f0ede8";
            const col = e?.dayColor ? "white" : "#999";
            return (
              <button key={i} onClick={() => { setActiveDate(dates[i]); setView("evening"); }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0",
                  borderRadius: 12, border: isToday ? "2px solid #b7ad76" : "2px solid transparent",
                  background: bg, color: col, cursor: "pointer", fontSize: 12
                }}>
                <span style={{ opacity: 0.7 }}>{d}</span>
                <span style={{ fontWeight: 600 }}>{new Date(dates[i]).getDate()}</span>
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 11, textAlign: "center", color: "#999" }}>Tap a day to edit it</p>

        {/* Color counts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[["Green","#e8f4ec","#4a7c59",stats.colors.Green],["Yellow","#fdf6e3","#c8973a",stats.colors.Yellow],["Red","#fdf0f0","#c0484a",stats.colors.Red]].map(([lbl,bg,col,val]) => (
            <div key={lbl} style={{ background: bg, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 300, color: col }}>{val}</div>
              <div style={{ fontSize: 11, color: col, opacity: 0.7 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Plants & Water */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "#e8f4ec", padding: 18, borderRadius: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 300, color: "#4a7c59" }}>
              {stats.plants}<span style={{ fontSize: 13, color: "#999" }}>/30</span>
            </div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>Plants this week</div>
            <div style={{ height: 6, background: "#c4dec9", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#4a7c59", borderRadius: 3, width: `${Math.min(100,(stats.plants/30)*100)}%`, transition: "width 0.3s" }} />
            </div>
          </div>
          <div style={{ background: "#e8f0f8", padding: 18, borderRadius: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 300, color: "#4a6d9c" }}>
              {stats.avgWater}<span style={{ fontSize: 13, color: "#999" }}> dl</span>
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>Avg water / day</div>
          </div>
        </div>

        {/* Habit bars */}
        <div style={{ background: "#f0ede8", padding: 18, borderRadius: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 14 }}>Habit completion</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["walk","🚶 Walk"],["focus","🎯 Focus"],["stretching","🧘 Stretch"],["vitamins","💊 Vitamins"],["reading","📖 Reading"]].map(([k,lbl]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, width: 80, color: "#666" }}>{lbl}</span>
                <div style={{ flex: 1, height: 6, background: "#ddd8d0", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#8B8D78", borderRadius: 3, width: `${(stats.habitTotals[k]/7)*100}%` }} />
                </div>
                <span style={{ fontSize: 12, color: "#999", width: 28, textAlign: "right" }}>{stats.habitTotals[k]}/7</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ─── Loading ──────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f9f6f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#999" }}>Loading Gizi…</p>
    </div>
  );

  /* ─── Home ─────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#f9f6f1" }}>

      {/* Save toast */}
      {saveStatus && (
        <div style={{ position: "fixed", top: 16, right: 16, background: "white", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", borderRadius: 12, padding: "8px 18px", fontSize: 13, color: "#3A3D38", zIndex: 50, border: "1px solid #f0ede8" }}>
          {saveStatus}
        </div>
      )}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 80px" }}>

        {/* ── HOME ── */}
        {view === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Title */}
            <div style={{ textAlign: "center", paddingTop: 28, paddingBottom: 8 }}>
              <h1 style={{ fontFamily: "'Zen Antique Soft', serif", fontSize: 56, fontWeight: 400, color: "#3A3D38", marginBottom: 4, letterSpacing: 1 }}>Gizi</h1>
              <p style={{ color: "#999", fontSize: 13, letterSpacing: 1 }}>· Your gentle rebuild companion ·</p>
            </div>

            {/* Date strip */}
            <div style={{ background: "white", borderRadius: 20, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              {activeDate !== todayStr && (
                <p style={{ fontSize: 12, textAlign: "center", color: "#b7ad76", marginBottom: 10, cursor: "pointer" }}
                  onClick={() => setActiveDate(todayStr)}>← Back to today</p>
              )}
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - 6 + i);
                  const ds = d.toISOString().split("T")[0];
                  const e = allEntries[ds];
                  const isToday = ds === todayStr;
                  const isActive = ds === activeDate;
                  return (
                    <button key={ds} onClick={() => setActiveDate(ds)}
                      style={{
                        flexShrink: 0, minWidth: 52, padding: "10px 8px", borderRadius: 12,
                        textAlign: "center", cursor: "pointer", background: "white",
                        border: isActive ? "3px solid #b7ad76" : "3px solid transparent",
                        color: isActive ? "#3A3D38" : "#666", transition: "all 0.15s"
                      }}>
                      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 3 }}>
                        {d.toLocaleDateString("en-GB",{weekday:"short"})}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{d.getDate()}</div>
                      {e?.dayColor ? (
                        <div style={{ width: 7, height: 7, borderRadius: "50%", margin: "4px auto 0",
                          background: e.dayColor==="Green"?"#6bb87a":e.dayColor==="Yellow"?"#f5a623":"#e05c5c" }} />
                      ) : <div style={{ height: 11 }} />}
                      {isToday && <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>today</div>}
                    </button>
                  );
                })}
              </div>
              {activeDate !== todayStr && (
                <p style={{ fontSize: 11, textAlign: "center", color: "#b7ad76", marginTop: 8 }}>Editing: {fmt(activeDate)}</p>
              )}
            </div>

            {/* Nav cards */}
            <button onClick={() => setView("morning")}
              style={{ width: "100%", background: "#CA9BAB", color: "white", padding: "18px 20px", borderRadius: 18, border: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <Moon size={24} color="white" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Morning Check-in</div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>Log your sleep</div>
              </div>
              {allEntries[activeDate]?.sleep?.bedtime && <span style={{ fontSize: 18 }}>✓</span>}
            </button>

            <button onClick={() => setView("evening")}
              style={{ width: "100%", background: "#5B3C44", color: "white", padding: "18px 20px", borderRadius: 18, border: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <Sun size={24} color="white" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Evening Check-in</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Habits, plants & reflection</div>
              </div>
              {allEntries[activeDate]?.dayColor && <span style={{ fontSize: 18 }}>✓</span>}
            </button>

            <button onClick={() => setView("week")}
              style={{ width: "100%", background: "#8B8D78", color: "white", padding: "18px 20px", borderRadius: 18, border: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <TrendingUp size={24} color="white" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Week View</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>See your patterns</div>
              </div>
            </button>

            {/* At a glance */}
            <div style={{ background: "white", padding: "18px 20px", borderRadius: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: "#3A3D38", marginBottom: 14 }}>
                {activeDate === todayStr ? `${new Date(todayStr + "T12:00:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})} at a glance` : `${fmt(activeDate)} at a glance`}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 10, columnGap: 16, fontSize: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#999", display: "flex", alignItems: "center", gap: 5 }}>
                    <Moon size={13} /> Sleep
                  </span>
                  <span style={{ color: "#3A3D38" }}>
                    {allEntries[activeDate]?.sleep?.bedtime
                      ? `${allEntries[activeDate].sleep.bedtime} → ${allEntries[activeDate].sleep.waketime}`
                      : "○"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#999", display: "flex", alignItems: "center", gap: 5 }}>
                    <Heart size={13} /> Day
                  </span>
                  <span style={{
                    fontWeight: 600,
                    color: allEntries[activeDate]?.dayColor === "Green" ? "#4a7c59"
                      : allEntries[activeDate]?.dayColor === "Yellow" ? "#c8973a"
                      : allEntries[activeDate]?.dayColor === "Red"    ? "#c0484a"
                      : "#ccc"
                  }}>
                    {allEntries[activeDate]?.dayColor || "○"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#999", display: "flex", alignItems: "center", gap: 5 }}>
                    <Leaf size={13} /> Plants
                  </span>
                  <span style={{ color: "#4a7c59", fontWeight: 600 }}>
                    {allEntries[activeDate]?.nutrition?.plants?.length || 0}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#999", display: "flex", alignItems: "center", gap: 5 }}>
                    <Droplets size={13} /> Water
                  </span>
                  <span style={{ color: "#3A3D38", fontWeight: 600 }}>
                    {allEntries[activeDate]?.habits?.water || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Export / Import — subtle links */}
            <div style={{ display: "flex", justifyContent: "center", gap: 32, paddingTop: 4, paddingBottom: 8 }}>
              <button
                onClick={() => {
                  const data = localStorage.getItem("gizi-entries");
                  const blob = new Blob([data], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `gizi-backup-${todayStr}.json`; a.click();
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
                <Download size={14} /> Export data
              </button>
              <button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file"; input.accept = "*/*";
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        try {
                          localStorage.setItem("gizi-entries", ev.target.result);
                          setAllEntries(JSON.parse(ev.target.result));
                          alert("Data imported successfully! ✓");
                        } catch { alert("Failed to import ✗"); }
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
                <Upload size={14} /> Import data
              </button>
            </div>

          </div>
        )}

        {view === "morning" && <MorningView />}
        {view === "evening" && <EveningView />}
        {view === "week"    && <WeekView />}

        {view !== "home" && (
          <button onClick={() => setView("home")}
            style={{ marginTop: 24, background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 14 }}>
            ← Back to Home
          </button>
        )}

      </div>
    </div>
  );
}
