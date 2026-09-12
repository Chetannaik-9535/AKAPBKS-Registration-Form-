import { LOGO_URL, ORG } from "@/lib/org";

export function OrgHeader() {
  return (
    <header className="relative overflow-hidden border-b border-border bg-[image:var(--gradient-saffron)] text-maroon-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-6 text-center">
        <img
          src={LOGO_URL}
          alt="AKAPBKS union emblem"
          className="size-24 rounded-full border-4 border-gold bg-card object-cover shadow-[var(--shadow-temple)] sm:size-28"
        />
        <h1 className="text-balance text-lg font-semibold leading-snug sm:text-2xl">{ORG.nameKn}</h1>
        <p className="text-balance text-xs font-medium sm:text-sm">{ORG.nameEn}</p>
        <div className="gold-rule w-40" />
        <p className="text-[11px] font-medium sm:text-xs">
          Registration No: ({ORG.regNo})
        </p>
        <span className="rounded-full bg-maroon px-4 py-1 text-xs font-semibold tracking-wide text-maroon-foreground shadow-[var(--shadow-soft)]">
          {ORG.approval}
        </span>
      </div>
    </header>
  );
}
