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

/* ─── Helpers ─────────────────────────────────────────────────────────── */

/** Intersection-observer hook for scroll-triggered entrance animations */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─── Sub-components ──────────────────────────────────────────────────── */

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Data ────────────────────────────────────────────────────────────── */

const features = [
  {
    icon: CloudLightning,
    title: "Live Weather Monitoring",
    description:
      "Real-time weather data per district — temperature, humidity, wind speed, and lightning risk updated every 30 minutes via OpenWeather API.",
    color: "text-sky-600",
    bg: "bg-sky-50 border-sky-100",
  },
  {
    icon: Zap,
    title: "Lightning Risk Prediction",
    description:
      "District-level lightning risk warnings with severity levels (Low → Critical) issued and tracked for rapid field response.",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-100",
  },
  {
    icon: Brain,
    title: "AI Risk Engine",
    description:
      "AI-driven composite risk scoring for every registered farmer, factoring weather conditions, location exposure, and historical alerts.",
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-100",
  },
  {
    icon: Clock,
    title: "Incident Timeline",
    description:
      "Chronological audit trail of all lightning alerts, emergency reports, and weather events across all registered districts.",
    color: "text-slate-600",
    bg: "bg-slate-50 border-slate-100",
  },
  {
    icon: Shield,
    title: "Family Rescue Recommendation",
    description:
      "Automated guidance for family members — actionable rescue instructions graded by urgency, delivered in English and Telugu.",
    color: "text-green-700",
    bg: "bg-green-50 border-green-100",
  },
  {
    icon: MapPin,
    title: "GPS Location Tracking",
    description:
      "Last-known GPS coordinates of every farmer surfaced on a live location board so responders can reach the field instantly.",
    color: "text-rose-600",
    bg: "bg-rose-50 border-rose-100",
  },
  {
    icon: AlertTriangle,
    title: "Emergency Alerts",
    description:
      "Report and resolve farmer emergencies — lightning strikes, medical crises, missing persons — with full status lifecycle management.",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-100",
  },
  {
    icon: Globe,
    title: "English & Telugu Support",
    description:
      "Complete bilingual UI — switch between English and Telugu in one click so district officers and field staff can work in their language.",
    color: "text-teal-600",
    bg: "bg-teal-50 border-teal-100",
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

/* ─── Main Component ──────────────────────────────────────────────────── */

export default function Landing() {
  // Smooth scroll to About section when "Learn More" is clicked
  function scrollToAbout() {
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-white font-sans antialiased overflow-x-hidden">
      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-green-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[hsl(142,64%,24%)] flex items-center justify-center shadow">
              <CloudLightning className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-[hsl(142,64%,18%)] text-lg tracking-tight">RaithuRakshak AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button onClick={scrollToAbout} className="hover:text-green-800 transition-colors">About</button>
            <a href="#features" className="hover:text-green-800 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-green-800 transition-colors">How It Works</a>
            <a href="#impact" className="hover:text-green-800 transition-colors">Impact</a>
          </nav>
          <Link href="/dashboard">
            <button className="bg-[hsl(142,64%,24%)] hover:bg-[hsl(142,64%,20%)] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5">
              Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(142,64%,14%)] via-[hsl(142,64%,20%)] to-[hsl(142,40%,28%)]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(hsl(140,100%,80%) 1px, transparent 1px), linear-gradient(90deg, hsl(140,100%,80%) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        {/* Lightning bolt decorative */}
        <div className="absolute right-10 top-24 opacity-20 hidden lg:block">
          <Zap className="w-48 h-48 text-amber-300" strokeWidth={0.5} />
        </div>
        <div className="absolute left-6 bottom-24 opacity-10 hidden lg:block">
          <CloudLightning className="w-36 h-36 text-green-200" strokeWidth={0.5} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24 pb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Farmer Safety Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Raithu
            <span className="text-amber-400">Rakshak</span>
            {" "}AI
          </h1>
          <p className="text-xl md:text-2xl text-green-100 font-medium mb-4 max-w-3xl mx-auto leading-relaxed">
            AI-powered Lightning Safety &amp; Emergency Response Platform for Farmers
          </p>
          <p className="text-base text-green-200/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Helping farmers and their families make faster, informed decisions during lightning emergencies through
            weather intelligence, AI-driven risk prediction, and emergency guidance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <button className="bg-amber-400 hover:bg-amber-300 text-green-900 font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-lg hover:shadow-amber-400/30 hover:scale-[1.02] flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <button
              onClick={scrollToAbout}
              className="border border-white/30 hover:border-white/60 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all backdrop-blur-sm hover:bg-white/10 flex items-center gap-2"
            >
              Learn More
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Quick stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: "8+", label: "Core Modules" },
              { value: "6", label: "Districts Covered" },
              { value: "30m", label: "Weather Refresh" },
              { value: "2", label: "Languages" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-extrabold text-amber-400">{s.value}</div>
                <div className="text-xs text-green-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* ── Problem Statement ──────────────────────────────────────────── */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="text-sm font-semibold text-green-700 uppercase tracking-widest">The Problem</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
                Lightning is one of the leading causes of <br className="hidden md:block" />
                <span className="text-[hsl(142,64%,24%)]">farm-field fatalities in rural India</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              {[
                {
                  icon: "🌦️",
                  title: "Rapidly Changing Weather",
                  text: "Farmers often work in open fields where conditions shift from clear skies to dangerous storms within minutes, leaving little time to react.",
                },
                {
                  icon: "⚡",
                  title: "Life-Threatening Lightning Strikes",
                  text: "Lightning events in agricultural districts can become fatal within seconds — yet most farmers have no early-warning system.",
                },
                {
                  icon: "👨‍👩‍👧",
                  title: "Families Left in the Dark",
                  text: "Families frequently don't know whether the farmer is safe, where they are, or whether to call for emergency help — every minute of uncertainty matters.",
                },
                {
                  icon: "🏥",
                  title: "Delayed Emergency Response",
                  text: "Without location data or a coordinated alert system, first responders lose critical time locating affected farmers across large agricultural tracts.",
                },
              ].map((item) => (
                <FadeIn key={item.title} delay={100}>
                  <div className="flex gap-4 p-5 rounded-xl border border-slate-100 bg-slate-50 hover:border-green-200 hover:bg-green-50/50 transition-colors">
                    <div className="text-2xl flex-shrink-0">{item.icon}</div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={200} className="bg-gradient-to-br from-[hsl(142,64%,18%)] to-[hsl(142,64%,28%)] rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-900" />
                </div>
                <h3 className="text-xl font-bold">RaithuRakshak AI addresses this gap</h3>
              </div>
              <p className="text-green-100 leading-relaxed mb-6">
                By combining live weather intelligence, AI-driven risk prediction, GPS tracking, and automated family rescue guidance
                into a single, bilingual emergency management platform — purpose-built for district officers and rural emergency teams.
              </p>
              <div className="space-y-3">
                {[
                  "Real-time district weather monitoring via OpenWeather API",
                  "Composite AI risk score per registered farmer",
                  "Automated family rescue recommendations in English & Telugu",
                  "GPS-tracked last location for instant field response",
                  "Full incident timeline for post-event analysis",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-green-100">{point}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <span className="text-sm font-semibold text-green-700 uppercase tracking-widest">Platform Capabilities</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              Everything a district emergency team needs
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Eight tightly integrated modules that cover the full lifecycle — from farmer registration to emergency resolution.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 60}>
                <div className={`rounded-xl border p-5 h-full hover:shadow-md transition-shadow ${f.bg}`}>
                  <div className={`w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center mb-4`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1.5 text-sm">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <span className="text-sm font-semibold text-green-700 uppercase tracking-widest">Workflow</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">How It Works</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Six stages — from farmer onboarding to full emergency response — running automatically once set up.
            </p>
          </FadeIn>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-[2.375rem] top-10 bottom-10 w-0.5 bg-gradient-to-b from-[hsl(142,64%,24%)] via-amber-400 to-rose-400 hidden md:block" />

            <div className="space-y-6">
              {workflowSteps.map((s, i) => (
                <FadeIn key={s.step} delay={i * 80}>
                  <div className="flex gap-5 items-start">
                    <div className="w-[4.75rem] flex-shrink-0 flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-extrabold shadow-md z-10 relative"
                        style={{
                          background: `hsl(${142 - i * 8},64%,${24 + i * 4}%)`,
                          color: "white",
                        }}
                      >
                        {s.step}
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-5 hover:border-green-200 hover:shadow-sm transition-all">
                      <h3 className="font-bold text-slate-900 mb-1">{s.label}</h3>
                      <p className="text-sm text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          <FadeIn delay={200} className="mt-12 text-center">
            <Link href="/dashboard">
              <button className="bg-[hsl(142,64%,24%)] hover:bg-[hsl(142,64%,20%)] text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:scale-[1.02] inline-flex items-center gap-2">
                See It Live in the Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Impact ────────────────────────────────────────────────────── */}
      <section id="impact" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <span className="text-sm font-semibold text-green-700 uppercase tracking-widest">Project Impact</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              Making a measurable difference in farmer safety
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Designed for district officers and rural emergency teams, the platform targets four critical outcomes.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {impacts.map((item, i) => (
              <FadeIn key={item.title} delay={i * 80}>
                <div className="group p-6 rounded-2xl border border-slate-100 hover:border-green-200 hover:shadow-lg transition-all text-center">
                  <div className="w-12 h-12 bg-green-50 group-hover:bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
                    <item.icon className="w-6 h-6 text-[hsl(142,64%,24%)]" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <div className="bg-gradient-to-br from-[hsl(142,64%,18%)] to-[hsl(142,64%,28%)] rounded-2xl p-10 shadow-xl text-white">
              <Zap className="w-10 h-10 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Ready to explore the platform?</h2>
              <p className="text-green-200 mb-7 max-w-xl mx-auto text-sm leading-relaxed">
                Open the Command Center to see live weather data, risk scores, family rescue recommendations, and the full incident timeline.
              </p>
              <Link href="/dashboard">
                <button className="bg-amber-400 hover:bg-amber-300 text-green-900 font-bold px-10 py-3.5 rounded-xl text-base transition-all shadow-lg hover:shadow-amber-400/30 hover:scale-[1.02] inline-flex items-center gap-2">
                  Open Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Why We Built ──────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-10">
              <span className="text-sm font-semibold text-green-700 uppercase tracking-widest">Our Story</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
                Why We Built RaithuRakshak AI
              </h2>
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="text-slate-600 text-lg leading-relaxed text-center max-w-3xl mx-auto">
              RaithuRakshak AI was developed to address a real challenge faced by farmers during lightning emergencies.
              Farmers often work alone in open fields where weather conditions can change rapidly. During such situations,
              families are left uncertain about the farmer's safety and whether immediate action is necessary. This platform
              combines live weather monitoring, AI-driven lightning risk prediction, GPS location tracking, and family rescue
              recommendations to support faster, informed decisions during critical situations.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Our Vision ────────────────────────────────────────────────── */}
      <section className="py-20 bg-[hsl(142,30%,97%)] border-y border-green-100">
        <div className="max-w-4xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-10">
              <span className="text-sm font-semibold text-green-700 uppercase tracking-widest">Looking Ahead</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Our Vision</h2>
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="text-slate-600 text-lg leading-relaxed text-center max-w-3xl mx-auto">
              Our vision is to leverage technology to improve farmer safety, reduce emergency response delays, and provide
              families with timely information that can help them make informed decisions during severe weather conditions.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Closing Quote ─────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <FadeIn>
            <Quote className="w-8 h-8 text-green-300 mx-auto mb-5" />
            <blockquote className="text-xl md:text-2xl font-semibold text-[hsl(142,64%,22%)] leading-relaxed italic">
              "Every minute matters during a lightning emergency. Timely information can save lives."
            </blockquote>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
