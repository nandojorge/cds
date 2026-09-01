import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Library, Heart, Check, ArrowRight, Disc, Radio } from 'lucide-react';
import { CDItem } from '../types';
import { CDCover } from './CDCover';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: CDItem[];
  wishlist: CDItem[];
  onSelectCD: (cd: CDItem) => void;
  onMoveToCollection: (cd: CDItem) => void;
  onOpenAddModalWithSearch: (term: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  collection,
  wishlist,
  onSelectCD,
  onMoveToCollection,
  onOpenAddModalWithSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global search across collection and wishlist
  const { collectionResults, wishlistResults } = useMemo(() => {
    if (!searchTerm.trim()) {
      return { collectionResults: [], wishlistResults: [] };
    }

    const q = searchTerm.toLowerCase();
    const match = (item: CDItem) =>
      item.title.toLowerCase().includes(q) ||
      item.artist.toLowerCase().includes(q) ||
      (item.shelfLocation && item.shelfLocation.toLowerCase().includes(q));

    return {
      collectionResults: collection.filter(match),
      wishlistResults: wishlist.filter(match),
    };
  }, [searchTerm, collection, wishlist]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-[#E4E4E7] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#E4E4E7] flex items-center gap-3 bg-[#FAFAFA]">
          <Search className="w-5 h-5 text-[#71717A] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisa global: ex. Pearl Jam, Pink Floyd, The Wall..."
            className="flex-1 bg-transparent text-sm text-[#18181B] placeholder-[#71717A] outline-none font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-[#71717A] hover:text-[#18181B] px-2 py-1 cursor-pointer font-bold"
            >
              ✕
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 bg-white">
          {!searchTerm.trim() ? (
            <div className="py-12 text-center text-[#71717A] space-y-2">
              <Disc className="w-8 h-8 mx-auto text-[#A1A1AA] animate-spin-slow" />
              <p className="text-xs font-medium">
                Pesquisa instantaneamente em toda a Coleção e na Lista de Desejos.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-[#71717A]">
                <span>Experimenta:</span>
                <button
                  onClick={() => setSearchTerm('Pearl Jam')}
                  className="underline hover:text-[#18181B] cursor-pointer font-semibold"
                >
                  Pearl Jam
                </button>
                <span>•</span>
                <button
                  onClick={() => setSearchTerm('Pink Floyd')}
                  className="underline hover:text-[#18181B] cursor-pointer font-semibold"
                >
                  Pink Floyd
                </button>
                <span>•</span>
                <button
                  onClick={() => setSearchTerm('Radiohead')}
                  className="underline hover:text-[#18181B] cursor-pointer font-semibold"
                >
                  Radiohead
                </button>
              </div>
            </div>
          ) : collectionResults.length === 0 && wishlistResults.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm font-bold text-[#18181B]">
                Nenhum resultado encontrado para "{searchTerm}"
              </p>
              <p className="text-xs text-[#71717A]">
                Queres pesquisar este álbum ou artista no MusicBrainz para adicionar?
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAddModalWithSearch(searchTerm);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <span>Pesquisar "{searchTerm}" no MusicBrainz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* SECTION 1: NA COLEÇÃO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#059669] flex items-center gap-2">
                    <Library className="w-4 h-4" />
                    <span>Na Coleção</span>
                    <span className="text-[10px] font-mono bg-[#ECFDF5] text-[#059669] px-2 py-0.5 rounded-full border border-[#A7F3D0] font-bold">
                      {collectionResults.length} {collectionResults.length === 1 ? 'item' : 'itens'}
                    </span>
                  </h3>
                </div>

                {collectionResults.length === 0 ? (
                  <p className="text-xs text-[#71717A] italic py-1">Nenhum item correspondente na coleção.</p>
                ) : (
                  <div className="space-y-2">
                    {collectionResults.map((cd) => (
                      <div
                        key={cd.id}
                        onClick={() => {
                          onSelectCD(cd);
                          onClose();
                        }}
                        className="group bg-[#FAFAFA] hover:bg-[#F4F4F5] p-2.5 rounded-xl border border-[#E4E4E7] hover:border-[#18181B] transition-all cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CDCover
                            coverUrl={cd.coverUrl}
                            title={cd.title}
                            artist={cd.artist}
                            year={cd.year}
                            size="sm"
                            className="w-10 h-10"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-[#18181B] group-hover:text-[#059669] truncate">
                              {cd.title}
                            </h4>
                            <p className="text-[11px] text-[#71717A] truncate font-medium">{cd.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 text-[11px] font-mono text-[#71717A]">
                          <span className="text-[10px] font-bold bg-white text-[#18181B] px-1.5 py-0.5 rounded border border-[#E4E4E7]">
                            {cd.mediaFormat === 'Vinyl' ? 'Vinil' : 'CD'}
                          </span>
                          {cd.marketPrice && (
                            <span className="hidden sm:inline text-[10px] text-[#71717A]">
                              {cd.marketPrice}
                            </span>
                          )}
                          {cd.year > 0 && <span>{cd.year}</span>}
                          {cd.shelfLocation && (
                            <span className="hidden sm:inline bg-white border border-[#E4E4E7] px-2 py-0.5 rounded text-[#18181B] text-[10px] font-bold">
                              {cd.shelfLocation}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                            ✓ Coleção
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: NA LISTA DE DESEJOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E11D48] flex items-center gap-2">
                    <Heart className="w-4 h-4 fill-[#E11D48]" />
                    <span>Lista de Desejos</span>
                    <span className="text-[10px] font-mono bg-[#FFE4E6] text-[#E11D48] px-2 py-0.5 rounded-full border border-[#FECDD3] font-bold">
                      {wishlistResults.length} {wishlistResults.length === 1 ? 'item' : 'itens'}
                    </span>
                  </h3>
                </div>

                {wishlistResults.length === 0 ? (
                  <p className="text-xs text-[#71717A] italic py-1">Nenhum item correspondente na lista de desejos.</p>
                ) : (
                  <div className="space-y-2">
                    {wishlistResults.map((cd) => (
                      <div
                        key={cd.id}
                        onClick={() => {
                          onSelectCD(cd);
                          onClose();
                        }}
                        className="group bg-[#FFF1F2] hover:bg-[#FFE4E6] p-2.5 rounded-xl border border-[#FECDD3] hover:border-[#FDA4AF] transition-all cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CDCover
                            coverUrl={cd.coverUrl}
                            title={cd.title}
                            artist={cd.artist}
                            year={cd.year}
                            size="sm"
                            className="w-10 h-10"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-[#18181B] group-hover:text-[#E11D48] truncate">
                              {cd.title}
                            </h4>
                            <p className="text-[11px] text-[#71717A] truncate font-medium">{cd.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold bg-white text-[#18181B] px-1.5 py-0.5 rounded border border-[#E4E4E7]">
                            {cd.mediaFormat === 'Vinyl' ? 'Vinil' : 'CD'}
                          </span>
                          {cd.desiredPrice && (
                            <span className="text-[11px] font-mono font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                              {cd.desiredPrice}
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveToCollection(cd);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#059669] hover:bg-[#047857] text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                            title="Já comprei - Mover para a coleção"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Já comprei</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#FAFAFA] border-t border-[#E4E4E7] text-center text-[11px] text-[#71717A] font-medium">
          Pesquisa rápida unificada • Pressiona <kbd className="font-mono bg-white border border-[#E4E4E7] px-1 py-0.5 rounded text-[#18181B] font-bold">Esc</kbd> para fechar
        </div>
      </div>
    </div>
  );
};
