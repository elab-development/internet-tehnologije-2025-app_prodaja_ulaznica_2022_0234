import { ReactNode } from 'react';
import AlertProvider from '../../providers/AlertProvider';
import Alert from '../alert/Alert';
import Header from './Header';
import Footer from './Footer';

interface MasterProps {
  children: ReactNode;
}

const Master: React.FC<MasterProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <AlertProvider>
        <Alert />
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </AlertProvider>
    </div>
  );
};

export default Master;