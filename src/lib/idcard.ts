export function calcAge(dob: string) {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return String(age);
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
}

async function snapshot(node: HTMLElement) {
  const html2canvas = (await import("html2canvas")).default;
  return html2canvas(node, { scale: 3, backgroundColor: "#ffffff", useCORS: true });
}

export async function downloadCardPdf(
  front: HTMLElement,
  back: HTMLElement,
  fileName: string,
) {
  const { jsPDF } = await import("jspdf");
  const [frontCanvas, backCanvas] = [await snapshot(front), await snapshot(back)];
  const width = 85.6;
  const height = 54;
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [width, height] });
  pdf.addImage(frontCanvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, width, height);
  pdf.addPage([width, height], "landscape");
  pdf.addImage(backCanvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, width, height);
  pdf.save(`${fileName}.pdf`);
}

export async function downloadCardImages(front: HTMLElement, back: HTMLElement, fileName: string) {
  for (const [side, node] of [
    ["front", front],
    ["back", back],
  ] as const) {
    const canvas = await snapshot(node);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${fileName}-${side}.png`;
    link.click();
  }
}

/** Downscale and compress a chosen photo to a small data URL. */
export function fileToDataUrl(file: File, maxSize = 700): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the photo"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not read the photo"));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not process the photo"));
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
