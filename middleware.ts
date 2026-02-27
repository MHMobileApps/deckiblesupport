import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export function middleware(req: NextRequest) {
  if (PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const authCookie = req.cookies.get('deckible_session');
  if (!authCookie) {
    const url = new URL('/login', req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
