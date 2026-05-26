cat > /home/claude/App.jsx << 'ENDOFFILE'
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, onSnapshot, query,
  orderBy, doc, updateDoc, deleteDoc
} from 'firebase/firestore';
import {
  Save, Search, Trash2, Edit, Info, CheckCircle, XCircle, Users,
  Download, Printer, Wifi, LayoutDashboard, ClipboardList,
  Wrench, CalendarClock, CheckCircle2, Clock, DollarSign,
  Database, Layers, Plus, ShieldCheck, ShieldX, ShieldAlert,
  FileSearch, Calendar, AlertCircle, TrendingUp, Hash,
  ChevronRight, Star, X, Package, AlertTriangle,
  TrendingDown, Banknote, Receipt, History, BoxSelect,
  BarChart2, ArrowUpRight, Boxes, ChevronDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ── Firebase ──────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBX7mv26WPpYNBVpfQufvpdZdQVtSAITZs",
  authDomain: "lumix-doc.firebaseapp.com",
  projectId: "lumix-doc",
  storageBucket: "lumix-doc.firebasestorage.app",
  messagingSenderId: "625727333695",
  appId: "1:625727333695:web:62efac7740bdf7d3391f8a"
};
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Constantes financeiras ────────────────────────────────────────────────────
const VALORES_OS = {
  'Nova Ativação':          70,
  'Reparo Técnico':         50,
  'Mudança de Endereço':    50,
  'Recolha de Equipamento': 25,
};

const fmt = (n) => n.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });

// ── Formatação de documentos ──────────────────────────────────────────────────
const fmtCPF  = v => v.replace(/\D/g,'').slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
const fmtCNPJ = v => v.replace(/\D/g,'').slice(0,14).replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2');
const fmtDoc  = (v,t) => t==='CPF' ? fmtCPF(v) : fmtCNPJ(v);

// ── Estilos globais ───────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    *{box-sizing:border-box}
    body{background:#080c14;color:#f0f4ff;font-family:'Space Grotesk','Inter',sans-serif;-webkit-font-smoothing:antialiased}
    .glass{background:rgba(16,24,40,.75);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.07)}
    input,textarea,select{background:rgba(8,12,20,.8)!important;color:#e2e8f0!important;border:1px solid rgba(255,255,255,.1)!important;transition:all .2s}
    input::placeholder,textarea::placeholder{color:#4a5568!important}
    input:focus,select:focus,textarea:focus{border-color:rgba(99,102,241,.6)!important;outline:none!important;box-shadow:0 0 0 3px rgba(99,102,241,.15)!important;background:rgba(12,18,32,.9)!important}
    option{background:#0f172a}
    .scroll::-webkit-scrollbar{width:5px;height:5px}
    .scroll::-webkit-scrollbar-track{background:transparent}
    .scroll::-webkit-scrollbar-thumb{background:#1e293b;border-radius:10px}
    .progress-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.05);overflow:hidden}
    .row-hover{transition:background .15s}.row-hover:hover{background:rgba(255,255,255,.025)}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    .page{animation:fadeUp .35s ease forwards}
    @keyframes pdot{0%,100%{opacity:1}50%{opacity:.4}}
    .pdot{animation:pdot 2s ease-in-out infinite}
    @keyframes toastIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
    .toast{animation:toastIn .3s ease forwards}
    .menu-card{transition:all .3s cubic-bezier(.4,0,.2,1)}
    .menu-card:hover{transform:translateY(-4px)}
    .menu-card:active{transform:scale(.99)}
    .stat-card{background:rgba(16,24,40,.6);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:18px 20px;transition:all .2s}
    .stat-card:hover{border-color:rgba(255,255,255,.12)}
    .btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 22px;border-radius:14px;font-weight:700;font-size:12px;letter-spacing:.08em;text-transform:uppercase;transition:all .2s;cursor:pointer;border:none}
    .btn:active{transform:scale(.98)}
    .fl{font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.1em;margin:0 0 6px 4px}
    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:50;display:flex;align-items:flex-start;justify-content:flex-end;padding:16px}
    .modal-panel{background:#0d1526;border:1px solid rgba(255,255,255,.08);border-radius:20px;width:100%;max-width:520px;max-height:calc(100vh - 32px);overflow-y:auto;display:flex;flex-direction:column}
  `}</style>
);

// ── Toast system ──────────────────────────────────────────────────────────────
const ToastCtx = React.createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type='success') => {
    const id = Date.now();
    setToasts(p => [...p, {id, msg, type}]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  };
  const colors = { success:'#22c55e', error:'#ef4444', warn:'#f59e0b', info:'#60a5fa' };
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div style={{position:'fixed',bottom:24,right:24,zIndex:999,display:'flex',flexDirection:'column',gap:8}}>
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{background:'rgba(16,24,40,.95)',border:`1px solid ${colors[t.type]}40`,borderLeft:`3px solid ${colors[t.type]}`,
            padding:'12px 18px',borderRadius:12,color:'white',fontSize:13,fontWeight:600,maxWidth:320,boxShadow:'0 8px 24px rgba(0,0,0,.5)'}}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => React.useContext(ToastCtx);

// ── Score Ring ────────────────────────────────────────────────────────────────
const ScoreRing = ({ score, size=56 }) => {
  const r=22, c=2*Math.PI*r, pct=Math.min(Math.max(score/1000,0),1);
  const col = score>=700?'#22c55e':score>=500?'#f59e0b':score>=300?'#f97316':'#ef4444';
  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="4"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="4"
          strokeDasharray={`${pct*c} ${c}`} strokeLinecap="round"/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontSize:11,fontWeight:800,color:col}}>{score}</span>
      </div>
    </div>
  );
};

// ── Resultado badge ───────────────────────────────────────────────────────────
const ResultBadge = ({ r }) => {
  const m = {
    'Aprovado':         {bg:'rgba(34,197,94,.12)',  col:'#4ade80', bd:'rgba(34,197,94,.3)',  ic:<ShieldCheck size={11}/>},
    'Reprovado':        {bg:'rgba(239,68,68,.12)',   col:'#f87171', bd:'rgba(239,68,68,.3)',  ic:<ShieldX size={11}/>},
    'Com Restrições':   {bg:'rgba(251,191,36,.12)',  col:'#fbbf24', bd:'rgba(251,191,36,.3)', ic:<ShieldAlert size={11}/>},
    'Pendente Análise': {bg:'rgba(148,163,184,.12)', col:'#94a3b8', bd:'rgba(148,163,184,.3)',ic:<Clock size={11}/>},
  };
  const c = m[r]||m['Pendente Análise'];
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:7,background:c.bg,color:c.col,border:`1px solid ${c.bd}`,fontSize:10,fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase'}}>{c.ic}{r}</span>;
};

// ── Status badge OS ───────────────────────────────────────────────────────────
const OSStatusBadge = ({status}) => {
  const m = { 'Pendente':{col:'#fbbf24',bg:'rgba(245,158,11,.12)',bd:'rgba(245,158,11,.25)'},
              'Concluído':{col:'#4ade80',bg:'rgba(34,197,94,.12)',bd:'rgba(34,197,94,.25)'},
              'Pago':{col:'#60a5fa',bg:'rgba(59,130,246,.12)',bd:'rgba(59,130,246,.25)'} };
  const c = m[status]||m['Pendente'];
  return <span style={{fontSize:10,padding:'3px 9px',borderRadius:7,background:c.bg,color:c.col,border:`1px solid ${c.bd}`,fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase'}}>{status}</span>;
};

// ── Modal Histórico do Cliente ────────────────────────────────────────────────
function HistoricoModal({ cliente, ordens, onClose }) {
  const os = ordens.filter(o => o.nome?.toLowerCase() === cliente.nome?.toLowerCase());
  const totalPago = os.filter(o=>o.status==='Pago').reduce((a,o)=>a+(VALORES_OS[o.tipo]||0),0);
  const tipoCor = {'Nova Ativação':'#3b82f6','Reparo Técnico':'#ef4444','Mudança de Endereço':'#f59e0b','Recolha de Equipamento':'#a78bfa'};
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-panel scroll" onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(255,255,255,.06)',display:'flex',justifyContent:'space-between',alignItems:'flex-start',position:'sticky',top:0,background:'#0d1526',zIndex:1}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <History size={16} color="#a78bfa"/>
              <h2 style={{fontSize:15,fontWeight:800,color:'white',margin:0,textTransform:'uppercase',letterSpacing:'.04em'}}>Histórico</h2>
            </div>
            <p style={{fontSize:13,color:'#64748b',margin:0}}>{cliente.nome}</p>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.08)',borderRadius:8,padding:6,cursor:'pointer',color:'#64748b',display:'flex'}}>
            <X size={16}/>
          </button>
        </div>
        {/* Info do cliente */}
        <div style={{padding:'16px 24px',borderBottom:'1px solid rgba(255,255,255,.05)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[
            {label:'Serial',val:cliente.serial||'—'},
            {label:'Login',val:cliente.login||'—'},
            {label:'CTO / Porta',val:cliente.cto?`${cliente.cto} / P${cliente.porta}`:'—'},
            {label:'Status',val:cliente.status},
          ].map(({label,val})=>(
            <div key={label} style={{background:'rgba(255,255,255,.03)',borderRadius:10,padding:'10px 12px',border:'1px solid rgba(255,255,255,.04)'}}>
              <p style={{fontSize:9,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.08em',margin:'0 0 3px'}}>{label}</p>
              <p style={{fontSize:13,fontWeight:700,color:'white',margin:0,fontFamily:label==='Serial'||label==='Login'?'monospace':'inherit'}}>{val}</p>
            </div>
          ))}
        </div>
        {/* Resumo financeiro */}
        <div style={{padding:'14px 24px',borderBottom:'1px solid rgba(255,255,255,.05)',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {[
            {label:'Total OS',val:os.length,col:'#a78bfa'},
            {label:'Pagas',val:os.filter(o=>o.status==='Pago').length,col:'#4ade80'},
            {label:'Recebido',val:fmt(totalPago),col:'#34d399'},
          ].map(({label,val,col})=>(
            <div key={label} style={{textAlign:'center',background:'rgba(255,255,255,.03)',borderRadius:10,padding:'10px 8px',border:'1px solid rgba(255,255,255,.04)'}}>
              <p style={{fontSize:9,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.08em',margin:'0 0 4px'}}>{label}</p>
              <p style={{fontSize:18,fontWeight:800,color:col,margin:0}}>{val}</p>
            </div>
          ))}
        </div>
        {/* Lista OS */}
        <div style={{padding:'16px 24px',display:'flex',flexDirection:'column',gap:8}}>
          <p style={{fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.08em',margin:'0 0 4px'}}>Ordens de Serviço ({os.length})</p>
          {os.length===0 && <p style={{color:'#334155',fontSize:12,textAlign:'center',padding:'24px 0',border:'1px dashed rgba(255,255,255,.06)',borderRadius:12}}>Nenhuma OS encontrada</p>}
          {os.map(o=>(
            <div key={o.id} style={{background:'rgba(8,12,20,.5)',borderRadius:12,padding:'12px 14px',border:'1px solid rgba(255,255,255,.04)',borderLeft:`3px solid ${tipoCor[o.tipo]||'#64748b'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5,flexWrap:'wrap'}}>
                    <span style={{fontSize:9,padding:'2px 7px',borderRadius:5,background:`${tipoCor[o.tipo]||'#64748b'}18`,color:tipoCor[o.tipo]||'#64748b',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase'}}>{o.tipo}</span>
                    <OSStatusBadge status={o.status}/>
                  </div>
                  <div style={{display:'flex',gap:12,fontSize:11,color:'#64748b',flexWrap:'wrap'}}>
                    {o.dataAgendada&&<span style={{display:'flex',alignItems:'center',gap:3}}><Calendar size={11}/>{new Date(o.dataAgendada).toLocaleDateString('pt-BR')}</span>}
                    {o.relato&&<span style={{fontStyle:'italic',color:'#475569'}}>"{o.relato.slice(0,50)}{o.relato.length>50?'…':''}"</span>}
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <p style={{fontSize:15,fontWeight:800,color:o.status==='Pago'?'#4ade80':o.status==='Concluído'?'#fbbf24':'#64748b',margin:0}}>{fmt(VALORES_OS[o.tipo]||0)}</p>
                  <p style={{fontSize:9,color:'#334155',margin:'2px 0 0',textTransform:'uppercase',letterSpacing:'.06em'}}>{o.status==='Pago'?'recebido':o.status==='Concluído'?'a receber':'pendente'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Busca global overlay ──────────────────────────────────────────────────────
function BuscaGlobal({ clientes, ordens, consultas, onClose, onNav }) {
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useEffect(()=>{ ref.current?.focus(); },[]);

  const s = q.toLowerCase().trim();
  const res = s.length < 2 ? null : {
    clientes:  clientes.filter(c  => c.nome?.toLowerCase().includes(s)||c.serial?.toLowerCase().includes(s)||c.login?.toLowerCase().includes(s)).slice(0,5),
    ordens:    ordens.filter(o    => o.nome?.toLowerCase().includes(s)||o.serial?.toLowerCase().includes(s)||o.cto?.toLowerCase().includes(s)).slice(0,5),
    consultas: consultas.filter(c => c.nome?.toLowerCase().includes(s)||c.documento?.toLowerCase().includes(s)).slice(0,4),
  };
  const total = res ? res.clientes.length+res.ordens.length+res.consultas.length : 0;
  const tipoCor = {'Nova Ativação':'#3b82f6','Reparo Técnico':'#ef4444','Mudança de Endereço':'#f59e0b','Recolha de Equipamento':'#a78bfa'};

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',zIndex:60,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'60px 16px'}} onClick={onClose}>
      <div style={{width:'100%',maxWidth:680,background:'#0d1526',border:'1px solid rgba(255,255,255,.1)',borderRadius:20,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          <Search size={18} color="#a78bfa"/>
          <input ref={ref} type="text" placeholder="Buscar clientes, OS, consultas Serasa..." value={q} onChange={e=>setQ(e.target.value)}
            style={{flex:1,background:'transparent!important',border:'none!important',outline:'none',fontSize:16,color:'white',fontFamily:'inherit'}}/>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.06)',border:'none',borderRadius:8,padding:'4px 8px',cursor:'pointer',color:'#64748b',fontSize:11,fontWeight:700}}>ESC</button>
        </div>
        <div className="scroll" style={{maxHeight:480,overflowY:'auto'}}>
          {!res && <p style={{padding:'32px',textAlign:'center',color:'#334155',fontSize:13}}>Digite ao menos 2 caracteres para pesquisar…</p>}
          {res && total===0 && <p style={{padding:'32px',textAlign:'center',color:'#334155',fontSize:13}}>Nenhum resultado encontrado para "<b style={{color:'#64748b'}}>{q}</b>"</p>}
          {res && res.clientes.length>0 && (
            <div style={{padding:'12px 0'}}>
              <p style={{fontSize:9,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.1em',padding:'0 20px 8px'}}>Clientes ({res.clientes.length})</p>
              {res.clientes.map(c=>(
                <button key={c.id} onClick={()=>onNav('clientes',c)} style={{width:'100%',padding:'10px 20px',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:12,textAlign:'left',transition:'background .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.04)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  <div style={{width:36,height:36,borderRadius:10,background:'rgba(59,130,246,.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Users size={16} color="#3b82f6"/></div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:13,fontWeight:700,color:'white',margin:'0 0 2px'}}>{c.nome}</p>
                    <p style={{fontSize:11,color:'#475569',margin:0,fontFamily:'monospace'}}>{c.serial} · {c.cto}/P{c.porta}</p>
                  </div>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:6,background:c.status==='Ativo'?'rgba(34,197,94,.12)':'rgba(239,68,68,.12)',color:c.status==='Ativo'?'#4ade80':'#f87171',fontWeight:700}}>{c.status}</span>
                </button>
              ))}
            </div>
          )}
          {res && res.ordens.length>0 && (
            <div style={{padding:'12px 0',borderTop:'1px solid rgba(255,255,255,.04)'}}>
              <p style={{fontSize:9,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.1em',padding:'0 20px 8px'}}>Ordens de Serviço ({res.ordens.length})</p>
              {res.ordens.map(o=>(
                <button key={o.id} onClick={()=>onNav('suporte')} style={{width:'100%',padding:'10px 20px',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:12,textAlign:'left',transition:'background .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.04)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  <div style={{width:36,height:36,borderRadius:10,background:`${tipoCor[o.tipo]||'#64748b'}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Wrench size={16} color={tipoCor[o.tipo]||'#64748b'}/></div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:13,fontWeight:700,color:'white',margin:'0 0 2px'}}>{o.nome}</p>
                    <p style={{fontSize:11,color:'#475569',margin:0}}>{o.tipo} · {o.cto?`${o.cto}/P${o.porta}`:'Sem CTO'}</p>
                  </div>
                  <OSStatusBadge status={o.status}/>
                </button>
              ))}
            </div>
          )}
          {res && res.consultas.length>0 && (
            <div style={{padding:'12px 0',borderTop:'1px solid rgba(255,255,255,.04)'}}>
              <p style={{fontSize:9,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.1em',padding:'0 20px 8px'}}>Consultas Serasa ({res.consultas.length})</p>
              {res.consultas.map(c=>(
                <button key={c.id} onClick={()=>onNav('serasa')} style={{width:'100%',padding:'10px 20px',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:12,textAlign:'left',transition:'background .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.04)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  <div style={{width:36,height:36,borderRadius:10,background:'rgba(167,139,250,.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><FileSearch size={16} color="#a78bfa"/></div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:13,fontWeight:700,color:'white',margin:'0 0 2px'}}>{c.nome}</p>
                    <p style={{fontSize:11,color:'#475569',margin:0,fontFamily:'monospace'}}>{c.tipoDoc}: {c.documento}</p>
                  </div>
                  <ResultBadge r={c.resultado}/>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const toast = useToast?.() || (() => {});

  const [tela, setTela] = useState('menu');
  const [buscaGlobalAberta, setBuscaGlobalAberta] = useState(false);
  const [historicoCliente, setHistoricoCliente] = useState(null);

  // ── Dados ─────────────────────────────────────────────────────────────────
  const [clientes,  setClientes]  = useState([]);
  const [ordens,    setOrdens]    = useState([]);
  const [bobinas,   setBobinas]   = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [estoque,   setEstoque]   = useState([]);

  // ── Forms ─────────────────────────────────────────────────────────────────
  const [editClienteId, setEditClienteId] = useState(null);
  const [editOrdemId,   setEditOrdemId]   = useState(null);
  const [editConsId,    setEditConsId]    = useState(null);
  const [editEstId,     setEditEstId]     = useState(null);

  const [fCliente, setFCliente] = useState({nome:'',login:'',serial:'',cto:'',porta:'',observacao:'',status:'Ativo'});
  const [fOrdem,   setFOrdem]   = useState({nome:'',serial:'',cto:'',porta:'',tipo:'Nova Ativação',dataAgendada:'',relato:'',status:'Pendente'});
  const [fCons,    setFCons]    = useState({nome:'',documento:'',tipoDoc:'CPF',score:'',resultado:'Pendente Análise',restricoes:'',observacao:'',dataConsulta:new Date().toISOString().split('T')[0],telefone:'',convertido:false});
  const [fEst,     setFEst]     = useState({nome:'',categoria:'ONU',quantidade:'',minimo:'',observacao:''});

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [fBCliente, setFBCliente] = useState('');
  const [fSCliente, setFSCliente] = useState('Todos');
  const [fBOrdem,   setFBOrdem]   = useState('');
  const [fSOrdem,   setFSOrdem]   = useState('Todos');
  const [fTOrdem,   setFTOrdem]   = useState('Todos Tipos');
  const [fBCons,    setFBCons]    = useState('');
  const [fRCons,    setFRCons]    = useState('Todos');
  const [fTCons,    setFTCons]    = useState('Todos');
  const [fBEst,     setFBEst]     = useState('');
  const [fCatEst,   setFCatEst]   = useState('Todos');
  const [fMesFinanc,setFMesFinanc]= useState('');

  // ── Firebase ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const subs = [
      onSnapshot(query(collection(db,'clientes'),  orderBy('nome','asc')),       s=>setClientes(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(query(collection(db,'suporte'),   orderBy('dataAgendada','asc')),s=>setOrdens(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(query(collection(db,'bobinas'),   orderBy('identificacao','asc')),s=>setBobinas(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(query(collection(db,'consultas'), orderBy('dataConsulta','desc')),s=>setConsultas(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(query(collection(db,'estoque'),   orderBy('nome','asc')),        s=>setEstoque(s.docs.map(d=>({id:d.id,...d.data()})))),
    ];
    return ()=>subs.forEach(u=>u());
  },[]);

  // keyboard shortcut busca global
  useEffect(()=>{
    const h = e => { if((e.metaKey||e.ctrlKey)&&e.key==='k'){ e.preventDefault(); setBuscaGlobalAberta(true); }};
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  },[]);

  // ── CRUD Clientes ─────────────────────────────────────────────────────────
  const salvarCliente = async () => {
    if(!fCliente.nome||!fCliente.serial) return toast('Nome e Serial obrigatórios','error');
    if(!editClienteId){
      if(clientes.find(c=>c.serial?.toLowerCase()===fCliente.serial.toLowerCase()&&c.status==='Ativo')) return toast(`Serial ${fCliente.serial} já em uso!`,'error');
      if(clientes.find(c=>c.nome?.toLowerCase()===fCliente.nome.toLowerCase()&&c.status==='Ativo')) return toast(`Nome já cadastrado como Ativo!`,'error');
    }
    try{
      if(editClienteId){ await updateDoc(doc(db,'clientes',editClienteId),fCliente); setEditClienteId(null); toast('Cliente atualizado'); }
      else { await addDoc(collection(db,'clientes'),{...fCliente,dataCadastro:new Date().toISOString()}); toast('Cliente cadastrado!'); }
      setFCliente({nome:'',login:'',serial:'',cto:'',porta:'',observacao:'',status:'Ativo'});
    }catch{ toast('Erro ao salvar','error'); }
  };
  const toggleStatusCliente = async(id,s)=>updateDoc(doc(db,'clientes',id),{status:s==='Ativo'?'Desativado':'Ativo'});
  const excluirCliente = async id=>{ if(window.confirm('Apagar cliente?')){ await deleteDoc(doc(db,'clientes',id)); toast('Cliente removido','warn'); }};

  // ── CRUD Ordens ───────────────────────────────────────────────────────────
  const salvarOrdem = async () => {
    if(!fOrdem.nome||!fOrdem.tipo) return toast('Nome e Tipo obrigatórios','error');
    try{
      if(editOrdemId){ await updateDoc(doc(db,'suporte',editOrdemId),fOrdem); setEditOrdemId(null); toast('OS atualizada'); }
      else { await addDoc(collection(db,'suporte'),{...fOrdem,dataCriacao:new Date().toISOString()}); toast('OS criada!'); }
      setFOrdem({nome:'',serial:'',cto:'',porta:'',tipo:'Nova Ativação',dataAgendada:'',relato:'',status:'Pendente'});
    }catch{ toast('Erro ao salvar','error'); }
  };
  const avancarStatusOS = async(id,s)=>{
    const p={'Pendente':'Concluído','Concluído':'Pago','Pago':'Pendente'};
    await updateDoc(doc(db,'suporte',id),{status:p[s]});
    toast(p[s]==='Pago'?'✓ Marcado como Pago!':p[s]==='Concluído'?'Serviço concluído':'Reaberto como Pendente','info');
  };
  const excluirOrdem = async id=>{ if(window.confirm('Apagar OS?')){ await deleteDoc(doc(db,'suporte',id)); toast('OS removida','warn'); }};

  // ── CRUD Bobinas ──────────────────────────────────────────────────────────
  const salvarBobina = async()=>{
    if(!fOrdem.identificacao&&!bobinas) return;
    if(!fBObina?.identificacao) return;
  };
  // Estado separado pra bobina
  const [fBObina, setFBObina] = useState({identificacao:'',tipo:'Drop 1FO',total:'',usado:'',marca:''});
  const salvarBobin = async()=>{
    if(!fBObina.identificacao||!fBObina.total) return toast('Identificação e Total obrigatórios','error');
    try{
      await addDoc(collection(db,'bobinas'),{...fBObina,total:Number(fBObina.total),usado:Number(fBObina.usado||0),dataEntrada:new Date().toISOString()});
      setFBObina({identificacao:'',tipo:'Drop 1FO',total:'',usado:'',marca:''});
      toast('Bobina cadastrada!');
    }catch{ toast('Erro ao salvar','error'); }
  };
  const registrarUso = async(id,usado,val)=>{
    if(!val||isNaN(val)||Number(val)<=0) return toast('Valor inválido','error');
    await updateDoc(doc(db,'bobinas',id),{usado:Number(usado)+Number(val)});
    toast(`${val}m descontados`);
  };
  const excluirBobina = async id=>{ if(window.confirm('Apagar bobina?')){ await deleteDoc(doc(db,'bobinas',id)); toast('Bobina removida','warn'); }};

  // ── CRUD Consultas Serasa ─────────────────────────────────────────────────
  const salvarCons = async()=>{
    if(!fCons.nome||!fCons.documento) return toast('Nome e Documento obrigatórios','error');
    try{
      if(editConsId){ await updateDoc(doc(db,'consultas',editConsId),{...fCons,score:fCons.score?Number(fCons.score):null}); setEditConsId(null); toast('Consulta atualizada'); }
      else { await addDoc(collection(db,'consultas'),{...fCons,score:fCons.score?Number(fCons.score):null,dataCriacao:new Date().toISOString()}); toast('Consulta registrada!'); }
      setFCons({nome:'',documento:'',tipoDoc:'CPF',score:'',resultado:'Pendente Análise',restricoes:'',observacao:'',dataConsulta:new Date().toISOString().split('T')[0],telefone:'',convertido:false});
    }catch{ toast('Erro ao salvar','error'); }
  };
  const toggleConvertido = async(id,v)=>{ await updateDoc(doc(db,'consultas',id),{convertido:!v}); toast(!v?'Marcado como convertido':'Conversão removida'); };
  const excluirCons = async id=>{ if(window.confirm('Apagar consulta?')){ await deleteDoc(doc(db,'consultas',id)); toast('Consulta removida','warn'); }};

  // ── CRUD Estoque ──────────────────────────────────────────────────────────
  const salvarEst = async()=>{
    if(!fEst.nome||!fEst.quantidade) return toast('Nome e Quantidade obrigatórios','error');
    try{
      if(editEstId){ await updateDoc(doc(db,'estoque',editEstId),{...fEst,quantidade:Number(fEst.quantidade),minimo:Number(fEst.minimo||0)}); setEditEstId(null); toast('Item atualizado'); }
      else { await addDoc(collection(db,'estoque'),{...fEst,quantidade:Number(fEst.quantidade),minimo:Number(fEst.minimo||0),dataCadastro:new Date().toISOString()}); toast('Item cadastrado!'); }
      setFEst({nome:'',categoria:'ONU',quantidade:'',minimo:'',observacao:''});
    }catch{ toast('Erro ao salvar','error'); }
  };
  const ajustarEst = async(id,qtdAtual,delta)=>{
    const nova = Math.max(0,Number(qtdAtual)+Number(delta));
    await updateDoc(doc(db,'estoque',id),{quantidade:nova});
    toast(`Estoque ${delta>0?'aumentado':'reduzido'}: ${nova} unidades`);
  };
  const excluirEst = async id=>{ if(window.confirm('Apagar item do estoque?')){ await deleteDoc(doc(db,'estoque',id)); toast('Item removido','warn'); }};

  // ── Financeiro (derivado das OS) ──────────────────────────────────────────
  const ordensComValor = ordens.map(o=>({...o,valor:VALORES_OS[o.tipo]||0}));

  const filtrarMes = os => {
    if(!fMesFinanc) return os;
    return os.filter(o=>o.dataAgendada?.startsWith(fMesFinanc)||o.dataCriacao?.startsWith(fMesFinanc));
  };
  const osFinanc = filtrarMes(ordensComValor);

  const finStats = {
    totalRecebido: osFinanc.filter(o=>o.status==='Pago').reduce((a,o)=>a+o.valor,0),
    totalPendente: osFinanc.filter(o=>o.status==='Pendente').reduce((a,o)=>a+o.valor,0),
    totalConcluido:osFinanc.filter(o=>o.status==='Concluído').reduce((a,o)=>a+o.valor,0),
    qtdPago:       osFinanc.filter(o=>o.status==='Pago').length,
    qtdConcluido:  osFinanc.filter(o=>o.status==='Concluído').length,
    qtdPendente:   osFinanc.filter(o=>o.status==='Pendente').length,
    porTipo: Object.entries(VALORES_OS).map(([tipo,val])=>({
      tipo, val,
      qtd: osFinanc.filter(o=>o.tipo===tipo).length,
      pago: osFinanc.filter(o=>o.tipo===tipo&&o.status==='Pago').reduce((a,o)=>a+o.valor,0),
    })),
  };

  // ── Filtros listas ────────────────────────────────────────────────────────
  const clientesFilt = clientes.filter(c=>{
    const s=fBCliente.toLowerCase();
    return (c.nome?.toLowerCase().includes(s)||c.serial?.toLowerCase().includes(s)||c.login?.toLowerCase().includes(s))&&
           (fSCliente==='Todos'||c.status===fSCliente);
  }).sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR',{sensitivity:'base'}));

  const ordensFilt = ordens.filter(o=>{
    const s=fBOrdem.toLowerCase();
    return (o.nome?.toLowerCase().includes(s)||o.serial?.toLowerCase().includes(s)||o.cto?.toLowerCase().includes(s))&&
           (fSOrdem==='Todos'||o.status===fSOrdem)&&(fTOrdem==='Todos Tipos'||o.tipo===fTOrdem);
  });

  const consFilt = consultas.filter(c=>{
    const s=fBCons.toLowerCase();
    return (c.nome?.toLowerCase().includes(s)||c.documento?.toLowerCase().includes(s))&&
           (fRCons==='Todos'||c.resultado===fRCons)&&(fTCons==='Todos'||c.tipoDoc===fTCons);
  });

  const estFilt = estoque.filter(e=>{
    const s=fBEst.toLowerCase();
    return (e.nome?.toLowerCase().includes(s))&&(fCatEst==='Todos'||e.categoria===fCatEst);
  });

  // ── Helpers visuais ───────────────────────────────────────────────────────
  const inp  = {padding:'13px 15px',borderRadius:12,width:'100%',fontSize:14};
  const fw   = {display:'flex',flexDirection:'column',gap:0};
  const tipoCor={'Nova Ativação':'#3b82f6','Reparo Técnico':'#ef4444','Mudança de Endereço':'#f59e0b','Recolha de Equipamento':'#a78bfa'};
  const catCor={'ONU':'#3b82f6','Roteador':'#10b981','Splitter':'#f59e0b','Conector':'#f97316','Cabo':'#a78bfa','Outro':'#64748b'};
  const btnTab=(on,c)=>({padding:'7px 13px',borderRadius:9,fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',cursor:'pointer',border:'none',display:'flex',alignItems:'center',gap:6,transition:'all .2s',background:on?c:'transparent',color:on?'white':'#64748b'});
  const btnAcao=(bg,col,bd)=>({padding:7,borderRadius:8,background:bg,border:`1px solid ${bd}`,cursor:'pointer',color:col,display:'flex',alignItems:'center'});
  const backBtn=(cor,label)=>(
    <button onClick={()=>setTela('menu')} style={{marginBottom:24,color:cor,fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer'}}>
      <LayoutDashboard size={15}/>{label||'Voltar ao Painel'}
    </button>
  );
  const secHeader=(icon,label,cor)=>(
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20,paddingBottom:14,borderBottom:'1px solid rgba(255,255,255,.05)'}}>
      {React.cloneElement(icon,{size:17,color:cor})}
      <h2 style={{fontSize:14,fontWeight:800,textTransform:'uppercase',letterSpacing:'.07em',margin:0,color:'white'}}>{label}</h2>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{minHeight:'100vh',padding:'24px 16px 80px',maxWidth:1300,margin:'0 auto'}}>
      <GlobalStyle/>

      {/* Busca global overlay */}
      {buscaGlobalAberta && (
        <BuscaGlobal
          clientes={clientes} ordens={ordens} consultas={consultas}
          onClose={()=>setBuscaGlobalAberta(false)}
          onNav={(t,c)=>{ setTela(t); setBuscaGlobalAberta(false); if(c) setTimeout(()=>setHistoricoCliente(c),200); }}
        />
      )}

      {/* Modal histórico */}
      {historicoCliente && <HistoricoModal cliente={historicoCliente} ordens={ordens} onClose={()=>setHistoricoCliente(null)}/>}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:36,flexWrap:'wrap',gap:12}}>
        <div onClick={()=>setTela('menu')} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
          <div style={{background:'linear-gradient(135deg,#3b82f6,#6366f1)',padding:8,borderRadius:12,display:'flex'}}>
            <Wifi size={20} color="white"/>
          </div>
          <div>
            <h1 style={{fontSize:20,fontWeight:800,color:'white',margin:0,letterSpacing:'-.5px'}}>Lumix Fibra</h1>
            <p style={{fontSize:9,fontWeight:700,color:'#475569',margin:0,letterSpacing:'.15em',textTransform:'uppercase'}}>Painel Administrativo v2.2</p>
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>setBuscaGlobalAberta(true)}
            style={{display:'flex',alignItems:'center',gap:8,padding:'9px 16px',background:'rgba(16,24,40,.8)',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,cursor:'pointer',color:'#64748b',fontSize:12,fontWeight:600,gap:8}}>
            <Search size={14}/> Busca rápida
            <span style={{fontSize:10,padding:'1px 6px',borderRadius:5,background:'rgba(255,255,255,.06)',color:'#475569',fontFamily:'monospace'}}>⌘K</span>
          </button>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',background:'rgba(16,24,40,.6)',borderRadius:12,border:'1px solid rgba(255,255,255,.06)'}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#22c55e'}} className="pdot"/>
            <span style={{fontSize:11,fontWeight:600,color:'#94a3b8'}}>Online</span>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════ MENU ═══════════════════════════════════ */}
      {tela==='menu' && (
        <div className="page">
          {/* Quick stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginBottom:32}}>
            {[
              {label:'Clientes Ativos', val:clientes.filter(c=>c.status==='Ativo').length,   col:'#3b82f6'},
              {label:'OS Pendentes',    val:ordens.filter(o=>o.status==='Pendente').length,    col:'#f59e0b'},
              {label:'A Receber',       val:fmt(ordens.filter(o=>o.status==='Concluído').reduce((a,o)=>a+(VALORES_OS[o.tipo]||0),0)), col:'#34d399'},
              {label:'Recebido Total',  val:fmt(ordens.filter(o=>o.status==='Pago').reduce((a,o)=>a+(VALORES_OS[o.tipo]||0),0)),      col:'#4ade80'},
              {label:'Alertas Estoque', val:estoque.filter(e=>e.quantidade<=e.minimo).length, col:'#f87171'},
              {label:'Consultas Serasa',val:consultas.length,                                  col:'#a78bfa'},
            ].map(({label,val,col})=>(
              <div key={label} className="stat-card">
                <p style={{fontSize:9,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.08em',margin:'0 0 6px'}}>{label}</p>
                <p style={{fontSize:22,fontWeight:800,color:col,margin:0,lineHeight:1}}>{val}</p>
              </div>
            ))}
          </div>

          {/* Alertas estoque */}
          {estoque.filter(e=>e.quantidade<=e.minimo).length>0 && (
            <div style={{marginBottom:24,background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:16,padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
              <AlertTriangle size={18} color="#f87171" style={{flexShrink:0}}/>
              <div style={{flex:1}}>
                <p style={{fontSize:12,fontWeight:700,color:'#f87171',margin:'0 0 2px',textTransform:'uppercase',letterSpacing:'.06em'}}>Alerta de Estoque Baixo</p>
                <p style={{fontSize:12,color:'#94a3b8',margin:0}}>{estoque.filter(e=>e.quantidade<=e.minimo).map(e=>`${e.nome} (${e.quantidade} un.)`).join(' · ')}</p>
              </div>
              <button onClick={()=>setTela('estoque')} style={{fontSize:11,padding:'6px 12px',borderRadius:8,background:'rgba(239,68,68,.15)',color:'#f87171',border:'1px solid rgba(239,68,68,.3)',cursor:'pointer',fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',flexShrink:0}}>Ver Estoque</button>
            </div>
          )}

          {/* Cards módulos */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16}}>
            {[
              {id:'clientes',  icon:<Users size={32}/>,       label:'Clientes & CTO',      desc:'Portas, seriais e histórico.',   cor:'#3b82f6', bgCor:'rgba(59,130,246,.1)',  bd:'rgba(59,130,246,.2)'},
              {id:'suporte',   icon:<Wrench size={32}/>,      label:'Ativação & Suporte',  desc:'Ordens de serviço e reparos.',   cor:'#f59e0b', bgCor:'rgba(245,158,11,.1)', bd:'rgba(245,158,11,.2)'},
              {id:'financeiro',icon:<Banknote size={32}/>,    label:'Financeiro',           desc:'Cobranças, recebimentos e resumo.', cor:'#34d399',bgCor:'rgba(52,211,153,.1)',bd:'rgba(52,211,153,.2)'},
              {id:'estoque',   icon:<Boxes size={32}/>,       label:'Estoque',              desc:'Equipamentos e materiais.',      cor:'#fb923c', bgCor:'rgba(251,146,60,.1)', bd:'rgba(251,146,60,.2)'},
              {id:'bobinas',   icon:<Database size={32}/>,    label:'Bobinas de Fibra',     desc:'Metragem e controle de campo.',  cor:'#10b981', bgCor:'rgba(16,185,129,.1)', bd:'rgba(16,185,129,.2)'},
              {id:'serasa',    icon:<FileSearch size={32}/>,  label:'Consulta Serasa',      desc:'CPF/CNPJ e análise de crédito.', cor:'#a78bfa', bgCor:'rgba(167,139,250,.1)',bd:'rgba(167,139,250,.2)'},
            ].map(m=>(
              <button key={m.id} onClick={()=>setTela(m.id)} className="menu-card"
                style={{background:'rgba(16,24,40,.7)',border:`1px solid ${m.bd}`,borderRadius:20,padding:'28px 22px',textAlign:'left',cursor:'pointer',display:'flex',flexDirection:'column',gap:16}}>
                <div style={{background:m.bgCor,borderRadius:14,padding:14,width:'fit-content',color:m.cor}}>{m.icon}</div>
                <div>
                  <h3 style={{fontSize:16,fontWeight:800,color:'white',margin:'0 0 4px',letterSpacing:'-.3px'}}>{m.label}</h3>
                  <p style={{fontSize:12,color:'#64748b',margin:0,lineHeight:1.5}}>{m.desc}</p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:5,color:m.cor,fontSize:11,fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase'}}>
                  Acessar <ChevronRight size={13}/>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════ FINANCEIRO ═════════════════════════════ */}
      {tela==='financeiro' && (
        <div className="page">
          {backBtn('#34d399')}

          {/* Filtro mês */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(16,24,40,.7)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:'8px 14px'}}>
              <Calendar size={14} color="#64748b"/>
              <input type="month" value={fMesFinanc} onChange={e=>setFMesFinanc(e.target.value)}
                style={{background:'transparent!important',border:'none!important',color:'#94a3b8',fontSize:13,cursor:'pointer',outline:'none'}}/>
              {fMesFinanc&&<button onClick={()=>setFMesFinanc('')} style={{background:'none',border:'none',cursor:'pointer',color:'#475569',display:'flex',padding:0}}><X size={13}/></button>}
            </div>
            <span style={{fontSize:11,color:'#475569'}}>
              {fMesFinanc ? `Exibindo: ${new Date(fMesFinanc+'-01').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}` : 'Exibindo: Todos os períodos'}
            </span>
          </div>

          {/* Stats financeiros */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:28}}>
            {[
              {label:'Total Recebido',  val:fmt(finStats.totalRecebido),  col:'#4ade80', sub:`${finStats.qtdPago} OS pagas`},
              {label:'A Receber',       val:fmt(finStats.totalConcluido), col:'#fbbf24', sub:`${finStats.qtdConcluido} OS concluídas`},
              {label:'Em Aberto',       val:fmt(finStats.totalPendente),  col:'#f87171', sub:`${finStats.qtdPendente} OS pendentes`},
              {label:'Potencial Total', val:fmt(finStats.totalRecebido+finStats.totalConcluido+finStats.totalPendente), col:'#a78bfa', sub:'soma de todas'},
            ].map(({label,val,col,sub})=>(
              <div key={label} className="stat-card">
                <p style={{fontSize:9,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.08em',margin:'0 0 8px'}}>{label}</p>
                <p style={{fontSize:22,fontWeight:800,color:col,margin:'0 0 4px',lineHeight:1}}>{val}</p>
                <p style={{fontSize:10,color:'#334155',margin:0}}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Tabela por tipo */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
            {/* Por tipo de OS */}
            <div className="glass" style={{borderRadius:20,padding:22,borderColor:'rgba(52,211,153,.1)'}}>
              {secHeader(<BarChart2/>, 'Receita por Tipo de Serviço','#34d399')}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {finStats.porTipo.map(({tipo,val,qtd,pago})=>{
                  const cor = tipoCor[tipo]||'#64748b';
                  return (
                    <div key={tipo} style={{display:'flex',flexDirection:'column',gap:6}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:3,height:32,borderRadius:2,background:cor}}/>
                          <div>
                            <p style={{fontSize:12,fontWeight:700,color:'white',margin:'0 0 1px'}}>{tipo}</p>
                            <p style={{fontSize:10,color:'#475569',margin:0}}>{qtd} OS · {fmt(val)} cada</p>
                          </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <p style={{fontSize:14,fontWeight:800,color:'#4ade80',margin:'0 0 1px'}}>{fmt(pago)}</p>
                          <p style={{fontSize:10,color:'#334155',margin:0}}>recebido</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OS com valor + status */}
            <div className="glass" style={{borderRadius:20,padding:22,borderColor:'rgba(255,255,255,.05)'}}>
              {secHeader(<Receipt/>, 'Últimas OS com Valor','#34d399')}
              <div style={{display:'flex',flexDirection:'column',gap:8}} className="scroll" style={{maxHeight:300,overflowY:'auto',display:'flex',flexDirection:'column',gap:8}}>
                {osFinanc.slice().reverse().slice(0,12).map(o=>(
                  <div key={o.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:'rgba(8,12,20,.5)',borderRadius:10,border:'1px solid rgba(255,255,255,.04)'}}>
                    <div style={{flex:1}}>
                      <p style={{fontSize:12,fontWeight:700,color:'white',margin:'0 0 2px'}}>{o.nome}</p>
                      <span style={{fontSize:9,padding:'1px 6px',borderRadius:4,background:`${tipoCor[o.tipo]||'#64748b'}18`,color:tipoCor[o.tipo]||'#64748b',fontWeight:700,textTransform:'uppercase'}}>{o.tipo}</span>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <p style={{fontSize:14,fontWeight:800,margin:'0 0 3px',color:o.status==='Pago'?'#4ade80':o.status==='Concluído'?'#fbbf24':'#64748b'}}>{fmt(o.valor)}</p>
                      <OSStatusBadge status={o.status}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Exportar PDF financeiro */}
          <button onClick={()=>{
            const d=new jsPDF();
            d.setFontSize(14); d.text('LUMIX FIBRA — Relatório Financeiro',14,16);
            d.setFontSize(9); d.text(`Gerado: ${new Date().toLocaleString('pt-BR')}`,14,22);
            d.autoTable({startY:28,head:[['Cliente','Tipo','Status','Valor','Data']],
              body:osFinanc.map(o=>[o.nome,o.tipo,o.status,fmt(o.valor),o.dataAgendada?new Date(o.dataAgendada).toLocaleDateString('pt-BR'):'—']),
              theme:'grid',headStyles:{fillColor:[5,150,105]},bodyStyles:{fontSize:8}});
            d.save('Financeiro_Lumix.pdf');
          }} style={{display:'flex',alignItems:'center',gap:8,padding:'11px 18px',borderRadius:12,background:'rgba(52,211,153,.1)',color:'#34d399',border:'1px solid rgba(52,211,153,.25)',cursor:'pointer',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em'}}>
            <Printer size={15}/> Exportar Relatório PDF
          </button>
        </div>
      )}

      {/* ═══════════════════════════ ESTOQUE ════════════════════════════════ */}
      {tela==='estoque' && (
        <div className="page">
          {backBtn('#fb923c')}

          <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:20,alignItems:'start'}}>
            {/* Form estoque */}
            <div className="glass" style={{borderRadius:20,padding:22,borderColor:'rgba(251,146,60,.12)',position:'sticky',top:16}}>
              {secHeader(<Package/>, editEstId?'Editar Item':'Novo Item de Estoque','#fb923c')}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div style={fw}><p className="fl">Nome do Item</p><input style={inp} placeholder="Ex: ONU ZTE F601" value={fEst.nome} onChange={e=>setFEst({...fEst,nome:e.target.value})}/></div>
                <div style={fw}><p className="fl">Categoria</p>
                  <select style={inp} value={fEst.categoria} onChange={e=>setFEst({...fEst,categoria:e.target.value})}>
                    <option>ONU</option><option>Roteador</option><option>Splitter</option><option>Conector</option><option>Cabo</option><option>Outro</option>
                  </select>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div style={fw}><p className="fl">Quantidade</p><input style={inp} type="number" min="0" placeholder="0" value={fEst.quantidade} onChange={e=>setFEst({...fEst,quantidade:e.target.value})}/></div>
                  <div style={fw}><p className="fl">Mínimo</p><input style={inp} type="number" min="0" placeholder="Alerta abaixo de" value={fEst.minimo} onChange={e=>setFEst({...fEst,minimo:e.target.value})}/></div>
                </div>
                <div style={fw}><p className="fl">Observação</p><textarea style={{...inp,height:60,resize:'none'}} placeholder="Modelo, cor, especificação..." value={fEst.observacao} onChange={e=>setFEst({...fEst,observacao:e.target.value})}/></div>
                <button onClick={salvarEst} className="btn" style={{background:'linear-gradient(135deg,#c2410c,#fb923c)',color:'white'}}>
                  <Save size={16}/>{editEstId?'Atualizar':'Cadastrar Item'}
                </button>
                {editEstId&&<button onClick={()=>{setEditEstId(null);setFEst({nome:'',categoria:'ONU',quantidade:'',minimo:'',observacao:''}); }} style={{background:'none',border:'none',color:'#475569',fontSize:11,fontWeight:700,textTransform:'uppercase',cursor:'pointer'}}>Cancelar</button>}
              </div>
            </div>

            {/* Lista estoque */}
            <div className="glass" style={{borderRadius:20,overflow:'hidden',borderColor:'rgba(255,255,255,.05)'}}>
              {/* Toolbar */}
              <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,.05)',display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                <div style={{position:'relative',flex:1,minWidth:180}}>
                  <Search size={14} color="#475569" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
                  <input style={{...inp,paddingLeft:36}} placeholder="Buscar item..." value={fBEst} onChange={e=>setFBEst(e.target.value)}/>
                </div>
                <div style={{display:'flex',gap:3,padding:4,background:'rgba(8,12,20,.6)',borderRadius:10,border:'1px solid rgba(255,255,255,.05)'}}>
                  {['Todos','ONU','Roteador','Splitter','Conector','Cabo','Outro'].map(c=>(
                    <button key={c} onClick={()=>setFCatEst(c)} style={btnTab(fCatEst===c,catCor[c]||'#fb923c')}>{c}</button>
                  ))}
                </div>
              </div>

              {/* Stats estoque */}
              <div style={{padding:'12px 20px',borderBottom:'1px solid rgba(255,255,255,.04)',display:'flex',gap:16,flexWrap:'wrap'}}>
                {[
                  {label:'Total Itens',val:estoque.length,col:'#fb923c'},
                  {label:'Alertas',val:estoque.filter(e=>e.quantidade<=e.minimo).length,col:'#f87171'},
                  {label:'Categorias',val:new Set(estoque.map(e=>e.categoria)).size,col:'#94a3b8'},
                ].map(({label,val,col})=>(
                  <div key={label} style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontSize:18,fontWeight:800,color:col}}>{val}</span>
                    <span style={{fontSize:10,color:'#475569',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em'}}>{label}</span>
                  </div>
                ))}
              </div>

              <div style={{padding:'14px 18px',display:'flex',flexDirection:'column',gap:8}} className="scroll" style={{padding:'14px 18px',display:'flex',flexDirection:'column',gap:8,overflowY:'auto',maxHeight:520}}>
                {estFilt.map(e=>{
                  const cor = catCor[e.categoria]||'#64748b';
                  const baixo = e.quantidade <= e.minimo;
                  return (
                    <div key={e.id} className="row-hover" style={{background:'rgba(8,12,20,.5)',borderRadius:14,padding:'14px 16px',border:`1px solid ${baixo?'rgba(239,68,68,.2)':'rgba(255,255,255,.04)'}`,borderLeft:`3px solid ${baixo?'#ef4444':cor}`,display:'flex',alignItems:'center',gap:14}}>
                      <div style={{width:44,height:44,borderRadius:12,background:`${cor}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Package size={20} color={cor}/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                          <p style={{fontSize:14,fontWeight:700,color:'white',margin:0}}>{e.nome}</p>
                          <span style={{fontSize:9,padding:'2px 7px',borderRadius:5,background:`${cor}15`,color:cor,border:`1px solid ${cor}25`,fontWeight:700,textTransform:'uppercase'}}>{e.categoria}</span>
                          {baixo&&<span style={{fontSize:9,padding:'2px 7px',borderRadius:5,background:'rgba(239,68,68,.12)',color:'#f87171',border:'1px solid rgba(239,68,68,.25)',fontWeight:700,display:'flex',alignItems:'center',gap:3}}><AlertTriangle size={10}/>Baixo</span>}
                        </div>
                        {e.observacao&&<p style={{fontSize:11,color:'#64748b',margin:0,fontStyle:'italic'}}>{e.observacao}</p>}
                        {e.minimo>0&&<p style={{fontSize:10,color:'#334155',margin:'3px 0 0'}}>Mínimo: {e.minimo} un.</p>}
                      </div>
                      {/* Ajustar quantidade */}
                      <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                        <button onClick={()=>ajustarEst(e.id,e.quantidade,-1)} style={{width:30,height:30,borderRadius:8,background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',cursor:'pointer',color:'#f87171',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700}}>−</button>
                        <div style={{textAlign:'center',minWidth:48}}>
                          <p style={{fontSize:20,fontWeight:800,color:baixo?'#f87171':'white',margin:0,lineHeight:1}}>{e.quantidade}</p>
                          <p style={{fontSize:9,color:'#334155',margin:0,textTransform:'uppercase',letterSpacing:'.06em'}}>unid.</p>
                        </div>
                        <button onClick={()=>ajustarEst(e.id,e.quantidade,1)} style={{width:30,height:30,borderRadius:8,background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.2)',cursor:'pointer',color:'#4ade80',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700}}>+</button>
                      </div>
                      {/* Ações */}
                      <div style={{display:'flex',gap:4,flexShrink:0}}>
                        <button onClick={()=>{setEditEstId(e.id);setFEst({nome:e.nome,categoria:e.categoria,quantidade:e.quantidade,minimo:e.minimo||0,observacao:e.observacao||''});window.scrollTo({top:0,behavior:'smooth'});}} style={btnAcao('rgba(255,255,255,.04)','#64748b','rgba(255,255,255,.06)')}><Edit size={14}/></button>
                        <button onClick={()=>excluirEst(e.id)} style={btnAcao('rgba(239,68,68,.07)','#f87171','rgba(239,68,68,.15)')}><Trash2 size={14}/></button>
                      </div>
                    </div>
                  );
                })}
                {estFilt.length===0&&<div style={{textAlign:'center',padding:'40px 0',color:'#334155',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',border:'1px dashed rgba(255,255,255,.06)',borderRadius:14}}>Nenhum item cadastrado</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════ BOBINAS ════════════════════════════════ */}
      {tela==='bobinas' && (
        <div className="page">
          {backBtn('#10b981')}
          <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:20,alignItems:'start'}}>
            <div className="glass" style={{borderRadius:20,padding:22,borderColor:'rgba(16,185,129,.12)',position:'sticky',top:16}}>
              {secHeader(<Plus/>,'Nova Bobina','#10b981')}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div style={fw}><p className="fl">Identificação</p><input style={inp} placeholder="Bobina 01 — João" value={fBObina.identificacao} onChange={e=>setFBObina({...fBObina,identificacao:e.target.value})}/></div>
                <div style={fw}><p className="fl">Tipo de Cabo</p><select style={inp} value={fBObina.tipo} onChange={e=>setFBObina({...fBObina,tipo:e.target.value})}><option>Drop 1FO</option><option>AS-80 6FO</option><option>AS-80 12FO</option></select></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div style={fw}><p className="fl">Total (m)</p><input style={inp} type="number" placeholder="1000" value={fBObina.total} onChange={e=>setFBObina({...fBObina,total:e.target.value})}/></div>
                  <div style={fw}><p className="fl">Usado (m)</p><input style={inp} type="number" placeholder="0" value={fBObina.usado} onChange={e=>setFBObina({...fBObina,usado:e.target.value})}/></div>
                </div>
                <div style={fw}><p className="fl">Marca</p><input style={inp} placeholder="Furukawa..." value={fBObina.marca} onChange={e=>setFBObina({...fBObina,marca:e.target.value})}/></div>
                <button onClick={salvarBobin} className="btn" style={{background:'linear-gradient(135deg,#059669,#10b981)',color:'white'}}><Save size={16}/>Registrar Bobina</button>
              </div>
            </div>
            <div className="glass" style={{borderRadius:20,padding:22,borderColor:'rgba(255,255,255,.05)'}}>
              {secHeader(<Layers/>,'Estoque em Campo','#10b981')}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {bobinas.map(b=>{
                  const rest=b.total-b.usado, perc=Math.min((b.usado/b.total)*100,100);
                  const barC=perc>90?'#ef4444':perc>75?'#f59e0b':'#10b981';
                  return (
                    <div key={b.id} style={{background:'rgba(8,12,20,.5)',borderRadius:14,padding:'16px',border:'1px solid rgba(255,255,255,.04)',borderLeft:'3px solid #10b981'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                        <div>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                            <h3 style={{fontSize:13,fontWeight:700,color:'white',margin:0,textTransform:'uppercase'}}>{b.identificacao}</h3>
                            <span style={{fontSize:9,padding:'1px 7px',borderRadius:5,background:'rgba(16,185,129,.12)',color:'#34d399',border:'1px solid rgba(16,185,129,.2)',fontWeight:700}}>{b.tipo}</span>
                          </div>
                          <p style={{fontSize:10,color:'#475569',margin:0,fontFamily:'monospace',textTransform:'uppercase'}}>Marca: {b.marca||'N/A'}</p>
                        </div>
                        <div style={{textAlign:'right',display:'flex',alignItems:'center',gap:8}}>
                          <div><p style={{fontSize:20,fontWeight:800,color:'#10b981',margin:0,lineHeight:1}}>{rest}<small style={{fontSize:10,fontWeight:500,color:'#475569'}}>m</small></p><p style={{fontSize:9,color:'#475569',margin:'2px 0 0',textTransform:'uppercase',letterSpacing:'.06em'}}>restantes</p></div>
                          <button onClick={()=>excluirBobina(b.id)} style={btnAcao('rgba(239,68,68,.07)','#f87171','rgba(239,68,68,.15)')}><Trash2 size={13}/></button>
                        </div>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontSize:9,color:'#475569',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em'}}>Usado: {b.usado}m ({perc.toFixed(1)}%)</span></div>
                      <div className="progress-bar" style={{marginBottom:12}}><div style={{height:'100%',width:`${perc}%`,background:barC,borderRadius:3,transition:'width .6s ease'}}/></div>
                      <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.02)',padding:'9px 12px',borderRadius:10,border:'1px solid rgba(255,255,255,.04)'}}>
                        <span style={{fontSize:10,color:'#64748b',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',flexShrink:0}}>Descontar (m):</span>
                        <input id={`d-${b.id}`} type="number" placeholder="120" style={{flex:1,padding:'6px 10px',borderRadius:8,fontSize:13,textAlign:'center',fontWeight:700}}/>
                        <button onClick={()=>{const el=document.getElementById(`d-${b.id}`);if(el?.value){registrarUso(b.id,b.usado,el.value);el.value='';}}} style={{padding:'6px 14px',borderRadius:8,background:'#059669',color:'white',border:'none',cursor:'pointer',fontSize:11,fontWeight:800,textTransform:'uppercase',flexShrink:0}}>OK</button>
                      </div>
                    </div>
                  );
                })}
                {bobinas.length===0&&<div style={{textAlign:'center',padding:'40px 0',color:'#334155',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',border:'1px dashed rgba(255,255,255,.06)',borderRadius:14}}>Nenhuma bobina</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════ SUPORTE ════════════════════════════════ */}
      {tela==='suporte' && (
        <div className="page">
          {backBtn('#f59e0b')}
          <div className="glass" style={{borderRadius:20,padding:22,marginBottom:20,borderColor:'rgba(245,158,11,.1)'}}>
            {secHeader(<Wrench/>,editOrdemId?'Editar OS':'Nova Ordem de Serviço','#f59e0b')}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>
              <div style={fw}><p className="fl">Nome do Cliente</p><input style={inp} placeholder="Nome completo..." value={fOrdem.nome} onChange={e=>setFOrdem({...fOrdem,nome:e.target.value})}/></div>
              <div style={fw}><p className="fl">Serial (SN ONU)</p><input style={{...inp,fontFamily:'monospace'}} placeholder="ZTEG..." value={fOrdem.serial} onChange={e=>setFOrdem({...fOrdem,serial:e.target.value})}/></div>
              <div style={fw}><p className="fl">CTO / Porta</p><div style={{display:'grid',gridTemplateColumns:'1fr 56px',gap:8}}><input style={inp} placeholder="CTO..." value={fOrdem.cto} onChange={e=>setFOrdem({...fOrdem,cto:e.target.value})}/><input style={{...inp,textAlign:'center',fontWeight:800}} placeholder="P" value={fOrdem.porta} onChange={e=>setFOrdem({...fOrdem,porta:e.target.value})}/></div></div>
              <div style={fw}><p className="fl">Tipo de Serviço</p><select style={inp} value={fOrdem.tipo} onChange={e=>setFOrdem({...fOrdem,tipo:e.target.value})}><option>Nova Ativação</option><option>Reparo Técnico</option><option>Mudança de Endereço</option><option>Recolha de Equipamento</option></select></div>
              <div style={fw}><p className="fl">Data Agendada</p><input style={inp} type="date" value={fOrdem.dataAgendada} onChange={e=>setFOrdem({...fOrdem,dataAgendada:e.target.value})}/></div>
              <div style={{...fw,gridColumn:'1/-1'}}><p className="fl">Relato</p><textarea style={{...inp,height:68,resize:'none'}} placeholder="Descreva o problema..." value={fOrdem.relato} onChange={e=>setFOrdem({...fOrdem,relato:e.target.value})}/></div>
              {/* Valor previsto */}
              <div style={{gridColumn:'1/-1',padding:'10px 14px',background:'rgba(52,211,153,.06)',border:'1px solid rgba(52,211,153,.15)',borderRadius:10,display:'flex',alignItems:'center',gap:10}}>
                <DollarSign size={14} color="#34d399"/>
                <span style={{fontSize:12,color:'#94a3b8'}}>Valor previsto para este serviço:</span>
                <span style={{fontSize:16,fontWeight:800,color:'#4ade80'}}>{fmt(VALORES_OS[fOrdem.tipo]||0)}</span>
              </div>
              <button onClick={salvarOrdem} className="btn" style={{gridColumn:'1/-1',background:'linear-gradient(135deg,#d97706,#f59e0b)',color:'white'}}><ClipboardList size={16}/>{editOrdemId?'Atualizar OS':'Gerar OS'}</button>
              {editOrdemId&&<button onClick={()=>{setEditOrdemId(null);setFOrdem({nome:'',serial:'',cto:'',porta:'',tipo:'Nova Ativação',dataAgendada:'',relato:'',status:'Pendente'});}} style={{gridColumn:'1/-1',background:'none',border:'none',color:'#475569',fontSize:11,fontWeight:700,textTransform:'uppercase',cursor:'pointer'}}>Cancelar</button>}
            </div>
          </div>

          {/* Lista OS */}
          <div className="glass" style={{borderRadius:20,overflow:'hidden',borderColor:'rgba(255,255,255,.05)'}}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
              <div style={{position:'relative',marginBottom:10}}><Search size={14} color="#475569" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
                <input style={{...inp,paddingLeft:36}} placeholder="Buscar OS..." value={fBOrdem} onChange={e=>setFBOrdem(e.target.value)}/></div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                <div style={{display:'flex',gap:3,padding:4,background:'rgba(8,12,20,.6)',borderRadius:10,border:'1px solid rgba(255,255,255,.05)'}}>
                  {['Todos','Pendente','Concluído','Pago'].map(s=>(
                    <button key={s} onClick={()=>setFSOrdem(s)} style={btnTab(fSOrdem===s,'#d97706')}>
                      {s}<span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:fSOrdem===s?'rgba(255,255,255,.2)':'rgba(255,255,255,.05)',color:fSOrdem===s?'white':'#475569'}}>{s==='Todos'?ordens.length:ordens.filter(o=>o.status===s).length}</span>
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',gap:3,padding:4,background:'rgba(8,12,20,.6)',borderRadius:10,border:'1px solid rgba(255,255,255,.05)'}}>
                  {['Todos Tipos','Nova Ativação','Reparo Técnico','Mudança de Endereço','Recolha de Equipamento'].map(t=>(
                    <button key={t} onClick={()=>setFTOrdem(t)} style={btnTab(fTOrdem===t,'#4f46e5')}>
                      {t==='Todos Tipos'?'Todos':t.split(' ')[0]}<span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:fTOrdem===t?'rgba(255,255,255,.2)':'rgba(255,255,255,.05)',color:fTOrdem===t?'white':'#475569'}}>{t==='Todos Tipos'?ordens.length:ordens.filter(o=>o.tipo===t).length}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8,overflowY:'auto',maxHeight:520}} className="scroll">
              {ordensFilt.map(o=>{
                const cor=tipoCor[o.tipo]||'#64748b';
                const diasStr = o.dataAgendada ? (()=>{ const diff=Math.ceil((new Date(o.dataAgendada)-new Date())/(1000*60*60*24)); return diff<0?`Atrasado ${Math.abs(diff)}d`:diff===0?'Hoje':diff===1?'Amanhã':`Em ${diff}d`; })() : null;
                const diasCor = o.dataAgendada ? (()=>{ const diff=Math.ceil((new Date(o.dataAgendada)-new Date())/(1000*60*60*24)); return diff<0?'#f87171':diff<=2?'#fbbf24':'#64748b'; })() : '#64748b';
                return (
                  <div key={o.id} className="row-hover" style={{background:'rgba(8,12,20,.5)',borderRadius:14,padding:'14px 16px',border:'1px solid rgba(255,255,255,.04)',borderLeft:`3px solid ${cor}`,display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                        <span style={{fontSize:9,padding:'2px 7px',borderRadius:5,background:`${cor}18`,color:cor,border:`1px solid ${cor}25`,fontWeight:700,textTransform:'uppercase'}}>{o.tipo}</span>
                        <h3 style={{fontSize:14,fontWeight:700,color:'white',margin:0}}>{o.nome}</h3>
                        <span style={{fontSize:12,fontWeight:800,color:'#4ade80'}}>{fmt(VALORES_OS[o.tipo]||0)}</span>
                      </div>
                      <div style={{display:'flex',gap:14,fontSize:11,color:'#64748b',flexWrap:'wrap'}}>
                        <span style={{display:'flex',alignItems:'center',gap:3}}><Wifi size={11} color="#3b82f6"/>{o.cto?`${o.cto}/P${o.porta}`:'Sem CTO'}</span>
                        {o.serial&&<span style={{fontFamily:'monospace'}}>SN: {o.serial}</span>}
                        {diasStr&&<span style={{display:'flex',alignItems:'center',gap:3,color:diasCor,fontWeight:700}}><CalendarClock size={11}/>{diasStr}</span>}
                      </div>
                      {o.relato&&<div style={{marginTop:6,fontSize:11,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.04)',borderRadius:7,padding:'5px 9px',color:'#94a3b8',display:'flex',gap:5}}><Info size={11} style={{flexShrink:0,marginTop:1}}/>{o.relato}</div>}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:5,alignItems:'flex-end',minWidth:130}}>
                      <button onClick={()=>avancarStatusOS(o.id,o.status)} style={{width:'100%',padding:'7px 10px',borderRadius:9,border:`1px solid ${o.status==='Pendente'?'rgba(245,158,11,.3)':o.status==='Concluído'?'rgba(34,197,94,.3)':'rgba(59,130,246,.3)'}`,cursor:'pointer',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',display:'flex',alignItems:'center',justifyContent:'center',gap:5,transition:'all .15s',background:o.status==='Pendente'?'rgba(245,158,11,.1)':o.status==='Concluído'?'rgba(34,197,94,.1)':'rgba(59,130,246,.1)',color:o.status==='Pendente'?'#fbbf24':o.status==='Concluído'?'#4ade80':'#60a5fa'}}>
                        {o.status==='Pendente'&&<Clock size={12}/>}{o.status==='Concluído'&&<CheckCircle2 size={12}/>}{o.status==='Pago'&&<DollarSign size={12}/>}{o.status}
                      </button>
                      <div style={{display:'flex',gap:4}}>
                        <button onClick={()=>{setEditOrdemId(o.id);setFOrdem(o);window.scrollTo({top:0,behavior:'smooth'});}} style={btnAcao('rgba(255,255,255,.04)','#64748b','rgba(255,255,255,.06)')}><Edit size={13}/></button>
                        <button onClick={()=>excluirOrdem(o.id)} style={btnAcao('rgba(239,68,68,.07)','#f87171','rgba(239,68,68,.15)')}><Trash2 size={13}/></button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {ordensFilt.length===0&&<div style={{textAlign:'center',padding:'40px 0',color:'#334155',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',border:'1px dashed rgba(255,255,255,.06)',borderRadius:14}}>Nenhuma OS encontrada</div>}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════ SERASA ═════════════════════════════════ */}
      {tela==='serasa' && (
        <div className="page">
          {backBtn('#a78bfa')}
          <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:20,alignItems:'start'}}>
            {/* Form */}
            <div className="glass" style={{borderRadius:20,padding:22,borderColor:'rgba(167,139,250,.12)',position:'sticky',top:16}}>
              {secHeader(<FileSearch/>,editConsId?'Editar Consulta':'Nova Consulta','#a78bfa')}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div style={fw}><p className="fl">Nome</p><input style={inp} placeholder="Nome completo..." value={fCons.nome} onChange={e=>setFCons({...fCons,nome:e.target.value})}/></div>
                <div style={fw}><p className="fl">Tipo / Documento</p>
                  <div style={{display:'grid',gridTemplateColumns:'90px 1fr',gap:8}}>
                    <select style={inp} value={fCons.tipoDoc} onChange={e=>setFCons({...fCons,tipoDoc:e.target.value,documento:''})}><option>CPF</option><option>CNPJ</option></select>
                    <input style={inp} placeholder={fCons.tipoDoc==='CPF'?'000.000.000-00':'00.000.000/0000-00'} value={fCons.documento} onChange={e=>setFCons({...fCons,documento:fmtDoc(e.target.value,fCons.tipoDoc)})}/>
                  </div>
                </div>
                <div style={fw}><p className="fl">Telefone</p><input style={inp} type="tel" placeholder="(00) 00000-0000" value={fCons.telefone} onChange={e=>setFCons({...fCons,telefone:e.target.value})}/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div style={fw}><p className="fl">Score (0–1000)</p><input style={inp} type="number" min="0" max="1000" placeholder="750" value={fCons.score} onChange={e=>setFCons({...fCons,score:e.target.value})}/></div>
                  <div style={fw}><p className="fl">Resultado</p><select style={inp} value={fCons.resultado} onChange={e=>setFCons({...fCons,resultado:e.target.value})}><option>Aprovado</option><option>Reprovado</option><option>Com Restrições</option><option>Pendente Análise</option></select></div>
                </div>
                <div style={fw}><p className="fl">Data da Consulta</p><input style={inp} type="date" value={fCons.dataConsulta} onChange={e=>setFCons({...fCons,dataConsulta:e.target.value})}/></div>
                <div style={fw}><p className="fl">Restrições</p><textarea style={{...inp,height:60,resize:'none'}} placeholder="Dívidas, protestos..." value={fCons.restricoes} onChange={e=>setFCons({...fCons,restricoes:e.target.value})}/></div>
                <div style={fw}><p className="fl">Observação</p><textarea style={{...inp,height:50,resize:'none'}} placeholder="Notas internas..." value={fCons.observacao} onChange={e=>setFCons({...fCons,observacao:e.target.value})}/></div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:'rgba(8,12,20,.5)',borderRadius:10,border:'1px solid rgba(255,255,255,.06)'}}>
                  <p style={{fontSize:12,fontWeight:700,color:'#94a3b8',margin:0}}>Convertido em Cliente</p>
                  <button onClick={()=>setFCons({...fCons,convertido:!fCons.convertido})} style={{width:42,height:22,borderRadius:11,border:'none',cursor:'pointer',transition:'background .2s',position:'relative',background:fCons.convertido?'#6366f1':'rgba(255,255,255,.08)'}}>
                    <span style={{position:'absolute',top:2,left:fCons.convertido?22:2,width:18,height:18,borderRadius:'50%',background:'white',transition:'left .2s',display:'block'}}/>
                  </button>
                </div>
                <button onClick={salvarCons} className="btn" style={{background:'linear-gradient(135deg,#7c3aed,#6366f1)',color:'white'}}><Save size={16}/>{editConsId?'Atualizar':'Registrar Consulta'}</button>
                {editConsId&&<button onClick={()=>{setEditConsId(null);setFCons({nome:'',documento:'',tipoDoc:'CPF',score:'',resultado:'Pendente Análise',restricoes:'',observacao:'',dataConsulta:new Date().toISOString().split('T')[0],telefone:'',convertido:false});}} style={{background:'none',border:'none',color:'#475569',fontSize:11,fontWeight:700,textTransform:'uppercase',cursor:'pointer'}}>Cancelar</button>}
              </div>
            </div>

            {/* Lista consultas */}
            <div className="glass" style={{borderRadius:20,overflow:'hidden',borderColor:'rgba(255,255,255,.05)'}}>
              <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                <div style={{position:'relative',marginBottom:10}}><Search size={14} color="#475569" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
                  <input style={{...inp,paddingLeft:36}} placeholder="Buscar nome ou documento..." value={fBCons} onChange={e=>setFBCons(e.target.value)}/></div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  <div style={{display:'flex',gap:3,padding:4,background:'rgba(8,12,20,.6)',borderRadius:10,border:'1px solid rgba(255,255,255,.05)'}}>
                    {['Todos','Aprovado','Reprovado','Com Restrições','Pendente Análise'].map(r=>(
                      <button key={r} onClick={()=>setFRCons(r)} style={btnTab(fRCons===r,'#7c3aed')}>
                        {r==='Todos'?'Todos':r.split(' ')[0]}<span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:fRCons===r?'rgba(255,255,255,.2)':'rgba(255,255,255,.05)',color:fRCons===r?'white':'#475569'}}>{r==='Todos'?consultas.length:consultas.filter(c=>c.resultado===r).length}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:3,padding:4,background:'rgba(8,12,20,.6)',borderRadius:10,border:'1px solid rgba(255,255,255,.05)'}}>
                    {['Todos','CPF','CNPJ'].map(t=>(<button key={t} onClick={()=>setFTCons(t)} style={btnTab(fTCons===t,'#4f46e5')}>{t}</button>))}
                  </div>
                </div>
              </div>
              <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8,overflowY:'auto',maxHeight:520}} className="scroll">
                {consFilt.map(c=>{
                  const lc={'Aprovado':'#22c55e','Reprovado':'#ef4444','Com Restrições':'#f59e0b','Pendente Análise':'#64748b'};
                  const cor=lc[c.resultado]||'#64748b';
                  return (
                    <div key={c.id} className="row-hover" style={{background:'rgba(8,12,20,.5)',borderRadius:14,padding:'14px 16px',border:'1px solid rgba(255,255,255,.04)',borderLeft:`3px solid ${cor}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                        <div style={{display:'flex',gap:12,alignItems:'flex-start',flex:1}}>
                          {c.score?<ScoreRing score={Number(c.score)} size={52}/>:<div style={{width:52,height:52,borderRadius:'50%',background:'rgba(255,255,255,.03)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Hash size={16} color="#334155"/></div>}
                          <div style={{flex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                              <h3 style={{fontSize:14,fontWeight:700,color:'white',margin:0}}>{c.nome}</h3>
                              {c.convertido&&<span style={{fontSize:9,padding:'2px 7px',borderRadius:5,background:'rgba(56,189,248,.12)',color:'#38bdf8',border:'1px solid rgba(56,189,248,.2)',fontWeight:700}}>✓ Convertido</span>}
                            </div>
                            <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
                              <ResultBadge r={c.resultado}/>
                              <span style={{fontSize:11,color:'#475569',fontFamily:'monospace'}}>{c.tipoDoc}: {c.documento}</span>
                              {c.telefone&&<span style={{fontSize:11,color:'#475569'}}>📞 {c.telefone}</span>}
                              <span style={{fontSize:11,color:'#475569',display:'flex',alignItems:'center',gap:3}}><Calendar size={11}/>{c.dataConsulta?new Date(c.dataConsulta).toLocaleDateString('pt-BR'):'—'}</span>
                            </div>
                            {c.restricoes&&<div style={{fontSize:11,background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.12)',borderRadius:7,padding:'5px 9px',color:'#fca5a5',display:'flex',gap:5}}><AlertCircle size={11} style={{flexShrink:0,marginTop:1}}/>{c.restricoes}</div>}
                          </div>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:5,alignItems:'flex-end',flexShrink:0}}>
                          <button onClick={()=>toggleConvertido(c.id,c.convertido)} style={{fontSize:10,padding:'4px 9px',borderRadius:7,border:'none',cursor:'pointer',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',transition:'all .15s',background:c.convertido?'rgba(56,189,248,.15)':'rgba(255,255,255,.04)',color:c.convertido?'#38bdf8':'#475569'}}>
                            {c.convertido?'✓ Cliente':'→ Converter'}
                          </button>
                          <div style={{display:'flex',gap:4}}>
                            <button onClick={()=>{setEditConsId(c.id);setFCons({...c});window.scrollTo({top:0,behavior:'smooth'});}} style={btnAcao('rgba(255,255,255,.04)','#64748b','rgba(255,255,255,.06)')}><Edit size={13}/></button>
                            <button onClick={()=>excluirCons(c.id)} style={btnAcao('rgba(239,68,68,.07)','#f87171','rgba(239,68,68,.15)')}><Trash2 size={13}/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {consFilt.length===0&&<div style={{textAlign:'center',padding:'40px 0',color:'#334155',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',border:'1px dashed rgba(255,255,255,.06)',borderRadius:14}}>Nenhuma consulta</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════ CLIENTES ═══════════════════════════════ */}
      {tela==='clientes' && (
        <div className="page">
          {backBtn('#3b82f6')}
          <div className="glass" style={{borderRadius:20,padding:22,marginBottom:20,borderColor:'rgba(59,130,246,.1)'}}>
            {secHeader(editClienteId?<Edit/>:<Wifi/>,editClienteId?'Editar Cliente':'Novo Cadastro de Rede','#3b82f6')}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>
              <div style={fw}><p className="fl">Assinante</p><input style={inp} placeholder="Nome completo..." value={fCliente.nome} onChange={e=>setFCliente({...fCliente,nome:e.target.value})}/></div>
              <div style={fw}><p className="fl">Serial (SN ONU)</p><input style={{...inp,fontFamily:'monospace'}} placeholder="ZTEG..." value={fCliente.serial} onChange={e=>setFCliente({...fCliente,serial:e.target.value})}/></div>
              <div style={fw}><p className="fl">Login PPPoE</p><input style={inp} placeholder="user@lumix..." value={fCliente.login} onChange={e=>setFCliente({...fCliente,login:e.target.value})}/></div>
              <div style={fw}><p className="fl">CTO / Porta</p><div style={{display:'grid',gridTemplateColumns:'1fr 56px',gap:8}}><input style={inp} placeholder="CTO..." value={fCliente.cto} onChange={e=>setFCliente({...fCliente,cto:e.target.value})}/><input style={{...inp,textAlign:'center',fontWeight:800}} placeholder="P" value={fCliente.porta} onChange={e=>setFCliente({...fCliente,porta:e.target.value})}/></div></div>
              <div style={{...fw,gridColumn:'1/-1'}}><p className="fl">Observação</p><textarea style={{...inp,height:56,resize:'none'}} placeholder="Sinal, roteador próprio..." value={fCliente.observacao} onChange={e=>setFCliente({...fCliente,observacao:e.target.value})}/></div>
              <button onClick={salvarCliente} className="btn" style={{gridColumn:'1/-1',background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'white'}}><Save size={16}/>{editClienteId?'Atualizar':'Salvar Cliente'}</button>
              {editClienteId&&<button onClick={()=>{setEditClienteId(null);setFCliente({nome:'',login:'',serial:'',cto:'',porta:'',observacao:'',status:'Ativo'});}} style={{gridColumn:'1/-1',background:'none',border:'none',color:'#475569',fontSize:11,fontWeight:700,textTransform:'uppercase',cursor:'pointer'}}>Cancelar</button>}
            </div>
          </div>

          {/* Lista clientes */}
          <div className="glass" style={{borderRadius:20,overflow:'hidden',borderColor:'rgba(255,255,255,.05)'}}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,.05)',display:'flex',flexWrap:'wrap',gap:10,alignItems:'center'}}>
              <div style={{position:'relative',flex:1,minWidth:200}}><Search size={14} color="#475569" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
                <input style={{...inp,paddingLeft:36}} placeholder="Buscar nome, SN ou login..." value={fBCliente} onChange={e=>setFBCliente(e.target.value)}/></div>
              <div style={{display:'flex',gap:3,padding:4,background:'rgba(8,12,20,.6)',borderRadius:10,border:'1px solid rgba(255,255,255,.05)'}}>
                {['Todos','Ativo','Desativado'].map(s=>(
                  <button key={s} onClick={()=>setFSCliente(s)} style={btnTab(fSCliente===s,s==='Desativado'?'#dc2626':'#1d4ed8')}>
                    {s}<span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:fSCliente===s?'rgba(255,255,255,.2)':'rgba(255,255,255,.05)',color:fSCliente===s?'white':'#475569'}}>{s==='Todos'?clientes.length:clientes.filter(c=>c.status===s).length}</span>
                  </button>
                ))}
              </div>
              <button onClick={()=>{ const cab="Nome,Serial,Login,CTO,Porta,Status\n"; const dados=clientes.map(c=>`"${c.nome}","${c.serial}","${c.login}","${c.cto}","${c.porta}","${c.status}"`).join("\n"); const b=new Blob([cab+dados],{type:'text/csv;charset=utf-8;'}); const l=document.createElement("a"); l.href=URL.createObjectURL(b); l.download="Clientes_Lumix.csv"; l.click(); }} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 12px',borderRadius:9,background:'rgba(34,197,94,.08)',color:'#4ade80',border:'1px solid rgba(34,197,94,.18)',cursor:'pointer',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em'}}><Download size={13}/>CSV</button>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'rgba(8,12,20,.4)',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                  {['Assinante / Detalhes','CTO / Porta','Status / Ações'].map(h=>(
                    <th key={h} style={{padding:'12px 18px',textAlign:'left',fontSize:9,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.08em'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {clientesFilt.map(c=>(
                    <tr key={c.id} className="row-hover" style={{borderBottom:'1px solid rgba(255,255,255,.03)',opacity:c.status==='Desativado'?.6:1}}>
                      <td style={{padding:'12px 18px'}}>
                        {/* Clique no nome abre histórico */}
                        <button onClick={()=>setHistoricoCliente(c)} style={{background:'none',border:'none',padding:0,cursor:'pointer',textAlign:'left'}}>
                          <p style={{fontSize:14,fontWeight:700,color:c.status==='Desativado'?'#475569':'#60a5fa',textDecoration:c.status==='Desativado'?'line-through':'underline',textDecorationStyle:'dotted',textDecorationColor:'rgba(96,165,250,.4)',margin:'0 0 3px'}}>{c.nome}</p>
                        </button>
                        <p style={{fontSize:10,fontFamily:'monospace',color:'#475569',margin:'0 0 0',textTransform:'uppercase',letterSpacing:'.04em'}}>{c.serial} · {c.login}</p>
                        {c.observacao&&<p style={{marginTop:3,fontSize:11,color:'#3b82f6',display:'flex',alignItems:'flex-start',gap:3,margin:'4px 0 0'}}><Info size={11} style={{flexShrink:0,marginTop:1}}/>{c.observacao}</p>}
                      </td>
                      <td style={{padding:'12px 18px'}}>
                        <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(59,130,246,.08)',color:'#60a5fa',padding:'5px 10px',borderRadius:9,fontSize:11,fontWeight:700}}>
                          <Wifi size={12}/>{c.cto}/P{c.porta}
                        </div>
                      </td>
                      <td style={{padding:'12px 18px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:5,justifyContent:'flex-end'}}>
                          <button onClick={()=>toggleStatusCliente(c.id,c.status)} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,border:'none',cursor:'pointer',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',transition:'all .15s',background:c.status==='Ativo'?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)',color:c.status==='Ativo'?'#4ade80':'#f87171',border:`1px solid ${c.status==='Ativo'?'rgba(34,197,94,.25)':'rgba(239,68,68,.25)'}`}}>
                            {c.status==='Ativo'?<CheckCircle size={12}/>:<XCircle size={12}/>}{c.status}
                          </button>
                          <button onClick={()=>setHistoricoCliente(c)} style={{...btnAcao('rgba(167,139,250,.08)','#a78bfa','rgba(167,139,250,.2)'),fontSize:10,gap:4,padding:'5px 8px'}} title="Ver histórico"><History size={13}/></button>
                          <button onClick={()=>{setEditClienteId(c.id);setFCliente(c);window.scrollTo({top:0,behavior:'smooth'});}} style={btnAcao('rgba(255,255,255,.04)','#64748b','rgba(255,255,255,.06)')}><Edit size={13}/></button>
                          <button onClick={()=>excluirCliente(c.id)} style={btnAcao('rgba(239,68,68,.07)','#f87171','rgba(239,68,68,.15)')}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {clientesFilt.length===0&&<tr><td colSpan={3} style={{padding:'40px 0',textAlign:'center',color:'#334155',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em'}}>Nenhum cliente encontrado</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Wrapper com Toast ─────────────────────────────────────────────────────────
function Root() {
  return <ToastProvider><App/></ToastProvider>;
}
export { Root };
ENDOFFILE
echo "Done: $(wc -l < /home/claude/App.jsx) lines"
