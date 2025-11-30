import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Checkbox({ checked, onChange, label, className = '' }: CheckboxProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => onChange(!checked)}
        className="w-4 h-4 border border-[#4B93E7] rounded flex items-center justify-center hover:opacity-80 transition-opacity"
      >
        {checked && (
          <div className="w-3 h-3 bg-[#4B93E7] rounded"></div>
        )}
      </button>
      {label && (
        <span className="text-base text-[#082777] font-poppins">{label}</span>
      )}
    </div>
  );
}
