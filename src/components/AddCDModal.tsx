import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Heart, 
  Disc, 
  X, 
  Check, 
  AlertCircle, 
  Loader2, 
  Library,
  Music,
  Radio
} from 'lucide-react';
import { CDItem, MediaFormat } from '../types';
import { searchMusicBrainz, getReleaseDetails } from '../services/musicBrainz';
import { CDCover } from './CDCover';

interface AddCDModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: CDItem[];
  wishlist: CDItem[];
  onAddToCollection: (cd: Partial<CDItem>) => void;
  onAddToWishlist: (cd: Partial<CDItem>) => void;
  onMoveWishlistToCollection: (wishlistItem: CDItem) => void;
  initialArtistQuery?: string;
}

export const AddCDModal: React.FC<AddCDModalProps> = ({
  isOpen,
  onClose,
  collection,
  wishlist,
  onAddToCollection,
  onAddToWishlist,
  onMoveWishlistToCollection,
  initialArtistQuery = '',
}) => {
  const [query, setQuery] = useState(initialArtistQuery);
  const [results, setResults] = useState<Partial<CDItem>[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<Record<string, MediaFormat>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // Quick prompt for Wishlist Notes/Price before saving
  const [selectedForWishlist, setSelectedForWishlist] = useState<Partial<CDItem> | null>(null);
  const [desiredPriceInput, setDesiredPriceInput] = useState('');
  const [purchaseNotesInput, setPurchaseNotesInput] = useState('');

  // Duplicate Warning Modal / Notification State
  const [duplicateNotice, setDuplicateNotice] = useState<{
    title: string;
    description: string;
    type: 'error_in_collection' | 'error_in_wishlist' | 'prompt_move_wishlist';
    targetCD: Partial<CDItem>;
    matchedItem?: CDItem;
  } | null>(null);

  // Manual Item Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');
  const [manualYear, setManualYear] = useState<number>(new Date().getFullYear());
  const [manualFormat, setManualFormat] = useState<MediaFormat>('CD');
  const [manualPrice, setManualPrice] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualTarget, setManualTarget] = useState<'collection' | 'wishlist'>('collection');
  const [manualError, setManualError] = useState<string | null>(null);

  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (initialArtistQuery) {
      setQuery(initialArtistQuery);
      performSearch(initialArtistQuery);
    }
  }, [initialArtistQuery]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const items = await searchMusicBrainz(searchTerm);
      setResults(items);
      // Initialize formats default to CD
      const initialFmtMap: Record<string, MediaFormat> = {};
      items.forEach((item, idx) => {
        const key = item.id || `${item.title}-${item.artist}-${idx}`;
        initialFmtMap[key] = 'CD';
      });
      setSelectedFormats(initialFmtMap);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(val);
      }, 400);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  };

  const normalizeStr = (str?: string) =>
    (str || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  const findInCollection = (cd: Partial<CDItem>) => {
    const titleNorm = normalizeStr(cd.title);
    const artistNorm = normalizeStr(cd.artist);
    return collection.find(
      (c) =>
        (cd.mbid && c.mbid && c.mbid === cd.mbid) ||
        (normalizeStr(c.title) === titleNorm && normalizeStr(c.artist) === artistNorm)
    );
  };

  const findInWishlist = (cd: Partial<CDItem>) => {
    const titleNorm = normalizeStr(cd.title);
    const artistNorm = normalizeStr(cd.artist);
    return wishlist.find(
      (w) =>
        (cd.mbid && w.mbid && w.mbid === cd.mbid) ||
        (normalizeStr(w.title) === titleNorm && normalizeStr(w.artist) === artistNorm)
    );
  };

  // Add to Collection with duplicate checks
  const handleTriggerAddToCollection = async (cd: Partial<CDItem>, chosenFormat: MediaFormat = 'CD') => {
    const cdWithFormat = { ...cd, mediaFormat: chosenFormat };

    // 1. Check if ALREADY in collection -> STRICTLY PREVENT ADDITION
    const existingInCollection = findInCollection(cd);
    if (existingInCollection) {
      setDuplicateNotice({
        type: 'error_in_collection',
        title: 'Álbum já existe na tua Coleção',
        description: `"${existingInCollection.title}" de ${existingInCollection.artist} já está registado na tua coleção. Não é permitido adicionar itens duplicados.`,
        targetCD: cdWithFormat,
        matchedItem: existingInCollection,
      });
      return;
    }

    // 2. Check if in wishlist -> PROMPT TO MOVE
    const existingInWishlist = findInWishlist(cd);
    if (existingInWishlist) {
      setDuplicateNotice({
        type: 'prompt_move_wishlist',
        title: 'Álbum encontrado na Lista de Desejos',
        description: `"${existingInWishlist.title}" de ${existingInWishlist.artist} está na tua Lista de Desejos. Queres movê-lo diretamente para a Coleção?`,
        targetCD: cdWithFormat,
        matchedItem: existingInWishlist,
      });
      return;
    }

    // 3. Not duplicate -> proceed to add
    let fullTracks: string[] = [];
    if (cd.mbid) {
      const details = await getReleaseDetails(cd.mbid);
      fullTracks = details.tracks;
    }

    onAddToCollection({
      ...cdWithFormat,
      tracks: fullTracks.length > 0 ? fullTracks : cd.tracks,
    });
    onClose();
  };

  // Add to Wishlist with duplicate checks
  const handleTriggerAddToWishlist = (cd: Partial<CDItem>, chosenFormat: MediaFormat = 'CD') => {
    const cdWithFormat = { ...cd, mediaFormat: chosenFormat };

    // 1. Check if ALREADY in wishlist -> STRICTLY PREVENT ADDITION
    const existingInWishlist = findInWishlist(cd);
    if (existingInWishlist) {
      setDuplicateNotice({
        type: 'error_in_wishlist',
        title: 'Álbum já existe na Lista de Desejos',
        description: `"${existingInWishlist.title}" de ${existingInWishlist.artist} já se encontra na tua Lista de Desejos.`,
        targetCD: cdWithFormat,
        matchedItem: existingInWishlist,
      });
      return;
    }

    // 2. Check if ALREADY in collection -> STRICTLY PREVENT ADDITION
    const existingInCollection = findInCollection(cd);
    if (existingInCollection) {
      setDuplicateNotice({
        type: 'error_in_collection',
        title: 'Álbum já existente na tua Coleção',
        description: `Já possuis "${existingInCollection.title}" de ${existingInCollection.artist} na tua coleção física.`,
        targetCD: cdWithFormat,
        matchedItem: existingInCollection,
      });
      return;
    }

    // 3. Not duplicate -> Open quick notes/price popup
    setSelectedForWishlist(cdWithFormat);
    setDesiredPriceInput('');
    setPurchaseNotesInput('');
  };

  const handleConfirmWishlistAdd = async () => {
    if (!selectedForWishlist) return;

    let fullTracks: string[] = [];
    if (selectedForWishlist.mbid) {
      const details = await getReleaseDetails(selectedForWishlist.mbid);
      fullTracks = details.tracks;
    }

    onAddToWishlist({
      ...selectedForWishlist,
      tracks: fullTracks.length > 0 ? fullTracks : selectedForWishlist.tracks,
      desiredPrice: desiredPriceInput.trim() || undefined,
      purchaseNotes: purchaseNotesInput.trim() || undefined,
    });

    setSelectedForWishlist(null);
    onClose();
  };

  // Submit manual entry form
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    if (!manualTitle.trim() || !manualArtist.trim()) {
      setManualError('Por favor preenche o título do álbum e o nome do artista.');
      return;
    }

    const newCD: Partial<CDItem> = {
      title: manualTitle.trim(),
      artist: manualArtist.trim(),
      year: Number(manualYear) || new Date().getFullYear(),
      mediaFormat: manualFormat,
      desiredPrice: manualPrice ? (manualPrice.includes('€') ? manualPrice.trim() : `${manualPrice.trim()} €`) : undefined,
      purchaseNotes: manualNotes.trim() || undefined,
    };

    // Duplicate verification for manual entry
    if (manualTarget === 'collection') {
      const existsCol = findInCollection(newCD);
      if (existsCol) {
        setManualError(`Este álbum já existe na tua Coleção ("${existsCol.title}" - ${existsCol.artist}).`);
        return;
      }
      const existsWish = findInWishlist(newCD);
      if (existsWish) {
        setDuplicateNotice({
          type: 'prompt_move_wishlist',
          title: 'Álbum encontrado na Lista de Desejos',
          description: `"${existsWish.title}" de ${existsWish.artist} já está na tua Lista de Desejos. Queres movê-lo para a Coleção?`,
          targetCD: newCD,
          matchedItem: existsWish,
        });
        return;
      }
      onAddToCollection(newCD);
    } else {
      const existsWish = findInWishlist(newCD);
      if (existsWish) {
        setManualError(`Este álbum já existe na tua Lista de Desejos.`);
        return;
      }
      const existsCol = findInCollection(newCD);
      if (existsCol) {
        setManualError(`Já tens este álbum na tua Coleção física.`);
        return;
      }
      onAddToWishlist(newCD);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-[#E4E4E7] rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white border border-[#E4E4E7] text-[#18181B] shadow-2xs">
              <Disc className="w-5 h-5 text-[#18181B]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#09090B] flex items-center gap-2">
                Adicionar CD ou Vinil
                <span className="text-[10px] font-mono uppercase bg-[#F4F4F5] text-[#71717A] px-2 py-0.5 rounded border border-[#E4E4E7] font-bold">
                  MusicBrainz / Manual
                </span>
              </h3>
              <p className="text-xs text-[#71717A] font-medium">
                Pesquisa na base mundial de álbuns ou introduz os detalhes manualmente.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar / Mode Switcher */}
        <div className="p-4 sm:p-5 border-b border-[#E4E4E7] bg-white space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performSearch(query)}
              placeholder="Pesquisar álbum ou banda: Ex. Pearl Jam Ten, Pink Floyd Animals, Nirvana..."
              className="w-full pl-10 pr-24 py-2.5 bg-[#F4F4F5] text-sm text-[#18181B] placeholder-[#A1A1AA] rounded-xl border border-[#E4E4E7] focus:border-[#18181B] focus:bg-white outline-none transition-all font-medium"
            />
            <button
              onClick={() => performSearch(query)}
              disabled={isLoading || query.trim().length < 2}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#18181B] hover:bg-[#27272A] active:bg-black disabled:opacity-40 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Pesquisar'}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-[#71717A] flex-wrap gap-2 font-medium">
            <div className="flex items-center gap-1.5">
              <span>Sugestões:</span>
              <button
                onClick={() => {
                  setQuery('Pearl Jam Ten');
                  performSearch('Pearl Jam Ten');
                }}
                className="underline hover:text-[#18181B] text-[#18181B] font-semibold cursor-pointer"
              >
                Pearl Jam - Ten
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setQuery('Pink Floyd Animals');
                  performSearch('Pink Floyd Animals');
                }}
                className="underline hover:text-[#18181B] text-[#18181B] font-semibold cursor-pointer"
              >
                Pink Floyd - Animals
              </button>
            </div>

            <button
              onClick={() => {
                setManualMode(!manualMode);
                setManualError(null);
              }}
              className="text-[#18181B] hover:underline font-bold cursor-pointer flex items-center gap-1"
            >
              {manualMode ? '← Pesquisar no MusicBrainz' : '+ Inserir manualmente'}
            </button>
          </div>
        </div>

        {/* Modal Body: Manual Form or Search Results */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-white">
          {manualMode ? (
            /* MANUAL ENTRY FORM */
            <form onSubmit={handleManualSubmit} className="space-y-4 max-w-md mx-auto py-2">
              <div className="bg-[#FAFAFA] p-5 rounded-xl border border-[#E4E4E7] space-y-3.5 shadow-2xs">
                <h4 className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
                  Novo Registo Manual
                </h4>

                {manualError && (
                  <div className="p-3 bg-[#FFE4E6] border border-[#FECDD3] text-[#E11D48] text-xs font-bold rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{manualError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">
                    Nome do Álbum *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Ex: Lost Dogs"
                    className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-lg text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">
                    Banda / Artista *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualArtist}
                    onChange={(e) => setManualArtist(e.target.value)}
                    placeholder="Ex: Pearl Jam"
                    className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-lg text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">Ano</label>
                    <input
                      type="number"
                      value={manualYear}
                      onChange={(e) => setManualYear(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-lg text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  {/* FORMAT SELECTOR: CD or Vinil */}
                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">Formato *</label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setManualFormat('CD')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1 ${
                          manualFormat === 'CD'
                            ? 'bg-[#18181B] text-white border-[#18181B] shadow-2xs'
                            : 'bg-white text-[#71717A] border-[#E4E4E7] hover:border-[#18181B]'
                        }`}
                      >
                        <Disc className="w-3 h-3" />
                        <span>CD</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualFormat('Vinyl')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1 ${
                          manualFormat === 'Vinyl'
                            ? 'bg-[#18181B] text-white border-[#18181B] shadow-2xs'
                            : 'bg-white text-[#71717A] border-[#E4E4E7] hover:border-[#18181B]'
                        }`}
                      >
                        <Radio className="w-3 h-3" />
                        <span>Vinil</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">
                    Preço (opcional)
                  </label>
                  <input
                    type="text"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    placeholder="Ex: 15 €"
                    className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-lg text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">
                    Notas de compra (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Ex: edição deluxe / selado / 180g"
                    className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-lg text-xs text-[#18181B] focus:outline-none focus:border-[#18181B] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Destino</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setManualTarget('collection')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                        manualTarget === 'collection'
                          ? 'bg-[#18181B] text-white border-[#18181B] shadow-xs'
                          : 'bg-white text-[#71717A] border-[#E4E4E7] hover:border-[#18181B]'
                      }`}
                    >
                      ✓ Na Coleção
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualTarget('wishlist')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                        manualTarget === 'wishlist'
                          ? 'bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3] shadow-xs'
                          : 'bg-white text-[#71717A] border-[#E4E4E7] hover:border-[#18181B]'
                      }`}
                    >
                      ♡ Lista de Desejos
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#18181B] hover:bg-[#27272A] active:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer mt-2 shadow-xs"
                >
                  Gravar {manualFormat === 'Vinyl' ? 'Vinil' : 'CD'}
                </button>
              </div>
            </form>
          ) : isLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-[#18181B] animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#71717A] font-medium">A pesquisar no MusicBrainz & Cover Art Archive...</p>
            </div>
          ) : results.length > 0 ? (
            /* RESULTS LIST */
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#71717A]">
                {results.length} edições encontradas:
              </p>

              {results.map((item, idx) => {
                const itemKey = item.id || `${item.title}-${item.artist}-${idx}`;
                const chosenFormat = selectedFormats[itemKey] || 'CD';

                const inCollection = !!findInCollection(item);
                const inWishlist = !!findInWishlist(item);

                return (
                  <div
                    key={itemKey}
                    className="p-3.5 bg-[#FAFAFA] hover:bg-white rounded-xl border border-[#E4E4E7] hover:border-[#18181B] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <CDCover
                        coverUrl={item.coverUrl}
                        title={item.title || ''}
                        artist={item.artist || ''}
                        year={item.year}
                        size="md"
                        className="w-16 h-16 sm:w-20 sm:h-20"
                      />

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-[#18181B] truncate">
                            {item.title}
                          </h4>
                          {inCollection && (
                            <span className="text-[10px] font-bold bg-[#ECFDF5] text-[#059669] px-2 py-0.5 rounded border border-[#A7F3D0]">
                              ✓ Na Coleção
                            </span>
                          )}
                          {inWishlist && (
                            <span className="text-[10px] font-bold bg-[#FFE4E6] text-[#E11D48] px-2 py-0.5 rounded border border-[#FECDD3]">
                              ♡ Na Lista de Desejos
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#71717A] font-semibold truncate">{item.artist}</p>

                        <div className="flex items-center gap-2 text-[11px] text-[#71717A] font-mono flex-wrap">
                          {item.year && item.year > 0 && (
                            <span className="bg-white border border-[#E4E4E7] px-1.5 py-0.5 rounded text-[#18181B] font-bold">
                              {item.year}
                            </span>
                          )}
                          {item.country && <span>{item.country}</span>}
                          {item.label && <span className="truncate max-w-[120px]">{item.label}</span>}
                          {item.trackCount && <span>{item.trackCount} faixas</span>}
                        </div>

                        {/* Format selector pill on item */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-[#71717A] font-semibold">Formato:</span>
                          <button
                            type="button"
                            onClick={() => setSelectedFormats((prev) => ({ ...prev, [itemKey]: 'CD' }))}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md border cursor-pointer transition-colors ${
                              chosenFormat === 'CD'
                                ? 'bg-[#18181B] text-white border-[#18181B]'
                                : 'bg-white text-[#71717A] border-[#E4E4E7]'
                            }`}
                          >
                            CD
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedFormats((prev) => ({ ...prev, [itemKey]: 'Vinyl' }))}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md border cursor-pointer transition-colors ${
                              chosenFormat === 'Vinyl'
                                ? 'bg-[#18181B] text-white border-[#18181B]'
                                : 'bg-white text-[#71717A] border-[#E4E4E7]'
                            }`}
                          >
                            Vinil
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons: Direct Add to Collection or Add to Wishlist */}
                    <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-end justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E4E4E7]">
                      <button
                        onClick={() => handleTriggerAddToCollection(item, chosenFormat)}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap ${
                          inCollection 
                            ? 'bg-[#E4E4E7] text-[#71717A] cursor-not-allowed opacity-80' 
                            : 'bg-[#18181B] hover:bg-[#27272A] text-white'
                        }`}
                        title={inCollection ? 'Já adicionado à coleção' : 'Adicionar à coleção'}
                      >
                        <Library className="w-3.5 h-3.5" />
                        <span>{inCollection ? 'Já na Coleção' : 'Adicionar à coleção'}</span>
                      </button>

                      <button
                        onClick={() => handleTriggerAddToWishlist(item, chosenFormat)}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border shadow-xs transition-all cursor-pointer whitespace-nowrap ${
                          inWishlist 
                            ? 'bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3] opacity-80'
                            : 'bg-white hover:bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3]'
                        }`}
                        title={inWishlist ? 'Já na Lista de Desejos' : 'Guardar na Lista de Desejos'}
                      >
                        <Heart className="w-3.5 h-3.5 fill-[#E11D48] text-[#E11D48]" />
                        <span>{inWishlist ? 'Já nos Desejos' : '♡ Lista de Desejos'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : hasSearched ? (
            <div className="py-12 text-center text-[#71717A] space-y-2">
              <p className="text-sm font-bold text-[#18181B]">Nenhum resultado encontrado no MusicBrainz</p>
              <p className="text-xs">Verifica se o nome está bem escrito ou adiciona o álbum manualmente.</p>
              <button
                onClick={() => setManualMode(true)}
                className="mt-3 inline-flex items-center gap-1 text-xs text-[#18181B] hover:underline font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar registo manual
              </button>
            </div>
          ) : (
            <div className="py-16 text-center text-[#A1A1AA] space-y-2">
              <Disc className="w-10 h-10 mx-auto text-[#D4D4D8] animate-spin-slow" />
              <p className="text-xs font-medium">Digita o nome do álbum ou artista para começar a pesquisar.</p>
            </div>
          )}
        </div>
      </div>

      {/* QUICK WISHLIST OPTIONS POPUP */}
      {selectedForWishlist && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
              <div className="flex items-center gap-2 text-[#E11D48] font-bold text-sm">
                <Heart className="w-4 h-4 fill-[#E11D48]" />
                <span>Adicionar à Lista de Desejos ({selectedForWishlist.mediaFormat === 'Vinyl' ? 'Vinil' : 'CD'})</span>
              </div>
              <button
                onClick={() => setSelectedForWishlist(null)}
                className="text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 bg-[#FAFAFA] p-3 rounded-xl border border-[#E4E4E7]">
              <CDCover
                coverUrl={selectedForWishlist.coverUrl}
                title={selectedForWishlist.title || ''}
                artist={selectedForWishlist.artist || ''}
                year={selectedForWishlist.year}
                size="sm"
                className="w-12 h-12"
              />
              <div className="min-w-0">
                <p className="font-bold text-sm text-[#18181B] truncate">{selectedForWishlist.title}</p>
                <p className="text-xs text-[#71717A] font-medium truncate">{selectedForWishlist.artist} ({selectedForWishlist.year})</p>
                <span className="text-[10px] font-bold text-[#18181B] bg-white border border-[#E4E4E7] px-1.5 py-0.2 rounded mt-0.5 inline-block">
                  {selectedForWishlist.mediaFormat === 'Vinyl' ? 'Vinil' : 'CD'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#18181B] font-bold mb-1">
                  Preço pretendido (opcional)
                </label>
                <input
                  type="text"
                  value={desiredPriceInput}
                  onChange={(e) => setDesiredPriceInput(e.target.value)}
                  placeholder="Ex: 15 €"
                  className="w-full px-3 py-2 bg-[#F4F4F5] text-[#18181B] rounded-lg border border-[#E4E4E7] focus:border-[#18181B] focus:bg-white outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[#18181B] font-bold mb-1">
                  Notas de compra (opcional)
                </label>
                <textarea
                  rows={2}
                  value={purchaseNotesInput}
                  onChange={(e) => setPurchaseNotesInput(e.target.value)}
                  placeholder="Ex: procurar edição deluxe / remaster 2011"
                  className="w-full px-3 py-2 bg-[#F4F4F5] text-[#18181B] rounded-lg border border-[#E4E4E7] focus:border-[#18181B] focus:bg-white outline-none resize-none font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSelectedForWishlist(null)}
                className="flex-1 py-2 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmWishlistAdd}
                className="flex-1 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>Confirmar nos Desejos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DUPLICATE NOTICE / ACTION MODAL */}
      {duplicateNotice && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-xl space-y-4">
            
            {duplicateNotice.type === 'prompt_move_wishlist' ? (
              /* Case: In wishlist, prompt to move to collection */
              <>
                <div className="flex items-center gap-2.5 text-[#059669]">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <h4 className="font-extrabold text-sm text-[#09090B]">
                    {duplicateNotice.title}
                  </h4>
                </div>

                <p className="text-xs text-[#71717A] leading-relaxed font-medium">
                  {duplicateNotice.description}
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setDuplicateNotice(null)}
                    className="flex-1 py-2 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      if (duplicateNotice.matchedItem) {
                        onMoveWishlistToCollection(duplicateNotice.matchedItem);
                      } else {
                        onAddToCollection(duplicateNotice.targetCD);
                      }
                      setDuplicateNotice(null);
                      onClose();
                    }}
                    className="flex-1 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Mover para Coleção</span>
                  </button>
                </div>
              </>
            ) : (
              /* Case: Duplicate block */
              <>
                <div className="flex items-center gap-2.5 text-amber-600">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <h4 className="font-extrabold text-sm text-[#09090B]">
                    {duplicateNotice.title}
                  </h4>
                </div>

                <p className="text-xs text-[#71717A] leading-relaxed font-medium">
                  {duplicateNotice.description}
                </p>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={() => setDuplicateNotice(null)}
                    className="px-4 py-2 bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
