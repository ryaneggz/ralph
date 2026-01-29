import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [],
  // TODO: Configure MongoDB adapter and providers in US-01
});
