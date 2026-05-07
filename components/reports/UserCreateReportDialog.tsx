"use client";

import * as React from "react";
import { Calendar, Send } from "lucide-react";
import { notifications } from "@mantine/notifications";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createReport } from "@/services/DACN/report";
import type { DACN } from "@/services/DACN/typings";

const reportSchema = z.object({
  week_starting: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Vui lòng chọn ngày bắt đầu tuần"),
  progress_percentage: z.number().min(1, "Tiến độ là bắt buộc").max(100),
  accomplishment: z
    .string()
    .min(10, "Công việc đã hoàn thành là bắt buộc")
    .max(500),
  in_progress: z
    .string()
    .min(10, "Công việc đang thực hiện là bắt buộc")
    .max(500),
  plan: z.string().min(10, "Kế hoạch là bắt buộc").max(500),
  blocker: z.string().max(500),
  progress_notes: z.string().max(500),
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function UserCreateReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  });

  const onSubmit = async (data: ReportFormData) => {
    const newReport: DACN.CreateReportRequestDto = {
      week_starting: data.week_starting,
      accomplishment: data.accomplishment,
      in_progress: data.in_progress,
      plan: data.plan,
      blocker: data.blocker,
      progress_percentage: data.progress_percentage,
      progress_notes: data.progress_notes,
    };

    try {
      await createReport(newReport);
      notifications.show({
        title: "Đã nộp báo cáo",
        message: "Báo cáo hàng tuần của bạn đã được nộp thành công.",
        color: "green",
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      notifications.show({
        title: "Nộp báo cáo thất bại",
        message:
          "Đã có lỗi xảy ra trong quá trình nộp báo cáo. Vui lòng thử lại.",
        color: "red",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle>NỘP BÁO CÁO HÀNG TUẦN</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-2">
            <div>
              <Label>
                Ngày bắt đầu tuần <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="week_starting"
                render={({ field }) => (
                  <div className="relative group mt-1">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-[#4F7D7B] transition-colors" />
                    <Input
                      type="date"
                      value={typeof field.value === "string" ? field.value : ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="bg-white pl-9 cursor-pointer hover:border-[#4F7D7B] transition-colors"
                      required
                    />
                  </div>
                )}
              />
              {errors.week_starting && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.week_starting.message}
                </p>
              )}
            </div>

            <div>
              <Label>
                Tiến độ (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                {...register("progress_percentage", {
                  valueAsNumber: true,
                })}
                min={0}
                max={100}
                className="mt-1 bg-white"
              />
              {errors.progress_percentage && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.progress_percentage.message}
                </p>
              )}
            </div>

            <div>
              <Label>
                Công việc đã hoàn thành <span className="text-red-500">*</span>
              </Label>
              <Textarea
                className="mt-1"
                {...register("accomplishment")}
                rows={5}
                placeholder="Việc đã hoàn thành..."
              />
              {errors.accomplishment && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.accomplishment.message}
                </p>
              )}
            </div>
            <div>
              <Label>
                Công việc đang thực hiện <span className="text-red-500">*</span>
              </Label>
              <Textarea
                {...register("in_progress")}
                className="mt-1"
                rows={5}
                placeholder="Việc đang thực hiện..."
              />
              {errors.in_progress && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.in_progress.message}
                </p>
              )}
            </div>
            <div>
              <Label>
                Kế hoạch tuần tới <span className="text-red-500">*</span>
              </Label>
              <Textarea
                {...register("plan")}
                className="mt-1"
                rows={5}
                placeholder="Kế hoạch tuần tới..."
              />
              {errors.plan && (
                <p className="mt-1 text-sm text-red-500">{errors.plan.message}</p>
              )}
            </div>
            <div>
              <Label>Khó khăn / Vướng mắc</Label>
              <Textarea
                {...register("blocker")}
                className="mt-1"
                rows={5}
                placeholder="Vướng mắc / rủi ro..."
              />
              {errors.blocker && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.blocker.message}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <Label>Ghi chú tiến độ</Label>
              <Input
                {...register("progress_notes")}
                className="mt-1"
                placeholder="Ghi chú"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Hủy
            </Button>
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" />
              Nộp báo cáo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
