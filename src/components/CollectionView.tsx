import React, { useState, useMemo } from 'react';
import { 
  Search, 
  LayoutGrid, 
  List as ListIcon, 
  Users, 
  Disc, 
  Star, 
  ChevronRight, 
  ArrowLeft,
  Radio,
  Sparkles,
  Coins,
  Tag
} from 'lucide-react';
import { CDItem, ViewMode, DisplayLayout, MediaFormat } from '../types';
import { CDCover } from './CDCover';
import { getItemMarketPrice, calculateTotalMarketValue, formatCurrency } from '../services/musicBrainz';

interface CollectionViewProps {
  collection: CDItem[];
  onSelectCD: (cd: CDItem) => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({
  collection,
  onSelectCD,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('cds');
  const [layout, setLayout] = useState<DisplayLayout>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'all' | MediaFormat>('all');
  const [sortBy, setSortBy] = useState<'artist' | 'title' | 'year' | 'rating' | 'recent'>('artist');
  const [selectedBand, setSelectedBand] = useState<string | null>(null);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let list = [...collection];

    // Format filter
    if (selectedFormat !== 'all') {
      list = list.filter((item) => (item.mediaFormat || 'CD') === selectedFormat);
    }

    // Specific selected band filter
    if (selectedBand) {
      list = list.filter((c) => c.artist.toLowerCase() === selectedBand.toLowerCase());
    }

    // Text search query filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.artist.toLowerCase().includes(q) ||
          (item.shelfLocation && item.shelfLocation.toLowerCase().includes(q))
      );
    }

    // Sort items
    list.sort((a, b) => {
      switch (sortBy) {
        case 'artist':
          return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'year':
          return (b.year || 0) - (a.year || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'recent':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        default:
          return 0;
      }
    });

    return list;
  }, [collection, selectedBand, searchTerm, sortBy, selectedFormat]);

  // Group by Bands / Artists for the 'Bandas' view
  const groupedBands = useMemo(() => {
    const map = new Map<string, CDItem[]>();
    
    // Apply search filter to bands if any
    const baseList = searchTerm.trim()
      ? collection.filter(
          (item) =>
            item.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : collection;

    for (const item of baseList) {
      const current = map.get(item.artist) || [];
      current.push(item);
      map.set(item.artist, current);
    }

    const entries = Array.from(map.entries()).map(([artist, cds]) => {
      const years = cds.map((c) => c.year).filter((y) => y > 0);
      const minYear = years.length > 0 ? Math.min(...years) : undefined;
      const maxYear = years.length > 0 ? Math.max(...years) : undefined;
      const totalMarketValue = calculateTotalMarketValue(cds);

      return {
        artist,
        cds,
        count: cds.length,
        minYear,
        maxYear,
        totalMarketValue,
      };
    });

    return entries.sort((a, b) => a.artist.localeCompare(b.artist));
  }, [collection, searchTerm]);

  // Overall and filtered total collection market values
  const totalCollectionValue = useMemo(() => calculateTotalMarketValue(collection), [collection]);
  const filteredValue = useMemo(() => calculateTotalMarketValue(filteredItems), [filteredItems]);
  const isFiltered = searchTerm.trim().length > 0 || selectedFormat !== 'all' || selectedBand !== null;

  return (
    <div className="space-y-6">
      {/* Active Filter Banner when drilled down into a band */}
      {selectedBand && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-[#E4E4E7] shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedBand(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#18181B] hover:text-[#52525B] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar a Todas as Bandas</span>
            </button>
            <div className="h-4 w-px bg-[#E4E4E7]" />
            <span className="text-sm font-extrabold text-[#09090B]">
              {selectedBand} ({filteredItems.length} {filteredItems.length === 1 ? 'álbum' : 'álbuns'})
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-[#71717A] text-[11px]">Valor desta banda:</span>
            <span className="font-bold text-emerald-950 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              {formatCurrency(filteredValue)}
            </span>
          </div>
        </div>
      )}

      {/* Collection Stats Summary Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-[#E4E4E7] shadow-xs">
        <div className="flex items-center gap-3 flex-wrap text-xs text-[#71717A]">
          <div className="flex items-center gap-1.5">
            <Disc className="w-4 h-4 text-[#18181B]" />
            <span className="font-bold text-[#18181B]">{collection.length}</span>
            <span>registos no arquivo</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="font-bold text-[#18181B]">{groupedBands.length}</span>
            <span>bandas / artistas</span>
          </div>
        </div>

        {/* Total Collection Market Value Badge */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-2xs">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] text-emerald-800 font-medium">
              {isFiltered ? 'Valor Filtrado:' : 'Valor Total Coleção:'}
            </span>
            <span className="font-mono font-bold text-emerald-950">
              {formatCurrency(isFiltered ? filteredValue : totalCollectionValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E4E4E7] shadow-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={viewMode === 'bands' ? "Pesquisar banda..." : "Pesquisar banda, álbum, prateleira..."}
            className="w-full pl-9 pr-8 py-2 bg-[#F4F4F5] text-xs text-[#18181B] placeholder-[#A1A1AA] font-medium rounded-lg border border-[#E4E4E7] focus:border-[#18181B] focus:bg-white outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#71717A] hover:text-[#18181B]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Badges & Sorters */}
        <div className="flex items-center gap-2.5 flex-wrap justify-between lg:justify-end">
          
          {/* Organization: [ Álbuns ] [ Bandas ] segmented control */}
          <div className="flex bg-[#F4F4F5] p-1 rounded-lg border border-[#E4E4E7]">
            <button
              onClick={() => {
                setViewMode('cds');
                setSelectedBand(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === 'cds' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Coleção ({collection.length})</span>
            </button>
            <button
              onClick={() => setViewMode('bands')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === 'bands' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Bandas ({groupedBands.length})</span>
            </button>
          </div>

          {/* Format Filter: Todos / CDs / Vinis */}
          {viewMode === 'cds' && (
            <div className="flex bg-[#F4F4F5] p-1 rounded-lg border border-[#E4E4E7]">
              <button
                onClick={() => setSelectedFormat('all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  selectedFormat === 'all' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedFormat('CD')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  selectedFormat === 'CD' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <Disc className="w-3 h-3" />
                <span>CD</span>
              </button>
              <button
                onClick={() => setSelectedFormat('Vinyl')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  selectedFormat === 'Vinyl' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>Vinil</span>
              </button>
            </div>
          )}

          {/* Sort Dropdown (only in CDs view) */}
          {viewMode === 'cds' && (
            <div className="flex items-center gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-semibold bg-white text-[#18181B] border border-[#E4E4E7] rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:border-[#18181B] transition-colors"
              >
                <option value="artist">Banda A-Z</option>
                <option value="title">Álbum A-Z</option>
                <option value="year">Ano</option>
                <option value="rating">Classificação</option>
                <option value="recent">Mais Recentes</option>
              </select>
            </div>
          )}

          {/* Layout Toggle (only in CDs view) */}
          {viewMode === 'cds' && (
            <div className="flex items-center p-0.5 bg-[#F4F4F5] rounded-lg border border-[#E4E4E7]">
              <button
                onClick={() => setLayout('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  layout === 'grid' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
                }`}
                title="Grelha"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLayout('list')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  layout === 'list' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
                }`}
                title="Lista"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODE: BANDAS */}
      {viewMode === 'bands' && !selectedBand ? (
        groupedBands.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#E4E4E7] shadow-xs">
            <Users className="w-12 h-12 text-[#A1A1AA] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#18181B]">Nenhuma banda encontrada</h3>
            <p className="text-xs text-[#71717A] mt-1 mb-4 font-medium">
              Tenta ajustar os termos de pesquisa.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {groupedBands.map((band) => (
              <div
                key={band.artist}
                onClick={() => {
                  setSelectedBand(band.artist);
                  setViewMode('cds');
                }}
                className="group bg-white hover:bg-[#FAFAFA] p-4 rounded-xl border border-[#E4E4E7] hover:border-[#18181B] transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-sm"
              >
                <div>
                  {/* Album Cover collage preview */}
                  <div className="grid grid-cols-3 gap-1.5 mb-3 bg-[#F4F4F5] p-2 rounded-lg border border-[#E4E4E7]">
                    {band.cds.slice(0, 3).map((cd) => (
                      <div key={cd.id} className="aspect-square rounded overflow-hidden">
                        <CDCover
                          coverUrl={cd.coverUrl}
                          title={cd.title}
                          artist={cd.artist}
                          year={cd.year}
                          size="sm"
                          className="w-full h-full"
                        />
                      </div>
                    ))}
                    {band.cds.length < 3 &&
                      Array.from({ length: 3 - band.cds.length }).map((_, idx) => (
                        <div
                          key={idx}
                          className="aspect-square bg-[#E4E4E7]/40 rounded flex items-center justify-center border border-dashed border-[#D4D4D8]"
                        >
                          <Disc className="w-3.5 h-3.5 text-[#A1A1AA]" />
                        </div>
                      ))}
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#09090B] group-hover:text-black truncate">
                      {band.artist}
                    </h4>
                    <div className="text-xs text-[#71717A] font-medium flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#18181B]">{band.count} {band.count === 1 ? 'álbum' : 'álbuns'}</span>
                        {band.minYear && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[11px]">
                              {band.minYear === band.maxYear ? band.minYear : `${band.minYear}–${band.maxYear}`}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-950 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="Valor total dos discos desta banda">
                        ~{formatCurrency(band.totalMarketValue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E4E4E7] flex items-center justify-between text-xs text-[#71717A] group-hover:text-[#18181B] font-bold">
                  <span>Ver discografia</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* VIEW MODE: CDS & VINIS (Grid or List) */
        filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#E4E4E7] shadow-xs">
            <Disc className="w-12 h-12 text-[#A1A1AA] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#18181B]">Nenhum registo encontrado</h3>
            <p className="text-xs text-[#71717A] mt-1 mb-4 font-medium">
              Tenta ajustar os termos de pesquisa ou o filtro de formato.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedFormat('all');
                setSelectedBand(null);
              }}
              className="px-3.5 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Limpar filtros
            </button>
          </div>
        ) : layout === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredItems.map((cd) => (
              <div
                key={cd.id}
                onClick={() => onSelectCD(cd)}
                className="group bg-white hover:bg-[#FAFAFA] p-3 rounded-xl border border-[#E4E4E7] hover:border-[#18181B] transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-sm"
              >
                <div>
                  <div className="relative mb-2.5">
                    <CDCover
                      coverUrl={cd.coverUrl}
                      title={cd.title}
                      artist={cd.artist}
                      year={cd.year}
                      size="md"
                      className="w-full aspect-square"
                    />

                    {/* Format Badge (CD or Vinyl) */}
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <span className="flex items-center gap-1 text-[9px] font-bold bg-black/75 text-white px-1.5 py-0.5 rounded backdrop-blur-xs shadow-2xs">
                        {cd.mediaFormat === 'Vinyl' ? 'Vinil' : 'CD'}
                      </span>
                    </div>

                    {/* Rating Stars */}
                    {cd.rating && cd.rating > 0 && (
                      <div className="absolute bottom-1.5 right-1.5 z-10 flex items-center bg-black/80 text-amber-300 px-1.5 py-0.5 rounded text-[10px] backdrop-blur-xs font-mono font-bold shadow-2xs">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-1" />
                        {cd.rating}
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs text-[#18181B] truncate leading-tight">
                      {cd.title}
                    </h4>
                    <p className="text-[11px] text-[#71717A] font-medium truncate">{cd.artist}</p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#E4E4E7] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-[#71717A] font-mono">
                    <span className="font-bold text-[#18181B]">{cd.year || '—'}</span>
                    {/* Etiqueta discreta de valor de mercado */}
                    <span 
                      className="text-[10px] font-mono font-semibold text-[#18181B] bg-[#F4F4F5] px-1.5 py-0.5 rounded border border-[#E4E4E7]"
                      title="Valor estimado de mercado"
                    >
                      {getItemMarketPrice(cd)}
                    </span>
                  </div>
                  {cd.shelfLocation && (
                    <div className="text-[10px] text-[#71717A] truncate">
                      <span className="text-[#18181B] bg-[#F4F4F5] px-1.5 py-0.5 rounded font-sans truncate block border border-[#E4E4E7]">
                        {cd.shelfLocation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((cd) => (
              <div
                key={cd.id}
                onClick={() => onSelectCD(cd)}
                className="group bg-white hover:bg-[#FAFAFA] p-3 rounded-xl border border-[#E4E4E7] hover:border-[#18181B] transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CDCover
                    coverUrl={cd.coverUrl}
                    title={cd.title}
                    artist={cd.artist}
                    year={cd.year}
                    size="sm"
                    className="w-12 h-12"
                  />

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-[#18181B] truncate">
                        {cd.title}
                      </h4>
                      <span className="text-[10px] font-bold bg-[#F4F4F5] text-[#18181B] px-1.5 py-0.5 rounded border border-[#E4E4E7]">
                        {cd.mediaFormat === 'Vinyl' ? 'Vinil' : 'CD'}
                      </span>
                    </div>
                    <p className="text-xs text-[#71717A] font-medium truncate">{cd.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs font-mono text-[#71717A] shrink-0">
                  {/* Etiqueta discreta de valor de mercado */}
                  <span 
                    className="text-xs font-mono font-semibold text-[#18181B] bg-[#F4F4F5] px-2 py-0.5 rounded border border-[#E4E4E7]"
                    title="Valor estimado de mercado"
                  >
                    {getItemMarketPrice(cd)}
                  </span>
                  {cd.year > 0 && <span className="font-bold text-[#18181B]">{cd.year}</span>}
                  {cd.shelfLocation && (
                    <span className="hidden md:inline bg-[#F4F4F5] px-2 py-0.5 rounded text-[#18181B] font-sans border border-[#E4E4E7]">
                      {cd.shelfLocation}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
