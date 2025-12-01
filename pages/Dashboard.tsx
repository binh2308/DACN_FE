import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StatusCards } from '../components/StatusCards';
import { JobsTable } from '../components/JobsTable';
import { UpcomingMeetings } from '../components/UpcomingMeetings';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-dashboard-bg flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 flex relative">
          <div className="flex-1 pl-8 pr-4 py-6 space-y-8">
            <div>
              <h1 className="text-[22px] font-bold text-dashboard-text mb-6 font-poppins">Overview</h1>
              <StatusCards />
            </div>

            <div>
              <h2 className="text-[22px] font-bold text-dashboard-text mb-6 font-poppins">Require Attention</h2>
              <JobsTable />
            </div>
          </div>

          <UpcomingMeetings />
        </main>
      </div>
    </div>
  );
}
