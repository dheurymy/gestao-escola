// Ícones próprios, todos com o mesmo traço (1.75) e pontas arredondadas.
const PATHS = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  list: "M9 6h10M9 12h10M9 18h10M4.5 6.5l1.3 1.3L8 5.5M4.5 12.5l1.3 1.3L8 11.5M4.5 18.5l1.3 1.3L8 17.5",
  users: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c.4-3.4 3.1-5.5 6.5-5.5s6.1 2.1 6.5 5.5M16 4.3a3.5 3.5 0 010 6.4M18 14.8c2 .6 3.3 2.3 3.5 5.2",
  chart: "M5 20V11M12 20V4M19 20v-6",
  chevron: "M9 5l7 7-7 7",
  prev: "M15 5l-7 7 7 7",
  next: "M9 5l7 7-7 7",
  back: "M11 6l-6 6 6 6M5 12h14",
  plus: "M12 5v14M5 12h14",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
  download: "M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="var(--primary)" />
      <path d="M9 16.5l4.5 4.5L23 11" fill="none" stroke="var(--on-primary)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
