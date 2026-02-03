import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface MasterProps {
  children: ReactNode;
}

const Master: React.FC<MasterProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Master;