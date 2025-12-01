import React from 'react';
import { Plus } from 'lucide-react';

interface MeetingProps {
  time: string;
  candidate: string;
  role: string;
  phase: string;
  timeRange: string;
  type: 'blue' | 'green';
}

function MeetingItem({ time, candidate, role, phase, timeRange, type }: MeetingProps) {
  const bgColor = type === 'blue'
    ? 'bg-dashboard-lightBlue'
    : 'bg-dashboard-lightGreen';

  const textColor = type === 'blue'
    ? 'text-dashboard-meetingBlue'
    : 'text-dashboard-meetingGreen';

  const borderColor = type === 'blue'
    ? 'bg-[rgba(27,92,190,0.44)]'
    : 'bg-[rgba(43,87,8,0.24)]';

  return (
    <div className={`relative h-9 w-full rounded ${bgColor} flex items-center`}>
      {/* Time */}
      <div className={`text-xs font-bold ${textColor} w-10 text-center font-poppins`}>
        {time}
      </div>

      {/* Vertical divider */}
      <div className={`w-px h-9 ${borderColor} mx-2`} />

      {/* Meeting details */}
      <div className={`flex-1 text-[10px] ${textColor} font-poppins`}>
        <span className="font-bold">{candidate};</span>
        <span className="font-normal"> {role}; {phase}</span>
        <span className="font-bold"> | {timeRange}</span>
      </div>
    </div>
  );
}

export function UpcomingMeetings() {
  const meetings = [
    // Today
    { time: '3:15', candidate: 'Mini Soman', role: 'Mean stack developer', phase: '4th phase interview', timeRange: '3:15 - 3:45', type: 'blue' as const },
    { time: '10:00', candidate: 'Mini Soman', role: 'Mean stack developer', phase: '4th phase interview', timeRange: '3:15 - 3:45', type: 'blue' as const },
    { time: '10:00', candidate: 'Mini Soman', role: 'Mean stack developer', phase: '4th phase interview', timeRange: '3:15 - 3:45', type: 'green' as const },
    
    // Tomorrow  
    { time: '10:00', candidate: 'Mini Soman', role: 'Mean stack developer', phase: '4th phase interview', timeRange: '3:15 - 3:45', type: 'green' as const },
    { time: '3:15', candidate: 'Mini Soman', role: 'Mean stack developer', phase: '4th phase interview', timeRange: '3:15 - 3:45', type: 'blue' as const },
    { time: '10:00', candidate: 'Mini Soman', role: 'Mean stack developer', phase: '4th phase interview', timeRange: '3:15 - 3:45', type: 'blue' as const },
    
    // This Week
    { time: 'Sep 3', candidate: 'Mini Soman', role: 'Mean stack developer', phase: '4th phase interview', timeRange: '3:15 - 3:45', type: 'blue' as const },
    { time: 'Sep 3', candidate: 'Mini Soman', role: 'Mean stack developer', phase: '4th phase interview', timeRange: '3:15 - 3:45', type: 'green' as const },
    { time: 'Sep 6', candidate: 'Mini Soman', role: 'Mean stack developer', phase: '4th phase interview', timeRange: '3:15 - 3:45', type: 'blue' as const },
    { time: 'Sep 7', candidate: 'Mini Soman', role: 'Mean stack developer', phase: '4th phase interview', timeRange: '3:15 - 3:45', type: 'green' as const },
    { time: 'Sep 8', candidate: 'Mini Soman', role: 'Mean stack developer', phase: '4th phase interview', timeRange: '3:15 - 3:45', type: 'blue' as const },
    { time: 'Sep 8', candidate: 'Mini Soman', role: 'Mean stack developer', phase: '4th phase interview', timeRange: '3:15 - 3:45', type: 'green' as const },
  ];

  const sections = [
    { title: 'Today', meetings: meetings.slice(0, 3) },
    { title: 'Tomorrow', meetings: meetings.slice(3, 6) },
    { title: 'This Week', meetings: meetings.slice(6) }
  ];

  return (
    <div className="w-80 h-screen bg-dashboard-cardBg rounded-l">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-dashboard-text font-semibold text-base font-poppins">Upcoming Meetings</h2>
          <button className="p-1">
            <Plus size={20} className="text-dashboard-blue" />
          </button>
        </div>
      </div>

      {/* Meetings List */}
      <div className="p-2 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
        {sections.map((section, sectionIndex) => (
          <div key={section.title} className="space-y-2">
            <h3 className="text-dashboard-text opacity-50 font-bold text-xs px-2 font-poppins">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.meetings.map((meeting, index) => (
                <MeetingItem
                  key={`${sectionIndex}-${index}`}
                  time={meeting.time}
                  candidate={meeting.candidate}
                  role={meeting.role}
                  phase={meeting.phase}
                  timeRange={meeting.timeRange}
                  type={meeting.type}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
