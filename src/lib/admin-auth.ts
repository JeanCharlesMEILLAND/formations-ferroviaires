import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

const COOKIE_NAME = "admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24h

function generateToken(password: string): string {
  const secret = process.env.ADMIN_SECRET || "formations-ferroviaires-2024";
  return createHash("sha256").update(`${password}:${secret}`).digest("hex");
}

export function getExpectedToken(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD not set");
  return generateToken(password);
}

export function verifyAuth(): boolean {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get(COOKIE_NAME);
    if (!session) return false;
    return session.value === getExpectedToken();
  } catch {
    return false;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
}

export function loginResponse(password: string): NextResponse {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const token = generateToken(password);
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });
  return response;
}

export function logoutResponse(): NextResponse {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
