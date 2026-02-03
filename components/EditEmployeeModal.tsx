"use client";

import { X, Upload } from "lucide-react";
import { useState } from "react";
import { type Employee } from "@/lib/data";

interface EditEmployeeModalProps {
  employee: Employee;
  onClose: () => void;
  onSave: (employee: Employee) => void;
}

export default function EditEmployeeModal({
  employee,
  onClose,
  onSave,
}: EditEmployeeModalProps) {
  // ✅ Separate state for each field (Option 1)
  const [id, setId] = useState(employee.id || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(employee.role || "Member");
  const [permissionTemplate, setPermissionTemplate] = useState("Member");
  const [emailCompany, setEmailCompany] = useState("");
  const [avatar, setAvatar] = useState(null);

  const [fullname, setFullname] = useState(employee.fullname || "");
  const [shortname, setShortname] = useState("");
  const [gender, setGender] = useState("Male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState(employee.email || "");
  const [address, setAddress] = useState("");
  const [signDay, setSignDay] = useState(employee.signDay || "");
  const [quitDay, setQuitDay] = useState("");

  const [idCard, setIdCard] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [socialInsurance, setSocialInsurance] = useState("");
  const [married, setMarried] = useState("Single");
  const [children, setChildren] = useState(0);
  const [childrenDescription, setChildrenDescription] = useState("");

  const [bankingAddress, setBankingAddress] = useState("");
  const [bankingAccountName, setBankingAccountName] = useState("");
  const [bankingAccountNumber, setBankingAccountNumber] = useState("");
  const [bankingStatus, setBankingStatus] = useState("Active");
  const [bankingNote, setBankingNote] = useState("");

  const [uniSchool, setUniSchool] = useState("");
  const [uniDegree, setUniDegree] = useState("");
  const [uniModeOfStudy, setUniModeOfStudy] = useState("");
  const [uniGraduationYear, setUniGraduationYear] = useState("");
  const [uniDescription, setUniDescription] = useState("");

  const [contractName, setContractName] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [contractType, setContractType] = useState("");
  const [salaryGross, setSalaryGross] = useState("");
  const [salaryBasic, setSalaryBasic] = useState("");
  const [salaryCapacity, setSalaryCapacity] = useState("");
  const [branch, setBranch] = useState("");
  const [department, setDepartment] = useState("");
  const [staffType, setStaffType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [endDay, setEndDay] = useState("");
  const [note, setNote] = useState("");

  const [phone, setPhone] = useState(employee.phone || "");

  const handleSave = () => {
    if (!fullname || !id) {
      alert("Please fill in required fields");
      return;
    }

    const updatedEmployee: Employee = {
      no: employee.no,
      id: id,
      fullname: fullname,
      role: role,
      phone: phone || "N/A",
      email: email,
      signDay: signDay,
    };

    onSave(updatedEmployee);
  };

  const FormRow = ({ 
    label, 
    children, 
    required = false 
  }: { 
    label: string; 
    children: React.ReactNode; 
    required?: boolean;
  }) => (
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
           <h2 className="text-sm font-bold text-gray-700 uppercase">Edit User Information</h2>
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
                  <button 
                    type="button"
                    className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                  >
                    <Upload size={12} /> Upload
                  </button>
                </div>
                
                {/* Form Section */}
                <div className="w-2/3 space-y-1">
                  <FormRow label="Employee ID">
                    <input 
                      type="text" 
                      value={id} 
                      onChange={(e) => setId(e.target.value)} 
                      className={inputClass} 
                      placeholder="account43" 
                    />
                  </FormRow>
                  <FormRow label="Password">
                    <input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className={inputClass} 
                      placeholder="••••••••" 
                    />
                  </FormRow>
                  <FormRow label="Roles">
                    <select 
                      value={role} 
                      onChange={(e) => setRole(e.target.value)} 
                      className={inputClass}
                    >
                      <option value="Member">Member</option>
                      <option value="Manager">Manager</option>
                      <option value="Developer">Developer</option>
                      <option value="HR">HR</option>
                    </select>
                  </FormRow>
                  <FormRow label="Permission Template">
                    <select 
                      value={permissionTemplate} 
                      onChange={(e) => setPermissionTemplate(e.target.value)} 
                      className={inputClass}
                    >
                      <option value="Member">Member</option>
                    </select>
                  </FormRow>
                  <FormRow label="Email Company">
                    <input 
                      type="email" 
                      value={emailCompany} 
                      onChange={(e) => setEmailCompany(e.target.value)} 
                      className={inputClass} 
                      placeholder="name@company.co" 
                    />
                  </FormRow>
                </div>
              </div>
            </div>

            {/* Main Info */}
            <div className="col-span-7 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase">Main Info</h3>
              <div className="grid grid-cols-1 gap-1">
                <FormRow label="Fullname">
                  <input 
                    type="text" 
                    value={fullname} 
                    onChange={(e) => setFullname(e.target.value)} 
                    className={inputClass} 
                  />
                </FormRow>
                <FormRow label="Shortname">
                  <input 
                    type="text" 
                    value={shortname} 
                    onChange={(e) => setShortname(e.target.value)} 
                    className={inputClass} 
                  />
                </FormRow>
                
                <div className="flex items-center gap-2 mb-2">
                  <label className="w-1/3 text-xs font-medium text-gray-600">Gender</label>
                  <div className="w-2/3 flex gap-4">
                     <select 
                       value={gender} 
                       onChange={(e) => setGender(e.target.value)} 
                       className={`${inputClass} w-1/2`}
                     >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                     </select>
                     <div className="flex items-center gap-2 w-1/2">
                        <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Birth Day</span>
                        <div className="relative w-full">
                            <input 
                              type="date" 
                              value={dateOfBirth} 
                              onChange={(e) => setDateOfBirth(e.target.value)} 
                              className={inputClass} 
                            />
                        </div>
                     </div>
                  </div>
                </div>

                <FormRow label="Email Personal">
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className={inputClass} 
                  />
                </FormRow>
                <FormRow label="Address">
                  <input 
                    type="text" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    className={inputClass} 
                  />
                </FormRow>
                
                <div className="flex items-center gap-2 mb-2">
                  <label className="w-1/3 text-xs font-medium text-gray-600">Sign Day</label>
                  <div className="w-2/3 flex gap-4">
                     <input 
                       type="date" 
                       value={signDay} 
                       onChange={(e) => setSignDay(e.target.value)} 
                       className={`${inputClass} w-1/2`} 
                     />
                     <div className="flex items-center gap-2 w-1/2">
                        <span className="text-xs font-medium text-red-500 whitespace-nowrap">Quit Day</span>
                        <input 
                          type="date" 
                          value={quitDay} 
                          onChange={(e) => setQuitDay(e.target.value)} 
                          className={inputClass} 
                        />
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
                    <input 
                      type="text" 
                      value={idCard} 
                      onChange={(e) => setIdCard(e.target.value)} 
                      className={inputClass} 
                    />
                  </FormRow>
                  <FormRow label="Tax Number">
                    <input 
                      type="text" 
                      value={taxNumber} 
                      onChange={(e) => setTaxNumber(e.target.value)} 
                      className={inputClass} 
                    />
                  </FormRow>
                  <FormRow label="ID Social Insurance">
                    <input 
                      type="text" 
                      value={socialInsurance} 
                      onChange={(e) => setSocialInsurance(e.target.value)} 
                      className={inputClass} 
                    />
                  </FormRow>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <label className="w-1/3 text-xs font-medium text-gray-600">Married</label>
                    <div className="w-2/3 flex items-center gap-6">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500" 
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">Children</span>
                            <input 
                              type="number" 
                              value={children} 
                              onChange={(e) => setChildren(Number(e.target.value))} 
                              className={`${inputClass} w-16`} 
                            />
                        </div>
                    </div>
                  </div>

                  <FormRow label="Children Description">
                    <textarea 
                      value={childrenDescription} 
                      onChange={(e) => setChildrenDescription(e.target.value)} 
                      rows={3} 
                      className={inputClass} 
                      placeholder="Are you sure ?" 
                    />
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
                                    <td className="p-1"><input 
                                      type="text" 
                                      value={bankingAddress} 
                                      onChange={(e) => setBankingAddress(e.target.value)} 
                                      className={inputClass} 
                                    /></td>
                                    <td className="p-1"><input 
                                      type="text" 
                                      value={bankingAccountName} 
                                      onChange={(e) => setBankingAccountName(e.target.value)} 
                                      className={inputClass} 
                                    /></td>
                                    <td className="p-1"><input 
                                      type="text" 
                                      value={bankingAccountNumber} 
                                      onChange={(e) => setBankingAccountNumber(e.target.value)} 
                                      className={inputClass} 
                                    /></td>
                                    <td className="p-1"><input 
                                      type="text" 
                                      value={bankingStatus} 
                                      onChange={(e) => setBankingStatus(e.target.value)} 
                                      className={inputClass} 
                                    /></td>
                                    <td className="p-1"><input 
                                      type="text" 
                                      value={bankingNote} 
                                      onChange={(e) => setBankingNote(e.target.value)} 
                                      className={inputClass} 
                                    /></td>
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
                                    <td className="p-1"><input 
                                      type="text" 
                                      value={uniSchool} 
                                      onChange={(e) => setUniSchool(e.target.value)} 
                                      className={inputClass} 
                                    /></td>
                                    <td className="p-1"><input 
                                      type="text" 
                                      value={uniDegree} 
                                      onChange={(e) => setUniDegree(e.target.value)} 
                                      className={inputClass} 
                                    /></td>
                                    <td className="p-1"><input 
                                      type="text" 
                                      value={uniModeOfStudy} 
                                      onChange={(e) => setUniModeOfStudy(e.target.value)} 
                                      className={inputClass} 
                                    /></td>
                                    <td className="p-1"><input 
                                      type="text" 
                                      value={uniGraduationYear} 
                                      onChange={(e) => setUniGraduationYear(e.target.value)} 
                                      className={inputClass} 
                                    /></td>
                                    <td className="p-1"><input 
                                      type="text" 
                                      value={uniDescription} 
                                      onChange={(e) => setUniDescription(e.target.value)} 
                                      className={inputClass} 
                                    /></td>
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
                        <input 
                          type="text" 
                          value={contractName} 
                          onChange={(e) => setContractName(e.target.value)} 
                          className={inputClass} 
                        />
                    </FormRow>
                    <FormRow label="Contract Type *">
                        <input 
                          type="text" 
                          value={contractType} 
                          onChange={(e) => setContractType(e.target.value)} 
                          className={inputClass} 
                        />
                    </FormRow>
                    <FormRow label="Salary Basic *">
                        <input 
                          type="text" 
                          value={salaryBasic} 
                          onChange={(e) => setSalaryBasic(e.target.value)} 
                          className={inputClass} 
                        />
                    </FormRow>
                    <FormRow label="Branch *">
                        <input 
                          type="text" 
                          value={branch} 
                          onChange={(e) => setBranch(e.target.value)} 
                          className={inputClass} 
                        />
                    </FormRow>
                    <FormRow label="Staff Type *">
                        <input 
                          type="text" 
                          value={staffType} 
                          onChange={(e) => setStaffType(e.target.value)} 
                          className={inputClass} 
                        />
                    </FormRow>
                    <FormRow label="End Day">
                        <input 
                          type="date" 
                          value={endDay} 
                          onChange={(e) => setEndDay(e.target.value)} 
                          className={inputClass} 
                        />
                    </FormRow>
                    <FormRow label="Note">
                        <textarea 
                          value={note} 
                          onChange={(e) => setNote(e.target.value)} 
                          rows={2} 
                          className={inputClass} 
                        />
                    </FormRow>
                </div>

                {/* Right Col */}
                <div className="space-y-1">
                    <FormRow label="Contract Number *">
                        <input 
                          type="text" 
                          value={contractNumber} 
                          onChange={(e) => setContractNumber(e.target.value)} 
                          className={inputClass} 
                        />
                    </FormRow>
                    <FormRow label="Salary Gross">
                        <input 
                          type="text" 
                          value={salaryGross} 
                          onChange={(e) => setSalaryGross(e.target.value)} 
                          className={inputClass} 
                        />
                    </FormRow>
                    <FormRow label="Salary Capacity *">
                        <input 
                          type="text" 
                          value={salaryCapacity} 
                          onChange={(e) => setSalaryCapacity(e.target.value)} 
                          className={inputClass} 
                        />
                    </FormRow>
                    <FormRow label="Department *">
                        <input 
                          type="text" 
                          value={department} 
                          onChange={(e) => setDepartment(e.target.value)} 
                          className={inputClass} 
                        />
                    </FormRow>
                    <FormRow label="Payment Method *">
                        <input 
                          type="text" 
                          value={paymentMethod} 
                          onChange={(e) => setPaymentMethod(e.target.value)} 
                          className={inputClass} 
                        />
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
          Update
        </button>
      </div>
    </div>
  );
}
