'use client';

import { useState, useEffect } from 'react';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
}

const InputArea = ({ value, onChange }: InputAreaProps) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="w-full">
      <label htmlFor="documentation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Documentation Text/JSON
      </label>
      <textarea
        id="documentation"
        name="documentation"
        rows={10}
        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        placeholder="Paste your API documentation or JSON schema here..."
        value={inputValue}
        onChange={handleChange}
      />
    </div>
  );
};

export default InputArea;
