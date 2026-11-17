import { PlatformHeader } from "@/components/platform-header";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <><PlatformHeader />{children}</>;
}
