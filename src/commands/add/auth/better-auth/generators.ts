import type { DBType, ORMType } from "../../../../types.js";
import type { AuthProvider } from "../shared/providers.js";

export interface BetterAuthGeneratorContext {
  authClientImport: string;
  authSchemaImport: string;
  authServerImport: string;
  dbImport: string;
  driver: DBType;
  orm: ORMType;
  providers: AuthProvider[];
}

const prismaProvider: Record<DBType, string> = {
  mysql: "mysql",
  pg: "postgresql",
  sqlite: "sqlite",
};

const generateSocialProviders = (providers: AuthProvider[]) => {
  if (providers.length === 0) {
    return "";
  }
  const entries = providers.map(
    (provider) => `    ${provider}: {
      clientId: process.env.${provider.toUpperCase()}_CLIENT_ID ?? "",
      clientSecret: process.env.${provider.toUpperCase()}_CLIENT_SECRET ?? "",
    }`
  );
  return `\n  socialProviders: {\n${entries.join(",\n")}\n  },`;
};

export const generateBetterAuthServer = (
  context: BetterAuthGeneratorContext
) => {
  const database =
    context.orm === "drizzle"
      ? `drizzleAdapter(db, {
    provider: "${context.driver}",
    schema: authSchema,
  })`
      : `prismaAdapter(db, { provider: "${prismaProvider[context.driver]}" })`;
  const adapterImport =
    context.orm === "drizzle"
      ? 'import { drizzleAdapter } from "better-auth/adapters/drizzle";'
      : 'import { prismaAdapter } from "better-auth/adapters/prisma";';
  const schemaImport =
    context.orm === "drizzle"
      ? `\nimport * as authSchema from "${context.authSchemaImport}";`
      : "";

  return `import { betterAuth } from "better-auth";
${adapterImport}
import { nextCookies } from "better-auth/next-js";
import { db } from "${context.dbImport}";
${schemaImport}

export const auth = betterAuth({
  appName: "Kirimase App",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: ${database},
  emailAndPassword: {
    enabled: true,
  },${generateSocialProviders(context.providers)}
  plugins: [nextCookies()],
});
`;
};

export const generateBetterAuthClient = () => `"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
export const { signIn, signOut, signUp, useSession } = authClient;
`;

export const generateBetterAuthRoute = (authServerImport: string) =>
  `import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "${authServerImport}";

export const { GET, POST } = toNextJsHandler(auth);
`;

export const generateBetterAuthUtils = (authServerImport: string) =>
  `import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "${authServerImport}";

export type AuthSession = {
  session: {
    user: {
      id: string;
      name?: string;
      email?: string;
      username?: string;
    };
  } | null;
};

export const getUserAuth = async (): Promise<AuthSession> => {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return { session: null };
  return {
    session: {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        username: result.user.name,
      },
    },
  };
};

export const checkAuth = async () => {
  const { session } = await getUserAuth();
  if (!session) redirect("/sign-in");
  return session;
};
`;

const generateSocialButtons = (providers: AuthProvider[]) =>
  providers
    .map(
      (provider) => `        <button
          type="button"
          onClick={() => authClient.signIn.social({ provider: "${provider}", callbackURL: "/dashboard" })}
        >
          Continue with ${provider[0].toUpperCase()}${provider.slice(1)}
        </button>`
    )
    .join("\n");

export const generateSignInPage = (
  authClientImport: string,
  providers: AuthProvider[]
) => `"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "${authClientImport}";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      callbackURL: "/dashboard",
    });
    if (result.error) setError(result.error.message ?? "Unable to sign in");
    else router.push("/dashboard");
  };

  return (
    <main>
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" autoComplete="email" required />
        <input name="password" type="password" autoComplete="current-password" required />
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit">Sign in</button>
      </form>
${generateSocialButtons(providers)}
      <Link href="/sign-up">Create an account</Link>
    </main>
  );
}
`;

export const generateSignUpPage = (authClientImport: string) => `"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "${authClientImport}";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await authClient.signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
      callbackURL: "/dashboard",
    });
    if (result.error) setError(result.error.message ?? "Unable to sign up");
    else router.push("/dashboard");
  };

  return (
    <main>
      <h1>Create an account</h1>
      <form onSubmit={handleSubmit}>
        <input name="name" autoComplete="name" required />
        <input name="email" type="email" autoComplete="email" required />
        <input name="password" type="password" autoComplete="new-password" minLength={8} required />
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit">Sign up</button>
      </form>
      <Link href="/sign-in">Already have an account?</Link>
    </main>
  );
}
`;

export const generateSignOutButton = (authClientImport: string) =>
  `"use client";

import { useRouter } from "next/navigation";
import { authClient } from "${authClientImport}";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.push("/sign-in");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
`;

export const generateUpdateProfile = (authClientImport: string) =>
  `"use client";

import { FormEvent, useState } from "react";
import { authClient } from "${authClientImport}";

export function UpdateProfile() {
  const { data: session } = authClient.useSession();
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await authClient.updateUser({ name: String(form.get("name")) });
    setMessage(result.error ? result.error.message ?? "Update failed" : "Profile updated");
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="name">Display name</label>
      <input id="name" name="name" defaultValue={session?.user.name ?? ""} required />
      <button type="submit">Update profile</button>
      {message ? <p aria-live="polite">{message}</p> : null}
    </form>
  );
}
`;

export const generateBetterAuthAccountPage = (
  updateProfileImport: string,
  signOutImport: string
) => `import { SignOutButton } from "${signOutImport}";
import { UpdateProfile } from "${updateProfileImport}";

export default function AccountPage() {
  return (
    <main>
      <h1>Account</h1>
      <UpdateProfile />
      <SignOutButton />
    </main>
  );
}
`;

export const generateEmptyDrizzleAuthSchema = () =>
  "// Generated by the Better Auth CLI after dependencies are installed.\nexport {};\n";
