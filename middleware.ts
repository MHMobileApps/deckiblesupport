import { NextRequest, NextResponse } from 'next/server';

export function middleware(_req: NextRequest) {
  // Temporary bypass requested for preview/testing environments.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
