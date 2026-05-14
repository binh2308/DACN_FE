import React, { useState } from 'react';
import { Briefcase, MoreVertical } from 'lucide-react';

interface JobData {
  title: string;
  daysAgo: string;
  positionsLeft: number;
  applications: number;
  interviewed: number;
  rejected: number;
  feedbackPending: number;
  offered: number;
}

export function JobsTable() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates' | 'onboardings'>('jobs');

  const jobsData: JobData[] = [
    {
      title: "Chuyên viên phân tích dữ liệu cao cấp",
      daysAgo: "100 ngày trước",
      positionsLeft: 3,
      applications: 123,
      interviewed: 40,
      rejected: 33,
      feedbackPending: 7,
      offered: 2
    },
    {
      title: "Chuyên viên phân tích dữ liệu sơ cấp",
      daysAgo: "78 ngày trước",
      positionsLeft: 7,
      applications: 567,
      interviewed: 22,
      rejected: 20,
      feedbackPending: 2,
      offered: 4
    },
    {
      title: "Nhà thiết kế sản phẩm",
      daysAgo: "56 ngày trước",
      positionsLeft: 2,
      applications: 201,
      interviewed: 32,
      rejected: 18,
      feedbackPending: 14,
      offered: 0
    },
    {
      title: "Lập trình viên Java",
      daysAgo: "46 ngày trước",
      positionsLeft: 5,
      applications: 231,
      interviewed: 23,
      rejected: 10,
      feedbackPending: 13,
      offered: 3
    },
    {
      title: "Quản lý sản phẩm",
      daysAgo: "13 ngày trước",
      positionsLeft: 3,
      applications: 67,
      interviewed: 41,
      rejected: 22,
      feedbackPending: 19,
      offered: 1
    }
  ];

  const tabs = [
    { key: 'jobs' as const, label: 'Công việc', active: true },
    { key: 'candidates' as const, label: 'Ứng viên', active: false },
    { key: 'onboardings' as const, label: 'Tiếp nhận', active: false }
  ];

  const columns = [
    { key: 'title', label: '' },
    { key: 'positionsLeft', label: 'Vị trí còn lại' },
    { key: 'applications', label: 'Hồ sơ ứng tuyển' },
    { key: 'interviewed', label: 'Đã phỏng vấn' },
    { key: 'rejected', label: 'Bị từ chối' },
    { key: 'feedbackPending', label: 'Chờ phản hồi' },
    { key: 'offered', label: 'Đã đề nghị' }
  ];

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-8 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-base font-semibold transition-colors font-poppins ${
              activeTab === tab.key
                ? 'text-dashboard-text'
                : 'text-dashboard-text opacity-50 hover:opacity-75'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-dashboard-cardBg rounded-lg p-1">
        {/* Table Header */}
        <div className="grid grid-cols-7 gap-4 px-6 py-4 text-dashboard-text opacity-50 text-base font-normal font-poppins">
          <div></div>
          {columns.slice(1).map((col) => (
            <div key={col.key} className="text-center">
              {col.label}
            </div>
          ))}
        </div>

        {/* Table Rows */}
        <div className="space-y-1">
          {jobsData.map((job, index) => (
            <div
              key={index}
              className="bg-dashboard-cardBg rounded-lg py-4 px-6 grid grid-cols-7 gap-4 items-center border-b border-dashboard-bg hover:bg-white/50 transition-colors"
            >
              {/* Job Info */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#B3C6ED] flex items-center justify-center">
                  <Briefcase size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-dashboard-text font-semibold text-base font-poppins">{job.title}</h3>
                  <p className="text-dashboard-text opacity-50 text-xs font-semibold font-poppins">{job.daysAgo}</p>
                </div>
              </div>

              {/* Data Columns */}
              <div className="text-center text-dashboard-text font-semibold text-base font-poppins">
                {job.positionsLeft}
              </div>
              <div className="text-center text-dashboard-text opacity-50 font-semibold text-base font-poppins">
                {job.applications}
              </div>
              <div className="text-center text-dashboard-text opacity-50 font-semibold text-base font-poppins">
                {job.interviewed}
              </div>
              <div className="text-center text-dashboard-text opacity-50 font-semibold text-base font-poppins">
                {job.rejected}
              </div>
              <div className="text-center text-dashboard-text opacity-50 font-semibold text-base font-poppins">
                {job.feedbackPending}
              </div>
              <div className="text-center text-dashboard-text font-semibold text-base font-poppins">
                {job.offered}
              </div>
            </div>
          ))}
        </div>

        {/* Orange indicator line */}
        <div className="ml-6 mt-4 w-8 h-0.5 bg-dashboard-orange rounded-full" />
      </div>
    </div>
  );
}
