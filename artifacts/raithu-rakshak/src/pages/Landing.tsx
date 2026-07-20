import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  CloudLightning,
  Zap,
  MapPin,
  Users,
  AlertTriangle,
  BarChart3,
  Globe,
  Clock,
  ChevronDown,
  Shield,
  Activity,
  Brain,
  Radio,
  CheckCircle2,
  ArrowRight,
  Quote,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   ANIMATION HELPERS
   ══════════════════════════════════════════════════════════════════════════ */

type Direction = "up" | "left" | "right";

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
}) {
  const { ref, visible } = useInView();
  const offsets: Record<Direction, string> = {
    up: "translateY(32px)",
    left: "translateX(-32px)",
    right: "translateX(32px)",
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0,0)" : offsets[direction],
        transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   DECORATIVE SVG ILLUSTRATIONS
   ══════════════════════════════════════════════════════════════════════════ */

/** Subtle wheat stalk silhouette — used as a background accent */
function WheatIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Stem */}
      <line x1="60" y1="220" x2="60" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Grain clusters */}
      {[30, 55, 80, 105, 130, 155].map((y, i) => (
        <g key={y}>
          <ellipse cx={60 - (i % 2 === 0 ? 18 : 0)} cy={y} rx="10" ry="16" fill="currentColor" opacity="0.9" transform={`rotate(${i % 2 === 0 ? -25 : 25} 60 ${y})`} />
          {i % 2 !== 0 && <ellipse cx={60 + 18} cy={y} rx="10" ry="16" fill="currentColor" opacity="0.9" transform={`rotate(25 60 ${y})`} />}
        </g>
      ))}
    </svg>
  );
}

/** Raindrop cluster for weather atmosphere */
function RainIllustration({ className = "" }: { className?: string }) {
  const drops = [
    { x: 10, y: 0 }, { x: 35, y: 15 }, { x: 60, y: 5 },
    { x: 85, y: 20 }, { x: 20, y: 40 }, { x: 50, y: 50 },
    { x: 75, y: 38 }, { x: 5, y: 60 }, { x: 95, y: 55 },
  ];
  return (
    <svg viewBox="0 0 110 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {drops.map((d, i) => (
        <ellipse key={i} cx={d.x} cy={d.y} rx="2.5" ry="5" fill="currentColor" opacity="0.6 " transform={`rotate(-15 ${d.x} ${d.y})`} />
      ))}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════════════════════ */

const features = [
  {
    icon: CloudLightning,
    title: "Live Weather Monitoring",
    description:
      "Real-time weather data per district — temperature, humidity, wind speed, and lightning risk updated every 30 minutes via OpenWeather API.",
    color: "text-sky-600",
    iconBg: "bg-sky-100",
    border: "border-sky-100 hover:border-sky-300",
    shadow: "hover:shadow-sky-100",
  },
  {
    icon: Zap,
    title: "Lightning Risk Prediction",
    description:
      "District-level lightning risk warnings with severity levels (Low → Critical) issued and tracked for rapid field response.",
    color: "text-amber-600",
    iconBg: "bg-amber-100",
    border: "border-amber-100 hover:border-amber-300",
    shadow: "hover:shadow-amber-100",
  },
  {
    icon: Brain,
    title: "AI Risk Engine",
    description:
      "AI-driven composite risk scoring for every registered farmer, factoring weather conditions, location exposure, and historical alerts.",
    color: "text-purple-600",
    iconBg: "bg-purple-100",
    border: "border-purple-100 hover:border-purple-300",
    shadow: "hover:shadow-purple-100",
  },
  {
    icon: Clock,
    title: "Incident Timeline",
    description:
      "Chronological audit trail of all lightning alerts, emergency reports, and weather events across all registered districts.",
    color: "text-slate-600",
    iconBg: "bg-slate-100",
    border: "border-slate-100 hover:border-slate-300",
    shadow: "hover:shadow-slate-100",
  },
  {
    icon: Shield,
    title: "Family Rescue Recommendation",
    description:
      "Automated guidance for family members — actionable rescue instructions graded by urgency, delivered in English and Telugu.",
    color: "text-emerald-700",
    iconBg: "bg-emerald-100",
    border: "border-emerald-100 hover:border-emerald-300",
    shadow: "hover:shadow-emerald-100",
  },
  {
    icon: MapPin,
    title: "GPS Location Tracking",
    description:
      "Last-known GPS coordinates of every farmer surfaced on a live location board so responders can reach the field instantly.",
    color: "text-rose-600",
    iconBg: "bg-rose-100",
    border: "border-rose-100 hover:border-rose-300",
    shadow: "hover:shadow-rose-100",
  },
  {
    icon: AlertTriangle,
    title: "Emergency Alerts",
    description:
      "Report and resolve farmer emergencies — lightning strikes, medical crises, missing persons — with full status lifecycle management.",
    color: "text-orange-600",
    iconBg: "bg-orange-100",
    border: "border-orange-100 hover:border-orange-300",
    shadow: "hover:shadow-orange-100",
  },
  {
    icon: Globe,
    title: "English & Telugu Support",
    description:
      "Complete bilingual UI — switch between English and Telugu in one click so district officers and field staff can work in their language.",
    color: "text-teal-600",
    iconBg: "bg-teal-100",
    border: "border-teal-100 hover:border-teal-300",
    shadow: "hover:shadow-teal-100",
  },
];

const workflowSteps = [
  { step: "01", label: "Register Farmer", desc: "Capture Aadhaar, GPS, contact, and district details." },
  { step: "02", label: "Live Weather Monitoring", desc: "OpenWeather API feeds real-time data per district." },
  { step: "03", label: "Lightning Risk Analysis", desc: "District warnings issued with critical severity flags." },
  { step: "04", label: "AI Risk Prediction", desc: "Composite score computed from weather + location exposure." },
  { step: "05", label: "Family Rescue Recommendation", desc: "Automated, prioritised guidance sent to family contacts." },
  { step: "06", label: "Emergency Response", desc: "Authorities notified; incident logged in the timeline." },
];

const impacts = [
  { icon: Activity, title: "Faster Awareness", text: "Real-time alerts reach district officers within minutes of a weather event." },
  { icon: Users, title: "Informed Families", text: "Families receive clear, prioritised action guidance instead of guessing." },
  { icon: Radio, title: "Reduced Response Delays", text: "GPS location + incident timeline cut responder travel and decision time." },
  { icon: BarChart3, title: "Better Situational Awareness", text: "Authorities see a unified risk picture across all registered districts." },
];

/* ══════════════════════════════════════════════════════════════════════════
   SECTION LABEL  (reusable)
   ══════════════════════════════════════════════════════════════════════════ */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold text-green-700 uppercase tracking-[0.18em] mb-3">
      <span className="block w-5 h-px bg-green-400" />
      {children}
      <span className="block w-5 h-px bg-green-400" />
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */

export default function Landing() {
  function scrollSmooth(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-white font-sans antialiased overflow-x-hidden scroll-smooth">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-green-100/80 shadow-[0_1px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(142,64%,22%)] to-[hsl(142,64%,32%)] flex items-center justify-center shadow-md shadow-green-900/20">
              <CloudLightning className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-[hsl(142,64%,16%)] text-[1.05rem] tracking-tight">RaithuRakshak AI</span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-500">
            {[
              { label: "About", id: "about" },
              { label: "Features", id: "features" },
              { label: "How It Works", id: "how-it-works" },
              { label: "Impact", id: "impact" },
            ].map((n) => (
              <button
                key={n.id}
                onClick={() => scrollSmooth(n.id)}
                className="relative py-1 hover:text-green-800 transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-green-600 after:rounded-full after:transition-all after:duration-300 hover:after:w-full"
              >
                {n.label}
              </button>
            ))}
          </nav>

          <Link href="/dashboard">
            <button className="group flex items-center gap-2 bg-gradient-to-br from-[hsl(142,64%,22%)] to-[hsl(142,64%,30%)] hover:from-[hsl(142,64%,18%)] hover:to-[hsl(142,64%,26%)] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-green-900/20 hover:shadow-lg hover:shadow-green-900/25 hover:-translate-y-px">
              Open Dashboard
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(142,70%,12%)] via-[hsl(142,64%,18%)] to-[hsl(150,50%,26%)]" />

        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-400/8 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

        {/* Decorative lightning bolt — right */}
        <div className="absolute right-8 top-20 opacity-[0.12] hidden lg:block pointer-events-none">
          <Zap className="w-56 h-56 text-amber-300" strokeWidth={0.6} />
        </div>

        {/* Decorative wheat — bottom left */}
        <div className="absolute left-4 bottom-0 h-52 opacity-[0.08] hidden lg:block pointer-events-none text-amber-300">
          <WheatIllustration className="h-full" />
        </div>
        <div className="absolute left-24 bottom-0 h-40 opacity-[0.05] hidden lg:block pointer-events-none text-amber-200">
          <WheatIllustration className="h-full" />
        </div>

        {/* Decorative rain — top left */}
        <div className="absolute left-10 top-32 w-28 opacity-[0.09] hidden xl:block pointer-events-none text-sky-300">
          <RainIllustration className="w-full" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-28 pb-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/35 text-amber-300 text-xs font-bold px-4 py-2 rounded-full mb-10 backdrop-blur-sm tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Farmer Safety Platform
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-[5.25rem] font-extrabold text-white leading-[1.08] tracking-[-0.02em] mb-6">
            Raithu<span className="text-amber-400">Rakshak</span> AI
          </h1>

          {/* Sub-headline */}
          <p className="text-xl md:text-2xl text-green-100/90 font-medium mb-5 max-w-3xl mx-auto leading-relaxed">
            AI-powered Lightning Safety &amp; Emergency Response Platform for Farmers
          </p>
          <p className="text-[1.05rem] text-green-200/70 max-w-2xl mx-auto mb-12 leading-[1.8]">
            Helping farmers and their families make faster, informed decisions during lightning emergencies through
            weather intelligence, AI-driven risk prediction, and emergency guidance.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <button className="group flex items-center justify-center gap-2 bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-green-900 font-bold px-9 py-4 rounded-2xl text-[1rem] transition-all duration-200 shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-400/30 hover:-translate-y-0.5 active:translate-y-0">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </Link>
            <button
              onClick={() => scrollSmooth("about")}
              className="flex items-center justify-center gap-2 border border-white/25 hover:border-white/50 bg-white/5 hover:bg-white/12 text-white font-semibold px-9 py-4 rounded-2xl text-[1rem] transition-all duration-200 backdrop-blur-sm hover:-translate-y-0.5 active:translate-y-0"
            >
              Learn More
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { value: "8+", label: "Core Modules" },
              { value: "6", label: "Districts Covered" },
              { value: "30m", label: "Weather Refresh" },
              { value: "2", label: "Languages" },
            ].map((s) => (
              <div key={s.label} className="bg-white/8 hover:bg-white/14 backdrop-blur rounded-2xl p-5 border border-white/10 transition-colors duration-200">
                <div className="text-2xl font-extrabold text-amber-400 tracking-tight">{s.value}</div>
                <div className="text-xs text-green-300/80 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* ── Problem Statement ──────────────────────────────────────────── */}
      <section id="about" className="relative py-32 bg-white overflow-hidden">
        {/* Subtle wheat illustration – background right */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-72 opacity-[0.04] pointer-events-none text-green-700 hidden xl:block">
          <WheatIllustration className="h-full" />
        </div>

        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <FadeIn className="text-center mb-16">
            <SectionLabel>The Problem</SectionLabel>
            <h2 className="text-4xl md:text-[2.75rem] font-extrabold text-slate-900 leading-tight tracking-tight">
              Lightning is one of the leading causes of<br className="hidden md:block" />
              <span className="text-[hsl(142,64%,24%)]"> farm-field fatalities in rural India</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Problem cards */}
            <div className="space-y-4">
              {[
                { icon: "🌦️", title: "Rapidly Changing Weather", text: "Farmers often work in open fields where conditions shift from clear skies to dangerous storms within minutes, leaving little time to react." },
                { icon: "⚡", title: "Life-Threatening Lightning Strikes", text: "Lightning events in agricultural districts can become fatal within seconds — yet most farmers have no early-warning system." },
                { icon: "👨‍👩‍👧", title: "Families Left in the Dark", text: "Families frequently don't know whether the farmer is safe, where they are, or whether to call for emergency help — every minute of uncertainty matters." },
                { icon: "🏥", title: "Delayed Emergency Response", text: "Without location data or a coordinated alert system, first responders lose critical time locating affected farmers across large agricultural tracts." },
              ].map((item, i) => (
                <FadeIn key={item.title} delay={i * 80} direction="left">
                  <div className="group flex gap-5 p-6 rounded-2xl border border-slate-100 bg-slate-50/70 hover:border-green-200 hover:bg-green-50/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                    <div className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1.5 text-[0.95rem]">{item.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>

            {/* Solution card */}
            <FadeIn delay={180} direction="right">
              <div className="relative bg-gradient-to-br from-[hsl(142,64%,17%)] to-[hsl(142,55%,27%)] rounded-3xl p-9 text-white shadow-2xl shadow-green-900/30 overflow-hidden">
                {/* Decoration inside card */}
                <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none text-white">
                  <WheatIllustration className="h-40" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3.5 mb-7">
                    <div className="w-11 h-11 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Shield className="w-5 h-5 text-green-900" />
                    </div>
                    <h3 className="text-xl font-bold leading-tight">RaithuRakshak AI addresses this gap</h3>
                  </div>
                  <p className="text-green-100/90 leading-relaxed mb-7 text-[0.95rem]">
                    By combining live weather intelligence, AI-driven risk prediction, GPS tracking, and automated family rescue guidance
                    into a single, bilingual emergency management platform — purpose-built for district officers and rural emergency teams.
                  </p>
                  <div className="space-y-3.5">
                    {[
                      "Real-time district weather monitoring via OpenWeather API",
                      "Composite AI risk score per registered farmer",
                      "Automated family rescue recommendations in English & Telugu",
                      "GPS-tracked last location for instant field response",
                      "Full incident timeline for post-event analysis",
                    ].map((point) => (
                      <div key={point} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-[2px]" />
                        <span className="text-sm text-green-100/90 leading-snug">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="relative py-32 overflow-hidden" style={{ background: "hsl(142,20%,98%)" }}>
        {/* Decorative rain cluster – top right */}
        <div className="absolute top-10 right-16 w-32 opacity-[0.06] pointer-events-none text-sky-600 hidden xl:block">
          <RainIllustration className="w-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <FadeIn className="text-center mb-18">
            <SectionLabel>Platform Capabilities</SectionLabel>
            <h2 className="text-4xl md:text-[2.75rem] font-extrabold text-slate-900 leading-tight tracking-tight">
              Everything a district emergency team needs
            </h2>
            <p className="text-slate-500 mt-4 max-w-lg mx-auto text-[1rem] leading-relaxed">
              Eight tightly integrated modules covering the full lifecycle — from farmer registration to emergency resolution.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 55}>
                <div
                  className={`group relative rounded-2xl border bg-white p-7 h-full cursor-default
                    hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300
                    ${f.border} ${f.shadow}`}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2.5 text-[0.95rem] leading-snug">{f.title}</h3>
                  <p className="text-[0.82rem] text-slate-500 leading-relaxed">{f.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative py-32 bg-white overflow-hidden">
        {/* Faint wheat left edge */}
        <div className="absolute left-0 bottom-0 h-60 opacity-[0.04] pointer-events-none text-green-600 hidden xl:block">
          <WheatIllustration className="h-full" />
        </div>

        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <FadeIn className="text-center mb-16">
            <SectionLabel>Workflow</SectionLabel>
            <h2 className="text-4xl md:text-[2.75rem] font-extrabold text-slate-900 leading-tight tracking-tight">How It Works</h2>
            <p className="text-slate-500 mt-4 max-w-lg mx-auto text-[1rem] leading-relaxed">
              Six stages — from farmer onboarding to full emergency response — running automatically once set up.
            </p>
          </FadeIn>

          <div className="relative">
            {/* Gradient connecting line */}
            <div className="absolute left-[2.35rem] top-12 bottom-12 w-0.5 bg-gradient-to-b from-[hsl(142,64%,24%)] via-amber-400 to-rose-400 hidden md:block rounded-full" />

            <div className="space-y-5">
              {workflowSteps.map((s, i) => (
                <FadeIn key={s.step} delay={i * 90}>
                  <div className="flex gap-6 items-start">
                    {/* Step circle */}
                    <div className="w-[4.7rem] flex-shrink-0 flex justify-center">
                      <div
                        className="w-[3rem] h-[3rem] rounded-full flex items-center justify-center text-[0.8rem] font-extrabold shadow-lg z-10 relative ring-4 ring-white"
                        style={{
                          background: `linear-gradient(135deg,hsl(${142 - i * 6},64%,${22 + i * 4}%),hsl(${142 - i * 6},55%,${30 + i * 4}%))`,
                          color: "white",
                        }}
                      >
                        {s.step}
                      </div>
                    </div>
                    {/* Step content */}
                    <div className="flex-1 bg-slate-50 hover:bg-green-50/50 border border-slate-100 hover:border-green-200 rounded-2xl px-7 py-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                      <h3 className="font-bold text-slate-900 mb-1.5">{s.label}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          <FadeIn delay={200} className="mt-14 text-center">
            <Link href="/dashboard">
              <button className="group inline-flex items-center gap-2.5 bg-gradient-to-br from-[hsl(142,64%,22%)] to-[hsl(142,64%,30%)] hover:from-[hsl(142,64%,18%)] hover:to-[hsl(142,64%,26%)] text-white font-bold px-9 py-4 rounded-2xl text-sm transition-all duration-200 shadow-lg shadow-green-900/20 hover:shadow-xl hover:shadow-green-900/25 hover:-translate-y-px active:translate-y-0">
                See It Live in the Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Impact ─────────────────────────────────────────────────────── */}
      <section id="impact" className="relative py-32 overflow-hidden" style={{ background: "hsl(142,20%,98%)" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <FadeIn className="text-center mb-16">
            <SectionLabel>Project Impact</SectionLabel>
            <h2 className="text-4xl md:text-[2.75rem] font-extrabold text-slate-900 leading-tight tracking-tight">
              Making a measurable difference in farmer safety
            </h2>
            <p className="text-slate-500 mt-4 max-w-lg mx-auto text-[1rem] leading-relaxed">
              Designed for district officers and rural emergency teams, the platform targets four critical outcomes.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {impacts.map((item, i) => (
              <FadeIn key={item.title} delay={i * 80}>
                <div className="group p-8 rounded-2xl bg-white border border-slate-100 hover:border-green-200 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 text-center cursor-default">
                  <div className="w-14 h-14 bg-green-50 group-hover:bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors duration-300 group-hover:scale-110 transition-transform">
                    <item.icon className="w-7 h-7 text-[hsl(142,64%,24%)]" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2.5 text-[1rem]">{item.title}</h3>
                  <p className="text-[0.85rem] text-slate-500 leading-relaxed">{item.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <div className="relative bg-gradient-to-br from-[hsl(142,64%,16%)] via-[hsl(142,64%,22%)] to-[hsl(150,55%,30%)] rounded-3xl px-10 py-14 shadow-2xl shadow-green-900/30 overflow-hidden">
              {/* Ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-400/15 blur-3xl rounded-full pointer-events-none" />
              {/* Wheat accent */}
              <div className="absolute right-3 bottom-0 h-32 opacity-10 pointer-events-none text-white">
                <WheatIllustration className="h-full" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-amber-400/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Zap className="w-7 h-7 text-amber-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4 tracking-tight">Ready to explore the platform?</h2>
                <p className="text-green-200/80 mb-9 max-w-md mx-auto text-[0.95rem] leading-relaxed">
                  Open the Command Center to see live weather data, risk scores, family rescue recommendations, and the full incident timeline.
                </p>
                <Link href="/dashboard">
                  <button className="group inline-flex items-center gap-2.5 bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-green-900 font-bold px-10 py-4 rounded-2xl text-[1rem] transition-all duration-200 shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-400/35 hover:-translate-y-0.5 active:translate-y-0">
                    Open Dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </button>
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Why We Built ───────────────────────────────────────────────── */}
      <section className="py-28 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <FadeIn className="text-center mb-10">
            <SectionLabel>Our Story</SectionLabel>
            <h2 className="text-4xl md:text-[2.75rem] font-extrabold text-slate-900 leading-tight tracking-tight">
              Why We Built RaithuRakshak AI
            </h2>
          </FadeIn>
          <FadeIn delay={120}>
            <p className="text-slate-600 text-lg leading-[1.9] text-center">
              RaithuRakshak AI was developed to address a real challenge faced by farmers during lightning emergencies.
              Farmers often work alone in open fields where weather conditions can change rapidly. During such situations,
              families are left uncertain about the farmer's safety and whether immediate action is necessary. This platform
              combines live weather monitoring, AI-driven lightning risk prediction, GPS location tracking, and family rescue
              recommendations to support faster, informed decisions during critical situations.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Our Vision ─────────────────────────────────────────────────── */}
      <section className="py-28 border-y border-green-100" style={{ background: "hsl(142,30%,97.5%)" }}>
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <FadeIn className="text-center mb-10">
            <SectionLabel>Looking Ahead</SectionLabel>
            <h2 className="text-4xl md:text-[2.75rem] font-extrabold text-slate-900 leading-tight tracking-tight">Our Vision</h2>
          </FadeIn>
          <FadeIn delay={120}>
            <p className="text-slate-600 text-lg leading-[1.9] text-center">
              Our vision is to leverage technology to improve farmer safety, reduce emergency response delays, and provide
              families with timely information that can help them make informed decisions during severe weather conditions.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Closing Quote ──────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <FadeIn>
            {/* Top accent line */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="block h-px w-16 bg-gradient-to-r from-transparent to-green-300 rounded-full" />
              <Quote className="w-7 h-7 text-green-400" />
              <span className="block h-px w-16 bg-gradient-to-l from-transparent to-green-300 rounded-full" />
            </div>

            <blockquote className="text-2xl md:text-[1.65rem] font-semibold text-[hsl(142,64%,20%)] leading-[1.55] tracking-tight italic">
              "Technology cannot stop a lightning strike, but timely information can help save a life."
            </blockquote>

            {/* Bottom accent line */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <span className="block h-px w-16 bg-gradient-to-r from-transparent to-green-200 rounded-full" />
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span className="block h-px w-16 bg-gradient-to-l from-transparent to-green-200 rounded-full" />
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
