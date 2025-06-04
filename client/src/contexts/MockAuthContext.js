import React, { createContext, useContext, useState, useEffect } from 'react';

const MockAuthContext = createContext();

export { MockAuthContext };

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

export const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mock user data
  const mockUser = {
    uid: 'mock-user-123',
    email: 'test@mediator.com',
    displayName: 'Test Mediator',
    role: 'mediator',
    isAdmin: false
  };

  const signUp = async (email, password, displayName, role) => {
    setLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser = {
      uid: `mock-${Date.now()}`,
      email,
      displayName,
      role,
      isAdmin: role === 'admin'
    };
    
    setUser(newUser);
    localStorage.setItem('mockUser', JSON.stringify(newUser));
    setLoading(false);
    return newUser;
  };

  const signIn = async (email, password) => {
    setLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    setLoading(false);
    return mockUser;
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('mockUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Auto-login in development mode for testing
      setUser(mockUser);
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
    }
  }, [mockUser]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    signUp,
    signIn,
    signOut
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};