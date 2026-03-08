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
}
