"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getRoomById } from "@/lib/booking/rooms";

type FormState = {
	title: string;
	organizer: string;
	members: string;
	startDate: string;
	startTime: string;
	endDate: string;
	endTime: string;
};

export default function BookRoomPage({ params }: { params: { id: string } }) {
	const router = useRouter();
	const room = React.useMemo(() => getRoomById(params.id), [params.id]);
	if (!room) notFound();

	const [submitted, setSubmitted] = React.useState(false);
	const [form, setForm] = React.useState<FormState>({
		title: "",
		organizer: "",
		members: "",
		startDate: "",
		startTime: "",
		endDate: "",
		endTime: "",
	});

	const onChange = (key: keyof FormState) =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			setForm((prev) => ({ ...prev, [key]: e.target.value }));
		};

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitted(true);
		// Mock submit: this is UI-only for now.
		setTimeout(() => {
			router.push(`/admin/booking/${room.id}`);
		}, 700);
	};

	return (
		<div className="mx-auto w-full max-w-[1100px] px-6 py-6">
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_460px]">
				<div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
					<div className="aspect-[16/9] w-full bg-muted">
						<img
							src={room.imageUrl}
							alt={room.name}
							className="h-full w-full object-cover"
							loading="lazy"
						/>
					</div>
				</div>

				<Card className="shadow-sm">
					<CardContent className="p-6">
						<form onSubmit={onSubmit} className="space-y-4">
							{submitted ? (
								<div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
									Booking created (mock). Redirecting…
								</div>
							) : null}

							<div className="space-y-2">
								<Label htmlFor="title">Title :</Label>
								<Input
									id="title"
									value={form.title}
									onChange={onChange("title")}
									placeholder="React Review"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="room">Room :</Label>
								<Input id="room" value={room.name} disabled />
							</div>

							<div className="space-y-2">
								<Label htmlFor="organizer">Organizer :</Label>
								<Input
									id="organizer"
									value={form.organizer}
									onChange={onChange("organizer")}
									placeholder="Your name"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="members">Members :</Label>
								<Textarea
									id="members"
									value={form.members}
									onChange={onChange("members")}
									placeholder="e.g. Alice, Bob, Charlie"
									rows={3}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="startDate">Start</Label>
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
									<Label htmlFor="endDate">End</Label>
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

							<div className="flex items-center justify-end gap-3 pt-2">
								<Button asChild variant="outline" type="button">
									<Link href={`/admin/booking/${room.id}`}>Back</Link>
								</Button>
								<Button
									type="submit"
									className="rounded-md bg-[#4F7D7B] hover:bg-[#436d6b]"
									disabled={submitted}
								>
									Book Now
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
