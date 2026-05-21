import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;

  const res = await fetch(`${API_URL}/tickets/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.user.accessToken}`,
    },
  });

  return new NextResponse(null, { status: res.status });
}
