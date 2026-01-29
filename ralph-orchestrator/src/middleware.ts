export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/(dashboard)/:path*", "/inbox/:path*", "/chat/:path*", "/settings/:path*", "/projects/:path*"],
};
