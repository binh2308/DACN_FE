import { Geist, Geist_Mono } from "next/font/google";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

import { mantineHtmlProps, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
export const metadata = {
  title: "Hệ thống hỗ trợ nhân viên",
  description: "Giao diện hệ thống hỗ trợ nhân viên",
  icons: {
    icon: "/BKOPs_Logo.png",
  },
};
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
//const queryClient = new QueryClient();
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" {...mantineHtmlProps}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MantineProvider>
          <Notifications position="bottom-right" />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
