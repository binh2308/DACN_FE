import { request } from "../service";
import type { DACN } from "./typings";

type ChatHistoryParams = {
  sessionId: string;
  limit?: number;
};

export function GetResponseFromAI(
  data: DACN.ChatRequestDto,
  options?: { [key: string]: any },
) {
  return request<DACN.ChatResponseDto>(`/ai/chat`, {
    method: "POST",
    data,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function GetChatSessions(
  limit?: number,
  options?: { [key: string]: any },
) {
  return request(`/ai/chat-history/sessions`, {
    method: "GET",
    params: {
      limit,
    },
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function GetChatHistory(
  params: ChatHistoryParams,
  options?: { [key: string]: any },
) {
  return request(`/ai/chat-history`, {
    method: "GET",
    params,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}
