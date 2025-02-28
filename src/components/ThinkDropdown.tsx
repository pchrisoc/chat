import React from 'react';

interface ThinkDropdownProps {
  steps: string[];
}

const ThinkDropdown: React.FC<ThinkDropdownProps> = ({ steps }) => {
  return (
    <div className="mt-2 p-4 bg-gray-800 rounded-lg">
      <h3 className="font-semibold mb-2">Thinking Process:</h3>
      <ul className="list-disc list-inside">
        {steps.map((step, index) => (
          <li key={index} className="text-gray-200">
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ThinkDropdown;