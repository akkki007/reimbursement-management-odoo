import { Link } from 'react-router-dom';
import { ChevronDown, Mail, Share2, Globe, MessageCircle, Send } from 'lucide-react';

const PARTNERS = [
  'Zapier',
  'Monzo',
  'Webflow',
  'Mailchimp',
  'Dropbox',
  'DocuSign',
  'Discord',
  'Medium',
  'Maze',
  'Intercom',
  'Basecamp',
  'Framer',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FDF9ED] text-gray-900 font-sans">
      {/* Promo bar */}
      <div className="bg-navy px-4 py-2.5 text-center text-sm text-white">
        Save 50% for 12 months — limited time offer.{' '}
        <Link to="/signup" className="underline decoration-primary-400 underline-offset-2 hover:text-primary-300">
          Get started today.
        </Link>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-[#FDF9ED]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight text-primary-500">
            reimburseflow
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-700 lg:flex">
            {['Products', 'Pricing', 'Customers', 'Partners', 'Resources'].map((label) => (
              <button
                key={label}
                type="button"
                className="flex items-center gap-0.5 text-gray-700 hover:text-navy"
              >
                {label}
                <ChevronDown className="h-4 w-4 opacity-60" />
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-gray-600 sm:inline">EN</span>
            <Link
              to="/login"
              className="rounded-lg border border-navy px-3 py-2 text-sm font-semibold text-navy hover:bg-white/80"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-muted"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 text-center lg:px-6 lg:pt-14">
        <h1 className="font-display mx-auto max-w-4xl text-3xl font-bold uppercase leading-tight tracking-tight text-navy sm:text-4xl lg:text-5xl">
          Enjoy the experience of managing expenses & approvals at your{' '}
          <span className="relative inline-block">
            fingertips
            <span
              className="absolute -bottom-1 left-0 right-0 h-2 rounded-sm bg-primary-400/90"
              aria-hidden
            />
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-600">
          ReimburseFlow brings receipts, multi-step approvals, and company currency in one place—so
          teams submit faster and finance stays in control.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/signup"
            className="rounded-lg bg-primary-400 px-6 py-3 text-sm font-semibold text-navy shadow-sm hover:bg-primary-500"
          >
            Try 14 days for free
          </Link>
          <button
            type="button"
            className="rounded-lg border-2 border-navy bg-transparent px-6 py-3 text-sm font-semibold text-navy hover:bg-white/80"
          >
            Book a demo
          </button>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl">
          <img
            src="/landing/image-fd27bbde-86dd-4f64-81d8-8cc986047b86.png"
            alt=""
            className="w-full rounded-2xl shadow-[0_24px_80px_-12px_rgba(29,38,51,0.25)]"
          />
        </div>
      </section>

      {/* Partner strip */}
      <section className="bg-primary-400 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 lg:flex-row lg:justify-between lg:px-6">
          <p className="font-display max-w-xs text-xl font-bold uppercase leading-snug text-navy">
            Speed up reimbursements with teams everywhere
          </p>
          <div className="grid grid-cols-3 gap-x-8 gap-y-4 sm:grid-cols-4 md:grid-cols-6">
            {PARTNERS.map((name) => (
              <span
                key={name}
                className="text-center text-xs font-semibold uppercase tracking-wide text-navy/80"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* HRIS-style benefits */}
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-cream-dark blur-3xl" />
          <div className="absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 lg:px-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm md:p-12 lg:p-14">
            <h2 className="font-display max-w-2xl text-left text-2xl font-bold uppercase leading-tight text-navy sm:text-3xl">
              HRIS technology that benefits present & future
            </h2>
            <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-10">
              {[
                {
                  title: 'Save operational costs',
                  body: 'With a paperless flow, the operational overhead of conventional expense handling can shrink dramatically.',
                  stat: '+40%',
                  label: 'Budget saving',
                },
                {
                  title: 'Organized expense data',
                  body: 'Leaders can access submissions, receipts, and reports in one structured view.',
                  stat: '+35%',
                  label: 'Data accuracy',
                },
                {
                  title: 'Accurate & fast process',
                  body: 'ReimburseFlow delivers consistent reports for payroll-linked claims and approvals.',
                  stat: '+70%',
                  label: 'Claim efficiency',
                },
              ].map((col) => (
                <div key={col.title} className="flex flex-col">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-cream">
                    <span className="font-display text-2xl font-bold text-primary-500">★</span>
                  </div>
                  <h3 className="font-display text-lg font-bold uppercase text-navy">{col.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">{col.body}</p>
                  <div className="my-6 h-px w-full bg-gray-200" />
                  <p className="font-display text-4xl font-bold text-navy">{col.stat}</p>
                  <p className="mt-1 border-b border-dotted border-gray-400 pb-1 text-sm font-medium text-navy">
                    {col.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integrations + feature */}
      <section className="border-y border-gray-200/80 bg-[#FDF9F0] py-16">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_20px_60px_-24px_rgba(29,38,51,0.2)]">
            <div className="grid items-center gap-8 bg-primary-400 px-6 py-8 md:grid-cols-2 md:px-10 lg:gap-12">
              <p className="font-display text-lg font-bold uppercase leading-snug text-navy md:text-xl">
                Speed up expense processing with other companies
              </p>
              <div className="grid grid-cols-4 gap-3 sm:gap-4">
                {PARTNERS.slice(0, 12).map((name) => (
                  <span
                    key={name}
                    className="text-center text-[10px] font-bold uppercase tracking-wide text-navy/85 sm:text-xs"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-6 py-14 md:px-12 lg:px-16">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="font-display text-2xl font-bold uppercase leading-tight text-navy sm:text-3xl md:text-4xl">
                  Workflows so powerful they practically run themselves
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-gray-600 md:text-base">
                  ReimburseFlow syncs your company rules with every submission—so you rarely chase
                  approvers or re-key amounts across tools.
                </p>
              </div>
              <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                  <img
                    src="/landing/image-dcb04f8d-85e9-479f-b176-426420375112.png"
                    alt=""
                    className="w-full"
                  />
                </div>
                <div className="relative">
                  <div className="absolute -left-2 -top-6 hidden text-4xl text-navy/20 lg:block" aria-hidden>
                    ↯
                  </div>
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-400 font-display text-sm font-bold text-navy">
                    1
                  </div>
                  <h3 className="font-display mt-4 text-xl font-bold uppercase text-navy">
                    Expense list
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    Pay teams accurately, on time, every cycle. Once employee data and policies live
                    in ReimburseFlow, routing and approvals stay consistent.
                  </p>
                  <div
                    className="pointer-events-none absolute -bottom-4 right-0 h-16 w-32 rounded-full border-2 border-dashed border-primary-400/60 opacity-70"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 text-center lg:px-6">
          <p className="font-display text-5xl" aria-hidden>
            👍
          </p>
          <h2 className="font-display mt-4 text-2xl font-bold uppercase text-navy sm:text-3xl">
            Why our customers think we&apos;re the best
          </h2>
          <div className="mt-10 flex justify-center gap-1 text-primary-500">
            {'★★★★★'.split('').map((s, i) => (
              <span key={i} className="text-xl">
                {s}
              </span>
            ))}
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                quote: '“Approval chains finally match how we work—finance sees everything in one place.”',
                name: 'Alex Morgan',
                role: 'Finance Lead',
              },
              {
                quote: '“Submitting receipts from mobile feels effortless. Our team actually complies now.”',
                name: 'Jordan Lee',
                role: 'Operations',
              },
              {
                quote: '“We cut back-and-forth email by half in the first month.”',
                name: 'Sam Rivera',
                role: 'People Ops',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm"
              >
                <p className="text-sm leading-relaxed text-gray-600">{t.quote}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-display text-sm font-bold text-navy">
                    {t.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-footer CTA */}
      <section className="relative bg-primary-400 py-16">
        <div className="absolute inset-x-0 -top-3 h-6 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 24%22 preserveAspectRatio=%22none%22%3E%3Cpath d=%22M0 24V12C200 4 400 20 600 10s400 4 600-6v8z%22 fill=%22%23FDF9ED%22/%3E%3C/svg%3E')] bg-cover bg-top" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-2xl font-bold uppercase leading-tight text-navy sm:text-3xl">
            Start enjoying the best experience in managing expenses with ReimburseFlow
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-muted"
            >
              Start free trial
            </Link>
            <button
              type="button"
              className="rounded-lg border-2 border-navy bg-transparent px-6 py-3 text-sm font-semibold text-navy hover:bg-white/40"
            >
              Book a demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy px-4 py-14 text-gray-300 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr_auto] md:items-start">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Features',
                links: ['Expense capture', 'Approvals', 'Currency', 'Reporting'],
              },
              {
                title: 'Company',
                links: ['About', 'Careers', 'Press'],
              },
              {
                title: 'Resources',
                links: ['Blog', 'Guides', 'API docs'],
              },
              {
                title: 'Support',
                links: ['Help center', 'Status', 'Contact'],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="font-display text-sm font-bold uppercase tracking-wide text-white">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {col.links.map((l) => (
                    <li key={l}>
                      <span className="cursor-default hover:text-white">{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="max-w-sm">
            <p className="font-display text-2xl font-bold text-primary-400">reimburseflow</p>
            <p className="mt-3 text-sm text-gray-400">Product updates, once a month. No spam.</p>
            <div className="mt-4 flex gap-2">
              <input
                type="email"
                placeholder="Email"
                className="min-w-0 flex-1 rounded-lg border border-gray-600 bg-navy-muted px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-primary-400 focus:outline-none"
                readOnly
              />
              <button
                type="button"
                className="shrink-0 rounded-lg bg-primary-400 px-4 py-2.5 text-sm font-semibold text-navy"
              >
                Get started
              </button>
            </div>
            <div className="mt-6 flex gap-4 text-gray-400">
              <Share2 className="h-5 w-5" aria-hidden />
              <Globe className="h-5 w-5" aria-hidden />
              <MessageCircle className="h-5 w-5" aria-hidden />
              <Send className="h-5 w-5" aria-hidden />
              <Mail className="h-5 w-5" aria-hidden />
            </div>
          </div>
        </div>
        <div className="mx-auto mt-14 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-gray-700 pt-8 text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} ReimburseFlow · Terms · Privacy · Cookies</p>
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-400 font-display text-lg font-bold text-navy"
          >
            r
          </Link>
        </div>
      </footer>
    </div>
  );
}
