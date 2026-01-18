import React from 'react';
import Button from './Button';
import { useNavigate } from '@react-router/dev';

interface NavBarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const NavBar: React.FC<NavBarProps> = ({ activeTab = 'Home', onTabChange }) => {
  const tabs = ['Home', 'New Session', 'Past Sessions', 'Agent'];

  return (
    <nav className="bg-white rounded-lg shadow-sm p-2 flex gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab}
          label={tab}
          isActive={activeTab === tab}
          onClick={() => onTabChange?.(tab)}
        />
      ))}
    </nav>
  );
};
export default NavBar;