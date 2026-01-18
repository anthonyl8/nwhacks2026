import React from 'react';

interface InputFieldProps {
  label: string;
  isOptional?: boolean;
  hasOptions?: boolean;
  options?: string[];
  defaultText?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  isOptional = false,
  hasOptions = false,
  options = [],
  defaultText = '',
  value = '',
  onChange,
}) => {
  const [selectedValue, setSelectedValue] = React.useState(value);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const handleChange = (newValue: string) => {
    setSelectedValue(newValue);
    onChange?.(newValue);
  };

  const handleOptionClick = (option: string) => {
    handleChange(option);
    setIsDropdownOpen(false);
  };

  return (
    <div className="mb-6">
      <label className="block text-white text-sm mb-2">
        {label}
        {!isOptional && <span className="text-white ml-1">*</span>}
        {isOptional && <span className="text-white ml-1">*</span>}
      </label>
      
      {hasOptions ? (
        <div className="relative">
          <input
            type="text"
            value={selectedValue}
            placeholder={defaultText}
            readOnly
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-3 rounded-full bg-white text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {options.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-gray-700 first:rounded-t-lg last:rounded-b-lg"
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <input
          type="text"
          value={selectedValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={defaultText}
          className="w-full px-4 py-3 rounded-full bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      )}
    </div>
  );
};

export default InputField;