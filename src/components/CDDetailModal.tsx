import React, { useState, useEffect } from 'react';
import { 
  X, 
  Heart, 
  Check, 
  Trash2, 
  Edit3, 
  Save, 
  Calendar, 
  Disc, 
  Music, 
  MapPin, 
  Upload, 
  Star,
  Radio
} from 'lucide-react';
import { CDItem, MediaFormat } from '../types';
import { CDCover } from './CDCover';
import { estimateMarketPrice } from '../services/musicBrainz';

interface CDDetailModalProps {
  cd: CDItem | null;
  isOpen: boolean;
  onClose: () => void;
  onMoveToCollection: (cd: CDItem) => void;
  onRemove: (id: string, status: 'wishlist' | 'collection' | 'loaned') => void;
  onUpdateCD: (updated: CDItem) => void;
}

export const CDDetailModal: React.FC<CDDetailModalProps> = ({
  cd,
  isOpen,
  onClose,
  onMoveToCollection,
  onRemove,
  onUpdateCD,
}) => {
  if (!isOpen || !cd) return null;

  const isWishlist = cd.status === 'wishlist';

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(cd.title);
  const [editArtist, setEditArtist] = useState(cd.artist);
  const [editYear, setEditYear] = useState(cd.year);
  const [editFormat, setEditFormat] = useState<MediaFormat>(cd.mediaFormat || 'CD');
  const [editMarketPrice, setEditMarketPrice] = useState(cd.marketPrice || '');
  const [editDesiredPrice, setEditDesiredPrice] = useState(cd.desiredPrice || '');
  const [editPurchaseNotes, setEditPurchaseNotes] = useState(cd.purchaseNotes || '');
  const [editShelfLocation, setEditShelfLocation] = useState(cd.shelfLocation || '');
  const [editCondition, setEditCondition] = useState<CDItem['condition']>(cd.condition || 'Mint');
  const [editRating, setEditRating] = useState(cd.rating || 5);
  const [editCoverUrl, setEditCoverUrl] = useState<string | undefined>(cd.coverUrl);

  // Cover upload picker state
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  // Sync state whenever cd changes
  useEffect(() => {
    if (cd) {
      setEditTitle(cd.title);
      setEditArtist(cd.artist);
      setEditYear(cd.year);
      setEditFormat(cd.mediaFormat || 'CD');
      setEditMarketPrice(cd.marketPrice || '');
      setEditDesiredPrice(cd.desiredPrice || '');
      setEditPurchaseNotes(cd.purchaseNotes || '');
      setEditShelfLocation(cd.shelfLocation || '');
      setEditCondition(cd.condition || 'Mint');
      setEditRating(cd.rating || 5);
      setEditCoverUrl(cd.coverUrl);
      setIsEditing(false);
      setShowCoverPicker(false);
    }
  }, [cd?.id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setEditCoverUrl(base64);
        setShowCoverPicker(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (inputUrl.trim()) {
      setEditCoverUrl(inputUrl.trim());
      setInputUrl('');
      setShowCoverPicker(false);
    }
  };

  const handleSave = () => {
    onUpdateCD({
      ...cd,
      title: editTitle.trim() || cd.title,
      artist: editArtist.trim() || cd.artist,
      year: Number(editYear) || cd.year,
      mediaFormat: editFormat,
      coverUrl: editCoverUrl,
      marketPrice: editMarketPrice.trim() || undefined,
      desiredPrice: editDesiredPrice.trim() || undefined,
      purchaseNotes: editPurchaseNotes.trim() || undefined,
      shelfLocation: editShelfLocation.trim() || undefined,
      condition: editCondition as any,
      rating: editRating,
    });
    setIsEditing(false);
  };

  const formatDisplay = cd.mediaFormat === 'Vinyl' ? 'Vinil' : 'CD';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-[#E4E4E7] rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* TOP STATUS HEADER */}
        <div className="p-4 sm:p-5 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            {isWishlist ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3]">
                <Heart className="w-3.5 h-3.5 fill-[#E11D48]" />
                Lista de Desejos
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                <Check className="w-3.5 h-3.5" />
                Na Coleção
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F4F4F5] text-[#18181B] border border-[#E4E4E7]">
              {cd.mediaFormat === 'Vinyl' ? <Radio className="w-3 h-3 text-[#71717A]" /> : <Disc className="w-3 h-3 text-[#71717A]" />}
              {formatDisplay}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL MAIN CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            
            {/* ALBUM COVER */}
            <div className="w-full sm:w-48 shrink-0 flex flex-col items-center">
              <CDCover
                coverUrl={isEditing ? editCoverUrl : cd.coverUrl}
                title={isEditing ? editTitle : cd.title}
                artist={isEditing ? editArtist : cd.artist}
                year={isEditing ? editYear : cd.year}
                size="lg"
                className="w-full aspect-square shadow-sm"
              />

              {isEditing && (
                <div className="mt-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => setShowCoverPicker(!showCoverPicker)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-lg border border-[#E4E4E7] transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Mudar Capa</span>
                  </button>

                  {showCoverPicker && (
                    <div className="mt-2 p-2.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl space-y-2 text-xs">
                      <label className="block font-bold text-[#18181B]">
                        Carregar ficheiro:
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="block w-full text-[11px] mt-1 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#18181B] file:text-white hover:file:bg-black cursor-pointer"
                        />
                      </label>

                      <div className="flex gap-1">
                        <input
                          type="url"
                          value={inputUrl}
                          onChange={(e) => setInputUrl(e.target.value)}
                          placeholder="Ou colar link URL..."
                          className="flex-1 px-2 py-1 bg-white border border-[#E4E4E7] rounded-lg text-xs outline-none focus:border-[#18181B]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyUrl}
                          className="px-2.5 py-1 bg-[#18181B] text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DETAILS / EDIT FORM */}
            <div className="flex-1 space-y-2.5 w-full">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#71717A] uppercase">Álbum</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg text-sm text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#71717A] uppercase">Banda / Artista</label>
                    <input
                      type="text"
                      value={editArtist}
                      onChange={(e) => setEditArtist(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg text-sm text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#71717A] uppercase">Ano</label>
                      <input
                        type="number"
                        value={editYear}
                        onChange={(e) => setEditYear(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      />
                    </div>

                    {/* FORMAT SELECTOR */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#71717A] uppercase">Formato</label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditFormat('CD')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1 ${
                            editFormat === 'CD'
                              ? 'bg-[#18181B] text-white border-[#18181B]'
                              : 'bg-white text-[#71717A] border-[#E4E4E7]'
                          }`}
                        >
                          <Disc className="w-3 h-3" />
                          <span>CD</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditFormat('Vinyl')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1 ${
                            editFormat === 'Vinyl'
                              ? 'bg-[#18181B] text-white border-[#18181B]'
                              : 'bg-white text-[#71717A] border-[#E4E4E7]'
                          }`}
                        >
                          <Radio className="w-3 h-3" />
                          <span>Vinil</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#71717A] uppercase">Preço de Mercado (Ref.)</label>
                    <input
                      type="text"
                      value={editMarketPrice}
                      onChange={(e) => setEditMarketPrice(e.target.value)}
                      placeholder="ex: ~14,50 €"
                      className="w-full px-3 py-1.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  {!isWishlist && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-[#71717A] uppercase">Localização / Prateleira</label>
                        <input
                          type="text"
                          value={editShelfLocation}
                          onChange={(e) => setEditShelfLocation(e.target.value)}
                          placeholder="ex: Prateleira A2"
                          className="w-full px-3 py-1.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#71717A] uppercase">Estado de Conservação</label>
                        <select
                          value={editCondition}
                          onChange={(e) => setEditCondition(e.target.value as CDItem['condition'])}
                          className="w-full px-3 py-1.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        >
                          <option value="Mint">Mint (Impecável / Como Novo)</option>
                          <option value="Very Good">Very Good (Muito Bom)</option>
                          <option value="Good">Good (Bom com marcas de uso)</option>
                          <option value="Fair">Fair (Razoável)</option>
                          <option value="Sealed">Sealed (Selado de Fábrica)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {isWishlist && (
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-[#71717A] uppercase">Preço Alvo</label>
                        <input
                          type="text"
                          value={editDesiredPrice}
                          onChange={(e) => setEditDesiredPrice(e.target.value)}
                          placeholder="ex: 15€ ou eBay / Fnac"
                          className="w-full px-3 py-1.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#71717A] uppercase">Notas de Compra</label>
                        <textarea
                          value={editPurchaseNotes}
                          onChange={(e) => setEditPurchaseNotes(e.target.value)}
                          placeholder="Links, lojas ou versão desejada..."
                          rows={2}
                          className="w-full px-3 py-1.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#09090B] tracking-tight leading-tight">{cd.title}</h3>
                    <p className="text-sm font-semibold text-[#52525B]">{cd.artist}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-[#F4F4F5] px-2.5 py-1 rounded-md text-[#18181B] border border-[#E4E4E7]">
                      <Calendar className="w-3 h-3 text-[#71717A]" />
                      {cd.year || 'Ano N/D'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#F4F4F5] px-2.5 py-1 rounded-md text-[#18181B] border border-[#E4E4E7]">
                      {cd.mediaFormat === 'Vinyl' ? <Radio className="w-3 h-3 text-[#71717A]" /> : <Disc className="w-3 h-3 text-[#71717A]" />}
                      {formatDisplay}
                    </span>
                    {cd.label && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-[#F4F4F5] px-2.5 py-1 rounded-md text-[#71717A] border border-[#E4E4E7]">
                        {cd.label}
                      </span>
                    )}
                  </div>

                  {/* Wishlist-specific details */}
                  {isWishlist && (
                    <div className="bg-[#FFF1F2] border border-[#FFE4E6] p-3.5 rounded-xl space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#E11D48]">Preço / Orçamento Alvo:</span>
                        <span className="font-mono font-bold text-[#18181B]">{cd.desiredPrice || 'Ainda não definido'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#FECDD3]">
                        <span className="text-[#71717A]">Preço de Mercado (Ref.):</span>
                        <span className="font-mono font-semibold text-[#18181B] bg-white px-2 py-0.5 rounded border border-[#FECDD3]">
                          {cd.marketPrice || estimateMarketPrice(cd, cd.mediaFormat || 'CD')}
                        </span>
                      </div>
                      {cd.purchaseNotes && (
                        <div className="text-xs text-[#52525B] pt-1 border-t border-[#FECDD3]">
                          <span className="font-bold text-[#18181B] block mb-0.5">Notas de compra:</span>
                          <p className="whitespace-pre-line">{cd.purchaseNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collection-specific details */}
                  {!isWishlist && (
                    <div className="bg-[#FAFAFA] border border-[#E4E4E7] p-3.5 rounded-xl space-y-2 text-xs mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[#71717A] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          Localização no Arquivo:
                        </span>
                        <span className="font-bold text-[#18181B]">{cd.shelfLocation || 'Prateleira Geral'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#71717A] flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          Estado de Conservação:
                        </span>
                        <span className="text-[#059669] font-bold">{cd.condition || 'Mint'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[#E4E4E7]">
                        <span className="text-[#71717A]">Preço de Mercado (Ref.):</span>
                        <span className="font-mono font-semibold text-[#18181B] bg-white px-2 py-0.5 rounded border border-[#E4E4E7]">
                          {cd.marketPrice || estimateMarketPrice(cd, cd.mediaFormat || 'CD')}
                        </span>
                      </div>
                    </div>
                  )}

                  {cd.addedToCollectionDate && (
                    <p className="text-[11px] text-[#71717A] font-mono pt-1">
                      Adicionado à coleção em: {new Date(cd.addedToCollectionDate).toLocaleDateString('pt-PT')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tracklist if available */}
          {cd.tracks && cd.tracks.length > 0 && (
            <div className="space-y-2 border-t border-[#E4E4E7] pt-4">
              <h4 className="text-xs font-bold text-[#18181B] uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#71717A]" />
                Alinhamento de Faixas ({cd.tracks.length})
              </h4>
              <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#E4E4E7] max-h-48 overflow-y-auto divide-y divide-[#E4E4E7]">
                {cd.tracks.map((track, i) => (
                  <div key={i} className="py-1.5 flex items-center justify-between text-xs text-[#18181B]">
                    <span className="font-mono text-[#71717A] w-6">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 truncate font-medium">{track}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="p-4 sm:p-5 border-t border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Alterações</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F4F4F5] text-[#18181B] border border-[#E4E4E7] text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            )}

            <button
              onClick={() => {
                onRemove(cd.id, cd.status);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-[#E11D48] hover:bg-[#FFE4E6] rounded-xl transition-colors text-xs font-bold cursor-pointer"
              title={isWishlist ? 'Remover da Lista de Desejos' : 'Remover da Coleção'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isWishlist ? 'Remover da Lista de Desejos' : 'Remover'}</span>
            </button>
          </div>

          {/* MAIN JÁ COMPREI ACTION FOR WISHLIST */}
          {isWishlist && (
            <button
              onClick={() => {
                onMoveToCollection(cd);
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#059669] hover:bg-[#047857] active:bg-[#065F46] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>✓ Já comprei</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
