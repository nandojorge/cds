/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { User, onAuthStateChanged } from 'firebase/auth';
import { CDItem, ActiveTab } from './types';
import { 
  INITIAL_WISHLIST, 
  generateInitialCollection, 
  STORAGE_KEY_CDS, 
  STORAGE_KEY_WISHLIST 
} from './data/seedData';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  subscribeToCDs, 
  saveCDToFirestore, 
  updateCDInFirestore, 
  deleteCDFromFirestore, 
  initializeAndSeedFirestore 
} from './services/firebase';
import { Header } from './components/Header';
import { WishlistView } from './components/WishlistView';
import { CollectionView } from './components/CollectionView';
import { AddCDModal } from './components/AddCDModal';
import { CDDetailModal } from './components/CDDetailModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  // 1. Storage & State Initialization (with local cache fallback)
  const [collection, setCollection] = useState<CDItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load collection from localStorage', e);
    }
    return generateInitialCollection();
  });

  const [wishlist, setWishlist] = useState<CDItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WISHLIST);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load wishlist from localStorage', e);
    }
    return INITIAL_WISHLIST;
  });

  // Active View Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('collection');

  // Firebase Auth & Cloud Sync state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [selectedCD, setSelectedCD] = useState<CDItem | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'wishlist' | 'info' | 'error', title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync to local storage as instant cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CDS, JSON.stringify(collection));
    } catch (e) {
      console.error('Failed to persist collection', e);
    }
  }, [collection]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to persist wishlist', e);
    }
  }, [wishlist]);

  // Auth observer
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore Synchronization & Seed on start
  useEffect(() => {
    let isMounted = true;

    const runSync = async () => {
      setIsSyncing(true);
      try {
        const allLocalItems = [...collection, ...wishlist];
        await initializeAndSeedFirestore(allLocalItems);
      } catch (err) {
        console.error('Error during initial Firestore seeding:', err);
      }
    };

    runSync();

    const unsubscribeFirestore = subscribeToCDs(
      (items) => {
        if (!isMounted) return;
        if (items && items.length > 0) {
          const colItems = items.filter((c) => c.status !== 'wishlist');
          const wishItems = items.filter((c) => c.status === 'wishlist');
          setCollection(colItems);
          setWishlist(wishItems);
        }
        setIsSyncing(false);
      },
      (err) => {
        if (!isMounted) return;
        console.error('Firestore sync error:', err);
        setIsSyncing(false);
      }
    );

    return () => {
      isMounted = false;
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // Keyboard shortcut for global search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate unique artist count across collection
  const uniqueArtistsCount = useMemo(() => {
    const set = new Set<string>();
    for (const cd of collection) {
      if (cd.artist) set.add(cd.artist.trim().toLowerCase());
    }
    return set.size;
  }, [collection]);

  // Handle Google Login
  const handleLogin = async () => {
    try {
      setIsSyncing(true);
      const user = await loginWithGoogle();
      if (user) {
        addToast('success', 'Sessão iniciada com Google', `Conectado como ${user.email}`);
      }
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        addToast('error', 'Erro ao iniciar sessão', error?.message || 'Tenta novamente');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      addToast('info', 'Sessão terminada');
    } catch (error: any) {
      addToast('error', 'Erro ao terminar sessão', error?.message);
    }
  };

  // Core action: Move from Wishlist to Collection ("✓ Já comprei")
  const handleMoveToCollection = async (wishlistItem: CDItem) => {
    const now = new Date().toISOString();

    // 1. Remove from Wishlist locally
    setWishlist((prev) => prev.filter((item) => item.id !== wishlistItem.id));

    // 2. Add to Collection keeping all data + setting addedToCollectionDate
    const newCollectionItem: CDItem = {
      ...wishlistItem,
      status: 'collection',
      addedToCollectionDate: now,
      condition: wishlistItem.condition || 'Mint',
      shelfLocation: wishlistItem.shelfLocation || 'Prateleira Geral',
    };

    setCollection((prev) => [newCollectionItem, ...prev]);

    // Persist to Firestore
    try {
      await saveCDToFirestore(newCollectionItem, currentUser?.uid);
    } catch (err) {
      console.error('Failed to save to Firestore:', err);
    }

    // 3. Trigger celebratory confetti
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#f43f5e', '#38bdf8', '#fbbf24'],
      });
    } catch {
      // Ignore if unavailable
    }

    addToast('success', 'Adicionado à tua coleção.', `"${wishlistItem.title}" de ${wishlistItem.artist} está agora catalogado.`);
  };

  // Add new CD directly to Collection
  const handleAddToCollection = async (cdData: Partial<CDItem>) => {
    const now = new Date().toISOString();
    const newCD: CDItem = {
      id: `col-${Date.now()}`,
      title: cdData.title || 'Sem Título',
      artist: cdData.artist || 'Artista Desconhecido',
      year: cdData.year || new Date().getFullYear(),
      mediaFormat: cdData.mediaFormat || 'CD',
      coverUrl: cdData.coverUrl,
      mbid: cdData.mbid,
      label: cdData.label,
      country: cdData.country,
      barcode: cdData.barcode,
      trackCount: cdData.trackCount,
      tracks: cdData.tracks || [],
      status: 'collection',
      addedAt: now,
      addedToCollectionDate: now,
      condition: 'Mint',
      shelfLocation: 'Prateleira Geral',
    };

    setCollection((prev) => [newCD, ...prev]);

    try {
      await saveCDToFirestore(newCD, currentUser?.uid);
    } catch (err) {
      console.error('Failed to save to Firestore:', err);
    }

    addToast('success', 'Adicionado à tua coleção.', `"${newCD.title}" de ${newCD.artist} adicionado.`);
  };

  // Add new CD directly to Wishlist
  const handleAddToWishlist = async (cdData: Partial<CDItem>) => {
    const now = new Date().toISOString();
    const newWish: CDItem = {
      id: `wish-${Date.now()}`,
      title: cdData.title || 'Sem Título',
      artist: cdData.artist || 'Artista Desconhecido',
      year: cdData.year || new Date().getFullYear(),
      mediaFormat: cdData.mediaFormat || 'CD',
      coverUrl: cdData.coverUrl,
      mbid: cdData.mbid,
      label: cdData.label,
      country: cdData.country,
      barcode: cdData.barcode,
      trackCount: cdData.trackCount,
      tracks: cdData.tracks || [],
      status: 'wishlist',
      desiredPrice: cdData.desiredPrice,
      purchaseNotes: cdData.purchaseNotes,
      addedAt: now,
    };

    setWishlist((prev) => [newWish, ...prev]);

    try {
      await saveCDToFirestore(newWish, currentUser?.uid);
    } catch (err) {
      console.error('Failed to save to Firestore:', err);
    }

    addToast('wishlist', 'Adicionado à Lista de Desejos', `"${newWish.title}" guardado para comprar mais tarde.`);
  };

  // Remove CD
  const handleRemoveCD = async (id: string, status: 'wishlist' | 'collection' | 'loaned') => {
    if (status === 'wishlist') {
      setWishlist((prev) => prev.filter((c) => c.id !== id));
      addToast('info', 'Removido da Lista de Desejos');
    } else {
      setCollection((prev) => prev.filter((c) => c.id !== id));
      addToast('info', 'Removido da Coleção');
    }

    try {
      await deleteCDFromFirestore(id);
    } catch (err) {
      console.error('Failed to delete from Firestore:', err);
    }
  };

  // Update CD details
  const handleUpdateCD = async (updatedCD: CDItem) => {
    if (updatedCD.status === 'wishlist') {
      setWishlist((prev) => prev.map((c) => (c.id === updatedCD.id ? updatedCD : c)));
    } else {
      setCollection((prev) => prev.map((c) => (c.id === updatedCD.id ? updatedCD : c)));
    }
    if (selectedCD?.id === updatedCD.id) {
      setSelectedCD(updatedCD);
    }

    try {
      await updateCDInFirestore(updatedCD, currentUser?.uid);
    } catch (err) {
      console.error('Failed to update in Firestore:', err);
    }

    addToast('info', 'Alterações guardadas na nuvem');
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] text-[#18181B] flex flex-col font-sans antialiased selection:bg-[#18181B] selection:text-white">
      {/* App Header with the ONLY single Add CD button, counters, tabs & global search */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collectionCount={collection.length}
        uniqueArtistsCount={uniqueArtistsCount}
        wishlistCount={wishlist.length}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        user={currentUser}
        isSyncing={isSyncing}
        onLoginWithGoogle={handleLogin}
        onLogout={handleLogout}
      />

      {/* Main Container View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'wishlist' ? (
          <WishlistView
            wishlist={wishlist}
            onMoveToCollection={handleMoveToCollection}
            onRemoveFromWishlist={(id) => handleRemoveCD(id, 'wishlist')}
            onSelectCD={(cd) => setSelectedCD(cd)}
          />
        ) : (
          <CollectionView
            collection={collection}
            onSelectCD={(cd) => setSelectedCD(cd)}
          />
        )}
      </main>

      {/* Single Universal Add CD Modal (MusicBrainz + Cover Art Archive + Custom Form) */}
      <AddCDModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        collection={collection}
        wishlist={wishlist}
        onAddToCollection={handleAddToCollection}
        onAddToWishlist={handleAddToWishlist}
        onMoveWishlistToCollection={handleMoveToCollection}
        initialArtistQuery=""
      />

      {/* CD Detail & Edit Modal */}
      <CDDetailModal
        cd={selectedCD}
        isOpen={!!selectedCD}
        onClose={() => setSelectedCD(null)}
        onMoveToCollection={handleMoveToCollection}
        onRemove={handleRemoveCD}
        onUpdateCD={handleUpdateCD}
      />

      {/* Global Unified Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        collection={collection}
        wishlist={wishlist}
        onSelectCD={(cd) => setSelectedCD(cd)}
        onMoveToCollection={handleMoveToCollection}
        onOpenAddModalWithSearch={() => {
          setIsAddModalOpen(true);
        }}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
