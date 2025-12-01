import React from 'react';

interface LoginButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function LoginButton({
  children,
  variant = 'primary',
  icon,
  onClick,
  className = ''
}: LoginButtonProps) {
  const baseClasses = "w-full h-12 rounded-lg flex items-center justify-center gap-3 font-semibold text-base font-poppins transition-opacity hover:opacity-90";
  
  const variantClasses = {
    primary: "bg-[#F7AC25] text-[#F3F8FF] shadow-[0_4px_8px_0_rgba(0,0,0,0.16)_inset]",
    secondary: "bg-[#4B93E7] text-[#E6EEF8] shadow-[0_4px_8px_0_rgba(0,0,0,0.16)_inset]"
  };

  return (
    <button 
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
      {icon}
    </button>
  );
}
