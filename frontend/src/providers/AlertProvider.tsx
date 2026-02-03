import { useState, ReactNode, useCallback } from 'react';
import { AlertContext, AlertState } from '../contexts/alertContext';

interface AlertProviderProps {
  children: ReactNode;
}

const initialState: AlertState = {
  show: false,
  type: 'info',
  text: '',
};

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alert, setAlert] = useState<AlertState>(initialState);

  const showAlert = useCallback((alertData: AlertState) => {
    setAlert({ ...alertData, show: true });

    // Auto-hide after 5 seconds
    if (alertData.show) {
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, show: false }));
      }, 5000);
    }
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, show: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ alert, showAlert, hideAlert }}>
      {children}
    </AlertContext.Provider>
  );
};