import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../_middleware/auth';

export async function GET(request: NextRequest) {
  const result = await requireAuth(request);

  if (!result.authorized) {
    return result.error;
  }

  const user = result.user!;

  return NextResponse.json({
    name: user.name,
    role: user.role,
    email: user.sub,
  });
}