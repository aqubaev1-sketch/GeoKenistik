import { PlatformHeader } from "@/components/platform-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <><PlatformHeader />{children}</>;
}
