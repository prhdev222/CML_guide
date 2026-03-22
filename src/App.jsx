import { useState } from "react";

// ไฟล์ PDF ต้องอยู่ในโฟลเดอร์ public/ — ชื่อต้องตรงกับไฟล์จริง (Vite เสิร์ฟที่ root)
function publicAssetHref(filename) {
  const base = import.meta.env.BASE_URL || "/";
  const path = base.endsWith("/") ? `${base}${filename}` : `${base}/${filename}`;
  return path;
}

// ─── Modules Menu ──────────────────────
const MODULES = [
  { id: "response", icon: "📈", label: "qPCR BCR::ABL1", desc: "ประเมินผล & Milestone" },
  { id: "workup", icon: "🔬", label: "Initial Workup", desc: "Checklist ตรวจเบื้องต้น" },
  { id: "phase", icon: "📊", label: "Phase", desc: "กำหนดระยะ CML" },
  { id: "risk", icon: "⚡", label: "Risk Score", desc: "Sokal / ELTS" },
  { id: "treatment", icon: "💊", label: "Treatment", desc: "เลือกยา TKI" },
  { id: "monitoring", icon: "🕐", label: "Milestones", desc: "Timeline 3-6-12 เดือน" },
  { id: "tfr", icon: "🎯", label: "TFR", desc: "หยุดยาได้หรือยัง" },
  { id: "interaction", icon: "⚠️", label: "Drug Interaction", desc: "อาหาร/ยา/สมุนไพร" },
  { id: "pdf-patient", icon: "📄", label: "เอกสารผู้ป่วย (PDF)", desc: "cml-patient.pdf", href: publicAssetHref("cml-patient.pdf") },
  { id: "pdf-summary", icon: "📋", label: "สรุป CML (PDF)", desc: "cml.pdf", href: publicAssetHref("cml.pdf") },
];

// ─── Response / qPCR Assessment ──────────────────────
function ResponseModule() {
  const [bcrabl, setBcrabl] = useState("");
  const [month, setMonth] = useState("12");
  const [priorTKI, setPriorTKI] = useState("1");

  const val = parseFloat(bcrabl);
  const m = parseInt(month);

  let response = null;
  let milestoneStatus = null;

  if (!isNaN(val)) {
    // Response level
    if (val <= 0.0032) response = { level: "MR4.5", label: "Deep Molecular Response (MR4.5)", color: "#276749", bg: "#f0fff4", icon: "🌟" };
    else if (val <= 0.01) response = { level: "MR4.0", label: "Deep Molecular Response (MR4.0)", color: "#276749", bg: "#f0fff4", icon: "🌟" };
    else if (val <= 0.1) response = { level: "MMR", label: "Major Molecular Response (MMR)", color: "#38a169", bg: "#f0fff4", icon: "✅" };
    else if (val <= 1) response = { level: "CCyR", label: "Complete Cytogenetic Response (CCyR)", color: "#2b6cb0", bg: "#ebf8ff", icon: "📊" };
    else if (val <= 10) response = { level: "EMR", label: "Early Molecular Response (EMR)", color: "#dd6b20", bg: "#fffaf0", icon: "⚠️" };
    else response = { level: "NONE", label: "ไม่ตอบสนอง / Resistance", color: "#e53e3e", bg: "#fff5f5", icon: "❌" };

    // Milestone assessment based on time
    if (!isNaN(m)) {
      if (m <= 3) {
        if (val > 10) milestoneStatus = { text: "Possible TKI resistance", color: "#ecc94b", action: "ตรวจสอบ adherence, ทำ mutation testing ถ้า BCR::ABL1 ไม่ลง" };
        else milestoneStatus = { text: "Milestone met", color: "#38a169", action: "Continue TKI เดิม — recheck ที่ 6 เดือน" };
      } else if (m <= 6) {
        if (val > 10) milestoneStatus = { text: "TKI Resistance — Milestone NOT met", color: "#e53e3e", action: "Switch TKI (ไม่ใช่ imatinib), ทำ mutation testing, อาจ consult transplant" };
        else milestoneStatus = { text: "Milestone met", color: "#38a169", action: "Continue TKI — recheck ที่ 12 เดือน" };
      } else if (m <= 12) {
        if (val > 10) milestoneStatus = { text: "TKI Resistance — Milestone NOT met", color: "#e53e3e", action: "Switch TKI, mutation testing, HCT consult" };
        else if (val > 1) milestoneStatus = { text: "Possible TKI resistance", color: "#dd6b20", action: "อาจ switch TKI หรือ continue + monitor ใกล้ชิด, ทำ mutation testing" };
        else if (val > 0.1) milestoneStatus = { text: "Met ถ้า goal = survival | NOT met ถ้า goal = TFR", color: "#2b6cb0", action: "ถ้าต้องการ TFR → consider switch TKI เพื่อ deeper response" };
        else milestoneStatus = { text: "Milestone met", color: "#38a169", action: "Continue TKI — aim for DMR" };
      } else {
        // Beyond 12 months
        if (val > 10) milestoneStatus = { text: "TKI Resistance", color: "#e53e3e", action: "Switch TKI, mutation testing, HCT consult ถ้า eligible" };
        else if (val > 1) milestoneStatus = { text: "Suboptimal — ไม่ถึง CCyR", color: "#dd6b20", action: "Switch TKI, mutation testing, ตรวจ adherence/drug interaction" };
        else if (val > 0.1) milestoneStatus = { text: "CCyR achieved — แต่ยังไม่ถึง MMR", color: "#2b6cb0", action: "Continue TKI หรือ switch เพื่อ deeper response (ถ้า goal = TFR)" };
        else if (val > 0.01) milestoneStatus = { text: "MMR maintained", color: "#38a169", action: "Continue TKI — monitor qPCR ทุก 3-6 เดือน indefinitely" };
        else milestoneStatus = { text: "DMR — อาจ eligible สำหรับ TFR", color: "#276749", action: "ถ้า DMR ≥2 ปี + TKI ≥3 ปี → พิจารณาหยุดยา (ดู TFR module)" };
      }
    }
  }

  // Log change detection
  const [prevBcr, setPrevBcr] = useState("");
  const prevVal = parseFloat(prevBcr);
  let logChange = null;
  if (!isNaN(val) && !isNaN(prevVal) && prevVal > 0 && val > 0) {
    const ratio = val / prevVal;
    if (ratio >= 10) logChange = { text: `≥1-log increase (${ratio.toFixed(1)}×)`, color: "#e53e3e", warning: true };
    else if (ratio >= 5) logChange = { text: `~0.7-log increase (${ratio.toFixed(1)}×)`, color: "#dd6b20", warning: true };
    else if (ratio <= 0.1) logChange = { text: `≥1-log decrease (${(1/ratio).toFixed(1)}×)`, color: "#38a169", warning: false };
    else if (ratio <= 0.5) logChange = { text: `~0.3-log decrease`, color: "#38a169", warning: false };
    else logChange = { text: "Stable (< 0.5-log change)", color: "#718096", warning: false };
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a365d", marginBottom: 4 }}>
        📈 qPCR BCR::ABL1 (IS) — ประเมินการตอบสนอง
      </h2>
      <p style={{ color: "#718096", fontSize: 13, marginBottom: 14 }}>
        ใส่ค่า qPCR (IS) เพื่อดู response level, milestone status และคำแนะนำ
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={lbl}>BCR::ABL1 (IS) % ปัจจุบัน</label>
          <input type="number" step="any" value={bcrabl} onChange={(e) => setBcrabl(e.target.value)}
            placeholder="เช่น 0.05" style={inp} />
        </div>
        <div>
          <label style={lbl}>เดือนที่ (หลังเริ่ม TKI)</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)} style={inp}>
            <option value="3">3 เดือน</option>
            <option value="6">6 เดือน</option>
            <option value="12">12 เดือน</option>
            <option value="18">18 เดือน</option>
            <option value="24">24 เดือน</option>
            <option value="36">36 เดือน</option>
            <option value="48">48+ เดือน</option>
          </select>
        </div>
      </div>

      {/* Optional: previous value for log change */}
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>BCR::ABL1 (IS) % ครั้งก่อน (optional — ดู log change)</label>
        <input type="number" step="any" value={prevBcr} onChange={(e) => setPrevBcr(e.target.value)}
          placeholder="เช่น 0.5" style={{ ...inp, maxWidth: 200 }} />
      </div>

      {/* Response Level */}
      {response && (
        <div style={{ padding: 16, borderRadius: 10, background: response.bg,
          border: `2px solid ${response.color}`, textAlign: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 28 }}>{response.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: response.color }}>{response.label}</div>
          <div style={{ fontSize: 13, color: "#718096", marginTop: 4 }}>BCR::ABL1 (IS) = {val}%</div>
        </div>
      )}

      {/* Log change */}
      {logChange && (
        <div style={{ padding: 10, borderRadius: 8, marginBottom: 10, fontSize: 14, fontWeight: 600, textAlign: "center",
          background: logChange.warning ? "#fff5f5" : "#f0fff4",
          border: `1.5px solid ${logChange.color}`, color: logChange.color }}>
          {logChange.warning ? "🔺" : "🔽"} {logChange.text}
          {logChange.warning && <div style={{ fontSize: 12, fontWeight: 400, marginTop: 4, color: "#e53e3e" }}>
            ⚠️ Any log increase → re-evaluate: adherence, mutation testing, drug interaction, consider switch TKI
          </div>}
        </div>
      )}

      {/* Milestone */}
      {milestoneStatus && (
        <div style={{ padding: 14, borderRadius: 10, background: "#f7fafc",
          borderLeft: `5px solid ${milestoneStatus.color}`, marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: milestoneStatus.color }}>
            {milestoneStatus.text}
          </div>
          <div style={{ fontSize: 13, color: "#4a5568", marginTop: 6 }}>
            <strong>แนะนำ:</strong> {milestoneStatus.action}
          </div>
        </div>
      )}

      {/* Quick reference */}
      <div style={{ padding: 12, background: "#f7fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#2d3748", marginBottom: 6 }}>📖 Response Definitions</div>
        <div style={{ fontSize: 12, color: "#4a5568", display: "grid", gap: 3 }}>
          {[
            { lv: "MR4.5 (DMR)", def: "≤0.0032%", c: "#276749" },
            { lv: "MR4.0 (DMR)", def: "≤0.01%", c: "#276749" },
            { lv: "MMR", def: "≤0.1%", c: "#38a169" },
            { lv: "CCyR", def: "≤1% (Ph-)", c: "#2b6cb0" },
            { lv: "EMR", def: "≤10%", c: "#dd6b20" },
            { lv: "No response", def: ">10%", c: "#e53e3e" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.c, flexShrink: 0 }} />
              <span><strong>{r.lv}:</strong> BCR::ABL1 (IS) {r.def}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone not met actions */}
      <div style={{ marginTop: 10, padding: 12, background: "#ebf8ff", borderRadius: 8, fontSize: 12, color: "#2b6cb0" }}>
        <strong>💡 ถ้า milestone ไม่ met ให้ตรวจสอบ:</strong>
        <div style={{ marginTop: 4, display: "grid", gap: 2 }}>
          <div>1. Adherence — ลืมกินยาหรือไม่?</div>
          <div>2. Drug interaction — สมุนไพร, อาหาร, ยาอื่น?</div>
          <div>3. Mutation testing — มี resistance mutation ใหม่?</div>
          <div>4. Switch TKI — เปลี่ยนเป็น TKI ตัวอื่น (ไม่ใช่ imatinib ถ้าเคยใช้แล้ว)</div>
          <div>5. HCT consult — ถ้า multiple TKI failures</div>
        </div>
      </div>
    </div>
  );
}

// ─── Workup Checklist ──────────────────────
function WorkupModule() {
  const [checks, setChecks] = useState({});
  const items = [
    { key: "hx", label: "History & PE (รวม spleen size)", req: true },
    { key: "cbc", label: "CBC with differential", req: true },
    { key: "chem", label: "Chemistry profile + uric acid", req: true },
    { key: "bma", label: "Bone marrow aspirate & biopsy", req: true },
    { key: "qpcr", label: "qPCR (IS) for BCR::ABL1 (blood)", req: true },
    { key: "hep", label: "Hepatitis B & C screening", req: true },
    { key: "distress", label: "Distress screening", req: true },
    { key: "lft", label: "LFTs", req: false },
    { key: "creat", label: "Creatinine", req: false },
    { key: "preg", label: "Pregnancy test (ถ้า applicable)", req: false },
    { key: "ecg", label: "ECG (ก่อน nilotinib/ponatinib)", req: false },
    { key: "echo", label: "Echocardiogram (cardiac risk)", req: false },
    { key: "fish", label: "FISH for BCR::ABL1", req: false },
    { key: "karyo", label: "Karyotype (bone marrow)", req: false },
    { key: "mut", label: "BCR::ABL1 mutation analysis", req: false },
    { key: "hla", label: "HLA typing (ถ้า consider HCT)", req: false },
    { key: "fert", label: "Fertility counseling", req: false },
  ];
  const toggle = (k) => setChecks((p) => ({ ...p, [k]: !p[k] }));
  const done = items.filter(i => i.req).filter(i => checks[i.key]).length;
  const total = items.filter(i => i.req).length;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a365d", marginBottom: 4 }}>🔬 Initial Workup Checklist</h2>
      <div style={{ fontSize: 13, color: "#38a169", fontWeight: 600, marginBottom: 12 }}>
        Required: {done}/{total} ✓
      </div>
      <div style={{ display: "grid", gap: 5 }}>
        {items.map(item => (
          <label key={item.key} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
            background: checks[item.key] ? "#f0fff4" : item.req ? "#fffaf0" : "#f7fafc",
            borderRadius: 6, cursor: "pointer", fontSize: 13,
            border: `1px solid ${checks[item.key] ? "#68d391" : item.req ? "#fbd38d" : "#e2e8f0"}`,
          }}>
            <input type="checkbox" checked={!!checks[item.key]} onChange={() => toggle(item.key)}
              style={{ accentColor: "#38a169" }} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.req && !checks[item.key] && <span style={{ fontSize: 10, color: "#dd6b20", fontWeight: 600 }}>Required</span>}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Phase ──────────────────────
function PhaseModule() {
  const [f, setF] = useState({ blast: "", promy: "", baso: "", plt: "", extra: false, lympho: false, addMut: false });
  const up = (k, v) => setF(p => ({ ...p, [k]: v }));
  const blast = parseFloat(f.blast) || 0;
  const promy = parseFloat(f.promy) || 0;
  const baso = parseFloat(f.baso) || 0;
  const plt = parseFloat(f.plt) || 999;

  let phase = "Chronic Phase";
  let color = "#38a169";
  if (blast >= 30 || f.extra) { phase = "Blast Phase — Myeloid"; color = "#e53e3e"; }
  else if (f.lympho) { phase = "Blast Phase — Lymphoid"; color = "#e53e3e"; }
  else if (blast >= 15 || (blast + promy >= 30) || baso >= 20 || plt <= 100 || f.addMut) { phase = "Accelerated Phase"; color = "#dd6b20"; }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a365d", marginBottom: 12 }}>📊 Phase Determination</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        {[
          { k: "blast", l: "% Myeloblasts" }, { k: "promy", l: "% Promyelocytes" },
          { k: "baso", l: "% Basophils" }, { k: "plt", l: "Platelet (×10⁹/L)" },
        ].map(x => (
          <div key={x.k}>
            <label style={lbl}>{x.l}</label>
            <input type="number" value={f[x.k]} onChange={e => up(x.k, e.target.value)} style={inp} placeholder="0" />
          </div>
        ))}
      </div>
      {[
        { k: "extra", l: "Extramedullary blast" },
        { k: "lympho", l: "Lymphoblasts เพิ่มขึ้น" },
        { k: "addMut", l: "Additional mutations ใน Ph+ cells" },
      ].map(c => (
        <label key={c.k} style={{ display: "flex", gap: 8, fontSize: 13, padding: "5px 8px", cursor: "pointer", alignItems: "center" }}>
          <input type="checkbox" checked={f[c.k]} onChange={() => up(c.k, !f[c.k])} /> {c.l}
        </label>
      ))}
      <div style={{ marginTop: 12, padding: 14, borderRadius: 10, textAlign: "center", background: color === "#38a169" ? "#f0fff4" : color === "#dd6b20" ? "#fffaf0" : "#fff5f5", border: `2px solid ${color}` }}>
        <div style={{ fontSize: 20, fontWeight: 800, color }}>{phase}</div>
      </div>
      <div style={{ marginTop: 10, padding: 10, background: "#f7fafc", borderRadius: 8, fontSize: 12, color: "#4a5568" }}>
        <strong>เกณฑ์:</strong> Chronic: blasts &lt;15% | Accelerated: blasts 15-29% หรือ promyelo+blast ≥30% หรือ baso ≥20% หรือ plt ≤100 หรือ new mutations | Blast: blasts ≥30% หรือ extramedullary
      </div>
    </div>
  );
}

// ─── Risk Score ──────────────────────
function RiskModule() {
  const [age, setAge] = useState("");
  const [sp, setSp] = useState("");
  const [plt, setPlt] = useState("");
  const [bl, setBl] = useState("");

  const a = parseFloat(age) || 0;
  const s = parseFloat(sp) || 0;
  const p = parseFloat(plt) || 0;
  const b = parseFloat(bl) || 0;

  const sokal = a > 0 ? Math.exp(0.0116*(a-43.4) + 0.0345*(s-7.51) + 0.188*((p/700)**2 - 0.563) + 0.0887*(b-2.1)) : null;
  let risk = "Low"; let rc = "#38a169";
  if (sokal !== null) {
    if (sokal > 1.2) { risk = "High"; rc = "#e53e3e"; }
    else if (sokal >= 0.8) { risk = "Intermediate"; rc = "#dd6b20"; }
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a365d", marginBottom: 12 }}>⚡ Risk Score (Sokal)</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { l: "อายุ (ปี)", v: age, s: setAge },
          { l: "Spleen (cm below costal)", v: sp, s: setSp },
          { l: "Platelet (×10⁹/L)", v: plt, s: setPlt },
          { l: "% Blasts (blood)", v: bl, s: setBl },
        ].map((x, i) => (
          <div key={i}>
            <label style={lbl}>{x.l}</label>
            <input type="number" value={x.v} onChange={e => x.s(e.target.value)} style={inp} />
          </div>
        ))}
      </div>
      {sokal !== null && (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 10, textAlign: "center",
          background: risk === "Low" ? "#f0fff4" : risk === "Intermediate" ? "#fffaf0" : "#fff5f5",
          border: `2px solid ${rc}` }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: rc }}>{sokal.toFixed(3)}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: rc }}>{risk} Risk</div>
          <div style={{ fontSize: 11, color: "#718096", marginTop: 4 }}>Low &lt;0.8 | Intermediate 0.8-1.2 | High &gt;1.2</div>
        </div>
      )}
      <div style={{ marginTop: 10, fontSize: 12, color: "#718096", padding: 8, background: "#f7fafc", borderRadius: 6 }}>
        💡 Low risk: imatinib หรือ 2nd-gen TKI หรือ asciminib ได้ทั้งหมด | Intermediate/High: prefer 2nd-gen TKI หรือ asciminib
      </div>
    </div>
  );
}

// ─── Treatment ──────────────────────
function TreatmentModule() {
  const [phase, setPhase] = useState("chronic");
  const [risk, setRisk] = useState("low");

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a365d", marginBottom: 8 }}>💊 Treatment Selection</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {[
          { v: "chronic", l: "Chronic" }, { v: "accelerated", l: "Accelerated" },
          { v: "blast-m", l: "Blast (Myeloid)" }, { v: "blast-l", l: "Blast (Lymphoid)" },
        ].map(x => (
          <button key={x.v} onClick={() => setPhase(x.v)} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: phase === x.v ? "#2b6cb0" : "#edf2f7", color: phase === x.v ? "#fff" : "#4a5568",
          }}>{x.l}</button>
        ))}
      </div>

      {phase === "chronic" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {["low", "intermediate", "high"].map(r => (
              <button key={r} onClick={() => setRisk(r)} style={{
                padding: "4px 12px", borderRadius: 14, border: "none", fontSize: 12, cursor: "pointer",
                background: risk === r ? (r === "low" ? "#c6f6d5" : r === "intermediate" ? "#fefcbf" : "#fed7d7")
                  : "#f7fafc",
                color: risk === r ? (r === "low" ? "#276749" : r === "intermediate" ? "#744210" : "#742a2a") : "#a0aec0",
                fontWeight: 600,
              }}>{r.charAt(0).toUpperCase() + r.slice(1)} Risk</button>
            ))}
          </div>
          {risk === "low" ? (
            <Card title="Low Risk — Preferred" color="#38a169" items={[
              "Imatinib 400mg/d (มี generic)",
              "Bosutinib 400mg/d (2nd-gen, มี generic)",
              "Dasatinib 100mg/d (2nd-gen, มี generic)",
              "Nilotinib 300mg BID (2nd-gen, มี generic)",
              "Asciminib 80mg/d (STAMP inhibitor)",
              "Clinical trial",
            ]} />
          ) : (
            <div>
              <Card title="Intermediate/High Risk — Preferred" color="#dd6b20" items={[
                "Bosutinib 400mg/d", "Dasatinib 100mg/d", "Nilotinib 300mg BID",
                "Asciminib 80mg/d", "Clinical trial",
              ]} />
              <Card title="Other Recommended" color="#718096" items={["Imatinib 400mg/d (มี generic)"]} />
            </div>
          )}
        </div>
      )}

      {phase === "accelerated" && (
        <div>
          <Card title="Preferred" color="#dd6b20" items={["Bosutinib", "Dasatinib", "Nilotinib", "Ponatinib"]} />
          <Card title="Certain Cases" color="#718096" items={["Imatinib / generic", "Asciminib"]} />
          <div style={{ padding: 8, background: "#fed7d7", borderRadius: 6, fontSize: 12, marginTop: 6 }}>
            🏥 พิจารณา allogeneic HCT สำหรับ long-term control — ทำ HLA typing
          </div>
        </div>
      )}

      {phase === "blast-m" && (
        <div>
          <Card title="Myeloid Blast — Preferred" color="#e53e3e" items={["AML-type induction chemo + TKI"]} />
          <Card title="Certain Cases" color="#718096" items={["TKI alone"]} />
          <div style={{ padding: 8, background: "#fed7d7", borderRadius: 6, fontSize: 12, marginTop: 6 }}>
            🚨 Allogeneic HCT หลัง achieve remission — ทำ mutation testing + LP ถ้าสงสัย CNS
          </div>
        </div>
      )}

      {phase === "blast-l" && (
        <div>
          <Card title="Lymphoid Blast — Preferred" color="#e53e3e" items={["ALL-type induction chemo + TKI"]} />
          <Card title="Certain Cases" color="#718096" items={["TKI + steroids"]} />
          <div style={{ padding: 8, background: "#fed7d7", borderRadius: 6, fontSize: 12, marginTop: 6 }}>
            🚨 Allogeneic HCT หลัง achieve remission — LP ถ้าสงสัย CNS involvement
          </div>
        </div>
      )}

      {/* TKI cautions always shown */}
      <div style={{ marginTop: 12, padding: 10, background: "#fefcbf", borderRadius: 8, fontSize: 12, color: "#744210" }}>
        <strong>⚠️ TKI Cautions:</strong>
        <div style={{ marginTop: 4, display: "grid", gap: 2 }}>
          <div>• Dasatinib → pleural effusion, pulmonary</div>
          <div>• Nilotinib → QT prolongation, DM, PVD (ต้อง ECG)</div>
          <div>• Bosutinib → liver, GI</div>
          <div>• Ponatinib → cardiovascular (ไม่ใช้ 1st-line), preferred for T315I</div>
          <div>• Asciminib → pancreatitis, HTN; dose 200mg BID for T315I</div>
          <div>• ทุกตัว: ห้ามใช้ใน pregnancy/breastfeeding</div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, color, items }) {
  return (
    <div style={{ padding: 10, borderRadius: 8, marginBottom: 6, border: `1px solid ${color}33`,
      background: `${color}08` }}>
      <div style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 4 }}>{title}</div>
      {items.map((item, i) => (
        <div key={i} style={{ fontSize: 13, color: "#2d3748", padding: "2px 0", paddingLeft: 12,
          borderLeft: `2px solid ${color}44` }}>{item}</div>
      ))}
    </div>
  );
}

// ─── Milestones Timeline ──────────────────────
function MilestonesModule() {
  const data = [
    { time: "3 เดือน", rows: [
      { range: "≤0.1% (MMR)", s: "✅", c: "#38a169" },
      { range: "0.1-1% (CCyR)", s: "✅", c: "#38a169" },
      { range: "1-10% (EMR)", s: "✅", c: "#38a169" },
      { range: ">10%", s: "⚠️ Possible resistance", c: "#ecc94b" },
    ]},
    { time: "6 เดือน", rows: [
      { range: "≤0.1%", s: "✅", c: "#38a169" },
      { range: "0.1-1%", s: "✅", c: "#38a169" },
      { range: "1-10%", s: "✅", c: "#38a169" },
      { range: ">10%", s: "❌ Resistance", c: "#e53e3e" },
    ]},
    { time: "12 เดือน", rows: [
      { range: "≤0.1% (MMR)", s: "✅", c: "#38a169" },
      { range: "0.1-1% (CCyR)", s: "🟢 Survival met / 🟡 TFR not met", c: "#2b6cb0" },
      { range: "1-10%", s: "⚠️ Possible resistance", c: "#dd6b20" },
      { range: ">10%", s: "❌ Resistance", c: "#e53e3e" },
    ]},
  ];

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a365d", marginBottom: 12 }}>🕐 Treatment Milestones</h2>
      {data.map((t, idx) => (
        <div key={idx} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#2b6cb0", padding: "4px 10px",
            background: "#ebf8ff", borderRadius: 4, display: "inline-block", marginBottom: 4 }}>{t.time}</div>
          {t.rows.map((r, i) => (
            <div key={i} style={{ padding: "5px 10px", borderLeft: `3px solid ${r.c}`, fontSize: 12,
              background: "#f7fafc", marginBottom: 2, borderRadius: "0 4px 4px 0" }}>
              <strong>{r.range}</strong> → {r.s}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── TFR ──────────────────────
function TFRModule() {
  const [ch, setCh] = useState({});
  const toggle = k => setCh(p => ({ ...p, [k]: !p[k] }));
  const items = [
    { k: "dur", l: "TKI ≥3 ปี" }, { k: "dmr", l: "DMR (MR4.0+) ≥2 ปี ต่อเนื่อง" },
    { k: "noAP", l: "ไม่เคย accelerated/blast phase" },
    { k: "mon", l: "สามารถ monitor qPCR ได้ตาม schedule" },
    { k: "spec", l: "ปรึกษา CML specialist" }, { k: "con", l: "ผู้ป่วย informed consent" },
  ];
  const allMet = items.every(i => ch[i.k]);

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a365d", marginBottom: 12 }}>🎯 TFR Eligibility</h2>
      <div style={{ display: "grid", gap: 5 }}>
        {items.map(i => (
          <label key={i.k} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 10px",
            background: ch[i.k] ? "#f0fff4" : "#f7fafc", borderRadius: 6, cursor: "pointer", fontSize: 13,
            border: `1px solid ${ch[i.k] ? "#68d391" : "#e2e8f0"}` }}>
            <input type="checkbox" checked={!!ch[i.k]} onChange={() => toggle(i.k)} style={{ accentColor: "#38a169" }} />
            {i.l}
          </label>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: 14, borderRadius: 10, textAlign: "center",
        background: allMet ? "#f0fff4" : "#f7fafc", border: `2px solid ${allMet ? "#276749" : "#cbd5e0"}` }}>
        {allMet ? (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#276749" }}>🎉 อาจหยุด TKI ได้</div>
            <div style={{ fontSize: 12, color: "#4a5568", marginTop: 4 }}>
              Monitor: qPCR ทุกเดือน × 6mo → ทุก 6wk × 2yr → ทุก 3mo<br/>
              Restart ทันทีถ้า BCR::ABL1 &gt;0.1%
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 15, color: "#718096", fontWeight: 600 }}>ยังไม่ครบเกณฑ์ — continue TKI</div>
        )}
      </div>
    </div>
  );
}

// ─── Drug Interaction ──────────────────────
function InteractionModule() {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a365d", marginBottom: 12 }}>⚠️ Drug & Food Interactions</h2>

      <div style={{ padding: 12, background: "#fff5f5", borderRadius: 8, border: "1px solid #feb2b2", marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#742a2a", marginBottom: 6 }}>🚫 ห้ามสมุนไพร / Supplements</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 13, color: "#4a5568" }}>
          {["Curcumin (ขมิ้น)", "Ginkgo biloba", "Green tea extract (ชาเขียวเข้มข้น)", "St. John's Wort", "Antioxidants (doses สูง)"].map((s, i) => (
            <div key={i}>❌ {s}</div>
          ))}
        </div>
      </div>

      <div style={{ padding: 12, background: "#fffaf0", borderRadius: 8, border: "1px solid #fbd38d", marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#744210", marginBottom: 6 }}>🍊 ห้ามอาหาร</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 13, color: "#4a5568" }}>
          {["Grapefruit (ส้มโอ)", "Star fruit (มะเฟือง)", "Pomegranate (ทับทิม)", "Black mulberry", "Wild grape"].map((s, i) => (
            <div key={i}>⚠️ {s}</div>
          ))}
        </div>
      </div>

      <div style={{ padding: 12, background: "#ebf8ff", borderRadius: 8, border: "1px solid #90cdf4" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#2a4365", marginBottom: 6 }}>💊 ระวังยาที่ interact</div>
        <div style={{ fontSize: 13, color: "#4a5568", display: "grid", gap: 3 }}>
          <div>• <strong>Antacids / PPI:</strong> ลดการดูดซึม TKI (โดยเฉพาะ dasatinib)</div>
          <div>• <strong>CYP3A4 inhibitors:</strong> ketoconazole, clarithromycin → เพิ่ม TKI level</div>
          <div>• <strong>CYP3A4 inducers:</strong> rifampin, carbamazepine, phenytoin → ลด TKI level</div>
          <div>• <strong>QT-prolonging drugs:</strong> ระวังกับ nilotinib, dasatinib</div>
          <div>• <strong>ยาลดความดัน / หัวใจ:</strong> ตรวจสอบ interaction ทุกครั้ง</div>
          <div>• <strong>ยาต้านซึมเศร้า:</strong> บาง SSRIs interact กับ TKI</div>
        </div>
      </div>

      <div style={{ marginTop: 10, padding: 10, background: "#f0fff4", borderRadius: 8, fontSize: 12, color: "#276749", fontWeight: 600 }}>
        📋 ให้ผู้ป่วยนำรายการยา/สมุนไพร/supplements ทั้งหมดมาทุกครั้งที่พบแพทย์
      </div>

      <div style={{ marginTop: 8, padding: 10, background: "#f7fafc", borderRadius: 8, fontSize: 12, color: "#4a5568" }}>
        <strong>Nilotinib กับอาหาร:</strong> Generic nilotinib ต้องกินตอนท้องว่าง (งดอาหาร 2 ชม.ก่อน + 1 ชม.หลัง) | Non-generic (Tasigna) form ใหม่ไม่มี meal restriction
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────
const lbl = { fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block" };
const inp = { width: "100%", padding: "8px 10px", border: "1.5px solid #cbd5e0", borderRadius: 6, fontSize: 15, marginTop: 2, boxSizing: "border-box" };

// ─── Main App ──────────────────────
export default function CMLApp() {
  const [active, setActive] = useState(null);

  return (
    <div style={{
      fontFamily: "'Sarabun', 'Segoe UI', system-ui, sans-serif",
      maxWidth: 640,
      margin: "0 auto",
      /* ให้รายการสุดท้าย (Drug Interaction) ไม่ถูกแถบนำทาง Android/Chrome บัง */
      paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
      boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)",
        padding: "16px 16px 14px", color: "#fff",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.6 }}>NCCN 2026</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>CML Decision Support</div>
          </div>
          {active !== null && (
            <button onClick={() => setActive(null)} style={{
              background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
              padding: "6px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer",
            }}>← Menu</button>
          )}
        </div>
      </div>

      <div style={{ padding: 14 }}>
        {active === null ? (
          <div>
            <p style={{ color: "#718096", fontSize: 13, marginBottom: 14 }}>
              เลือกหัวข้อที่ต้องการ — ไม่จำเป็นต้องเรียงลำดับ
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {MODULES.map((m) => {
                const menuRowStyle = {
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                  background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10,
                  cursor: "pointer", textAlign: "left", transition: "all 0.12s",
                };
                if (m.href) {
                  return (
                    <a
                      key={m.id}
                      href={m.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        ...menuRowStyle,
                        textDecoration: "none",
                        color: "inherit",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <span style={{ fontSize: 26 }}>{m.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#1a365d" }}>{m.label}</div>
                        <div style={{ fontSize: 12, color: "#a0aec0" }}>{m.desc}</div>
                      </div>
                      <span style={{ marginLeft: "auto", color: "#cbd5e0", fontSize: 16, flexShrink: 0 }} aria-hidden>↗</span>
                    </a>
                  );
                }
                return (
                  <button key={m.id} type="button" onClick={() => setActive(m.id)} style={menuRowStyle}>
                    <span style={{ fontSize: 26 }}>{m.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1a365d" }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: "#a0aec0" }}>{m.desc}</div>
                    </div>
                    <span style={{ marginLeft: "auto", color: "#cbd5e0", fontSize: 18 }}>›</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            {active === "response" && <ResponseModule />}
            {active === "workup" && <WorkupModule />}
            {active === "phase" && <PhaseModule />}
            {active === "risk" && <RiskModule />}
            {active === "treatment" && <TreatmentModule />}
            {active === "monitoring" && <MilestonesModule />}
            {active === "tfr" && <TFRModule />}
            {active === "interaction" && <InteractionModule />}
          </div>
        )}
      </div>

      <div style={{ padding: "10px 14px", fontSize: 10, color: "#a0aec0", textAlign: "center", borderTop: "1px solid #edf2f7" }}>
        Based on NCCN Guidelines® CML v1.2026 — Decision support only, ใช้วิจารณญาณทางคลินิกประกอบเสมอ
      </div>
    </div>
  );
}
