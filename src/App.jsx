import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  Save, Search, Trash2, Edit, Info, CheckCircle, XCircle, Users, 
  Download, Printer, Wifi, LayoutDashboard, ClipboardList, 
  Wrench, CalendarClock, CheckCircle2, Clock, DollarSign,
  Database, Layers, Plus, ShieldCheck, ShieldX, ShieldAlert,
  FileSearch, User, Calendar, AlertCircle, TrendingUp, Hash,
  BadgeCheck, BadgeX, BadgeMinus, ChevronRight, Star
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBX7mv26WPpYNBVpfQufvpdZdQVtSAITZs",
  authDomain: "lumix-doc.firebaseapp.com",
  projectId: "lumix-doc",
  storageBucket: "lumix-doc.firebasestorage.app",
  messagingSenderId: "625727333695",
  appId: "1:625727333695:web:62efac7740bdf7d3391f8a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- FORMATAÇÃO CPF/CNPJ ---
const formatarCPF = (valor) => {
  const nums = valor.replace(/\D/g, '').slice(0, 11);
  return nums
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const formatarCNPJ = (valor) => {
  const nums = valor.replace(/\D/g, '').slice(0, 14);
  return nums
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

const formatarDocumento = (valor, tipo) => {
  if (tipo === 'CPF') return formatarCPF(valor);
  if (tipo === 'CNPJ') return formatarCNPJ(valor);
  return valor;
};

// --- COMPONENTE DE ESTILO ---
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');

    * { box-sizing: border-box; }
    body { 
      background: #080c14; 
      color: #f0f4ff; 
      font-family: 'Space Grotesk', 'Inter', sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Glassmorphism */
    .glass { 
      background: rgba(16, 24, 40, 0.75); 
      backdrop-filter: blur(16px); 
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.07); 
    }
    .glass-dark {
      background: rgba(8, 12, 20, 0.6);
      border: 1px solid rgba(255,255,255,0.05);
    }

    /* Inputs */
    input, textarea, select { 
      background: rgba(8, 12, 20, 0.8) !important; 
      color: #e2e8f0 !important; 
      border: 1px solid rgba(255,255,255,0.1) !important; 
      transition: all 0.2s ease;
    }
    input::placeholder, textarea::placeholder { color: #4a5568 !important; }
    input:focus, select:focus, textarea:focus { 
      border-color: rgba(99,102,241,0.6) !important; 
      outline: none !important; 
      box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
      background: rgba(12, 18, 32, 0.9) !important;
    }
    option { background: #0f172a; }

    /* Scrollbar */
    .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }

    /* Barra de progresso */
    .progress-bar { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.05); overflow: hidden; }

    /* Cards de menu */
    .menu-card {
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .menu-card::before {
      content: '';
      position: absolute;
      inset: 0;
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: inherit;
    }
    .menu-card:hover { transform: translateY(-4px); }
    .menu-card:hover::before { opacity: 1; }
    .menu-card:active { transform: translateY(-2px) scale(0.99); }

    /* Badge de status */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    /* Linha de tabela */
    .table-row {
      transition: background 0.15s ease;
    }
    .table-row:hover { background: rgba(255,255,255,0.025); }

    /* Score dial */
    .score-ring {
      position: relative;
      width: 64px;
      height: 64px;
    }
    .score-ring svg { transform: rotate(-90deg); }
    .score-ring .score-label {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
    }

    /* Animações */
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-page { animation: fadeSlideIn 0.35s ease forwards; }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

    /* Stat cards */
    .stat-card {
      background: rgba(16,24,40,0.6);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 18px 20px;
      transition: all 0.2s ease;
    }
    .stat-card:hover {
      border-color: rgba(255,255,255,0.12);
      background: rgba(20,30,55,0.7);
    }

    /* Botão primário */
    .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px 24px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
      cursor: pointer;
      border: none;
    }
    .btn-primary:active { transform: scale(0.98); }

    /* Input label */
    .field-label {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-left: 4px;
      margin-bottom: 6px;
    }
  `}</style>
);

// --- COMPONENTE SCORE RING ---
const ScoreRing = ({ score, size = 56 }) => {
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
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color }}>{score}</span>
      </div>
    </div>
  );
};

// --- BADGE DE RESULTADO ---
const ResultadoBadge = ({ resultado }) => {
  const cfg = {
    'Aprovado':         { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.3)',  icon: <ShieldCheck size={12}/> },
    'Reprovado':        { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)',  icon: <ShieldX size={12}/> },
    'Com Restrições':   { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.3)', icon: <ShieldAlert size={12}/> },
    'Pendente Análise': { bg: 'rgba(148,163,184,0.12)',color: '#94a3b8', border: 'rgba(148,163,184,0.3)',icon: <Clock size={12}/> },
  };
  const c = cfg[resultado] || cfg['Pendente Análise'];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:8,
      background: c.bg, color: c.color, border:`1px solid ${c.border}`,
      fontSize:10, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>
      {c.icon} {resultado}
    </span>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [telaAtual, setTelaAtual] = useState('menu');

  // ---- Estados: Clientes ----
  const [clientes, setClientes] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [filtroStatusCliente, setFiltroStatusCliente] = useState('Todos');
  const [editandoClienteId, setEditandoClienteId] = useState(null);
  const [cliente, setCliente] = useState({ nome:'', login:'', serial:'', cto:'', porta:'', observacao:'', status:'Ativo' });

  // ---- Estados: Suporte (OS) ----
  const [ordens, setOrdens] = useState([]);
  const [buscaOrdem, setBuscaOrdem] = useState('');
  const [filtroStatusOrdem, setFiltroStatusOrdem] = useState('Todos');
  const [filtroTipoOrdem, setFiltroTipoOrdem] = useState('Todos Tipos');
  const [editandoOrdemId, setEditandoOrdemId] = useState(null);
  const [ordem, setOrdem] = useState({ nome:'', serial:'', cto:'', porta:'', tipo:'Nova Ativação', dataAgendada:'', relato:'', status:'Pendente' });

  // ---- Estados: Bobinas ----
  const [bobinas, setBobinas] = useState([]);
  const [bobina, setBobina] = useState({ identificacao:'', tipo:'Drop 1FO', total:'', usado:'', marca:'' });

  // ---- Estados: Consultas Serasa ----
  const [consultas, setConsultas] = useState([]);
  const [buscaConsulta, setBuscaConsulta] = useState('');
  const [filtroResultado, setFiltroResultado] = useState('Todos');
  const [filtroTipoDoc, setFiltroTipoDoc] = useState('Todos');
  const [editandoConsultaId, setEditandoConsultaId] = useState(null);
  const [consulta, setConsulta] = useState({
    nome: '',
    documento: '',
    tipoDoc: 'CPF',
    score: '',
    resultado: 'Pendente Análise',
    restricoes: '',
    observacao: '',
    dataConsulta: new Date().toISOString().split('T')[0],
    telefone: '',
    convertido: false,
  });

  // ---- Carregamento do Firebase ----
  useEffect(() => {
    const qClientes = query(collection(db, "clientes"), orderBy("nome", "asc"));
    const unsubClientes = onSnapshot(qClientes, (s) => setClientes(s.docs.map(d => ({ id:d.id, ...d.data() }))));

    const qOrdens = query(collection(db, "suporte"), orderBy("dataAgendada", "asc"));
    const unsubOrdens = onSnapshot(qOrdens, (s) => setOrdens(s.docs.map(d => ({ id:d.id, ...d.data() }))));

    const qBobinas = query(collection(db, "bobinas"), orderBy("identificacao", "asc"));
    const unsubBobinas = onSnapshot(qBobinas, (s) => setBobinas(s.docs.map(d => ({ id:d.id, ...d.data() }))));

    const qConsultas = query(collection(db, "consultas"), orderBy("dataConsulta", "desc"));
    const unsubConsultas = onSnapshot(qConsultas, (s) => setConsultas(s.docs.map(d => ({ id:d.id, ...d.data() }))));

    return () => { unsubClientes(); unsubOrdens(); unsubBobinas(); unsubConsultas(); };
  }, []);

  // ============================================================
  //  FUNÇÕES: CLIENTES
  // ============================================================
  const salvarCliente = async () => {
    if (!cliente.nome || !cliente.serial) return alert("Nome e Serial são obrigatórios!");
    if (!editandoClienteId) {
      if (clientes.find(c => c.serial?.toLowerCase() === cliente.serial.toLowerCase() && c.status === 'Ativo'))
        return alert(`⚠️ Serial ${cliente.serial} já em uso!`);
      if (clientes.find(c => c.nome?.toLowerCase() === cliente.nome.toLowerCase() && c.status === 'Ativo'))
        return alert(`⚠️ Nome ${cliente.nome} já cadastrado!`);
    }
    try {
      if (editandoClienteId) {
        await updateDoc(doc(db, "clientes", editandoClienteId), { ...cliente });
        setEditandoClienteId(null);
      } else {
        await addDoc(collection(db, "clientes"), { ...cliente, dataCadastro: new Date().toISOString() });
      }
      setCliente({ nome:'', login:'', serial:'', cto:'', porta:'', observacao:'', status:'Ativo' });
    } catch { alert("Erro ao salvar."); }
  };

  const alternarStatusCliente = async (id, status) => {
    await updateDoc(doc(db, "clientes", id), { status: status === 'Ativo' ? 'Desativado' : 'Ativo' });
  };

  const excluirCliente = async (id) => {
    if (window.confirm("Apagar este cliente?")) await deleteDoc(doc(db, "clientes", id));
  };

  // ============================================================
  //  FUNÇÕES: ORDENS DE SERVIÇO
  // ============================================================
  const salvarOrdem = async () => {
    if (!ordem.nome || !ordem.tipo) return alert("Nome e Tipo são obrigatórios!");
    try {
      if (editandoOrdemId) {
        await updateDoc(doc(db, "suporte", editandoOrdemId), { ...ordem });
        setEditandoOrdemId(null);
      } else {
        await addDoc(collection(db, "suporte"), { ...ordem, dataCriacao: new Date().toISOString() });
      }
      setOrdem({ nome:'', serial:'', cto:'', porta:'', tipo:'Nova Ativação', dataAgendada:'', relato:'', status:'Pendente' });
    } catch { alert("Erro ao salvar."); }
  };

  const alterarStatusOrdem = async (id, status) => {
    const prox = { 'Pendente': 'Concluído', 'Concluído': 'Pago', 'Pago': 'Pendente' };
    await updateDoc(doc(db, "suporte", id), { status: prox[status] });
  };

  const excluirOrdem = async (id) => {
    if (window.confirm("Apagar esta OS?")) await deleteDoc(doc(db, "suporte", id));
  };

  // ============================================================
  //  FUNÇÕES: BOBINAS
  // ============================================================
  const salvarBobina = async () => {
    if (!bobina.identificacao || !bobina.total) return alert("Identificação e Total são obrigatórios!");
    try {
      await addDoc(collection(db, "bobinas"), { ...bobina, total: Number(bobina.total), usado: Number(bobina.usado || 0), dataEntrada: new Date().toISOString() });
      setBobina({ identificacao:'', tipo:'Drop 1FO', total:'', usado:'', marca:'' });
    } catch { alert("Erro ao salvar."); }
  };

  const registrarUso = async (id, usadoAtual, valorDesconto) => {
    if (!valorDesconto || isNaN(valorDesconto) || Number(valorDesconto) <= 0)
      return alert("Insira uma metragem válida.");
    await updateDoc(doc(db, "bobinas", id), { usado: Number(usadoAtual) + Number(valorDesconto) });
  };

  const excluirBobina = async (id) => {
    if (window.confirm("Apagar esta bobina?")) await deleteDoc(doc(db, "bobinas", id));
  };

  // ============================================================
  //  FUNÇÕES: CONSULTAS SERASA
  // ============================================================
  const salvarConsulta = async () => {
    if (!consulta.nome || !consulta.documento) return alert("Nome e Documento são obrigatórios!");
    try {
      if (editandoConsultaId) {
        await updateDoc(doc(db, "consultas", editandoConsultaId), { ...consulta, score: consulta.score ? Number(consulta.score) : null });
        setEditandoConsultaId(null);
      } else {
        await addDoc(collection(db, "consultas"), {
          ...consulta,
          score: consulta.score ? Number(consulta.score) : null,
          dataCriacao: new Date().toISOString()
        });
      }
      setConsulta({ nome:'', documento:'', tipoDoc:'CPF', score:'', resultado:'Pendente Análise', restricoes:'', observacao:'', dataConsulta: new Date().toISOString().split('T')[0], telefone:'', convertido: false });
      alert("Consulta registrada!");
    } catch { alert("Erro ao salvar."); }
  };

  const toggleConvertido = async (id, atual) => {
    await updateDoc(doc(db, "consultas", id), { convertido: !atual });
  };

  const excluirConsulta = async (id) => {
    if (window.confirm("Apagar esta consulta?")) await deleteDoc(doc(db, "consultas", id));
  };

  const exportarConsultasPDF = () => {
    const docPDF = new jsPDF();
    docPDF.setFontSize(16);
    docPDF.text("LUMIX FIBRA — Relatório de Consultas Serasa", 14, 18);
    docPDF.setFontSize(9);
    docPDF.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 25);
    const rows = consultasFiltradas.map(c => [
      c.nome, c.tipoDoc, c.documento, c.score ?? '—', c.resultado,
      c.convertido ? 'Sim' : 'Não',
      c.dataConsulta ? new Date(c.dataConsulta).toLocaleDateString('pt-BR') : '—'
    ]);
    docPDF.autoTable({
      startY: 30,
      head: [['Nome', 'Tipo', 'Documento', 'Score', 'Resultado', 'Convertido', 'Data']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
    });
    docPDF.save("Consultas_Serasa_Lumix.pdf");
  };

  // ============================================================
  //  EXPORTAÇÃO
  // ============================================================
  const exportarRelatorio = (tipo) => {
    if (tipo === 'excel') {
      const cab = "Nome,Serial,Login,CTO,Porta,Status\n";
      const dados = clientes.map(c => `"${c.nome}","${c.serial}","${c.login}","${c.cto}","${c.porta}","${c.status}"`).join("\n");
      const blob = new Blob([cab + dados], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Lumix_Clientes_${new Date().toLocaleDateString()}.csv`;
      link.click();
    } else {
      const docPDF = new jsPDF();
      docPDF.setFontSize(16);
      docPDF.text("LUMIX FIBRA — Relatório de Clientes", 14, 18);
      docPDF.setFontSize(9);
      docPDF.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 25);
      const rows = clientes.map(c => [c.nome, c.serial, c.login, `${c.cto}/P${c.porta}`, c.status]);
      docPDF.autoTable({ startY: 30, head: [['Assinante','Serial','Login','CTO/Porta','Status']], body: rows, theme:'grid', headStyles:{ fillColor:[37,99,235] } });
      docPDF.save("Clientes_Lumix_Fibra.pdf");
    }
  };

  // ============================================================
  //  FILTROS
  // ============================================================
  const clientesFiltrados = clientes.filter(c => {
    const s = buscaCliente.toLowerCase();
    return (c.nome?.toLowerCase().includes(s) || c.serial?.toLowerCase().includes(s) || c.login?.toLowerCase().includes(s)) &&
           (filtroStatusCliente === 'Todos' || c.status === filtroStatusCliente);
  }).sort((a,b) => (a.nome||'').localeCompare(b.nome||'','pt-BR',{sensitivity:'base'}));

  const ordensFiltradas = ordens.filter(o => {
    const s = buscaOrdem.toLowerCase();
    return (o.nome?.toLowerCase().includes(s) || o.serial?.toLowerCase().includes(s) || o.cto?.toLowerCase().includes(s)) &&
           (filtroStatusOrdem === 'Todos' || o.status === filtroStatusOrdem) &&
           (filtroTipoOrdem === 'Todos Tipos' || o.tipo === filtroTipoOrdem);
  });

  const consultasFiltradas = consultas.filter(c => {
    const s = buscaConsulta.toLowerCase();
    return (c.nome?.toLowerCase().includes(s) || c.documento?.toLowerCase().includes(s)) &&
           (filtroResultado === 'Todos' || c.resultado === filtroResultado) &&
           (filtroTipoDoc === 'Todos' || c.tipoDoc === filtroTipoDoc);
  });

  // ============================================================
  //  STATS
  // ============================================================
  const statsSerasa = {
    total: consultas.length,
    aprovados: consultas.filter(c => c.resultado === 'Aprovado').length,
    reprovados: consultas.filter(c => c.resultado === 'Reprovado').length,
    restricoes: consultas.filter(c => c.resultado === 'Com Restrições').length,
    convertidos: consultas.filter(c => c.convertido).length,
    taxaAprovacao: consultas.length ? Math.round((consultas.filter(c => c.resultado === 'Aprovado').length / consultas.length) * 100) : 0,
    scoreMedia: consultas.filter(c => c.score).length
      ? Math.round(consultas.filter(c => c.score).reduce((a, c) => a + Number(c.score), 0) / consultas.filter(c => c.score).length)
      : 0,
  };

  const countOrdens = { 'Todos': ordens.length, 'Pendente': ordens.filter(o=>o.status==='Pendente').length, 'Concluído': ordens.filter(o=>o.status==='Concluído').length, 'Pago': ordens.filter(o=>o.status==='Pago').length };
  const countTipos = { 'Todos Tipos': ordens.length, 'Nova Ativação': ordens.filter(o=>o.tipo==='Nova Ativação').length, 'Reparo Técnico': ordens.filter(o=>o.tipo==='Reparo Técnico').length, 'Mudança de Endereço': ordens.filter(o=>o.tipo==='Mudança de Endereço').length, 'Recolha de Equipamento': ordens.filter(o=>o.tipo==='Recolha de Equipamento').length };

  // ============================================================
  //  ESTILOS INLINE HELPERS
  // ============================================================
  const btnTab = (ativo, cor) => ({
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    background: ativo ? cor : 'transparent',
    color: ativo ? 'white' : '#64748b',
  });

  const inputStyle = { padding: '14px 16px', borderRadius: '12px', width: '100%', fontSize: '14px' };
  const fieldWrap = { display: 'flex', flexDirection: 'column', gap: '0' };

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px 80px', maxWidth: '1280px', margin: '0 auto' }}>
      <GlobalStyle />

      {/* HEADER */}
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 40, flexWrap:'wrap', gap: 16 }}>
        <div onClick={() => setTelaAtual('menu')} style={{ cursor:'pointer' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)', padding:'8px', borderRadius:'12px', display:'flex' }}>
              <Wifi size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize:'22px', fontWeight:800, color:'white', margin:0, letterSpacing:'-0.5px' }}>Lumix Fibra</h1>
              <p style={{ fontSize:'9px', fontWeight:700, color:'#475569', margin:0, letterSpacing:'0.15em', textTransform:'uppercase' }}>Painel Administrativo v2.1</p>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(16,24,40,0.6)', padding:'10px 16px', borderRadius:'14px', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e' }} className="pulse-dot" />
          <span style={{ fontSize:'12px', fontWeight:600, color:'#94a3b8' }}>Sistema Online</span>
        </div>
      </header>

      {/* ========================== MENU ========================== */}
      {telaAtual === 'menu' && (
        <div className="animate-page">
          {/* Resumo rápido */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:40 }}>
            {[
              { label:'Clientes Ativos', val: clientes.filter(c=>c.status==='Ativo').length, color:'#3b82f6' },
              { label:'OS Pendentes',    val: ordens.filter(o=>o.status==='Pendente').length, color:'#f59e0b' },
              { label:'OS Concluídas',   val: ordens.filter(o=>o.status==='Concluído').length, color:'#22c55e' },
              { label:'Consultas Serasa',val: consultas.length, color:'#a78bfa' },
              { label:'Aprovados Serasa',val: statsSerasa.aprovados, color:'#34d399' },
            ].map(({ label, val, color }) => (
              <div key={label} className="stat-card">
                <p style={{ fontSize:'10px', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 6px' }}>{label}</p>
                <p style={{ fontSize:'28px', fontWeight:800, color, margin:0, lineHeight:1 }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Cards de módulos */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20 }}>
            {[
              { id:'clientes', icon:<Users size={36}/>, label:'Clientes & CTO', desc:'Gerencie portas, seriais e localização técnica.', cor:'#3b82f6', bgCor:'rgba(59,130,246,0.1)', bord:'rgba(59,130,246,0.25)' },
              { id:'suporte',  icon:<Wrench size={36}/>, label:'Ativação & Suporte', desc:'Ordens de serviço, novas instalações e reparos.', cor:'#f59e0b', bgCor:'rgba(245,158,11,0.1)', bord:'rgba(245,158,11,0.25)' },
              { id:'bobinas',  icon:<Database size={36}/>, label:'Bobinas de Fibra', desc:'Controle de estoque e metragem em campo.', cor:'#10b981', bgCor:'rgba(16,185,129,0.1)', bord:'rgba(16,185,129,0.25)' },
              { id:'serasa',   icon:<FileSearch size={36}/>, label:'Consulta Serasa', desc:'Histórico de consultas CPF/CNPJ e análise de crédito.', cor:'#a78bfa', bgCor:'rgba(167,139,250,0.1)', bord:'rgba(167,139,250,0.25)' },
            ].map(m => (
              <button key={m.id} onClick={() => setTelaAtual(m.id)} className="menu-card"
                style={{ background:'rgba(16,24,40,0.7)', border:`1px solid ${m.bord}`, borderRadius:24, padding:'36px 28px', textAlign:'left', cursor:'pointer', display:'flex', flexDirection:'column', gap:20 }}>
                <div style={{ background: m.bgCor, borderRadius:16, padding:16, width:'fit-content', color: m.cor }}>
                  {m.icon}
                </div>
                <div>
                  <h3 style={{ fontSize:'18px', fontWeight:800, color:'white', margin:'0 0 6px', letterSpacing:'-0.3px' }}>{m.label}</h3>
                  <p style={{ fontSize:'13px', color:'#64748b', margin:0, lineHeight:1.5 }}>{m.desc}</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, color: m.cor, fontSize:'12px', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>
                  Acessar <ChevronRight size={14}/>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================== SERASA ========================== */}
      {telaAtual === 'serasa' && (
        <div className="animate-page">
          <button onClick={() => setTelaAtual('menu')} style={{ marginBottom:24, color:'#a78bfa', fontWeight:700, fontSize:'13px', display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer' }}>
            <LayoutDashboard size={16}/> Voltar ao Painel
          </button>

          {/* Stats Serasa */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:32 }}>
            {[
              { label:'Total Consultas', val: statsSerasa.total, color:'#a78bfa', Icon: FileSearch },
              { label:'Aprovados',       val: statsSerasa.aprovados, color:'#4ade80', Icon: ShieldCheck },
              { label:'Reprovados',      val: statsSerasa.reprovados, color:'#f87171', Icon: ShieldX },
              { label:'Com Restrições',  val: statsSerasa.restricoes, color:'#fbbf24', Icon: ShieldAlert },
              { label:'Convertidos',     val: statsSerasa.convertidos, color:'#38bdf8', Icon: BadgeCheck },
              { label:'Taxa Aprovação',  val: `${statsSerasa.taxaAprovacao}%`, color:'#a78bfa', Icon: TrendingUp },
              { label:'Score Médio',     val: statsSerasa.scoreMedia || '—', color:'#fb923c', Icon: Star },
            ].map(({ label, val, color, Icon }) => (
              <div key={label} className="stat-card" style={{ textAlign:'center' }}>
                <Icon size={18} color={color} style={{ marginBottom:8 }}/>
                <p style={{ fontSize:'9px', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 4px' }}>{label}</p>
                <p style={{ fontSize:'22px', fontWeight:800, color, margin:0 }}>{val}</p>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:24 }}>
            
            {/* Formulário Serasa */}
            <div className="glass" style={{ borderRadius:24, padding:'28px', borderColor:'rgba(167,139,250,0.15)', height:'fit-content' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <FileSearch size={18} color="#a78bfa"/>
                <h2 style={{ fontSize:'15px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', margin:0, color:'white' }}>
                  {editandoConsultaId ? 'Editar Consulta' : 'Nova Consulta'}
                </h2>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                
                {/* Nome */}
                <div style={fieldWrap}>
                  <p className="field-label">Nome Completo</p>
                  <input style={inputStyle} type="text" placeholder="Nome do solicitante..." value={consulta.nome} onChange={e => setConsulta({...consulta, nome: e.target.value})} />
                </div>

                {/* Tipo Doc + Documento */}
                <div style={fieldWrap}>
                  <p className="field-label">Tipo de Documento</p>
                  <div style={{ display:'grid', gridTemplateColumns:'100px 1fr', gap:8 }}>
                    <select style={{...inputStyle}} value={consulta.tipoDoc} onChange={e => setConsulta({...consulta, tipoDoc: e.target.value, documento: ''})}>
                      <option>CPF</option>
                      <option>CNPJ</option>
                    </select>
                    <input style={inputStyle} type="text" placeholder={consulta.tipoDoc === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                      value={consulta.documento}
                      onChange={e => setConsulta({...consulta, documento: formatarDocumento(e.target.value, consulta.tipoDoc)})} />
                  </div>
                </div>

                {/* Telefone */}
                <div style={fieldWrap}>
                  <p className="field-label">Telefone / WhatsApp</p>
                  <input style={inputStyle} type="tel" placeholder="(00) 00000-0000" value={consulta.telefone} onChange={e => setConsulta({...consulta, telefone: e.target.value})} />
                </div>

                {/* Score + Resultado */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div style={fieldWrap}>
                    <p className="field-label">Score (0–1000)</p>
                    <input style={{...inputStyle}} type="number" min="0" max="1000" placeholder="Ex: 750" value={consulta.score} onChange={e => setConsulta({...consulta, score: e.target.value})} />
                  </div>
                  <div style={fieldWrap}>
                    <p className="field-label">Resultado</p>
                    <select style={inputStyle} value={consulta.resultado} onChange={e => setConsulta({...consulta, resultado: e.target.value})}>
                      <option>Aprovado</option>
                      <option>Reprovado</option>
                      <option>Com Restrições</option>
                      <option>Pendente Análise</option>
                    </select>
                  </div>
                </div>

                {/* Data */}
                <div style={fieldWrap}>
                  <p className="field-label">Data da Consulta</p>
                  <input style={inputStyle} type="date" value={consulta.dataConsulta} onChange={e => setConsulta({...consulta, dataConsulta: e.target.value})} />
                </div>

                {/* Restrições */}
                <div style={fieldWrap}>
                  <p className="field-label">Restrições Encontradas</p>
                  <textarea style={{...inputStyle, height:64, resize:'none'}} placeholder="Dívidas, pendências, protestos..." value={consulta.restricoes} onChange={e => setConsulta({...consulta, restricoes: e.target.value})} />
                </div>

                {/* Observação */}
                <div style={fieldWrap}>
                  <p className="field-label">Observação Interna</p>
                  <textarea style={{...inputStyle, height:56, resize:'none'}} placeholder="Notas internas, decisão final..." value={consulta.observacao} onChange={e => setConsulta({...consulta, observacao: e.target.value})} />
                </div>

                {/* Convertido toggle */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'rgba(8,12,20,0.5)', borderRadius:12, border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:700, color:'#94a3b8', margin:'0 0 2px' }}>Convertido em Cliente</p>
                    <p style={{ fontSize:'10px', color:'#475569', margin:0 }}>Assinante ativado após aprovação</p>
                  </div>
                  <button onClick={() => setConsulta({...consulta, convertido: !consulta.convertido})}
                    style={{ width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', transition:'all 0.2s', position:'relative',
                      background: consulta.convertido ? '#6366f1' : 'rgba(255,255,255,0.08)' }}>
                    <span style={{ position:'absolute', top:3, left: consulta.convertido ? 23 : 3, width:18, height:18, borderRadius:'50%', background:'white', transition:'left 0.2s', display:'block' }}/>
                  </button>
                </div>

                <button onClick={salvarConsulta} className="btn-primary"
                  style={{ background:'linear-gradient(135deg,#7c3aed,#6366f1)', color:'white', marginTop:4 }}>
                  <Save size={18}/> {editandoConsultaId ? 'Atualizar Consulta' : 'Registrar Consulta'}
                </button>
                {editandoConsultaId && (
                  <button onClick={() => { setEditandoConsultaId(null); setConsulta({nome:'',documento:'',tipoDoc:'CPF',score:'',resultado:'Pendente Análise',restricoes:'',observacao:'',dataConsulta:new Date().toISOString().split('T')[0],telefone:'',convertido:false}); }}
                    style={{ background:'none', border:'none', color:'#475569', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', cursor:'pointer', textAlign:'center' }}>
                    Cancelar Edição
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Consultas */}
            <div className="glass" style={{ borderRadius:24, overflow:'hidden', borderColor:'rgba(255,255,255,0.05)' }}>
              {/* Toolbar */}
              <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ position:'relative', marginBottom:14 }}>
                  <Search size={16} color="#475569" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
                  <input style={{...inputStyle, paddingLeft:42}} type="text" placeholder="Buscar por nome ou documento..." value={buscaConsulta} onChange={e => setBuscaConsulta(e.target.value)} />
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
                  {/* Filtro resultado */}
                  <div style={{ display:'flex', gap:4, padding:4, background:'rgba(8,12,20,0.6)', borderRadius:12, border:'1px solid rgba(255,255,255,0.05)' }}>
                    {['Todos','Aprovado','Reprovado','Com Restrições','Pendente Análise'].map(r => (
                      <button key={r} onClick={() => setFiltroResultado(r)} style={btnTab(filtroResultado===r,'#7c3aed')}>
                        {r === 'Todos' ? 'Todos' : r}
                        <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background: filtroResultado===r ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', color: filtroResultado===r ? 'white' : '#475569' }}>
                          {r === 'Todos' ? consultas.length : consultas.filter(c=>c.resultado===r).length}
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* Filtro tipo doc */}
                  <div style={{ display:'flex', gap:4, padding:4, background:'rgba(8,12,20,0.6)', borderRadius:12, border:'1px solid rgba(255,255,255,0.05)' }}>
                    {['Todos','CPF','CNPJ'].map(t => (
                      <button key={t} onClick={() => setFiltroTipoDoc(t)} style={btnTab(filtroTipoDoc===t,'#4f46e5')}>{t}</button>
                    ))}
                  </div>
                  {/* Exportar PDF */}
                  <button onClick={exportarConsultasPDF} style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, background:'rgba(239,68,68,0.1)', color:'#f87171', border:'1px solid rgba(239,68,68,0.2)', fontSize:11, fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    <Printer size={14}/> PDF
                  </button>
                </div>
              </div>

              {/* Cards de consultas */}
              <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }} className="custom-scrollbar" style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10, overflowY:'auto', maxHeight:600 }}>
                {consultasFiltradas.map(c => (
                  <div key={c.id} style={{ background:'rgba(8,12,20,0.5)', borderRadius:16, padding:'16px 20px', border:'1px solid rgba(255,255,255,0.04)', borderLeft:`3px solid ${c.resultado==='Aprovado'?'#22c55e':c.resultado==='Reprovado'?'#ef4444':c.resultado==='Com Restrições'?'#f59e0b':'#64748b'}`, transition:'all 0.15s ease' }}
                    className="table-row">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                      <div style={{ display:'flex', gap:14, alignItems:'flex-start', flex:1 }}>
                        {/* Score Ring */}
                        {c.score ? <ScoreRing score={Number(c.score)} size={56}/> : (
                          <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <Hash size={18} color="#475569"/>
                          </div>
                        )}
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                            <h3 style={{ fontSize:'15px', fontWeight:700, color:'white', margin:0 }}>{c.nome}</h3>
                            {c.convertido && (
                              <span style={{ fontSize:9, padding:'2px 8px', borderRadius:6, background:'rgba(56,189,248,0.15)', color:'#38bdf8', border:'1px solid rgba(56,189,248,0.2)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>
                                ✓ Convertido
                              </span>
                            )}
                          </div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', marginBottom:8 }}>
                            <ResultadoBadge resultado={c.resultado}/>
                            <span style={{ fontSize:11, color:'#475569', fontFamily:'monospace' }}>{c.tipoDoc}: {c.documento}</span>
                            {c.telefone && <span style={{ fontSize:11, color:'#475569' }}>📞 {c.telefone}</span>}
                            <span style={{ fontSize:11, color:'#475569', display:'flex', alignItems:'center', gap:4 }}>
                              <Calendar size={12}/> {c.dataConsulta ? new Date(c.dataConsulta).toLocaleDateString('pt-BR') : '—'}
                            </span>
                          </div>
                          {c.restricoes && (
                            <div style={{ fontSize:11, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.12)', borderRadius:8, padding:'6px 10px', color:'#fca5a5', display:'flex', alignItems:'flex-start', gap:6 }}>
                              <AlertCircle size={12} style={{ marginTop:1, flexShrink:0 }}/> {c.restricoes}
                            </div>
                          )}
                          {c.observacao && !c.restricoes && (
                            <div style={{ fontSize:11, color:'#64748b', fontStyle:'italic', display:'flex', alignItems:'flex-start', gap:5 }}>
                              <Info size={11} style={{ marginTop:1, flexShrink:0 }}/> {c.observacao}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Ações */}
                      <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                        <button onClick={() => toggleConvertido(c.id, c.convertido)}
                          style={{ fontSize:10, padding:'5px 10px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', transition:'all 0.15s',
                            background: c.convertido ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)', color: c.convertido ? '#38bdf8' : '#475569' }}>
                          {c.convertido ? '✓ Cliente' : '→ Converter'}
                        </button>
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={() => { setEditandoConsultaId(c.id); setConsulta({...c}); window.scrollTo({top:0,behavior:'smooth'}); }}
                            style={{ padding:7, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', color:'#64748b', display:'flex' }}>
                            <Edit size={15}/>
                          </button>
                          <button onClick={() => excluirConsulta(c.id)}
                            style={{ padding:7, borderRadius:8, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.12)', cursor:'pointer', color:'#f87171', display:'flex' }}>
                            <Trash2 size={15}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {consultasFiltradas.length === 0 && (
                  <div style={{ textAlign:'center', padding:'48px 0', color:'#334155', fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', border:'1px dashed rgba(255,255,255,0.06)', borderRadius:16 }}>
                    <FileSearch size={28} color="#1e293b" style={{ margin:'0 auto 12px', display:'block' }}/>
                    Nenhuma consulta encontrada
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================== BOBINAS ========================== */}
      {telaAtual === 'bobinas' && (
        <div className="animate-page">
          <button onClick={() => setTelaAtual('menu')} style={{ marginBottom:24, color:'#10b981', fontWeight:700, fontSize:'13px', display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer' }}>
            <LayoutDashboard size={16}/> Voltar ao Painel
          </button>

          <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:24 }}>
            {/* Form Bobinas */}
            <div className="glass" style={{ borderRadius:24, padding:28, borderColor:'rgba(16,185,129,0.15)', height:'fit-content' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <Plus size={18} color="#10b981"/>
                <h2 style={{ fontSize:'15px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', margin:0, color:'white' }}>Nova Bobina</h2>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={fieldWrap}><p className="field-label">Identificação</p><input style={inputStyle} type="text" placeholder="Ex: Bobina 01 — Carro do João" value={bobina.identificacao} onChange={e => setBobina({...bobina, identificacao:e.target.value})}/></div>
                <div style={fieldWrap}><p className="field-label">Tipo de Cabo</p><select style={inputStyle} value={bobina.tipo} onChange={e => setBobina({...bobina, tipo:e.target.value})}><option>Drop 1FO</option><option>AS-80 6FO</option><option>AS-80 12FO</option></select></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div style={fieldWrap}><p className="field-label">Total (m)</p><input style={inputStyle} type="number" placeholder="1000" value={bobina.total} onChange={e => setBobina({...bobina, total:e.target.value})}/></div>
                  <div style={fieldWrap}><p className="field-label">Já Usado (m)</p><input style={inputStyle} type="number" placeholder="0" value={bobina.usado} onChange={e => setBobina({...bobina, usado:e.target.value})}/></div>
                </div>
                <div style={fieldWrap}><p className="field-label">Marca / Fornecedor</p><input style={inputStyle} type="text" placeholder="Furukawa, Prysmian..." value={bobina.marca} onChange={e => setBobina({...bobina, marca:e.target.value})}/></div>
                <button onClick={salvarBobina} className="btn-primary" style={{ background:'linear-gradient(135deg,#059669,#10b981)', color:'white', marginTop:4 }}>
                  <Save size={18}/> Registrar Bobina
                </button>
              </div>
            </div>

            {/* Lista Bobinas */}
            <div className="glass" style={{ borderRadius:24, padding:24, borderColor:'rgba(255,255,255,0.05)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <Layers size={18} color="#10b981"/>
                <h2 style={{ fontSize:'15px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', margin:0, color:'white' }}>Estoque em Campo</h2>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }} className="custom-scrollbar">
                {bobinas.map(b => {
                  const restante = b.total - b.usado;
                  const perc = Math.min((b.usado / b.total) * 100, 100);
                  const barColor = perc > 90 ? '#ef4444' : perc > 75 ? '#f59e0b' : '#10b981';
                  return (
                    <div key={b.id} style={{ background:'rgba(8,12,20,0.5)', borderRadius:16, padding:'18px 20px', border:'1px solid rgba(255,255,255,0.04)', borderLeft:`3px solid #10b981` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                            <h3 style={{ fontSize:'14px', fontWeight:700, color:'white', margin:0, textTransform:'uppercase' }}>{b.identificacao}</h3>
                            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:'rgba(16,185,129,0.12)', color:'#34d399', border:'1px solid rgba(16,185,129,0.2)', fontWeight:700 }}>{b.tipo}</span>
                          </div>
                          <p style={{ fontSize:10, color:'#475569', margin:0, fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'0.05em' }}>Marca: {b.marca || 'N/A'}</p>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                          <span style={{ fontSize:'22px', fontWeight:800, color:'#10b981', lineHeight:1 }}>{restante}<small style={{ fontSize:'11px', fontWeight:500, color:'#475569' }}>m</small></span>
                          <span style={{ fontSize:'9px', color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em' }}>restantes</span>
                        </div>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontSize:10, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Usado: {b.usado}m ({perc.toFixed(1)}%)</span>
                        <button onClick={() => excluirBobina(b.id)} style={{ padding:'2px 6px', borderRadius:6, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', cursor:'pointer', color:'#f87171', display:'flex', alignItems:'center' }}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                      <div className="progress-bar" style={{ marginBottom:12 }}>
                        <div style={{ height:'100%', width:`${perc}%`, background:barColor, borderRadius:3, transition:'width 0.6s ease' }}/>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.02)', padding:'10px 12px', borderRadius:10, border:'1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize:10, color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', flexShrink:0 }}>Descontar uso (m):</span>
                        <input id={`desc-${b.id}`} type="number" placeholder="120" style={{ flex:1, padding:'6px 10px', borderRadius:8, fontSize:13, textAlign:'center', fontWeight:700, background:'rgba(8,12,20,0.8)', color:'white', border:'1px solid rgba(255,255,255,0.08)', outline:'none' }}/>
                        <button onClick={() => { const el = document.getElementById(`desc-${b.id}`); if(el?.value) { registrarUso(b.id, b.usado, el.value); el.value=''; }}}
                          style={{ padding:'6px 14px', borderRadius:8, background:'#059669', color:'white', border:'none', cursor:'pointer', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.05em', flexShrink:0 }}>
                          OK
                        </button>
                      </div>
                    </div>
                  );
                })}
                {bobinas.length === 0 && (
                  <div style={{ textAlign:'center', padding:'48px 0', color:'#334155', fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', border:'1px dashed rgba(255,255,255,0.06)', borderRadius:16 }}>
                    <Database size={28} color="#1e293b" style={{ margin:'0 auto 12px', display:'block' }}/>
                    Nenhuma bobina cadastrada
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================== SUPORTE ========================== */}
      {telaAtual === 'suporte' && (
        <div className="animate-page">
          <button onClick={() => setTelaAtual('menu')} style={{ marginBottom:24, color:'#f59e0b', fontWeight:700, fontSize:'13px', display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer' }}>
            <LayoutDashboard size={16}/> Voltar ao Painel
          </button>

          {/* Form OS */}
          <div className="glass" style={{ borderRadius:24, padding:28, marginBottom:24, borderColor:'rgba(245,158,11,0.12)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <Wrench size={18} color="#f59e0b"/>
              <h2 style={{ fontSize:'15px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', margin:0, color:'white' }}>{editandoOrdemId ? 'Editar OS' : 'Nova Ordem de Serviço'}</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
              <div style={fieldWrap}><p className="field-label">Nome do Cliente</p><input style={inputStyle} type="text" placeholder="Nome completo..." value={ordem.nome} onChange={e => setOrdem({...ordem, nome:e.target.value})}/></div>
              <div style={fieldWrap}><p className="field-label">Serial (SN ONU)</p><input style={{...inputStyle, fontFamily:'monospace'}} type="text" placeholder="ZTEG..." value={ordem.serial} onChange={e => setOrdem({...ordem, serial:e.target.value})}/></div>
              <div style={fieldWrap}>
                <p className="field-label">CTO / Porta</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 60px', gap:8 }}>
                  <input style={inputStyle} type="text" placeholder="CTO..." value={ordem.cto} onChange={e => setOrdem({...ordem, cto:e.target.value})}/>
                  <input style={{...inputStyle, textAlign:'center', fontWeight:800}} type="text" placeholder="P" value={ordem.porta} onChange={e => setOrdem({...ordem, porta:e.target.value})}/>
                </div>
              </div>
              <div style={fieldWrap}><p className="field-label">Tipo de Serviço</p><select style={inputStyle} value={ordem.tipo} onChange={e => setOrdem({...ordem, tipo:e.target.value})}><option>Nova Ativação</option><option>Reparo Técnico</option><option>Mudança de Endereço</option><option>Recolha de Equipamento</option></select></div>
              <div style={fieldWrap}><p className="field-label">Data Agendada</p><input style={inputStyle} type="date" value={ordem.dataAgendada} onChange={e => setOrdem({...ordem, dataAgendada:e.target.value})}/></div>
              <div style={{...fieldWrap, gridColumn:'1/-1'}}><p className="field-label">Relato / Observações</p><textarea style={{...inputStyle, height:72, resize:'none'}} placeholder="Descreva o problema..." value={ordem.relato} onChange={e => setOrdem({...ordem, relato:e.target.value})}/></div>
              <button onClick={salvarOrdem} className="btn-primary" style={{ gridColumn:'1/-1', background:'linear-gradient(135deg,#d97706,#f59e0b)', color:'white' }}>
                <ClipboardList size={18}/> {editandoOrdemId ? 'Atualizar OS' : 'Gerar Ordem de Serviço'}
              </button>
              {editandoOrdemId && <button onClick={() => { setEditandoOrdemId(null); setOrdem({nome:'',serial:'',cto:'',porta:'',tipo:'Nova Ativação',dataAgendada:'',relato:'',status:'Pendente'}); }} style={{ gridColumn:'1/-1', background:'none', border:'none', color:'#475569', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', cursor:'pointer' }}>Cancelar Edição</button>}
            </div>
          </div>

          {/* Lista OS */}
          <div className="glass" style={{ borderRadius:24, overflow:'hidden', borderColor:'rgba(255,255,255,0.05)' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ position:'relative', marginBottom:12 }}>
                <Search size={16} color="#475569" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
                <input style={{...inputStyle, paddingLeft:42}} type="text" placeholder="Buscar OS..." value={buscaOrdem} onChange={e => setBuscaOrdem(e.target.value)}/>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                <div style={{ display:'flex', gap:4, padding:4, background:'rgba(8,12,20,0.6)', borderRadius:12, border:'1px solid rgba(255,255,255,0.05)' }}>
                  {['Todos','Pendente','Concluído','Pago'].map(s => (
                    <button key={s} onClick={() => setFiltroStatusOrdem(s)} style={btnTab(filtroStatusOrdem===s,'#d97706')}>
                      {s} <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background: filtroStatusOrdem===s ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', color: filtroStatusOrdem===s?'white':'#475569' }}>{countOrdens[s]}</span>
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:4, padding:4, background:'rgba(8,12,20,0.6)', borderRadius:12, border:'1px solid rgba(255,255,255,0.05)' }}>
                  {['Todos Tipos','Nova Ativação','Reparo Técnico','Mudança de Endereço','Recolha de Equipamento'].map(t => (
                    <button key={t} onClick={() => setFiltroTipoOrdem(t)} style={btnTab(filtroTipoOrdem===t,'#4f46e5')}>
                      {t==='Todos Tipos'?'Todos':t} <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background: filtroTipoOrdem===t ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', color: filtroTipoOrdem===t?'white':'#475569' }}>{countTipos[t]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10, overflowY:'auto', maxHeight:560 }} className="custom-scrollbar">
              {ordensFiltradas.map(o => {
                const tipoCor = { 'Nova Ativação':'#3b82f6', 'Reparo Técnico':'#ef4444', 'Mudança de Endereço':'#f59e0b', 'Recolha de Equipamento':'#a78bfa' };
                const cor = tipoCor[o.tipo] || '#64748b';
                return (
                  <div key={o.id} style={{ background:'rgba(8,12,20,0.5)', borderRadius:16, padding:'16px 20px', border:'1px solid rgba(255,255,255,0.04)', borderLeft:`3px solid ${cor}`, display:'flex', justifyContent:'space-between', gap:16, alignItems:'flex-start' }} className="table-row">
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:10, padding:'3px 8px', borderRadius:6, background:`${cor}18`, color:cor, border:`1px solid ${cor}30`, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{o.tipo}</span>
                        <h3 style={{ fontSize:'15px', fontWeight:700, color:'white', margin:0 }}>{o.nome}</h3>
                      </div>
                      <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:11, color:'#64748b', marginBottom: o.relato?8:0 }}>
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}><Wifi size={12} color="#3b82f6"/> {o.cto?`${o.cto}/P${o.porta}`:'Sem CTO'}</span>
                        {o.serial && <span style={{ fontFamily:'monospace' }}>SN: {o.serial}</span>}
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}><CalendarClock size={12}/> {o.dataAgendada ? new Date(o.dataAgendada).toLocaleDateString('pt-BR') : 'Data em aberto'}</span>
                      </div>
                      {o.relato && <div style={{ fontSize:11, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:8, padding:'6px 10px', color:'#94a3b8', fontStyle:'italic', display:'flex', gap:6 }}><Info size={12} style={{ flexShrink:0, marginTop:1 }}/>{o.relato}</div>}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end', minWidth:140 }}>
                      <button onClick={() => alterarStatusOrdem(o.id, o.status)} style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:'none', cursor:'pointer', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.15s',
                        background: o.status==='Pendente'?'rgba(245,158,11,0.12)':o.status==='Concluído'?'rgba(34,197,94,0.12)':'rgba(59,130,246,0.12)',
                        color: o.status==='Pendente'?'#fbbf24':o.status==='Concluído'?'#4ade80':'#60a5fa',
                        border: `1px solid ${o.status==='Pendente'?'rgba(245,158,11,0.25)':o.status==='Concluído'?'rgba(34,197,94,0.25)':'rgba(59,130,246,0.25)'}` }}>
                        {o.status==='Pendente'&&<Clock size={13}/>}{o.status==='Concluído'&&<CheckCircle2 size={13}/>}{o.status==='Pago'&&<DollarSign size={13}/>} {o.status}
                      </button>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={() => { setEditandoOrdemId(o.id); setOrdem(o); window.scrollTo({top:0,behavior:'smooth'}); }} style={{ padding:7, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', color:'#64748b', display:'flex' }}><Edit size={15}/></button>
                        <button onClick={() => excluirOrdem(o.id)} style={{ padding:7, borderRadius:8, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.12)', cursor:'pointer', color:'#f87171', display:'flex' }}><Trash2 size={15}/></button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {ordensFiltradas.length === 0 && <div style={{ textAlign:'center', padding:'48px 0', color:'#334155', fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', border:'1px dashed rgba(255,255,255,0.06)', borderRadius:16 }}>Nenhuma OS encontrada</div>}
            </div>
          </div>
        </div>
      )}

      {/* ========================== CLIENTES ========================== */}
      {telaAtual === 'clientes' && (
        <div className="animate-page">
          <button onClick={() => setTelaAtual('menu')} style={{ marginBottom:24, color:'#3b82f6', fontWeight:700, fontSize:'13px', display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer' }}>
            <LayoutDashboard size={16}/> Voltar ao Painel
          </button>

          {/* Form Clientes */}
          <div className="glass" style={{ borderRadius:24, padding:28, marginBottom:24, borderColor:'rgba(59,130,246,0.12)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              {editandoClienteId ? <Edit size={18} color="#f59e0b"/> : <Wifi size={18} color="#3b82f6"/>}
              <h2 style={{ fontSize:'15px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', margin:0, color:'white' }}>{editandoClienteId ? 'Editar Cliente' : 'Novo Cadastro de Rede'}</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
              <div style={fieldWrap}><p className="field-label">Assinante</p><input style={inputStyle} type="text" placeholder="Nome completo..." value={cliente.nome} onChange={e => setCliente({...cliente, nome:e.target.value})}/></div>
              <div style={fieldWrap}><p className="field-label">Serial (SN ONU)</p><input style={{...inputStyle, fontFamily:'monospace'}} type="text" placeholder="ZTEG..." value={cliente.serial} onChange={e => setCliente({...cliente, serial:e.target.value})}/></div>
              <div style={fieldWrap}><p className="field-label">Login PPPoE</p><input style={inputStyle} type="text" placeholder="user@lumix..." value={cliente.login} onChange={e => setCliente({...cliente, login:e.target.value})}/></div>
              <div style={fieldWrap}>
                <p className="field-label">CTO / Porta</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 60px', gap:8 }}>
                  <input style={inputStyle} type="text" placeholder="CTO..." value={cliente.cto} onChange={e => setCliente({...cliente, cto:e.target.value})}/>
                  <input style={{...inputStyle, textAlign:'center', fontWeight:800}} type="text" placeholder="P" value={cliente.porta} onChange={e => setCliente({...cliente, porta:e.target.value})}/>
                </div>
              </div>
              <div style={{...fieldWrap, gridColumn:'1/-1'}}><p className="field-label">Observação Técnica</p><textarea style={{...inputStyle, height:64, resize:'none'}} placeholder="Ex: Roteador próprio, sinal -18db..." value={cliente.observacao} onChange={e => setCliente({...cliente, observacao:e.target.value})}/></div>
              <button onClick={salvarCliente} className="btn-primary" style={{ gridColumn:'1/-1', background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', color:'white' }}>
                <Save size={18}/> {editandoClienteId ? 'Atualizar Registo' : 'Salvar Cliente'}
              </button>
              {editandoClienteId && <button onClick={() => { setEditandoClienteId(null); setCliente({nome:'',login:'',serial:'',cto:'',porta:'',observacao:'',status:'Ativo'}); }} style={{ gridColumn:'1/-1', background:'none', border:'none', color:'#475569', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', cursor:'pointer' }}>Cancelar Edição</button>}
            </div>
          </div>

          {/* Lista Clientes */}
          <div className="glass" style={{ borderRadius:24, overflow:'hidden', borderColor:'rgba(255,255,255,0.05)' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
              <div style={{ position:'relative', flex:1, minWidth:220 }}>
                <Search size={16} color="#475569" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
                <input style={{...inputStyle, paddingLeft:42}} type="text" placeholder="Buscar por nome, SN ou login..." value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)}/>
              </div>
              <div style={{ display:'flex', gap:4, padding:4, background:'rgba(8,12,20,0.6)', borderRadius:12, border:'1px solid rgba(255,255,255,0.05)' }}>
                {['Todos','Ativo','Desativado'].map(s => (
                  <button key={s} onClick={() => setFiltroStatusCliente(s)} style={btnTab(filtroStatusCliente===s, s==='Desativado'?'#dc2626':'#1d4ed8')}>
                    {s} <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background: filtroStatusCliente===s?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.05)', color: filtroStatusCliente===s?'white':'#475569' }}>
                      {s==='Todos'?clientes.length:clientes.filter(c=>c.status===s).length}
                    </span>
                  </button>
                ))}
              </div>
              <button onClick={() => exportarRelatorio('excel')} style={{ padding:'8px 12px', borderRadius:10, background:'rgba(34,197,94,0.1)', color:'#4ade80', border:'1px solid rgba(34,197,94,0.2)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}><Download size={14}/> CSV</button>
              <button onClick={() => exportarRelatorio('pdf')} style={{ padding:'8px 12px', borderRadius:10, background:'rgba(239,68,68,0.1)', color:'#f87171', border:'1px solid rgba(239,68,68,0.2)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}><Printer size={14}/> PDF</button>
            </div>

            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'rgba(8,12,20,0.4)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    {['Assinante / Detalhes','CTO / Porta','Status / Ações'].map(h => (
                      <th key={h} style={{ padding:'14px 20px', textAlign:'left', fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map(c => (
                    <tr key={c.id} className="table-row" style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', opacity: c.status==='Desativado' ? 0.6 : 1 }}>
                      <td style={{ padding:'14px 20px' }}>
                        <div style={{ fontWeight:700, fontSize:'14px', color: c.status==='Desativado'?'#475569':'white', textDecoration: c.status==='Desativado'?'line-through':'none', marginBottom:3 }}>{c.nome}</div>
                        <div style={{ fontSize:10, fontFamily:'monospace', color:'#475569', letterSpacing:'0.05em', textTransform:'uppercase' }}>{c.serial} | {c.login}</div>
                        {c.observacao && <div style={{ marginTop:4, fontSize:11, color:'#3b82f6', display:'flex', alignItems:'flex-start', gap:4 }}><Info size={11} style={{ flexShrink:0, marginTop:1 }}/>{c.observacao}</div>}
                      </td>
                      <td style={{ padding:'14px 20px' }}>
                        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(59,130,246,0.1)', color:'#60a5fa', padding:'6px 12px', borderRadius:10, fontSize:11, fontWeight:700 }}>
                          <Wifi size={13}/> {c.cto} / P{c.porta}
                        </div>
                      </td>
                      <td style={{ padding:'14px 20px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
                          <button onClick={() => alternarStatusCliente(c.id, c.status)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', transition:'all 0.15s',
                            background: c.status==='Ativo'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)', color: c.status==='Ativo'?'#4ade80':'#f87171', border: `1px solid ${c.status==='Ativo'?'rgba(34,197,94,0.25)':'rgba(239,68,68,0.25)'}` }}>
                            {c.status==='Ativo'?<CheckCircle size={13}/>:<XCircle size={13}/>} {c.status}
                          </button>
                          <button onClick={() => { setEditandoClienteId(c.id); setCliente(c); window.scrollTo({top:0,behavior:'smooth'}); }} style={{ padding:7, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', color:'#64748b', display:'flex' }}><Edit size={15}/></button>
                          <button onClick={() => excluirCliente(c.id)} style={{ padding:7, borderRadius:8, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.12)', cursor:'pointer', color:'#f87171', display:'flex' }}><Trash2 size={15}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {clientesFiltrados.length === 0 && (
                    <tr><td colSpan={3} style={{ padding:'48px 0', textAlign:'center', color:'#334155', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>Nenhum cliente encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
