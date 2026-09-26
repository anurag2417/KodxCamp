import { Link } from 'react-router-dom';
import { AuthWorkspacePreview } from './AuthWorkspacePreview';

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * Auth shell.
 *
 * Two columns:
 *   Left  — brand panel with a live workspace preview, in brand navy,
 *           using the orange brand accent for links/highlights.
 *   Right — form column, token-driven so it flips with theme.
 *
 * The left panel is a fixed dark surface in both themes: it is the
 * "identity" half of the split, and its contrast against the form
 * column is intentional. The blues inside it are the brand blues
 * (--color-blue-primary / --color-blue-deep), not the semantic
 * theme-aware blue, because the panel is always dark.
 */
export const AuthLayout: React.FC<Props> = ({
  title,
  subtitle,
  children,
  footer,
}) => (
  <div className="flex h-[100dvh] w-full overflow-hidden bg-bg">
    {/* ─── Left: brand + workspace preview ───────────── */}
    <div className="relative hidden h-full flex-1 overflow-hidden bg-gradient-to-br from-brand-900 via-[#1E3A8A] to-[#0F172A] lg:flex">
      {/* Animated mesh — brand blues drifting behind the panel */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="hero-mesh-1 absolute left-[-15%] top-[-20%] h-[60vw] w-[60vw] rounded-full bg-[#2563EB]/30 blur-[100px]" />
        <div className="hero-mesh-2 absolute right-[-20%] top-[10%] h-[50vw] w-[50vw] rounded-full bg-[#1E3A8A]/35 blur-[100px]" />
        <div className="hero-mesh-3 absolute bottom-[-25%] left-[15%] h-[55vw] w-[55vw] rounded-full bg-[#60A5FA]/20 blur-[100px]" />
      </div>

      {/* Noise */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col p-10 xl:p-14">
        {/* Top */}
        <div className="shrink-0">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-xl font-bold text-white backdrop-blur">
              K
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              KODX<span className="text-[#60A5FA]">CAMP</span>
            </span>
          </Link>
          <h2 className="mt-6 max-w-xl text-3xl font-bold leading-tight text-white xl:text-4xl 2xl:text-5xl">
            Learn to code by doing.
          </h2>
          <p className="mt-3 max-w-lg text-sm text-[#CBD5E1] xl:text-base">
            Real lessons. Real tests. Real feedback - all in your browser.
          </p>
        </div>

        {/* Middle: workspace preview */}
        <div className="flex min-h-0 flex-1 items-center py-8">
          <div className="mx-auto w-full max-w-[560px] xl:max-w-[620px]">
            <AuthWorkspacePreview />
          </div>
        </div>

        {/* Bottom */}
        <div className="shrink-0 flex items-center gap-6 text-xs text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />
            <span>Running in your browser</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />
            <span>No installs · no setup</span>
          </div>
        </div>
      </div>
    </div>

    {/* ─── Right: form column (WIDER) ────────────────── */}
    <div className="relative flex h-full w-full items-center justify-center px-6 lg:w-[600px] lg:px-10 xl:w-[680px] xl:px-14 2xl:w-[760px]">
      {/* Mobile top bar */}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            K
          </div>
          <span className="text-base font-bold tracking-tight text-text-primary">
            KODX<span className="text-brand-500">CAMP</span>
          </span>
        </Link>
        <Link
          to="/"
          className="text-xs font-medium text-text-muted hover:text-brand-500"
        >
          ← Back
        </Link>
      </div>

      {/* Inner form - wider than before */}
      <div className="w-full max-w-lg auth-fade-in xl:max-w-xl">
        <Link
          to="/"
          className="mb-8 hidden text-xs font-medium text-text-muted transition-colors hover:text-brand-500 lg:inline-block"
        >
          ← Back to home
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          {title}
        </h1>
        <p className="mt-2 text-sm text-text-muted">{subtitle}</p>

        <div className="mt-8">{children}</div>

        <div className="mt-8 text-center text-sm text-text-muted">{footer}</div>
      </div>
    </div>
  </div>
);