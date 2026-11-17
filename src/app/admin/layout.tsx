import { PlatformHeader } from "@/components/platform-header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <><PlatformHeader />{children}</>;
}
