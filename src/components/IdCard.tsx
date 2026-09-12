import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  CARD_BACK_NOTES,
  CARD_INSTRUCTIONS,
  CARD_SIGNATORIES,
  LOGO_URL,
  ORG,
} from "@/lib/org";
import { calcAge, downloadCardImages, downloadCardPdf, formatDate } from "@/lib/idcard";
import type { MemberRecord } from "@/lib/members.functions";

type Props = { member: MemberRecord; autoDownload?: boolean };

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1 leading-tight">
      <span className="shrink-0 font-semibold text-maroon">{label}:</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

export function IdCard({ member, autoDownload = false }: Props) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    void import("qrcode").then((mod) =>
      mod
        .toDataURL(`${origin}/member/${member.membership_id}`, { margin: 0, width: 240 })
        .then(setQr),
    );
  }, [member.membership_id]);

  async function handlePdf() {
    if (!frontRef.current || !backRef.current) return;
    setBusy(true);
    try {
      await downloadCardPdf(frontRef.current, backRef.current, `${member.membership_id}-id-card`);
    } finally {
      setBusy(false);
    }
  }

  async function handleImages() {
    if (!frontRef.current || !backRef.current) return;
    setBusy(true);
    try {
      await downloadCardImages(frontRef.current, backRef.current, `${member.membership_id}-id-card`);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!autoDownload || done.current || !qr) return;
    done.current = true;
    const timer = setTimeout(() => void handlePdf(), 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload, qr]);

  const watermark = (
    <img
      src={LOGO_URL}
      alt=""
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 w-[68%] -translate-x-1/2 -translate-y-1/2 opacity-10"
    />
  );

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
        {/* FRONT */}
        <div
          ref={frontRef}
          className="relative h-[404px] w-[640px] shrink-0 origin-top scale-[0.52] overflow-hidden rounded-lg border-2 border-gold bg-card text-[10px] text-foreground sm:scale-[0.72] lg:scale-100"
          style={{ marginBottom: 0 }}
        >
          {watermark}
          <div className="relative flex flex-col items-center gap-0.5 bg-[image:var(--gradient-saffron)] px-3 py-2 text-center text-maroon-foreground">
            <img src={LOGO_URL} alt="" className="size-11 rounded-full border-2 border-gold bg-card" />
            <p className="text-[11px] font-bold leading-tight">{ORG.nameKn}</p>
            <p className="text-[8px] font-semibold leading-tight">{ORG.nameEn}</p>
            <p className="text-[7.5px] font-medium">Reg No: ({ORG.regNo})</p>
            <span className="rounded-full bg-maroon px-2 py-[2px] text-[8px] font-bold text-gold">
              {ORG.approval}
            </span>
          </div>

          <div className="relative flex gap-3 px-4 pt-3">
            <div className="w-[92px] shrink-0">
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.full_name}
                  className="h-[112px] w-[92px] rounded border-2 border-gold object-cover"
                />
              ) : (
                <div className="flex h-[112px] w-[92px] items-center justify-center rounded border-2 border-gold bg-muted text-[8px] text-muted-foreground">
                  Photo
                </div>
              )}
              <p className="mt-1 rounded bg-maroon px-1 py-[2px] text-center text-[8.5px] font-bold text-gold">
                {member.membership_id}
              </p>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-[3px] text-[10px]">
              <p className="text-[13px] font-bold leading-tight text-maroon">{member.full_name}</p>
              <Field label="ಹುದ್ದೆ / Designation" value={member.designation} />
              <Field label="ಜನ್ಮ ದಿನಾಂಕ / DOB" value={formatDate(member.date_of_birth)} />
              <Field label="ವಯಸ್ಸು / Age" value={calcAge(member.date_of_birth)} />
              <Field label="ರಕ್ತದ ಗುಂಪು / Blood Group" value={member.blood_group} />
              <Field label="Phone No" value={member.phone} />
              <Field
                label="ಸಿಂಧುತ್ವ / Valid"
                value={`${formatDate(member.valid_from)} - ${formatDate(member.valid_until)}`}
              />
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-1 border-t border-gold px-2 py-1">
            {CARD_SIGNATORIES.map((s) => (
              <div key={s.nameKn} className="flex flex-col items-center text-center">
                <img src={s.image} alt="" className="h-7 object-contain mix-blend-multiply" />
                <p className="text-[8px] font-bold leading-tight text-maroon">{s.nameKn}</p>
                <p className="text-[7px] leading-tight">{s.roleKn}</p>
                <p className="text-[6.5px] leading-tight text-muted-foreground">{s.roleEn}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BACK */}
        <div
          ref={backRef}
          className="relative h-[404px] w-[640px] shrink-0 origin-top scale-[0.52] overflow-hidden rounded-lg border-2 border-gold bg-card px-4 py-3 text-[9px] text-foreground sm:scale-[0.72] lg:scale-100"
        >
          {watermark}
          <div className="relative">
            <p className="text-[11px] font-bold text-maroon">ವಿಶೇಷ ಸೂಚನೆ :</p>
            <ol className="mt-1 space-y-1 leading-snug">
              {CARD_BACK_NOTES.map((note, i) => (
                <li key={note}>
                  {i + 1}. {note}
                </li>
              ))}
            </ol>

            <div className="mt-2 flex gap-3">
              <div className="flex-1 leading-snug">
                {ORG.officeKn.map((line) => (
                  <p key={line} className="font-semibold">
                    {line}
                  </p>
                ))}
                <p>Email {ORG.email}</p>
                {ORG.phones.map((p) => (
                  <p key={p}>Mobile No : {p}</p>
                ))}
              </div>
              <div className="flex flex-col items-center gap-1">
                {qr ? <img src={qr} alt="Member QR code" className="size-[86px]" /> : null}
                <p className="text-[7px] text-muted-foreground">Scan for member details</p>
              </div>
              <div className="flex w-[92px] flex-col items-center">
                <div className="flex h-[86px] w-[86px] items-center justify-center rounded border border-dashed border-gold text-[7px] text-muted-foreground">
                  &nbsp;
                </div>
                <p className="text-[7px] text-muted-foreground">Organization Scanner</p>
              </div>
            </div>

            <div className="mt-2">
              <p className="text-[10px] font-bold text-maroon">Instructions :</p>
              <ol className="space-y-[2px] leading-snug">
                {CARD_INSTRUCTIONS.map((line, i) => (
                  <li key={line}>
                    {i + 1}. {line}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={handlePdf} disabled={busy}>
          PDF ಡೌನ್‌ಲೋಡ್ / Download PDF
        </Button>
        <Button variant="outline" onClick={handleImages} disabled={busy}>
          ಚಿತ್ರ ಡೌನ್‌ಲೋಡ್ / Download Image
        </Button>
      </div>
    </div>
  );
}
