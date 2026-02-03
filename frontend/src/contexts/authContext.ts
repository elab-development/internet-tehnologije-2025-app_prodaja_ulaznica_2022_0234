import { createContext } from 'react';

export interface User {
  id: number;
  korisnickoIme: string;
  email: string;
  role: 'guest' | 'user' | 'admin';
  ime?: string;
  prezime?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);