import { jsPDF } from "jspdf";
import { Capacitor } from "@capacitor/core";

export interface BusinessReportData {
  businessName: string;
  rangeLabel: string;
  stats: { totalRedemptions: number; thisMonth: number; lastMonth: number; uniqueCustomers: number };
  monthChange: number;
  engagement: {
    profileViews: number;
    offerViews: number;
    socialClicks: number;
    contactClicks: number;
    directoryImpressions: number;
    socialBreakdown: Record<string, number>;
    contactBreakdown: Record<string, number>;
  };
  daily: { date: string; redemptions: number }[];
  topOffers: { title: string; redemptions: number; discount: string }[];
  customers: { member_number: string; member_name: string | null; pet_names: string | null; total_redemptions: number; last_visit: string }[];
}

// Brand palette for the printed report
const NAVY: [number, number, number] = [26, 26, 46];
const BLUE: [number, number, number] = [59, 130, 246];
const TEAL: [number, number, number] = [20, 184, 166];
const AMBER: [number, number, number] = [245, 158, 11];
const PINK: [number, number, number] = [236, 72, 153];
const GREY: [number, number, number] = [100, 116, 139];
const LIGHT: [number, number, number] = [241, 245, 249];
const PALETTE = [BLUE, TEAL, AMBER, PINK, [139, 92, 246] as [number, number, number], GREY];

// Built-in PDF fonts are Latin-only — strip characters they can't render (emoji, Greek, etc.)
const safe = (s: string | null | undefined) =>
  (s ?? "").normalize("NFKD").replace(/[^\x20-\x7E€]/g, "").replace(/\s+/g, " ").trim();

const loadLogo = async (): Promise<string | null> => {
  try {
    const res = await fetch("/favicon.svg");
    if (!res.ok) return null;
    // Reuse the brand dog artwork without the favicon's background frame.
    const svg = new DOMParser().parseFromString(await res.text(), "image/svg+xml").documentElement;
    svg.querySelector("rect")?.remove();
    svg.setAttribute("viewBox", "6 6 22 22");
    svg.setAttribute("width", "256");
    svg.setAttribute("height", "256");
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    return await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const context = canvas.getContext("2d");
          if (!context) { resolve(null); return; }
          context.drawImage(image, 0, 0, 256, 256);
          resolve(canvas.toDataURL("image/png"));
        } catch { resolve(null); }
        finally { URL.revokeObjectURL(url); }
      };
      image.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      image.src = url;
    });
  } catch {
    return null;
  }
};

export async function buildBusinessReportPdf(d: BusinessReportData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 14;
  let y = 0;

  // Header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 34, "F");
  const logo = await loadLogo();
  if (logo) {
    try {
      const props = doc.getImageProperties(logo);
      const h = 22;
      doc.addImage(logo, "PNG", M, 6, (props.width / props.height) * h, h);
    } catch { /* ignore logo errors */ }
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Business Performance Report", W - M, 15, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(safe(d.businessName) || "Your business", W - M, 21, { align: "right" });
  doc.text(`${d.rangeLabel}  |  Generated ${new Date().toLocaleDateString("en-GB")}`, W - M, 27, { align: "right" });
  y = 44;

  const sectionTitle = (title: string) => {
    if (y > 260) { doc.addPage(); y = 18; }
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, M, y);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.6);
    doc.line(M, y + 2, M + 18, y + 2);
    y += 8;
  };

  const statCards = (cards: { label: string; value: string; color: [number, number, number]; sub?: string }[]) => {
    const gap = 4;
    const cw = (W - 2 * M - gap * (cards.length - 1)) / cards.length;
    cards.forEach((c, i) => {
      const x = M + i * (cw + gap);
      doc.setFillColor(...LIGHT);
      doc.roundedRect(x, y, cw, 24, 2.5, 2.5, "F");
      doc.setFillColor(...c.color);
      doc.roundedRect(x, y, 2.2, 24, 1, 1, "F");
      doc.setTextColor(...GREY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(c.label, x + 6, y + 7);
      doc.setTextColor(...NAVY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(c.value, x + 6, y + 16);
      if (c.sub) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...c.color);
        doc.text(c.sub, x + 6, y + 21);
      }
    });
    y += 30;
  };

  // Redemptions
  sectionTitle("Redemptions");
  const sign = d.monthChange > 0 ? "+" : "";
  statCards([
    { label: "Total redemptions", value: String(d.stats.totalRedemptions), color: BLUE },
    { label: "This month", value: String(d.stats.thisMonth), color: TEAL, sub: `${sign}${d.monthChange}% vs last month` },
    { label: "Last month", value: String(d.stats.lastMonth), color: AMBER },
    { label: "Unique customers", value: String(d.stats.uniqueCustomers), color: PINK },
  ]);

  // Bar chart of redemptions over time
  sectionTitle(`Redemptions over time (${d.rangeLabel})`);
  {
    // Group into at most ~30 bars so long ranges stay readable
    const groupSize = Math.max(1, Math.ceil(d.daily.length / 30));
    const bars: { label: string; value: number }[] = [];
    for (let i = 0; i < d.daily.length; i += groupSize) {
      const chunk = d.daily.slice(i, i + groupSize);
      bars.push({ label: chunk[0].date.slice(5).split("-").reverse().join("/"), value: chunk.reduce((s, c) => s + c.redemptions, 0) });
    }
    const chartH = 48;
    const chartW = W - 2 * M;
    const max = Math.max(1, ...bars.map((b) => b.value));
    doc.setFillColor(...LIGHT);
    doc.roundedRect(M, y, chartW, chartH + 12, 2.5, 2.5, "F");
    const innerX = M + 8, innerW = chartW - 12, baseY = y + chartH + 2;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    [0, 0.5, 1].forEach((f) => {
      const ly = baseY - f * (chartH - 6);
      doc.line(innerX, ly, innerX + innerW, ly);
      doc.setFontSize(6.5); doc.setTextColor(...GREY); doc.setFont("helvetica", "normal");
      doc.text(String(Math.round(max * f)), innerX - 2, ly + 1, { align: "right" });
    });
    const slot = innerW / Math.max(1, bars.length);
    const bw = Math.max(1, slot * 0.65);
    bars.forEach((b, i) => {
      const h = (b.value / max) * (chartH - 6);
      const bx = innerX + i * slot + (slot - bw) / 2;
      doc.setFillColor(...BLUE);
      if (h > 0) doc.rect(bx, baseY - h, bw, h, "F");
      const every = Math.ceil(bars.length / 8);
      if (i % every === 0) {
        doc.setFontSize(6); doc.setTextColor(...GREY);
        doc.text(b.label, bx + bw / 2, baseY + 5, { align: "center" });
      }
    });
    y += chartH + 18;
  }

  // Engagement
  sectionTitle(`Visibility & engagement (${d.rangeLabel})`);
  statCards([
    { label: "Directory views", value: String(d.engagement.directoryImpressions), color: BLUE },
    { label: "Profile views", value: String(d.engagement.profileViews), color: TEAL },
    { label: "Offer views", value: String(d.engagement.offerViews), color: AMBER },
    { label: "Social clicks", value: String(d.engagement.socialClicks), color: PINK },
    { label: "Contact clicks", value: String(d.engagement.contactClicks), color: [139, 92, 246] },
  ]);

  // Horizontal bar breakdowns side by side
  const breakdown = (title: string, data: Record<string, number>, x: number, w: number, startY: number) => {
    let by = startY;
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...NAVY);
    doc.text(title, x, by); by += 5;
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (!entries.length) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GREY);
      doc.text("No clicks yet in this period", x, by + 3);
      return by + 8;
    }
    const max = Math.max(...entries.map((e) => e[1]));
    entries.forEach(([k, v], i) => {
      const label = safe(k).replace(/_/g, " ");
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GREY);
      doc.text(label.charAt(0).toUpperCase() + label.slice(1), x, by + 3);
      const barX = x + 24, barW = w - 34;
      doc.setFillColor(...LIGHT); doc.roundedRect(barX, by, barW, 4, 1, 1, "F");
      doc.setFillColor(...PALETTE[i % PALETTE.length]);
      doc.roundedRect(barX, by, Math.max(1.5, (v / max) * barW), 4, 1, 1, "F");
      doc.setTextColor(...NAVY); doc.text(String(v), x + w, by + 3, { align: "right" });
      by += 7;
    });
    return by;
  };
  {
    const half = (W - 2 * M - 8) / 2;
    const end1 = breakdown("Social clicks by platform", d.engagement.socialBreakdown, M, half, y);
    const end2 = breakdown("Contact clicks by type", d.engagement.contactBreakdown, M + half + 8, half, y);
    y = Math.max(end1, end2) + 6;
  }

  // Tables
  const table = (headers: string[], widths: number[], rows: string[][], empty: string) => {
    const rowH = 7;
    if (y > 265) { doc.addPage(); y = 18; }
    doc.setFillColor(...NAVY);
    doc.rect(M, y, W - 2 * M, rowH, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    let x = M + 3;
    headers.forEach((h, i) => { doc.text(h, x, y + 4.8); x += widths[i]; });
    y += rowH;
    doc.setFont("helvetica", "normal");
    if (!rows.length) {
      doc.setTextColor(...GREY); doc.text(empty, M + 3, y + 5); y += rowH + 4; return;
    }
    rows.forEach((r, ri) => {
      if (y > 280) { doc.addPage(); y = 18; }
      if (ri % 2 === 0) { doc.setFillColor(...LIGHT); doc.rect(M, y, W - 2 * M, rowH, "F"); }
      doc.setTextColor(...NAVY);
      let cx = M + 3;
      r.forEach((cell, i) => {
        const txt = doc.splitTextToSize(cell, widths[i] - 3)[0] ?? "";
        doc.text(txt, cx, y + 4.8);
        cx += widths[i];
      });
      y += rowH;
    });
    y += 6;
  };

  sectionTitle("Top offers");
  table(
    ["Offer", "Discount", "Redemptions"],
    [120, 30, 32],
    d.topOffers.map((o) => [safe(o.title) || "Offer", safe(o.discount), String(o.redemptions)]),
    "No redemptions yet"
  );

  sectionTitle("Top customers");
  table(
    ["Member", "Name", "Pets", "Visits", "Last visit"],
    [34, 46, 52, 20, 30],
    d.customers.map((c) => [
      safe(c.member_number) || "Birthday",
      safe(c.member_name) || "-",
      safe(c.pet_names) || "-",
      String(c.total_redemptions),
      new Date(c.last_visit).toLocaleDateString("en-GB"),
    ]),
    "No customers yet"
  );

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5); doc.setTextColor(...GREY); doc.setFont("helvetica", "normal");
    doc.text("Wooffy  |  wooffy.app  |  hello@wooffy.app", M, 290);
    doc.text(`Page ${p} of ${pages}`, W - M, 290, { align: "right" });
  }
  return doc;
}

/** Save the PDF: share sheet inside the iOS app, normal download on the web. */
export async function deliverPdf(doc: jsPDF, fileName: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const base64 = doc.output("datauristring").split(",")[1];
    const saved = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
    await Share.share({ title: fileName, url: saved.uri });
    return;
  }
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke later — revoking immediately cancels the download in some browsers (Safari)
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
