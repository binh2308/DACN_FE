import { request } from "../service";

export type NotificationStatus = "UNREAD" | "READ" | (string & {});
export type NotificationType =
	| "TICKET"
	| "LEAVE_REQUEST"
	| "ASSET"
	| "PAYROLL"
	| (string & {});

export type NotificationItemDto = {
	id: string;
	message: string;
	type: NotificationType;
	status: NotificationStatus;
	created_at: string;
};

export type GetMyNotificationsParams = {
	/** Page number (1-based) */
	page?: number;
	/** Page size */
	pageSize?: number;
	/** Filter by notification status */
	status?: string;
	/** Filter by notification type */
	type?: string;
	/** Search in message */
	search?: string;
};

export type GetMyNotificationsData = {
	items: NotificationItemDto[];
	total: number;
	page: number;
	pageSize: number;
};

export type GetMyNotificationsResponse = {
	statusCode: number;
	message?: string;
	data: GetMyNotificationsData;
};

export async function getMyNotifications(
	params?: GetMyNotificationsParams,
	options?: { [key: string]: any },
) {
	return request<GetMyNotificationsResponse, GetMyNotificationsResponse>(
		"/notifications/my",
		{
			method: "GET",
			params,
			...(options || {}),
		},
	);
}
