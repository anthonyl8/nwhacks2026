import React from 'react';


interface ButtonProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ label, isActive = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-full font-medium transition-colors ${
        isActive
          ? 'bg-teal-700 text-white'
          : 'bg-white text-teal-700 hover:bg-teal-50'
      }`}
    >
      {label}
    </button>
  );
};

export default Button