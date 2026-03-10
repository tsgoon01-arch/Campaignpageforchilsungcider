export interface GrandPrizeItem {
  name: string;
  quantity: string;
  emoji: string;
}

export interface Prize {
  id: string;
  tier: number;
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
    id: 'prize-tshirt77',
    tier: 1,
    tierLabel: '4스탬프 리워드',
    checkinsRequired: 4,
    title: '한정판 티셔츠 77명 추첨',
    subtitle: '칠성사이다 × 김밥대장 콜라보 한정판',
    description: '4번째 스탬프 달성 시 자동으로 추첨에 등록됩니다. 칠성사이다 × 김밥대장 콜라보 한정판 티셔츠를 77명에게 드립니다.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    deliveryMethod: '추첨 후 택배 발송',
    deliveryType: 'lottery',
    dailyLimit: null,
    limitPeriod: '캠페인 기간 내 추첨 · 77명',
    themeColor: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    emoji: '👕',
    badge: '🔥 한정 77명',
    isLottery: true,
    grandPrizes: [
      { name: '칠성사이다 × 김밥대장 콜라보 티셔츠', quantity: '77명', emoji: '👕' },
    ],
  },
  {
    id: 'prize-korail',
    tier: 2,
    tierLabel: '7스탬프 리워드',
    checkinsRequired: 7,
    title: '코레일 기차 여행권 추첨',
    subtitle: 'KTX 포함 전국 기차 여행권',
    description: '7번째 스탬프 달성 시 자동으로 추첨에 등록됩니다. KTX를 포함한 전국 기차 여행권을 추첨으로 드립니다.',
    image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&q=80',
    deliveryMethod: '추첨 후 모바일 발송',
    deliveryType: 'lottery',
    dailyLimit: null,
    limitPeriod: '캠페인 기간 내 추첨',
    themeColor: '#E8A000',
    bgColor: '#FFFBEB',
    borderColor: '#FCD34D',
    emoji: '🚂',
    badge: '🚄 KTX 포함',
    isLottery: true,
    grandPrizes: [
      { name: '코레일 KTX 왕복 여행권', quantity: '10명', emoji: '🚅' },
      { name: '코레일 일반 기차 여행권', quantity: '20명', emoji: '🚂' },
    ],
  },
];
