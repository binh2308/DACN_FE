"use client";

import { Button, Card, Text } from "@mantine/core";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-sky-400 to-sky-600 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl"
      >
        <Card
          shadow="xl"
          radius="lg"
          withBorder
          className="bg-white p-8 space-y-6"
        >
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-sky-600">
              Welcome to Your Management System
            </h1>
            <Text size="lg" className="text-gray-600">
              Quản lý tài liệu, yêu cầu phê duyệt và nhiều hơn nữa.
            </Text>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <h2 className="text-xl font-semibold mb-2">📄 Document Management</h2>
              <p className="text-gray-600 text-sm mb-4">
                Upload, tìm kiếm và quản lý tài liệu nội bộ.
              </p>
              <Link href="/documents">
                <Button fullWidth color="blue">Go</Button>
              </Link>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <h2 className="text-xl font-semibold mb-2">✅ Approval Workflow</h2>
              <p className="text-gray-600 text-sm mb-4">
                Tạo đơn nghỉ phép, đặt phòng VIP và theo dõi trạng thái duyệt.
              </p>
              <Link href="/approvals">
                <Button fullWidth color="green">Go</Button>
              </Link>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <h2 className="text-xl font-semibold mb-2">👤 Profile</h2>
              <p className="text-gray-600 text-sm mb-4">
                Xem thông tin cá nhân và quản lý tài khoản.
              </p>
              <Link href="/profile">
                <Button fullWidth color="violet">Go</Button>
              </Link>
            </Card>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
