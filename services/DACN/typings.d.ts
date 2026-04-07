export declare namespace DACN {
  type LoginRequestDto = {
    email: string;
    password: string;
  };
  type TokenResponse = {
    access_token: string;
  };
  type CreateLeaveRequestDto = {
    date_from: string; // ISO date string
    date_to: string;
    reason: string;
    description?: string;
  };
  type CreateAssetDto = {
    name: string;
    category?: string;
    condition: string;
    type: string;
    ownerEmployeeId?: string | null;
    location?: string | null;
    purchase_date: string;
    warranty_expiration_date: string;
    maintenance_schedule: string;
  };
  type UpdateAssetDto = {
    name: string;
    category?: string;
    condition: string;
    type: string;
    ownerEmployeeId?: string | null;
    location?: string | null;
    purchase_date: string;
    warranty_expiration_date: string;
    maintenance_schedule: string;
  };
  type AssignAssetDto = {
    employeeId: string;
    assignmentDate: string;
  };
  type TicketResponseDto = {
    id: string;
    employee: any;
    assignee: any;
    category: any;
    title: string;
    description: string;
    status: "OPEN" | "IN_PROGRESS" | "CLOSED";
    createdAt: string;
    updatedAt: string;
    processes: any;
  };
  type CreateReportRequestDto = {
    week_starting: string;
    accomplishment: string;
    in_progress: string;
    plan: string;
    blocker?: string;
    progress_percentage?: number;
    progress_notes?: string;
  };
  type ReportResponseDto = {
    id: string;
    employee_id?: string;
    week_starting: string;
    accomplishment: string;
    in_progress: string;
    plan: string;
    blocker?: string;
    progress_percentage: number;
    progress_notes?: string;
    status: "DRAFT" | "SUBMITTED" | "REVIEWED";
    created_at: string;
    updated_at: string;
  };

}
