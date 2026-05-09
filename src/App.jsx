import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  Save, Search, Trash2, Edit, Info, CheckCircle, XCircle, Users, 
  Download, Printer, Wifi, LayoutDashboard, ClipboardList, MapPin, Phone, 
  Wrench, CalendarClock, CheckCircle2, Clock, DollarSign,
  Database, Layers, Plus // Adicionados para o módulo de Bobinas
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

// --- COMPONENTE DE ESTILO ---
const TailwindStyle = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    body { background-color: #0f172a; color: #f8fafc; font-family: 'Inter', sans-serif; }
    .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
    input, textarea, select { background: rgba(15, 23, 42, 0.6) !important; color: white !important; border: 1px solid rgba(255,255,255,0.1) !important; }
    input:focus, select:focus, textarea:focus { border-color: #3b82f6 !important; outline: none; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
    .progress-bar { height: 8px; border-radius: 4px; background: #334155; overflow: hidden; }
  `}</style>
);

export default function App() {
  const [telaAtual, setTelaAtual] = useState('menu');
  
  // Estados: Clientes
  const [clientes, setClientes] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [filtroStatusCliente, setFiltroStatusCliente] = useState('Todos');
  const [editandoClienteId, setEditandoClienteId] = useState(null);
  const [cliente, setCliente] = useState({ nome: '', login: '', serial: '', cto: '', porta: '', observacao: '', status: 'Ativo' });

  // Estados: Suporte (Ordens de Serviço)
  const [ordens, setOrdens] = useState([]);
  const [buscaOrdem, setBuscaOrdem] = useState('');
  const [filtroStatusOrdem, setFiltroStatusOrdem] = useState('Todos');
  const [filtroTipoOrdem, setFiltroTipoOrdem] = useState('Todos Tipos');
  const [editandoOrdemId, setEditandoOrdemId] = useState(null);
  const [ordem, setOrdem] = useState({ 
    nome: '', serial: '', cto: '', porta: '', tipo: 'Nova Ativação', dataAgendada: '', relato: '', status: 'Pendente' 
  });

  // Estados: Bobinas
  const [bobinas, setBobinas] = useState([]);
  const [bobina, setBobina] = useState({ identificacao: '', tipo: 'Drop 1FO', total: '', usado: '', marca: '' });

  // Buscar Dados (Clientes, Suporte e Bobinas) - Carregamento Direto
  useEffect(() => {
    // Buscar Clientes
    const qClientes = query(collection(db, "clientes"), orderBy("nome", "asc"));
    const unsubClientes = onSnapshot(qClientes, (snapshot) => {
      setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Buscar Ordens de Suporte
    const qOrdens = query(collection(db, "suporte"), orderBy("dataAgendada", "asc"));
    const unsubOrdens = onSnapshot(qOrdens, (snapshot) => {
      setOrdens(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Buscar Bobinas
    const qBobinas = query(collection(db, "bobinas"), orderBy("identificacao", "asc"));
    const unsubBobinas = onSnapshot(qBobinas, (snapshot) => {
      setBobinas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubClientes(); unsubOrdens(); unsubBobinas(); };
  }, []);

  // --- FUNÇÕES DE CLIENTES ---
  const salvarCliente = async () => {
    if (!cliente.nome || !cliente.serial) return alert("Nome e Serial são obrigatórios!");
    
    if (!editandoClienteId) {
      const serialEmUso = clientes.find(c => c.serial.toLowerCase() === cliente.serial.toLowerCase() && c.status === 'Ativo');
      if (serialEmUso) return alert(`⚠️ BLOQUEADO: O Serial (SN) ${cliente.serial} já está em uso pelo assinante ATIVO: ${serialEmUso.nome}!`);
      const nomeEmUso = clientes.find(c => c.nome.toLowerCase() === cliente.nome.toLowerCase() && c.status === 'Ativo');
      if (nomeEmUso) return alert(`⚠️ BLOQUEADO: Já existe um assinante ATIVO com o nome ${cliente.nome}!`);
    }

    try {
      if (editandoClienteId) {
        await updateDoc(doc(db, "clientes", editandoClienteId), { ...cliente });
        setEditandoClienteId(null);
      } else {
        await addDoc(collection(db, "clientes"), { ...cliente, dataCadastro: new Date().toISOString() });
      }
      setCliente({ nome: '', login: '', serial: '', cto: '', porta: '', observacao: '', status: 'Ativo' });
    } catch (e) { alert("Erro ao guardar dados."); }
  };

  const alternarStatusCliente = async (id, statusAtual) => {
    const novoStatus = statusAtual === 'Ativo' ? 'Desativado' : 'Ativo';
    await updateDoc(doc(db, "clientes", id), { status: novoStatus });
  };

  const excluirCliente = async (id) => {
    if (window.confirm("Deseja realmente apagar este registo?")) await deleteDoc(doc(db, "clientes", id));
  };

  // --- FUNÇÕES DE SUPORTE (OS) ---
  const salvarOrdem = async () => {
    if (!ordem.nome || !ordem.tipo) return alert("Nome e Tipo de Serviço são obrigatórios!");
    try {
      if (editandoOrdemId) {
        await updateDoc(doc(db, "suporte", editandoOrdemId), { ...ordem });
        setEditandoOrdemId(null);
      } else {
        await addDoc(collection(db, "suporte"), { ...ordem, dataCriacao: new Date().toISOString() });
      }
      setOrdem({ nome: '', serial: '', cto: '', porta: '', tipo: 'Nova Ativação', dataAgendada: '', relato: '', status: 'Pendente' });
      alert("Ordem de Serviço salva com sucesso!");
    } catch (e) { alert("Erro ao guardar ordem."); }
  };

  const alterarStatusOrdem = async (id, statusAtual) => {
    const proximoStatus = {
      'Pendente': 'Concluído',
      'Concluído': 'Pago',
      'Pago': 'Pendente'
    };
    await updateDoc(doc(db, "suporte", id), { status: proximoStatus[statusAtual] });
  };

  const excluirOrdem = async (id) => {
    if (window.confirm("Apagar esta Ordem de Serviço?")) await deleteDoc(doc(db, "suporte", id));
  };

  // --- FUNÇÕES DE BOBINAS ---
  const salvarBobina = async () => {
    if (!bobina.identificacao || !bobina.total) return alert("Identificação e Total de Metros são obrigatórios!");
    try {
      await addDoc(collection(db, "bobinas"), { ...bobina, total: Number(bobina.total), usado: Number(bobina.usado || 0), dataEntrada: new Date().toISOString() });
      setBobina({ identificacao: '', tipo: 'Drop 1FO', total: '', usado: '', marca: '' });
      alert("Bobina registrada no sistema!");
    } catch (e) { alert("Erro ao guardar bobina."); }
  };

  // Lógica inteligente de subtração de metragem
  const registrarUso = async (id, usadoAtual, valorDesconto) => {
    if (!valorDesconto || isNaN(valorDesconto) || Number(valorDesconto) <= 0) {
      return alert("Insira um valor de metragem válido para descontar.");
    }
    const novoUsado = Number(usadoAtual) + Number(valorDesconto);
    await updateDoc(doc(db, "bobinas", id), { usado: novoUsado });
  };

  const excluirBobina = async (id) => {
    if (window.confirm("Deseja realmente apagar esta bobina do estoque?")) await deleteDoc(doc(db, "bobinas", id));
  };

  // --- EXPORTAÇÃO ---
  const exportarRelatorio = (tipo) => {
    if (tipo === 'excel') {
      const cabecalho = "Nome,Serial,Login,CTO,Porta,Status,Observacao\n";
      const dados = clientes.map(c => `"${c.nome}","${c.serial}","${c.login}","${c.cto}","${c.porta}","${c.status}","${c.observacao || ''}"`).join("\n");
      const blob = new Blob([cabecalho + dados], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Lumix_Relatorio_${new Date().toLocaleDateString()}.csv`;
      link.click();
    } else {
      const docPDF = new jsPDF();
      docPDF.setFontSize(18);
      docPDF.text("LUMIX FIBRA - Relatório Técnico", 14, 20);
      docPDF.setFontSize(10);
      docPDF.text(`Gerado em ${new Date().toLocaleDateString()}`, 14, 28);
      const rows = clientes.map(c => [c.nome, c.serial, c.login, `${c.cto} / P${c.porta}`, c.status]);
      docPDF.autoTable({ startY: 35, head: [['Assinante', 'Serial (SN)', 'Login', 'CTO/Porta', 'Status']], body: rows, theme: 'grid', headStyles: { fillColor: [30, 64, 175] } });
      docPDF.save("Relatorio_Lumix_Fibra.pdf");
    }
  };

  // --- RENDERIZAÇÃO CONDICIONAL E FILTROS ---
  const clientesFiltrados = clientes.filter(c => {
    const search = buscaCliente.toLowerCase();
    return (c.nome?.toLowerCase().includes(search) || c.serial?.toLowerCase().includes(search) || c.login?.toLowerCase().includes(search)) && 
           (filtroStatusCliente === 'Todos' || c.status === filtroStatusCliente);
  }).sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));

  const ordensFiltradas = ordens.filter(o => {
    const search = buscaOrdem.toLowerCase();
    return (o.nome?.toLowerCase().includes(search) || o.serial?.toLowerCase().includes(search) || o.cto?.toLowerCase().includes(search)) &&
           (filtroStatusOrdem === 'Todos' || o.status === filtroStatusOrdem) &&
           (filtroTipoOrdem === 'Todos Tipos' || o.tipo === filtroTipoOrdem);
  });

  // --- CONTAGEM DE ITENS ---
  const contagemOrdens = {
    'Todos': ordens.filter(o => filtroTipoOrdem === 'Todos Tipos' || o.tipo === filtroTipoOrdem).length,
    'Pendente': ordens.filter(o => o.status === 'Pendente' && (filtroTipoOrdem === 'Todos Tipos' || o.tipo === filtroTipoOrdem)).length,
    'Concluído': ordens.filter(o => o.status === 'Concluído' && (filtroTipoOrdem === 'Todos Tipos' || o.tipo === filtroTipoOrdem)).length,
    'Pago': ordens.filter(o => o.status === 'Pago' && (filtroTipoOrdem === 'Todos Tipos' || o.tipo === filtroTipoOrdem)).length
  };

  const contagemTipos = {
    'Todos Tipos': ordens.filter(o => filtroStatusOrdem === 'Todos' || o.status === filtroStatusOrdem).length,
    'Nova Ativação': ordens.filter(o => o.tipo === 'Nova Ativação' && (filtroStatusOrdem === 'Todos' || o.status === filtroStatusOrdem)).length,
    'Reparo Técnico': ordens.filter(o => o.tipo === 'Reparo Técnico' && (filtroStatusOrdem === 'Todos' || o.status === filtroStatusOrdem)).length,
    'Mudança de Endereço': ordens.filter(o => o.tipo === 'Mudança de Endereço' && (filtroStatusOrdem === 'Todos' || o.status === filtroStatusOrdem)).length,
    'Recolha de Equipamento': ordens.filter(o => o.tipo === 'Recolha de Equipamento' && (filtroStatusOrdem === 'Todos' || o.status === filtroStatusOrdem)).length
  };

  const contagemClientes = {
    'Todos': clientes.length,
    'Desativado': clientes.filter(c => c.status === 'Desativado').length
  };

  return (
    <div className="min-h-screen p-4 md:p-8 text-slate-100 pb-20 overflow-x-hidden">
      <TailwindStyle />
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER COMUM */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div onClick={() => setTelaAtual('menu')} className="cursor-pointer">
            <h1 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-tighter"><Wifi className="text-blue-500" /> Lumix Fibra</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Painel Administrativo v2.0</p>
          </div>
          <div className="flex items-center gap-3 glass p-2 px-4 rounded-2xl border border-white/5">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold truncate max-w-[150px]">Equipe Técnica</div>
              <div className="text-[9px] text-green-400 uppercase font-black">Sistema Aberto e Online</div>
            </div>
          </div>
        </header>

        {/* TELA: MENU PRINCIPAL */}
        {telaAtual === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-10 duration-500">
            <button onClick={() => setTelaAtual('clientes')} className="glass p-12 rounded-3xl group hover:border-blue-500/50 transition-all text-center flex flex-col items-center gap-6 shadow-xl">
              <div className="bg-blue-600/20 p-8 rounded-full text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all"><Users size={48} /></div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Clientes e CTO</h3>
              <p className="text-slate-400 text-sm">Gerencie portas, seriais e localização técnica.</p>
            </button>

            <button onClick={() => setTelaAtual('suporte')} className="glass p-12 rounded-3xl group hover:border-orange-500/50 transition-all text-center flex flex-col items-center gap-6 shadow-xl">
              <div className="bg-orange-600/20 p-8 rounded-full text-orange-500 group-hover:bg-orange-600 group-hover:text-white transition-all"><Wrench size={48} /></div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white">Ativação e Suporte</h3>
              <p className="text-slate-400 text-sm">Ordens de serviço, novas instalações e reparos.</p>
            </button>

            <button onClick={() => setTelaAtual('bobinas')} className="glass p-12 rounded-3xl group hover:border-emerald-500/50 transition-all text-center flex flex-col items-center gap-6 shadow-xl">
              <div className="bg-emerald-600/20 p-8 rounded-full text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all"><Database size={48} /></div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white">Bobinas</h3>
              <p className="text-slate-400 text-sm">Controle de estoque e metragem de fibra óptica.</p>
            </button>
          </div>
        )}

        {/* TELA: BOBINAS */}
        {telaAtual === 'bobinas' && (
          <div className="animate-in fade-in duration-700">
            <button onClick={() => setTelaAtual('menu')} className="mb-6 text-emerald-400 font-bold flex items-center gap-2 hover:text-emerald-300 transition-colors"><LayoutDashboard size={18} /> Voltar ao Painel</button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Formulário Bobinas */}
              <div className="glass p-8 rounded-3xl mb-10 shadow-2xl border border-emerald-500/10 lg:col-span-1 h-fit">
                <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
                  <Plus className="text-emerald-500" />
                  <h2 className="text-xl font-black uppercase tracking-tight">Nova Bobina</h2>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Identificação</label>
                    <input type="text" placeholder="Ex: Bobina 01 (Carro do João)" className="p-4 rounded-2xl" value={bobina.identificacao} onChange={e => setBobina({...bobina, identificacao: e.target.value})} />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Tipo de Cabo</label>
                    <select className="p-4 rounded-2xl font-bold cursor-pointer" value={bobina.tipo} onChange={e => setBobina({...bobina, tipo: e.target.value})}>
                      <option>Drop 1FO</option>
                      <option>AS-80 6FO</option>
                      <option>AS-80 12FO</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Total (m)</label>
                      <input type="number" placeholder="Ex: 1000" className="p-4 rounded-2xl" value={bobina.total} onChange={e => setBobina({...bobina, total: e.target.value})} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Já Usado (m)</label>
                      <input type="number" placeholder="Ex: 0" className="p-4 rounded-2xl" value={bobina.usado} onChange={e => setBobina({...bobina, usado: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Marca/Fornecedor (Opcional)</label>
                    <input type="text" placeholder="Ex: Furukawa, Prysmian..." className="p-4 rounded-2xl" value={bobina.marca} onChange={e => setBobina({...bobina, marca: e.target.value})} />
                  </div>
                  
                  <button onClick={salvarBobina} className="bg-emerald-600 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all uppercase tracking-widest mt-2 active:scale-95 shadow-xl shadow-emerald-900/20">
                    <Save size={22} /> Registrar Bobina
                  </button>
                </div>
              </div>

              {/* Listagem Bobinas */}
              <div className="lg:col-span-2 glass rounded-3xl overflow-hidden shadow-2xl border border-white/5 p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                  <Layers className="text-emerald-500" />
                  <h2 className="text-xl font-black uppercase tracking-tight">Estoque de Fibra em Campo</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-4 custom-scrollbar overflow-y-auto max-h-[600px] pr-2">
                  {bobinas.map(b => {
                    const restante = b.total - b.usado;
                    const perc = Math.min((b.usado / b.total) * 100, 100);
                    
                    return (
                      <div key={b.id} className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 border-l-4 hover:bg-white/5 transition-colors group" style={{borderLeftColor: '#10b981'}}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-white uppercase">{b.identificacao} <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded ml-2 border border-emerald-500/20">{b.tipo}</span></h3>
                            <p className="text-[10px] font-mono text-slate-500 uppercase mt-1 tracking-wider">Marca: {b.marca || 'N/A'}</p>
                          </div>
                          <button onClick={() => excluirBobina(b.id)} className="text-slate-500 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={20}/></button>
                        </div>
                        
                        <div className="flex justify-between items-end mb-2 mt-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gasto Total: {b.usado}m ({perc.toFixed(1)}%)</span>
                          <span className="text-emerald-400 font-black text-lg">{restante}m <small className="text-slate-500 font-normal uppercase text-[9px] tracking-widest">restantes</small></span>
                        </div>
                        
                        <div className="progress-bar mb-5">
                          <div className={`h-full transition-all duration-700 ${perc > 90 ? 'bg-red-500' : perc > 75 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${perc}%` }}></div>
                        </div>

                        {/* NOVA CAIXA DE DESCONTO INTELIGENTE */}
                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5 gap-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                             <Edit size={12} className="text-emerald-500"/> Descontar Uso da Instalação (m):
                           </label>
                           <div className="flex gap-2 w-full sm:w-auto">
                             <input 
                              type="number" 
                              id={`desconto-${b.id}`}
                              placeholder="Ex: 120"
                              className="w-full sm:w-28 p-2 text-sm rounded-lg text-center font-black bg-slate-800 text-white border border-white/10 outline-none focus:ring-2 ring-emerald-500 transition-all" 
                             />
                             <button 
                              onClick={() => {
                                const input = document.getElementById(`desconto-${b.id}`);
                                if(input.value) {
                                  registrarUso(b.id, b.usado, input.value);
                                  input.value = ''; // Limpa a caixa depois de clicar
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                             >
                               OK
                             </button>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                  {bobinas.length === 0 && <div className="text-center p-12 text-slate-500 text-xs font-black tracking-widest uppercase opacity-50 border border-dashed border-white/10 rounded-2xl">Nenhuma bobina cadastrada</div>}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TELA: ATIVAÇÃO E SUPORTE */}
        {telaAtual === 'suporte' && (
          <div className="animate-in fade-in duration-700">
            <button onClick={() => setTelaAtual('menu')} className="mb-6 text-orange-400 font-bold flex items-center gap-2 hover:text-orange-300 transition-colors"><LayoutDashboard size={18} /> Voltar ao Menu</button>

            {/* Formulário de OS */}
            <div className="glass p-8 rounded-3xl mb-10 shadow-2xl border border-orange-500/10">
              <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
                <Wrench className="text-orange-500" />
                <h2 className="text-xl font-black uppercase tracking-tight">{editandoOrdemId ? "Editar Ordem" : "Nova Ordem de Serviço (OS)"}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Nome do Cliente / Assinante</label>
                  <input type="text" placeholder="Nome completo..." className="p-4 rounded-2xl" value={ordem.nome} onChange={e => setOrdem({...ordem, nome: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Serial (SN ONU)</label>
                  <input type="text" placeholder="ZTEG..." className="p-4 rounded-2xl font-mono tracking-widest" value={ordem.serial} onChange={e => setOrdem({...ordem, serial: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">CTO / Porta (P)</label>
                  <div className="grid grid-cols-4 gap-2">
                    <input type="text" placeholder="Caixa CTO" className="col-span-3 p-4 rounded-2xl" value={ordem.cto} onChange={e => setOrdem({...ordem, cto: e.target.value})} />
                    <input type="text" placeholder="P" className="col-span-1 p-4 rounded-2xl text-center font-black" value={ordem.porta} onChange={e => setOrdem({...ordem, porta: e.target.value})} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Tipo de Serviço</label>
                  <select className="p-4 rounded-2xl font-bold cursor-pointer" value={ordem.tipo} onChange={e => setOrdem({...ordem, tipo: e.target.value})}>
                    <option value="Nova Ativação">Nova Ativação</option>
                    <option value="Reparo Técnico">Reparo Técnico</option>
                    <option value="Mudança de Endereço">Mudança de Endereço</option>
                    <option value="Recolha de Equipamento">Recolha de Equipamento</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 lg:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Data Agendada</label>
                  <input type="date" className="p-4 rounded-2xl" value={ordem.dataAgendada} onChange={e => setOrdem({...ordem, dataAgendada: e.target.value})} />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
                  <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Relato do Problema / Observações</label>
                  <textarea placeholder="Ex: Cliente relata luz LOS vermelha na ONU..." className="p-4 rounded-2xl h-20 resize-none" value={ordem.relato} onChange={e => setOrdem({...ordem, relato: e.target.value})} />
                </div>

                <button onClick={salvarOrdem} className="md:col-span-2 lg:col-span-3 bg-orange-600 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-orange-700 transition-all uppercase tracking-widest mt-2 shadow-xl shadow-orange-900/20 active:scale-95">
                  <ClipboardList size={22} /> {editandoOrdemId ? "Atualizar OS" : "Gerar Ordem de Serviço"}
                </button>
                {editandoOrdemId && <button onClick={() => { setEditandoOrdemId(null); setOrdem({nome:'', serial:'', cto:'', porta:'', tipo:'Nova Ativação', dataAgendada:'', relato:'', status:'Pendente'}); }} className="md:col-span-2 lg:col-span-3 text-slate-500 text-xs font-bold uppercase hover:text-white transition-colors">Cancelar Edição</button>}
              </div>
            </div>

            {/* Lista de OS */}
            <div className="glass rounded-3xl overflow-hidden shadow-2xl border border-white/5">
              <div className="p-6 bg-slate-800/50 border-b border-white/5 flex flex-col gap-4">
                
                {/* Barra de Busca */}
                <div className="relative w-full">
                  <Search className="absolute left-4 top-4 text-slate-500" size={20} />
                  <input type="text" placeholder="Filtrar OS por nome, CTO ou SN..." className="w-full pl-12 p-4 rounded-2xl outline-none" value={buscaOrdem} onChange={e => setBuscaOrdem(e.target.value)} />
                </div>

                {/* Filtros em Linhas */}
                <div className="flex flex-col xl:flex-row gap-3">
                  {/* Status */}
                  <div className="flex flex-wrap p-1 bg-slate-900 rounded-xl border border-white/5 gap-1">
                    {['Todos', 'Pendente', 'Concluído', 'Pago'].map(status => (
                      <button 
                        key={status} 
                        onClick={() => setFiltroStatusOrdem(status)} 
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${filtroStatusOrdem === status ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                      >
                        {status}
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${filtroStatusOrdem === status ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {contagemOrdens[status]}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Tipos de Serviço */}
                  <div className="flex flex-wrap p-1 bg-slate-900 rounded-xl border border-white/5 gap-1">
                    {['Todos Tipos', 'Nova Ativação', 'Reparo Técnico', 'Mudança de Endereço', 'Recolha de Equipamento'].map(tipo => (
                      <button 
                        key={tipo} 
                        onClick={() => setFiltroTipoOrdem(tipo)} 
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${filtroTipoOrdem === tipo ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                      >
                        {tipo === 'Todos Tipos' ? 'Todos os Tipos' : tipo}
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${filtroTipoOrdem === tipo ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {contagemTipos[tipo]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <div className="p-6 grid grid-cols-1 gap-4 custom-scrollbar overflow-y-auto max-h-[600px]">
                {ordensFiltradas.map((o) => (
                  <div key={o.id} className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 flex flex-col lg:flex-row justify-between gap-6 hover:bg-white/5 transition-colors group">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest 
                          ${o.tipo === 'Nova Ativação' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 
                            o.tipo === 'Reparo Técnico' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 
                            o.tipo === 'Mudança de Endereço' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' : 
                            'bg-purple-500/20 text-purple-400 border border-purple-500/20'}`}>
                          {o.tipo}
                        </span>
                        <h3 className="text-lg font-bold text-white uppercase">{o.nome}</h3>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 mt-4">
                        <div className="flex items-center gap-1.5"><Wifi size={14} className="text-blue-500 shrink-0"/> {o.cto ? `${o.cto} / P${o.porta}` : 'Sem CTO informada'}</div>
                        {o.serial && <div className="flex items-center gap-1.5 font-mono"><Info size={14} className="text-slate-500 shrink-0"/> SN: {o.serial}</div>}
                        <div className="flex items-center gap-1.5"><CalendarClock size={14} className="text-slate-500 shrink-0"/> Agendado: {o.dataAgendada ? new Date(o.dataAgendada).toLocaleDateString('pt-BR') : 'Data em aberto'}</div>
                      </div>
                      
                      {o.relato && (
                        <div className="text-xs bg-black/20 p-4 rounded-xl border border-white/5 text-slate-300 italic mt-3 flex items-start gap-2">
                          <Info size={14} className="text-orange-400 shrink-0 mt-0.5" />
                          <span>{o.relato}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex lg:flex-col justify-between items-end gap-4 min-w-[150px]">
                      <button onClick={() => alterarStatusOrdem(o.id, o.status)} className={`w-full py-3 px-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 border transition-all active:scale-95
                        ${o.status === 'Pendente' ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-white' : 
                          o.status === 'Concluído' ? 'bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500 hover:text-white' : 
                          'bg-blue-500/10 border-blue-500/50 text-blue-400 hover:bg-blue-500 hover:text-white'}`}>
                        {o.status === 'Pendente' && <Clock size={14} />}
                        {o.status === 'Concluído' && <CheckCircle2 size={14} />}
                        {o.status === 'Pago' && <DollarSign size={14} />}
                        {o.status}
                      </button>

                      <div className="flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditandoOrdemId(o.id); setOrdem(o); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-2.5 text-slate-500 hover:text-orange-400 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all"><Edit size={18} /></button>
                        <button onClick={() => excluirOrdem(o.id)} className="p-2.5 text-slate-500 hover:text-red-500 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {ordensFiltradas.length === 0 && <div className="text-center p-12 text-slate-500 text-xs font-black tracking-widest uppercase opacity-50 border border-dashed border-white/10 rounded-2xl">Nenhuma OS encontrada para este filtro</div>}
              </div>
            </div>
          </div>
        )}

        {/* TELA: CLIENTES E CTO */}
        {telaAtual === 'clientes' && (
          <div className="animate-in fade-in duration-700">
            <button onClick={() => setTelaAtual('menu')} className="mb-6 text-blue-400 font-bold flex items-center gap-2 hover:text-blue-300 transition-colors"><LayoutDashboard size={18} /> Voltar ao Painel</button>

            {/* Formulário de Clientes */}
            <div className="glass p-8 rounded-3xl mb-10 shadow-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
                {editandoClienteId ? <Edit className="text-orange-400" /> : <Wifi className="text-blue-500" />}
                <h2 className="text-xl font-black uppercase tracking-tight">{editandoClienteId ? "Editar Cliente" : "Novo Cadastro de Rede"}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Assinante</label><input type="text" placeholder="Nome completo..." className="p-4 rounded-2xl" value={cliente.nome} onChange={e => setCliente({...cliente, nome: e.target.value})} /></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Serial (SN ONU)</label><input type="text" placeholder="ZTEG..." className="p-4 rounded-2xl font-mono tracking-widest" value={cliente.serial} onChange={e => setCliente({...cliente, serial: e.target.value})} /></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Login PPPoE</label><input type="text" placeholder="user@lumix..." className="p-4 rounded-2xl" value={cliente.login} onChange={e => setCliente({...cliente, login: e.target.value})} /></div>
                
                <div className="flex flex-col gap-1.5 lg:col-span-1">
                  <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">CTO / Porta (P)</label>
                  <div className="grid grid-cols-4 gap-2">
                    <input type="text" placeholder="Caixa CTO" className="col-span-3 p-4 rounded-2xl" value={cliente.cto} onChange={e => setCliente({...cliente, cto: e.target.value})} />
                    <input type="text" placeholder="P" className="col-span-1 p-4 rounded-2xl text-center font-black" value={cliente.porta} onChange={e => setCliente({...cliente, porta: e.target.value})} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Observação Técnica</label><textarea placeholder="Ex: Roteador próprio, sinal -18db..." className="p-4 rounded-2xl h-14 resize-none" value={cliente.observacao} onChange={e => setCliente({...cliente, observacao: e.target.value})} /></div>

                <button onClick={salvarCliente} className="lg:col-span-3 bg-blue-600 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all uppercase tracking-widest mt-2 active:scale-95"><Save size={22} /> {editandoClienteId ? "Atualizar Registo" : "Salvar no Sistema"}</button>
                {editandoClienteId && <button onClick={() => { setEditandoClienteId(null); setCliente({nome:'', login:'', serial:'', cto:'', porta:'', observacao:'', status:'Ativo'}); }} className="lg:col-span-3 text-slate-500 text-xs font-bold uppercase hover:text-white transition-colors">Cancelar Edição</button>}
              </div>
            </div>

            {/* Listagem de Clientes */}
            <div className="glass rounded-3xl overflow-hidden shadow-2xl border border-white/5">
              <div className="p-6 bg-slate-800/50 border-b border-white/5 flex flex-col lg:flex-row justify-between gap-6">
                <div className="relative flex-1"><Search className="absolute left-4 top-4 text-slate-500" size={20} /><input type="text" placeholder="Filtrar por nome, SN ou login..." className="w-full pl-12 p-4 rounded-2xl outline-none" value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)} /></div>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex p-1 bg-slate-900 rounded-xl border border-white/5 mr-2 gap-1">
                    {['Todos', 'Desativado'].map(status => (
                      <button 
                        key={status} 
                        onClick={() => setFiltroStatusCliente(status)} 
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${filtroStatusCliente === status ? (status === 'Desativado' ? 'bg-red-600 text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg') : 'text-slate-500 hover:text-white'}`}
                      >
                        {status === 'Desativado' ? 'Desativados' : 'Todos'}
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${filtroStatusCliente === status ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {contagemClientes[status]}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => exportarRelatorio('excel')} className="bg-green-600/20 text-green-400 p-3 rounded-xl hover:bg-green-600 hover:text-white transition-all"><Download size={18} /></button>
                  <button onClick={() => exportarRelatorio('pdf')} className="bg-red-600/20 text-red-400 p-3 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Printer size={18} /></button>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead><tr className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5"><th className="p-6">Assinante / Detalhes</th><th className="p-6">CTO / Porta</th><th className="p-6 text-center">Ações</th></tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {clientesFiltrados.map((c) => (
                      <tr key={c.id} className={`hover:bg-white/5 transition-colors ${c.status === 'Desativado' ? 'bg-red-900/5 opacity-80' : ''}`}>
                        <td className="p-6"><div className="flex items-center gap-4">
                          <div className="min-w-0">
                            <div className={`text-base font-bold truncate ${c.status === 'Desativado' ? 'line-through text-slate-500' : 'text-white'}`}>{c.nome}</div>
                            <div className="text-[10px] font-mono text-slate-500 uppercase mt-1 tracking-wider">{c.serial} <span className="mx-1">|</span> {c.login}</div>
                            {c.observacao && <div className="mt-2 text-[11px] italic text-blue-400 flex items-start gap-1 bg-blue-500/5 p-2 rounded-lg border border-blue-500/10"><Info size={12} className="mt-0.5 shrink-0" /> {c.observacao}</div>}
                          </div>
                        </div></td>
                        <td className="p-6"><div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-400 px-4 py-2 rounded-xl text-xs font-black uppercase"><Wifi size={14} /> {c.cto} <span className="text-slate-600 mx-1">/</span> P{c.porta}</div></td>
                        <td className="p-6"><div className="flex items-center justify-end gap-2 md:gap-3">
                           <button onClick={() => alternarStatusCliente(c.id, c.status)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm ${c.status === 'Ativo' ? 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20'}`}>
                             {c.status === 'Ativo' ? <CheckCircle size={14} /> : <XCircle size={14} />} {c.status}
                           </button>
                           <button onClick={() => { setEditandoClienteId(c.id); setCliente(c); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-slate-500 hover:text-orange-400 p-2 hover:bg-orange-400/10 rounded-lg"><Edit size={20} /></button>
                           <button onClick={() => excluirCliente(c.id)} className="text-slate-500 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg"><Trash2 size={20} /></button>
                        </div></td>
                      </tr>
                    ))}
                    {clientesFiltrados.length === 0 && <tr><td colSpan="3" className="p-20 text-center text-slate-500 italic uppercase text-xs tracking-widest font-black opacity-30">Nenhum cliente encontrado</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}