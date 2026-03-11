import { NextRequest } from "next/server";
import { verifyAuth, loginResponse, logoutResponse, unauthorizedResponse } from "@/lib/admin-auth";

// Check session
export async function GET() {
  if (verifyAuth()) {
    return Response.json({ authenticated: true });
  }
  return unauthorizedResponse();
}

// Login
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    return loginResponse(password);
  } catch {
    return unauthorizedResponse();
  }
}

// Logout
export async function DELETE() {
  return logoutResponse();
}
