import { request } from "../service";
import type { DACN } from "./typings";

export type MyLeaveRequestsParams = {
  page?: number;       
  pageSize?: number;    
  employeeId?: string;  
  search?: string;      
  fromDate?: string;   
  toDate?: string;     
};

export async function myRequests(
  params?: MyLeaveRequestsParams,
  options?: { [key: string]: any },
) {
  return request<any>("/leave-requests/my", {
    method: "GET",
    params, // -> ?page=1&pageSize=20&employeeId=...&search=...&fromDate=...&toDate=...
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export async function createLeaveRequest(
  data: DACN.CreateLeaveRequestDto,
  options?: { [key: string]: any },
) {
  return request<any>("/leave-requests/submit", {
    method: "POST",
    data,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}
