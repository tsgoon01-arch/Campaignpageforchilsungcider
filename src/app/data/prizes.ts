export interface GrandPrizeItem {
  name: string;
  quantity: string;
  emoji: string;
}

export interface Prize {
  id: string;
  tier: 1 | 2 | 3 | 4;
  tierLabel: string;
  checkinsRequired: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  deliveryMethod: string;
  deliveryType: 'gifticon' | 'delivery' | 'lottery';
  dailyLimit: number | null;
  limitPeriod: string;
  themeColor: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
  badge: string;
  isLottery: boolean;
  grandPrizes?: GrandPrizeItem[];
}

export const prizes: Prize[] = [
  {
    id: 'prize-t1',
    tier: 1,
    tierLabel: 'TIER 1',
    checkinsRequired: 2,
    title: '칠성사이다 1캔 기프티콘',
    subtitle: 'CVS(편의점) 사용 가능',
    description: '체크인 2회 달성 즉시 카카오톡으로 발송되는 편의점 사용 가능 기프티콘. 전국 GS25·CU·세븐일레븐 사용 가능.',
    image: 'https://images.unsplash.com/photo-1762769189106-cc314711e4ed?w=600&q=80',
    deliveryMethod: '모바일 발송 (카카오톡)',
    deliveryType: 'gifticon',
    dailyLimit: 100,
    limitPeriod: '30일간 매일 100개 한정',
    themeColor: '#0057B8',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    emoji: '🥤',
    badge: 'T1',
    isLottery: false,
  },
  {
    id: 'prize-t2',
    tier: 2,
    tierLabel: 'TIER 2',
    checkinsRequired: 5,
    title: '칠성사이다 굿즈',
    subtitle: '한정판 브랜드 굿즈 세트',
    description: '칠성사이다 한정판 굿즈 세트 (에코백 + 텀블러 + 스티커 팩). 30일간 매일 30개 선착순으로 제공됩니다.',
    image: 'https://images.unsplash.com/photo-1762326749480-23a37156173d?w=600&q=80',
    deliveryMethod: '사후 택배 발송',
    deliveryType: 'delivery',
    dailyLimit: 30,
    limitPeriod: '30일간 매일 30개 한정',
    themeColor: '#2BAE4E',
    bgColor: '#E8F8EF',
    borderColor: '#BBF7D0',
    emoji: '🎁',
    badge: 'T2',
    isLottery: false,
  },
  {
    id: 'prize-t3',
    tier: 3,
    tierLabel: 'TIER 3',
    checkinsRequired: 7,
    title: '참여 업장 식사권 3만원권',
    subtitle: '칠성 김밥 로드 참여 업장 전용',
    description: '칠성 김밥 로드 참여 업장에서 사용할 수 있는 3만원 식사 상품권. 30일간 매일 10개 선착순으로 제공됩니다.',
    image: 'https://images.unsplash.com/photo-1761303506087-9788d0a98e87?w=600&q=80',
    deliveryMethod: '사후 택배 발송',
    deliveryType: 'delivery',
    dailyLimit: 10,
    limitPeriod: '30일간 매일 10개 한정',
    themeColor: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FCD34D',
    emoji: '🍽️',
    badge: 'T3',
    isLottery: false,
  },
  {
    id: 'prize-t4',
    tier: 4,
    tierLabel: 'TIER 4',
    checkinsRequired: 10,
    title: '추첨형 고가 경품',
    subtitle: '10회 체크인 달성 시 추첨 참여 자격',
    description: '10곳 전체 체크인 완주 시 추첨에 자동으로 참가됩니다. 제세공과금 대납 예정.',
    image: 'https://images.unsplash.com/photo-1692467916029-296977bfa450?w=600&q=80',
    deliveryMethod: '사후 택배 발송 · 제세공과금 대납 예정',
    deliveryType: 'lottery',
    dailyLimit: null,
    limitPeriod: '캠페인 기간 내 추첨',
    themeColor: '#7B2D9C',
    bgColor: '#F3E8FF',
    borderColor: '#C084FC',
    emoji: '🏆',
    badge: 'T4',
    isLottery: true,
    grandPrizes: [
      { name: '삼성 갤럭시북 5', quantity: '1대', emoji: '💻' },
      { name: '애플 아이패드 에어 11', quantity: '2대', emoji: '📱' },
      { name: '다이슨 공기청정기', quantity: '3대', emoji: '🌀' },
    ],
  },
];

export const drawSchedule = [
  { month: '2026년 3월', date: '2026.03.31', type: 'TIER 1 · 2 · 3 (선착순 마감)', winners: 'TIER 1 100개/일, T2 30개/일, T3 10개/일' },
  { month: '2026년 4월', date: '2026.04.30', type: 'TIER 1 · 2 · 3 (선착순 마감)', winners: 'TIER 1 100개/일, T2 30개/일, T3 10개/일' },
  { month: '2026년 5월', date: '2026.05.31', type: 'TIER 1 · 2 · 3 (선착순 마감)', winners: 'TIER 1 100개/일, T2 30개/일, T3 10개/일' },
  { month: '2026년 6월 (최종)', date: '2026.06.30', type: 'TIER 4 추첨 (고가 경품)', winners: '총 6명 (갤럭시북1·아이패드2·다이슨3)' },
];
