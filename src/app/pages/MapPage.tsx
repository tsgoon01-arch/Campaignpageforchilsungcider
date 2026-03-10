import 'leaflet/dist/leaflet.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import Slider from 'react-slick';
import { MapPin, Clock, Phone, CheckCircle2, ChevronRight, ChevronLeft, X, Navigation, Star, LocateFixed, RadioTower, ImageIcon } from 'lucide-react';
import { Link } from 'react-router';
import { stores, Store } from '../data/stores';
import { useStamp } from '../context/StampContext';
import { motion, AnimatePresence } from 'motion/react';

const GREEN = '#2BAE4E';

const GALLERY_IMGS = [
  'https://images.unsplash.com/photo-1708388064278-707e85eaddc0?w=400&q=80',
  'https://images.unsplash.com/photo-1708675532078-ba3995800f53?w=400&q=80',
  'https://images.unsplash.com/photo-1768006240774-1e40deba1598?w=400&q=80',
  'https://images.unsplash.com/photo-1769558688746-7ac36d8ce999?w=400&q=80',
];

// ── Naver Maps URL ────────────────────────────────────────────────────────────
function naverMapUrl(store: Store) {
  return `https://map.naver.com/v5/search/${encodeURIComponent(store.name + ' ' + store.address)}`;
}

// ── Coordinate helpers ────────────────────────────────────────────────────────
const LNG_MIN = 126.84, LNG_MAX = 127.12;
const LAT_MAX = 37.63, LAT_MIN = 37.47;
function toScreenPos(lat: number, lng: number) {
  return {
    x: Math.max(3, Math.min(97, ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100)),
    y: Math.max(3, Math.min(97, ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100)),
  };
}

// ── Leaflet marker factory ────────────────────────────────────────────────────
// Visited → Chilsung 병뚜껑 스타일 (녹색 + 七)
// Special (김가네·김밥대장) unvisited → 골드/퍼플
// Regular unvisited → 파랑
function makeMarkerHtml(isCollected: boolean, isSpecial: boolean, markerColor: string, number: number): string {
  if (isCollected) {
    // 칠성사이다 병뚜껑 완료 마커
    return `
      <div style="position:relative;width:42px;height:54px;cursor:pointer;">
        <div style="position:absolute;top:0;left:2px;width:38px;height:38px;
          background:linear-gradient(135deg,${GREEN},#00C853);
          border:3px solid white;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);box-shadow:0 4px 14px rgba(43,174,78,0.5);">
        </div>
        <div style="position:absolute;top:0;left:2px;width:38px;height:38px;
          display:flex;align-items:center;justify-content:center;
          font-size:18px;pointer-events:none;">🥤</div>
      </div>`;
  }
  if (isSpecial) {
    const glow = markerColor === '#E8A000'
      ? 'rgba(232,160,0,0.5)'
      : 'rgba(155,39,200,0.5)';
    return `
      <div style="position:relative;width:46px;height:58px;cursor:pointer;">
        <div style="position:absolute;top:0;left:2px;width:42px;height:42px;
          background:${markerColor};border:3px solid white;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          box-shadow:0 4px 16px ${glow};">
        </div>
        <div style="position:absolute;top:0;left:2px;width:42px;height:42px;
          display:flex;align-items:center;justify-content:center;
          font-size:20px;pointer-events:none;">${markerColor === '#E8A000' ? '⭐' : '👑'}</div>
      </div>`;
  }
  return `
    <div style="position:relative;width:38px;height:50px;cursor:pointer;">
      <div style="position:absolute;top:0;left:1px;width:36px;height:36px;
        background:#0057B8;border:3px solid white;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,0.25);">
      </div>
      <div style="position:absolute;top:0;left:1px;width:36px;height:36px;
        display:flex;align-items:center;justify-content:center;
        color:white;font-weight:700;font-size:12px;
        font-family:'Noto Sans KR',sans-serif;pointer-events:none;">
        ${number}
      </div>
    </div>`;
}

function makeLeafletIcon(isCollected: boolean, isSpecial: boolean, markerColor: string, number: number) {
  const w = isSpecial && !isCollected ? 46 : isCollected ? 42 : 38;
  const h = isSpecial && !isCollected ? 58 : isCollected ? 54 : 50;
  return L.divIcon({
    html: makeMarkerHtml(isCollected, isSpecial, markerColor, number),
    className: '',
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
  });
}

// ── Map controller ────────────────────────────────────────────────────────────
function MapController({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    const [lat, lng] = target;
    if (!isFinite(lat) || !isFinite(lng)) return;
    map.invalidateSize();
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) { map.setView([lat, lng], 15); return; }
    try { map.flyTo([lat, lng], 15, { duration: 1.2 }); }
    catch { map.setView([lat, lng], 15); }
  }, [target, map]);
  return null;
}

// ── Loading overlay ───────────────────────────────────────────────────────────
function LoadingOverlay({ progress, step, visiblePins, done }: {
  progress: number; step: string; visiblePins: number[]; done: boolean;
}) {
  return (
    <AnimatePresence>
      {!done && (
        <motion.div key="loading" exit={{ y: '-100%' }}
          transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
          className="absolute inset-0 z-30 overflow-hidden"
          style={{ background: 'linear-gradient(155deg,#E8F8EF 0%,#F0FFF4 55%,#FFFDE7 100%)' }}>
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(43,174,78,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(43,174,78,0.07) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
          {[22, 47, 70, 88].map((y, i) => (
            <motion.div key={`h${i}`} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.7 }}
              className="absolute h-0.5 left-0 right-0 origin-left"
              style={{ top: `${y}%`, backgroundColor: 'rgba(43,174,78,0.15)' }} />
          ))}
          {stores.map((store, i) => {
            const p = toScreenPos(store.lat, store.lng);
            return (
              <AnimatePresence key={store.id}>
                {visiblePins.includes(i) && (
                  <motion.div initial={{ scale: 0, y: -14, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%,-100%)', zIndex: 2 }}>
                    <div className="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white"
                      style={{ backgroundColor: store.isSpecial ? store.markerColor : GREEN, fontSize: '10px', fontWeight: 900 }}>
                      {store.isSpecial ? (store.markerColor === '#E8A000' ? '⭐' : '👑') : i + 1}
                    </div>
                    <div className="mt-0.5 px-1.5 py-0.5 rounded text-white whitespace-nowrap shadow"
                      style={{ backgroundColor: 'rgba(0,0,0,0.6)', fontSize: '8px', fontWeight: 700 }}>{store.name}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-xs w-full mx-4 text-center">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-md"
                style={{ background: `linear-gradient(135deg,${GREEN},#00C853)` }}>🍙</motion.div>
              <p style={{ fontWeight: 900, fontSize: '16px', color: '#111827' }}>김밥대장 로드 지도</p>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px', marginBottom: '16px' }}>
                {progress >= 100 ? '✅ 로딩 완료!' : step}
              </p>
              <div className="w-full bg-gray-100 rounded-full overflow-hidden mb-2" style={{ height: '8px' }}>
                <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
                  className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${GREEN},#00C853)` }} />
              </div>
              <p style={{ fontSize: '11px', color: '#D1D5DB' }}>{progress}%</p>
              {visiblePins.length > 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ fontSize: '12px', color: GREEN, marginTop: '10px', fontWeight: 700 }}>
                  📍 김밥집 {visiblePins.length}/{stores.length}곳 발견!
                </motion.p>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Haversine distance (meters) ───────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CHECK_IN_RADIUS_M = 300; // 300 m 이내면 인증 가능

// ── Geolocation error code → Korean message ───────────────────────────────────
function geoErrMsg(code: number): string {
  if (code === 1) return '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해 주세요.';
  if (code === 2) return '현재 위치를 가져올 수 없습니다. 실외에서 다시 시도해 주세요.';
  if (code === 3) return '위치 확인 시간이 초과됐습니다. 다시 시도해 주세요.';
  return '위치를 가져오지 못했습니다. 데모 인증을 이용해 주세요.';
}

// ── Location Verify Step ──────────────────────────────────────────────────────
function LocationVerify({ store, onSuccess }: { store: Store; onSuccess: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'locating' | 'near' | 'far' | 'success'>('idle');
  const [distance, setDistance] = useState<number | null>(null);
  const [geoErrCode, setGeoErrCode] = useState<number | null>(null);
  const watchRef = useRef<number | null>(null);

  useEffect(() => () => { if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current); }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGeoErrCode(2);
      setPhase('far');
      return;
    }
    setPhase('locating');
    setDistance(null);
    setGeoErrCode(null);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const dist = haversine(pos.coords.latitude, pos.coords.longitude, store.lat, store.lng);
        const rounded = Math.round(dist);
        setDistance(rounded);
        setGeoErrCode(null);
        setPhase(rounded <= CHECK_IN_RADIUS_M ? 'near' : 'far');
      },
      (err) => {
        // GeolocationPositionError has non-enumerable properties — log code/message explicitly
        console.error(`Geolocation error [code ${err.code}]: ${err.message}`);
        setGeoErrCode(err.code);
        setPhase('far');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const handleCheckin = () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    setPhase('success');
    setTimeout(onSuccess, 1400);
  };

  const handleDemo = () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    setDistance(38);
    setPhase('near');
  };

  const retry = () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    setPhase('idle');
    setDistance(null);
    setGeoErrCode(null);
  };

  return (
    <div className="py-2">

      {/* ── IDLE ── */}
      {phase === 'idle' && (
        <div className="flex flex-col items-center text-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${GREEN}, #00C853)` }}
          >
            <LocateFixed size={36} color="white" />
          </motion.div>

          <div>
            <p className="font-bold text-gray-900 text-base mb-1">GPS 위치로 방문 인증</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              매장 반경 <strong style={{ color: GREEN }}>{CHECK_IN_RADIUS_M}m</strong> 이내에서
              <br />위치 확인 버튼을 누르면 스탬프가 적립됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{ backgroundColor: '#F0FDF4', border: `1px solid ${GREEN}33` }}>
            <MapPin size={12} style={{ color: GREEN }} />
            <span className="text-gray-500">{store.name}</span>
            <span className="text-gray-300">·</span>
            <span style={{ color: GREEN, fontWeight: 700 }}>{store.district}</span>
          </div>

          <button
            onClick={handleLocate}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${GREEN}, #00C853)` }}
          >
            <LocateFixed size={18} /> 현재 위치 확인하기
          </button>

          <button
            onClick={() => window.open(`https://map.naver.com/v5/search/${encodeURIComponent(store.name + ' ' + store.address)}`, '_blank')}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm"
            style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
          >
            <Navigation size={15} /> 네이버 지도로 길찾기
          </button>

          <button onClick={handleDemo} className="text-xs text-gray-300 underline underline-offset-2">
            데모 인증 (위치 없이 테스트)
          </button>
        </div>
      )}

      {/* ── LOCATING ── */}
      {phase === 'locating' && (
        <div className="flex flex-col items-center text-center gap-5 py-6">
          <div className="relative w-24 h-24">
            {[1, 2, 3].map((i) => (
              <motion.div key={i}
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${GREEN}` }}
                animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center rounded-full"
              style={{ background: `linear-gradient(135deg, ${GREEN}, #00C853)` }}>
              <RadioTower size={32} color="white" />
            </div>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base">GPS 위치 확인 중...</p>
            <p className="text-xs text-gray-400 mt-1">잠시만 기다려 주세요</p>
          </div>
          <motion.div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="w-2 h-2 rounded-full"
                style={{ backgroundColor: GREEN }}
                animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* ── NEAR (within radius) ── */}
      {phase === 'near' && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center gap-4 py-2">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #E8F8EF, #D1FAE5)', border: `3px solid ${GREEN}` }}
          >
            <span className="text-4xl">📍</span>
          </motion.div>
          <div>
            <p className="font-bold text-green-600 text-lg">매장 근처입니다!</p>
            {distance !== null && (
              <p className="text-sm text-gray-500 mt-0.5">
                현재 위치에서 <strong style={{ color: GREEN }}>{distance}m</strong> 거리
              </p>
            )}
          </div>
          <div className="w-full">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>현재 위치</span>
              <span>{store.name}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div className="h-full rounded-full"
                style={{ backgroundColor: GREEN }}
                initial={{ width: '0%' }}
                animate={{ width: `${Math.max(10, 100 - ((distance ?? 0) / CHECK_IN_RADIUS_M) * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-right text-xs text-gray-300 mt-0.5">인증 가능 범위 {CHECK_IN_RADIUS_M}m</p>
          </div>
          <button
            onClick={handleCheckin}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${GREEN}, #00C853)` }}
          >
            🥤 체크인하고 스탬프 받기!
          </button>
          <button onClick={retry} className="text-xs text-gray-400 underline underline-offset-2">
            다시 측정하기
          </button>
        </motion.div>
      )}

      {/* ── FAR (outside radius) ── */}
      {phase === 'far' && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: '#FEF2F2', border: '3px solid #FCA5A5' }}>
            <span className="text-4xl">📡</span>
          </div>
          <div>
            <p className="font-bold text-red-500 text-base">아직 매장에서 멀어요</p>
            {distance !== null ? (
              <p className="text-sm text-gray-500 mt-1">
                현재 거리 <strong className="text-red-500">{distance.toLocaleString()}m</strong>
                {' '}— {CHECK_IN_RADIUS_M}m 이내로 이동해 주세요
              </p>
            ) : (
              <p className="text-sm text-gray-400 mt-1">위치를 가져오지 못했습니다.<br />위치 권한을 허용해 주세요.</p>
            )}
          </div>
          {distance !== null && (
            <div className="w-full">
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-red-400"
                  style={{ width: `${Math.min(100, (CHECK_IN_RADIUS_M / distance) * 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">
                {Math.round((CHECK_IN_RADIUS_M / distance) * 100)}% 도달
              </p>
            </div>
          )}
          {geoErrCode !== null && (
            <p className="text-sm text-red-500 mt-1">{geoErrMsg(geoErrCode)}</p>
          )}
          <button
            onClick={() => window.open(`https://map.naver.com/v5/search/${encodeURIComponent(store.name + ' ' + store.address)}`, '_blank')}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white font-semibold text-sm hover:opacity-90"
            style={{ backgroundColor: '#03C75A' }}
          >
            <Navigation size={15} /> 네이버 지도로 길찾기
          </button>
          <button onClick={retry}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm"
            style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>
            <LocateFixed size={15} /> 다시 위치 확인
          </button>
          <button onClick={handleDemo} className="text-xs text-gray-300 underline underline-offset-2">
            데모 인증 (위치 없이 테스트)
          </button>
        </motion.div>
      )}

      {/* ── SUCCESS ── */}
      {phase === 'success' && (
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="py-6 text-center flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #E8F8EF, #D1FAE5)', border: `3px solid ${GREEN}` }}
          >
            <span className="text-5xl">🥤</span>
          </motion.div>
          <div>
            <p className="font-bold text-2xl text-gray-900 mb-1">체크인 완료!</p>
            <p className="text-sm text-gray-500">{store.name} 스탬프가 적립됩니다 🎉</p>
          </div>
          <div className="flex gap-2 justify-center">
            {['#FFD740', GREEN, '#FF5722', '#2196F3'].map((c, i) => (
              <motion.div key={i} className="w-3 h-3 rounded-full"
                style={{ backgroundColor: c }}
                animate={{ y: [0, -16, 0], opacity: [1, 1, 0] }}
                transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Store Modal ───────────────────────────────────────────────────────────────
interface ModalProps {
  store: Store;
  onClose: () => void;
  onVerify: () => void;
  alreadyCollected: boolean;
}

function StoreModal({ store, onClose, onVerify, alreadyCollected }: ModalProps) {
  const [tab, setTab] = useState<'info' | 'verify'>('info');
  const [verified, setVerified] = useState(alreadyCollected);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<Slider | null>(null);

  const handleVerifySuccess = () => {
    onVerify();
    setVerified(true);
  };

  const isGold   = store.markerColor === '#E8A000';
  const isPurple = store.markerColor === '#9B27C8';
  const specialGrad = isGold
    ? 'linear-gradient(135deg,#F59E0B,#D97706)'
    : isPurple
    ? 'linear-gradient(135deg,#9B27C8,#7B2D9C)'
    : `linear-gradient(135deg,${GREEN},#00C853)`;

  // 매장별 갤러리 이미지 (메인 이미지 + 3개 추가)
  const galleryImages = [store.image, ...GALLERY_IMGS.slice(0, 3)];

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 3500,
    pauseOnHover: true,
    beforeChange: (_: number, next: number) => setCurrentSlide(next),
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="relative bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Hero image carousel ── */}
        <div className="relative shrink-0" style={{ height: '260px' }}>
          <Slider ref={sliderRef} {...sliderSettings}>
            {galleryImages.map((img, i) => (
              <div key={i}>
                <div style={{ height: '260px' }} className="relative">
                  <img src={img} alt={`${store.name} ${i + 1}`}
                    className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </Slider>

          {/* Gradient overlay */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.02) 30%, rgba(0,0,0,0.75) 100%)' }} />

          {/* Prev / Next buttons */}
          <button
            onClick={(e) => { e.stopPropagation(); sliderRef.current?.slickPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-100"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', opacity: 0.7 }}>
            <ChevronLeft size={16} color="white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); sliderRef.current?.slickNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-100"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', opacity: 0.7 }}>
            <ChevronRight size={16} color="white" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {galleryImages.map((_, i) => (
              <button key={i}
                onClick={(e) => { e.stopPropagation(); sliderRef.current?.slickGoTo(i); }}
                className="rounded-full transition-all"
                style={{
                  width: currentSlide === i ? 18 : 6,
                  height: 6,
                  backgroundColor: currentSlide === i ? 'white' : 'rgba(255,255,255,0.45)',
                }} />
            ))}
          </div>

          {/* Photo count badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
            <ImageIcon size={12} color="white" />
            <span className="text-white text-xs font-black">{currentSlide + 1}/{galleryImages.length}</span>
          </div>

          {/* VIP badge */}
          {store.isSpecial && (
            <motion.div
              className="absolute top-4 left-24 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: specialGrad, border: '2px solid rgba(255,255,255,0.5)' }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Star size={12} fill="white" color="white" />
              <span className="text-white font-semibold text-xs">
                {isGold ? '⭐ 김가네' : '👑 김밥대장'}
              </span>
            </motion.div>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-white/90 rounded-full hover:bg-white transition-colors shadow-sm"
          >
            <X size={18} className="text-gray-700" />
          </button>

          {/* Title */}
          <div className="absolute bottom-4 left-5 right-16 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2"
              style={{ background: specialGrad }}>
              <span className="text-white text-xs font-semibold">🥤 칠성사이다</span>
            </div>
            <h3 className="text-white text-2xl font-bold leading-tight">{store.name}</h3>
            <p className="text-white/70 text-sm mt-0.5">{store.nameEn} · {store.district}</p>
          </div>
        </div>

        {/* ── VIP banner ── */}
        {store.isSpecial && (
          <div className="shrink-0 px-5 py-3" style={{ background: specialGrad }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">
                  {isGold ? '⭐ 칠성사이다 × 김가네 공식 콜라보' : '👑 칠성사이다 × 김밥대장 공식 콜라보'}
                </p>
                <p className="text-white/80 text-xs mt-0.5">칠성사이다 공식 콜라보 매장</p>
              </div>
              <div className="text-2xl shrink-0 ml-3">{isGold ? '🥇' : '💜'}</div>
            </div>
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="flex border-b shrink-0" style={{ borderColor: '#F3F4F6' }}>
          {(['info', 'verify'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-3.5 text-sm font-semibold transition-colors"
              style={{
                color: tab === t ? GREEN : '#9CA3AF',
                borderBottom: tab === t ? `2.5px solid ${GREEN}` : '2.5px solid transparent',
              }}>
              {t === 'info' ? '📍 가게 정보' : verified ? '✅ 방문 완료' : '📡 위치 인증'}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1">
          {tab === 'info' && (
            <div className="p-5 space-y-5">

              {/* Chilsung pairing */}
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#E8F8EF,#F0FFF4)', border: `1.5px solid ${GREEN}33` }}>
                <p className="text-xs font-semibold mb-1.5" style={{ color: GREEN }}>🥤 칠성사이다 페어링</p>
                <p className="text-sm text-gray-700 leading-relaxed">{store.chilsungPairing}</p>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed">{store.description}</p>

              {/* Info grid (2-col on sm) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <MapPin size={16} style={{ color: GREEN }} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">주소</p>
                    <p className="text-sm text-gray-700 leading-snug">{store.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <Clock size={16} style={{ color: GREEN }} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">영업시간</p>
                    <p className="text-sm text-gray-700">{store.hours}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <Phone size={16} style={{ color: GREEN }} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">전화</p>
                    <p className="text-sm text-gray-700">{store.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <Star size={16} style={{ color: GREEN }} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">분위기</p>
                    <p className="text-sm text-gray-700">{store.vibe}</p>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <div className="rounded-2xl p-4" style={{ backgroundColor: '#F8FAFF', border: '1.5px solid #E8EEFF' }}>
                <p className="text-xs text-gray-400 mb-2 font-semibold">🍽️ 대표 메뉴</p>
                <p className="text-sm text-gray-700 leading-relaxed">{store.menu}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {store.tags.map((tag) => (
                  <span key={tag}
                    className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{
                      backgroundColor: store.isSpecial ? (isGold ? '#FEF3C7' : '#F3E8FF') : '#E8F8EF',
                      color: store.isSpecial ? (isGold ? '#92400E' : '#6B21A8') : GREEN,
                      border: `1px solid ${store.isSpecial ? (isGold ? '#FCD34D' : '#C084FC') : '#BBF7D0'}`,
                    }}>
                    #{tag}
                  </span>
                ))}
              </div>

              {/* CTA row */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1 pb-2">
                <button
                  onClick={() => setTab('verify')}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: verified ? GREEN : '#0057B8' }}
                >
                  {verified ? <><span>🥤</span> 방문 완료!</> : <><LocateFixed size={16} /> 위치 인증하기</>}
                </button>
                <a
                  href={naverMapUrl(store)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#03C75A' }}
                >
                  <Navigation size={16} /> 네이버 길찾기
                </a>
              </div>
            </div>
          )}

          {tab === 'verify' && (
            <div className="p-5">
              {verified ? (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="py-8 text-center">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'linear-gradient(135deg,#E8F8EF,#D1FAE5)' }}>
                    <span className="text-5xl">🥤</span>
                  </div>
                  <p className="font-bold text-2xl text-gray-900 mb-2">방문 인증 완료!</p>
                  <p className="text-sm text-gray-500 mb-6">{store.name} 스탬프 적립 완료 🎉</p>
                  <div className="flex flex-col gap-3">
                    {store.stampTour && (
                      <Link
                        to={`/event?store=${store.id}&name=${encodeURIComponent(store.name)}`}
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl text-gray-900 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                        style={{ background: 'linear-gradient(135deg, #FFD740, #FFA000)', boxShadow: '0 4px 16px rgba(255,215,64,0.4)' }}>
                        🎰 이 매장에서 룰렛 돌리기!
                      </Link>
                    )}
                    <button onClick={onClose}
                      className="w-full py-4 rounded-2xl text-white font-semibold hover:opacity-90 transition-opacity text-sm"
                      style={{ backgroundColor: GREEN }}>확인</button>
                  </div>
                </motion.div>
              ) : (
                <LocationVerify store={store} onSuccess={handleVerifySuccess} />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── MapPage ───────────────────────────────────────────────────────────────────
export function MapPage() {
  const { isCollected, addStamp, stampCount } = useStamp();
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [modalStore, setModalStore] = useState<Store | null>(null);
  const [filter, setFilter] = useState('전체');
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [loadingDone, setLoadingDone] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('지도 서버 연결 중...');
  const [visiblePins, setVisiblePins] = useState<number[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const BRAND_FILTERS = [
    { key: '전체', label: '전체', icon: '🍙', color: '#1A1A1A' },
    { key: 'visited', label: '참여완료', icon: '🥤', color: '#2BAE4E' },
  ];
  const filteredStores = filter === '전체'
    ? stores
    : stores.filter((s) => isCollected(s.id));

  // 필터 변경 시 현재 선택된 가게가 결과에 없으면 닫기
  const handleFilterChange = (key: string) => {
    setFilter(key);
    if (key === 'visited' && selectedStore && !isCollected(selectedStore.id)) {
      setSelectedStore(null);
    }
  };

  useEffect(() => {
    const steps = [
      { p: 20, s: '지도 타일 불러오는 중...', d: 350 },
      { p: 45, s: '서울 김밥집 검색 중...', d: 800 },
      { p: 68, s: '위치 데이터 정리 중...', d: 1300 },
      { p: 85, s: '마커 생성 중...', d: 1750 },
      { p: 95, s: '지도 렌더링 중...', d: 2100 },
    ];
    const timers = steps.map(({ p, s, d }) =>
      setTimeout(() => { setLoadingProgress(p); setLoadingStep(s); }, d)
    );
    stores.forEach((_, i) => {
      timers.push(setTimeout(() => setVisiblePins((prev) => [...prev, i]), 700 + i * 160));
    });
    timers.push(setTimeout(() => {
      setLoadingProgress(100);
      setLoadingStep('완료!');
      setTimeout(() => setLoadingDone(true), 500);
    }, 2500));
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleStoreClick = (store: Store) => {
    setSelectedStore(store);
    setFlyTarget([store.lat, store.lng]);
    setSidebarOpen(false);
  };

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div className="bg-white border-b px-3 py-2.5 flex items-center justify-between shrink-0 shadow-sm gap-2" style={{ borderColor: '#E5E7EB' }}>
        <div className="min-w-0">
          <p className="font-black text-sm text-gray-900 truncate">🍙 칠성 김밥 로드</p>
          <p className="text-xs text-gray-400">
            {filter === '전체'
              ? `서울 김밥 핫플 ${stores.length}곳`
              : `🥤 참여완료 매장 ${filteredStores.length}곳`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#E8F8EF' }}>
            <CheckCircle2 size={13} color={GREEN} />
            <span className="text-xs font-black" style={{ color: GREEN }}>{stampCount}/10</span>
          </div>
          {/* Mobile sidebar toggle */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black text-white"
            style={{ backgroundColor: sidebarOpen ? '#374151' : '#0057B8' }}>
            {sidebarOpen ? '지도' : '목록'}
          </button>
        </div>
      </div>

      {/* ── Brand Filter Bar (always visible — desktop & mobile) ── */}
      <div className="bg-white border-b shrink-0 px-3 py-2" style={{ borderColor: '#F0F0F0' }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide items-center">
          {BRAND_FILTERS.map(({ key, label, icon, color }) => {
            const active = filter === key;
            return (
              <button key={key} onClick={() => handleFilterChange(key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full shrink-0 transition-all active:scale-95"
                style={active
                  ? {
                      background: key === 'visited'
                        ? 'linear-gradient(135deg,#2BAE4E,#00C853)'
                        : 'linear-gradient(135deg,#1A1A1A,#374151)',
                      color: 'white',
                      fontWeight: 900,
                      fontSize: '13px',
                      border: `2px solid ${color}`,
                      boxShadow: `3px 3px 0 ${color}55`,
                    }
                  : {
                      backgroundColor: '#F5F5F5',
                      color: '#6B7280',
                      fontWeight: 700,
                      fontSize: '13px',
                      border: '2px solid transparent',
                    }}>
                <span style={{ fontSize: '14px' }}>{icon}</span>
                <span>{label}</span>
                {active && (
                  <span className="rounded-full px-1.5 py-0.5 text-white font-black"
                    style={{ backgroundColor: 'rgba(255,255,255,0.28)', fontSize: '11px', minWidth: '20px', textAlign: 'center' }}>
                    {filteredStores.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Brand description strip - removed */}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ── Sidebar (desktop always visible, mobile toggled) ── */}
        <div className={`
          bg-white border-r shrink-0 flex flex-col
          ${sidebarOpen ? 'flex' : 'hidden'} md:flex
          absolute md:relative inset-0 md:inset-auto
          z-20 md:z-auto
        `} style={{ width: '100%', maxWidth: '320px', borderColor: '#F3F4F6' }}>

          {/* Legend — desktop only */}
          <div className="hidden md:flex px-3 py-2 border-b shrink-0 items-center gap-3" style={{ borderColor: '#F9FAFB', backgroundColor: '#FAFBFF' }}>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#9B27C8', fontSize: '9px' }}>👑</div>
              <span className="text-xs text-gray-500">김밥대장</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F8EF', fontSize: '10px' }}>🥤</div>
              <span className="text-xs text-gray-500">방문완료</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0057B8', fontSize: '9px', color: 'white', fontWeight: 700 }}>N</div>
              <span className="text-xs text-gray-500">미방문</span>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filteredStores.map((store) => {
              const collected = isCollected(store.id);
              const isSelected = selectedStore?.id === store.id;
              const idx = stores.findIndex((s) => s.id === store.id) + 1;
              return (
                <div key={store.id} onClick={() => handleStoreClick(store)}
                  className="flex items-center gap-3 px-3 py-3 cursor-pointer transition-all active:scale-[0.99]"
                  style={{
                    borderBottom: '1px solid #F9FAFB',
                    backgroundColor: isSelected ? '#F0FDF4' : store.isSpecial ? (store.markerColor === '#E8A000' ? '#FFFBEB' : '#FAF5FF') : 'white',
                    borderLeft: `4px solid ${isSelected ? GREEN : store.isSpecial ? store.markerColor : 'transparent'}`,
                  }}>
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                    {collected
                      ? <div className="w-full h-full flex items-center justify-center text-2xl rounded-xl" style={{ background: 'linear-gradient(135deg,#E8F8EF,#D1FAE5)' }}>🥤</div>
                      : <img src={store.image} alt={store.name} className="w-full h-full object-cover" />}
                    {store.isSpecial && !collected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs border-2 border-white"
                        style={{ backgroundColor: store.markerColor }}>{store.markerColor === '#E8A000' ? '⭐' : '👑'}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-sm text-gray-900 truncate">{store.name}</span>
                      {collected && <span className="text-xs font-black shrink-0" style={{ color: GREEN }}>🥤완료</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{store.district} · {store.category}</p>
                  </div>
                  <span className="text-xs text-gray-300 shrink-0 font-black">#{String(idx).padStart(2, '0')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Map area ── */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <LoadingOverlay progress={loadingProgress} step={loadingStep} visiblePins={visiblePins} done={loadingDone} />

          <MapContainer center={[37.5536, 126.9700]} zoom={12}
            style={{ width: '100%', height: '100%' }} zoomControl={true}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              maxZoom={20} />
            <MapController target={flyTarget} />
            {filteredStores.map((store, i) => (
              <Marker
                key={`${store.id}-${isCollected(store.id)}-${filter}`}
                position={[store.lat, store.lng]}
                icon={makeLeafletIcon(isCollected(store.id), store.isSpecial, store.markerColor, i + 1)}
                eventHandlers={{ click: () => { setFlyTarget([store.lat, store.lng]); setModalStore(store); } }}
              />
            ))}
          </MapContainer>

          {/* Selected store popup */}
          <AnimatePresence>
            {selectedStore && !sidebarOpen && (
              <motion.div
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
                className="absolute bottom-3 left-3 right-3 md:left-auto md:right-3 md:w-80 bg-white rounded-2xl shadow-2xl overflow-hidden"
                style={{ zIndex: 1000, border: selectedStore.isSpecial ? `2px solid ${selectedStore.markerColor}` : '2px solid #E5E7EB' }}>

                {/* Special top bar */}
                {selectedStore.isSpecial && (
                  <div className="px-3 py-1.5 flex items-center gap-2"
                    style={{ background: selectedStore.markerColor === '#E8A000' ? 'linear-gradient(90deg,#F59E0B,#D97706)' : 'linear-gradient(90deg,#9B27C8,#7B2D9C)' }}>
                    <span className="text-white text-xs font-black">
                      {selectedStore.markerColor === '#E8A000' ? '⭐ 김가네 콜라보' : '👑 김밥대장 콜라보'}
                    </span>
                  </div>
                )}

                <div className="flex">
                  <div className="w-20 h-20 shrink-0">
                    <img src={selectedStore.image} alt={selectedStore.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="font-black text-sm text-gray-900 truncate">{selectedStore.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{selectedStore.district} · {selectedStore.hours}</p>
                      </div>
                      <button onClick={() => setSelectedStore(null)} className="text-gray-300 hover:text-gray-500 shrink-0">
                        <X size={15} />
                      </button>
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <button onClick={() => setModalStore(selectedStore)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full text-white font-black"
                        style={{ backgroundColor: isCollected(selectedStore.id) ? GREEN : '#0057B8' }}>
                        {isCollected(selectedStore.id) ? <><span>🥤</span> 완료</> : <><ChevronRight size={11} /> 인증</>}
                      </button>
                      <a href={naverMapUrl(selectedStore)} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full text-white font-black hover:opacity-90"
                        style={{ backgroundColor: '#03C75A' }}>
                        <Navigation size={11} /> 지도
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Mobile bottom chips ── */}
      <div className="md:hidden bg-white border-t shrink-0" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex gap-2 px-2 py-2 overflow-x-auto">
          {filteredStores.map((store) => {
            const collected = isCollected(store.id);
            return (
              <div key={store.id} onClick={() => { setSidebarOpen(false); handleStoreClick(store); setModalStore(store); }}
                className="shrink-0 w-24 rounded-xl border-2 p-2 cursor-pointer active:scale-95 transition-transform"
                style={collected
                  ? { borderColor: '#6EE7B7', backgroundColor: '#F0FDF4' }
                  : store.isSpecial
                  ? { borderColor: store.markerColor, backgroundColor: store.markerColor === '#E8A000' ? '#FFFBEB' : '#FAF5FF' }
                  : { borderColor: '#E5E7EB', backgroundColor: 'white' }}>
                <div className="text-lg mb-0.5">{collected ? '🥤' : store.categoryIcon}</div>
                <p className="text-xs font-black text-gray-900 leading-tight" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.name}</p>
                <p className="text-xs text-gray-400">{store.district}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Store Modal ── */}
      <AnimatePresence>
        {modalStore && (
          <StoreModal
            store={modalStore}
            onClose={() => { setModalStore(null); }}
            onVerify={() => { if (modalStore) addStamp(modalStore.id); }}
            alreadyCollected={isCollected(modalStore.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}