import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, LocateFixed, MapPin, Maximize2, Minimize2, Minus, Plus, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore, type CoffeeOrigin } from '../context/StoreContext';
import { MediaImage } from './MediaImage';

interface VietnamOriginMapProps {
  compact?: boolean;
}

type MapLayerMode = 'satellite' | 'terrain' | 'street';
type MacroZone = 'all' | 'tay_nguyen' | 'tay_bac' | 'mien_trung' | 'dong_nam_bo';

const ZONE_SLUGS: Record<Exclude<MacroZone, 'all'>, string[]> = {
  tay_nguyen: ['dak-lak', 'lam-dong', 'gia-lai', 'dak-nong', 'kon-tum'],
  tay_bac: ['son-la', 'dien-bien'],
  mien_trung: ['quang-tri', 'nghe-an'],
  dong_nam_bo: ['dong-nai'],
};

const REGION_DETAILS: Record<
  string,
  {
    zoneVi: string;
    zoneEn: string;
    harvestVi: string;
    harvestEn: string;
    soilVi: string;
    soilEn: string;
    climateVi: string;
    climateEn: string;
  }
> = {
  'dak-lak': {
    zoneVi: 'Tây Nguyên',
    zoneEn: 'Central Highlands',
    harvestVi: 'Tháng 11 – Tháng 1',
    harvestEn: 'Nov – Jan',
    soilVi: 'Đất đỏ bazan tơi xốp giàu khoáng chất',
    soilEn: 'Deep mineral-rich red basaltic soil',
    climateVi: 'Nhiệt đới cao nguyên, 2 mùa mưa nắng rõ rệt',
    climateEn: 'Highland tropical with distinct wet/dry seasons',
  },
  'lam-dong': {
    zoneVi: 'Tây Nguyên',
    zoneEn: 'Central Highlands',
    harvestVi: 'Tháng 11 – Tháng 2',
    harvestEn: 'Nov – Feb',
    soilVi: 'Đất feralit nâu đỏ & đất bazan núi cao',
    soilEn: 'Highland ferralic & red-brown basaltic soil',
    climateVi: 'Ôn hòa quanh năm (15–24°C), sương mù sáng sớm',
    climateEn: 'Cool mountain climate (15–24°C), morning mist',
  },
  'gia-lai': {
    zoneVi: 'Tây Nguyên',
    zoneEn: 'Central Highlands',
    harvestVi: 'Tháng 11 – Tháng 1',
    harvestEn: 'Nov – Jan',
    soilVi: 'Đất đỏ bazan cao nguyên Pleiku',
    soilEn: 'Pleiku plateau red basaltic soil',
    climateVi: 'Nắng khô ổn định thuận lợi phơi giàn',
    climateEn: 'Dry sunny winter ideal for raised-bed drying',
  },
  'dak-nong': {
    zoneVi: 'Tây Nguyên',
    zoneEn: 'Central Highlands',
    harvestVi: 'Tháng 11 – Tháng 2',
    harvestEn: 'Nov – Feb',
    soilVi: 'Đất bazan nâu đỏ & cao nguyên M’Nông',
    soilEn: 'M’Nông plateau weathered basalt',
    climateVi: 'Đêm mát độ ẩm cao, quả chín chậm ngọt vị',
    climateEn: 'Cool nights slow maturation and boost sweetness',
  },
  'kon-tum': {
    zoneVi: 'Tây Nguyên',
    zoneEn: 'Central Highlands',
    harvestVi: 'Tháng 11 – Tháng 2',
    harvestEn: 'Nov – Feb',
    soilVi: 'Đất phù sa cổ Đắk Hà & đất núi cao Măng Đen',
    soilEn: 'Đắk Hà valley alluvium & Măng Đen highland loam',
    climateVi: 'Bắc Tây Nguyên, tiểu vùng Măng Đen mát quanh năm',
    climateEn: 'Northern Highlands with cool Măng Đen microclimate',
  },
  'son-la': {
    zoneVi: 'Tây Bắc',
    zoneEn: 'Northwest Mountains',
    harvestVi: 'Tháng 10 – Tháng 1',
    harvestEn: 'Oct – Jan',
    soilVi: 'Đất feralit trên núi đá vôi độ dốc cao',
    soilEn: 'Limestone mountain ferralic slopes',
    climateVi: 'Chênh lệch nhiệt độ ngày – đêm lớn, mùa đông lạnh',
    climateEn: 'Wide diurnal range with crisp winter mornings',
  },
  'dien-bien': {
    zoneVi: 'Tây Bắc',
    zoneEn: 'Northwest Mountains',
    harvestVi: 'Tháng 11 – Tháng 2',
    harvestEn: 'Nov – Feb',
    soilVi: 'Đất đỏ vàng vùng núi Mường Ảng',
    soilEn: 'Mường Ảng mountain red-yellow loam',
    climateVi: 'Khí hậu núi cao Tây Bắc mát mẻ',
    climateEn: 'Cool Northwest highland valley climate',
  },
  'quang-tri': {
    zoneVi: 'Bắc Trung Bộ',
    zoneEn: 'North Central Coast',
    harvestVi: 'Tháng 10 – Tháng 1',
    harvestEn: 'Oct – Jan',
    soilVi: 'Đất bazan thung lũng Khe Sanh – Trường Sơn',
    soilEn: 'Khe Sanh – Trường Sơn volcanic foothill soil',
    climateVi: 'Giao thoa gió Lào và không khí lạnh sườn Đông Trường Sơn',
    climateEn: 'Monsoon transition along eastern Trường Sơn range',
  },
  'nghe-an': {
    zoneVi: 'Bắc Trung Bộ',
    zoneEn: 'North Central',
    harvestVi: 'Tháng 10 – Tháng 12',
    harvestEn: 'Oct – Dec',
    soilVi: 'Đất đỏ bazan Phủ Quỳ cổ',
    soilEn: 'Historic Phủ Quỳ red basalt plateau',
    climateVi: 'Nhiệt đới gió mùa Bắc Trung Bộ',
    climateEn: 'North Central tropical monsoon belt',
  },
  'dong-nai': {
    zoneVi: 'Đông Nam Bộ',
    zoneEn: 'Southeast Belt',
    harvestVi: 'Cuối tháng 10 – Tháng 12',
    harvestEn: 'Late Oct – Dec',
    soilVi: 'Đất bazan đen & nâu vùng thấp Long Khánh',
    soilEn: 'Lowland dark & brown basalt around Long Khánh',
    climateVi: 'Nhiệt đới cận xích đạo, thu hoạch sớm',
    climateEn: 'Warm equatorial lowland yielding early harvest',
  },
};

export const VietnamOriginMap: React.FC<VietnamOriginMapProps> = ({ compact = false }) => {
  const { lang, t, localePath } = useI18n();
  const { origins } = useStore();
  const [selectedSlug, setSelectedSlug] = useState<string>('dak-lak');
  const [layerMode, setLayerMode] = useState<MapLayerMode>('satellite');
  const [zoneFilter, setZoneFilter] = useState<MacroZone>('all');
  const [fullscreen, setFullscreen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const filteredOrigins = useMemo(() => {
    if (zoneFilter === 'all') return origins;
    const allowed = new Set(ZONE_SLUGS[zoneFilter] || []);
    return origins.filter((o) => allowed.has(o.slug));
  }, [origins, zoneFilter]);

  const selectedOrigin: CoffeeOrigin | undefined = useMemo(
    () => origins.find((o) => o.slug === selectedSlug) || filteredOrigins[0] || origins[0],
    [origins, filteredOrigins, selectedSlug]
  );

  // Initialize Leaflet real-world imagery map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [15.8, 106.8],
      zoom: 5.5,
      minZoom: 4.5,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    const baseGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    baseLayerGroupRef.current = baseGroup;
    markersGroupRef.current = markersGroup;

    return () => {
      map.remove();
      mapRef.current = null;
      baseLayerGroupRef.current = null;
      markersGroupRef.current = null;
    };
  }, []);

  // Switch real raster tile layers (Satellite Earth Photography / Terrain Topo / Standard OSM)
  useEffect(() => {
    const baseGroup = baseLayerGroupRef.current;
    if (!baseGroup) return;
    baseGroup.clearLayers();

    if (layerMode === 'satellite') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: 'Imagery © Esri, Earthstar Geographics',
      }).addTo(baseGroup);
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          opacity: 0.9,
        }
      ).addTo(baseGroup);
    } else if (layerMode === 'terrain') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: 'Topographic Map © Esri',
      }).addTo(baseGroup);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(baseGroup);
    }
  }, [layerMode]);

  // Render region markers & selection radius circle on the real map
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    filteredOrigins.forEach((origin) => {
      const isSelected = selectedOrigin?.slug === origin.slug;
      const confirmed = origin.sourcing_status === 'confirmed_sourcing';
      const label = lang === 'vi' ? origin.region_name_vi : origin.region_name_en;

      if (isSelected) {
        L.circle([origin.latitude, origin.longitude], {
          radius: 52000,
          color: confirmed ? '#C6A667' : '#FFFFFF',
          weight: 2,
          fillColor: confirmed ? '#C6A667' : '#00552B',
          fillOpacity: 0.22,
        }).addTo(markersGroup);
      }

      const pinBg = confirmed ? '#C6A667' : '#00552B';
      const ringColor = isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.65)';
      const tooltipTag = confirmed ? t('Vùng thu mua trọng tâm ROAR', 'ROAR Sourcing Focus') : t('Vùng địa lý cà phê Việt Nam', 'Coffee Geography');

      const icon = L.divIcon({
        className: 'roar-map-marker',
        html: `
          <div style="display:flex;align-items:center;gap:6px;transform:translate(-10px,-50%);cursor:pointer;white-space:nowrap;">
            <span style="width:${isSelected ? 18 : 13}px;height:${isSelected ? 18 : 13}px;border-radius:9999px;background:${pinBg};border:2.5px solid ${ringColor};box-shadow:0 2px 8px rgba(0,0,0,0.55);display:inline-block;"></span>
            <span style="background:${isSelected ? '#111111' : 'rgba(0,45,27,0.9)'};color:${isSelected ? '#C6A667' : '#F8F5EF'};border:1px solid ${isSelected ? '#C6A667' : 'rgba(255,255,255,0.28)'};padding:2px 7px;border-radius:5px;font-size:${isSelected ? '11.5px' : '10.5px'};font-weight:${isSelected ? '700' : '600'};box-shadow:0 2px 6px rgba(0,0,0,0.45);font-family:'Be Vietnam Pro',sans-serif;">
              ${label}
            </span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([origin.latitude, origin.longitude], { icon }).addTo(markersGroup);
      marker.on('click', () => {
        setSelectedSlug(origin.slug);
        map.flyTo([origin.latitude, origin.longitude], Math.max(map.getZoom(), 8), { duration: 0.65 });
      });

      marker.bindTooltip(
        `<div style="font-family:'Be Vietnam Pro',sans-serif;font-size:11px;"><strong>${label}</strong><br/><span>${origin.elevation} · ${tooltipTag}</span></div>`,
        { direction: 'top', offset: [0, -10] }
      );
    });
  }, [filteredOrigins, selectedOrigin, lang, t]);

  // Recalculate container size when fullscreen changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const tId = window.setTimeout(() => map.invalidateSize(), 180);
    return () => window.clearTimeout(tId);
  }, [fullscreen]);

  const handleSelectRegion = (origin: CoffeeOrigin) => {
    setSelectedSlug(origin.slug);
    if (mapRef.current) {
      mapRef.current.flyTo([origin.latitude, origin.longitude], 8, { duration: 0.7 });
    }
  };

  const resetVietnamView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([15.8, 106.8], 5.5, { duration: 0.6 });
    }
  };

  const extra = selectedOrigin ? REGION_DETAILS[selectedOrigin.slug] : undefined;
  const localityChips = selectedOrigin
    ? (lang === 'vi' ? selectedOrigin.localities_vi : selectedOrigin.localities_en)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div
      className={`${
        fullscreen
          ? 'fixed inset-0 z-50 bg-[#F8F5EF] dark:bg-[#0E1512] p-4 sm:p-6 overflow-y-auto'
          : 'bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 overflow-hidden'
      }`}
    >
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 ${
          fullscreen ? 'max-w-[1360px] mx-auto bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 overflow-hidden' : ''
        }`}
      >
        {/* Real-World Imagery Map Panel */}
        <div className="lg:col-span-6 bg-[#003D25] text-[#F8F5EF] relative flex flex-col justify-between p-4 sm:p-5 gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 z-10">
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-[#C6A667] font-semibold">
                {t('Bản đồ Vệ tinh & Địa lý Cà phê Việt Nam', 'Vietnam Coffee Origins — Real Imagery Map')}
              </p>
              <p className="text-xs text-[#F8F5EF]/75 mt-0.5">
                {t(
                  `${origins.length} vùng trồng trọng điểm từ Tây Bắc đến Tây Nguyên & Đông Nam Bộ`,
                  `${origins.length} authentic regions from Northwest Mountains to Central Highlands`
                )}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => mapRef.current?.zoomIn()}
                aria-label="Zoom in"
                className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => mapRef.current?.zoomOut()}
                aria-label="Zoom out"
                className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetVietnamView}
                aria-label="Reset map view"
                title={t('Toàn cảnh Việt Nam', 'Full Vietnam View')}
                className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setFullscreen((f) => !f)}
                aria-label="Toggle fullscreen"
                className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Real Layer Mode Switcher + Macro Zone Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="inline-flex items-center gap-1 bg-[#002818] p-1 rounded-lg border border-white/15">
              <Layers className="w-3.5 h-3.5 text-[#C6A667] mx-1" />
              {(
                [
                  { id: 'satellite', vi: 'Ảnh Vệ Tinh Thật', en: 'Satellite Earth' },
                  { id: 'terrain', vi: 'Địa Hình Cao Độ', en: 'Terrain Topo' },
                  { id: 'street', vi: 'Bản Đồ Hành Chính', en: 'Street Map' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLayerMode(m.id)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    layerMode === m.id ? 'bg-[#C6A667] text-[#111111] font-semibold' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {t(m.vi, m.en)}
                </button>
              ))}
            </div>

            {selectedOrigin && (
              <button
                type="button"
                onClick={() => handleSelectRegion(selectedOrigin)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[#C6A667] cursor-pointer"
              >
                <LocateFixed className="w-3 h-3" />
                <span>{t('Phóng to vùng đang chọn', 'Focus selected region')}</span>
              </button>
            )}
          </div>

          {/* Interactive Leaflet Real Map Container */}
          <div
            ref={mapContainerRef}
            className={`w-full rounded-lg overflow-hidden border border-[#C6A667]/30 bg-[#0b1f16] z-0 ${
              fullscreen ? 'h-[480px] lg:h-[580px]' : 'h-[400px] lg:h-[460px]'
            }`}
          />

          {/* Macro Zone Filter & Full Region Buttons */}
          <div className="space-y-2.5 z-10">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#F8F5EF]/80">
              <div className="flex items-center gap-3.5">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C6A667] ring-1 ring-white" />
                  {t('Vùng thu mua trọng tâm ROAR', 'ROAR Sourcing Focus')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00552B] ring-1 ring-white" />
                  {t('Địa lý vùng cà phê Việt Nam', 'Vietnam Coffee Region')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { id: 'all', vi: 'Tất cả (10)', en: 'All (10)' },
                    { id: 'tay_nguyen', vi: 'Tây Nguyên (5)', en: 'Central Highlands (5)' },
                    { id: 'tay_bac', vi: 'Tây Bắc (2)', en: 'Northwest (2)' },
                    { id: 'mien_trung', vi: 'Miền Trung (2)', en: 'Central (2)' },
                    { id: 'dong_nam_bo', vi: 'Đông Nam Bộ (1)', en: 'Southeast (1)' },
                  ] as const
                ).map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setZoneFilter(z.id)}
                    className={`px-2 py-0.5 rounded text-[10.5px] cursor-pointer ${
                      zoneFilter === z.id ? 'bg-white text-[#003D25] font-semibold' : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {t(z.vi, z.en)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {filteredOrigins.map((o) => (
                <button
                  key={o.slug}
                  type="button"
                  onClick={() => handleSelectRegion(o)}
                  className={`px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                    selectedOrigin?.slug === o.slug
                      ? 'bg-[#C6A667] text-[#111111] font-semibold'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {lang === 'vi' ? o.region_name_vi : o.region_name_en}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Region Information Panel */}
        {selectedOrigin && (
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-5 bg-white dark:bg-[#16221C]">
            <div className="space-y-4">
              <div className="relative h-48 sm:h-52 rounded-lg overflow-hidden bg-[#F8F5EF] dark:bg-[#0E1512]">
                <MediaImage
                  imageKey={selectedOrigin.image_key}
                  alt={lang === 'vi' ? selectedOrigin.region_name_vi : selectedOrigin.region_name_en}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-white/90">{selectedOrigin.photo_attribution}</p>
                  {extra && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#C6A667] text-[#111111] shrink-0">
                      {lang === 'vi' ? extra.zoneVi : extra.zoneEn}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs text-[#00552B] dark:text-[#C6A667] font-medium">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedOrigin.sourcing_status === 'confirmed_sourcing'
                      ? t('Vùng thu mua trọng tâm ROAR COFFEE', 'ROAR COFFEE Sourcing Evaluation Region')
                      : t('Địa lý cà phê Việt Nam (Hồ sơ vùng trồng)', 'Vietnamese Coffee Geography (Regional Profile)')}
                  </span>
                  <span className="font-mono text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60 tabular-nums">
                    {selectedOrigin.latitude.toFixed(4)}°N, {selectedOrigin.longitude.toFixed(4)}°E
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA]">
                  {lang === 'vi' ? selectedOrigin.region_name_vi : selectedOrigin.region_name_en}
                </h3>

                {/* Sub-regions / Districts */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-[#202020]/55 dark:text-[#F1EFEA]/55 mr-1">
                    {t('Tiểu vùng & huyện trọng điểm:', 'Key Districts & Sub-regions:')}
                  </span>
                  {localityChips.map((loc) => (
                    <span
                      key={loc}
                      className="text-[11px] px-2 py-0.5 rounded bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 text-[#202020]/85 dark:text-[#F1EFEA]/85 font-medium"
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-[#202020]/85 dark:text-[#F1EFEA]/85 leading-relaxed">
                {lang === 'vi' ? selectedOrigin.characteristics_vi : selectedOrigin.characteristics_en}
              </p>

              {/* Agronomy & Terroir Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#202020]/10 dark:border-white/10 text-xs">
                <div>
                  <span className="text-[#202020]/55 dark:text-[#F1EFEA]/55 block">{t('Độ cao vùng trồng', 'Elevation Band')}</span>
                  <span className="font-semibold text-[#202020] dark:text-[#F1EFEA] tabular-nums">{selectedOrigin.elevation}</span>
                </div>
                <div>
                  <span className="text-[#202020]/55 dark:text-[#F1EFEA]/55 block">{t('Giống cà phê', 'Coffee Species & Varieties')}</span>
                  <span className="font-semibold text-[#202020] dark:text-[#F1EFEA]">{selectedOrigin.varieties}</span>
                </div>
                <div>
                  <span className="text-[#202020]/55 dark:text-[#F1EFEA]/55 block">{t('Phương pháp sơ chế', 'Processing Methods')}</span>
                  <span className="font-semibold text-[#202020] dark:text-[#F1EFEA]">{selectedOrigin.processing_methods}</span>
                </div>
              </div>

              {extra && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-3 rounded-lg border border-[#202020]/8 dark:border-white/10">
                  <div>
                    <span className="text-[#202020]/55 dark:text-[#F1EFEA]/55 block">{t('Mùa thu hoạch', 'Harvest Window')}</span>
                    <span className="font-semibold text-[#00552B] dark:text-[#C6A667]">{lang === 'vi' ? extra.harvestVi : extra.harvestEn}</span>
                  </div>
                  <div>
                    <span className="text-[#202020]/55 dark:text-[#F1EFEA]/55 block">{t('Thổ nhưỡng', 'Soil Profile')}</span>
                    <span className="font-medium text-[#202020] dark:text-[#F1EFEA]">{lang === 'vi' ? extra.soilVi : extra.soilEn}</span>
                  </div>
                  <div>
                    <span className="text-[#202020]/55 dark:text-[#F1EFEA]/55 block">{t('Vi khí hậu', 'Microclimate')}</span>
                    <span className="font-medium text-[#202020] dark:text-[#F1EFEA]">{lang === 'vi' ? extra.climateVi : extra.climateEn}</span>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/8 dark:border-white/10 text-xs text-[#202020]/80 dark:text-[#F1EFEA]/80">
                <strong className="text-[#00552B] dark:text-[#C6A667]">{t('Minh bạch nguồn gốc: ', 'Sourcing Transparency: ')}</strong>
                {lang === 'vi' ? selectedOrigin.sourcing_note_vi : selectedOrigin.sourcing_note_en}
              </div>
            </div>

            <div className="pt-4 border-t border-[#202020]/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedOrigin.related_skus.slice(0, 4).map((sku) => (
                  <Link
                    key={sku}
                    to={
                      sku.startsWith('RC-RST-')
                        ? sku === 'RC-RST-RHB'
                          ? localePath('/product/robusta-house-blend')
                          : sku === 'RC-RST-ARS'
                            ? localePath('/product/arabica-selection')
                            : sku === 'RC-RST-ESP'
                              ? localePath('/product/roar-espresso')
                              : sku === 'RC-RST-ESG'
                                ? localePath('/product/roar-espresso-gold')
                                : localePath('/shop')
                        : `${localePath('/coffee/green-beans')}?q=${encodeURIComponent(sku)}`
                    }
                    className="font-mono px-2.5 py-1 rounded bg-[#00552B]/8 dark:bg-[#00552B]/30 text-[#00552B] dark:text-[#C6A667] hover:bg-[#00552B] hover:text-white transition-colors"
                  >
                    {sku}
                  </Link>
                ))}
              </div>
              {compact && (
                <Link
                  to={localePath('/origins')}
                  className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap"
                >
                  {t('Mở trang Bản đồ chi tiết →', 'Open Full Origin Map →')}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
