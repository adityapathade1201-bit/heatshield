import { createContext, useContext, useState, type ReactNode } from 'react';

export interface UserProfile {
  name: string;
  email: string;
  ward?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  signIn: (email: string, pass: string) => Promise<boolean>;
  signUp: (name: string, email: string, pass: string, confirmPassword: string) => Promise<boolean>;
  completeOnboarding: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('hw_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('hw_onboarded') === 'true';
  });

  const isAuthenticated = !!user;

  const signIn = async (email: string, pass: string): Promise<boolean> => {
    // Basic validation
    if (!email || !pass) return false;
    const existingUser: UserProfile = {
      name: email.split('@')[0],
      email: email,
      ward: 'Pune Central',
    };
    setUser(existingUser);
    localStorage.setItem('hw_user', JSON.stringify(existingUser));
    return true;
  };

  const signUp = async (name: string, email: string, pass: string, confirmPassword: string): Promise<boolean> => {
    if (!name || !email || !pass || pass !== confirmPassword) return false;
    const newUser: UserProfile = {
      name: name.trim(),
      email: email.trim(),
      ward: 'Shivajinagar, Pune',
    };
    setUser(newUser);
    localStorage.setItem('hw_user', JSON.stringify(newUser));
    return true;
  };

  const completeOnboarding = () => {
    setIsOnboarded(true);
    localStorage.setItem('hw_onboarded', 'true');
  };

  const signOut = () => {
    setUser(null);
    setIsOnboarded(false);
    localStorage.removeItem('hw_user');
    localStorage.removeItem('hw_onboarded');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isOnboarded,
        signIn,
        signUp,
        completeOnboarding,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}