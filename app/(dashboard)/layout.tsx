// file: app/(dashboard)/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
      <Nav user={session.user} />
      <main style={{ paddingLeft: "220px", paddingTop: "0", minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
