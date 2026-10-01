"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Tooth, ArrowRight } from "@phosphor-icons/react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=2400&q=80";

const FEATURES = [
  {
    title: "Practice operations",
    text: "Patients, appointments, charts, payments, and prescriptions in one calm workspace.",
  },
  {
    title: "Online booking embed",
    text: "Give every clinic a branded booking form they can drop onto their own website.",
  },
  {
    title: "Multi-tenant by design",
    text: "Each practice gets isolated data, team roles, and its own booking link.",
  },
];

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="min-h-screen bg-[#f4f7f7] text-slate-900">
      {/* Nav */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <Tooth weight="duotone" className="h-5 w-5" />
            </span>
            <span className="font-heading text-2xl tracking-tight">My Dental Clinic</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-900 transition hover:bg-teal-50"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-white/90 transition hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-900 transition hover:bg-teal-50"
                >
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero — one composition, full-bleed */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0 landing-hero-zoom">
          <Image
            src={HERO_IMAGE}
            alt="Bright modern dental clinic treatment room"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/55 to-teal-950/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/20" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-24">
          <div className="max-w-2xl landing-hero-copy">
            <p className="font-heading text-4xl text-white sm:text-5xl md:text-6xl tracking-tight">
              My Dental Clinic
            </p>
            <h1 className="mt-5 text-2xl font-medium leading-snug text-white/95 sm:text-3xl md:text-[2.1rem]">
              The multi-tenant platform dental practices use to run the day.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
              Scheduling, patient records, payments, and embeddable online booking — built for one clinic or many.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="group inline-flex items-center gap-2 rounded-xl bg-teal-300 px-5 py-3 text-sm font-semibold text-teal-950 transition hover:bg-teal-200"
              >
                {isLoggedIn ? "Go to dashboard" : "Create your clinic"}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              {!isLoggedIn && (
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-xl border border-white/30 bg-white/5 px-5 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Product purpose */}
      <section className="relative border-t border-teal-900/5">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">
              Built for dental teams
            </p>
            <h2 className="mt-4 max-w-3xl font-heading text-4xl tracking-tight text-slate-900 sm:text-5xl">
              Software that feels like the front desk finally got a quiet, capable system.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-12">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 100}>
                <div className="border-t border-teal-900/15 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Booking story */}
      <section className="relative overflow-hidden bg-teal-950 text-teal-50">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 60% at 10% 20%, rgba(45,212,191,0.25), transparent), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(255,255,255,0.06), transparent)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300/90">
              Patient booking
            </p>
            <h2 className="mt-4 font-heading text-4xl tracking-tight sm:text-5xl">
              Every clinic gets a booking page they can brand and embed.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-teal-100/75">
              Customize accent color, logo, and CSS. Copy one iframe. Requests land straight into the clinic schedule.
            </p>
            <Link
              href={isLoggedIn ? "/dashboard/booking-embed" : "/register"}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-teal-200 transition hover:text-white"
            >
              See booking embed
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white p-5 text-slate-900 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                  <Tooth weight="duotone" className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-heading text-xl leading-none">Bright Smile Dental</p>
                  <p className="mt-1 text-xs text-slate-500">Online booking</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-500">First name</div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-500">Last name</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["09:00", "09:30", "10:00"].map((slot, i) => (
                    <div
                      key={slot}
                      className={`rounded-xl px-2 py-2 text-center text-xs font-medium ${
                        i === 1 ? "bg-teal-800 text-white" : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-teal-800 px-3 py-2.5 text-center text-sm font-semibold text-white">
                  Request appointment
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">
            How it works
          </p>
          <h2 className="mt-4 max-w-2xl font-heading text-4xl tracking-tight sm:text-5xl">
            Live in minutes, not months.
          </h2>
        </Reveal>
        <ol className="mt-14 space-y-0">
          {[
            {
              step: "01",
              title: "Register your clinic",
              text: "Create a tenant workspace for your practice and invite your team.",
            },
            {
              step: "02",
              title: "Run the front desk",
              text: "Manage patients, appointments, charts, and payments from one dashboard.",
            },
            {
              step: "03",
              title: "Publish booking",
              text: "Share a link or embed the form so patients can request visits anytime.",
            },
          ].map((item, i) => (
            <Reveal key={item.step} delay={i * 90}>
              <li className="grid gap-4 border-t border-teal-900/10 py-8 md:grid-cols-[5rem_1fr_1.2fr] md:items-baseline">
                <span className="font-heading text-3xl text-teal-800/80">{item.step}</span>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-28">
        <Reveal>
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-slate-900 px-8 py-16 text-center sm:px-16">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse 80% 80% at 50% 120%, rgba(13,115,119,0.45), transparent)",
              }}
            />
            <div className="relative">
              <h2 className="font-heading text-4xl tracking-tight text-white sm:text-5xl">
                Ready to run your practice with My Dental Clinic?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/65">
                Start with one clinic. Add dentists, embed booking, and keep every patient record in one place.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-300 px-5 py-3 text-sm font-semibold text-teal-950 transition hover:bg-teal-200"
                >
                  {isLoggedIn ? "Open dashboard" : "Start free today"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-teal-900/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2 text-slate-700">
            <Tooth weight="duotone" className="h-4 w-4 text-teal-800" />
            <span className="font-heading text-lg">My Dental Clinic</span>
          </div>
          <p>Multi-tenant dental practice software.</p>
        </div>
      </footer>
    </div>
  );
}
