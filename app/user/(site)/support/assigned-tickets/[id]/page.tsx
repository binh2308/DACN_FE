"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { ChevronLeft, Image as ImageIcon, UserCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Center, CloseButton, Loader } from "@mantine/core";
import {
  formatTicketStatus,
  statusBadgeVariant,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/support/tickets";
import {
  getTicketById,
  addCommentToTicket,
  updateTicketStatus,
} from "@/services/DACN/Tickets";
import { DACN } from "@/services/DACN/typings";
import { formatDate } from "@/lib/utils";
import { set } from "react-hook-form";

function MessageCard({
  author,
  content,
  time,
  variant,
}: {
  author: string;
  content: string;
  time: string;
  variant: "agent" | "user";
}) {
  const isAgent = variant === "agent";
  return (
    <Card className={isAgent ? "bg-emerald-50/60" : "bg-white"}>
      <CardContent className="p-5">
        <div className="flex gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-white ring-1 ring-border">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold text-foreground">
                {author}
              </div>
            </div>
            <div className="mt-3 text-sm text-foreground">{content}</div>
            <div className="mt-4 text-right text-xs text-muted-foreground">
              {time}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AssignedTicketDetailPage() {
  const router = useRouter();
  const [ticket, setTicket] = React.useState<DACN.TicketResponseDto | null>(
    null,
  );
  const [assignee, setAssignee] = React.useState<any>(null);
  const [status, setStatus] = React.useState<TicketStatus | undefined>(
    undefined,
  );

  const [response, setResponse] = React.useState("");
  const params = useParams<{ id: string | string[] }>();
  type TicketId = string | null;
  const ticketId: TicketId = React.useMemo(() => {
    if (!params) return null;
    const id = params.id;
    return Array.isArray(id) ? id[0] : id;
  }, [params]);
  const [messages, setMessages] = React.useState<any>([]);
  React.useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketId) return;
      try {
        const res = await getTicketById(ticketId);
        //console.log("Fetched ticket details:", res?.data);
        setTicket(res?.data);
        setMessages(res?.data?.processes || []);
        setAssignee(res?.data?.assignee);
        setStatus(res?.data?.status);
      } catch (error) {
        console.error("Error fetching ticket details:", error);
      }
    };
    fetchTicket();
  }, [ticketId, messages, status]);
  if (!params) return null;
  if (!ticket)
    return (
      <Center style={{ height: "100vh" }}>
        <Loader color="green" />
      </Center>
    );

  const canRespond = Boolean(assignee) && status === "IN_PROGRESS";

  const addResponse = async () => {
    if (!response.trim()) return;

    try {
      await addCommentToTicket(ticket.id, {
        note: response,
      });
    } catch (error) {
      console.error("Error adding response:", error);
    }

    setMessages((prev: any[]) => [
      ...prev,
      {
        id: ticket?.id + "-resp-" + (prev.length + 1),
        note: response,
        from: "agent",
        created_at: new Date().toISOString(),
        actor: {
          firstName: ticket?.assignee.firstName,
          middleName: ticket?.assignee.middleName,
          lastName: ticket?.assignee.lastName,
        },
      },
    ]);
    setResponse("");
  };
  const closeTicket = async () => {
    try {
      await updateTicketStatus(ticket.id, {
        status: "CLOSED",
        note: "Closing this ticket.",
      });
      setStatus("CLOSED");
    } catch (error) {
      console.error("Error closing ticket:", error);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
      <div className="mb-6 flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-9 px-2"
          onClick={() =>
            router.push(
              `/user/support?tab=${encodeURIComponent("My Assigned Tickets")}`,
            )
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Link
          href="/user/support"
          className="text-sm font-semibold text-foreground"
        >
          Ticket Details
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <div>
                  <div className="text-xs text-muted-foreground">User</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {ticket.employee.firstName} {ticket.employee.middleName}{" "}
                    {ticket.employee.lastName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Phone Number
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {ticket.employee.phone ?? "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {formatTicketStatus(status as TicketStatus)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Ticket ID</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {ticket.id}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Subject</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {ticket.title}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Submitted</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {formatDate(ticket.createdAt, "DD/MM/YYYY")}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-4 rounded-xl bg-muted/20 p-4 text-sm text-foreground ring-1 ring-border">
                <div className="grid h-14 w-14 place-items-center rounded-lg bg-white ring-1 ring-border">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Ticket Issue
                  </div>
                  <div className="mt-2 leading-relaxed">
                    {ticket.description}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3">
                <Button
                  variant="outline"
                  className="w-full max-w-[520px] rounded-full"
                  type="button"
                >
                  Choose an assignee and set status to "In Progress" to add
                  response.
                </Button>
                <Button
                  variant="outline"
                  className="w-full max-w-[360px] rounded-full"
                  type="button"
                >
                  This ticket has been solved.
                </Button>
                <Button
                  variant="outline"
                  className="w-full max-w-[320px] rounded-full"
                  type="button"
                >
                  This ticket is deferred.
                </Button>
                <Button
                  type="button"
                  className="w-full max-w-[180px] rounded-full bg-[#4F7D7B] hover:bg-[#436d6b]"
                  //onClick={addResponse}
                  disabled={!canRespond}
                >
                  Add Response
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {messages.map((m: any) => {
              const agent = m.from === "agent";
              return (
                <MessageCard
                  key={m.id}
                  author={
                    m.actor?.firstName +
                    " " +
                    m.actor?.middleName +
                    " " +
                    m.actor?.lastName
                  }
                  content={m.note}
                  time={new Date(m.created_at).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                  variant={agent ? "agent" : "user"}
                />
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="space-y-6 p-6">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Assignee
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">
                    {assignee !== null
                      ? assignee.firstName +
                        " " +
                        assignee.middleName +
                        " " +
                        assignee.lastName
                      : "Unassigned"}
                  </span>
                </div>
                {/* <Button
                  variant="outline"
                  className="mt-3 w-full rounded-full"
                  type="button"
                  //onClick={() => setAssignee(assignee ? "" : "Deanna Jones")}
                >
                  Choose Assignee
                </Button> */}
              </div>

              <div>
                <div className="text-sm font-semibold text-foreground">
                  Status
                </div>
                <div className="mt-3">
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as TicketStatus)}
                    disabled={!canRespond}
                  >
                    <SelectTrigger className="rounded-full bg-white">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-3">
                  <Button
                    className="w-full rounded-full bg-[#4F7D7B] hover:bg-[#436d6b]"
                    onClick={closeTicket}
                    type="button"
                    disabled={!canRespond}
                  >
                    Close this ticket
                  </Button>
                </div>
              </div>

              {/* <div>
                <div className="text-sm font-semibold text-foreground">
                  Priority
                </div>
                <div className="mt-3">
                  <Select
                    value={priority}
                    onValueChange={(v) => setPriority(v as TicketPriority)}
                  >
                    <SelectTrigger className="rounded-full bg-white">
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="highest">Highest</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div> */}

              <div>
                <Label htmlFor="resp">Response</Label>
                <Textarea
                  id="resp"
                  className="mt-2"
                  value={response}
                  disabled={!canRespond}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response..."
                  rows={4}
                />
                <div className="mt-3">
                  <Button
                    className="w-full rounded-full bg-[#4F7D7B] hover:bg-[#436d6b]"
                    onClick={addResponse}
                    type="button"
                    disabled={!canRespond}
                  >
                    Add Response
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
