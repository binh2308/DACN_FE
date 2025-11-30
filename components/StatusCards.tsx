import React from 'react';
import { ChevronRight } from 'lucide-react';

interface StatusCardProps {
  number: string;
  title: string;
  illustration: string;
}

function StatusCard({ number, title, illustration }: StatusCardProps) {
  return (
    <div className="relative w-full max-w-[293px] h-[188px] mx-auto">
      {/* Card Background */}
      <div className="absolute left-6 top-[21px] right-6 h-[167px] bg-dashboard-cardBg rounded-lg" />

      {/* Circle with border */}
      <div className="absolute left-0 top-0 w-[86px] h-[92px] bg-dashboard-cardBg border border-[rgba(8,39,119,0.51)] rounded-[30px] flex items-center justify-center">
        <span className="text-dashboard-text font-bold text-2xl font-poppins">{number}</span>
      </div>

      {/* Title */}
      <div className="absolute left-[41px] top-[116px] right-8">
        <p className="text-black opacity-50 font-poppins text-base leading-tight">
          {title}
        </p>
      </div>

      {/* Illustration */}
      <div className="absolute right-8 top-[45px] w-[95px] h-[73px]">
        <img
          src={illustration}
          alt="Illustration"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Arrow */}
      <div className="absolute right-8 bottom-8">
        <ChevronRight size={16} className="text-dashboard-cardBg" />
      </div>
    </div>
  );
}

export function StatusCards() {
  const cards = [
    {
      number: "33",
      title: "Interview Scheduled",
      illustration: "https://api.builder.io/api/v1/image/assets/TEMP/4010d40ffb5da1b4bf2eb208527fed505e500683?width=190"
    },
    {
      number: "2",
      title: "Interview Feedback Pending",
      illustration: "https://api.builder.io/api/v1/image/assets/TEMP/3f942024f13d9b915241e39082235f04c579b84a?width=190"
    },
    {
      number: "44",
      title: "Approval Pending",
      illustration: "https://api.builder.io/api/v1/image/assets/TEMP/14212a0bd0fa5d2122c449f63f403a1a42915424?width=190"
    },
    {
      number: "13",
      title: "Offer Acceptance Pending",
      illustration: "https://api.builder.io/api/v1/image/assets/TEMP/10484dc68d1d0ab6882f37e26f19997de4648c90?width=190"
    },
    {
      number: "17",
      title: "Documentations Pending",
      illustration: "https://api.builder.io/api/v1/image/assets/TEMP/1266006326a7531ebcb15d255b4f680436df627e?width=190"
    },
    {
      number: "3",
      title: "Training Pending",
      illustration: "https://api.builder.io/api/v1/image/assets/TEMP/688e6e87022cf4ac6fc0b22cf6404cf9e7da1312?width=190"
    },
    {
      number: "5",
      title: "Supervisor Allocation Pending",
      illustration: "https://api.builder.io/api/v1/image/assets/TEMP/c25bcb40b0405e7ea331b525acfdc6cb48506513?width=190"
    },
    {
      number: "56",
      title: "Project Allocation Pending",
      illustration: "https://api.builder.io/api/v1/image/assets/TEMP/e61b7b679062a80ef6db80d6c2094106b60824b2?width=190"
    }
  ];

  return (
    <div className="space-y-6">
      {/* First Row - 4 cards */}
      <div className="grid grid-cols-4 gap-6">
        {cards.slice(0, 4).map((card, index) => (
          <StatusCard
            key={index}
            number={card.number}
            title={card.title}
            illustration={card.illustration}
          />
        ))}
      </div>

      {/* Second Row - 4 cards */}
      <div className="grid grid-cols-4 gap-6">
        {cards.slice(4, 8).map((card, index) => (
          <StatusCard
            key={index + 4}
            number={card.number}
            title={card.title}
            illustration={card.illustration}
          />
        ))}
      </div>
    </div>
  );
}
