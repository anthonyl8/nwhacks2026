import React from 'react';
import Button from './Button';
import { useNavigate } from "react-router";

interface NavBarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const NavBar: React.FC<NavBarProps> = ({ activeTab = 'Home', onTabChange }) => {
  const navigate = useNavigate();
  const navLinks = [
    { label: "Home", path: "/mainPage"},
    { label: "New Session", path: "/new-session"},
    { label: "Past Sessions", path: "/past-sessions"},
    {label: "User Profile", path: "/user-profile"},
  ];

  return (
    <nav className="bg-white rounded-lg shadow-sm p-2 flex gap-2">
      {navLinks.map((link) => (
        <Button
          key={link.path}
          label={link.label}
          onClick={() => navigate(link.path)}
        />
      ))}
    </nav>
  );
};
export default NavBar;
