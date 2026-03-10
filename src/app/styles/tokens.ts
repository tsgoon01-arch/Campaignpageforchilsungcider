// ── Brand color tokens ─────────────────────────────────────────────────────
export const GREEN   = '#2BAE4E';
export const YELLOW  = '#FFD740';
export const DARK    = '#1A1A1A';
export const GRAY    = '#6B7280';
export const GRAY_LT = '#F3F4F6';

// ── Font tokens ────────────────────────────────────────────────────────────
/** 히어로 전용 디스플레이 폰트 (Black Han Sans) */
export const FONT_DISPLAY = "'Black Han Sans', sans-serif";
/** 전체 기본 폰트 (Pretendard) — 대부분의 경우 CSS 전역 설정으로 충분 */
export const FONT_BASE    = "'Pretendard Variable', Pretendard, sans-serif";

// ── Simple button style helpers ────────────────────────────────────────────
type CSSProps = React.CSSProperties;

/** 초록 Primary 버튼 */
export const btnPrimary: CSSProps = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  backgroundColor: GREEN, color: '#fff',
  padding: '11px 24px', borderRadius: '100px',
  fontWeight: 700, fontSize: '14px', textDecoration: 'none',
  border: 'none', cursor: 'pointer', transition: 'opacity 0.15s',
};

/** 다크(검정) Secondary 버튼 */
export const btnDark: CSSProps = {
  ...btnPrimary,
  backgroundColor: DARK, color: '#fff',
};

/** 노랑 Accent 버튼 */
export const btnYellow: CSSProps = {
  ...btnPrimary,
  backgroundColor: YELLOW, color: DARK,
};

/** 아웃라인 버튼 */
export const btnOutline: CSSProps = {
  ...btnPrimary,
  backgroundColor: 'transparent', color: DARK,
  border: `1.5px solid #D1D5DB`,
};

/** 흰색 배경 버튼 (다크 텍스트) */
export const btnWhite: CSSProps = {
  ...btnPrimary,
  backgroundColor: '#fff', color: DARK,
  border: `1.5px solid #E5E7EB`,
};

/** 반투명 글래스 버튼 (사진 위에서 사용) */
export const btnGlass: CSSProps = {
  ...btnPrimary,
  backgroundColor: 'rgba(255,255,255,0.15)',
  color: '#fff',
  border: '1.5px solid rgba(255,255,255,0.4)',
  backdropFilter: 'blur(6px)',
};
