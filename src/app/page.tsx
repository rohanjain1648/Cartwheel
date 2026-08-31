import { JoinForm } from "@/components/JoinForm";
import {
  Sparkles,
  ShoppingBag,
  Users,
  ShieldCheck,
  Zap,
  Bot,
  ArrowUpRight,
  GitBranch,
  Layers,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-canvas bg-grid-hairline selection:bg-brand-lime selection:text-ink">
      {/* Top Floating Glass Navigation */}
      <header className="sticky top-0 z-50 px-4 pt-3 sm:px-8 sm:pt-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl glass-panel px-4 py-2.5 shadow-sm">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-lime border border-ink/20 shadow-sm transition-transform duration-200 group-hover:scale-105">
              <ShoppingBag className="size-4.5 text-ink" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-base font-bold tracking-tight text-ink">
                Cartwheel
              </span>
              <span className="text-[10px] font-mono text-ink-muted -mt-1">
                WebMCP Shared Cart
              </span>
            </div>
          </Link>

          {/* Center Protocol Badge */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-line bg-canvas-muted/80 px-3 py-1 text-xs font-mono text-ink-secondary">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>WebMCP Protocol 1.0</span>
            <span className="text-ink-faint">|</span>
            <span className="text-ink-muted">Propose → Resolve Mechanic</span>
          </div>

          {/* Right Action Links */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/rohanjain1648/Cartwheel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas-muted hover:border-line-strong transition-all"
            >
              <GitBranch className="size-3.5" />
              <span>GitHub</span>
              <ArrowUpRight className="size-3 text-ink-muted" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
        {/* Hero Banner Grid Box */}
        <div className="relative mx-auto rounded-3xl glass-panel p-6 sm:p-12 shadow-elevated border-[0.5px] border-line">
          {/* RamAIn Signature Corner Orbs */}
          <span className="corner-orb -top-3.5 -left-3.5 hidden sm:flex">↘</span>
          <span className="corner-orb -top-3.5 -right-3.5 hidden sm:flex">↙</span>
          <span className="corner-orb -bottom-3.5 -left-3.5 hidden sm:flex">↗</span>
          <span className="corner-orb -bottom-3.5 -right-3.5 hidden sm:flex">↖</span>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Heading & Value Proposition */}
            <div className="lg:col-span-7 flex flex-col items-start gap-6">
              {/* Badge Tag */}
              <div className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-brand-lime-soft/90 px-3 py-1 text-xs font-mono font-semibold text-ink uppercase tracking-wider">
                <Sparkles className="size-3.5 text-ink" />
                <span>Multiplayer Agentic Commerce</span>
                <span className="text-[10px] bg-brand-lime px-1.5 py-0.5 rounded border border-ink/20">[api+ui]</span>
              </div>

              {/* High-Impact Heading */}
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl lg:leading-[1.08]">
                Shopping with AI agents.{" "}
                <span className="relative inline-block bg-brand-lime/80 px-2 py-0.5 rounded-lg border border-ink/15 shadow-sm">
                  Together.
                </span>
              </h1>

              {/* Subheading */}
              <p className="max-w-xl text-base text-ink-secondary sm:text-lg leading-relaxed">
                A real-time shared cart where multiple humans and their autonomous AI agents collaborate safely. Powered by <strong>WebMCP</strong>, every action follows our <em>Propose → Auto-Resolve or Approve</em> trust protocol.
              </p>

              {/* Feature Highlights Pill Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-2">
                <div className="flex items-center gap-2 rounded-xl border border-line-subtle bg-canvas/60 p-2.5 text-xs text-ink-secondary">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                  <span>Trust Boundaries</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-line-subtle bg-canvas/60 p-2.5 text-xs text-ink-secondary">
                  <Zap className="size-4 text-amber-500 shrink-0" />
                  <span>Sub-second Sync</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-line-subtle bg-canvas/60 p-2.5 text-xs text-ink-secondary">
                  <Bot className="size-4 text-blue-600 shrink-0" />
                  <span>6 WebMCP Tools</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Join / Create Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl glass-panel p-6 sm:p-8 shadow-card border border-line">
                <div className="flex items-center justify-between pb-4 border-b border-line-subtle mb-5">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-brand-lime animate-ping"></div>
                    <span className="font-display font-bold text-base text-ink">
                      Join or Create Room
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-ink-muted bg-canvas-muted px-2 py-0.5 rounded-md border border-line-subtle">
                    Live Session
                  </span>
                </div>

                {/* The Interactive Form */}
                <JoinForm />
              </div>
            </div>
          </div>
        </div>

        {/* How It Works / Interactive Architecture Walkthrough */}
        <section className="mt-16 sm:mt-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="rounded-md border border-line bg-canvas-muted px-3 py-1 font-mono text-xs font-semibold uppercase text-ink">
              Core Mechanic
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              How WebMCP powers multi-agent coordination
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">
              Traditional DOM scraping fails when multiple bots edit the same page. Cartwheel turns every mutation into a structured, auditable proposal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Groceries */}
            <div className="rounded-2xl glass-panel p-6 border border-line hover:border-line-strong transition-all duration-300 shadow-sm hover:shadow-card">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-lime-soft border border-line text-ink mb-4">
                <span className="font-mono text-sm font-bold">01</span>
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                🥦 Household Groceries
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
                Roommates set dietary tags (e.g. vegan, gluten-free). Self-scoped items auto-resolve instantly; duplicate claims trigger instant peer approval workflows.
              </p>
              <div className="mt-4 rounded-lg bg-canvas-muted p-2.5 font-mono text-[11px] text-ink-muted border border-line-subtle">
                <code>propose_change(&quot;add_item&quot;) → auto_approved</code>
              </div>
            </div>

            {/* Step 2: Pooled Gifts */}
            <div className="rounded-2xl glass-panel p-6 border border-line hover:border-line-strong transition-all duration-300 shadow-sm hover:shadow-card">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-lime-soft border border-line text-ink mb-4">
                <span className="font-mono text-sm font-bold">02</span>
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                🎁 Pooled Group Gifts
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
                Friends contribute toward shared items. Dedicated <code>mark_paid</code> tool allows each participant&apos;s agent to log payment status with live crowdfunding meters.
              </p>
              <div className="mt-4 rounded-lg bg-canvas-muted p-2.5 font-mono text-[11px] text-ink-muted border border-line-subtle">
                <code>mark_paid(&quot;cart_item_id&quot;) → split_updated</code>
              </div>
            </div>

            {/* Step 3: Furniture & Budget Caps */}
            <div className="rounded-2xl glass-panel p-6 border border-line hover:border-line-strong transition-all duration-300 shadow-sm hover:shadow-card">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-lime-soft border border-line text-ink mb-4">
                <span className="font-mono text-sm font-bold">03</span>
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                🛋️ Shared Furniture & Budgets
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
                Spending caps are enforced in code. If an agent proposes an item over a roommate&apos;s budget cap, it halts as <code>pending</code> until approved or rejected with feedback.
              </p>
              <div className="mt-4 rounded-lg bg-canvas-muted p-2.5 font-mono text-[11px] text-ink-muted border border-line-subtle">
                <code>status: &quot;pending&quot; → needs_approval</code>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Footer */}
        <footer className="mt-20 border-t border-line pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-ink-muted">
          <div>Cartwheel · WebMCP Challenge Hackathon Submission</div>
          <div className="flex items-center gap-4">
            <span>Next.js 14</span>
            <span>•</span>
            <span>Supabase Realtime</span>
            <span>•</span>
            <span>PostgreSQL RPC</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
