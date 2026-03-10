import { createBrowserRouter } from 'react-router';
import { RootLayout } from './pages/RootLayout';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { StampPage } from './pages/StampPage';
import { PrizePage } from './pages/PrizePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { RouletteEventPage } from './pages/RouletteEventPage';
import { MyPage } from './pages/MyPage';

export const router = createBrowserRouter([
  // Auth pages (no Navbar/Footer)
  { path: '/login', Component: LoginPage },
  { path: '/signup', Component: SignupPage },

  // QR Roulette event (no Navbar/Footer, public)
  { path: '/event', Component: RouletteEventPage },

  // Main layout
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'map', Component: MapPage },
      { path: 'stamps', Component: StampPage },
      { path: 'prizes', Component: PrizePage },
      { path: 'mypage', Component: MyPage },
    ],
  },
]);
