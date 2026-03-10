import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { StampProvider } from './context/StampContext';

export default function App() {
  return (
    <AuthProvider>
      <StampProvider>
        <RouterProvider router={router} />
      </StampProvider>
    </AuthProvider>
  );
}
