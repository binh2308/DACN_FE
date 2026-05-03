import { request } from "../service";
import { ImageItem } from "@/lib/utils";
import type { DACN } from "./typings";

export type AnnouncementParam = {
  page?: number;
  pageSize?: number;
  category?: "GENERAL" | "HR" | "IT" | "SALES" | "MARKETING";
  pinned?: boolean;
  search?: string;
};

export function getListAnnouncement(
  params?: AnnouncementParam,
  options?: { [key: string]: any },
) {
  return request<any>(`/announcements`, {
    method: "GET",
    params,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function getAnnouncementById(
  id: string,
  options?: { [key: string]: any },
) {
  return request<any>(`/announcements/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function createAnnouncement(
  data: DACN.AnnouncementCreateDto,
  options?: { [key: string]: any },
) {
  return request<any>(`/announcements`, {
    method: "POST",
    data,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function uploadImageForAnnouncement(
  announcementId: string,
  imageItem: ImageItem,
  options?: { [key: string]: any },
) {
  return request<any>(`/announcements/${announcementId}/upload-image`, {
    method: "POST",
    data: { file: imageItem.file },
    headers: {
      "Content-Type": "multipart/form-data",
    },
    ...(options || {}),
  });
}

export function toggleLikeAnnouncement(
  id: string,
  options?: { [key: string]: any },
) {
  return request(`/announcements/${id}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function addCommentToAnnouncement(
  id: string,
  comment: string,
  options?: { [key: string]: any },
) {
  return request(`/announcements/${id}/comments`, {
    method: "POST",
    data: { comment },
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function togglePinnedAnnouncement(
  id: string,
  options?: { [key: string]: any },
) {
  return request(`/announcements/${id}/pin`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function getAnnouncementInteractions(
  id: string,
  options?: { [key: string]: any },
) {
  return request(`/announcements/${id}/interactions`, {
    method: "GET",

    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}
