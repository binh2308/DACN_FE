"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useRequest } from "ahooks";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBooking, type RecurringPattern } from "@/services/DACN/Booking";
import { getRoomById, type Room } from "@/services/DACN/Rooms";

function normalizeRoomResponse(data: unknown): Room | null {
	if (!data || typeof data !== "object") return null;
	if ((data as any).success === true && (data as any).data) return (data as any).data;
	if ((data as any).data) return (data as any).data;
	return null;
}

type FormState = {
	purpose: string;
	startDate: string;
	startTime: string;
	endDate: string;
	endTime: string;
	recurringPattern: RecurringPattern;
	recurringEndDate: string;
};

function toIsoFromLocal(date: string, time: string) {
	// Convert local date/time inputs into an absolute instant (UTC ISO string).
	const normalizedTime = time.split(":").length === 2 ? `${time}:00` : time;
	return new Date(`${date}T${normalizedTime}`).toISOString();
}


export default function BookRoomPage() {
	const router = useRouter();
	const params = useParams<{ id: string | string[] }>();
	const roomId = React.useMemo(() => {
		const id = (params as any)?.id as string | string[] | undefined;
		if (!id) return null;
		return Array.isArray(id) ? id[0] : id;
	}, [params]);

	const { data: roomRaw, loading: roomLoading, error: roomError } = useRequest(
		() => getRoomById(roomId as string),
		{ ready: Boolean(roomId) },
	);
	const room = React.useMemo(() => normalizeRoomResponse(roomRaw), [roomRaw]);

	const [submitted, setSubmitted] = React.useState(false);
	const [submitError, setSubmitError] = React.useState<string | null>(null);
	const [form, setForm] = React.useState<FormState>({
		purpose: "",
		startDate: "",
		startTime: "",
		endDate: "",
		endTime: "",
		recurringPattern: "WEEKLY",
		recurringEndDate: "",
	});

	const { runAsync: submitBooking, loading: submitting } = useRequest(createBooking, {
		manual: true,
	});

	// After all hooks are initialized, it's safe to branch/return.
	if (!roomId) notFound();
	if (roomLoading) {
		return (
			<div className="mx-auto w-full max-w-[1100px] px-6 py-6">
				<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-border">
					<div className="text-sm text-muted-foreground">Đang tải phòng…</div>
				</div>
			</div>
		);
	}
	if (roomError) {
		return (
			<div className="mx-auto w-full max-w-[1100px] px-6 py-6">
				<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-border">
					<div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
						{(roomError as any)?.message || "Không thể tải thông tin phòng."}
					</div>
					<div className="mt-4">
						<Button asChild variant="outline" type="button">
							<Link href="/manager/booking">Back</Link>
						</Button>
					</div>
				</div>
			</div>
		);
	}
	if (!room) notFound();

	const onChange = (key: keyof FormState) =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			setForm((prev) => ({ ...prev, [key]: e.target.value }));
		};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!room) return;
		setSubmitError(null);
		setSubmitted(false);

		const start = toIsoFromLocal(form.startDate, form.startTime);
		const end = toIsoFromLocal(form.endDate, form.endTime);
		if (new Date(end).getTime() <= new Date(start).getTime()) {
			setSubmitError("Thời gian kết thúc phải sau thời gian bắt đầu.");
			return;
		}

		const recurringEndDate = form.recurringEndDate || form.endDate;
		if (!recurringEndDate) {
			setSubmitError("Vui lòng chọn recurring end date.");
			return;
		}

		const recurringEndIso = toIsoFromLocal(recurringEndDate, "23:59:59");

		try {
			await submitBooking({
				room_id: room.id,
				start_time: start,
				end_time: end,
				purpose: form.purpose,
				recurring_pattern: form.recurringPattern,
				recurring_end_date: recurringEndIso,
			});
			setSubmitted(true);
			router.push(`/manager/booking/${room.id}`);
		} catch (err) {
			setSubmitError((err as any)?.message || "Tạo booking thất bại.");
		}
	};

	return (
		<div className="mx-auto w-full max-w-[1100px] px-6 py-6">
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_460px]">
				<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-border">
					{room.imageUrl ? (
						<div className="overflow-hidden rounded-xl ring-1 ring-border">
							<div className="aspect-[16/9] w-full bg-muted">
								<img
									src={room.imageUrl}
									alt={room.name}
									className="h-full w-full object-cover"
									loading="lazy"
								/>
							</div>
						</div>
					) : null}

					<div className="mt-5 text-xs font-semibold text-muted-foreground">ROOM</div>
					<div className="mt-2 text-xl font-semibold text-foreground">{room.name}</div>
					<div className="mt-2 text-sm text-muted-foreground">
						Capacity: <span className="font-medium text-foreground">{room.capacity}</span>
					</div>
					{Array.isArray(room.equipment) && room.equipment.length > 0 ? (
						<div className="mt-4 flex flex-wrap gap-2">
							{room.equipment.map((eq) => (
								<Badge key={eq} variant="secondary" className="rounded-md">
									{eq}
								</Badge>
							))}
						</div>
					) : null}
				</div>

				<Card className="shadow-sm">
					<CardContent className="p-6">
						<form onSubmit={onSubmit} className="space-y-4">
							{submitted ? (
								<div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
									Booking created. Redirecting…
								</div>
							) : null}

							{submitError ? (
								<div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
									{submitError}
								</div>
							) : null}

							<div className="space-y-2">
								<Label htmlFor="purpose">Purpose</Label>
								<Input
									id="purpose"
									value={form.purpose}
									onChange={onChange("purpose")}
									placeholder="Weekly planning"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="room">Room :</Label>
								<Input id="room" value={room.name} disabled />
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="startDate">Start time</Label>
									<Input
										id="startDate"
										type="date"
										value={form.startDate}
										onChange={onChange("startDate")}
										required
									/>
									<Input
										type="time"
										value={form.startTime}
										onChange={onChange("startTime")}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="endDate">End time</Label>
									<Input
										id="endDate"
										type="date"
										value={form.endDate}
										onChange={onChange("endDate")}
										required
									/>
									<Input
										type="time"
										value={form.endTime}
										onChange={onChange("endTime")}
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="recurringPattern">Recurring pattern</Label>
									<select
										id="recurringPattern"
										value={form.recurringPattern}
										onChange={(e) =>
											setForm((prev) => ({
												...prev,
												recurringPattern: e.target.value as RecurringPattern,
											}))
										}
										className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
									>
										<option value="NONE">NONE</option>
										<option value="DAILY">DAILY</option>
										<option value="WEEKLY">WEEKLY</option>
										<option value="MONTHLY">MONTHLY</option>
									</select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="recurringEndDate">Recurring end date</Label>
									<Input
										id="recurringEndDate"
										type="date"
										value={form.recurringEndDate}
										onChange={onChange("recurringEndDate")}
										required
									/>
								</div>
							</div>

							<div className="flex items-center justify-end gap-3 pt-2">
								<Button asChild variant="outline" type="button">
									<Link href={`/manager/booking/${room.id}`}>Back</Link>
								</Button>
								<Button
									type="submit"
									className="rounded-md bg-[#4F7D7B] hover:bg-[#436d6b]"
									disabled={submitted || submitting}
								>
									{submitting ? "Booking…" : "Book Now"}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
