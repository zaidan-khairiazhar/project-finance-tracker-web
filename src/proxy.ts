import { NextResponse, type NextRequest } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/session';

const AUTH_PAGES = ['/login', '/register'];

/** Guard rute (Next 16: `proxy.ts` menggantikan `middleware.ts`). Hanya cek ada/tidaknya cookie; keabsahan token dicek API. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = request.cookies.has(TOKEN_COOKIE);
  const isAuthPage = AUTH_PAGES.includes(pathname);

  const redirect = (to: string) => NextResponse.redirect(new URL(to, request.url));

  if (pathname === '/') return redirect(signedIn ? '/dashboard' : '/login');
  if (isAuthPage && signedIn) return redirect('/dashboard');
  if (!isAuthPage && !signedIn) return redirect('/login');

  return NextResponse.next();
}

export const config = {
  // Lewati API, aset Next, dan file statis.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
