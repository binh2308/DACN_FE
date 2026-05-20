"use client";

import { useRef, useState } from "react";
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  RotateCcw,
  LogOut,
  X,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { notifications } from "@mantine/notifications";

import { ImageItem } from "@/lib/utils";
import type { DACN } from "@/services/DACN/typings";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AnnouncementCategory,
  getAnnouncementCategoryLabel,
  createAnnouncement,
  uploadImageForAnnouncement,
} from "@/services/DACN/announcement";

const announceSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề").max(500),
  content: z
    .string()
    .min(5, "Vui lòng nhập nội dung (tối thiểu 5 ký tự)")
    .max(500),
  category: z.enum(["GENERAL", "HR_UPDATE", "EVENT"]),
  pinned: z.boolean(),
});

type AnnounceFormData = z.infer<typeof announceSchema>;

type CreateAnnouncementViewProps = {
  onBack: () => void;
};

export default function CreateAnnouncementView({
  onBack,
}: CreateAnnouncementViewProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AnnounceFormData>({
    resolver: zodResolver(announceSchema),
    defaultValues: {
      category: "GENERAL",
      pinned: false,
    },
  });

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newImages = files.map((file: File) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);

    // reset input để có thể chọn lại đúng file cũ nếu cần
    e.target.value = "";
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleUploadImages = async (announcementId: string) => {
    try {
      for (const image of images) {
        await uploadImageForAnnouncement(announcementId, image);
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi upload ảnh");
    }
  };

  const onSubmit = async (data: AnnounceFormData) => {
    try {
      const payload: DACN.AnnouncementCreateDto = {
        title: data.title,
        content: data.content,
        category: data.category as AnnouncementCategory,
        pinned: data.pinned,
      };
      const res = await createAnnouncement(payload);
      const createdId = (res as { data?: { id?: string } })?.data?.id;

      if (createdId) {
        await handleUploadImages(createdId);
      }

      notifications.show({
        title: "Success",
        message: "Tạo thông báo thành công",
        color: "green",
      });

      reset();
      setImages([]);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Có lỗi khi tạo thông báo",
        color: "red",
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit, (errs) => console.log(errs))}>
        <h1 className="text-xl font-bold text-[#21252B]">Tạo thông báo</h1>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col lg:flex-row gap-6">
          {/* Left Column: Form Editor */}
          <div className="flex-1 space-y-4">
            {/* Title Input */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập tiêu đề"
                {...register("title")}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0B9F57]"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Rich Text Editor Simulation */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-[400px]">
                {/* Toolbar */}
                <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleOpenFilePicker}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <ImageIcon size={14} className="text-gray-600" />
                    </button>

                    <button
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <LinkIcon size={14} className="text-gray-600" />
                    </button>
                  </div>

                  {/* input file ẩn */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleSelectImages}
                  />
                </div>

                {/* Nội dung */}
                <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
                  {/* Preview ảnh */}
                  {images.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {images.map((img) => (
                        <div
                          key={img.id}
                          className="relative shrink-0 w-24 h-24 rounded-md overflow-hidden border border-gray-200 bg-gray-100"
                        >
                          <img
                            src={img.preview}
                            alt="Ảnh xem trước"
                            className="w-full h-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img.id)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Textarea */}
                  <textarea
                    className="flex-1 text-sm focus:outline-none resize-none"
                    placeholder="Nhập nội dung tại đây..."
                    {...register("content")}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-500">
                      {errors.content.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Status/Settings */}
          <div className="w-full lg:w-64 flex flex-col gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-3 border-b border-gray-100 pb-2">
                Status
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  Danh mục <span className="text-red-500">*</span>
                </span>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-1/2 h-7 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">Chung</SelectItem>
                        <SelectItem value="HR_UPDATE">HR Updates</SelectItem>
                        <SelectItem value="EVENT">Sự kiện</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex items-center justify-between my-4">
                <span className="text-xs text-gray-600">Pin:</span>
                <Controller
                  name="pinned"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-[#0B9F57] text-white rounded font-semibold text-sm hover:bg-green-700 transition-colors"
          >
            <Save size={16} /> Tạo thông báo
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-center gap-2 px-6 py-2 bg-[#C0392B] text-white rounded font-semibold text-sm hover:bg-red-700 transition-colors"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-2 bg-[#E74C3C] text-white rounded font-semibold text-sm hover:bg-red-600 transition-colors"
          >
            <LogOut size={16} /> Thoát
          </button>
        </div>
      </form>
    </div>
  );
}
