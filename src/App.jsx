import { useState, useEffect, useCallback } from "react";
import { Moon, Sun, Droplets, Leaf, Heart, TrendingUp, ChevronLeft, ChevronRight, Download, Upload, ChevronDown } from "lucide-react";

/* ─── Design Tokens ─────────────────────────────────────────── */
// bg: #f9f6f1 · text: #3A3D38 · morning: #CA9BAB · evening: #5B3C44
// week: #8B8D78 · selected: #b7ad76 · chip-bg: white

const EMPTY_ENTRY = {
  sleep: { bedtime: "", waketime: "", quality: [], disruptions: [], morningState: [] },
  habits: {
    walk: false, focus: false, stretching: false, reading: false, water: 0,
    period: false,
    vitamins: {
      creatine: false, vitaminB: false, magnesium: false,
      vitaminD: false, vitaminCIron: false, omega3: false, ginkobiloba: false
    }
  },
  nutrition: { plants: [], digestiveSymptoms: [], digestiveCause: "" },
  wellbeing: { energy: 5, mood: 5, physical: 5, mentalClarity: 5 },
  reflection: { win: "", struggle: "", catTime: "" },
  dayColor: "",
  tomorrowGoal: ""
};

const VITAMIN_LIST = [
  { key: "creatine",     label: "Creatine" },
  { key: "vitaminB",     label: "Vitamin B" },
  { key: "magnesium",    label: "Magnesium" },
  { key: "vitaminD",     label: "Vitamin D" },
  { key: "vitaminCIron", label: "Vitamin C + Iron" },
  { key: "omega3",       label: "Omega 3" },
  { key: "ginkobiloba",  label: "Ginkobiloba" },
];

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

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/* ─── Chip ───────────────────────────────────────────────────── */
function Chip({ label, active, theme = "morning", onClick }) {
  const base = { padding: "8px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer", border: "none", transition: "all 0.15s" };
  const themes = {
    morning: active ? { ...base, background: "#CA9BAB", color: "white" } : { ...base, background: "white", color: "#3A3D38" },
    evening: active ? { ...base, background: "#5B3C44", color: "white" } : { ...base, background: "white", color: "#3A3D38" },
    green:   active ? { ...base, background: "#4a7c59", color: "white" } : { ...base, background: "white", color: "#3A3D38" },
    cat:     active ? { ...base, background: "#CA9BAB", color: "white" } : { ...base, background: "white", color: "#3A3D38" },
  };
  return <button onClick={onClick} style={themes[theme] || themes.morning}>{label}</button>;
}

/* ─── Slider ─────────────────────────────────────────────────── */
function Slider({ label, val, onChange }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <label style={{ color: "#666", fontSize: 13 }}>{label}</label>
        <span style={{ color: "#5B3C44", fontSize: 20, fontWeight: 300 }}>{val}</span>
      </div>
      <input type="range" min="1" max="10" value={val}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: "100%", accentColor: "#5B3C44" }} />
    </div>
  );
}

/* ─── VitaminAccordion ───────────────────────────────────────── */
// Stays open while checking; Done button saves & closes
function VitaminAccordion({ vitamins, onToggle }) {
  const [open, setOpen] = useState(false);
  const checkedCount = VITAMIN_LIST.filter(v => vitamins[v.key]).length;
  return (
    <div style={{ background: "white", borderRadius: 14, border: "2px solid #f0ede8", overflow: "hidden" }}>
      {/* Header — only opens, doesn't toggle close */}
      <button
        onClick={() => setOpen(true)}
        style={{ width: "100%", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer" }}>
        <span style={{ fontSize: 13, color: "#666", display: "flex", alignItems: "center", gap: 8 }}>
          💊 Vitamins & Supplements
          {checkedCount > 0 && (
            <span style={{ background: "#5B3C44", color: "white", borderRadius: 20, fontSize: 11, padding: "2px 8px" }}>
              {checkedCount}/{VITAMIN_LIST.length}
            </span>
          )}
        </span>
        <ChevronDown size={16} color="#999"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div style={{ borderTop: "1px solid #f0ede8", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {VITAMIN_LIST.map(({ key, label }) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!vitamins[key]}
                onChange={() => onToggle(key)}
                style={{ width: 17, height: 17, accentColor: "#5B3C44", cursor: "pointer" }} />
              <span style={{ fontSize: 14, color: "#3A3D38" }}>{label}</span>
            </label>
          ))}
          {/* Done button — closes accordion */}
          <button
            onClick={() => setOpen(false)}
            style={{
              marginTop: 6, padding: "10px 0", borderRadius: 12, border: "none",
              background: "#5B3C44", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer"
            }}>
            Done ✓
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── DateBar ────────────────────────────────────────────────── */
// Shows 5 days at a time. Arrows shift the window. Today is centred by default.
// User can scroll freely into the past; future days are disabled.
function DateBar({ todayStr, activeDate, setActiveDate, allEntries }) {
  // offset: how many days the window is shifted from "today centred" (0 = today is chip 3)
  const [offset, setOffset] = useState(0);

  // centre of window = today + offset
  const centreDate = addDays(todayStr, offset);
  const dates = Array.from({ length: 5 }, (_, i) => addDays(centreDate, i - 2));

  const canGoForward = addDays(centreDate, 1) <= todayStr; // don't scroll past today

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>

        {/* Prev arrow — go further into the past */}
        <button onClick={() => setOffset(o => o - 1)}
          style={{ flexShrink: 0, padding: "8px 6px", background: "none", border: "none", cursor: "pointer", color: "#999" }}>
          <ChevronLeft size={20} />
        </button>

        {/* Date chips */}
        <div style={{ flex: 1, display: "flex", gap: 6, justifyContent: "space-between" }}>
          {dates.map(d => {
            const e = allEntries[d];
            const isToday = d === todayStr;
            const isActive = d === activeDate;
            const isFuture = d > todayStr;
            return (
              <button key={d} onClick={() => !isFuture && setActiveDate(d)}
                style={{
                  flex: 1, padding: "10px 4px", borderRadius: 12,
                  textAlign: "center", cursor: isFuture ? "default" : "pointer",
                  background: "white",
                  border: isActive ? "3px solid #b7ad76" : "3px solid transparent",
                  color: isFuture ? "#ccc" : isActive ? "#3A3D38" : "#666",
                  opacity: isFuture ? 0.35 : 1, transition: "all 0.15s"
                }}>
                <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 2 }}>
                  {new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short" })}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{new Date(d + "T12:00:00").getDate()}</div>
                {e?.dayColor ? (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", margin: "3px auto 0",
                    background: e.dayColor === "Green" ? "#6bb87a" : e.dayColor === "Yellow" ? "#f5a623" : "#e05c5c" }} />
                ) : <div style={{ height: 9 }} />}
                {isToday && <div style={{ fontSize: 9, color: "#999", marginTop: 1 }}>today</div>}
              </button>
            );
          })}
        </div>

        {/* Next arrow — disabled when today is already visible on the right */}
        <button onClick={() => canGoForward && setOffset(o => o + 1)}
          style={{ flexShrink: 0, padding: "8px 6px", background: "none", border: "none", cursor: canGoForward ? "pointer" : "default", color: canGoForward ? "#999" : "#ddd" }}>
          <ChevronRight size={20} />
        </button>
      </div>

      {activeDate !== todayStr && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
          <button onClick={() => { setActiveDate(todayStr); setOffset(0); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#b7ad76", fontSize: 12 }}>
            ← back to today
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [view, setView]             = useState("home");
  const [activeDate, setActiveDate] = useState(todayStr);
  const [allEntries, setAllEntries] = useState({});
  const [loading, setLoading]       = useState(true);
  const [weekStart, setWeekStart]   = useState(getMonday(new Date()));
  const [saveStatus, setSaveStatus] = useState("");

  // home date bar offset (shared so Back to Home resets it)
  const [homeDateOffset, setHomeDateOffset] = useState(0);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Zen+Antique+Soft&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("gizi-entries");
    if (saved) { try { setAllEntries(JSON.parse(saved)); } catch (e) { console.error(e); } }
    setLoading(false);
  }, []);

  const persist = useCallback((newAll) => {
    try {
      localStorage.setItem("gizi-entries", JSON.stringify(newAll));
      setSaveStatus("Saved ✓");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch { setSaveStatus("Save failed ✗"); }
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
      ? (wEntries.reduce((s, e) => s + (e.habits?.water || 0), 0) / wEntries.length).toFixed(1) : 0;
    const habitTotals = {};
    ["walk","focus","stretching","reading"].forEach(k => {
      habitTotals[k] = dates.filter(d => allEntries[d]?.habits?.[k]).length;
    });
    return { colors, plants: plants.size, avgWater, habitTotals };
  };

  const SLEEP_QUALITY = ["😴 Restful","😐 Okay","😵 Poor","🔄 Restless"];
  const DISRUPTIONS   = ["🌙 Woke during night","🐱 Cat care","💭 Racing thoughts","🚽 Bathroom","🔥 Too hot","❄️ Too cold","🛏️ Uncomfortable","💪 Back/body pain","🔊 Noise"];
  const MORNING_STATE = ["⚡ Energized","😊 Rested","😑 Tired but okay","🥱 Exhausted","🤕 Groggy"];
  const DIGESTIVE     = ["🔥 Reflux","💨 Bloating","😣 Discomfort","😴 Fatigue","🤕 Headache"];
  const COMMON_PLANTS = ["Avocado","Broccoli","Apple","Raspberry","Oats","Cinnamon","Ginger","Lentils","Chickpeas","Spinach","Kale","Carrot","Banana","Blueberry","Pumpkin seeds","Walnut","Flaxseed","Garlic","Turmeric","Onion","Sweet potato","Beetroot","Parsley","Dill","Cumin","Fennel","Rye","Barley","Brown rice","Quinoa"];

  const inputStyle = {
    width: "100%", padding: "11px 14px", border: "2px solid #e0dcd6",
    borderRadius: 12, fontSize: 14, color: "#3A3D38", background: "white",
    fontFamily: "inherit", outline: "none", boxSizing: "border-box"
  };

  const SectionLabel = ({ text }) => (
    <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 10 }}>{text}</label>
  );

  /* ─── Home date strip (same scrollable logic) ─────────────── */
  const HomeDateStrip = () => {
    const centreDate = addDays(todayStr, homeDateOffset);
    const dates = Array.from({ length: 5 }, (_, i) => addDays(centreDate, i - 2));
    const canGoForward = addDays(centreDate, 1) <= todayStr;
    return (
      <div style={{ background: "white", borderRadius: 20, padding: "14px 10px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        {activeDate !== todayStr && (
          <p style={{ fontSize: 12, textAlign: "center", color: "#b7ad76", marginBottom: 8, cursor: "pointer" }}
            onClick={() => { setActiveDate(todayStr); setHomeDateOffset(0); }}>
            ← Back to today
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => setHomeDateOffset(o => o - 1)}
            style={{ flexShrink: 0, padding: "8px 4px", background: "none", border: "none", cursor: "pointer", color: "#999" }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ flex: 1, display: "flex", gap: 5, justifyContent: "space-between" }}>
            {dates.map(d => {
              const e = allEntries[d];
              const isToday = d === todayStr;
              const isActive = d === activeDate;
              const isFuture = d > todayStr;
              return (
                <button key={d} onClick={() => !isFuture && setActiveDate(d)}
                  style={{
                    flex: 1, padding: "9px 4px", borderRadius: 12,
                    textAlign: "center", cursor: isFuture ? "default" : "pointer",
                    background: "white",
                    border: isActive ? "3px solid #b7ad76" : "3px solid transparent",
                    color: isFuture ? "#ccc" : isActive ? "#3A3D38" : "#666",
                    opacity: isFuture ? 0.35 : 1, transition: "all 0.15s"
                  }}>
                  <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 2 }}>
                    {new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short" })}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{new Date(d + "T12:00:00").getDate()}</div>
                  {e?.dayColor ? (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", margin: "3px auto 0",
                      background: e.dayColor === "Green" ? "#6bb87a" : e.dayColor === "Yellow" ? "#f5a623" : "#e05c5c" }} />
                  ) : <div style={{ height: 9 }} />}
                  {isToday && <div style={{ fontSize: 9, color: "#999", marginTop: 1 }}>today</div>}
                </button>
              );
            })}
          </div>
          <button onClick={() => canGoForward && setHomeDateOffset(o => o + 1)}
            style={{ flexShrink: 0, padding: "8px 4px", background: "none", border: "none", cursor: canGoForward ? "pointer" : "default", color: canGoForward ? "#999" : "#ddd" }}>
            <ChevronRight size={18} />
          </button>
        </div>
        {activeDate !== todayStr && (
          <p style={{ fontSize: 11, textAlign: "center", color: "#b7ad76", marginTop: 6 }}>Editing: {fmt(activeDate)}</p>
        )}
      </div>
    );
  };

  /* ── MORNING VIEW ─────────────────────────────────────────── */
  const MorningView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Sun size={24} color="#CA9BAB" />
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 400, color: "#3A3D38" }}>Morning Check-in</h2>
          <div style={{ fontSize: 12, color: "#999" }}>{fmt(activeDate)}</div>
        </div>
      </div>

      <DateBar todayStr={todayStr} activeDate={activeDate} setActiveDate={setActiveDate} allEntries={allEntries} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[["Bedtime","bedtime"],["Wake time","waketime"]].map(([lbl, k]) => (
          <div key={k}>
            <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 8 }}>{lbl}</label>
            <input type="time" value={entry.sleep[k]}
              onChange={e => updateEntry({ sleep: { [k]: e.target.value } })}
              style={{ ...inputStyle, fontSize: 16 }}
              onFocus={e => e.target.style.borderColor = "#CA9BAB"}
              onBlur={e => e.target.style.borderColor = "#e0dcd6"} />
          </div>
        ))}
      </div>

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

      {[
        ["Sleep quality", SLEEP_QUALITY, "quality"],
        ["What disrupted your sleep?", DISRUPTIONS, "disruptions"],
        ["How do you feel this morning?", MORNING_STATE, "morningState"],
      ].map(([lbl, opts, key]) => (
        <div key={key}>
          <SectionLabel text={lbl} />
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

  /* ── EVENING VIEW ─────────────────────────────────────────── */
  const EveningView = () => {
    const [plantInput, setPlantInput] = useState("");
    const [winText, setWinText]       = useState(entry.reflection.win || "");
    const [struggleText, setStruggle] = useState(entry.reflection.struggle || "");
    const [goalText, setGoalText]     = useState(entry.tomorrowGoal || "");

    const addPlant = (p) => {
      const name = (p || "").trim();
      if (!name || entry.nutrition.plants.includes(name)) return;
      updateEntry({ nutrition: { plants: [...entry.nutrition.plants, name] } });
      setPlantInput("");
    };
    const removePlant = (p) => updateEntry({ nutrition: { plants: entry.nutrition.plants.filter(x => x !== p) } });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Moon size={24} color="#5B3C44" />
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 400, color: "#3A3D38" }}>Evening Check-in</h2>
            <div style={{ fontSize: 12, color: "#999" }}>{fmt(activeDate)}</div>
          </div>
        </div>

        <DateBar todayStr={todayStr} activeDate={activeDate} setActiveDate={setActiveDate} allEntries={allEntries} />

        {/* Day color */}
        <div>
          <SectionLabel text="How was this day?" />
          <div style={{ display: "flex", gap: 10 }}>
            {[["Green","#4a7c59"],["Yellow","#c8973a"],["Red","#c0484a"]].map(([c, col]) => (
              <button key={c} onClick={() => updateEntry({ dayColor: c })}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 500, fontSize: 14, transition: "all 0.15s", background: entry.dayColor === c ? col : "#f0ede8", color: entry.dayColor === c ? "white" : "#3A3D38" }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Habits */}
        <div>
          <SectionLabel text="Habits" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[["walk","🚶 Morning walk"],["focus","🎯 Deep focus"],["stretching","🧘 Core stretching"],["reading","📖 Reading"]].map(([k, lbl]) => (
              <button key={k} onClick={() => updateEntry({ habits: { [k]: !entry.habits[k] } })}
                style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, border: "none", cursor: "pointer", background: entry.habits[k] ? "#5B3C44" : "white", color: entry.habits[k] ? "white" : "#3A3D38", transition: "all 0.15s" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Vitamins accordion */}
        <VitaminAccordion
          vitamins={entry.habits.vitamins || {}}
          onToggle={(key) => updateEntry({ habits: { vitamins: { [key]: !entry.habits.vitamins?.[key] } } })}
        />

        {/* Period */}
        <div>
          <SectionLabel text="Period" />
          <button onClick={() => updateEntry({ habits: { period: !entry.habits.period } })}
            style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, border: "none", cursor: "pointer", background: entry.habits.period ? "#CA9BAB" : "white", color: entry.habits.period ? "white" : "#3A3D38", transition: "all 0.15s" }}>
            🩸 Period day
          </button>
        </div>

        {/* Water */}
        <div style={{ background: "white", padding: 20, borderRadius: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#666", marginBottom: 14 }}>
            <Droplets size={14} /> Water (dl)
          </label>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <button onClick={() => updateEntry({ habits: { water: Math.max(0, (entry.habits.water||0) - 1) } })}
              style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: "#f0ede8", fontSize: 24, cursor: "pointer" }}>−</button>
            <span style={{ fontSize: 32, fontWeight: 300, color: "#3A3D38", minWidth: 80, textAlign: "center" }}>{entry.habits.water} dl</span>
            <button onClick={() => updateEntry({ habits: { water: (entry.habits.water||0) + 1 } })}
              style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: "#f0ede8", fontSize: 24, cursor: "pointer" }}>+</button>
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
              style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => addPlant(plantInput)}
              style={{ padding: "0 18px", background: "#4a7c59", color: "white", border: "none", borderRadius: 12, fontSize: 14, cursor: "pointer" }}>
              Add
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: entry.nutrition.plants.length ? 10 : 0 }}>
            {COMMON_PLANTS.filter(p => !entry.nutrition.plants.includes(p)).map(p => (
              <button key={p} onClick={() => addPlant(p)}
                style={{ padding: "4px 12px", background: "white", color: "#3A3D38", border: "none", borderRadius: 20, fontSize: 12, cursor: "pointer" }}>
                + {p}
              </button>
            ))}
          </div>
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
          <SectionLabel text="Digestive symptoms?" />
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
              style={inputStyle} />
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

        {/* Wellbeing */}
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
            ["✨ One win", winText, setWinText, (v) => updateEntry({ reflection: { win: v } })],
            ["🌧 One struggle", struggleText, setStruggle, (v) => updateEntry({ reflection: { struggle: v } })],
          ].map(([lbl, val, setter, onBlurFn]) => (
            <div key={lbl}>
              <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 6 }}>{lbl}</label>
              <textarea value={val} rows={2}
                onChange={e => setter(e.target.value)}
                onBlur={e => onBlurFn(e.target.value)}
                style={{ ...inputStyle, resize: "none" }} />
            </div>
          ))}
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 6 }}>🎯 Tomorrow's goal</label>
            <input type="text" value={goalText}
              onChange={e => setGoalText(e.target.value)}
              onBlur={e => updateEntry({ tomorrowGoal: e.target.value })}
              placeholder="What's your focus tomorrow?"
              style={inputStyle} />
          </div>
        </div>

        <button onClick={() => setView("home")}
          style={{ width: "100%", padding: "15px 0", borderRadius: 16, border: "none", background: "#5B3C44", color: "#f9f6f1", fontSize: 16, fontWeight: 500, cursor: "pointer" }}>
          Save & Finish 💚
        </button>
      </div>
    );
  };

  /* ── WEEK VIEW ────────────────────────────────────────────── */
  const WeekView = () => {
    const stats = weekStats(weekStart);
    const dates = getWeekDates(weekStart);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {["M","T","W","T","F","S","S"].map((d, i) => {
            const e = allEntries[dates[i]];
            const isToday = dates[i] === todayStr;
            const bg = e?.dayColor === "Green" ? "#4a7c59" : e?.dayColor === "Yellow" ? "#c8973a" : e?.dayColor === "Red" ? "#c0484a" : "#f0ede8";
            const col = e?.dayColor ? "white" : "#999";
            return (
              <button key={i} onClick={() => { setActiveDate(dates[i]); setView("evening"); }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", borderRadius: 12, border: isToday ? "2px solid #b7ad76" : "2px solid transparent", background: bg, color: col, cursor: "pointer", fontSize: 12 }}>
                <span style={{ opacity: 0.7 }}>{d}</span>
                <span style={{ fontWeight: 600 }}>{new Date(dates[i]).getDate()}</span>
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 11, textAlign: "center", color: "#999" }}>Tap a day to edit it</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[["Green","#e8f4ec","#4a7c59",stats.colors.Green],["Yellow","#fdf6e3","#c8973a",stats.colors.Yellow],["Red","#fdf0f0","#c0484a",stats.colors.Red]].map(([lbl,bg,col,val]) => (
            <div key={lbl} style={{ background: bg, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 300, color: col }}>{val}</div>
              <div style={{ fontSize: 11, color: col, opacity: 0.7 }}>{lbl}</div>
            </div>
          ))}
        </div>

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

        <div style={{ background: "#f0ede8", padding: 18, borderRadius: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 14 }}>Habit completion</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["walk","🚶 Walk"],["focus","🎯 Focus"],["stretching","🧘 Stretch"],["reading","📖 Reading"]].map(([k,lbl]) => (
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

        {/* ── INSIGHTS ─────────────────────────────────────────── */}
        <WeekInsights dates={dates} allEntries={allEntries} />

      </div>
    );
  };

  /* ── WEEK INSIGHTS ───────────────────────────────────────── */
  function WeekInsights({ dates, allEntries }) {
    const [open, setOpen] = useState(false);

    // helpers
    const sleepMins = (e) => {
      if (!e?.sleep?.bedtime || !e?.sleep?.waketime) return null;
      const [bh, bm] = e.sleep.bedtime.split(":").map(Number);
      const [wh, wm] = e.sleep.waketime.split(":").map(Number);
      let m = (wh * 60 + wm) - (bh * 60 + bm);
      if (m < 0) m += 1440;
      return m;
    };

    const avg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : null;
    const pct = (v, max = 10) => Math.round((v / max) * 100);
    const fmtH = (m) => `${Math.floor(m/60)}h ${m%60}m`;

    // per-day data
    const days = dates.map(d => {
      const e = allEntries[d];
      if (!e) return null;
      const sm = sleepMins(e);
      const vitCount = e.habits?.vitamins ? Object.values(e.habits.vitamins).filter(Boolean).length : 0;
      const active = !!(e.habits?.walk || e.habits?.stretching);
      const focused = !!(e.habits?.focus || e.habits?.reading);
      return {
        date: d,
        sleepMins: sm,
        sleepH: sm != null ? sm / 60 : null,
        energy: e.wellbeing?.energy ?? null,
        mood: e.wellbeing?.mood ?? null,
        physical: e.wellbeing?.physical ?? null,
        mentalClarity: e.wellbeing?.mentalClarity ?? null,
        water: e.habits?.water ?? 0,
        vitCount,
        allVitamins: vitCount === VITAMIN_LIST.length,
        active,
        focused,
        walk: !!e.habits?.walk,
        stretching: !!e.habits?.stretching,
        focus: !!e.habits?.focus,
        reading: !!e.habits?.reading,
      };
    }).filter(Boolean);

    if (days.length === 0) return null;

    // ── Correlation 1: Sleep vs Energy/Mood
    const sleepDays  = days.filter(d => d.sleepMins != null && d.energy != null);
    const longSleep  = sleepDays.filter(d => d.sleepH >= 7);
    const shortSleep = sleepDays.filter(d => d.sleepH < 7);
    const avgEnergyLong  = avg(longSleep.map(d => d.energy));
    const avgEnergyShort = avg(shortSleep.map(d => d.energy));

    // ── Correlation 2: Vitamins vs Wellbeing
    const vitDays    = days.filter(d => d.vitCount > 0 && d.energy != null);
    const noVitDays  = days.filter(d => d.vitCount === 0 && d.energy != null);
    const avgWbVit   = avg(vitDays.map(d => (d.energy + d.mood + d.physical + d.mentalClarity) / 4));
    const avgWbNoVit = avg(noVitDays.map(d => (d.energy + d.mood + d.physical + d.mentalClarity) / 4));

    // ── Correlation 3: Physical activity vs Physical score
    const activeDays   = days.filter(d => d.active && d.physical != null);
    const inactiveDays = days.filter(d => !d.active && d.physical != null);
    const avgPhysActive   = avg(activeDays.map(d => d.physical));
    const avgPhysInactive = avg(inactiveDays.map(d => d.physical));

    // ── Correlation 4: Water vs Energy
    const highWater = days.filter(d => d.water >= 20 && d.energy != null);
    const lowWater  = days.filter(d => d.water < 20 && d.energy != null);
    const avgEnergyHW = avg(highWater.map(d => d.energy));
    const avgEnergyLW = avg(lowWater.map(d => d.energy));

    // ── Correlation 5: Focus/Reading vs Mental Clarity
    const focusDays   = days.filter(d => d.focused && d.mentalClarity != null);
    const noFocusDays = days.filter(d => !d.focused && d.mentalClarity != null);
    const avgMCFocus   = avg(focusDays.map(d => d.mentalClarity));
    const avgMCNoFocus = avg(noFocusDays.map(d => d.mentalClarity));

    // ── Day labels for chart axes
    const dayLabels = dates.map(d => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short" }));

    const Card = ({ title, emoji, chart, insight, hasData }) => (
      <div style={{ background: "white", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#3A3D38" }}>{emoji} {title}</div>
        {hasData ? (
          <>
            {chart}
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6, margin: 0 }}>{insight}</p>
          </>
        ) : (
          <p style={{ fontSize: 12, color: "#bbb", margin: 0 }}>Not enough data this week yet.</p>
        )}
      </div>
    );

    // ── Mini bar chart component
    const MiniBarChart = ({ bars, maxVal = 10 }) => (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 52 }}>
        {bars.map(({ label, value, color }, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ width: "100%", height: 40, display: "flex", alignItems: "flex-end" }}>
              <div style={{
                width: "100%",
                height: value != null ? `${Math.max(4, (value / maxVal) * 100)}%` : "4%",
                background: value != null ? color : "#eee",
                borderRadius: "4px 4px 0 0", transition: "height 0.3s"
              }} />
            </div>
            <span style={{ fontSize: 9, color: "#999" }}>{label}</span>
          </div>
        ))}
      </div>
    );

    // ── Dual bar (comparison) component
    const CompBar = ({ labelA, valA, labelB, valB, colorA, colorB, maxVal = 10 }) => (
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 60 }}>
        {[[labelA, valA, colorA],[labelB, valB, colorB]].map(([lbl, val, col], i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: col }}>{val != null ? val.toFixed(1) : "—"}</span>
            <div style={{ width: "100%", height: 32, display: "flex", alignItems: "flex-end" }}>
              <div style={{
                width: "100%",
                height: val != null ? `${Math.max(8, (val / maxVal) * 100)}%` : "8%",
                background: val != null ? col : "#eee",
                borderRadius: "4px 4px 0 0"
              }} />
            </div>
            <span style={{ fontSize: 10, color: "#999", textAlign: "center" }}>{lbl}</span>
          </div>
        ))}
      </div>
    );

    const sleepInsight = (() => {
      if (avgEnergyLong != null && avgEnergyShort != null) {
        const diff = avgEnergyLong - avgEnergyShort;
        if (Math.abs(diff) < 0.5) return "Sleep duration had little effect on energy this week.";
        return diff > 0
          ? `On nights with 7h+ sleep, your energy averaged ${avgEnergyLong.toFixed(1)} vs ${avgEnergyShort.toFixed(1)} on shorter nights.`
          : `Interestingly, shorter sleep nights didn't lower your energy much this week (${avgEnergyShort.toFixed(1)} vs ${avgEnergyLong.toFixed(1)}).`;
      }
      if (sleepDays.length > 0) return "Log more days to see the sleep-energy pattern.";
      return null;
    })();

    const vitInsight = (() => {
      if (avgWbVit != null && avgWbNoVit != null) {
        const diff = avgWbVit - avgWbNoVit;
        if (Math.abs(diff) < 0.5) return "Vitamin intake had a similar wellbeing score this week whether taken or not.";
        return diff > 0
          ? `On vitamin days, your overall wellbeing averaged ${avgWbVit.toFixed(1)}/10 vs ${avgWbNoVit.toFixed(1)} on days you skipped.`
          : `Wellbeing was similar regardless of vitamins this week (${avgWbVit.toFixed(1)} vs ${avgWbNoVit.toFixed(1)}).`;
      }
      return null;
    })();

    const activityInsight = (() => {
      if (avgPhysActive != null && avgPhysInactive != null) {
        const diff = avgPhysActive - avgPhysInactive;
        if (Math.abs(diff) < 0.5) return "Physical score was similar on active and rest days this week.";
        return diff > 0
          ? `Active days (walk or stretch) gave you a physical score of ${avgPhysActive.toFixed(1)} vs ${avgPhysInactive.toFixed(1)} on rest days.`
          : `Rest days didn't lower your physical score this week (${avgPhysInactive.toFixed(1)} vs ${avgPhysActive.toFixed(1)}).`;
      }
      return null;
    })();

    const waterInsight = (() => {
      if (avgEnergyHW != null && avgEnergyLW != null) {
        const diff = avgEnergyHW - avgEnergyLW;
        return diff > 0.4
          ? `On days with 20+ dl of water, your energy averaged ${avgEnergyHW.toFixed(1)} vs ${avgEnergyLW.toFixed(1)} on lower-water days.`
          : `Water intake didn't strongly predict energy levels this week.`;
      }
      return null;
    })();

    const focusInsight = (() => {
      if (avgMCFocus != null && avgMCNoFocus != null) {
        const diff = avgMCFocus - avgMCNoFocus;
        return diff > 0.4
          ? `On focus/reading days, your mental clarity averaged ${avgMCFocus.toFixed(1)} vs ${avgMCNoFocus.toFixed(1)} on days without.`
          : `Mental clarity was consistent regardless of focus or reading this week.`;
      }
      return null;
    })();

    return (
      <div style={{ borderRadius: 18, overflow: "hidden", border: "2px solid #f0ede8" }}>
        <button onClick={() => setOpen(o => !o)}
          style={{ width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", border: "none", cursor: "pointer" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#3A3D38" }}>✦ Weekly Insights</span>
          <ChevronDown size={16} color="#999"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>

        {open && (
          <div style={{ background: "#f9f6f1", padding: "0 12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* 1. Sleep vs Energy */}
            <Card title="Sleep & Energy" emoji="😴" hasData={sleepDays.length >= 2} insight={sleepInsight}
              chart={
                <MiniBarChart maxVal={10} bars={dates.map((d, i) => {
                  const day = days.find(x => x.date === d);
                  return { label: dayLabels[i], value: day?.energy ?? null, color: day?.sleepH >= 7 ? "#CA9BAB" : "#e8c9d2" };
                })} />
              } />

            {/* 2. Vitamins vs Wellbeing */}
            <Card title="Vitamins & Wellbeing" emoji="💊" hasData={vitDays.length > 0 || noVitDays.length > 0} insight={vitInsight}
              chart={
                <CompBar
                  labelA="Vitamin days" valA={avgWbVit} colorA="#5B3C44"
                  labelB="No vitamins" valB={avgWbNoVit} colorB="#c4a8b0" />
              } />

            {/* 3. Activity vs Physical */}
            <Card title="Movement & Physical Score" emoji="🏃" hasData={days.filter(d => d.physical != null).length >= 2} insight={activityInsight}
              chart={
                <CompBar
                  labelA="Active days" valA={avgPhysActive} colorA="#4a7c59"
                  labelB="Rest days" valB={avgPhysInactive} colorB="#a8c4b0" />
              } />

            {/* 4. Water vs Energy */}
            <Card title="Water & Energy" emoji="💧" hasData={days.filter(d => d.water > 0).length >= 2} insight={waterInsight}
              chart={
                <MiniBarChart maxVal={10} bars={dates.map((d, i) => {
                  const day = days.find(x => x.date === d);
                  const wColor = day?.water >= 20 ? "#4a7c59" : day?.water >= 10 ? "#8B8D78" : "#ccc";
                  return { label: dayLabels[i], value: day?.energy ?? null, color: wColor };
                })} />
              } />

            {/* 5. Focus/Reading vs Mental Clarity */}
            <Card title="Focus & Mental Clarity" emoji="🧠" hasData={days.filter(d => d.mentalClarity != null).length >= 2} insight={focusInsight}
              chart={
                <CompBar
                  labelA="Focus/Read days" valA={avgMCFocus} colorA="#b7ad76"
                  labelB="Other days" valB={avgMCNoFocus} colorB="#ddd8b8" />
              } />

          </div>
        )}
      </div>
    );
  }

  /* ── LOADING ──────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f9f6f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#999" }}>Loading Gizi…</p>
    </div>
  );

  /* ── HOME ─────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#f9f6f1" }}>
      {saveStatus && (
        <div style={{ position: "fixed", top: 16, right: 16, background: "white", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", borderRadius: 12, padding: "8px 18px", fontSize: 13, color: "#3A3D38", zIndex: 50, border: "1px solid #f0ede8" }}>
          {saveStatus}
        </div>
      )}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 80px" }}>
        {view === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Title */}
            <div style={{ textAlign: "center", paddingTop: 28, paddingBottom: 8 }}>
              <h1 style={{ fontFamily: "'Zen Antique Soft', serif", fontSize: 56, fontWeight: 400, color: "#3A3D38", marginBottom: 4, letterSpacing: 1 }}>Gizi</h1>
              <p style={{ color: "#999", fontSize: 13, letterSpacing: 1 }}>· Your gentle rebuild companion ·</p>
            </div>

            {/* Scrollable date strip */}
            <HomeDateStrip />

            {/* Nav cards */}
            <button onClick={() => setView("morning")}
              style={{ width: "100%", background: "#CA9BAB", color: "white", padding: "18px 20px", borderRadius: 18, border: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <Sun size={24} color="white" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Morning Check-in</div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>Log your sleep</div>
              </div>
              {allEntries[activeDate]?.sleep?.bedtime && <span style={{ fontSize: 18 }}>✓</span>}
            </button>

            <button onClick={() => setView("evening")}
              style={{ width: "100%", background: "#5B3C44", color: "white", padding: "18px 20px", borderRadius: 18, border: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <Moon size={24} color="white" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Evening Check-in</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Habits, plants & reflection</div>
              </div>
              {allEntries[activeDate]?.dayColor && <span style={{ fontSize: 18 }}>✓</span>}
            </button>

            <button onClick={() => setView("week")}
              style={{ width: "100%", background: "#8B8D78", color: "white", padding: "18px 20px", borderRadius: 18, border: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
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
                {fmt(activeDate)} at a glance
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 10, columnGap: 16, fontSize: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#999", display: "flex", alignItems: "center", gap: 5 }}><Moon size={13} /> Sleep</span>
                  <span style={{ color: "#3A3D38" }}>
                    {allEntries[activeDate]?.sleep?.bedtime ? `${allEntries[activeDate].sleep.bedtime} → ${allEntries[activeDate].sleep.waketime}` : "○"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#999", display: "flex", alignItems: "center", gap: 5 }}><Heart size={13} /> Day</span>
                  <span style={{ fontWeight: 600, color: allEntries[activeDate]?.dayColor === "Green" ? "#4a7c59" : allEntries[activeDate]?.dayColor === "Yellow" ? "#c8973a" : allEntries[activeDate]?.dayColor === "Red" ? "#c0484a" : "#ccc" }}>
                    {allEntries[activeDate]?.dayColor || "○"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#999", display: "flex", alignItems: "center", gap: 5 }}><Leaf size={13} /> Plants</span>
                  <span style={{ color: "#4a7c59", fontWeight: 600 }}>{allEntries[activeDate]?.nutrition?.plants?.length || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#999", display: "flex", alignItems: "center", gap: 5 }}><Droplets size={13} /> Water</span>
                  <span style={{ color: "#3A3D38", fontWeight: 600 }}>{allEntries[activeDate]?.habits?.water || 0}</span>
                </div>
              </div>
            </div>

            {/* Export / Import */}
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
