import { AuthGuard } from "@/components/auth/AuthGuard";
import { Header } from "@/components/layout/Header";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["CLIENT"]} redirectTo="/portal/login">
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header title="Portal do Cliente" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
