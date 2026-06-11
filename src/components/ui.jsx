import React from 'react';
import { ShieldCheck, ShieldX, ShieldAlert, Clock } from 'lucide-react';

// ============================================================
//  ESTILO GLOBAL — design system reformulado
// ============================================================
export const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');

    :root {
      --bg:#070b14; --bg-2:#0b1120;
      --surface:#0f1626; --surface-2:#141d31;
      --border:rgba(255,255,255,.07); --border-2:rgba(255,255,255,.13);
      --text:#e8edf7; --text-2:#9aa6bd; --text-3:#5b6783;
      --primary:#6366f1; --primary-2:#818cf8;
      --radius:16px; --radius-lg:22px; --radius-sm:11px;
      --sidebar-w:250px;
    }

    * { box-sizing:border-box; margin:0; padding:0; }
    html, body, #root { height:100%; }
    body {
      background:var(--bg); color:var(--text);
      font-family:'Inter', system-ui, -apple-system, sans-serif;
      line-height:1.5; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
    }
    body::before {
      content:''; position:fixed; inset:0; z-index:-1; pointer-events:none;
      background:
        radial-gradient(920px 620px at 10% -8%, rgba(99,102,241,.16), transparent 60%),
        radial-gradient(820px 600px at 100% 0%, rgba(168,85,247,.12), transparent 55%),
        radial-gradient(760px 520px at 50% 112%, rgba(34,211,238,.07), transparent 60%);
    }
    .display { font-family:'Space Grotesk', sans-serif; }
    ::selection { background:rgba(99,102,241,.35); }

    /* ---- shell ---- */
    .app-shell { display:grid; grid-template-columns:var(--sidebar-w) 1fr; min-height:100vh; }
    .main { min-width:0; display:flex; flex-direction:column; }
    .content { padding:28px 36px 90px; max-width:1280px; width:100%; margin:0 auto; }

    /* ---- sidebar ---- */
    .sidebar {
      width:var(--sidebar-w); background:linear-gradient(180deg,#0c1322,#080d18);
      border-right:1px solid var(--border); display:flex; flex-direction:column;
      padding:22px 16px; gap:4px;
    }
    .brand { display:flex; align-items:center; gap:12px; padding:4px 6px 20px; cursor:pointer; }
    .brand-mark {
      width:42px; height:42px; border-radius:13px; flex-shrink:0;
      background:linear-gradient(135deg,#6366f1,#a855f7); display:grid; place-items:center;
      box-shadow:0 10px 26px -8px rgba(99,102,241,.7);
    }
    .nav-section { font-size:10px; font-weight:700; letter-spacing:.15em; text-transform:uppercase; color:var(--text-3); padding:14px 12px 7px; }
    .nav-item {
      display:flex; align-items:center; gap:12px; padding:11px 12px; border-radius:12px;
      color:var(--text-2); font-size:13.5px; font-weight:600; cursor:pointer; border:none;
      background:transparent; width:100%; text-align:left; transition:all .15s; position:relative; font-family:inherit;
    }
    .nav-item:hover { background:rgba(255,255,255,.045); color:var(--text); }
    .nav-item.active { background:rgba(255,255,255,.07); color:#fff; }
    .nav-item.active::before { content:''; position:absolute; left:-16px; top:50%; transform:translateY(-50%); width:4px; height:22px; border-radius:0 4px 4px 0; background:var(--accent,#6366f1); }
    .nav-badge { margin-left:auto; font-size:11px; font-weight:700; padding:2px 9px; border-radius:8px; background:rgba(255,255,255,.07); color:var(--text-2); }
    .nav-item.active .nav-badge { background:var(--accent,#6366f1); color:#fff; }

    /* ---- topbar ---- */
    .topbar {
      display:flex; align-items:center; gap:12px; padding:14px 24px;
      border-bottom:1px solid var(--border); background:rgba(9,14,26,.72);
      backdrop-filter:blur(14px); position:sticky; top:0; z-index:30;
    }
    .hamburger { display:none; }
    .backdrop { display:none; }

    /* ---- cards ---- */
    .card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); }
    .glass { background:rgba(15,22,38,.7); backdrop-filter:blur(16px); border:1px solid var(--border); }
    .kpi { background:linear-gradient(165deg,rgba(255,255,255,.045),rgba(255,255,255,.012)); border:1px solid var(--border); border-radius:18px; padding:18px 20px; transition:all .2s; }
    .kpi:hover { border-color:var(--border-2); transform:translateY(-3px); }
    .panel-head { display:flex; align-items:center; gap:9px; padding:18px 22px; border-bottom:1px solid var(--border); }
    .panel-title { font-size:14px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:#fff; }

    /* ---- buttons ---- */
    .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:11px 18px; border-radius:12px; font-size:12px; font-weight:700; letter-spacing:.03em; cursor:pointer; border:1px solid transparent; transition:all .16s; font-family:inherit; white-space:nowrap; }
    .btn:active { transform:scale(.97); }
    .btn-primary { background:linear-gradient(135deg,#6366f1,#7c3aed); color:#fff; box-shadow:0 10px 22px -10px rgba(99,102,241,.8); }
    .btn-primary:hover { filter:brightness(1.09); }
    .btn-ghost { background:rgba(255,255,255,.04); color:var(--text-2); border-color:var(--border); }
    .btn-ghost:hover { background:rgba(255,255,255,.08); color:var(--text); }
    .btn-sm { padding:8px 13px; font-size:11px; border-radius:10px; }
    .icon-btn { display:inline-grid; place-items:center; width:34px; height:34px; border-radius:10px; background:rgba(255,255,255,.04); border:1px solid var(--border); color:var(--text-2); cursor:pointer; transition:all .15s; }
    .icon-btn:hover { background:rgba(255,255,255,.09); color:var(--text); }
    .icon-btn.danger:hover { background:rgba(244,63,94,.14); color:#fb7185; border-color:rgba(244,63,94,.3); }

    /* ---- inputs ---- */
    .input { width:100%; padding:12px 14px; border-radius:12px; background:rgba(6,10,18,.75); border:1px solid var(--border); color:var(--text); font-size:14px; font-family:inherit; transition:all .16s; }
    .input::placeholder { color:var(--text-3); }
    .input:focus { outline:none; border-color:rgba(99,102,241,.6); box-shadow:0 0 0 3px rgba(99,102,241,.16); background:rgba(12,18,32,.92); }
    select.input { appearance:none; cursor:pointer; background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235b6783' stroke-width='3'><path d='M6 9l6 6 6-6'/></svg>"); background-repeat:no-repeat; background-position:right 12px center; padding-right:34px; }
    option { background:#0f172a; color:#e8edf7; }
    .label { display:block; font-size:10.5px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--text-3); margin:0 0 6px 2px; }

    /* ---- badges ---- */
    .badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:8px; font-size:10px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; }

    /* ---- toggle ---- */
    .toggle { width:44px; height:24px; border-radius:12px; border:none; cursor:pointer; transition:all .2s; position:relative; flex-shrink:0; }
    .toggle span { position:absolute; top:3px; width:18px; height:18px; border-radius:50%; background:#fff; transition:left .2s; display:block; }

    /* ---- alerts ---- */
    .alert { display:flex; align-items:center; gap:12px; padding:13px 16px; border-radius:14px; font-size:13px; font-weight:600; border:1px solid; }
    .alert-warn { background:rgba(245,158,11,.08); border-color:rgba(245,158,11,.25); color:#fcd34d; }
    .alert-danger { background:rgba(244,63,94,.08); border-color:rgba(244,63,94,.25); color:#fda4af; }

    /* ---- table ---- */
    .table-row { transition:background .15s; }
    .table-row:hover { background:rgba(255,255,255,.025); }

    /* ---- progress ---- */
    .progress-bar { height:8px; border-radius:5px; background:rgba(255,255,255,.05); overflow:hidden; }

    /* ---- toasts ---- */
    .toast-wrap { position:fixed; top:18px; right:18px; z-index:200; display:flex; flex-direction:column; gap:10px; max-width:350px; }
    .toast { display:flex; align-items:flex-start; gap:10px; padding:13px 15px; border-radius:13px; background:rgba(15,22,38,.96); backdrop-filter:blur(12px); border:1px solid var(--border-2); border-left:3px solid var(--tc,#6366f1); box-shadow:0 18px 44px -14px rgba(0,0,0,.7); font-size:13px; font-weight:600; color:var(--text); animation:toastIn .26s cubic-bezier(.4,0,.2,1); }
    @keyframes toastIn { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }

    /* ---- modal ---- */
    .modal-backdrop { position:fixed; inset:0; background:rgba(3,6,12,.72); backdrop-filter:blur(5px); z-index:150; display:grid; place-items:center; padding:20px; animation:fadeIn .2s; }
    .modal { background:var(--surface); border:1px solid var(--border-2); border-radius:20px; padding:26px; max-width:410px; width:100%; box-shadow:0 32px 90px -24px rgba(0,0,0,.85); animation:popIn .24s cubic-bezier(.4,0,.2,1); }
    @keyframes popIn { from { opacity:0; transform:scale(.93) translateY(12px); } to { opacity:1; transform:none; } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

    /* ---- search dropdown ---- */
    .search-pop { position:absolute; top:calc(100% + 8px); left:0; right:0; background:var(--surface); border:1px solid var(--border-2); border-radius:14px; box-shadow:0 24px 60px -18px rgba(0,0,0,.8); overflow:hidden; z-index:60; }
    .search-item { display:flex; align-items:center; gap:11px; padding:11px 14px; cursor:pointer; border:none; background:transparent; width:100%; text-align:left; transition:background .12s; }
    .search-item:hover { background:rgba(255,255,255,.05); }

    /* ---- skeleton ---- */
    .skel { background:linear-gradient(90deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.03) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:12px; }
    @keyframes shimmer { from { background-position:200% 0; } to { background-position:-200% 0; } }

    /* ---- scrollbar ---- */
    .scroll::-webkit-scrollbar { width:6px; height:6px; }
    .scroll::-webkit-scrollbar-track { background:transparent; }
    .scroll::-webkit-scrollbar-thumb { background:#1e293b; border-radius:10px; }
    .scroll::-webkit-scrollbar-thumb:hover { background:#334155; }

    /* ---- animations ---- */
    @keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    .animate-page { animation:fadeSlideIn .35s ease forwards; }
    @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:.35; } }
    .pulse-dot { animation:pulse-dot 2s ease-in-out infinite; }

    /* ---- responsive ---- */
    @media (max-width:960px) {
      .app-shell { grid-template-columns:1fr; }
      .sidebar { position:fixed; left:0; top:0; bottom:0; transform:translateX(-100%); transition:transform .28s cubic-bezier(.4,0,.2,1); z-index:80; }
      .sidebar.open { transform:translateX(0); }
      .hamburger { display:grid; }
      .backdrop { display:block; position:fixed; inset:0; background:rgba(0,0,0,.55); backdrop-filter:blur(2px); z-index:70; }
      .content { padding:20px 16px 90px; }
      .topbar { padding:13px 16px; }
      .grid-2 { grid-template-columns:1fr !important; }
      .grid-form { grid-template-columns:280px 1fr; }
    }
    @media (max-width:760px) {
      .grid-form { grid-template-columns:1fr !important; }
      .hide-sm { display:none !important; }
    }
  `}</style>
);

// ============================================================
//  COMPONENTES VISUAIS
// ============================================================
export const ScoreRing = ({ score, size = 56 }) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score / 1000, 0), 1);
  const strokeDash = pct * circumference;
  const color = score >= 700 ? '#22c55e' : score >= 500 ? '#f59e0b' : score >= 300 ? '#f97316' : '#ef4444';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${strokeDash} ${circumference}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color }}>{score}</span>
      </div>
    </div>
  );
};

export const ResultadoBadge = ({ resultado }) => {
  const cfg = {
    'Aprovado':         { bg:'rgba(34,197,94,0.12)',  color:'#4ade80', border:'rgba(34,197,94,0.3)',  icon:<ShieldCheck size={12}/> },
    'Reprovado':        { bg:'rgba(244,63,94,0.12)',  color:'#fb7185', border:'rgba(244,63,94,0.3)',  icon:<ShieldX size={12}/> },
    'Com Restrições':   { bg:'rgba(251,191,36,0.12)', color:'#fbbf24', border:'rgba(251,191,36,0.3)', icon:<ShieldAlert size={12}/> },
    'Pendente Análise': { bg:'rgba(148,163,184,0.12)',color:'#94a3b8', border:'rgba(148,163,184,0.3)',icon:<Clock size={12}/> },
  };
  const c = cfg[resultado] || cfg['Pendente Análise'];
  return (
    <span className="badge" style={{ background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>
      {c.icon} {resultado}
    </span>
  );
};

export const Bars = ({ data, height = 150 }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:16, height, padding:'0 4px' }}>
      {data.map(d => (
        <div key={d.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8, height:'100%', justifyContent:'flex-end' }}>
          <span className="display" style={{ fontSize:15, fontWeight:700, color:d.color }}>{d.value}</span>
          <div style={{ width:'100%', maxWidth:48, height:`${(d.value/max)*100}%`, minHeight:5, background:`linear-gradient(180deg,${d.color},${d.color}40)`, borderRadius:'9px 9px 4px 4px', transition:'height .6s cubic-bezier(.4,0,.2,1)' }}/>
          <span style={{ fontSize:10.5, fontWeight:600, color:'var(--text-3)', textAlign:'center' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

export const Donut = ({ segments, size = 158, thickness = 18, centerLabel, centerSub }) => {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:22, flexWrap:'wrap' }}>
      <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
        <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={thickness}/>
          {segments.map((s, i) => {
            const len = (s.value / total) * c;
            const off = segments.slice(0, i).reduce((a, x) => a + (x.value / total) * c, 0);
            return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off}/>;
          })}
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span className="display" style={{ fontSize:28, fontWeight:700, color:'#fff', lineHeight:1 }}>{centerLabel}</span>
          {centerSub && <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text-3)', marginTop:3 }}>{centerSub}</span>}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:9, flex:1, minWidth:130 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display:'flex', alignItems:'center', gap:9, fontSize:12.5 }}>
            <span style={{ width:10, height:10, borderRadius:3, background:s.color, flexShrink:0 }}/>
            <span style={{ color:'var(--text-2)', fontWeight:600, flex:1 }}>{s.label}</span>
            <span style={{ color:'#fff', fontWeight:800 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Funnel = ({ steps }) => {
  const max = Math.max(...steps.map(s => s.value), 1);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {steps.map((s, i) => {
        const pct = (s.value / max) * 100;
        const conv = i > 0 && steps[i-1].value ? Math.round((s.value / steps[i-1].value) * 100) : null;
        return (
          <div key={s.label}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12.5, fontWeight:600, color:'var(--text-2)' }}>{s.label}</span>
              <span className="display" style={{ fontSize:14, fontWeight:700, color:s.color }}>
                {s.value}{conv !== null && <span style={{ fontSize:10.5, color:'var(--text-3)', fontWeight:600, marginLeft:7 }}>{conv}%</span>}
              </span>
            </div>
            <div style={{ height:11, borderRadius:6, background:'rgba(255,255,255,.04)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${s.color},${s.color}80)`, borderRadius:6, transition:'width .7s cubic-bezier(.4,0,.2,1)' }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const SkeletonList = ({ rows = 4, h = 74 }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
    {Array.from({ length: rows }).map((_, i) => <div key={i} className="skel" style={{ height:h }}/>)}
  </div>
);

export const EmptyState = ({ Icon, label }) => (
  <div style={{ textAlign:'center', padding:'52px 0', color:'#334155', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', border:'1px dashed rgba(255,255,255,.06)', borderRadius:16 }}>
    <Icon size={30} color="#1e293b" style={{ margin:'0 auto 14px', display:'block' }}/>
    {label}
  </div>
);

export const PageHeader = ({ Icon, color, title, sub, children }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:16, flexWrap:'wrap', marginBottom:26 }}>
    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ background:`${color}1a`, border:`1px solid ${color}33`, borderRadius:14, padding:11, color, display:'flex' }}>
        <Icon size={24}/>
      </div>
      <div>
        <h1 className="display" style={{ fontSize:26, fontWeight:700, color:'#fff', margin:0, letterSpacing:'-.5px' }}>{title}</h1>
        <p style={{ fontSize:13, color:'var(--text-3)', margin:'2px 0 0' }}>{sub}</p>
      </div>
    </div>
    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{children}</div>
  </div>
);
