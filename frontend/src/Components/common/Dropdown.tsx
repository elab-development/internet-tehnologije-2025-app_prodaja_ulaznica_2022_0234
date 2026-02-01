import React, { ReactNode } from 'react';

interface DropdownProps {
  color?: string;
  children: ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({ color = 'gray', children }) => {
  return (
    <div className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-${color}-200 z-50`}>
      <div className="py-2">
        {children}
      </div>
    </div>
  );
};

export default Dropdown;