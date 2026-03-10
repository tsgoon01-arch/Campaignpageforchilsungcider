import { Link } from 'react-router';
import chilsungLogo from 'figma:asset/08d441681e4b572c719575a05a82eb624321bfac.png';

const GREEN = '#2BAE4E';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={chilsungLogo}
                alt="칠성사이다"
                style={{ height: '40px', width: 'auto', borderRadius: '9px' }}
              />
              <div>
                <div className="text-white font-bold text-sm">스탬프 투어</div>
                <div className="text-xs text-gray-500 mt-0.5">김밥 로드 2026</div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#1a2a1a', color: GREEN }}>캠페인 기간</span>
              <span className="text-xs text-gray-500">2026.03.01 ~ 2026.08.31</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-white font-semibold mb-3">바로가기</p>
              <ul className="space-y-2">
                {[['/', '캠페인 소개'], ['/map', '맛집 지도'], ['/stamps', '내 스탬프'], ['/prizes', '경품 안내']].map(([to, label]) => (
                  <li key={to}><Link to={to} className="hover:text-white transition-colors text-xs">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-3">고객센터</p>
              <ul className="space-y-2 text-xs">
                <li>평일 09:00 ~ 18:00</li>
                <li>stamp@chilsung.co.kr</li>
                <li>1588-0000</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-600"
          style={{ borderColor: '#1F2937' }}>
          <p>© 2026 롯데칠성음료㈜. All rights reserved.</p>
          <p>본 캠페인은 데모 페이지입니다. 실제 서비스와 다를 수 있습니다.</p>
        </div>
      </div>
    </footer>
  );
}