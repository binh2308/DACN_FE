import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";

interface LoginInputProps {
  label: string;
  value: string;
  setValue: (value: string) => void;
  type?: "email" | "password";
  placeholder?: string;
  hasActiveIndicator?: boolean;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export function LoginInput({
  label,
  value,
  setValue,
  type,
  placeholder,
}: LoginInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <>
      <label className="flex items-start gap-0.5">
        <span className="text-black text-xs font-normal ">{label}</span>
        <span className="text-[#E03137] text-xs font-medium">*</span>
      </label>
      <div className="relative">
      <input
        type={showPassword ? "text" : type}
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full px-3 rounded-lg border border-grey-50 text-xs leading-[150%] tracking-[0.07px] placeholder:text-[#B8BDC5] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
      />
      {type === "password" && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#383E47] hover:text-grey-900 transition-colors"
        >
          {showPassword ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
      )
      }
      </div>
    </>
  );
}
