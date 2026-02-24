import type { EmployeeDto } from "@/services/DACN/employee";

export type EmployeeUI = {
  no: number;
  id: string;
  fullname: string;
  role: string;
  phone: string;
  email: string;
  signDay: string;

  gender?: string;
  dateOfBirth?: string;
  address?: string;
  quitDay?: string;
  idCard?: string;
  married?: boolean;
  children?: number;
  childrenDescription?: string;
  departmentName?: string;
  avatarUrl?: string;
  basicSalary?: number;
  grossSalary?: number;
};

function formatIsoDate(iso?: string | null): string {
  if (!iso) return "";
  // Accept either ISO or already-date strings; keep the date part.
  const tIndex = iso.indexOf("T");
  return tIndex >= 0 ? iso.slice(0, tIndex) : iso;
}

function buildFullName(dto: EmployeeDto): string {
  const parts = [dto.lastName, dto.middleName ?? "", dto.firstName].map((p) => (p ?? "").trim());
  return parts.filter(Boolean).join(" ").trim();
}

export function employeeDtoToUI(dto: EmployeeDto, index = 0): EmployeeUI {
  return {
    no: index + 1,
    id: dto.id,
    fullname: buildFullName(dto) || dto.id,
    role: dto.roles ?? "",
    phone: dto.phone ?? "N/A",
    email: dto.email ?? "",
    signDay: formatIsoDate(dto.signDate),

    gender: dto.gender ?? undefined,
    dateOfBirth: formatIsoDate(dto.dateOfBirth),
    address: dto.address ?? undefined,
    quitDay: formatIsoDate(dto.quitDate),
    idCard: dto.idCard ?? undefined,
    married: dto.marriedStatus ?? undefined,
    children: dto.numberOfChildren ?? undefined,
    childrenDescription: dto.childrenDescription ?? undefined,
    departmentName: dto.department?.name ?? undefined,
    avatarUrl: dto.avatarUrl ?? undefined,
    basicSalary: dto.basicSalary ?? undefined,
    grossSalary: dto.grossSalary ?? undefined,
  };
}

export function extractEmployeesFromResponseData(data: unknown): EmployeeDto[] {
  if (Array.isArray(data)) return data as EmployeeDto[];
  if (data && typeof data === "object" && "items" in (data as any) && Array.isArray((data as any).items)) {
    return (data as any).items as EmployeeDto[];
  }
  return [];
}

export type CreateOrUpdateEmployeePayload = {
  id?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  signDate?: string;
  quitDate?: string;
  idCard?: string;
  marriedStatus?: boolean;
  numberOfChildren?: number;
  childrenDescription?: string;
  basicSalary?: number;
  grossSalary?: number;
  // roles/department are backend-dependent; only include if your API supports.
  roles?: string;
  departmentId?: string;
  avatarUrl?: string;
};

export function uiFormToEmployeePayload(form: Record<string, any>): CreateOrUpdateEmployeePayload {
  // These pages historically store fullname; we do not attempt to split into 3 parts reliably.
  // Prefer explicit fields if present; otherwise use a simple heuristic split.
  const rawFullname = typeof form.fullname === "string" ? form.fullname.trim() : "";
  const nameParts = rawFullname.split(/\s+/).filter(Boolean);
  const inferredLastName = nameParts.length >= 1 ? nameParts[0] : undefined;
  const inferredFirstName = nameParts.length >= 2 ? nameParts[nameParts.length - 1] : undefined;
  const inferredMiddleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : undefined;

  const payload: CreateOrUpdateEmployeePayload = {
    id: typeof form.id === "string" ? form.id.trim() : undefined,
    firstName:
      typeof form.firstName === "string" && form.firstName.trim() !== ""
        ? form.firstName.trim()
        : inferredFirstName,
    middleName:
      typeof form.middleName === "string" && form.middleName.trim() !== ""
        ? form.middleName.trim()
        : inferredMiddleName,
    lastName:
      typeof form.lastName === "string" && form.lastName.trim() !== ""
        ? form.lastName.trim()
        : inferredLastName,
    gender: typeof form.gender === "string" ? form.gender : undefined,
    dateOfBirth: typeof form.dateOfBirth === "string" ? form.dateOfBirth : undefined,
    email: typeof form.email === "string" ? form.email.trim() : undefined,
    phone: typeof form.phone === "string" ? form.phone.trim() : undefined,
    address: typeof form.address === "string" ? form.address.trim() : undefined,
    signDate: typeof form.signDay === "string" ? form.signDay : typeof form.signDate === "string" ? form.signDate : undefined,
    quitDate: typeof form.quitDay === "string" ? form.quitDay : typeof form.quitDate === "string" ? form.quitDate : undefined,
    idCard: typeof form.idCard === "string" ? form.idCard.trim() : undefined,
    marriedStatus: typeof form.married === "boolean" ? form.married : typeof form.marriedStatus === "boolean" ? form.marriedStatus : undefined,
    numberOfChildren:
      typeof form.children === "number" ? form.children : typeof form.numberOfChildren === "number" ? form.numberOfChildren : undefined,
    childrenDescription: typeof form.childrenDescription === "string" ? form.childrenDescription : undefined,
    basicSalary:
      typeof form.salaryBasic === "string" && form.salaryBasic !== "" ? Number(form.salaryBasic) :
      typeof form.basicSalary === "number" ? form.basicSalary : undefined,
    grossSalary:
      typeof form.salaryGross === "string" && form.salaryGross !== "" ? Number(form.salaryGross) :
      typeof form.grossSalary === "number" ? form.grossSalary : undefined,
    roles: typeof form.role === "string" ? form.role : typeof form.roles === "string" ? form.roles : undefined,
    avatarUrl: typeof form.avatarUrl === "string" ? form.avatarUrl : undefined,
  };

  // remove NaN numbers
  if (payload.basicSalary !== undefined && Number.isNaN(payload.basicSalary)) delete payload.basicSalary;
  if (payload.grossSalary !== undefined && Number.isNaN(payload.grossSalary)) delete payload.grossSalary;

  // remove undefined keys for cleaner payload
  for (const key of Object.keys(payload) as (keyof CreateOrUpdateEmployeePayload)[]) {
    if (payload[key] === undefined) delete payload[key];
  }

  return payload;
}
