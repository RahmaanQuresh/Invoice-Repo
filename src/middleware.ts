import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as unknown as { role?: string })?.role;
  const isApiRoute = nextUrl.pathname.startsWith("/api/");
  const isAuthRoute = nextUrl.pathname.startsWith("/auth/");
  const isAppRoute = nextUrl.pathname.startsWith("/app/");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isShareRoute = nextUrl.pathname.startsWith("/api/share/");
  const isWebhookRoute = nextUrl.pathname.startsWith("/api/webhooks/");
  const isOnboardingRoute = nextUrl.pathname === "/onboarding";
  const isPublicRoute =
    nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/invoice/");

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Allow webhooks (unauthenticated by design)
  if (isWebhookRoute) {
    return NextResponse.next();
  }

  // Allow share API (public by design)
  if (isShareRoute) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    return Response.redirect(new URL("/app/dashboard", nextUrl));
  }

  // Redirect authenticated users away from onboarding if already onboarded
  if (isLoggedIn && isOnboardingRoute) {
    // Allow access to onboarding - user can be redirected later
    return NextResponse.next();
  }

  // Require authentication for app routes and API routes
  if (!isLoggedIn && (isAppRoute || isApiRoute || isAdminRoute)) {
    const signInUrl = new URL("/auth/signin", nextUrl);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return Response.redirect(signInUrl);
  }

  // Admin route protection
  if (isAdminRoute && userRole !== "admin") {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied. Admin role required." },
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    return Response.redirect(new URL("/app/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|logo.svg).*)"],
};
