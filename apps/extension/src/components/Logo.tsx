/** The Moneyshot logo, dark text in light mode and white text in dark mode. */
export function Logo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <>
      <img src="/logo.png" alt="Moneyshot" className={`${className} dark:hidden`} />
      <img src="/logo-white.png" alt="" aria-hidden className={`${className} hidden dark:block`} />
    </>
  );
}
