import { ReactNode } from 'react';

// interfaces
interface IProps {
  children: ReactNode;
  className?: string;
}

const CardGroup: React.FC<IProps> = ({ children, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
    {children}
  </div>
);

export default CardGroup;