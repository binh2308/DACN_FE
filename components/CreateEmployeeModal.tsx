"use client";

import { X, Calendar, Upload } from "lucide-react";
import { useState } from "react";
import type { EmployeeUI } from "@/lib/employee-ui";

interface CreateEmployeeModalProps {
  onClose: () => void;
  onSave: (employee: EmployeeUI) => void;
}

export default function CreateEmployeeModal({
  onClose,
  onSave,
}: CreateEmployeeModalProps) {
  const [formData, setFormData] = useState({
    // Account Info
    id: "",
    password: "",
    role: "Member",
    permissionTemplate: "Member",
    emailCompany: "",
    avatar: null,

    // Main Info
    fullname: "",
    shortname: "",
    gender: "Male",
    dateOfBirth: "",
    email: "",
    address: "",
    signDay: "",
    quitDay: "",

    // Other Info
    idCard: "",
    taxNumber: "",
    socialInsurance: "",
    married: "Single",
    children: 0,
    childrenDescription: "",

    // Banking
    bankingAddress: "",
    bankingAccountName: "",
    bankingAccountNumber: "",
    bankingStatus: "Active",
    bankingNote: "",

    // University
    uniSchool: "",
    uniDegree: "",
    uniModeOfStudy: "",
    uniGraduationYear: "",
    uniDescription: "",

    // Contract
    contractName: "",
    contractNumber: "",
    contractType: "",
    salaryGross: "",
    salaryBasic: "",
    salaryCapacity: "",
    branch: "",
    department: "",
    staffType: "",
    paymentMethod: "",
    endDay: "",
    note: "",
    
    phone: "", 
    no: 0,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (!formData.fullname || !formData.id) {
      alert("Please fill in required fields");
      return;
    }

    const newEmployee: EmployeeUI = {
      no: Date.now(),
      id: formData.id,
      fullname: formData.fullname,
      role: formData.role,
      phone: formData.phone || "N/A",
      email: formData.email,
      signDay: formData.signDay,
    };

    onSave(newEmployee);
  };

  const FormRow = ({ label, children, required = false }: { label: string, children: React.ReactNode, required?: boolean }) => (
    <div className="flex items-center gap-2 mb-2">
      <label className="w-1/3 text-xs font-medium text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="w-2/3">
        {children}
      </div>
    </div>
  );

  const inputClass = "w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-green-500";

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto font-sans flex flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
           <span className="text-gray-400">✎</span>
           <h2 className="text-sm font-bold text-gray-700 uppercase">Information User</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-black">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 bg-gray-50 space-y-6">
          
          {/* ROW 1: Account Info & Main Info */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Account Info */}
            <div className="col-span-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase">Account Info</h3>
              <div className="flex gap-4">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center overflow-hidden border-2 border-green-500">
                    <img src="https://placekitten.com/100/100" alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <button className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">
                    <Upload size={12} /> Upload
                  </button>
                </div>
                
                {/* Form Section */}
                <div className="w-2/3 space-y-1">
                  <FormRow label="Employee ID">
                    <input type="text" name="id" value={formData.id} onChange={handleChange} className={inputClass} placeholder="account43" />
                  </FormRow>
                  <FormRow label="Password">
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClass} placeholder="••••••••" />
                  </FormRow>
                  <FormRow label="Roles">
                    <select name="role" value={formData.role} onChange={handleChange} className={inputClass}>
                      <option value="Member">Member</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </FormRow>
                  <FormRow label="Permission Template">
                    <select name="permissionTemplate" value={formData.permissionTemplate} onChange={handleChange} className={inputClass}>
                      <option value="Member">Member</option>
                    </select>
                  </FormRow>
                  <FormRow label="Email Company">
                    <input type="email" name="emailCompany" value={formData.emailCompany} onChange={handleChange} className={inputClass} placeholder="name@company.co" />
                  </FormRow>
                </div>
              </div>
            </div>

            {/* Main Info */}
            <div className="col-span-7 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase">Main Info</h3>
              <div className="grid grid-cols-1 gap-1">
                <FormRow label="Fullname">
                  <input type="text" name="fullname" value={formData.fullname} onChange={handleChange} className={inputClass} />
                </FormRow>
                <FormRow label="Shortname">
                  <input type="text" name="shortname" value={formData.shortname} onChange={handleChange} className={inputClass} />
                </FormRow>
                
                <div className="flex items-center gap-2 mb-2">
                  <label className="w-1/3 text-xs font-medium text-gray-600">Gender</label>
                  <div className="w-2/3 flex gap-4">
                     <select name="gender" value={formData.gender} onChange={handleChange} className={`${inputClass} w-1/2`}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                     </select>
                     <div className="flex items-center gap-2 w-1/2">
                        <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Birth Day</span>
                        <div className="relative w-full">
                            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputClass} />
                        </div>
                     </div>
                  </div>
                </div>

                <FormRow label="Email Personal">
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
                </FormRow>
                <FormRow label="Address">
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} />
                </FormRow>
                
                <div className="flex items-center gap-2 mb-2">
                  <label className="w-1/3 text-xs font-medium text-gray-600">Sign Day</label>
                  <div className="w-2/3 flex gap-4">
                     <input type="date" name="signDay" value={formData.signDay} onChange={handleChange} className={`${inputClass} w-1/2`} />
                     <div className="flex items-center gap-2 w-1/2">
                        <span className="text-xs font-medium text-red-500 whitespace-nowrap">Quit Day</span>
                        <input type="date" name="quitDay" value={formData.quitDay} onChange={handleChange} className={inputClass} />
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: Other Info & Banking/University */}
          <div className="grid grid-cols-12 gap-6">
             {/* Other Info */}
             <div className="col-span-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase">Other Info</h3>
                <div className="space-y-1">
                  <FormRow label="ID Card *" required>
                    <input type="text" name="idCard" value={formData.idCard} onChange={handleChange} className={inputClass} />
                  </FormRow>
                  <FormRow label="Tax Number">
                    <input type="text" name="taxNumber" value={formData.taxNumber} onChange={handleChange} className={inputClass} />
                  </FormRow>
                  <FormRow label="ID Social Insurance">
                    <input type="text" name="socialInsurance" value={formData.socialInsurance} onChange={handleChange} className={inputClass} />
                  </FormRow>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <label className="w-1/3 text-xs font-medium text-gray-600">Married</label>
                    <div className="w-2/3 flex items-center gap-6">
                        <input type="checkbox" className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500" />
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">Children</span>
                            <input type="number" name="children" value={formData.children} onChange={handleChange} className={`${inputClass} w-16`} />
                        </div>
                    </div>
                  </div>

                  <FormRow label="Children Description">
                    <textarea name="childrenDescription" value={formData.childrenDescription} onChange={handleChange} rows={3} className={inputClass} placeholder="Are you sure ?" />
                  </FormRow>
                </div>
             </div>

             {/* Banking & University */}
             <div className="col-span-7 space-y-6">
                
                {/* Banking Card */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Banking</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-left text-gray-600 font-medium">
                                    <th className="pb-1 px-1 border-b border-gray-300 w-1/4">Address banking</th>
                                    <th className="pb-1 px-1 border-b border-gray-300 w-1/5">Account Name</th>
                                    <th className="pb-1 px-1 border-b border-gray-300 w-1/4">Account Number</th>
                                    <th className="pb-1 px-1 border-b border-gray-300 w-1/6">Status</th>
                                    <th className="pb-1 px-1 border-b border-gray-300 w-1/6">Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-1"><input type="text" name="bankingAddress" value={formData.bankingAddress} onChange={handleChange} className={inputClass} /></td>
                                    <td className="p-1"><input type="text" name="bankingAccountName" value={formData.bankingAccountName} onChange={handleChange} className={inputClass} /></td>
                                    <td className="p-1"><input type="text" name="bankingAccountNumber" value={formData.bankingAccountNumber} onChange={handleChange} className={inputClass} /></td>
                                    <td className="p-1"><input type="text" name="bankingStatus" value={formData.bankingStatus} onChange={handleChange} className={inputClass} /></td>
                                    <td className="p-1"><input type="text" name="bankingNote" value={formData.bankingNote} onChange={handleChange} className={inputClass} /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* University Card */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">University</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-left text-gray-600 font-medium">
                                    <th className="pb-1 px-1 border-b border-gray-300 w-1/5">Schools</th>
                                    <th className="pb-1 px-1 border-b border-gray-300 w-1/6">Degree</th>
                                    <th className="pb-1 px-1 border-b border-gray-300 w-1/5">Mode of study</th>
                                    <th className="pb-1 px-1 border-b border-gray-300 w-1/5">Graduation Year</th>
                                    <th className="pb-1 px-1 border-b border-gray-300">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-1"><input type="text" name="uniSchool" value={formData.uniSchool} onChange={handleChange} className={inputClass} /></td>
                                    <td className="p-1"><input type="text" name="uniDegree" value={formData.uniDegree} onChange={handleChange} className={inputClass} /></td>
                                    <td className="p-1"><input type="text" name="uniModeOfStudy" value={formData.uniModeOfStudy} onChange={handleChange} className={inputClass} /></td>
                                    <td className="p-1"><input type="text" name="uniGraduationYear" value={formData.uniGraduationYear} onChange={handleChange} className={inputClass} /></td>
                                    <td className="p-1"><input type="text" name="uniDescription" value={formData.uniDescription} onChange={handleChange} className={inputClass} /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
          </div>

          {/* ROW 3: Contract */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
             <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase">Contract</h3>
             <div className="grid grid-cols-2 gap-8">
                {/* Left Col */}
                <div className="space-y-1">
                    <FormRow label="Contract Name *">
                        <input type="text" name="contractName" value={formData.contractName} onChange={handleChange} className={inputClass} />
                    </FormRow>
                    <FormRow label="Contract Type *">
                        <input type="text" name="contractType" value={formData.contractType} onChange={handleChange} className={inputClass} />
                    </FormRow>
                    <FormRow label="Salary Basic *">
                        <input type="text" name="salaryBasic" value={formData.salaryBasic} onChange={handleChange} className={inputClass} />
                    </FormRow>
                    <FormRow label="Branch *">
                        <input type="text" name="branch" value={formData.branch} onChange={handleChange} className={inputClass} />
                    </FormRow>
                    <FormRow label="Staff Type *">
                        <input type="text" name="staffType" value={formData.staffType} onChange={handleChange} className={inputClass} />
                    </FormRow>
                    <FormRow label="End Day">
                        <input type="date" name="endDay" value={formData.endDay} onChange={handleChange} className={inputClass} />
                    </FormRow>
                    <FormRow label="Note">
                        <textarea name="note" value={formData.note} onChange={handleChange} rows={2} className={inputClass} />
                    </FormRow>
                </div>

                {/* Right Col */}
                <div className="space-y-1">
                    <FormRow label="Contract Number *">
                        <input type="text" name="contractNumber" value={formData.contractNumber} onChange={handleChange} className={inputClass} />
                    </FormRow>
                    <FormRow label="Salary Gross">
                        <input type="text" name="salaryGross" value={formData.salaryGross} onChange={handleChange} className={inputClass} />
                    </FormRow>
                    <FormRow label="Salary Capacity *">
                        <input type="text" name="salaryCapacity" value={formData.salaryCapacity} onChange={handleChange} className={inputClass} />
                    </FormRow>
                    <FormRow label="Department *">
                        <input type="text" name="department" value={formData.department} onChange={handleChange} className={inputClass} />
                    </FormRow>
                    <FormRow label="Payment Method *">
                        <input type="text" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className={inputClass} />
                    </FormRow>
                </div>
             </div>
          </div>

          {/* Spacing for footer */}
          <div className="h-20"></div>

        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="flex items-center justify-center p-4 bg-white sticky bottom-0 border-t border-gray-200 shadow-md">
        <button
          onClick={handleSave}
          className="px-8 py-2 text-sm font-semibold text-white bg-emerald-500 rounded hover:bg-emerald-600 transition-colors uppercase shadow-md"
        >
          Save
        </button>
      </div>
    </div>
  );
}