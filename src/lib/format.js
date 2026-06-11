// --- CORES DOS MÓDULOS ---
export const CORES = {
  dashboard: '#6366f1',
  clientes: '#3b82f6',
  suporte:  '#f59e0b',
  bobinas:  '#10b981',
  serasa:   '#a855f7',
  estoque:  '#22d3ee',
};

export const ONT_MODELOS = ['ZTE F660', 'ZTE F670L', 'Huawei EG8145V5', 'Huawei HG8546M', 'Nokia G-1425G-A', 'Intelbras 110G', 'Fiberhome AN5506'];

// --- HELPERS DE FORMATAÇÃO ---
export const formatarCPF = (valor) => {
  const nums = valor.replace(/\D/g, '').slice(0, 11);
  return nums
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const formatarCNPJ = (valor) => {
  const nums = valor.replace(/\D/g, '').slice(0, 14);
  return nums
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export const formatarDocumento = (valor, tipo) => {
  if (tipo === 'CPF') return formatarCPF(valor);
  if (tipo === 'CNPJ') return formatarCNPJ(valor);
  return valor;
};

export const fmtBRL = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const fmtData = (d) => (d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—');
