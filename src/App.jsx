import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import {
  Save, Search, Trash2, Edit, Info, CheckCircle, XCircle, Users,
  Download, Printer, Wifi, LayoutDashboard, ClipboardList,
  Wrench, CalendarClock, CheckCircle2, Clock, DollarSign,
  Database, Layers, Plus, ShieldCheck, ShieldX, ShieldAlert,
  FileSearch, Calendar, AlertCircle, TrendingUp, Hash,
  BadgeCheck, ChevronRight, Star, Menu, X, AlertTriangle,
  Activity, Boxes, ArrowRight, Phone, PackageX, RefreshCw,
  HardDrive, PackagePlus, PackageCheck, Undo2, Link2, ClipboardCheck, CircleDashed
} from 'lucide-react';
import { db, loadPDF } from './lib/firebase';
import { CORES, ONT_MODELOS, formatarDocumento, fmtBRL, fmtData } from './lib/format';
import { GlobalStyle, ScoreRing, ResultadoBadge, Bars, Donut, Funnel, SkeletonList, EmptyState, PageHeader } from './components/ui';

// ============================================================
//  APP
// ============================================================
export default function App() {
  const [telaAtual, setTelaAtual] = useState('dashboard');
  const [navOpen, setNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // toasts + modal
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const toastSeq = useRef(0);
  const notify = (type, msg) => {
    const id = (toastSeq.current += 1);
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3900);
  };
  const confirmar = (msg, opts = {}) => new Promise(res => setConfirmState({ msg, resolve: res, ...opts }));
  const fecharConfirm = (val) => { confirmState?.resolve(val); setConfirmState(null); };

  // busca global
  const [buscaGlobal, setBuscaGlobal] = useState('');

  // ---- Estados: Clientes ----
  const [clientes, setClientes] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [filtroStatusCliente, setFiltroStatusCliente] = useState('Todos');
  const [filtroSGP, setFiltroSGP] = useState('Todos');
  const [editandoClienteId, setEditandoClienteId] = useState(null);
  const clienteVazio = { nome:'', login:'', serial:'', ontId:'', cto:'', porta:'', observacao:'', status:'Ativo', lancadoSGP:false };
  const [cliente, setCliente] = useState(clienteVazio);

  // ---- Estados: Estoque ONT ----
  const [onts, setOnts] = useState([]);
  const [buscaOnt, setBuscaOnt] = useState('');
  const [filtroStatusOnt, setFiltroStatusOnt] = useState('Todos');
  const [modoLote, setModoLote] = useState(false);
  const ontVazia = { serial:'', modelo:'', marca:'' };
  const [ont, setOnt] = useState(ontVazia);
  // edição de equipamento + baixa (perda / roubo / não devolução)
  const MOTIVOS_BAIXA = ['Perdido pelo cliente', 'Roubado / furtado', 'Não devolvido', 'Dano sem reparo (perda total)', 'Outro'];
  const [ontEdit, setOntEdit] = useState(null);

  // ---- Estados: Suporte (OS) ----
  const [ordens, setOrdens] = useState([]);
  const [buscaOrdem, setBuscaOrdem] = useState('');
  const [filtroStatusOrdem, setFiltroStatusOrdem] = useState('Todos');
  const [filtroTipoOrdem, setFiltroTipoOrdem] = useState('Todos Tipos');
  const [editandoOrdemId, setEditandoOrdemId] = useState(null);
  const ordemVazia = { nome:'', serial:'', cto:'', porta:'', tipo:'Nova Ativação', dataAgendada:'', valor:'', relato:'', status:'Pendente' };
  const [ordem, setOrdem] = useState(ordemVazia);

  // ---- Estados: Bobinas ----
  const [bobinas, setBobinas] = useState([]);
  const bobinaVazia = { identificacao:'', tipo:'Drop 1FO', total:'', usado:'', marca:'' };
  const [bobina, setBobina] = useState(bobinaVazia);

  // ---- Estados: Consultas Serasa ----
  const [consultas, setConsultas] = useState([]);
  const [buscaConsulta, setBuscaConsulta] = useState('');
  const [filtroResultado, setFiltroResultado] = useState('Todos');
  const [filtroTipoDoc, setFiltroTipoDoc] = useState('Todos');
  const [editandoConsultaId, setEditandoConsultaId] = useState(null);
  const consultaVazia = {
    nome:'', documento:'', tipoDoc:'CPF', score:'', resultado:'Pendente Análise',
    restricoes:'', observacao:'', dataConsulta:new Date().toISOString().split('T')[0], telefone:'', convertido:false,
  };
  const [consulta, setConsulta] = useState(consultaVazia);

  // ---- Firebase ----
  useEffect(() => {
    const flags = { c:false, o:false, b:false, s:false, n:false };
    const done = (k) => { flags[k] = true; if (flags.c && flags.o && flags.b && flags.s && flags.n) setLoading(false); };
    const qClientes = query(collection(db, "clientes"), orderBy("nome", "asc"));
    const unsubClientes = onSnapshot(qClientes, (s) => { setClientes(s.docs.map(d => ({ id:d.id, ...d.data() }))); done('c'); });
    const qOrdens = query(collection(db, "suporte"), orderBy("dataAgendada", "asc"));
    const unsubOrdens = onSnapshot(qOrdens, (s) => { setOrdens(s.docs.map(d => ({ id:d.id, ...d.data() }))); done('o'); });
    const qBobinas = query(collection(db, "bobinas"), orderBy("identificacao", "asc"));
    const unsubBobinas = onSnapshot(qBobinas, (s) => { setBobinas(s.docs.map(d => ({ id:d.id, ...d.data() }))); done('b'); });
    const qConsultas = query(collection(db, "consultas"), orderBy("dataConsulta", "desc"));
    const unsubConsultas = onSnapshot(qConsultas, (s) => { setConsultas(s.docs.map(d => ({ id:d.id, ...d.data() }))); done('s'); });
    const qOnts = query(collection(db, "onts"), orderBy("serial", "asc"));
    const unsubOnts = onSnapshot(qOnts, (s) => { setOnts(s.docs.map(d => ({ id:d.id, ...d.data() }))); done('n'); }, () => done('n'));
    return () => { unsubClientes(); unsubOrdens(); unsubBobinas(); unsubConsultas(); unsubOnts(); };
  }, []);

  // ============================================================
  //  CLIENTES
  // ============================================================
  // helpers ONT <-> cliente (almoxarifado)
  const liberarOnt = async (ontId) => {
    if (!ontId) return;
    const o = onts.find(x => x.id === ontId);
    if (o && o.status === 'Em Uso')
      await updateDoc(doc(db, "onts", ontId), { status: 'Em Estoque', clienteId: null, clienteNome: null, dataVinculo: null });
  };
  const ocuparOnt = async (ontId, clienteId, clienteNome) => {
    if (!ontId) return;
    await updateDoc(doc(db, "onts", ontId), { status: 'Em Uso', clienteId, clienteNome, dataVinculo: new Date().toISOString() });
  };

  const salvarCliente = async () => {
    if (!cliente.nome) return notify('error', 'Nome do assinante é obrigatório.');
    if (!editandoClienteId) {
      if (clientes.find(c => c.nome?.toLowerCase() === cliente.nome.toLowerCase() && c.status === 'Ativo'))
        return notify('warning', `Cliente ${cliente.nome} já cadastrado.`);
      if (cliente.cto && cliente.porta && clientes.find(c => c.status === 'Ativo' && (c.cto||'').toLowerCase() === cliente.cto.toLowerCase() && String(c.porta) === String(cliente.porta)))
        return notify('warning', `Porta ${cliente.porta} da CTO ${cliente.cto} já está ocupada.`);
    }
    const ontSel = cliente.ontId || '';
    const serialSel = ontSel ? (onts.find(o => o.id === ontSel)?.serial || '') : '';
    const payload = { ...cliente, ontId: ontSel, serial: serialSel || cliente.serial || '' };
    try {
      if (editandoClienteId) {
        const prev = clientes.find(c => c.id === editandoClienteId);
        await updateDoc(doc(db, "clientes", editandoClienteId), payload);
        if ((prev?.ontId || '') !== ontSel) {
          await liberarOnt(prev?.ontId);
          if (ontSel) await ocuparOnt(ontSel, editandoClienteId, cliente.nome);
        } else if (ontSel) {
          await updateDoc(doc(db, "onts", ontSel), { clienteNome: cliente.nome });
        }
        setEditandoClienteId(null);
        notify('success', 'Cliente atualizado.');
      } else {
        const ref = await addDoc(collection(db, "clientes"), { ...payload, dataCadastro: new Date().toISOString() });
        if (ontSel) await ocuparOnt(ontSel, ref.id, cliente.nome);
        notify('success', 'Cliente cadastrado.');
      }
      setCliente(clienteVazio);
    } catch { notify('error', 'Erro ao salvar cliente.'); }
  };

  const alternarStatusCliente = async (id, status) => {
    const c = clientes.find(x => x.id === id);
    const novo = status === 'Ativo' ? 'Desativado' : 'Ativo';
    await updateDoc(doc(db, "clientes", id), { status: novo });
    if (novo === 'Desativado') {
      await liberarOnt(c?.ontId);
    } else if (c?.ontId) {
      const o = onts.find(x => x.id === c.ontId);
      if (o && o.status === 'Em Estoque') await ocuparOnt(c.ontId, id, c.nome);
      else if (o && o.status === 'Em Uso' && o.clienteId !== id) notify('warning', `ONT ${o.serial} já está com outro cliente.`);
    }
  };

  const devolverOntCliente = async (c) => {
    if (!c.ontId) return notify('info', 'Cliente sem ONT vinculada.');
    if (!(await confirmar(`Devolver a ONT ${c.serial || ''} ao estoque?`, { confirmLabel: 'Devolver' }))) return;
    await liberarOnt(c.ontId);
    await updateDoc(doc(db, "clientes", c.id), { ontId: '', serial: '' });
    notify('success', 'ONT devolvida ao estoque.');
  };

  const toggleSGP = async (id, atual) => {
    await updateDoc(doc(db, "clientes", id), { lancadoSGP: !atual });
  };

  const excluirCliente = async (id) => {
    if (await confirmar('Apagar este cliente?', { danger: true, confirmLabel: 'Apagar' })) {
      const c = clientes.find(x => x.id === id);
      await liberarOnt(c?.ontId);
      await deleteDoc(doc(db, "clientes", id));
      notify('success', 'Cliente removido.');
    }
  };

  // ============================================================
  //  ORDENS DE SERVIÇO
  // ============================================================
  const salvarOrdem = async () => {
    if (!ordem.nome || !ordem.tipo) return notify('error', 'Nome e Tipo são obrigatórios.');
    try {
      const payload = { ...ordem, valor: ordem.valor ? Number(ordem.valor) : 0 };
      if (editandoOrdemId) {
        await updateDoc(doc(db, "suporte", editandoOrdemId), payload);
        setEditandoOrdemId(null);
        notify('success', 'OS atualizada.');
      } else {
        await addDoc(collection(db, "suporte"), { ...payload, dataCriacao: new Date().toISOString() });
        notify('success', 'Ordem de serviço gerada.');
      }
      setOrdem(ordemVazia);
    } catch { notify('error', 'Erro ao salvar OS.'); }
  };

  const alterarStatusOrdem = async (id, status) => {
    const prox = { 'Pendente':'Concluído', 'Concluído':'Pago', 'Pago':'Pendente' };
    await updateDoc(doc(db, "suporte", id), { status: prox[status] });
  };

  const excluirOrdem = async (id) => {
    if (await confirmar('Apagar esta OS?', { danger: true, confirmLabel: 'Apagar' }))
      { await deleteDoc(doc(db, "suporte", id)); notify('success', 'OS removida.'); }
  };

  // ============================================================
  //  BOBINAS
  // ============================================================
  const salvarBobina = async () => {
    if (!bobina.identificacao || !bobina.total) return notify('error', 'Identificação e Total são obrigatórios.');
    try {
      await addDoc(collection(db, "bobinas"), { ...bobina, total: Number(bobina.total), usado: Number(bobina.usado || 0), dataEntrada: new Date().toISOString() });
      setBobina(bobinaVazia);
      notify('success', 'Bobina registrada.');
    } catch { notify('error', 'Erro ao salvar bobina.'); }
  };

  const registrarUso = async (id, usadoAtual, valorDesconto) => {
    if (!valorDesconto || isNaN(valorDesconto) || Number(valorDesconto) <= 0)
      return notify('error', 'Insira uma metragem válida.');
    await updateDoc(doc(db, "bobinas", id), { usado: Number(usadoAtual) + Number(valorDesconto) });
    notify('success', `${valorDesconto}m descontados.`);
  };

  const excluirBobina = async (id) => {
    if (await confirmar('Apagar esta bobina?', { danger: true, confirmLabel: 'Apagar' }))
      { await deleteDoc(doc(db, "bobinas", id)); notify('success', 'Bobina removida.'); }
  };

  // ============================================================
  //  CONSULTAS SERASA
  // ============================================================
  const salvarConsulta = async () => {
    if (!consulta.nome || !consulta.documento) return notify('error', 'Nome e Documento são obrigatórios.');
    try {
      const payload = { ...consulta, score: consulta.score ? Number(consulta.score) : null };
      if (editandoConsultaId) {
        await updateDoc(doc(db, "consultas", editandoConsultaId), payload);
        setEditandoConsultaId(null);
        notify('success', 'Consulta atualizada.');
      } else {
        await addDoc(collection(db, "consultas"), { ...payload, dataCriacao: new Date().toISOString() });
        notify('success', 'Consulta registrada.');
      }
      setConsulta(consultaVazia);
    } catch { notify('error', 'Erro ao salvar consulta.'); }
  };

  const excluirConsulta = async (id) => {
    if (await confirmar('Apagar esta consulta?', { danger: true, confirmLabel: 'Apagar' }))
      { await deleteDoc(doc(db, "consultas", id)); notify('success', 'Consulta removida.'); }
  };

  // C1 — converter consulta em cliente (automação)
  const converterEmCliente = async (c) => {
    if (c.convertido) {
      await updateDoc(doc(db, "consultas", c.id), { convertido: false });
      return notify('info', 'Conversão desmarcada.');
    }
    if (!(await confirmar(`Criar cadastro de cliente a partir de "${c.nome}"?`, { confirmLabel: 'Criar cliente' }))) return;
    try {
      await addDoc(collection(db, "clientes"), {
        ...clienteVazio,
        nome: c.nome,
        observacao: `Origem: Consulta Serasa (${c.tipoDoc} ${c.documento})${c.telefone ? ' • Tel ' + c.telefone : ''}`,
        status: 'Ativo',
        dataCadastro: new Date().toISOString(),
      });
      await updateDoc(doc(db, "consultas", c.id), { convertido: true });
      notify('success', `Cliente "${c.nome}" criado — complete os dados em Clientes.`);
    } catch { notify('error', 'Erro ao converter.'); }
  };

  // ============================================================
  //  ESTOQUE ONT (almoxarifado)
  // ============================================================
  const salvarOnt = async () => {
    if (!ont.serial.trim()) return notify('error', 'Serial da ONT é obrigatório.');
    if (onts.find(o => (o.serial||'').toLowerCase() === ont.serial.trim().toLowerCase()))
      return notify('warning', `Serial ${ont.serial} já existe no estoque.`);
    try {
      await addDoc(collection(db, "onts"), {
        serial: ont.serial.trim(), modelo: ont.modelo.trim(), marca: ont.marca.trim(),
        status: 'Em Estoque', clienteId: null, clienteNome: null,
        dataEntrada: new Date().toISOString(), dataVinculo: null,
      });
      setOnt(ontVazia);
      notify('success', 'ONT adicionada ao estoque.');
    } catch { notify('error', 'Erro ao salvar ONT.'); }
  };

  // adicionar várias ONTs de uma vez (1 serial por linha)
  const parseSeriais = (txt) => [...new Set((txt || '').split(/[\s,;]+/).map(s => s.trim()).filter(Boolean))];
  const salvarOntLote = async () => {
    const lista = parseSeriais(ont.serial);
    if (!lista.length) return notify('error', 'Cole ao menos 1 serial (um por linha).');
    const existentes = new Set(onts.map(o => (o.serial || '').toLowerCase()));
    const vistos = new Set();
    const novos = lista.filter(s => { const k = s.toLowerCase(); if (existentes.has(k) || vistos.has(k)) return false; vistos.add(k); return true; });
    const ignoradas = lista.length - novos.length;
    if (!novos.length) return notify('warning', 'Todos os seriais já existem no estoque.');
    if (!(await confirmar(`Adicionar ${novos.length} ONT(s) ao estoque${ignoradas ? ` (${ignoradas} duplicada(s) ignorada(s))` : ''}?`, { confirmLabel: 'Adicionar' }))) return;
    try {
      const agora = new Date().toISOString();
      const batch = writeBatch(db);
      novos.forEach(serial => {
        const ref = doc(collection(db, "onts"));
        batch.set(ref, { serial, modelo: ont.modelo.trim(), marca: ont.marca.trim(), status: 'Em Estoque', clienteId: null, clienteNome: null, dataEntrada: agora, dataVinculo: null });
      });
      await batch.commit();
      setOnt(ontVazia);
      notify('success', `${novos.length} ONT(s) adicionadas${ignoradas ? `, ${ignoradas} ignorada(s)` : ''}.`);
    } catch { notify('error', 'Erro ao salvar lote.'); }
  };

  const alternarDefeitoOnt = async (o) => {
    if (o.status === 'Em Uso') return notify('warning', 'ONT em uso — devolva antes de marcar defeito.');
    await updateDoc(doc(db, "onts", o.id), { status: o.status === 'Defeito' ? 'Em Estoque' : 'Defeito' });
  };

  // devolver ONT em uso direto do estoque (limpa também o cliente vinculado)
  const desvincularOnt = async (o) => {
    if (!(await confirmar(`Desvincular ONT ${o.serial} de ${o.clienteNome || 'cliente'} e devolver ao estoque?`, { confirmLabel: 'Desvincular' }))) return;
    if (o.clienteId) await updateDoc(doc(db, "clientes", o.clienteId), { ontId: '', serial: '' }).catch(() => {});
    await updateDoc(doc(db, "onts", o.id), { status: 'Em Estoque', clienteId: null, clienteNome: null, dataVinculo: null });
    notify('success', 'ONT devolvida ao estoque.');
  };

  const excluirOnt = async (o) => {
    if (o.status === 'Em Uso') return notify('warning', 'ONT em uso — devolva ao estoque antes de excluir.');
    if (await confirmar(`Excluir a ONT ${o.serial} do estoque?`, { danger: true, confirmLabel: 'Excluir' })) {
      await deleteDoc(doc(db, "onts", o.id));
      notify('success', 'ONT excluída.');
    }
  };

  // abrir modal de edição do equipamento (dados + situação/baixa)
  const abrirEdicaoOnt = (o) => setOntEdit({
    id: o.id, serial: o.serial || '', modelo: o.modelo || '', marca: o.marca || '',
    status: o.status, motivoBaixa: o.motivoBaixa || '', _orig: o,
  });
  // status que podem ser escolhidos na edição (Em Uso só é mantido, nunca atribuído manualmente)
  const statusEditaveis = (orig) => orig?.status === 'Em Uso'
    ? ['Em Uso', 'Em Estoque', 'Defeito', 'Baixado']
    : ['Em Estoque', 'Defeito', 'Baixado'];

  const salvarEdicaoOnt = async () => {
    const e = ontEdit, orig = e._orig;
    const serial = e.serial.trim();
    if (!serial) return notify('error', 'Serial do equipamento é obrigatório.');
    if (onts.find(o => o.id !== e.id && (o.serial || '').toLowerCase() === serial.toLowerCase()))
      return notify('warning', `Serial ${serial} já existe em outro equipamento.`);
    if (e.status === 'Baixado' && !e.motivoBaixa) return notify('error', 'Selecione o motivo da baixa.');
    try {
      const payload = { serial, modelo: (e.modelo || '').trim(), marca: (e.marca || '').trim(), status: e.status };
      const saiuDeUso = orig.status === 'Em Uso' && e.status !== 'Em Uso';

      if (e.status === 'Baixado') {
        payload.motivoBaixa = e.motivoBaixa;
        payload.dataBaixa = new Date().toISOString();
      } else {
        payload.motivoBaixa = null;
        payload.dataBaixa = null;
      }

      if (saiuDeUso) {
        // desvincula o cliente que estava com o equipamento
        if (orig.clienteId) await updateDoc(doc(db, "clientes", orig.clienteId), { ontId: '', serial: '' }).catch(() => {});
        if (e.status === 'Baixado') {
          payload.dataVinculo = null; // mantém clienteId/clienteNome como responsável pela perda
        } else {
          payload.clienteId = null; payload.clienteNome = null; payload.dataVinculo = null;
        }
      } else if (orig.status === 'Em Uso' && e.status === 'Em Uso' && orig.clienteId && serial !== orig.serial) {
        // segue em uso, mas o serial mudou → mantém o cadastro do cliente em sincronia
        await updateDoc(doc(db, "clientes", orig.clienteId), { serial }).catch(() => {});
      }

      await updateDoc(doc(db, "onts", e.id), payload);
      setOntEdit(null);
      notify('success', e.status === 'Baixado' ? `Baixa registrada (${e.motivoBaixa}).` : 'Equipamento atualizado.');
    } catch { notify('error', 'Erro ao atualizar equipamento.'); }
  };

  // Q4 — importar seriais dos clientes ativos como "Em Uso"
  const importarOntsLegado = async () => {
    const jaExiste = new Set(onts.map(o => (o.serial || '').toLowerCase()));
    const novos = clientes.filter(c => c.status === 'Ativo' && c.serial && !c.ontId && !jaExiste.has(c.serial.toLowerCase()));
    if (!novos.length) return notify('info', 'Nada a importar — seriais já no estoque ou clientes sem serial.');
    if (!(await confirmar(`Importar ${novos.length} serial(is) de clientes ativos para o estoque como "Em Uso"?`, { confirmLabel: 'Importar' }))) return;
    try {
      for (const c of novos) {
        const ref = await addDoc(collection(db, "onts"), {
          serial: c.serial, modelo: '', marca: '', status: 'Em Uso',
          clienteId: c.id, clienteNome: c.nome,
          dataEntrada: new Date().toISOString(), dataVinculo: new Date().toISOString(),
        });
        await updateDoc(doc(db, "clientes", c.id), { ontId: ref.id });
      }
      notify('success', `${novos.length} ONT(s) importadas para o estoque.`);
    } catch { notify('error', 'Erro na importação.'); }
  };

  // ============================================================
  //  EXPORTAÇÃO (C6) — PDF corrigido p/ jspdf-autotable v5
  // ============================================================
  const baixarCSV = (nome, cabecalho, linhas) => {
    const csv = cabecalho + '\n' + linhas.map(l => l.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${nome}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    notify('success', 'CSV exportado.');
  };

  const novoPDF = (jsPDF, titulo) => {
    const d = new jsPDF();
    d.setFontSize(16); d.setTextColor(99, 102, 241);
    d.text(`LUMIX FIBRA`, 14, 17);
    d.setFontSize(11); d.setTextColor(40, 40, 40);
    d.text(titulo, 14, 24);
    d.setFontSize(8); d.setTextColor(120, 120, 120);
    d.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    return d;
  };

  const exportarClientes = async (tipo) => {
    if (tipo === 'csv') {
      baixarCSV('Lumix_Clientes', 'Nome,Serial,Login,CTO,Porta,Status,SGP',
        clientes.map(c => [c.nome, c.serial, c.login, c.cto, c.porta, c.status, c.lancadoSGP ? 'Sim' : 'Não']));
    } else {
      const { jsPDF, autoTable } = await loadPDF();
      const d = novoPDF(jsPDF, 'Relatório de Clientes');
      autoTable(d, { startY: 35, head: [['Assinante','Serial (ONT)','Login','CTO/Porta','Status','SGP']],
        body: clientes.map(c => [c.nome, c.serial, c.login, `${c.cto||'—'}/P${c.porta||'—'}`, c.status, c.lancadoSGP ? 'Sim' : 'Não']),
        theme: 'grid', headStyles: { fillColor: [59,130,246], fontSize: 8 }, bodyStyles: { fontSize: 8 } });
      d.save('Clientes_Lumix.pdf'); notify('success', 'PDF exportado.');
    }
  };

  const exportarOrdens = async (tipo) => {
    if (tipo === 'csv') {
      baixarCSV('Lumix_OS', 'Cliente,Tipo,Serial,CTO,Porta,Data,Valor,Status',
        ordens.map(o => [o.nome, o.tipo, o.serial, o.cto, o.porta, fmtData(o.dataAgendada), o.valor || 0, o.status]));
    } else {
      const { jsPDF, autoTable } = await loadPDF();
      const d = novoPDF(jsPDF, 'Ordens de Serviço');
      autoTable(d, { startY: 35, head: [['Cliente','Tipo','CTO/Porta','Data','Valor','Status']],
        body: ordens.map(o => [o.nome, o.tipo, `${o.cto||'—'}/P${o.porta||'—'}`, fmtData(o.dataAgendada), fmtBRL(o.valor), o.status]),
        theme: 'grid', headStyles: { fillColor: [245,158,11], fontSize: 8 }, bodyStyles: { fontSize: 8 } });
      d.save('OS_Lumix.pdf'); notify('success', 'PDF exportado.');
    }
  };

  const exportarBobinas = async (tipo) => {
    if (tipo === 'csv') {
      baixarCSV('Lumix_Bobinas', 'Identificacao,Tipo,Total,Usado,Restante,Marca',
        bobinas.map(b => [b.identificacao, b.tipo, b.total, b.usado, b.total - b.usado, b.marca]));
    } else {
      const { jsPDF, autoTable } = await loadPDF();
      const d = novoPDF(jsPDF, 'Estoque de Bobinas');
      autoTable(d, { startY: 35, head: [['Identificação','Tipo','Total','Usado','Restante','Marca']],
        body: bobinas.map(b => [b.identificacao, b.tipo, `${b.total}m`, `${b.usado}m`, `${b.total - b.usado}m`, b.marca || '—']),
        theme: 'grid', headStyles: { fillColor: [16,185,129], fontSize: 8 }, bodyStyles: { fontSize: 8 } });
      d.save('Bobinas_Lumix.pdf'); notify('success', 'PDF exportado.');
    }
  };

  const exportarConsultas = async (tipo) => {
    if (tipo === 'csv') {
      baixarCSV('Lumix_Serasa', 'Nome,Tipo,Documento,Score,Resultado,Convertido,Data',
        consultasFiltradas.map(c => [c.nome, c.tipoDoc, c.documento, c.score ?? '', c.resultado, c.convertido ? 'Sim' : 'Não', fmtData(c.dataConsulta)]));
    } else {
      const { jsPDF, autoTable } = await loadPDF();
      const d = novoPDF(jsPDF, 'Relatório de Consultas Serasa');
      autoTable(d, { startY: 35, head: [['Nome','Tipo','Documento','Score','Resultado','Conv.','Data']],
        body: consultasFiltradas.map(c => [c.nome, c.tipoDoc, c.documento, c.score ?? '—', c.resultado, c.convertido ? 'Sim' : 'Não', fmtData(c.dataConsulta)]),
        theme: 'grid', headStyles: { fillColor: [168,85,247], fontSize: 8 }, bodyStyles: { fontSize: 8 } });
      d.save('Serasa_Lumix.pdf'); notify('success', 'PDF exportado.');
    }
  };

  // C7 — backup completo em JSON
  const exportarBackup = () => {
    const data = { geradoEm: new Date().toISOString(), clientes, ordens, bobinas, consultas };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Lumix_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    notify('success', 'Backup gerado.');
  };

  // ============================================================
  //  FILTROS + STATS + AUTOMAÇÕES
  // ============================================================
  const hoje0 = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // checklist de prontidão (comodato + rede + SGP)
  const temComodato = (c) => !!(c.ontId || c.serial);
  const temRede = (c) => !!(c.cto && c.porta);
  const prontoSGP = (c) => temComodato(c) && temRede(c);

  const clientesFiltrados = clientes.filter(c => {
    const s = buscaCliente.toLowerCase();
    const okSGP = filtroSGP === 'Todos'
      || (filtroSGP === 'Pronto' && prontoSGP(c))
      || (filtroSGP === 'Pendente' && c.status === 'Ativo' && (!prontoSGP(c) || !c.lancadoSGP));
    return (c.nome?.toLowerCase().includes(s) || c.serial?.toLowerCase().includes(s) || c.login?.toLowerCase().includes(s)) &&
           (filtroStatusCliente === 'Todos' || c.status === filtroStatusCliente) && okSGP;
  }).sort((a,b) => (a.nome||'').localeCompare(b.nome||'','pt-BR',{sensitivity:'base'}));

  const ontsFiltradas = onts.filter(o =>
    (o.serial||'').toLowerCase().includes(buscaOnt.toLowerCase()) &&
    (filtroStatusOnt === 'Todos' || o.status === filtroStatusOnt)
  );
  // ONTs ofertáveis no form do cliente: livres + a já vinculada (em edição)
  const ontsDisponiveis = onts.filter(o => o.status === 'Em Estoque' || o.id === cliente.ontId);

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

  // C8 — conflitos de serial / porta entre clientes ativos
  const { conflitoIds, totalConflitos } = useMemo(() => {
    const ativos = clientes.filter(c => c.status === 'Ativo');
    const serialMap = {}, portaMap = {};
    ativos.forEach(c => {
      if (c.serial) { const k = c.serial.toLowerCase(); (serialMap[k] = serialMap[k] || []).push(c); }
      if (c.cto && c.porta) { const k = `${c.cto}|${c.porta}`.toLowerCase(); (portaMap[k] = portaMap[k] || []).push(c); }
    });
    const grupos = [...Object.values(serialMap), ...Object.values(portaMap)].filter(a => a.length > 1);
    const ids = new Set(); grupos.forEach(g => g.forEach(c => ids.add(c.id)));
    return { conflitoIds: ids, totalConflitos: grupos.length };
  }, [clientes]);

  // C2 — estoque baixo / C3 — OS atrasadas
  const bobinasBaixas = bobinas.filter(b => b.total > 0 && (b.total - b.usado) / b.total <= 0.1);
  const ehAtrasada = (o) => o.status === 'Pendente' && o.dataAgendada && new Date(o.dataAgendada) < hoje0;
  const osAtrasadas = ordens.filter(ehAtrasada);

  // Estoque ONT + prontidão SGP
  const ontEmEstoque = onts.filter(o => o.status === 'Em Estoque').length;
  const ontEmUso = onts.filter(o => o.status === 'Em Uso').length;
  const ontDefeito = onts.filter(o => o.status === 'Defeito').length;
  const ontBaixado = onts.filter(o => o.status === 'Baixado').length;
  const ontBaixo = ontEmEstoque <= 3;
  const countOnt = { 'Todos': onts.length, 'Em Estoque': ontEmEstoque, 'Em Uso': ontEmUso, 'Defeito': ontDefeito, 'Baixado': ontBaixado };
  const ontPorMarca = Object.entries(
    onts.reduce((a, o) => { const k = (o.marca || '').trim() || 'Sem marca'; a[k] = (a[k] || 0) + 1; return a; }, {})
  ).map(([label, value]) => ({ label, value, color: CORES.estoque })).sort((a, b) => b.value - a.value).slice(0, 6);
  const ativos = clientes.filter(c => c.status === 'Ativo');
  const pendentesSGP = ativos.filter(c => !prontoSGP(c) || !c.lancadoSGP).length;

  // KPIs (C4)
  const clientesAtivos = clientes.filter(c => c.status === 'Ativo').length;
  const osPendentes = ordens.filter(o => o.status === 'Pendente').length;
  const osConcluidas = ordens.filter(o => o.status === 'Concluído').length;
  const osPagas = ordens.filter(o => o.status === 'Pago');
  const faturamento = osPagas.reduce((a, o) => a + (Number(o.valor) || 0), 0);
  const osPagasComValor = osPagas.filter(o => Number(o.valor) > 0).length;
  const ticketMedio = osPagasComValor ? faturamento / osPagasComValor : 0;

  const statsSerasa = {
    total: consultas.length,
    aprovados: consultas.filter(c => c.resultado === 'Aprovado').length,
    reprovados: consultas.filter(c => c.resultado === 'Reprovado').length,
    restricoes: consultas.filter(c => c.resultado === 'Com Restrições').length,
    pendentes: consultas.filter(c => c.resultado === 'Pendente Análise').length,
    convertidos: consultas.filter(c => c.convertido).length,
    taxaAprovacao: consultas.length ? Math.round((consultas.filter(c => c.resultado === 'Aprovado').length / consultas.length) * 100) : 0,
  };
  const taxaConversao = consultas.length ? Math.round((statsSerasa.convertidos / consultas.length) * 100) : 0;

  const countOrdens = { 'Todos':ordens.length, 'Pendente':osPendentes, 'Concluído':osConcluidas, 'Pago':osPagas.length };
  const countTipos = { 'Todos Tipos':ordens.length, 'Nova Ativação':ordens.filter(o=>o.tipo==='Nova Ativação').length, 'Reparo Técnico':ordens.filter(o=>o.tipo==='Reparo Técnico').length, 'Mudança de Endereço':ordens.filter(o=>o.tipo==='Mudança de Endereço').length, 'Recolha de Equipamento':ordens.filter(o=>o.tipo==='Recolha de Equipamento').length };

  // C5 — busca global
  const gs = buscaGlobal.trim().toLowerCase();
  const resultadosGlobais = gs.length >= 2 ? [
    ...clientes.filter(c => (c.nome||'').toLowerCase().includes(gs) || (c.serial||'').toLowerCase().includes(gs))
      .slice(0,4).map(c => ({ tipo:'Cliente', nome:c.nome, sub:c.serial || c.login || '—', tela:'clientes', busca:c.nome, color:CORES.clientes, Icon:Users })),
    ...ordens.filter(o => (o.nome||'').toLowerCase().includes(gs) || (o.serial||'').toLowerCase().includes(gs))
      .slice(0,4).map(o => ({ tipo:'OS', nome:o.nome, sub:o.tipo, tela:'suporte', busca:o.nome, color:CORES.suporte, Icon:Wrench })),
    ...consultas.filter(c => (c.nome||'').toLowerCase().includes(gs) || (c.documento||'').toLowerCase().includes(gs))
      .slice(0,4).map(c => ({ tipo:'Serasa', nome:c.nome, sub:c.documento, tela:'serasa', busca:c.nome, color:CORES.serasa, Icon:FileSearch })),
    ...onts.filter(o => (o.serial||'').toLowerCase().includes(gs))
      .slice(0,4).map(o => ({ tipo:'ONT', nome:o.serial, sub:`${o.status}${o.clienteNome ? ' · '+o.clienteNome : ''}`, tela:'estoque', busca:o.serial, color:CORES.estoque, Icon:HardDrive })),
  ] : [];

  const irPara = (tela, busca) => {
    setTelaAtual(tela); setBuscaGlobal(''); setNavOpen(false);
    if (tela === 'clientes' && busca !== undefined) setBuscaCliente(busca);
    if (tela === 'suporte' && busca !== undefined) setBuscaOrdem(busca);
    if (tela === 'serasa' && busca !== undefined) setBuscaConsulta(busca);
    if (tela === 'estoque' && busca !== undefined) setBuscaOnt(busca);
  };

  // ---- helpers de estilo ----
  const btnTab = (ativo, cor) => ({
    padding:'8px 13px', borderRadius:10, fontSize:10, fontWeight:700, textTransform:'uppercase',
    letterSpacing:'.06em', cursor:'pointer', border:'none', display:'flex', alignItems:'center', gap:6,
    transition:'all .2s', background: ativo ? cor : 'transparent', color: ativo ? '#fff' : 'var(--text-3)', fontFamily:'inherit',
  });

  const NAV = [
    { id:'dashboard', label:'Dashboard', Icon:LayoutDashboard, color:CORES.dashboard },
    { id:'clientes',  label:'Clientes',  Icon:Users,      color:CORES.clientes, count:clientesAtivos },
    { id:'suporte',   label:'Suporte / OS', Icon:Wrench,  color:CORES.suporte,  count:osPendentes },
    { id:'estoque',   label:'Estoque ONT', Icon:HardDrive, color:CORES.estoque, count:ontEmEstoque },
    { id:'bobinas',   label:'Bobinas',   Icon:Database,   color:CORES.bobinas,  count:bobinas.length },
    { id:'serasa',    label:'Serasa',    Icon:FileSearch, color:CORES.serasa,   count:consultas.length },
  ];

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <>
      <GlobalStyle />

      {/* TOASTS */}
      <div className="toast-wrap">
        {toasts.map(t => {
          const c = { success:'#22c55e', error:'#f43f5e', warning:'#f59e0b', info:'#6366f1' }[t.type] || '#6366f1';
          const Ic = { success:CheckCircle, error:XCircle, warning:AlertTriangle, info:Info }[t.type] || Info;
          return (
            <div key={t.id} className="toast" style={{ '--tc': c }}>
              <Ic size={17} color={c} style={{ flexShrink:0, marginTop:1 }}/>
              <span>{t.msg}</span>
            </div>
          );
        })}
      </div>

      {/* MODAL CONFIRM */}
      {confirmState && (
        <div className="modal-backdrop" onClick={() => fecharConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ background: confirmState.danger ? 'rgba(244,63,94,.13)' : 'rgba(99,102,241,.13)', borderRadius:12, padding:10, display:'flex' }}>
                <AlertTriangle size={22} color={confirmState.danger ? '#fb7185' : '#818cf8'}/>
              </div>
              <h3 className="display" style={{ fontSize:17, fontWeight:700, color:'#fff', margin:0 }}>Confirmar</h3>
            </div>
            <p style={{ fontSize:14, color:'var(--text-2)', margin:'0 0 22px', lineHeight:1.55 }}>{confirmState.msg}</p>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => fecharConfirm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => fecharConfirm(true)}
                style={ confirmState.danger ? { background:'linear-gradient(135deg,#e11d48,#f43f5e)', boxShadow:'0 10px 22px -10px rgba(244,63,94,.8)' } : undefined }>
                {confirmState.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR EQUIPAMENTO / BAIXA */}
      {ontEdit && (
        <div className="modal-backdrop" onClick={() => setOntEdit(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
              <div style={{ background:'rgba(34,211,238,.13)', borderRadius:12, padding:10, display:'flex' }}>
                <Edit size={20} color="#22d3ee"/>
              </div>
              <div>
                <h3 className="display" style={{ fontSize:17, fontWeight:700, color:'#fff', margin:0 }}>Editar equipamento</h3>
                <p style={{ fontSize:12, color:'var(--text-3)', margin:'2px 0 0' }}>Corrija os dados ou registre uma baixa</p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><p className="label">Serial (SN)</p><input className="input" style={{ fontFamily:'monospace' }} value={ontEdit.serial} onChange={e => setOntEdit({ ...ontEdit, serial:e.target.value })}/></div>
              <div>
                <p className="label">Modelo</p>
                <input className="input" list="ont-modelos" placeholder="ZTE F670L..." value={ontEdit.modelo} onChange={e => setOntEdit({ ...ontEdit, modelo:e.target.value })}/>
                <datalist id="ont-modelos">{ONT_MODELOS.map(m => <option key={m} value={m}/>)}</datalist>
              </div>
              <div><p className="label">Marca / fornecedor</p><input className="input" placeholder="ZTE, Huawei, Nokia..." value={ontEdit.marca} onChange={e => setOntEdit({ ...ontEdit, marca:e.target.value })}/></div>
              <div>
                <p className="label">Situação</p>
                <select className="input" value={ontEdit.status} onChange={e => setOntEdit({ ...ontEdit, status:e.target.value })}>
                  {statusEditaveis(ontEdit._orig).map(s => <option key={s} value={s}>{s === 'Baixado' ? 'Baixa (perda / roubo / não devolvido)' : s}</option>)}
                </select>
              </div>
              {ontEdit.status === 'Baixado' && (
                <div>
                  <p className="label">Motivo da baixa</p>
                  <select className="input" value={ontEdit.motivoBaixa || ''} onChange={e => setOntEdit({ ...ontEdit, motivoBaixa:e.target.value })}>
                    <option value="">Selecione o motivo...</option>
                    {MOTIVOS_BAIXA.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {ontEdit._orig?.clienteNome && (
                    <p style={{ fontSize:11, color:'var(--text-3)', margin:'8px 0 0', lineHeight:1.5 }}>
                      Responsável: <b style={{ color:'#fcd34d' }}>{ontEdit._orig.clienteNome}</b> — será desvinculado, mas fica registrado no histórico.
                    </p>
                  )}
                </div>
              )}
              {ontEdit._orig?.status === 'Em Uso' && ontEdit.status === 'Em Estoque' && (
                <p style={{ fontSize:11, color:'var(--text-3)', margin:0, lineHeight:1.5 }}>
                  O equipamento será <b style={{ color:'#67e8f9' }}>devolvido</b> e desvinculado de {ontEdit._orig.clienteNome || 'cliente'}.
                </p>
              )}
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:22 }}>
              <button className="btn btn-ghost" onClick={() => setOntEdit(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvarEdicaoOnt} style={{ background:'linear-gradient(135deg,#0891b2,#22d3ee)', boxShadow:'0 10px 22px -10px rgba(34,211,238,.6)' }}><Save size={15}/> Salvar</button>
            </div>
          </div>
        </div>
      )}

      <div className="app-shell">
        {/* ===== SIDEBAR ===== */}
        <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
          <div className="brand" onClick={() => irPara('dashboard')}>
            <div className="brand-mark"><Wifi size={22} color="#fff"/></div>
            <div>
              <div className="display" style={{ fontSize:18, fontWeight:700, color:'#fff', letterSpacing:'-.3px' }}>Lumix Fibra</div>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', letterSpacing:'.16em', textTransform:'uppercase' }}>ISP Manager</div>
            </div>
          </div>

          <div className="nav-section">Menu</div>
          {NAV.map(n => (
            <button key={n.id} className={`nav-item ${telaAtual === n.id ? 'active' : ''}`} style={{ '--accent': n.color }}
              onClick={() => irPara(n.id)}>
              <n.Icon size={18} color={telaAtual === n.id ? n.color : 'currentColor'}/>
              {n.label}
              {n.count > 0 && <span className="nav-badge">{n.count}</span>}
            </button>
          ))}

          <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:10 }}>
            <button className="btn btn-ghost btn-sm" onClick={exportarBackup} style={{ justifyContent:'flex-start' }}>
              <RefreshCw size={14}/> Backup geral
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 12px', borderRadius:12, background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.15)' }}>
              <span className="pulse-dot" style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e' }}/>
              <span style={{ fontSize:12, fontWeight:600, color:'#86efac' }}>Sistema Online</span>
            </div>
          </div>
        </aside>
        {navOpen && <div className="backdrop" onClick={() => setNavOpen(false)}/>}

        {/* ===== MAIN ===== */}
        <div className="main">
          {/* TOPBAR */}
          <div className="topbar">
            <button className="icon-btn hamburger" onClick={() => setNavOpen(true)}><Menu size={18}/></button>
            <div style={{ position:'relative', flex:1, maxWidth:440 }}>
              <Search size={16} color="var(--text-3)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
              <input className="input" style={{ paddingLeft:42 }} placeholder="Busca global — clientes, OS, consultas..."
                value={buscaGlobal} onChange={e => setBuscaGlobal(e.target.value)} />
              {resultadosGlobais.length > 0 && (
                <div className="search-pop">
                  {resultadosGlobais.map((r, i) => (
                    <button key={i} className="search-item" onClick={() => irPara(r.tela, r.busca)}>
                      <div style={{ background:`${r.color}1a`, borderRadius:9, padding:7, color:r.color, display:'flex' }}><r.Icon size={15}/></div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.nome}</div>
                        <div style={{ fontSize:11, color:'var(--text-3)' }}>{r.tipo} · {r.sub}</div>
                      </div>
                      <ArrowRight size={14} color="var(--text-3)"/>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="hide-sm" style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, color:'var(--text-3)', fontSize:12, fontWeight:600 }}>
              <Activity size={15} color="#22c55e"/> {clientes.length + ordens.length + consultas.length} registros
            </div>
          </div>

          <div className="content animate-page" key={telaAtual}>

            {/* ====================== DASHBOARD ====================== */}
            {telaAtual === 'dashboard' && (
              <div>
                <PageHeader Icon={LayoutDashboard} color={CORES.dashboard} title="Dashboard" sub="Visão geral da operação Lumix Fibra" />

                {/* Alertas automáticos */}
                {(osAtrasadas.length > 0 || bobinasBaixas.length > 0 || totalConflitos > 0 || (ontBaixo && onts.length > 0) || pendentesSGP > 0) && (
                  <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
                    {osAtrasadas.length > 0 && (
                      <div className="alert alert-danger">
                        <AlertTriangle size={18}/>
                        <span style={{ flex:1 }}><b>{osAtrasadas.length}</b> ordem(ns) de serviço atrasada(s).</span>
                        <button className="btn btn-sm" style={{ background:'rgba(244,63,94,.15)', color:'#fda4af' }} onClick={() => irPara('suporte')}>Ver OS</button>
                      </div>
                    )}
                    {bobinasBaixas.length > 0 && (
                      <div className="alert alert-warn">
                        <PackageX size={18}/>
                        <span style={{ flex:1 }}><b>{bobinasBaixas.length}</b> bobina(s) com estoque baixo (≤10%).</span>
                        <button className="btn btn-sm" style={{ background:'rgba(245,158,11,.15)', color:'#fcd34d' }} onClick={() => irPara('bobinas')}>Ver estoque</button>
                      </div>
                    )}
                    {totalConflitos > 0 && (
                      <div className="alert alert-danger">
                        <ShieldAlert size={18}/>
                        <span style={{ flex:1 }}><b>{totalConflitos}</b> conflito(s) de serial/porta entre clientes ativos.</span>
                        <button className="btn btn-sm" style={{ background:'rgba(244,63,94,.15)', color:'#fda4af' }} onClick={() => irPara('clientes')}>Revisar</button>
                      </div>
                    )}
                    {ontBaixo && onts.length > 0 && (
                      <div className="alert alert-warn">
                        <HardDrive size={18}/>
                        <span style={{ flex:1 }}>Estoque de ONT baixo — <b>{ontEmEstoque}</b> em estoque.</span>
                        <button className="btn btn-sm" style={{ background:'rgba(245,158,11,.15)', color:'#fcd34d' }} onClick={() => irPara('estoque')}>Ver estoque</button>
                      </div>
                    )}
                    {pendentesSGP > 0 && (
                      <div className="alert alert-warn">
                        <ClipboardCheck size={18}/>
                        <span style={{ flex:1 }}><b>{pendentesSGP}</b> cliente(s) ativo(s) pendente(s) de lançamento no SGP.</span>
                        <button className="btn btn-sm" style={{ background:'rgba(14,165,233,.15)', color:'#7dd3fc' }} onClick={() => { setFiltroSGP('Pendente'); irPara('clientes'); }}>Revisar</button>
                      </div>
                    )}
                  </div>
                )}

                {/* KPIs */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:14, marginBottom:22 }}>
                  {[
                    { label:'Clientes Ativos', val: clientesAtivos, sub:`${clientes.length} no total`, color:CORES.clientes, Icon:Users },
                    { label:'OS Pendentes', val: osPendentes, sub:`${osAtrasadas.length} atrasadas`, color:CORES.suporte, Icon:Clock },
                    { label:'Faturamento (Pago)', val: fmtBRL(faturamento), sub:`ticket ${fmtBRL(ticketMedio)}`, color:CORES.bobinas, Icon:DollarSign },
                    { label:'Conversão Serasa', val:`${taxaConversao}%`, sub:`${statsSerasa.convertidos} de ${statsSerasa.total}`, color:CORES.serasa, Icon:TrendingUp },
                    { label:'Estoque ONT', val: ontEmEstoque, sub:`${ontEmUso} em uso · ${onts.length} total`, color:CORES.estoque, Icon:HardDrive },
                    { label:'Pendentes SGP', val: pendentesSGP, sub:`de ${ativos.length} ativos`, color:'#0ea5e9', Icon:ClipboardCheck },
                  ].map(k => (
                    <div key={k.label} className="kpi">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                        <span style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em' }}>{k.label}</span>
                        <div style={{ background:`${k.color}1a`, borderRadius:9, padding:7, color:k.color, display:'flex' }}><k.Icon size={16}/></div>
                      </div>
                      {loading
                        ? <div className="skel" style={{ height:30, width:'70%' }}/>
                        : <div className="display" style={{ fontSize:27, fontWeight:700, color:'#fff', lineHeight:1 }}>{k.val}</div>}
                      <div style={{ fontSize:11.5, color:'var(--text-3)', marginTop:6 }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Gráficos */}
                <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
                  <div className="card">
                    <div className="panel-head"><Wrench size={16} color={CORES.suporte}/><span className="panel-title">Ordens por status</span></div>
                    <div style={{ padding:'26px 24px' }}>
                      {loading ? <SkeletonList rows={1} h={150}/> : ordens.length === 0
                        ? <EmptyState Icon={Wrench} label="Sem OS"/>
                        : <Bars data={[
                            { label:'Pendente', value:osPendentes, color:'#f59e0b' },
                            { label:'Concluído', value:osConcluidas, color:'#10b981' },
                            { label:'Pago', value:osPagas.length, color:'#3b82f6' },
                          ]}/>}
                    </div>
                  </div>
                  <div className="card">
                    <div className="panel-head"><FileSearch size={16} color={CORES.serasa}/><span className="panel-title">Resultados Serasa</span></div>
                    <div style={{ padding:'24px' }}>
                      {loading ? <SkeletonList rows={1} h={150}/> : consultas.length === 0
                        ? <EmptyState Icon={FileSearch} label="Sem consultas"/>
                        : <Donut centerLabel={`${statsSerasa.taxaAprovacao}%`} centerSub="aprovação" segments={[
                            { label:'Aprovados', value:statsSerasa.aprovados, color:'#10b981' },
                            { label:'Reprovados', value:statsSerasa.reprovados, color:'#f43f5e' },
                            { label:'Restrições', value:statsSerasa.restricoes, color:'#f59e0b' },
                            { label:'Pendentes', value:statsSerasa.pendentes, color:'#64748b' },
                          ]}/>}
                    </div>
                  </div>
                </div>

                {/* ONT por marca */}
                {onts.length > 0 && (
                  <div className="card" style={{ marginBottom:18 }}>
                    <div className="panel-head"><HardDrive size={16} color={CORES.estoque}/><span className="panel-title">ONT por marca</span><span style={{ marginLeft:'auto', fontSize:11, color:'var(--text-3)' }}>{onts.length} no total</span></div>
                    <div style={{ padding:'26px 24px' }}><Bars data={ontPorMarca}/></div>
                  </div>
                )}

                {/* Funil + atalhos */}
                <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
                  <div className="card">
                    <div className="panel-head"><TrendingUp size={16} color={CORES.dashboard}/><span className="panel-title">Funil de conversão</span></div>
                    <div style={{ padding:'24px' }}>
                      {loading ? <SkeletonList rows={1} h={120}/> :
                        <Funnel steps={[
                          { label:'Consultas realizadas', value:statsSerasa.total, color:'#a855f7' },
                          { label:'Aprovados', value:statsSerasa.aprovados, color:'#10b981' },
                          { label:'Convertidos em cliente', value:statsSerasa.convertidos, color:'#22d3ee' },
                        ]}/>}
                    </div>
                  </div>
                  <div className="card">
                    <div className="panel-head"><Layers size={16} color={CORES.dashboard}/><span className="panel-title">Acesso rápido</span></div>
                    <div style={{ padding:18, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      {NAV.filter(n => n.id !== 'dashboard').map(m => (
                        <button key={m.id} onClick={() => irPara(m.id)}
                          style={{ display:'flex', alignItems:'center', gap:12, padding:'16px', borderRadius:14, background:`${m.color}0d`, border:`1px solid ${m.color}26`, cursor:'pointer', textAlign:'left', transition:'all .2s' }}>
                          <div style={{ background:`${m.color}1f`, borderRadius:11, padding:9, color:m.color, display:'flex' }}><m.Icon size={20}/></div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13.5, fontWeight:700, color:'#fff' }}>{m.label}</div>
                            <div style={{ fontSize:11, color:'var(--text-3)' }}>{m.count || 0} registros</div>
                          </div>
                          <ChevronRight size={16} color={m.color}/>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ====================== CLIENTES ====================== */}
            {telaAtual === 'clientes' && (
              <div>
                <PageHeader Icon={Users} color={CORES.clientes} title="Clientes & CTO" sub="Cadastro de assinantes, seriais e portas">
                  <button className="btn btn-ghost btn-sm" onClick={() => exportarClientes('csv')}><Download size={14}/> CSV</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => exportarClientes('pdf')}><Printer size={14}/> PDF</button>
                </PageHeader>

                {/* Form */}
                <div className="glass" style={{ borderRadius:'var(--radius-lg)', padding:26, marginBottom:22, borderColor:'rgba(59,130,246,.16)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:22, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
                    {editandoClienteId ? <Edit size={17} color={CORES.suporte}/> : <Wifi size={17} color={CORES.clientes}/>}
                    <span className="panel-title">{editandoClienteId ? 'Editar cliente' : 'Novo cadastro de rede'}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
                    <div><p className="label">Assinante</p><input className="input" placeholder="Nome completo..." value={cliente.nome} onChange={e => setCliente({...cliente, nome:e.target.value})}/></div>
                    <div>
                      <p className="label">ONT / Comodato (estoque)</p>
                      <select className="input" style={{ fontFamily:'monospace' }} value={cliente.ontId || ''}
                        onChange={e => { const id = e.target.value; const o = onts.find(x => x.id === id); setCliente({ ...cliente, ontId:id, serial: o ? o.serial : '' }); }}>
                        <option value="">— Sem ONT —</option>
                        {ontsDisponiveis.map(o => <option key={o.id} value={o.id}>{o.serial}{o.modelo ? ` · ${o.modelo}` : ''}</option>)}
                      </select>
                    </div>
                    <div><p className="label">Login PPPoE</p><input className="input" placeholder="user@lumix..." value={cliente.login} onChange={e => setCliente({...cliente, login:e.target.value})}/></div>
                    <div>
                      <p className="label">CTO / Porta</p>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 64px', gap:8 }}>
                        <input className="input" placeholder="CTO..." value={cliente.cto} onChange={e => setCliente({...cliente, cto:e.target.value})}/>
                        <input className="input" style={{ textAlign:'center', fontWeight:800 }} placeholder="P" value={cliente.porta} onChange={e => setCliente({...cliente, porta:e.target.value})}/>
                      </div>
                    </div>
                    <div style={{ gridColumn:'1/-1' }}><p className="label">Observação técnica</p><textarea className="input" style={{ height:64, resize:'none' }} placeholder="Ex: Roteador próprio, sinal -18db..." value={cliente.observacao} onChange={e => setCliente({...cliente, observacao:e.target.value})}/></div>
                    <button onClick={salvarCliente} className="btn btn-primary" style={{ gridColumn:'1/-1', background:'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
                      <Save size={17}/> {editandoClienteId ? 'Atualizar cadastro' : 'Salvar cliente'}
                    </button>
                    {editandoClienteId && <button onClick={() => { setEditandoClienteId(null); setCliente(clienteVazio); }} style={{ gridColumn:'1/-1', background:'none', border:'none', color:'var(--text-3)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', cursor:'pointer' }}>Cancelar edição</button>}
                  </div>
                </div>

                {/* Lista */}
                <div className="glass" style={{ borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
                  <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
                    <div style={{ position:'relative', flex:1, minWidth:220 }}>
                      <Search size={16} color="var(--text-3)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
                      <input className="input" style={{ paddingLeft:42 }} placeholder="Buscar por nome, SN ou login..." value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)}/>
                    </div>
                    <div style={{ display:'flex', gap:4, padding:4, background:'rgba(6,10,18,.6)', borderRadius:12, border:'1px solid var(--border)' }}>
                      {['Todos','Ativo','Desativado'].map(s => (
                        <button key={s} onClick={() => setFiltroStatusCliente(s)} style={btnTab(filtroStatusCliente===s, s==='Desativado'?'#dc2626':CORES.clientes)}>
                          {s} <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background: filtroStatusCliente===s?'rgba(255,255,255,.25)':'rgba(255,255,255,.05)', color: filtroStatusCliente===s?'#fff':'var(--text-3)' }}>
                            {s==='Todos'?clientes.length:clientes.filter(c=>c.status===s).length}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:4, padding:4, background:'rgba(6,10,18,.6)', borderRadius:12, border:'1px solid var(--border)' }}>
                      {[['Todos','Todos'],['Pronto','Pronto p/ SGP'],['Pendente','Pendente SGP']].map(([v,lbl]) => (
                        <button key={v} onClick={() => setFiltroSGP(v)} style={btnTab(filtroSGP===v, '#0ea5e9')}>{lbl}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ overflowX:'auto' }}>
                    {loading ? <div style={{ padding:20 }}><SkeletonList/></div> : (
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr style={{ background:'rgba(6,10,18,.4)', borderBottom:'1px solid var(--border)' }}>
                          {['Assinante / Detalhes','CTO / Porta','Status / Ações'].map(h => (
                            <th key={h} style={{ padding:'13px 20px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {clientesFiltrados.map(c => (
                          <tr key={c.id} className="table-row" style={{ borderBottom:'1px solid rgba(255,255,255,.03)', opacity: c.status==='Desativado'?0.55:1 }}>
                            <td style={{ padding:'14px 20px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                                <span style={{ fontWeight:700, fontSize:14, color: c.status==='Desativado'?'var(--text-3)':'#fff', textDecoration: c.status==='Desativado'?'line-through':'none' }}>{c.nome}</span>
                                {conflitoIds.has(c.id) && <span className="badge" style={{ background:'rgba(244,63,94,.13)', color:'#fb7185', border:'1px solid rgba(244,63,94,.3)' }}><ShieldAlert size={11}/> Conflito</span>}
                              </div>
                              <div style={{ fontSize:10, fontFamily:'monospace', color:'var(--text-3)', letterSpacing:'.04em', textTransform:'uppercase' }}>{c.serial || 'sem ONT'} | {c.login || '—'}</div>
                              <div style={{ display:'flex', gap:5, marginTop:6, flexWrap:'wrap' }}>
                                {(() => { const ok = temComodato(c); return <span className="badge" title="Comodato (ONT) vinculado" style={{ background: ok?'rgba(34,211,238,.12)':'rgba(255,255,255,.04)', color: ok?'#67e8f9':'var(--text-3)', border:`1px solid ${ok?'rgba(34,211,238,.25)':'var(--border)'}` }}>{ok?<HardDrive size={10}/>:<CircleDashed size={10}/>} Comodato</span>; })()}
                                {(() => { const ok = temRede(c); return <span className="badge" title="CTO e porta preenchidos" style={{ background: ok?'rgba(59,130,246,.12)':'rgba(255,255,255,.04)', color: ok?'#60a5fa':'var(--text-3)', border:`1px solid ${ok?'rgba(59,130,246,.25)':'var(--border)'}` }}>{ok?<CheckCircle size={10}/>:<CircleDashed size={10}/>} CTO/Porta</span>; })()}
                                <button onClick={() => toggleSGP(c.id, c.lancadoSGP)} className="badge" title="Marcar como lançado no SGP" style={{ cursor:'pointer', background: c.lancadoSGP?'rgba(34,197,94,.13)':'rgba(255,255,255,.04)', color: c.lancadoSGP?'#4ade80':'var(--text-3)', border:`1px solid ${c.lancadoSGP?'rgba(34,197,94,.25)':'var(--border)'}` }}>{c.lancadoSGP?<ClipboardCheck size={10}/>:<CircleDashed size={10}/>} SGP</button>
                              </div>
                              {c.observacao && <div style={{ marginTop:4, fontSize:11, color:CORES.clientes, display:'flex', alignItems:'flex-start', gap:4 }}><Info size={11} style={{ flexShrink:0, marginTop:2 }}/>{c.observacao}</div>}
                            </td>
                            <td style={{ padding:'14px 20px' }}>
                              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(59,130,246,.1)', color:'#60a5fa', padding:'6px 12px', borderRadius:10, fontSize:11, fontWeight:700 }}>
                                <Wifi size={13}/> {c.cto || '—'} / P{c.porta || '—'}
                              </div>
                            </td>
                            <td style={{ padding:'14px 20px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
                                <button onClick={() => alternarStatusCliente(c.id, c.status)} className="badge" style={{ cursor:'pointer', border:`1px solid ${c.status==='Ativo'?'rgba(34,197,94,.25)':'rgba(244,63,94,.25)'}`, background: c.status==='Ativo'?'rgba(34,197,94,.12)':'rgba(244,63,94,.12)', color: c.status==='Ativo'?'#4ade80':'#fb7185' }}>
                                  {c.status==='Ativo'?<CheckCircle size={12}/>:<XCircle size={12}/>} {c.status}
                                </button>
                                {c.ontId && <button className="icon-btn" title="Devolver ONT ao estoque" onClick={() => devolverOntCliente(c)} style={{ color:CORES.estoque }}><Undo2 size={15}/></button>}
                                <button className="icon-btn" onClick={() => { setEditandoClienteId(c.id); setCliente({ ...clienteVazio, ...c }); window.scrollTo({top:0,behavior:'smooth'}); }}><Edit size={15}/></button>
                                <button className="icon-btn danger" onClick={() => excluirCliente(c.id)}><Trash2 size={15}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {clientesFiltrados.length === 0 && (
                          <tr><td colSpan={3} style={{ padding:'48px 0', textAlign:'center', color:'#334155', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>Nenhum cliente encontrado</td></tr>
                        )}
                      </tbody>
                    </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ====================== SUPORTE / OS ====================== */}
            {telaAtual === 'suporte' && (
              <div>
                <PageHeader Icon={Wrench} color={CORES.suporte} title="Ativação & Suporte" sub="Ordens de serviço, instalações e reparos">
                  <button className="btn btn-ghost btn-sm" onClick={() => exportarOrdens('csv')}><Download size={14}/> CSV</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => exportarOrdens('pdf')}><Printer size={14}/> PDF</button>
                </PageHeader>

                {/* Form OS */}
                <div className="glass" style={{ borderRadius:'var(--radius-lg)', padding:26, marginBottom:22, borderColor:'rgba(245,158,11,.14)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:22, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
                    <Wrench size={17} color={CORES.suporte}/><span className="panel-title">{editandoOrdemId ? 'Editar OS' : 'Nova ordem de serviço'}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
                    <div><p className="label">Nome do cliente</p><input className="input" placeholder="Nome completo..." value={ordem.nome} onChange={e => setOrdem({...ordem, nome:e.target.value})}/></div>
                    <div><p className="label">Serial (SN ONU)</p><input className="input" style={{ fontFamily:'monospace' }} placeholder="ZTEG..." value={ordem.serial} onChange={e => setOrdem({...ordem, serial:e.target.value})}/></div>
                    <div>
                      <p className="label">CTO / Porta</p>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 64px', gap:8 }}>
                        <input className="input" placeholder="CTO..." value={ordem.cto} onChange={e => setOrdem({...ordem, cto:e.target.value})}/>
                        <input className="input" style={{ textAlign:'center', fontWeight:800 }} placeholder="P" value={ordem.porta} onChange={e => setOrdem({...ordem, porta:e.target.value})}/>
                      </div>
                    </div>
                    <div><p className="label">Tipo de serviço</p><select className="input" value={ordem.tipo} onChange={e => setOrdem({...ordem, tipo:e.target.value})}><option>Nova Ativação</option><option>Reparo Técnico</option><option>Mudança de Endereço</option><option>Recolha de Equipamento</option></select></div>
                    <div><p className="label">Data agendada</p><input className="input" type="date" value={ordem.dataAgendada} onChange={e => setOrdem({...ordem, dataAgendada:e.target.value})}/></div>
                    <div><p className="label">Valor do serviço (R$)</p><input className="input" type="number" min="0" step="0.01" placeholder="0,00" value={ordem.valor} onChange={e => setOrdem({...ordem, valor:e.target.value})}/></div>
                    <div style={{ gridColumn:'1/-1' }}><p className="label">Relato / observações</p><textarea className="input" style={{ height:72, resize:'none' }} placeholder="Descreva o problema..." value={ordem.relato} onChange={e => setOrdem({...ordem, relato:e.target.value})}/></div>
                    <button onClick={salvarOrdem} className="btn btn-primary" style={{ gridColumn:'1/-1', background:'linear-gradient(135deg,#d97706,#f59e0b)', boxShadow:'0 10px 22px -10px rgba(245,158,11,.7)' }}>
                      <ClipboardList size={17}/> {editandoOrdemId ? 'Atualizar OS' : 'Gerar ordem de serviço'}
                    </button>
                    {editandoOrdemId && <button onClick={() => { setEditandoOrdemId(null); setOrdem(ordemVazia); }} style={{ gridColumn:'1/-1', background:'none', border:'none', color:'var(--text-3)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', cursor:'pointer' }}>Cancelar edição</button>}
                  </div>
                </div>

                {/* Lista OS */}
                <div className="glass" style={{ borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
                  <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ position:'relative', marginBottom:12 }}>
                      <Search size={16} color="var(--text-3)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
                      <input className="input" style={{ paddingLeft:42 }} placeholder="Buscar OS..." value={buscaOrdem} onChange={e => setBuscaOrdem(e.target.value)}/>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      <div style={{ display:'flex', gap:4, padding:4, background:'rgba(6,10,18,.6)', borderRadius:12, border:'1px solid var(--border)' }}>
                        {['Todos','Pendente','Concluído','Pago'].map(s => (
                          <button key={s} onClick={() => setFiltroStatusOrdem(s)} style={btnTab(filtroStatusOrdem===s,'#d97706')}>
                            {s} <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background: filtroStatusOrdem===s?'rgba(255,255,255,.25)':'rgba(255,255,255,.05)', color: filtroStatusOrdem===s?'#fff':'var(--text-3)' }}>{countOrdens[s]}</span>
                          </button>
                        ))}
                      </div>
                      <div className="hide-sm" style={{ display:'flex', gap:4, padding:4, background:'rgba(6,10,18,.6)', borderRadius:12, border:'1px solid var(--border)' }}>
                        {['Todos Tipos','Nova Ativação','Reparo Técnico','Mudança de Endereço','Recolha de Equipamento'].map(t => (
                          <button key={t} onClick={() => setFiltroTipoOrdem(t)} style={btnTab(filtroTipoOrdem===t,'#4f46e5')}>
                            {t==='Todos Tipos'?'Todos':t} <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background: filtroTipoOrdem===t?'rgba(255,255,255,.25)':'rgba(255,255,255,.05)', color: filtroTipoOrdem===t?'#fff':'var(--text-3)' }}>{countTipos[t]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="scroll" style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10, overflowY:'auto', maxHeight:600 }}>
                    {loading ? <SkeletonList/> : ordensFiltradas.map(o => {
                      const tipoCor = { 'Nova Ativação':'#3b82f6', 'Reparo Técnico':'#f43f5e', 'Mudança de Endereço':'#f59e0b', 'Recolha de Equipamento':'#a855f7' };
                      const cor = tipoCor[o.tipo] || '#64748b';
                      const atrasada = ehAtrasada(o);
                      return (
                        <div key={o.id} className="table-row" style={{ background:'rgba(6,10,18,.5)', borderRadius:16, padding:'16px 20px', border:`1px solid ${atrasada?'rgba(244,63,94,.3)':'rgba(255,255,255,.04)'}`, borderLeft:`3px solid ${atrasada?'#f43f5e':cor}`, display:'flex', justifyContent:'space-between', gap:16, alignItems:'flex-start' }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                              <span className="badge" style={{ background:`${cor}18`, color:cor, border:`1px solid ${cor}30` }}>{o.tipo}</span>
                              <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{o.nome}</span>
                              {atrasada && <span className="badge" style={{ background:'rgba(244,63,94,.13)', color:'#fb7185', border:'1px solid rgba(244,63,94,.3)' }}><AlertTriangle size={11}/> Atrasada</span>}
                              {Number(o.valor) > 0 && <span className="badge" style={{ background:'rgba(16,185,129,.12)', color:'#34d399', border:'1px solid rgba(16,185,129,.25)' }}>{fmtBRL(o.valor)}</span>}
                            </div>
                            <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:11, color:'var(--text-3)', marginBottom: o.relato?8:0 }}>
                              <span style={{ display:'flex', alignItems:'center', gap:4 }}><Wifi size={12} color={CORES.clientes}/> {o.cto?`${o.cto}/P${o.porta}`:'Sem CTO'}</span>
                              {o.serial && <span style={{ fontFamily:'monospace' }}>SN: {o.serial}</span>}
                              <span style={{ display:'flex', alignItems:'center', gap:4 }}><CalendarClock size={12}/> {o.dataAgendada ? fmtData(o.dataAgendada) : 'Data em aberto'}</span>
                            </div>
                            {o.relato && <div style={{ fontSize:11, background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text-2)', fontStyle:'italic', display:'flex', gap:6 }}><Info size={12} style={{ flexShrink:0, marginTop:1 }}/>{o.relato}</div>}
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end', minWidth:140 }}>
                            <button onClick={() => alterarStatusOrdem(o.id, o.status)} style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:`1px solid ${o.status==='Pendente'?'rgba(245,158,11,.25)':o.status==='Concluído'?'rgba(34,197,94,.25)':'rgba(59,130,246,.25)'}`, cursor:'pointer', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all .15s',
                              background: o.status==='Pendente'?'rgba(245,158,11,.12)':o.status==='Concluído'?'rgba(34,197,94,.12)':'rgba(59,130,246,.12)',
                              color: o.status==='Pendente'?'#fbbf24':o.status==='Concluído'?'#4ade80':'#60a5fa' }}>
                              {o.status==='Pendente'&&<Clock size={13}/>}{o.status==='Concluído'&&<CheckCircle2 size={13}/>}{o.status==='Pago'&&<DollarSign size={13}/>} {o.status}
                            </button>
                            <div style={{ display:'flex', gap:4 }}>
                              <button className="icon-btn" onClick={() => { setEditandoOrdemId(o.id); setOrdem({ ...ordemVazia, ...o }); window.scrollTo({top:0,behavior:'smooth'}); }}><Edit size={15}/></button>
                              <button className="icon-btn danger" onClick={() => excluirOrdem(o.id)}><Trash2 size={15}/></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {!loading && ordensFiltradas.length === 0 && <EmptyState Icon={Wrench} label="Nenhuma OS encontrada"/>}
                  </div>
                </div>
              </div>
            )}

            {/* ====================== BOBINAS ====================== */}
            {telaAtual === 'bobinas' && (
              <div>
                <PageHeader Icon={Database} color={CORES.bobinas} title="Bobinas de Fibra" sub="Controle de estoque e metragem em campo">
                  <button className="btn btn-ghost btn-sm" onClick={() => exportarBobinas('csv')}><Download size={14}/> CSV</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => exportarBobinas('pdf')}><Printer size={14}/> PDF</button>
                </PageHeader>

                <div className="grid-form" style={{ display:'grid', gridTemplateColumns:'330px 1fr', gap:22 }}>
                  {/* Form */}
                  <div className="glass" style={{ borderRadius:'var(--radius-lg)', padding:26, borderColor:'rgba(16,185,129,.16)', height:'fit-content' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:22, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
                      <Plus size={17} color={CORES.bobinas}/><span className="panel-title">Nova bobina</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      <div><p className="label">Identificação</p><input className="input" placeholder="Ex: Bobina 01 — Carro do João" value={bobina.identificacao} onChange={e => setBobina({...bobina, identificacao:e.target.value})}/></div>
                      <div><p className="label">Tipo de cabo</p><select className="input" value={bobina.tipo} onChange={e => setBobina({...bobina, tipo:e.target.value})}><option>Drop 1FO</option><option>AS-80 6FO</option><option>AS-80 12FO</option></select></div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <div><p className="label">Total (m)</p><input className="input" type="number" placeholder="1000" value={bobina.total} onChange={e => setBobina({...bobina, total:e.target.value})}/></div>
                        <div><p className="label">Já usado (m)</p><input className="input" type="number" placeholder="0" value={bobina.usado} onChange={e => setBobina({...bobina, usado:e.target.value})}/></div>
                      </div>
                      <div><p className="label">Marca / fornecedor</p><input className="input" placeholder="Furukawa, Prysmian..." value={bobina.marca} onChange={e => setBobina({...bobina, marca:e.target.value})}/></div>
                      <button onClick={salvarBobina} className="btn btn-primary" style={{ background:'linear-gradient(135deg,#059669,#10b981)', boxShadow:'0 10px 22px -10px rgba(16,185,129,.7)' }}>
                        <Save size={17}/> Registrar bobina
                      </button>
                    </div>
                  </div>

                  {/* Lista */}
                  <div className="glass" style={{ borderRadius:'var(--radius-lg)', padding:24 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:18, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
                      <Boxes size={17} color={CORES.bobinas}/><span className="panel-title">Estoque em campo</span>
                    </div>
                    <div className="scroll" style={{ display:'flex', flexDirection:'column', gap:12, maxHeight:620, overflowY:'auto' }}>
                      {loading ? <SkeletonList h={120}/> : bobinas.map(b => {
                        const restante = b.total - b.usado;
                        const perc = Math.min((b.usado / b.total) * 100, 100);
                        const baixa = restante / b.total <= 0.1;
                        const barColor = perc > 90 ? '#f43f5e' : perc > 75 ? '#f59e0b' : '#10b981';
                        return (
                          <div key={b.id} style={{ background:'rgba(6,10,18,.5)', borderRadius:16, padding:'18px 20px', border:`1px solid ${baixa?'rgba(244,63,94,.3)':'rgba(255,255,255,.04)'}`, borderLeft:`3px solid ${baixa?'#f43f5e':'#10b981'}` }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                              <div>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                                  <span style={{ fontSize:14, fontWeight:700, color:'#fff', textTransform:'uppercase' }}>{b.identificacao}</span>
                                  <span className="badge" style={{ background:'rgba(16,185,129,.12)', color:'#34d399', border:'1px solid rgba(16,185,129,.2)' }}>{b.tipo}</span>
                                  {baixa && <span className="badge" style={{ background:'rgba(244,63,94,.13)', color:'#fb7185', border:'1px solid rgba(244,63,94,.3)' }}><PackageX size={11}/> Baixo</span>}
                                </div>
                                <p style={{ fontSize:10, color:'var(--text-3)', margin:0, fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'.05em' }}>Marca: {b.marca || 'N/A'}</p>
                              </div>
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
                                <span className="display" style={{ fontSize:22, fontWeight:700, color: baixa?'#fb7185':'#10b981', lineHeight:1 }}>{restante}<small style={{ fontSize:11, fontWeight:500, color:'var(--text-3)' }}>m</small></span>
                                <span style={{ fontSize:9, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em' }}>restantes</span>
                              </div>
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                              <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>Usado: {b.usado}m ({perc.toFixed(1)}%)</span>
                              <button className="icon-btn danger" style={{ width:26, height:26 }} onClick={() => excluirBobina(b.id)}><Trash2 size={13}/></button>
                            </div>
                            <div className="progress-bar" style={{ marginBottom:12 }}>
                              <div style={{ height:'100%', width:`${perc}%`, background:barColor, borderRadius:5, transition:'width .6s ease' }}/>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.02)', padding:'10px 12px', borderRadius:10, border:'1px solid var(--border)' }}>
                              <span style={{ fontSize:10, color:'var(--text-2)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', flexShrink:0 }}>Descontar (m):</span>
                              <input id={`desc-${b.id}`} type="number" placeholder="120" style={{ flex:1, padding:'6px 10px', borderRadius:8, fontSize:13, textAlign:'center', fontWeight:700, background:'rgba(6,10,18,.8)', color:'#fff', border:'1px solid var(--border)', outline:'none' }}/>
                              <button onClick={() => { const el = document.getElementById(`desc-${b.id}`); if (el?.value) { registrarUso(b.id, b.usado, el.value); el.value=''; } }}
                                className="btn btn-primary btn-sm" style={{ background:'#059669', boxShadow:'none' }}>OK</button>
                            </div>
                          </div>
                        );
                      })}
                      {!loading && bobinas.length === 0 && <EmptyState Icon={Database} label="Nenhuma bobina cadastrada"/>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ====================== ESTOQUE ONT ====================== */}
            {telaAtual === 'estoque' && (
              <div>
                <PageHeader Icon={HardDrive} color={CORES.estoque} title="Estoque de ONT" sub="Almoxarifado de equipamentos (comodato)">
                  <button className="btn btn-ghost btn-sm" onClick={() => baixarCSV('Lumix_Estoque_ONT', 'Serial,Modelo,Marca,Status,Cliente,Motivo', onts.map(o => [o.serial, o.modelo, o.marca, o.status, o.clienteNome || '', o.motivoBaixa || '']))}><Download size={14}/> CSV</button>
                  <button className="btn btn-primary btn-sm" onClick={importarOntsLegado} style={{ background:'linear-gradient(135deg,#0891b2,#22d3ee)', boxShadow:'none' }}><PackagePlus size={14}/> Importar legado</button>
                </PageHeader>

                {/* Stats */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:22 }}>
                  {[
                    { label:'Em Estoque', val:ontEmEstoque, color:'#22d3ee', Icon:PackageCheck },
                    { label:'Em Uso', val:ontEmUso, color:'#60a5fa', Icon:Link2 },
                    { label:'Defeito', val:ontDefeito, color:'#fb7185', Icon:PackageX },
                    { label:'Baixado', val:ontBaixado, color:'#f59e0b', Icon:AlertTriangle },
                    { label:'Total', val:onts.length, color:'#a855f7', Icon:HardDrive },
                  ].map(s => (
                    <div key={s.label} className="kpi" style={{ textAlign:'center', padding:'16px 12px' }}>
                      <s.Icon size={18} color={s.color} style={{ marginBottom:8 }}/>
                      <p style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 4px' }}>{s.label}</p>
                      <p className="display" style={{ fontSize:22, fontWeight:700, color:s.color, margin:0 }}>{s.val}</p>
                    </div>
                  ))}
                </div>

                <div className="grid-form" style={{ display:'grid', gridTemplateColumns:'330px 1fr', gap:22 }}>
                  {/* Form */}
                  <div className="glass" style={{ borderRadius:'var(--radius-lg)', padding:26, borderColor:'rgba(34,211,238,.16)', height:'fit-content' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:22, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
                      <PackagePlus size={17} color={CORES.estoque}/><span className="panel-title">Adicionar ONT</span>
                      <div style={{ marginLeft:'auto', display:'flex', gap:3, padding:3, background:'rgba(6,10,18,.6)', borderRadius:10, border:'1px solid var(--border)' }}>
                        <button onClick={() => { setModoLote(false); setOnt(ontVazia); }} style={btnTab(!modoLote, '#0891b2')}>Individual</button>
                        <button onClick={() => { setModoLote(true); setOnt(ontVazia); }} style={btnTab(modoLote, '#0891b2')}>Em lote</button>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      {modoLote ? (
                        <div>
                          <p className="label">Seriais — um por linha {parseSeriais(ont.serial).length > 0 && <span style={{ color:'#67e8f9' }}>({parseSeriais(ont.serial).length} detectado(s))</span>}</p>
                          <textarea className="input scroll" style={{ fontFamily:'monospace', height:150, resize:'vertical', lineHeight:1.6 }} placeholder={"ZTEGC1234567\nZTEGC1234568\nZTEGC1234569\n..."} value={ont.serial} onChange={e => setOnt({...ont, serial:e.target.value})}/>
                        </div>
                      ) : (
                        <div><p className="label">Serial (SN)</p><input className="input" style={{ fontFamily:'monospace' }} placeholder="ZTEGC..." value={ont.serial} onChange={e => setOnt({...ont, serial:e.target.value})}/></div>
                      )}
                      <div>
                        <p className="label">Modelo {modoLote && <span style={{ color:'var(--text-3)' }}>(aplica a todos)</span>}</p>
                        <input className="input" list="ont-modelos" placeholder="ZTE F670L..." value={ont.modelo} onChange={e => setOnt({...ont, modelo:e.target.value})}/>
                        <datalist id="ont-modelos">{ONT_MODELOS.map(m => <option key={m} value={m}/>)}</datalist>
                      </div>
                      <div><p className="label">Marca / fornecedor {modoLote && <span style={{ color:'var(--text-3)' }}>(aplica a todos)</span>}</p><input className="input" placeholder="ZTE, Huawei, Nokia..." value={ont.marca} onChange={e => setOnt({...ont, marca:e.target.value})}/></div>
                      <button onClick={modoLote ? salvarOntLote : salvarOnt} className="btn btn-primary" style={{ background:'linear-gradient(135deg,#0891b2,#22d3ee)', boxShadow:'0 10px 22px -10px rgba(34,211,238,.6)' }}>
                        {modoLote ? <><Boxes size={17}/> Adicionar {parseSeriais(ont.serial).length || ''} ao estoque</> : <><Save size={17}/> Adicionar ao estoque</>}
                      </button>
                      <p style={{ fontSize:11, color:'var(--text-3)', textAlign:'center', lineHeight:1.5 }}>
                        {modoLote
                          ? 'Cole a lista de seriais (Excel/nota fiscal). Duplicados são ignorados automaticamente.'
                          : <>Entra como <b style={{ color:'#67e8f9' }}>Em Estoque</b>. Some do estoque ao vincular num cliente; volta ao desativar/devolver.</>}
                      </p>
                    </div>
                  </div>

                  {/* Lista */}
                  <div className="glass" style={{ borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
                    <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ position:'relative', marginBottom:12 }}>
                        <Search size={16} color="var(--text-3)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
                        <input className="input" style={{ paddingLeft:42 }} placeholder="Buscar serial..." value={buscaOnt} onChange={e => setBuscaOnt(e.target.value)}/>
                      </div>
                      <div style={{ display:'flex', gap:4, padding:4, background:'rgba(6,10,18,.6)', borderRadius:12, border:'1px solid var(--border)', flexWrap:'wrap', width:'fit-content' }}>
                        {['Todos','Em Estoque','Em Uso','Defeito','Baixado'].map(s => (
                          <button key={s} onClick={() => setFiltroStatusOnt(s)} style={btnTab(filtroStatusOnt===s, '#0891b2')}>
                            {s} <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background: filtroStatusOnt===s?'rgba(255,255,255,.25)':'rgba(255,255,255,.05)', color: filtroStatusOnt===s?'#fff':'var(--text-3)' }}>{countOnt[s]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="scroll" style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10, overflowY:'auto', maxHeight:620 }}>
                      {loading ? <SkeletonList/> : ontsFiltradas.map(o => {
                        const cfg = {
                          'Em Estoque': { c:'#22d3ee', bg:'rgba(34,211,238,.12)', bd:'rgba(34,211,238,.25)', Ic:PackageCheck },
                          'Em Uso':     { c:'#60a5fa', bg:'rgba(59,130,246,.12)', bd:'rgba(59,130,246,.25)', Ic:Link2 },
                          'Defeito':    { c:'#fb7185', bg:'rgba(244,63,94,.12)',  bd:'rgba(244,63,94,.25)',  Ic:PackageX },
                          'Baixado':    { c:'#f59e0b', bg:'rgba(245,158,11,.12)', bd:'rgba(245,158,11,.25)', Ic:AlertTriangle },
                        }[o.status] || { c:'#64748b', bg:'rgba(255,255,255,.05)', bd:'var(--border)', Ic:HardDrive };
                        return (
                          <div key={o.id} className="table-row" style={{ background:'rgba(6,10,18,.5)', borderRadius:16, padding:'16px 20px', border:'1px solid rgba(255,255,255,.04)', borderLeft:`3px solid ${cfg.c}`, display:'flex', justifyContent:'space-between', gap:16, alignItems:'center', flexWrap:'wrap' }}>
                            <div style={{ flex:1, minWidth:200 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                                <span style={{ fontSize:14, fontWeight:700, color:'#fff', fontFamily:'monospace', letterSpacing:'.03em' }}>{o.serial}</span>
                                <span className="badge" style={{ background:cfg.bg, color:cfg.c, border:`1px solid ${cfg.bd}` }}><cfg.Ic size={11}/> {o.status}</span>
                              </div>
                              <div style={{ fontSize:11, color:'var(--text-3)', display:'flex', gap:12, flexWrap:'wrap' }}>
                                <span>{o.modelo || 'modelo n/d'}{o.marca ? ` · ${o.marca}` : ''}</span>
                                {o.status === 'Em Uso' && o.clienteNome && <span style={{ display:'flex', alignItems:'center', gap:4, color:'#60a5fa' }}><Link2 size={11}/> {o.clienteNome}</span>}
                                {o.status === 'Baixado' && <span style={{ display:'flex', alignItems:'center', gap:4, color:'#fbbf24' }}><AlertTriangle size={11}/> {o.motivoBaixa || 'Baixado'}{o.clienteNome ? ` · ${o.clienteNome}` : ''}</span>}
                              </div>
                            </div>
                            <div style={{ display:'flex', gap:4 }}>
                              <button className="icon-btn" title="Editar / registrar baixa" onClick={() => abrirEdicaoOnt(o)}><Edit size={15}/></button>
                              {o.status === 'Em Uso' && (
                                <button className="btn btn-ghost btn-sm" onClick={() => desvincularOnt(o)} style={{ color:CORES.estoque }}><Undo2 size={13}/> Devolver</button>
                              )}
                              {(o.status === 'Em Estoque' || o.status === 'Defeito') && (
                                <button className="icon-btn" title={o.status === 'Defeito' ? 'Voltar ao estoque' : 'Marcar defeito'} onClick={() => alternarDefeitoOnt(o)} style={{ color: o.status === 'Defeito' ? '#22d3ee' : '#fb7185' }}>{o.status === 'Defeito' ? <Undo2 size={15}/> : <PackageX size={15}/>}</button>
                              )}
                              {o.status !== 'Em Uso' && (
                                <button className="icon-btn danger" onClick={() => excluirOnt(o)}><Trash2 size={15}/></button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {!loading && ontsFiltradas.length === 0 && <EmptyState Icon={HardDrive} label="Nenhuma ONT no estoque"/>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ====================== SERASA ====================== */}
            {telaAtual === 'serasa' && (
              <div>
                <PageHeader Icon={FileSearch} color={CORES.serasa} title="Consulta Serasa" sub="Histórico de análise de crédito CPF/CNPJ">
                  <button className="btn btn-ghost btn-sm" onClick={() => exportarConsultas('csv')}><Download size={14}/> CSV</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => exportarConsultas('pdf')}><Printer size={14}/> PDF</button>
                </PageHeader>

                {/* Stats */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:12, marginBottom:22 }}>
                  {[
                    { label:'Total', val:statsSerasa.total, color:'#a855f7', Icon:FileSearch },
                    { label:'Aprovados', val:statsSerasa.aprovados, color:'#4ade80', Icon:ShieldCheck },
                    { label:'Reprovados', val:statsSerasa.reprovados, color:'#fb7185', Icon:ShieldX },
                    { label:'Restrições', val:statsSerasa.restricoes, color:'#fbbf24', Icon:ShieldAlert },
                    { label:'Convertidos', val:statsSerasa.convertidos, color:'#38bdf8', Icon:BadgeCheck },
                    { label:'Aprovação', val:`${statsSerasa.taxaAprovacao}%`, color:'#a855f7', Icon:TrendingUp },
                  ].map(s => (
                    <div key={s.label} className="kpi" style={{ textAlign:'center', padding:'16px 12px' }}>
                      <s.Icon size={18} color={s.color} style={{ marginBottom:8 }}/>
                      <p style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 4px' }}>{s.label}</p>
                      <p className="display" style={{ fontSize:21, fontWeight:700, color:s.color, margin:0 }}>{s.val}</p>
                    </div>
                  ))}
                </div>

                <div className="grid-form" style={{ display:'grid', gridTemplateColumns:'350px 1fr', gap:22 }}>
                  {/* Form */}
                  <div className="glass" style={{ borderRadius:'var(--radius-lg)', padding:26, borderColor:'rgba(168,85,247,.16)', height:'fit-content' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:22, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
                      <FileSearch size={17} color={CORES.serasa}/><span className="panel-title">{editandoConsultaId ? 'Editar consulta' : 'Nova consulta'}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      <div><p className="label">Nome completo</p><input className="input" placeholder="Nome do solicitante..." value={consulta.nome} onChange={e => setConsulta({...consulta, nome:e.target.value})}/></div>
                      <div>
                        <p className="label">Documento</p>
                        <div style={{ display:'grid', gridTemplateColumns:'100px 1fr', gap:8 }}>
                          <select className="input" value={consulta.tipoDoc} onChange={e => setConsulta({...consulta, tipoDoc:e.target.value, documento:''})}><option>CPF</option><option>CNPJ</option></select>
                          <input className="input" placeholder={consulta.tipoDoc==='CPF'?'000.000.000-00':'00.000.000/0000-00'} value={consulta.documento} onChange={e => setConsulta({...consulta, documento:formatarDocumento(e.target.value, consulta.tipoDoc)})}/>
                        </div>
                      </div>
                      <div><p className="label">Telefone / WhatsApp</p><input className="input" type="tel" placeholder="(00) 00000-0000" value={consulta.telefone} onChange={e => setConsulta({...consulta, telefone:e.target.value})}/></div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        <div><p className="label">Score (0–1000)</p><input className="input" type="number" min="0" max="1000" placeholder="Ex: 750" value={consulta.score} onChange={e => setConsulta({...consulta, score:e.target.value})}/></div>
                        <div><p className="label">Resultado</p><select className="input" value={consulta.resultado} onChange={e => setConsulta({...consulta, resultado:e.target.value})}><option>Aprovado</option><option>Reprovado</option><option>Com Restrições</option><option>Pendente Análise</option></select></div>
                      </div>
                      <div><p className="label">Data da consulta</p><input className="input" type="date" value={consulta.dataConsulta} onChange={e => setConsulta({...consulta, dataConsulta:e.target.value})}/></div>
                      <div><p className="label">Restrições encontradas</p><textarea className="input" style={{ height:60, resize:'none' }} placeholder="Dívidas, pendências, protestos..." value={consulta.restricoes} onChange={e => setConsulta({...consulta, restricoes:e.target.value})}/></div>
                      <div><p className="label">Observação interna</p><textarea className="input" style={{ height:54, resize:'none' }} placeholder="Notas internas, decisão final..." value={consulta.observacao} onChange={e => setConsulta({...consulta, observacao:e.target.value})}/></div>
                      <button onClick={salvarConsulta} className="btn btn-primary" style={{ background:'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow:'0 10px 22px -10px rgba(168,85,247,.7)' }}>
                        <Save size={17}/> {editandoConsultaId ? 'Atualizar consulta' : 'Registrar consulta'}
                      </button>
                      {editandoConsultaId && <button onClick={() => { setEditandoConsultaId(null); setConsulta(consultaVazia); }} style={{ background:'none', border:'none', color:'var(--text-3)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', cursor:'pointer' }}>Cancelar edição</button>}
                    </div>
                  </div>

                  {/* Lista */}
                  <div className="glass" style={{ borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
                    <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ position:'relative', marginBottom:12 }}>
                        <Search size={16} color="var(--text-3)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
                        <input className="input" style={{ paddingLeft:42 }} placeholder="Buscar por nome ou documento..." value={buscaConsulta} onChange={e => setBuscaConsulta(e.target.value)}/>
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        <div style={{ display:'flex', gap:4, padding:4, background:'rgba(6,10,18,.6)', borderRadius:12, border:'1px solid var(--border)', flexWrap:'wrap' }}>
                          {['Todos','Aprovado','Reprovado','Com Restrições','Pendente Análise'].map(r => (
                            <button key={r} onClick={() => setFiltroResultado(r)} style={btnTab(filtroResultado===r,'#7c3aed')}>
                              {r} <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background: filtroResultado===r?'rgba(255,255,255,.25)':'rgba(255,255,255,.05)', color: filtroResultado===r?'#fff':'var(--text-3)' }}>{r==='Todos'?consultas.length:consultas.filter(c=>c.resultado===r).length}</span>
                            </button>
                          ))}
                        </div>
                        <div style={{ display:'flex', gap:4, padding:4, background:'rgba(6,10,18,.6)', borderRadius:12, border:'1px solid var(--border)' }}>
                          {['Todos','CPF','CNPJ'].map(t => (
                            <button key={t} onClick={() => setFiltroTipoDoc(t)} style={btnTab(filtroTipoDoc===t,'#4f46e5')}>{t}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="scroll" style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10, overflowY:'auto', maxHeight:620 }}>
                      {loading ? <SkeletonList/> : consultasFiltradas.map(c => (
                        <div key={c.id} className="table-row" style={{ background:'rgba(6,10,18,.5)', borderRadius:16, padding:'16px 20px', border:'1px solid rgba(255,255,255,.04)', borderLeft:`3px solid ${c.resultado==='Aprovado'?'#22c55e':c.resultado==='Reprovado'?'#f43f5e':c.resultado==='Com Restrições'?'#f59e0b':'#64748b'}` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                            <div style={{ display:'flex', gap:14, alignItems:'flex-start', flex:1 }}>
                              {c.score ? <ScoreRing score={Number(c.score)} size={56}/> : (
                                <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,.04)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Hash size={18} color="var(--text-3)"/></div>
                              )}
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                                  <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{c.nome}</span>
                                  {c.convertido && <span className="badge" style={{ background:'rgba(56,189,248,.15)', color:'#38bdf8', border:'1px solid rgba(56,189,248,.2)' }}><BadgeCheck size={11}/> Convertido</span>}
                                </div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', marginBottom:8 }}>
                                  <ResultadoBadge resultado={c.resultado}/>
                                  <span style={{ fontSize:11, color:'var(--text-3)', fontFamily:'monospace' }}>{c.tipoDoc}: {c.documento}</span>
                                  {c.telefone && <span style={{ fontSize:11, color:'var(--text-3)', display:'flex', alignItems:'center', gap:4 }}><Phone size={11}/> {c.telefone}</span>}
                                  <span style={{ fontSize:11, color:'var(--text-3)', display:'flex', alignItems:'center', gap:4 }}><Calendar size={12}/> {fmtData(c.dataConsulta)}</span>
                                </div>
                                {c.restricoes && <div style={{ fontSize:11, background:'rgba(244,63,94,.06)', border:'1px solid rgba(244,63,94,.12)', borderRadius:8, padding:'6px 10px', color:'#fca5a5', display:'flex', alignItems:'flex-start', gap:6 }}><AlertCircle size={12} style={{ marginTop:1, flexShrink:0 }}/> {c.restricoes}</div>}
                                {c.observacao && !c.restricoes && <div style={{ fontSize:11, color:'var(--text-2)', fontStyle:'italic', display:'flex', alignItems:'flex-start', gap:5 }}><Info size={11} style={{ marginTop:1, flexShrink:0 }}/> {c.observacao}</div>}
                              </div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                              <button onClick={() => converterEmCliente(c)} className="badge" style={{ cursor:'pointer', border:'none', background: c.convertido?'rgba(56,189,248,.15)':'rgba(34,211,238,.1)', color: c.convertido?'#38bdf8':'#67e8f9' }}>
                                {c.convertido ? <><BadgeCheck size={12}/> Cliente</> : <><ArrowRight size={12}/> Converter</>}
                              </button>
                              <div style={{ display:'flex', gap:4 }}>
                                <button className="icon-btn" onClick={() => { setEditandoConsultaId(c.id); setConsulta({ ...consultaVazia, ...c }); window.scrollTo({top:0,behavior:'smooth'}); }}><Edit size={15}/></button>
                                <button className="icon-btn danger" onClick={() => excluirConsulta(c.id)}><Trash2 size={15}/></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!loading && consultasFiltradas.length === 0 && <EmptyState Icon={FileSearch} label="Nenhuma consulta encontrada"/>}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
