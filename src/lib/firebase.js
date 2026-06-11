import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

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

// Firestore com cache offline (IndexedDB, multi-aba) — funciona sem sinal.
// try/catch protege contra re-init no HMR do dev (em prod roda 1x só).
let _db;
try {
  _db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  _db = getFirestore(app);
}
export const db = _db;

// jsPDF + autotable carregados sob demanda (code-split, fora do bundle inicial)
export const loadPDF = async () => {
  const [{ default: jsPDF }, autotable] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  return { jsPDF, autoTable: autotable.default };
};
