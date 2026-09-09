import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorizedResponse } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyAuth()) return unauthorizedResponse();
  const status = new URL(request.url).searchParams.get("status") || undefined;
  const [messages, pending] = await Promise.all([
    prisma.contactMessage.findMany({ where: status ? { status } : undefined, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.contactMessage.count({ where: { status: "new" } }),
  ]);
  return NextResponse.json({ messages, pending });
}

export async function PATCH(request: NextRequest) {
  if (!verifyAuth()) return unauthorizedResponse();
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const status = body.status === "handled" ? "handled" : "new";
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  const row = await prisma.contactMessage.update({ where: { id }, data: { status, handledAt: status === "handled" ? new Date() : null } });
  return NextResponse.json(row);
}

export async function DELETE(request: NextRequest) {
  if (!verifyAuth()) return unauthorizedResponse();
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  await prisma.contactMessage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
