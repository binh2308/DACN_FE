
import { Button } from "@/components/ui/button";
import { Check, ChevronRight } from "lucide-react";

export default function Index() {
  return (
      <div className="p-4 space-y-5">
        <section>
          <h2 className="text-base font-semibold text-grey-900 mb-2">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Apply for Leave",
              "KPI Goals",
              "Take Appraisal",
              "View Payslip",
              "Update Profile",
              "Events",
            ].map((action) => (
              <Button
                key={action}
                variant="outline"
                className="bg-white rounded-full px-4 py-1 h-auto text-xs font-normal text-grey-900 border-grey-50 hover:bg-neutral-background"
              >
                {action}
              </Button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:h-60">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-grey-50">
            <h3 className="text-lg font-semibold text-grey-900 mb-3">
              Available Leave Days
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-grey-900">Annual Leave</span>
                  <span className="text-sm text-muted-foreground">
                    10 of 60 day(s)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-bar rounded-full overflow-hidden">
                  <div
                    className="h-full bg-main-600 rounded-full"
                    style={{ width: "16.67%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-grey-900">Sick Leave</span>
                  <span className="text-sm text-muted-foreground">
                    0 of 10 day(s)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-bar rounded-full overflow-hidden">
                  <div
                    className="h-full bg-main-600 rounded-full"
                    style={{ width: "0%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-grey-900">
                    Compassionate Leave
                  </span>
                  <span className="text-sm text-muted-foreground">
                    5 of 15 day(s)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-bar rounded-full overflow-hidden">
                  <div
                    className="h-full bg-main-600 rounded-full"
                    style={{ width: "33.33%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-grey-50">
            <h3 className="text-lg font-semibold text-grey-900 mb-3">To-dos</h3>
            <div className="space-y-3">
              {[
                {
                  label: "Complete Onboarding Document Upload",
                  completed: true,
                },
                {
                  label: "Follow up on clients via documents",
                  completed: false,
                },
                { label: "Design wireframes for LMS", completed: false },
                {
                  label: "Create case study for next IT project",
                  completed: false,
                },
                {
                  label: "Follow up on clients via documents",
                  completed: false,
                },
              ].map((todo, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      todo.completed
                        ? "bg-main-600 border-main-600"
                        : "border-grey-50 group-hover:border-main-600"
                    }`}
                  >
                    {todo.completed && (
                      <Check className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm flex-1 ${
                      todo.completed
                        ? "line-through text-muted-foreground"
                        : "text-grey-900"
                    }`}
                  >
                    {todo.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:h-60">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-grey-50">
            <h3 className="text-lg font-semibold text-grey-900 mb-2">
              Announcement(s)
            </h3>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {[
                {
                  title: "Welcome aarons - We have a new staff joining us",
                  type: "welcome",
                },
                {
                  title:
                    "Semiforth for Project Manager : Kindly gather at the meeting hall",
                  description:
                    "We are holding a farewell gathering for our Project Manager: Daniel Lopez, to thank him for his work and dedication.",
                  type: "event",
                  highlighted: true,
                },
                {
                  title: "Marriage Alert",
                  type: "alert",
                },
                {
                  title: "Office Space Update",
                  type: "update",
                },
              ].map((announcement, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border transition-colors hover:border-main-600 cursor-pointer ${
                    announcement.highlighted
                      ? "bg-main-50 border-main-600"
                      : "bg-white border-grey-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-grey-900 font-medium line-clamp-2">
                        {announcement.title}
                      </p>
                      {announcement.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {announcement.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-grey-50">
            <h3 className="text-lg font-semibold text-grey-900 mb-2">
              April Pay Slip Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-grey-50">
                    <th className="text-left py-2 px-2 font-medium text-grey-900">
                      Earnings
                    </th>
                    <th className="text-right py-2 px-2 font-medium text-grey-900">
                      Amount
                    </th>
                    <th className="text-right py-2 px-2 font-medium text-grey-900">
                      Deductions
                    </th>
                    <th className="text-right py-2 px-2 font-medium text-grey-900">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-grey-50 bg-neutral-background">
                    <td className="py-2 px-2 text-grey-900">Basic Wage</td>
                    <td className="py-2 px-2 text-grey-900 text-right">
                      150,000
                    </td>
                    <td className="py-2 px-2 text-grey-900 text-right">
                      -50,000
                    </td>
                    <td className="py-2 px-2 text-grey-900 text-right">
                      120,000
                    </td>
                  </tr>
                  <tr className="border-b border-grey-50">
                    <td className="py-2 px-2 text-grey-900">Tax</td>
                    <td className="py-2 px-2 text-grey-900 text-right">
                      15,000
                    </td>
                    <td className="py-2 px-2 text-grey-900 text-right">
                      -5,000
                    </td>
                    <td className="py-2 px-2 text-grey-900 text-right">
                      12,000
                    </td>
                  </tr>
                  <tr className="border-b border-grey-50 bg-neutral-background">
                    <td className="py-2 px-2 text-grey-900">Pension</td>
                    <td className="py-2 px-2 text-grey-900 text-right">
                      15,000
                    </td>
                    <td className="py-2 px-2 text-grey-900 text-right">
                      -5,000
                    </td>
                    <td className="py-2 px-2 text-grey-900 text-right">
                      12,000
                    </td>
                  </tr>
                  <tr className="bg-main-50">
                    <td className="py-2 px-2 font-semibold text-grey-900">
                      Total Earning
                    </td>
                    <td className="py-2 px-2 font-semibold text-grey-900 text-right">
                      150,000
                    </td>
                    <td className="py-2 px-2 font-semibold text-grey-900 text-right">
                      -50,000
                    </td>
                    <td className="py-2 px-2 font-semibold text-grey-900 text-right">
                      114,000
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
  );
}
