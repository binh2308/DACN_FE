import { Search, Plus, Filter, Trash2 } from "lucide-react";
import { useState } from "react";

interface Employee {
  no: number;
  id: string;
  fullname: string;
  role: string;
  phone: string;
  email: string;
  signDay: string;
}

const initialEmployees: Employee[] = [
  {
    no: 1,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Developer",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 2,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 3,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 4,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 5,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 6,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 7,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 8,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 9,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 10,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 11,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 12,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 13,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 14,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
  {
    no: 15,
    id: "acc006",
    fullname: "Nguyen Thanh A",
    role: "Sale",
    phone: "0912345678",
    email: "nta@911.com",
    signDay: "22/12/2020",
  },
];

export default function EmployeeManage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = (no: number) => {
    setEmployees(employees.filter((emp) => emp.no !== no));
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.fullname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-52">
          <input
            type="text"
            placeholder="Search by ID, Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-3 pr-8 text-xs italic text-[#A2A2A2] border border-[#B6B6B6] rounded focus:outline-none focus:ring-1 focus:ring-primary"
            style={{
              fontFamily:
                "Poppins, -apple-system, Roboto, Helvetica, sans-serif",
            }}
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A2A2A2]" />
        </div>

        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 h-8 px-3 bg-[#EBEDF0] rounded text-xs text-[#172B4D]"
            style={{
              fontFamily:
                "Poppins, -apple-system, Roboto, Helvetica, sans-serif",
            }}
          >
            <Filter className="w-4 h-4" />
            <span>Inactive</span>
          </button>
          <button
            className="flex items-center gap-2 h-8 px-3 bg-[#EBEDF0] rounded text-xs text-[#172B4D]"
            style={{
              fontFamily:
                "Poppins, -apple-system, Roboto, Helvetica, sans-serif",
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>
      </div>

      <div className="border border-[#C1C7D0] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full"
            style={{
              fontFamily:
                "Poppins, -apple-system, Roboto, Helvetica, sans-serif",
            }}
          >
            <thead>
              <tr className="border-b border-[#C1C7D0]">
                <th className="px-3 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-16">
                  No.
                </th>
                <th className="px-5 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-32">
                  ID
                </th>
                <th className="px-10 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-48">
                  Fullname
                </th>
                <th className="px-3 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-32">
                  Role
                </th>
                <th className="px-3 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-32">
                  Phone
                </th>
                <th className="px-9 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-44">
                  Email
                </th>
                <th className="px-5 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-36">
                  Sign Day
                </th>
                <th className="px-3 py-2.5 text-center text-sm font-normal text-black w-32">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr
                  key={employee.no}
                  className="border-b border-[#C1C7D0] last:border-0"
                >
                  <td className="px-3 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.no}
                  </td>
                  <td className="px-5 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.id}
                  </td>
                  <td className="px-10 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.fullname}
                  </td>
                  <td className="px-3 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.role}
                  </td>
                  <td className="px-3 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.phone}
                  </td>
                  <td className="px-9 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.email}
                  </td>
                  <td className="px-5 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.signDay}
                  </td>
                  <td className="px-3 py-2.5 text-center border-[#C1C7D0]">
                    <button
                      onClick={() => handleDelete(employee.no)}
                      className="inline-flex items-center justify-center hover:bg-red-50 rounded p-1 transition-colors"
                      aria-label="Delete employee"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
