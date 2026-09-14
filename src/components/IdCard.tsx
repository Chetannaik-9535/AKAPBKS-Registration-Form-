import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CARD_BACK_NOTES, CARD_INSTRUCTIONS, CARD_SIGNATORIES, LOGO_URL, ORG } from "@/lib/org";
import { downloadCardImage } from "@/lib/idcard";
import type { MemberRecord } from "@/lib/members.functions";

type Props = { member: MemberRecord; autoDownload?: boolean };

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="leading-[1.12]">
      <p className="text-[9px] font-extrabold uppercase text-maroon">{label}:</p>
      <p className="break-words text-[10px] font-semibold">{value}</p>
    </div>
  );
}

function OrnateFrame({ children, sideRef }: { children: React.ReactNode; sideRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={sideRef}
      className="relative h-[540px] w-[340px] shrink-0 overflow-hidden rounded-[18px] border-[7px] border-maroon bg-card p-[5px] text-foreground shadow-lg"
    >
      <div className="pointer-events-none absolute inset-[4px] rounded-[11px] border-[3px] border-double border-gold" />
      <div className="pointer-events-none absolute inset-[10px] rounded-[7px] border border-gold/80" />
      <div className="relative h-full overflow-hidden rounded-[6px] bg-[radial-gradient(circle_at_center,var(--color-gold)_0_1px,transparent_1.5px)] bg-[length:30px_30px] px-4 py-4">
        <img src={LOGO_URL} alt="" aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 w-[82%] -translate-x-1/2 -translate-y-1/2 opacity-[0.055]" />
        {children}
      </div>
    </div>
  );
}

export function IdCard({ member, autoDownload = false }: Props) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const downloaded = useRef(false);

  async function handleDownload() {
    if (!frontRef.current || !backRef.current) return;
    setBusy(true);
    try {
      await downloadCardImage(frontRef.current, backRef.current, `${member.membership_id}-id-card`);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!autoDownload || downloaded.current) return;
    downloaded.current = true;
    const timer = window.setTimeout(() => void handleDownload(), 1000);
    return () => window.clearTimeout(timer);
    // The generated member changes by mounting a fresh card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload]);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full max-w-full gap-5 overflow-x-auto pb-3 sm:justify-center">
        <OrnateFrame sideRef={frontRef}>
          <div className="relative flex h-full flex-col items-center text-center">
            <img src={LOGO_URL} alt="AKAPBKS logo" className="size-[76px] rounded-full border-2 border-gold bg-card object-cover" />
            <p className="mt-1 text-[10px] font-extrabold leading-tight text-maroon">{ORG.nameKn}</p>
            <p className="mt-0.5 text-[8px] font-bold leading-tight">{ORG.nameEn}</p>
            <p className="mt-1 text-[7px] font-semibold">ನೋಂದಣಿ ಸಂಖ್ಯೆ / Reg No: {ORG.regNo}</p>
            <p className="mt-0.5 text-[7px] font-bold text-maroon">{ORG.approval}</p>

            <div className="my-2 w-full rounded-full border-2 border-gold bg-maroon px-3 py-1 text-[15px] font-extrabold text-gold">
              ಸದಸ್ಯರ ಗುರುತಿನ ಚೀಟಿ<br /><span className="text-[12px]">MEMBER IDENTITY CARD</span>
            </div>

            <div className="grid w-full grid-cols-[112px_1fr] gap-3 text-left">
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.full_name} className="h-[154px] w-[112px] rounded-md border-2 border-gold object-cover" />
              ) : (
                <div className="flex h-[154px] w-[112px] items-center justify-center rounded-md border-2 border-gold bg-muted text-xs text-muted-foreground">Photo</div>
              )}
              <div className="space-y-[5px] pt-1">
                <Field label="Name / ಹೆಸರು" value={member.full_name} />
                <Field label="Designation / ಹುದ್ದೆ" value={member.designation} />
                <Field label="Blood Group / ರಕ್ತದ ಗುಂಪು" value={member.blood_group} />
                <Field label="Mobile No" value={member.phone} />
                <Field label="Location / ಸ್ಥಳ" value={`${member.taluk}, ${member.district}`} />
                <Field label="ID No" value={member.membership_id} />
              </div>
            </div>

            <div className="mt-auto grid w-full grid-cols-3 gap-1 border-t border-gold pt-2">
              {CARD_SIGNATORIES.map((signatory) => (
                <div key={signatory.nameKn} className="flex min-w-0 flex-col items-center">
                  <img src={signatory.image} alt="" className="h-8 w-full object-contain" />
                  <p className="line-clamp-1 text-[6.5px] font-extrabold text-maroon">{signatory.nameKn}</p>
                  <p className="text-[6px] leading-tight">{signatory.roleKn}</p>
                </div>
              ))}
            </div>
            <div className="mt-1 w-full rounded bg-maroon py-1 text-[10px] font-bold text-gold">ಧರ್ಮ · ಭಕ್ತಿ · ಸೇವೆ</div>
          </div>
        </OrnateFrame>

        <OrnateFrame sideRef={backRef}>
          <div className="relative flex h-full flex-col text-[8.5px] leading-snug">
            <div className="mx-auto rounded-full border-2 border-gold bg-maroon px-5 py-1.5 text-center text-[13px] font-extrabold text-gold">ವಿಶೇಷ ಸೂಚನೆ</div>
            <ol className="mt-4 space-y-3 text-justify font-semibold">
              {CARD_BACK_NOTES.map((note, index) => <li key={note}>{index + 1}. {note}</li>)}
            </ol>

            <div className="my-4 border-y border-gold py-3">
              <p className="text-[12px] font-extrabold text-maroon">ಪ್ರಧಾನ ಕಚೇರಿ</p>
              <p className="mt-1 text-[9px] font-semibold leading-relaxed">{ORG.officeKn[1]}</p>
              <p className="font-bold">ಕರ್ನಾಟಕ ರಾಜ್ಯ</p>
            </div>

            <div className="space-y-2 text-[9px] font-semibold">
              <p><span className="font-extrabold text-maroon">Email:</span> {ORG.email}</p>
              {ORG.phones.map((phone) => <p key={phone}><span className="font-extrabold text-maroon">Mobile No:</span> {phone}</p>)}
            </div>

            <div className="mt-4">
              <p className="text-[11px] font-extrabold text-maroon">Instructions :</p>
              <ol className="mt-1 space-y-1 font-semibold">
                {CARD_INSTRUCTIONS.map((instruction, index) => <li key={instruction}>{index + 1}. {instruction}</li>)}
              </ol>
            </div>

            <div className="mt-auto rounded bg-maroon px-2 py-1.5 text-center text-[8px] font-bold text-gold">
              PRIVATE TRADE UNION · NOT A GOVERNMENT ID · REGISTERED TRADE UNION
            </div>
          </div>
        </OrnateFrame>
      </div>

      <Button onClick={handleDownload} disabled={busy} size="lg">
        {busy ? "ಡೌನ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ..." : "ಗುರುತಿನ ಚೀಟಿ ಡೌನ್‌ಲೋಡ್ / Download ID Card"}
      </Button>
    </div>
  );
}