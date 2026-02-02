import { useState, ReactNode } from 'react';
import { AlertContext, initialState, IAlert } from '../contexts/alertContext';

interface AlertProviderProps {
  children: ReactNode;
}

const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alert, setAlert] = useState<IAlert>(initialState.alert);

  const contextValue = {
    alert,
    hideAlert: () => setAlert(initialState.alert),
    showAlert: (payload: IAlert) => setAlert({ ...payload, show: true }),
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
    </AlertContext.Provider>
  );
};

export default AlertProvider;