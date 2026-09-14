import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { BearersCarousel } from "@/components/BearersCarousel";
import { IdCard } from "@/components/IdCard";
import { OrgHeader } from "@/components/OrgHeader";
import { RegistrationForm } from "@/components/RegistrationForm";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/idcard";
import { deleteMember, listMembers, type MemberRecord } from "@/lib/members.functions";
import { LOGO_URL, ORG } from "@/lib/org";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | AKAPBKS Registrations" },
      {
        name: "description",
        content: "Manage AKAPBKS member registrations, download ID cards and export member data.",
      },
      { property: "og:title", content: "Admin Dashboard | AKAPBKS Registrations" },
      {
        property: "og:description",
        content: "Manage AKAPBKS member registrations, download ID cards and export member data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

const FIELDS: { key: keyof MemberRecord; label: string }[] = [
  { key: "membership_id", label: "Membership ID" },
  { key: "full_name", label: "Full Name" },
  { key: "date_of_birth", label: "Date of Birth" },
  { key: "phone", label: "Phone" },
  { key: "blood_group", label: "Blood Group" },
  { key: "district", label: "District" },
  { key: "taluk", label: "Taluk" },
  { key: "address", label: "Address" },
  { key: "emergency_contact", label: "Emergency Contact" },
  { key: "designation", label: "Designation" },
  { key: "aadhar_number", label: "Aadhar Number" },
  { key: "source", label: "Registered By" },
  { key: "payment_status", label: "Payment Status" },
  { key: "payment_amount", label: "Payment Amount" },
  { key: "valid_from", label: "Valid From" },
  { key: "valid_until", label: "Valid Until" },
  { key: "created_at", label: "Registered On" },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const load = useServerFn(listMembers);
  const remove = useServerFn(deleteMember);
  const [token, setToken] = useState("");
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MemberRecord | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(
    async (activeToken: string) => {
      try {
        setMembers(await load({ data: { token: activeToken } }));
      } catch {
        sessionStorage.removeItem("akapbks-admin-token");
        void navigate({ to: "/admin" });
      }
    },
    [load, navigate],
  );

  useEffect(() => {
    const stored = sessionStorage.getItem("akapbks-admin-token");
    if (!stored) {
      void navigate({ to: "/admin" });
      return;
    }
    setToken(stored);
    void refresh(stored);
  }, [navigate, refresh]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return members;
    return members.filter((m) =>
      [m.membership_id, m.full_name, m.phone, m.designation, m.district]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [members, query]);

  function downloadCsv() {
    const header = FIELDS.map((f) => f.label).join(",");
    const rows = members.map((member) =>
      FIELDS.map((field) => `"${String(member[field.key] ?? "").replace(/"/g, '""')}"`).join(","),
    );
    const blob = new Blob([`${header}\n${rows.join("\n")}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `akapbks-members-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function downloadDetailPdf() {
    if (!detailRef.current || !selected) return;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(detailRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const width = 190;
    const height = (canvas.height / canvas.width) * width;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 10, 12, width, height);
    pdf.save(`${selected.membership_id}-details.pdf`);
  }

  async function handleDelete(member: MemberRecord) {
    if (!window.confirm(`Delete ${member.full_name} (${member.membership_id})?`)) return;
    try {
      await remove({ data: { token, id: member.id } });
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setSelected(null);
      toast.success("ಸದಸ್ಯರನ್ನು ಅಳಿಸಲಾಗಿದೆ / Member deleted");
    } catch {
      toast.error("ಅಳಿಸಲು ಆಗಲಿಲ್ಲ / Could not delete member");
    }
  }

  function signOut() {
    sessionStorage.removeItem("akapbks-admin-token");
    void navigate({ to: "/admin" });
  }

  return (
    <div className="mandala-bg flex min-h-screen flex-col">
      <OrgHeader />

      <div className="border-b border-border bg-secondary/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium underline">
              Home
            </Link>
            <span className="text-sm font-semibold text-maroon">
              ಆಡ್ಮಿನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ / Admin Dashboard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowRegister(true)}>Selected People Registration</Button>
            <Button variant="outline" onClick={signOut}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <BearersCarousel />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12">
        <div className="panel p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Input
              placeholder="Search name / ID / phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-xs"
            />
            <span className="text-sm font-medium text-maroon">
              {filtered.length} members / selected people / ಸದಸ್ಯರು
            </span>
            <Button variant="outline" onClick={downloadCsv} disabled={!members.length}>
              Download All / ಎಲ್ಲಾ ಡೌನ್‌ಲೋಡ್
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member) => (
                  <TableRow
                    key={member.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(member)}
                  >
                    <TableCell className="font-medium">{member.membership_id}</TableCell>
                    <TableCell>{member.full_name}</TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>{member.designation}</TableCell>
                    <TableCell>
                      {member.payment_status === "free"
                        ? "Free"
                        : `₹${member.payment_amount} ${member.payment_status}`}
                    </TableCell>
                    <TableCell>{formatDate(member.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(member);
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      ಯಾವುದೇ ನೋಂದಣಿ ಇಲ್ಲ / No registrations yet
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ಸದಸ್ಯರ ವಿವರಗಳು / Member Details</DialogTitle>
            <DialogDescription>{selected?.membership_id}</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-6">
              <div ref={detailRef} className="bg-card p-4">
                <div className="mb-3 flex items-center gap-3">
                  <img src={LOGO_URL} alt="" className="size-12 rounded-full" />
                  <div>
                    <p className="text-sm font-semibold text-maroon">{ORG.nameKn}</p>
                    <p className="text-xs">{ORG.nameEn}</p>
                  </div>
                  {selected.photo_url ? (
                    <img
                      src={selected.photo_url}
                      alt=""
                      className="ml-auto h-20 w-16 rounded border border-gold object-cover"
                    />
                  ) : null}
                </div>
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    {FIELDS.map((field) => (
                      <tr key={field.key} className="border border-border">
                        <th className="w-1/3 border border-border bg-secondary p-2 text-left text-maroon">
                          {field.label}
                        </th>
                        <td className="border border-border p-2">
                          {String(selected[field.key] ?? "-")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={downloadDetailPdf}>Download details PDF</Button>
                <Button variant="outline" onClick={() => void handleDelete(selected)}>
                  Delete member
                </Button>
              </div>
              <IdCard member={selected} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selected People Registration</DialogTitle>
            <DialogDescription>ಪುರೋಹಿತರ ನೋಂದಣಿ ನಮೂನೆ</DialogDescription>
          </DialogHeader>
          <RegistrationForm
            mode="admin"
            adminToken={token}
            onRegistered={() => void refresh(token)}
          />
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
