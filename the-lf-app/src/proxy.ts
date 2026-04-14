import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import type { Database } from "~/types/database";

// Unauthenticated access allowed
const PUBLIC_PATHS = ["/login", "/auth/callback"];

// Authenticated but not-yet-onboarded access allowed
const ONBOARDING_PATHS = ["/onboarding"];

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Unauthenticated ──────────────────────────────────────────────────────────
  if (!user) {
    if (
      matchesPath(pathname, PUBLIC_PATHS) ||
      pathname.startsWith("/api/auth/")
    ) {
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ── Authenticated ────────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const onboardingComplete = profile?.onboarding_complete ?? false;

  // /login → send to correct post-auth destination
  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = onboardingComplete ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(url);
  }

  // Not onboarded → force to /onboarding (unless already there or on public path)
  if (
    !onboardingComplete &&
    !matchesPath(pathname, ONBOARDING_PATHS) &&
    !matchesPath(pathname, PUBLIC_PATHS) &&
    !pathname.startsWith("/api/auth/")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  // Already onboarded, trying to revisit /onboarding → /dashboard
  if (onboardingComplete && matchesPath(pathname, ONBOARDING_PATHS)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
