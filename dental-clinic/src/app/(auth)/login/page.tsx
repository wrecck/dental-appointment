"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpinnerGap, Tooth } from "@phosphor-icons/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(() => {
    const authError = searchParams.get("error");
    if (!authError) return "";
    if (authError === "Configuration") {
      return "Auth is misconfigured. Check AUTH_SECRET and AUTH_URL on Vercel.";
    }
    return "Sign-in failed. Please try again.";
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError(
          result.error === "Configuration"
            ? "Auth is misconfigured. Check AUTH_SECRET and AUTH_URL on Vercel."
            : "Invalid email or password"
        );
        setIsLoading(false);
        return;
      }

      router.push(result?.url || "/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-800 text-teal-50 flex items-center justify-center shadow-sm">
            <Tooth weight="duotone" className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-4xl tracking-tight">Dental Clinic</h1>
          <p className="text-muted-foreground text-sm">Sign in to your clinic dashboard</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-black/5 bg-white/80 backdrop-blur p-6 shadow-sm space-y-4"
        >
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="doctor@clinic.com"
              required
              disabled={isLoading}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isLoading}
              className="h-11 rounded-xl"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-teal-800 hover:bg-teal-700"
            disabled={isLoading}
          >
            {isLoading && <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
          <p className="text-sm text-center text-muted-foreground pt-1">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-teal-800 hover:underline font-medium">
              Register your clinic
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <SpinnerGap className="h-6 w-6 animate-spin text-teal-700" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
