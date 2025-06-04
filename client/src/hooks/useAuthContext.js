import { useMockAuth } from '../contexts/MockAuthContext';
import { useAuth } from '../contexts/AuthContext';

export const useAuthContext = () => {
  const useMockAuthFlag = process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_AUTH === 'true';
  
  // Call both hooks unconditionally to satisfy React hooks rules
  const mockAuth = useMockAuth();
  const realAuth = useAuth();
  
  // Return the appropriate context based on the flag
  return useMockAuthFlag ? mockAuth : realAuth;
};