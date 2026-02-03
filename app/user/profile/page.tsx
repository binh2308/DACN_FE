"use client";

import { useState } from "react";
import { Calendar, Eye, EyeOff } from "lucide-react";

type TabType = "personal" | "contract";

interface PersonalData {
  fullname: string;
  shortname: string;
  gender: string;
  birthDay: string;
  emailPersonal: string;
  address: string;
  idCard: string;
  taxNumber: string;
  idSocialInsurance: string;
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [personalData, setPersonalData] = useState<PersonalData>({
    fullname: "Nguyen Thanh Nam",
    shortname: "NamNT",
    gender: "Male",
    birthDay: "2000/07/23",
    emailPersonal: "namdepa@911.com",
    address: "xom 4, thon Luong Dien, Dong Da, Tam Nai",
    idCard: "044678821654",
    taxNumber: "2902166920",
    idSocialInsurance: "2902166920",
  });

  const handlePersonalChange = (field: keyof PersonalData, value: string) => {
    setPersonalData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="p-6 bg-[#FAFAFA]">
      <div className="bg-white rounded-lg">
        {/* Tabs */}
        <div className="flex border-b border-[#E9EAEC]">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-6 py-3 text-xs font-extrabold tracking-wide transition-colors relative ${
              activeTab === "personal"
                ? "text-[#21252B] border-b-2 border-[#0B9F57]"
                : "text-[#B8BDC5]"
            }`}
          >
            PERSONAL
          </button>
          <button
            onClick={() => setActiveTab("contract")}
            className={`px-6 py-3 text-xs font-extrabold tracking-wide transition-colors relative ${
              activeTab === "contract"
                ? "text-[#21252B] border-b-2 border-[#0B9F57]"
                : "text-[#B8BDC5]"
            }`}
          >
            CONTRACT
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "personal" ? (
            <PersonalTab data={personalData} onChange={handlePersonalChange} />
          ) : (
            <ContractTab />
          )}
        </div>
      </div>
    </div>
  );
}

interface PersonalTabProps {
  data: PersonalData;
  onChange: (field: keyof PersonalData, value: string) => void;
}

function PersonalTab({ data, onChange }: PersonalTabProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="space-y-6">
      {/* Account Info Section */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column with Avatar */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#21252B] mb-4">
              Account Info
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-1 flex items-center justify-center">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                  alt="Profile"
                  className="w-30 h-30 rounded-full border border-[#0B9F57]"
                />
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#21252B] mb-1 block">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      defaultValue="account43"
                      disabled
                      className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#21252B] mb-1 block">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        defaultValue="password123"
                        disabled
                        className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#383E47] hover:text-grey-900 cursor-pointer transition-colors"
                      >
                        {showPassword ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#21252B] mb-1 block">
                      Roles
                    </label>
                    <input
                      type="text"
                      defaultValue="Member"
                      disabled
                      className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#21252B] mb-1 block">
                      Permission Template
                    </label>
                    <input
                      type="text"
                      defaultValue="Member"
                      disabled
                      className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#21252B] mb-1 block">
                    Email Company
                  </label>
                  <input
                    type="email"
                    defaultValue="namnt46@pl.co"
                    disabled
                    className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Info */}
          <div>
            <h3 className="text-sm font-medium text-[#21252B] mb-4">
              Main Info
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#21252B] mb-1 block">
                    Fullname
                  </label>
                  <input
                    type="text"
                    value={data.fullname}
                    onChange={(e) => onChange("fullname", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E9EAEC] focus:outline-[#0B9F57] rounded"
                  />
                </div>
                <div className="relative">
                  <button className="absolute w-20 top-5 left-5 bg-[#0B9F57] text-white text-xs px-3 py-2 rounded">
                    Save
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#21252B] mb-1 block">
                    Shortname
                  </label>
                  <input
                    type="text"
                    value={data.shortname}
                    onChange={(e) => onChange("shortname", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E9EAEC] focus:outline-[#0B9F57] rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#21252B] mb-1 block">
                    Gender
                  </label>
                  <select
                    value={data.gender}
                    onChange={(e) => onChange("gender", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E9EAEC] rounded"
                  >
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#21252B] mb-1 block">
                    Birth Day
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={data.birthDay}
                      onChange={(e) => onChange("birthDay", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E9EAEC] focus:outline-[#0B9F57] rounded pr-10"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#21252B]" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#21252B] mb-1 block">
                  Email Personal
                </label>
                <input
                  type="email"
                  value={data.emailPersonal}
                  onChange={(e) => onChange("emailPersonal", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E9EAEC] focus:outline-[#0B9F57] rounded"
                />
              </div>

              <div>
                <label className="text-xs text-[#21252B] mb-1 block">
                  Address
                </label>
                <input
                  type="text"
                  value={data.address}
                  onChange={(e) => onChange("address", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E9EAEC] focus:outline-[#0B9F57] rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#21252B] mb-1 block">
                    Sign Day
                  </label>
                  <input
                    type="text"
                    defaultValue="2000/07/23"
                    readOnly
                    className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] focus:outline-[#0B9F57] rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#21252B] mb-1 block">
                    Quit Day
                  </label>
                  <input
                    type="text"
                    defaultValue="2000/07/23"
                    readOnly
                    className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] focus:outline-[#0B9F57] rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Info Section */}
      <div className="pt-6 border-t border-[#E9EAEC]">
        <h3 className="text-sm font-medium text-[#21252B] mb-4">Other Info</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-[#21252B] mb-1 block">
              ID Card *
            </label>
            <input
              type="text"
              value={data.idCard}
              onChange={(e) => onChange("idCard", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E9EAEC] focus:outline-[#0B9F57] rounded"
            />
          </div>
          <div>
            <label className="text-xs text-[#21252B] mb-1 block">
              Tax Number
            </label>
            <input
              type="text"
              value={data.taxNumber}
              onChange={(e) => onChange("taxNumber", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E9EAEC] focus:outline-[#0B9F57] rounded"
            />
          </div>
          <div>
            <label className="text-xs text-[#21252B] mb-1 block">
              ID Social Insurance
            </label>
            <input
              type="text"
              value={data.idSocialInsurance}
              onChange={(e) => onChange("idSocialInsurance", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E9EAEC] focus:outline-[#0B9F57] rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContractTab() {
  return (
    <div className="space-y-6">
      <div className="text-sm font-semibold text-[#21252B] mb-4">
        Sign Day - 2022/03/01
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#21252B] mb-1 block">
              Contract Name *
            </label>
            <input
              type="text"
              defaultValue="ANSSA003/03032022"
              disabled
              className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
            />
          </div>

          <div>
            <label className="text-xs text-[#21252B] mb-1 block">
              Contract Type *
            </label>
            <input
              type="text"
              defaultValue="Thu viec"
              disabled
              className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
            />
          </div>

          <div>
            <label className="text-xs text-[#21252B] mb-1 block">
              Salary Basic *
            </label>
            <input
              type="text"
              defaultValue="10.000.000 vnd"
              disabled
              className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
            />
          </div>

          <div>
            <label className="text-xs text-[#21252B] mb-1 block">
              Branch *
            </label>
            <input
              type="text"
              defaultValue="Nam Tu Liem"
              disabled
              className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
            />
          </div>

          <div>
            <label className="text-xs text-[#21252B] mb-1 block">
              Staff Type *
            </label>
            <input
              type="text"
              defaultValue="Partime"
              disabled
              className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
            />
          </div>

          <div>
            <label className="text-xs text-[#21252B] mb-1 block">End Day</label>
            <div className="relative">
              <input
                type="text"
                defaultValue="2022/05/01"
                disabled
                className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded pr-10"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#21252B]" />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#21252B] mb-1 block">Note</label>
            <input
              type="text"
              defaultValue="Partime"
              disabled
              className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#21252B] mb-1 block">
              Contract Number *
            </label>
            <input
              type="text"
              defaultValue="ANSSA003"
              disabled
              className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
            />
          </div>

          <div>
            <label className="text-xs text-[#21252B] mb-1 block">
              Salary Gross
            </label>
            <input
              type="text"
              defaultValue="12.000.000 vnd"
              disabled
              className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
            />
          </div>

          <div>
            <label className="text-xs text-[#21252B] mb-1 block">
              Salary Capacity *
            </label>
            <input
              type="text"
              defaultValue="0"
              disabled
              className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
            />
          </div>

          <div>
            <label className="text-xs text-[#21252B] mb-1 block">
              Department *
            </label>
            <input
              type="text"
              defaultValue="Developer"
              disabled
              className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
            />
          </div>

          <div>
            <label className="text-xs text-[#21252B] mb-1 block">
              Payment Method *
            </label>
            <input
              type="text"
              defaultValue="Bank Transfer"
              disabled
              className="w-full px-3 py-2 text-sm bg-[#FAFAFA] border border-[#E9EAEC] rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
