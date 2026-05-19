"use client";

import { RefreshCw, X } from "lucide-react";
import {
  Button as MantineButton,
  Select as MantineSelect,
  TextInput,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";

import { createSupportTicket } from "@/services/DACN/Tickets";

type TicketCreateValue = {
  category_id: string;
  title: string;
  description: string;
};

export default function TicketCreateModal({
  categoryData,
  onClose,
}: {
  categoryData: Array<{ value: string; label: string }>;
  onClose: () => void;
}) {
  const form = useForm<TicketCreateValue>({
    initialValues: {
      category_id: "",
      title: "",
      description: "",
    },

    validate: {
      category_id: (value) =>
        value.length < 1 ? "Vui lòng chọn loại yêu cầu" : null,
      title: (value) =>
        value.trim().length < 3 ? "Vui lòng nhập tiêu đề" : null,
      description: (value) =>
        value.trim().length < 3 ? "Vui lòng nhập mô tả vấn đề" : null,
    },
  });

  const handleSubmit = async (values: TicketCreateValue) => {
    try {
      await createSupportTicket({
        title: values.title,
        description: values.description,
        category_id: values.category_id,
      });

      notifications.show({
        title: "Thành công",
        message: "Tạo yêu cầu hỗ trợ thành công",
        color: "green",
      });
      form.reset();
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header Modal */}
        <div className="p-6 pb-2">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <RefreshCw size={32} className="text-gray-800" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Tạo yêu cầu hỗ trợ
              </h2>
              <p className="text-sm text-gray-500">
                Điền thông tin để tạo yêu cầu hỗ trợ mới.
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto text-gray-400 hover:text-gray-600"
              type="button"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-4">
          <div className="p-6 space-y-4">
            <div>
              <MantineSelect
                data={categoryData}
                label="Loại yêu cầu"
                placeholder="Chọn loại yêu cầu"
                {...form.getInputProps("category_id")}
              />
            </div>

            <div>
              <TextInput
                label="Tiêu đề"
                labelProps={{
                  className: "block text-sm font-medium text-gray-600 mb-1",
                }}
                required
                placeholder="Nhập tiêu đề"
                {...form.getInputProps("title")}
              />
            </div>

            <div>
              <Textarea
                rows={3}
                label="Mô tả"
                labelProps={{
                  className: "block text-sm font-medium text-gray-600 mb-1",
                }}
                placeholder="Mô tả chi tiết"
                {...form.getInputProps("description")}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="px-6 py-3 pt-0">
            <MantineButton fullWidth color="green.7" type="submit" h={45} fw={600}>
              Tạo
            </MantineButton>
          </div>
        </form>
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full border border-red-500 text-red-500 font-semibold py-2.5 rounded hover:bg-red-50 transition-colors"
            type="button"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
