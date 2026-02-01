import React from 'react';
import { Link } from 'react-router-dom';

interface DropdownItemProps {
  url: string;
  text: string;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ url, text }) => {
  return (
    <Link
      to={`/${url}`}
      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
    >
      {text}
    </Link>
  );
};

export default DropdownItem;