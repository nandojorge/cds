import React from 'react';
import { Heart, Plus, Search, Library, LogIn, LogOut, Disc } from 'lucide-react';
import { ActiveTab } from '../types';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collectionCount: number;
  uniqueArtistsCount: number;
  wishlistCount: number;
  onOpenGlobalSearch: () => void;
  onOpenAddModal: () => void;
  user: User | null;
  isSyncing: boolean;
  onLoginWithGoogle: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  collectionCount,
  uniqueArtistsCount,
  wishlistCount,
  onOpenGlobalSearch,
  onOpenAddModal,
  user,
  isSyncing,
  onLoginWithGoogle,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E4E4E7] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top brand + counters row */}
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3">
          
          {/* Logo & Discreet Counters */}
          <div className="flex items-center gap-4 flex-wrap w-full md:w-auto justify-between md:justify-start">
            <div 
              onClick={() => setActiveTab('collection')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <span className="w-8 h-8 bg-[#18181B] rounded-lg flex items-center justify-center text-white text-xs font-black tracking-wider shadow-xs group-hover:bg-[#27272A] transition-colors">
                CD
              </span>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-[#09090B] flex items-center gap-1.5 leading-none">
                  MYCOLLECTION
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-[#F4F4F5] text-[#71717A] font-bold rounded border border-[#E4E4E7]">
                    PRO
                  </span>
                </h1>
                <p className="text-[11px] text-[#71717A] font-medium">Arquivo de CDs & Vinis</p>
              </div>
            </div>

            {/* High Density Counters */}
            <div className="h-5 w-px bg-[#E4E4E7] hidden sm:block" />

            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-[#F4F4F5] border border-[#E4E4E7] px-2.5 py-1.5 rounded-lg">
                <span className="text-[11px] text-[#71717A] font-medium">Coleção:</span>
                <span className="text-xs font-bold text-[#18181B]">{collectionCount}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#F4F4F5] border border-[#E4E4E7] px-2.5 py-1.5 rounded-lg hidden sm:flex">
                <span className="text-[11px] text-[#71717A] font-medium">Bandas:</span>
                <span className="text-xs font-bold text-[#18181B]">{uniqueArtistsCount}</span>
              </div>

              <button 
                onClick={() => setActiveTab('wishlist')} 
                className="flex items-center gap-1.5 bg-white border border-[#E4E4E7] hover:border-[#E11D48]/50 px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer group"
                title="Ver Lista de Desejos"
              >
                <span className="text-[11px] text-[#18181B] font-bold flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-[#E11D48] fill-[#E11D48]" />
                  Desejos:
                </span>
                <span className="text-xs font-black text-[#E11D48]">{wishlistCount}</span>
              </button>
            </div>
          </div>

          {/* Quick Search, Cloud Status & Single Add Action */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            
            {/* Realtime Cloud DB Status Badge */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-[#F4F4F5] border border-[#E4E4E7] text-[#52525B]"
              title={user?.isAnonymous ? 'Sessão Cloud Ativa' : `Conectado como ${user?.email || 'Utilizador Cloud'}`}
            >
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="hidden xl:inline text-[#71717A]">
                {isSyncing ? 'A sincronizar...' : 'Firestore Nuvem'}
              </span>
            </div>

            {/* Auth / Account Controls */}
            {user && !user.isAnonymous ? (
              <div className="flex items-center gap-1.5 bg-[#F4F4F5] border border-[#E4E4E7] p-1 rounded-lg">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'Utilizador'} 
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#18181B] text-white flex items-center justify-center text-[10px] font-bold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-xs font-bold text-[#18181B] max-w-[100px] truncate hidden sm:inline px-1">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={onLogout}
                  className="p-1 hover:bg-[#E4E4E7] rounded text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                  title="Terminar Sessão"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginWithGoogle}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#F4F4F5] border border-[#E4E4E7] hover:border-[#18181B] text-[#18181B] text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Ligar com Google para sincronizar em todos os teus dispositivos"
              >
                <LogIn className="w-3.5 h-3.5 text-[#18181B]" />
                <span className="hidden sm:inline">Ligar Google</span>
              </button>
            )}

            {/* Search shortcut button */}
            <button
              onClick={onOpenGlobalSearch}
              className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-[#71717A] bg-[#F4F4F5] hover:bg-[#E4E4E7]/60 border border-[#E4E4E7] rounded-lg transition-colors cursor-pointer"
              title="Pesquisa global (Coleção + Desejos)"
            >
              <Search className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="hidden lg:inline">Pesquisar...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono px-1 py-0.2 rounded bg-white text-[#71717A] border border-[#E4E4E7]">
                ⌘K
              </kbd>
            </button>

            {/* THE ONLY GLOBAL ADD BUTTON */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#18181B] hover:bg-[#27272A] active:bg-black text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar CD / Vinil</span>
            </button>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex items-center gap-1 pt-1 overflow-x-auto no-scrollbar border-t border-[#E4E4E7]">
          <button
            onClick={() => setActiveTab('collection')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'collection'
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>Coleção</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'collection' ? 'bg-[#27272A] text-white' : 'bg-[#E4E4E7] text-[#18181B]'
            }`}>
              {collectionCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'wishlist'
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#E11D48]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${activeTab === 'wishlist' ? 'fill-rose-400 text-rose-400' : 'text-[#E11D48]'}`} />
            <span>Lista de Desejos</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'wishlist' ? 'bg-[#E11D48] text-white' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}>
              {wishlistCount}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
