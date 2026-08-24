import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { DEFAULT_USERS } from '../defaultUsers';
import { supabase } from '../lib/supabase';

const BankContext = createContext();
export const useBank = () => useContext(BankContext);

const EMPTY_CARD = {
  number: '', holder: '', expiry: '', isBlocked: false,
  foreignPayments: true, limit: 3000, withdrawalLimit: 1200
};

const EMPTY_RIB = {
  bankName: 'BNP PARIBAS', bankCode: '30004', branchCode: '00000',
  accountNumber: '000000000', key: '00', iban: '', swift: 'BNPAFRPPXXX'
};

const formatLastConnection = () => new Date().toLocaleDateString('fr-FR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

const readLocalSession = (key, fallback = '') => {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
};

export const BankProvider = ({ children }) => {
  // La connexion ne doit pas être restaurée depuis localStorage.
  // L'utilisateur doit se reconnecter à chaque nouvelle ouverture.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('login');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scraperImported, setScraperImported] = useState(false);
  const [toast, setToast] = useState(null);
  const [users, setUsers] = useState(() => DEFAULT_USERS.map((u) => ({ ...u })));
  const [activeUserId, setActiveUserId] = useState(null);
  const [user, setUser] = useState({ name: '', location: '', manager: '', status: 'Actif', lastConnection: '' });
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [card, setCard] = useState(EMPTY_CARD);
  const [rib, setRib] = useState(EMPTY_RIB);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [hasLoadedRemoteData, setHasLoadedRemoteData] = useState(false);
  const saveTimer = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  const activeUser = users.find((u) => u.id === activeUserId) || null;
  const globalBalance = accounts.find((a) => a.id === 'cc')?.balance || 0;

  const applyUserData = (baseUser, saved = {}) => {
    const nextUser = {
      ...baseUser,
      ...saved,
      // Le statut défini dans defaultUsers.js est la source de référence.
      // Une ancienne valeur enregistrée dans Supabase ne doit pas l’écraser.
      status: baseUser.status || 'Actif',
      accounts: saved.accounts || baseUser.accounts || [],
      transactions: saved.transactions || baseUser.transactions || [],
      card: saved.card || baseUser.card || EMPTY_CARD,
      rib: saved.rib || baseUser.rib || EMPTY_RIB
    };
    setUser({
      name: `${nextUser.prenom} ${nextUser.nom}`,
      location: nextUser.location,
      manager: nextUser.manager,
      status: nextUser.status || 'Actif',
      lastConnection: formatLastConnection()
    });
    setAccounts(nextUser.accounts);
    setTransactions(nextUser.transactions);
    setCard(nextUser.card);
    setRib(nextUser.rib);
  };

  const loadRemoteUserData = async (userId, baseUser) => {
    setIsLoadingUserData(true);
    setHasLoadedRemoteData(false);
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('payload')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      applyUserData(baseUser, data?.payload || {});
      setHasLoadedRemoteData(true);
    } catch (error) {
      console.error('Erreur Supabase lors du chargement :', error);
      applyUserData(baseUser);
      showToast('Données distantes indisponibles : données initiales utilisées.', 'warning');
    } finally {
      setIsLoadingUserData(false);
    }
  };

  useEffect(() => {
    if (activeUserId && activeUser) loadRemoteUserData(activeUserId, activeUser);
  }, [activeUserId]);

  useEffect(() => {
    if (!activeUserId || !hasLoadedRemoteData || isLoadingUserData) return;
    const payload = { ...activeUser, accounts, transactions, card, rib, lastConnection: formatLastConnection() };
    setUsers((previous) => previous.map((u) => u.id === activeUserId ? { ...u, ...payload } : u));
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        const { error } = await supabase.from('user_data').upsert({
          user_id: activeUserId,
          payload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        if (error) throw error;
      } catch (error) {
        console.error('Erreur Supabase lors de la sauvegarde :', error);
        showToast('La sauvegarde distante a échoué.', 'error');
      }
    }, 500);
    return () => window.clearTimeout(saveTimer.current);
  }, [accounts, transactions, card, rib, activeUserId, hasLoadedRemoteData, isLoadingUserData]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const loginWithUser = (identifiant, codeSecret) => {
    const foundUser = users.find((u) => u.identifiant === identifiant && u.codeSecret === codeSecret);
    if (!foundUser) return false;
    setActiveUserId(foundUser.id);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    showToast(`Connexion réussie. Bienvenue ${foundUser.prenom} ${foundUser.nom} !`, 'success');
    return true;
  };

  const resetAppData = () => {
    setIsAuthenticated(false);
    setCurrentView('login');
    setActiveUserId(null);
    setHasLoadedRemoteData(false);
    setAccounts([]);
    setTransactions([]);
  };

  const executeTransfer = (transferData) => {
    const amountNum = parseFloat(transferData.amount);
    setAccounts((previous) => previous.map((account) => account.id === 'cc'
      ? { ...account, balance: account.balance - amountNum } : account));
    setTransactions((previous) => [{
      id: Date.now(),
      type: `Virement vers ${transferData.firstName} ${transferData.lastName}`,
      reference: transferData.iban.replace(/\s+/g, ''),
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      amount: -amountNum, status: 'Effectué', category: 'Virement'
    }, ...previous]);
    showToast('Virement effectué avec succès !');
  };

  const toggleCardBlock = () => setCard((previous) => {
    const nextState = !previous.isBlocked;
    showToast(nextState ? 'Votre carte bancaire a été bloquée.' : 'Votre carte bancaire a été débloquée.', nextState ? 'warning' : 'success');
    return { ...previous, isBlocked: nextState };
  });

  const toggleForeignPayments = () => setCard((previous) => {
    const nextState = !previous.foreignPayments;
    showToast(nextState ? "Paiements à l'étranger activés." : "Paiements à l'étranger désactivés.");
    return { ...previous, foreignPayments: nextState };
  });

  const updateCardLimit = (limit) => {
    setCard((previous) => ({ ...previous, limit }));
    showToast(`Plafond de paiement modifié à ${limit} €.`);
  };

  const scrapeOldBnpHTML = (htmlString) => {
    try {
      const doc = new DOMParser().parseFromString(htmlString, 'text/html');
      const node = doc.querySelector('.balance-amount');
      if (!node) { showToast('Aucune donnée trouvée dans le fichier.', 'error'); return false; }
      const amount = parseFloat(node.textContent.replace(/[^0-9,-]/g, '').replace(',', '.'));
      if (Number.isNaN(amount)) { showToast('Solde invalide.', 'error'); return false; }
      setAccounts((previous) => previous.map((a) => a.id === 'cc' ? { ...a, balance: amount } : a));
      setScraperImported(true);
      showToast('Import réussi : Solde !');
      return true;
    } catch (error) {
      console.error('Erreur de scraping :', error);
      showToast("Impossible d'extraire les données.", 'error');
      return false;
    }
  };

  const simulateOldBnpScrape = (fileName) => {
    if (fileName === 'solde.html') setAccounts((previous) => previous.map((a) => a.id === 'cc' ? { ...a, balance: 50000 } : a));
    setScraperImported(true);
    showToast(`Simulation du scraping réussi : ${fileName} importé.`);
  };

  return (
    <BankContext.Provider value={{
      isAuthenticated, setIsAuthenticated, currentView, setCurrentView,
      isDarkMode, setIsDarkMode, user, setUser, accounts, setAccounts,
      transactions, setTransactions, card, setCard, rib, setRib, globalBalance,
      executeTransfer, toggleCardBlock, toggleForeignPayments, updateCardLimit,
      scrapeOldBnpHTML, simulateOldBnpScrape, scraperImported, toast, showToast,
      resetAppData, users, loginWithUser, isLoadingUserData
    }}>
      {children}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-md ${
          toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white dark:bg-emerald-950/90' :
          toast.type === 'warning' ? 'bg-amber-500/90 border-amber-400 text-white dark:bg-amber-950/90' :
          'bg-rose-500/90 border-rose-400 text-white dark:bg-rose-950/90'
        }`}>
          <div className="text-xl">{toast.type === 'success' ? '✨' : toast.type === 'warning' ? '⚠️' : '❌'}</div>
          <div className="font-semibold text-sm tracking-wide">{toast.message}</div>
        </div>
      )}
    </BankContext.Provider>
  );
};
