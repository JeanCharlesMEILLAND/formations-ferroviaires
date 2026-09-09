import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24h

/** Secret de signature de session : obligatoire, aucune valeur de repli (incident de sécurité de septembre 2026). */
function getSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 16) throw new Error("ADMIN_SECRET manquant ou trop court");
  return secret;
}

function generateToken(password: string): string {
  return createHash("sha256").update(`${password}:${getSecret()}`).digest("hex");
}

/** Comparaison à temps constant (évite de deviner un secret caractère par caractère). */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
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
    return safeEqual(session.value, getExpectedToken());
  } catch {
    return false;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
}

// Limitation des tentatives de connexion : 5 échecs par adresse, puis 15 minutes d'attente.
// Mémoire de l'instance (serverless) : protection partielle mais suffisante contre la force brute simple.
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export function isLocked(ip: string): number {
  const a = attempts.get(ip);
  if (!a) return 0;
  if (a.until > Date.now()) return Math.ceil((a.until - Date.now()) / 1000);
  if (a.until) attempts.delete(ip);
  return 0;
}

function recordFailure(ip: string) {
  const a = attempts.get(ip) ?? { count: 0, until: 0 };
  a.count += 1;
  if (a.count >= MAX_ATTEMPTS) { a.until = Date.now() + LOCK_MS; a.count = 0; }
  attempts.set(ip, a);
}

export function loginResponse(password: string, ip = "inconnue"): NextResponse {
  const locked = isLocked(ip);
  if (locked > 0) {
    return NextResponse.json({ error: `Trop de tentatives. Réessayez dans ${Math.ceil(locked / 60)} min.` }, { status: 429 });
  }
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string" || !safeEqual(password, expected)) {
    recordFailure(ip);
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }
  attempts.delete(ip);

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
