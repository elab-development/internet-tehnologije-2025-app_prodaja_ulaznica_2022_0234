import { createContext } from 'react';

export interface AlertState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

export interface AlertContextType {
  alert: AlertState;
  showAlert: (alert: AlertState) => void;
  hideAlert: () => void;
}

export const AlertContext = createContext<AlertContextType | undefined>(undefined);