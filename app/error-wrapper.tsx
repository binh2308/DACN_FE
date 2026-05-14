"use client";
import "./globals.css";

import { useState } from "react";

interface WrapperProps {
  children: React.ReactNode;
}

const ErrorSimulator = ({
  message = "Đã xảy ra lỗi",
}: {
  message?: string;
}) => {
  const [error, setError] = useState(false);

  if (error) throw new Error(message);

  return (
    <button
      title="Mô phỏng lỗi"
      className="bg-red-950 text-red-500 rounded p-1 leading-none font-semibold text-sm hover:bg-red-900 transition"
      onClick={() => setError(true)}
    >
      Mô phỏng lỗi
    </button>
  );
};

export const ErrorWrapper = ({ children }: WrapperProps) => {
  return (
    <div className="flex flex-col rounded-lg mt-8 relative p-4 border border-gray-300">
      <div className="absolute top-0 left-4 -translate-y-1/2">
        <ErrorSimulator message="Lỗi mô phỏng ở layout gốc" />
      </div>
      {children}
    </div>
  );
};