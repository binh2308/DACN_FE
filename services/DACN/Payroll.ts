import { request } from "../service";

export type GetMyPayrollByMonthRequest = {
	year: number;
	month: number;
};

export type PayrollEmployeeDto = {
	id: string;
	lastName: string;
	firstName: string;
	middleName?: string | null;
	gender?: string | null;
	dateOfBirth?: string | null;
	email: string;
	roles: string;
	password_hash?: string | null;
	phone?: string | null;
	basicSalary?: number | null;
	grossSalary?: number | null;
	signDate?: string | null;
	quitDate?: string | null;
	idCard?: string | null;
	address?: string | null;
	marriedStatus?: boolean | null;
	numberOfChildren?: number | null;
	childrenDescription?: string | null;
	avatarUrl?: string | null;
	avatarKey?: string | null;
	deletedAt?: string | null;
	department?: {
		id: string;
		name: string;
	} | null;
	degrees?: Array<{
		id: string;
		school: string;
		degree: string;
		fieldOfStudy: string;
		graduationYear: number;
		description?: string | null;
	}>;
};

export type PayrollDto = {
	id: string;
	employeeId: string;
	employee: PayrollEmployeeDto;
	year: number;
	month: number;
	basicSalarySnapshot: number;
	workedHours: number;
	overtimeHours: number;
	insuranceAmount: number;
	allowance: number;
	deduction: number;
	taxAmount: number;
	grossSalary: number;
	netSalary: number;
	status: string;
	finalizedAt: string | null;
	paidAt: string | null;
	createdAt: string;
	updatedAt: string;
};

export type GetMyPayrollByMonthResponse = {
	statusCode: number;
	message?: string;
	data: PayrollDto;
};

export async function getMyPayrollByMonth(
	body: GetMyPayrollByMonthRequest,
	options?: { [key: string]: any },
) {
	return request<GetMyPayrollByMonthResponse>("/payroll/my/generate-monthly", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		data: body,
		...(options || {}),
	});
}

