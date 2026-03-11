import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Users, Play, Star, Instagram, MapPin } from 'lucide-react';
import influencerImg from 'figma:asset/1882e03ea2fcea99d8f758424a449c8a7fd12172.png';

const GREEN = '#2BAE4E';
const YELLOW = '#FFD740';
const BHS = "'Black Han Sans', sans-serif";

const YT_CHANNEL = 'https://www.youtube.com/@kimbapboss';
const INSTA_URL = 'https://www.instagram.com/gimbapzip/';
const GIMBAP_ROAD = 'https://neer.by/gimbapzip';

const STATS = [
  { label: '인스타그램', value: '24만+', icon: Users, color: '#E1306C' },
  { label: '유튜브', value: '8.25만', icon: Play, color: '#FF0000' },
  { label: '콘텐츠', value: '김밥 전문', icon: Star, color: '#E8A000' },
];

const HIGHLIGHTS = [
  { emoji: '⛰️', text: "'19~ 등산 인플루언서 시작" },
  { emoji: '🍴', text: "'20~ 푸글 음식 크리에이터" },
  { emoji: '🍙', text: "'21~ 김밥집 인스타그램 개설" },
  { emoji: '🎬', text: "'23~ 유튜브 김밥대장 채널 오픈" },
];

function YoutubeSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.3-1.9.5-3.8.5-5.8s-.2-3.9-.5-5.8Z" fill="#FF0000" />
      <path d="m9.6 15.6 6.3-3.6-6.3-3.6v7.2Z" fill="#FFF" />
    </svg>
  );
}

export function InfluencerSection() {
  return (
    <section
      className="py-16 md:py-20 px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0D0D0D 0%, #1A1A2E 60%, #0D0D0D 100%)' }}
    >
      {/* Grid BG */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Floating orbs */}
      {[GREEN, YELLOW, '#EF4444'].map((c, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ width: 180 + i * 60, height: 180 + i * 60, backgroundColor: c, opacity: 0.04, left: `${10 + i * 30}%`, top: `${20 + i * 15}%` }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }} />
      ))}

      <div className="max-w-6xl mx-auto relative">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)' }}>
            <YoutubeSvg />
            <span style={{ color: '#FCA5A5', fontSize: '12px', fontWeight: 700 }}>밥풀이네 김밥집</span>
          </div>
          <h2 style={{ fontFamily: BHS, fontSize: 'clamp(26px, 5vw, 44px)', color: 'white', lineHeight: 1.1 }}>
            김밥대장과 함께하는<br />
            <span style={{ color: YELLOW }}>칠성사이다 스탬프 투어</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '10px', fontWeight: 400, maxWidth: 480, marginInline: 'auto', lineHeight: 1.7 }}>
            인스타그램 24만 · 유튜브 8.25만 팔로워의 김밥 전문 크리에이터가<br className="hidden sm:block" />
            직접 엄선한 서울 김밥 핫플 20곳을 소개합니다
          </p>
        </motion.div>

        {/* ── Main Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl overflow-hidden mb-8"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}
        >
          <div className="flex flex-col lg:flex-row">
            {/* Left: Influencer Photo */}
            <div className="lg:w-[45%] relative" style={{ minHeight: 320 }}>
              <img src={influencerImg} alt="김밥대장 밥풀이네 김밥집" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))' }} />
              {/* Profile badge overlay */}
              <motion.div
                className="absolute bottom-4 left-4 flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FF0000, #CC0000)', border: '2px solid rgba(255,255,255,0.3)' }}>
                  <span style={{ fontSize: 22 }}>👑</span>
                </div>
                <div>
                  <p className="text-white text-sm" style={{ fontWeight: 800 }}>김밥대장</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>밥풀이네 김밥집</p>
                </div>
              </motion.div>
            </div>

            {/* Right: Info */}
            <div className="lg:w-[55%] p-6 md:p-8 flex flex-col justify-center">
              {/* Stats row */}
              <div className="flex gap-3 mb-6">
                {STATS.map((s) => (
                  <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
                    style={{ background: `${s.color}15`, border: `1px solid ${s.color}33` }}>
                    <s.icon size={16} className="mx-auto mb-1" style={{ color: s.color }} />
                    <p style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>{s.value}</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Bio */}
              <div className="mb-6">
                <h3 className="text-white mb-3" style={{ fontWeight: 800, fontSize: 18 }}>
                  "김밥 하나로 세상을 행복하게" 🍙
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.8 }}>2021년 인스타그램 <strong style={{ color: '#FCA5A5' }}>@gimbapzip</strong> 계정을 개설하며 김밥 전문 크리에이터로 본격 활동을 시작했고, 2023년부터는 유튜브 <strong style={{ color: '#FCA5A5' }}>김밥대장</strong> 채널까지 운영하며 전국 김밥 맛집을 소개하고 있습니다. 이번 칠성사이다 스탬프 투어에서 김밥대장이 직접 엄선한 서울 김밥 맛집 20곳을 만나보세요!</p>
              </div>

              {/* Highlights */}
              

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3">
                <a href={YT_CHANNEL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-white text-sm hover:opacity-90 transition-opacity"
                  style={{ background: '#FF0000', fontWeight: 700 }}>
                  <YoutubeSvg /> 유튜브 채널 보기
                </a>
                <a href={INSTA_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm hover:opacity-90 transition-opacity"
                  style={{ background: '#E1306C', color: 'white', fontWeight: 600 }}>
                  <Instagram size={14} /> 인스타그램
                </a>
                <a href={GIMBAP_ROAD} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm hover:opacity-90 transition-opacity"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.25)', color: 'white', fontWeight: 600 }}>
                  <MapPin size={14} /> 김밥 맛집 로드맵
                </a>
                <Link to="/map"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm text-gray-900 hover:opacity-90 transition-opacity"
                  style={{ background: `linear-gradient(135deg, ${YELLOW}, #FFA000)`, fontWeight: 700 }}>
                  🗺️ 추천 맛집 보러 가기
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Collab banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl p-5"
          style={{ background: `linear-gradient(135deg, ${GREEN}22, ${GREEN}11)`, border: `1px solid ${GREEN}44` }}
        >
          <div className="flex flex-wrap items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 26 }}>🥤</span>
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)' }}>×</span>
              <span style={{ fontSize: 26 }}>👑</span>
            </div>
            <div>
              <p style={{ fontFamily: BHS, fontSize: '15px', color: 'white' }}>칠성사이다 × 김밥대장 공식 콜라보</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '2px', fontWeight: 400 }}>
                김밥대장이 직접 고른 10곳에서 스탬프를 모으고 리워드를 받아가세요!
              </p>
            </div>
            <Link to="/event?store=daejang-hongdae&name=김밥대장 홍대본점"
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-900 hover:opacity-90 transition-opacity shrink-0"
              style={{ background: `linear-gradient(135deg, ${YELLOW}, #FFA000)` }}>
              🎰 룰렛 체험하기
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}