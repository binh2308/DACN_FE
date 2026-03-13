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
    location?: string;
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
    location?: string;
    purchase_date: string;
    warranty_expiration_date: string;
    maintenance_schedule: string;
  };
}
