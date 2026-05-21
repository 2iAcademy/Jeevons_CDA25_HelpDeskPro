import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/organisms/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="app">
      <Sidebar user={session.user} />
      <main className="main">{children}</main>
    </div>
  );
}
