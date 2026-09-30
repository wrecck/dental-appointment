"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpinnerGap, Tooth } from "@phosphor-icons/react";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const data = {
      clinicName: formData.get("clinicName") as string,
      clinicEmail: formData.get("clinicEmail") as string,
      clinicPhone: formData.get("clinicPhone") as string,
      ownerName: formData.get("ownerName") as string,
      ownerEmail: formData.get("ownerEmail") as string,
      password: formData.get("password") as string,
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-800 text-teal-50 flex items-center justify-center shadow-sm">
            <Tooth weight="duotone" className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-4xl tracking-tight">Register your clinic</h1>
          <p className="text-muted-foreground text-sm">Create your multi-tenant practice account</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-black/5 bg-white/80 backdrop-blur p-6 shadow-sm space-y-5"
        >
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{error}</div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Clinic
            </p>
            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic name</Label>
              <Input id="clinicName" name="clinicName" required disabled={isLoading} className="h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="clinicEmail">Clinic email</Label>
                <Input id="clinicEmail" name="clinicEmail" type="email" required disabled={isLoading} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicPhone">Phone</Label>
                <Input id="clinicPhone" name="clinicPhone" disabled={isLoading} className="h-11 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Owner account
            </p>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Your name</Label>
              <Input id="ownerName" name="ownerName" required disabled={isLoading} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Your email</Label>
              <Input id="ownerEmail" name="ownerEmail" type="email" required disabled={isLoading} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" minLength={8} required disabled={isLoading} className="h-11 rounded-xl" />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-teal-800 hover:bg-teal-700"
            disabled={isLoading}
          >
            {isLoading && <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />}
            Create clinic
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-teal-800 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
