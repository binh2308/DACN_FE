import React from 'react';
import { Search, ChevronDown, Plus } from 'lucide-react';

export function Header() {
  return (
    <div className="h-[83px] bg-white shadow-[0_4px_20px_0_rgba(91,91,91,0.13)] px-6 flex items-center justify-between">
      {/* Search Bar */}
      <div className="relative w-[425px]">
        <div className="flex items-center h-10 border border-dashboard-border bg-[rgba(229,237,249,0.44)] rounded-lg px-4 gap-3">
          <Search size={20} className="text-[#BBC5DC] opacity-50" />
          <input
            type="text"
            placeholder="Search"
            className="flex-1 bg-transparent text-dashboard-text placeholder:text-dashboard-text placeholder:opacity-50 font-poppins text-base outline-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 h-10 px-4 bg-dashboard-blue text-white font-semibold text-sm rounded-lg hover:opacity-90 transition-all font-poppins">
          <Plus size={16} />
          Add Candidate
        </button>

        <button className="flex items-center gap-2 h-10 px-4 bg-dashboard-blue text-white font-semibold text-sm rounded-lg hover:opacity-90 transition-all font-poppins">
          <Plus size={16} />
          Add Job
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 ml-4">
          <div className="w-11 h-11 rounded-full bg-[rgba(151,162,244,0.38)] flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#D9D9D9] bg-cover bg-center" 
                 style={{backgroundImage: "url('https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=80&h=80&fit=crop&crop=face')"}} />
          </div>
          <span className="text-dashboard-text font-semibold text-base font-poppins">Jane Doe</span>
          <ChevronDown size={16} className="text-dashboard-text opacity-50" />
        </div>
      </div>
    </div>
  );
}
