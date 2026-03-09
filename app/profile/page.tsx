"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Upload, X } from "lucide-react";
import type { EmployeeDetailDto } from "@/services/DACN/employee";
import { getEmployeeProfile, updateEmployeeByAdmin } from "@/services/DACN/employee";
import { uploadAvatar } from "@/services/DACN/auth";

type TabType = "personal" | "contract";

type DegreeFormItem = {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
  description: string;
};

// Helper định dạng ngày: "1990-01-01T..." -> "1990/01/01"
function formatSlashDate(value?: string | null) {
  if (!value) return "";
  const idx = value.indexOf("T");
  const datePart = idx >= 0 ? value.slice(0, idx) : value;
  return datePart.replace(/-/g, "/");
}

// Helper định dạng tiền tệ: 50000 -> 50.000 vnd
function formatMoney(value?: number | null) {
  if (value == null) return "";
  return value.toLocaleString("vi-VN") + " vnd";
}

function buildFullName(p: EmployeeDetailDto) {
  return [p.lastName, p.middleName, p.firstName].filter(Boolean).join(" ");
}

function ymdFromIso(iso?: string | null) {
  if (!iso) return "";
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

function newTempId() {
  try {
    return `tmp-${crypto.randomUUID()}`;
  } catch {
    return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function emptyDegree(): DegreeFormItem {
  return {
    id: newTempId(),
    school: "",
    degree: "",
    fieldOfStudy: "",
    graduationYear: "",
    description: "",
  };
}

function splitFullname(fullname: string) {
  const parts = fullname.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lastName: "", firstName: "", middleName: "" };
  if (parts.length === 1) return { lastName: parts[0], firstName: "", middleName: "" };
  const lastName = parts[0];
  const firstName = parts[parts.length - 1];
  const middleName = parts.slice(1, -1).join(" ");
  return { lastName, firstName, middleName };
}

function toOptionalNumber(value: string): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function isUrlLike(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (!s) return false;
  return s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/");
}

function extractAvatarUrl(response: unknown): string | null {
  const root = (response as any)?.data ?? response;

  const direct =
    (root as any)?.url ??
    (root as any)?.avatarUrl ??
    (root as any)?.path ??
    (root as any)?.location ??
    (root as any)?.data?.url ??
    (root as any)?.data?.avatarUrl ??
    (root as any)?.data?.path ??
    (root as any)?.data?.location ??
    (root as any)?.data?.data?.url ??
    (root as any)?.data?.data?.avatarUrl ??
    (root as any)?.data?.data?.path ??
    (root as any)?.data?.data?.location;

  if (isUrlLike(direct)) return direct;
  if (isUrlLike((root as any)?.data)) return (root as any).data;

  // Fallback: find first url-like string in the object (depth-limited)
  const seen = new Set<any>();
  const stack: Array<{ v: any; d: number }> = [{ v: root, d: 0 }];
  while (stack.length) {
    const { v, d } = stack.pop()!;
    if (!v || d > 6) continue;
    if (typeof v === "string" && isUrlLike(v)) return v;
    if (typeof v !== "object") continue;
    if (seen.has(v)) continue;
    seen.add(v);
    if (Array.isArray(v)) {
      for (const item of v) stack.push({ v: item, d: d + 1 });
    } else {
      for (const key of Object.keys(v)) stack.push({ v: (v as any)[key], d: d + 1 });
    }
  }

  return null;
}

function mapProfileToForm(p: EmployeeDetailDto) {
  const degrees: DegreeFormItem[] = Array.isArray((p as any).degrees)
    ? ((p as any).degrees as any[]).map((d) => ({
        id: String(d?.id ?? newTempId()),
        school: String(d?.school ?? ""),
        degree: String(d?.degree ?? ""),
        fieldOfStudy: String(d?.fieldOfStudy ?? ""),
        graduationYear: d?.graduationYear != null ? String(d.graduationYear) : "",
        description: String(d?.description ?? ""),
      }))
    : [];

  return {
    id: p.id,
    roles: p.roles,
    email: p.email,
    phone: p.phone ?? "",
    fullname: buildFullName(p) || p.email,
    gender: p.gender ?? "Male",
    dateOfBirth: ymdFromIso(p.dateOfBirth),
    address: p.address ?? "",
    signDate: ymdFromIso(p.signDate),
    quitDate: ymdFromIso(p.quitDate),
    idCard: p.idCard ?? "",
    marriedStatus: Boolean(p.marriedStatus),
    numberOfChildren: Number(p.numberOfChildren ?? 0) || 0,
    childrenDescription: p.childrenDescription ?? "",
    basicSalary: p.basicSalary != null ? String(p.basicSalary) : "",
    grossSalary: p.grossSalary != null ? String(p.grossSalary) : "",
    departmentName: p.department?.name ?? (p as any).departmentName ?? "",
    departmentId: p.department?.id ?? "",
    degrees: degrees.length ? degrees : [emptyDegree()],
    avatarUrl: p.avatarUrl ?? "",
  };
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [profile, setProfile] = useState<EmployeeDetailDto | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(() =>
    mapProfileToForm({
      id: "",
      lastName: "",
      firstName: "",
      middleName: null,
      gender: null,
      dateOfBirth: null,
      email: "",
      roles: "",
      phone: null,
      basicSalary: null,
      grossSalary: null,
      signDate: null,
      quitDate: null,
      idCard: null,
      address: null,
      marriedStatus: null,
      numberOfChildren: null,
      childrenDescription: null,
      department: null,
      avatarUrl: null,
      degrees: [],
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getEmployeeProfile();
        const payload = (res as any)?.data?.data ?? (res as any)?.data;
        if (payload) {
          const dto = payload as EmployeeDetailDto;
          setProfile(dto);
          setForm(mapProfileToForm(dto));
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };

    fetchData();
  }, []);

  const onStartEdit = () => {
    if (!profile) return;
    setForm(mapProfileToForm(profile));
    setIsEditing(true);
  };

  const onCancelEdit = () => {
    if (profile) setForm(mapProfileToForm(profile));
    setIsEditing(false);
  };

  const onSave = async () => {
    if (!profile) return;
    const fullname = String(form.fullname || "").trim();
    if (!fullname) {
      alert("Vui lòng nhập Fullname");
      return;
    }

    setSaving(true);
    try {
      const { lastName, firstName, middleName } = splitFullname(fullname);

      const degreesPayload = (Array.isArray(form.degrees) ? form.degrees : [])
        .map((d) => ({
          school: d.school.trim(),
          degree: d.degree.trim() || "Unknown",
          fieldOfStudy: d.fieldOfStudy.trim() || "Unknown",
          graduationYear: toOptionalNumber(d.graduationYear),
          description: d.description.trim() || null,
        }))
        .filter((d) => Boolean(d.school));

      const payload = {
        lastName,
        firstName,
        middleName: middleName || null,
        gender: form.gender || null,
        dateOfBirth: form.dateOfBirth || null,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        signDate: form.signDate || null,
        quitDate: form.quitDate || null,
        idCard: form.idCard.trim() || null,
        marriedStatus: Boolean(form.marriedStatus),
        numberOfChildren: Number(form.numberOfChildren) || 0,
        childrenDescription: form.childrenDescription.trim() || null,
        basicSalary: form.basicSalary !== "" ? Number(form.basicSalary) : undefined,
        grossSalary: form.grossSalary !== "" ? Number(form.grossSalary) : undefined,
        departmentName: form.departmentName.trim() || null,
        degrees: degreesPayload,
      };

      await updateEmployeeByAdmin(profile.id, payload);
      alert("Cập nhật thông tin cá nhân thành công!");
      setIsEditing(false);

      // Refresh
      const res = await getEmployeeProfile();
      const refreshed = (res as any)?.data?.data ?? (res as any)?.data;
      if (refreshed) {
        const dto = refreshed as EmployeeDetailDto;
        setProfile(dto);
        setForm(mapProfileToForm(dto));
      }
    } catch (error) {
      console.error("Failed to update profile", error);
      const message =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "Cập nhật thất bại";
      alert(`Cập nhật thất bại. Lỗi: ${Array.isArray(message) ? message.join(", ") : message}`);
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = () => {
    if (saving || uploadingAvatar) return;
    avatarFileInputRef.current?.click();
  };

  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file);
      const url = extractAvatarUrl(res);
      if (!url) {
        alert("Upload avatar thành công nhưng không nhận được URL ảnh.");
        return;
      }
      setForm((prev) => ({ ...prev, avatarUrl: url }));
      setProfile((prev) => prev ? { ...prev, avatarUrl: url } : prev);
    } catch (error) {
      console.error("Failed to upload avatar", error);
      const message =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "Upload avatar thất bại";
      alert(`Upload avatar thất bại. Lỗi: ${Array.isArray(message) ? message.join(", ") : message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!profile) {
    return (
      <div className="p-6 min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <div className="text-sm text-gray-500 animate-pulse">Đang tải thông tin...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-[1500px] mx-auto w-full">
        
        {/* Tabs Header */}
        <div className="flex border-b border-[#E9EAEC] px-6 pt-8">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-8 py-3 text-[13px] font-bold tracking-wide transition-colors relative ${
              activeTab === "personal"
                ? "text-[#0B9F57] border-b-2 border-[#0B9F57]"
                : "text-[#657081] hover:text-gray-800"
            }`}
          >
            PERSONAL
          </button>
          <button
            onClick={() => setActiveTab("contract")}
            className={`px-8 py-3 text-[13px] font-bold tracking-wide transition-colors relative ${
              activeTab === "contract"
                ? "text-[#0B9F57] border-b-2 border-[#0B9F57]"
                : "text-[#657081] hover:text-gray-800"
            }`}
          >
            CONTRACT
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "personal" ? (
            <PersonalTab
              isEditing={isEditing}
              saving={saving}
              uploadingAvatar={uploadingAvatar}
              onPickAvatar={onPickAvatar}
              avatarFileInputRef={avatarFileInputRef}
              onAvatarFileChange={onAvatarFileChange}
              form={form}
              setForm={setForm}
            />
          ) : (
            <ContractTab isEditing={isEditing} form={form} setForm={setForm} />
          )}
        </div>

        {/* Buttons Edit/Save/Cancel */}
        <div className="flex items-center justify-center gap-4 mt-8">
          {!isEditing ? (
            <button
              type="button"
              onClick={onStartEdit}
              className="px-12 py-2 text-sm font-bold text-white bg-emerald-500 rounded shadow-md hover:bg-emerald-600 transition-all uppercase tracking-wider disabled:opacity-60"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={saving}
                className="h-10 px-8 rounded border border-[#E9EAEC] text-[13px] font-semibold text-[#21252B] hover:bg-[#F5F6F8] disabled:opacity-60 shadow-sm transition-all uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="px-12 py-2 text-sm font-bold text-white bg-emerald-500 rounded shadow-md hover:bg-emerald-600 transition-all uppercase tracking-wider disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

// --- COMPONENT TÁI SỬ DỤNG CHO DÒNG INPUT ---
const ViewRow = ({
  label,
  children,
  labelWidth = "w-32",
}: {
  label: string;
  children: React.ReactNode;
  labelWidth?: string;
}) => (
  <div className="flex items-center mb-3">
    <label className={`text-xs font-medium text-[#657081] ${labelWidth} shrink-0`}>
      {label}
    </label>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

const inputClass = "w-full h-[34px] px-3 bg-[#F8F9FA] border border-[#E9EAEC] rounded text-[5px] text-[#21252B] focus:outline-none";
const SectionTitle = ({ title }: { title: string }) => (
  <div className="flex items-center mb-5">
    <h3 className="text-[13px] font-bold text-[#21252B]">{title}</h3>
    <div className="flex-1 ml-3 h-px bg-[#E9EAEC]"></div>
  </div>
);

// ==========================================
// TAB PERSONAL
// ==========================================
function PersonalTab({
  isEditing,
  saving,
  uploadingAvatar,
  onPickAvatar,
  avatarFileInputRef,
  onAvatarFileChange,
  form,
  setForm,
}: {
  isEditing: boolean;
  saving: boolean;
  uploadingAvatar: boolean;
  onPickAvatar: () => void;
  avatarFileInputRef: React.RefObject<HTMLInputElement>;
  onAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  form: ReturnType<typeof mapProfileToForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof mapProfileToForm>>>;
}) {
  return (
    <div className="space-y-8 w-full">
      
      {/* ROW 1: Account Info & Main Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* L: Account Info (5 cols) */}
        <div className="col-span-12 lg:col-span-5">
          <SectionTitle title="Account Info" />
          <div className="flex gap-6">
            <div className="flex flex-col items-center shrink-0 w-[120px]">
              <img
                src={form.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
                alt="Avatar"
                className="w-24 h-24 rounded-full border-2 border-[#0B9F57] object-cover bg-gray-50"
              />

              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarFileChange}
              />

              <button
                type="button"
                onClick={onPickAvatar}
                disabled={saving || uploadingAvatar}
                className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1.5 rounded hover:bg-gray-200 disabled:opacity-60 whitespace-nowrap"
              >
                <Upload size={12} /> {uploadingAvatar ? "UPLOADING" : "UPLOAD"}
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <ViewRow label="Employee ID">
                <input type="text" readOnly value={form.id} className={inputClass} />
              </ViewRow>
              <ViewRow label="Roles">
                <input type="text" readOnly value={form.roles} className={inputClass} />
              </ViewRow>
              <ViewRow label="Email Company">
                <input
                  type="email"
                  readOnly={!isEditing}
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={inputClass}
                />
              </ViewRow>
            </div>
          </div>
        </div>

        {/* R: Main Info (7 cols) */}
        <div className="col-span-12 lg:col-span-7">
          <SectionTitle title="Main Info" />
          
          <ViewRow label="Fullname" labelWidth="w-24">
            <input
              type="text"
              readOnly={!isEditing}
              value={form.fullname}
              onChange={(e) => setForm((prev) => ({ ...prev, fullname: e.target.value }))}
              className={inputClass}
            />
          </ViewRow>

          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 flex items-center">
              <label className="text-xs font-medium text-[#657081] w-24 shrink-0">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                disabled={!isEditing}
                className={inputClass}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="flex-1 flex items-center gap-3">
              <label className="text-xs font-medium text-[#657081] shrink-0">Birth Day</label>
              <div className="relative flex-1">
                {isEditing ? (
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                    className={`${inputClass} pr-8`}
                  />
                ) : (
                  <>
                    <input type="text" readOnly value={formatSlashDate(form.dateOfBirth)} className={`${inputClass} pr-8`} />
                    <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#657081]" />
                  </>
                )}
              </div>
            </div>
          </div>

          <ViewRow label="Phone" labelWidth="w-24">
            <input
              type="text"
              readOnly={!isEditing}
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className={inputClass}
            />
          </ViewRow>

          <ViewRow label="Address" labelWidth="w-24">
            <input
              type="text"
              readOnly={!isEditing}
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              className={inputClass}
            />
          </ViewRow>

          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 flex items-center">
              <label className="text-xs font-medium text-[#657081] w-24 shrink-0">Sign Day</label>
              <div className="relative flex-1">
                {isEditing ? (
                  <input
                    type="date"
                    value={form.signDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, signDate: e.target.value }))}
                    className={`${inputClass} pr-8`}
                  />
                ) : (
                  <>
                    <input type="text" readOnly value={formatSlashDate(form.signDate)} className={`${inputClass} pr-8`} />
                    <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#657081]" />
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3">
              <label className="text-xs font-medium text-red-500 shrink-0">Quit Day</label>
              <div className="relative flex-1">
                {isEditing ? (
                  <input
                    type="date"
                    value={form.quitDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, quitDate: e.target.value }))}
                    className={`${inputClass} pr-8`}
                  />
                ) : (
                  <input type="text" readOnly value={formatSlashDate(form.quitDate)} className={`${inputClass} pr-8`} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: Other Info & University */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* L: Other Info (5 cols) */}
        <div className="col-span-12 lg:col-span-5">
          <SectionTitle title="Other Info" />
          
          <ViewRow label="ID Card">
            <input
              type="text"
              readOnly={!isEditing}
              value={form.idCard}
              onChange={(e) => setForm((prev) => ({ ...prev, idCard: e.target.value }))}
              className={inputClass}
            />
          </ViewRow>

          <div className="flex items-center mb-3">
            <label className="text-xs font-medium text-[#657081] w-32 shrink-0">Married</label>
            <div className="flex flex-1 items-center gap-6">
              <input
                type="checkbox"
                disabled={!isEditing}
                checked={Boolean(form.marriedStatus)}
                onChange={(e) => setForm((prev) => ({ ...prev, marriedStatus: e.target.checked }))}
                className="w-4 h-4 rounded border-[#E9EAEC] text-[#0B9F57]"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#657081] whitespace-nowrap">Children</span>
                <input 
                  type="text" 
                  readOnly={!isEditing} 
                  value={String(form.numberOfChildren)} 
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setForm((prev) => ({ ...prev, numberOfChildren: Number.isFinite(n) ? n : 0 }));
                  }}
                  className={`${inputClass} px-10 text-center`} 
                />
              </div>
            </div>
          </div>

          <ViewRow label="Children Description">
            <input
              type="text"
              readOnly={!isEditing}
              value={form.childrenDescription}
              onChange={(e) => setForm((prev) => ({ ...prev, childrenDescription: e.target.value }))}
              className={inputClass}
            />
          </ViewRow>
        </div>

        {/* R: University (7 cols) */}
        <div className="col-span-12 lg:col-span-7">
          <SectionTitle title="University" />
          
          <div className="w-full overflow-x-auto pb-2">
            {/* Sử dụng min-w-[800px] để bảng có đủ không gian hiển thị text không bị cắt */}
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="pb-2 text-[11px] font-semibold text-[#657081] w-[15%]">Schools</th>
                  <th className="pb-2 text-[11px] font-semibold text-[#657081] w-[25%]">Degree</th>
                  <th className="pb-2 text-[11px] font-semibold text-[#657081] w-[22%]">Mode of study</th>
                  <th className="pb-2 text-[11px] font-semibold text-[#657081] w-[13%]">Graduation Year</th>
                  <th className="pb-2 text-[11px] font-semibold text-[#657081] w-[25%]">Description</th>
                  {isEditing ? <th className="pb-2 text-[11px] font-semibold text-[#657081] w-[34px]"></th> : null}
                </tr>
              </thead>
              <tbody>
                {form.degrees?.length ? (
                  form.degrees.map((d, idx) => (
                    <tr key={d.id}>
                      <td className="py-1 pr-2">
                        <input
                          type="text"
                          readOnly={!isEditing}
                          value={d.school}
                          onChange={(e) =>
                            setForm((prev) => {
                              const next = [...(prev.degrees ?? [])];
                              next[idx] = { ...next[idx], school: e.target.value };
                              return { ...prev, degrees: next };
                            })
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          type="text"
                          readOnly={!isEditing}
                          value={d.degree}
                          onChange={(e) =>
                            setForm((prev) => {
                              const next = [...(prev.degrees ?? [])];
                              next[idx] = { ...next[idx], degree: e.target.value };
                              return { ...prev, degrees: next };
                            })
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          type="text"
                          readOnly={!isEditing}
                          value={d.fieldOfStudy}
                          onChange={(e) =>
                            setForm((prev) => {
                              const next = [...(prev.degrees ?? [])];
                              next[idx] = { ...next[idx], fieldOfStudy: e.target.value };
                              return { ...prev, degrees: next };
                            })
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          type="text"
                          readOnly={!isEditing}
                          value={d.graduationYear}
                          onChange={(e) =>
                            setForm((prev) => {
                              const next = [...(prev.degrees ?? [])];
                              next[idx] = { ...next[idx], graduationYear: e.target.value };
                              return { ...prev, degrees: next };
                            })
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="py-1">
                        <input
                          type="text"
                          readOnly={!isEditing}
                          value={d.description}
                          onChange={(e) =>
                            setForm((prev) => {
                              const next = [...(prev.degrees ?? [])];
                              next[idx] = { ...next[idx], description: e.target.value };
                              return { ...prev, degrees: next };
                            })
                          }
                          className={inputClass}
                        />
                      </td>

                      {isEditing ? (
                        <td className="py-1 pl-2">
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                degrees: (prev.degrees ?? []).filter((x) => x.id !== d.id),
                              }))
                            }
                            className="h-[34px] w-[34px] inline-flex items-center justify-center rounded border border-red-200 bg-white text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                            title="Remove"
                            aria-label="Remove"
                            >
                              {/* Lưu ý xóa màu text-[#657081] cũ ở đây để nó nhận màu đỏ từ thẻ button truyền xuống */}
                              <X className="w-4 h-4" /> 
                        </button>
                        </td>
                      ) : null}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isEditing ? 6 : 5} className="py-4 text-center text-sm text-[#657081]">
                      No degree information
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {isEditing ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, degrees: [...(prev.degrees ?? []), emptyDegree()] }))}
                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded hover:bg-emerald-100"
              >
                 + Add degree
              </button>
            </div>
          ) : null}
        </div>
      </div>

    </div>
  );
}

// ==========================================
// TAB CONTRACT
// ==========================================
function ContractTab({
  isEditing,
  form,
  setForm,
}: {
  isEditing: boolean;
  form: ReturnType<typeof mapProfileToForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof mapProfileToForm>>>;
}) {
  return (
    <div className="max-w-[900px] mx-auto mt-4 w-full">
      {/* Khung Contract */}
      <div className="relative border border-[#E9EAEC] rounded-lg p-8 pt-10">
        
        {/* Label lơ lửng trên viền */}
        <div className="absolute -top-3 left-4 bg-white px-2 text-[13px] font-bold text-[#21252B]">
          Sign Day - {formatSlashDate(form.signDate) || "N/A"}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
          
          {/* L: Basic Salary, Department Name */}
          <div className="space-y-1">
            <ViewRow label="Salary Basic" labelWidth="w-32">
              {isEditing ? (
                <input
                  type="text"
                  value={form.basicSalary}
                  onChange={(e) => setForm((prev) => ({ ...prev, basicSalary: e.target.value }))}
                  className={inputClass}
                />
              ) : (
                <input type="text" readOnly value={formatMoney(toOptionalNumber(form.basicSalary))} className={inputClass} />
              )}
            </ViewRow>
            
            <ViewRow label="Department Name" labelWidth="w-32">
              <input
                type="text"
                readOnly={!isEditing}
                value={form.departmentName}
                onChange={(e) => setForm((prev) => ({ ...prev, departmentName: e.target.value }))}
                className={inputClass}
              />
            </ViewRow>

            <ViewRow label="End Day" labelWidth="w-32">
              <div className="relative">
                {isEditing ? (
                  <input
                    type="date"
                    value={form.quitDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, quitDate: e.target.value }))}
                    className={`${inputClass} pr-8`}
                  />
                ) : (
                  <>
                    <input type="text" readOnly value={formatSlashDate(form.quitDate)} className={`${inputClass} pr-8`} />
                    <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#657081]" />
                  </>
                )}
              </div>
            </ViewRow>
          </div>

          {/* R: Gross Salary, Department ID */}
          <div className="space-y-1">
            <ViewRow label="Salary Gross" labelWidth="w-32">
              {isEditing ? (
                <input
                  type="text"
                  value={form.grossSalary}
                  onChange={(e) => setForm((prev) => ({ ...prev, grossSalary: e.target.value }))}
                  className={inputClass}
                />
              ) : (
                <input type="text" readOnly value={formatMoney(toOptionalNumber(form.grossSalary))} className={inputClass} />
              )}
            </ViewRow>

            <ViewRow label="Department ID" labelWidth="w-32">
              <input type="text" readOnly value={form.departmentId || ""} className={inputClass} />
            </ViewRow>
          </div>

        </div>
      </div>
    </div>
  );
}