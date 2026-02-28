import { NextRequest, NextResponse } from 'next/server';

function isPublicPath(pathname: string) {
  return pathname === '/login' || pathname.startsWith('/api/auth/login');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const raw = req.cookies.get('deckible_session')?.value;

  if (pathname.startsWith('/api/')) {
    if (!raw) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!raw) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
