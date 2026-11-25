// Application Logo Validation, Optimization, and URL Safety Helper for NightVerse

export const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB raw upload limit
export const MAX_INLINE_LOGO_DATA_URI_CHARS = 350_000; // ~250KB binary -> compact for Supabase Realtime & PostgREST
export const ALLOWED_LOGO_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "svg"] as const;
export type LogoExtension = typeof ALLOWED_LOGO_EXTENSIONS[number];

export function validateLogoUrl(rawUrl?: string | null): { isValid: boolean; normalized?: string; error?: string } {
  if (!rawUrl || !rawUrl.trim()) {
    return { isValid: true, normalized: undefined };
  }

  const trimmed = rawUrl.trim();
  const lower = trimmed.toLowerCase();

  // Block dangerous schemes
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:text/html") ||
    lower.startsWith("data:application/")
  ) {
    return {
      isValid: false,
      error: "URL logo menggunakan skema yang tidak diizinkan.",
    };
  }

  // Allow safe data:image/* URIs
  if (lower.startsWith("data:")) {
    if (!/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml)(;|,)/i.test(trimmed)) {
      return {
        isValid: false,
        error: "Data URL logo harus berupa gambar valid (PNG, JPG, WEBP, GIF, atau SVG).",
      };
    }
    return { isValid: true, normalized: trimmed };
  }

  // Allow root-relative paths (e.g. /api/logo?..., /assets/...) excluding protocol-relative //
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return { isValid: true, normalized: trimmed };
  }

  // Allow http:// or https:// URLs
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return { isValid: true, normalized: trimmed };
    }
  } catch {
    // Invalid URL format
  }

  return {
    isValid: false,
    error: "Masukkan URL gambar yang valid (https://..., /..., atau unggah file gambar).",
  };
}

export function validateLogoFile(file: File): { isValid: boolean; error?: string; extension?: LogoExtension } {
  if (!file) {
    return { isValid: false, error: "Silakan pilih file logo terlebih dahulu." };
  }

  if (file.size <= 0) {
    return { isValid: false, error: "File logo kosong atau tidak valid." };
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `Ukuran file (${sizeInMB} MB) melebihi batas maksimum 5MB.`,
    };
  }

  const fileName = file.name.toLowerCase();
  const extMatch = fileName.match(/\.([a-z0-9]+)$/);
  const ext = (extMatch ? extMatch[1] : "") as LogoExtension;
  const mime = (file.type || "").toLowerCase();

  const validMimes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];

  const hasValidExt = ALLOWED_LOGO_EXTENSIONS.includes(ext);
  const hasValidMime = validMimes.includes(mime);

  if (!hasValidExt && !hasValidMime) {
    return {
      isValid: false,
      error: "Format logo tidak didukung. Gunakan PNG, JPG, WEBP, GIF, atau SVG.",
    };
  }

  const resolvedExt: LogoExtension = hasValidExt
    ? ext
    : mime.includes("svg")
      ? "svg"
      : mime.includes("gif")
        ? "gif"
        : mime.includes("webp")
          ? "webp"
          : mime.includes("jpeg") || mime.includes("jpg")
            ? "jpg"
            : "png";

  return {
    isValid: true,
    extension: resolvedExt,
  };
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Gagal membaca file gambar logo."));
    };
    reader.onerror = () => reject(new Error("Gagal membaca file gambar logo."));
    reader.readAsDataURL(file);
  });

/**
 * Optimizes static logos up to 512x512 while preserving transparency (WebP/PNG/SVG),
 * returning a compact data URL so logos sync seamlessly across Supabase & all app views.
 */
export async function prepareLogoUploadDataUrl(
  file: File,
  extension: LogoExtension
): Promise<{ dataUrl: string; mimeType: string; extension: LogoExtension }> {
  const rawDataUrl = await readFileAsDataUrl(file);

  if (extension === "svg" || file.type === "image/svg+xml") {
    return { dataUrl: rawDataUrl, mimeType: "image/svg+xml", extension: "svg" };
  }

  if (extension === "gif" || file.type === "image/gif") {
    return { dataUrl: rawDataUrl, mimeType: "image/gif", extension: "gif" };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 512;
      let { width, height } = img;

      if (width <= maxDim && height <= maxDim && rawDataUrl.length <= MAX_INLINE_LOGO_DATA_URI_CHARS) {
        resolve({
          dataUrl: rawDataUrl,
          mimeType: file.type || (extension === "jpg" || extension === "jpeg" ? "image/jpeg" : `image/${extension}`),
          extension,
        });
        return;
      }

      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ dataUrl: rawDataUrl, mimeType: file.type || "image/png", extension });
        return;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP (supports alpha transparency cleanly at small byte size)
      try {
        const webp = canvas.toDataURL("image/webp", 0.9);
        if (webp.startsWith("data:image/webp")) {
          if (webp.length < rawDataUrl.length || rawDataUrl.length > MAX_INLINE_LOGO_DATA_URI_CHARS) {
            resolve({ dataUrl: webp, mimeType: "image/webp", extension: "webp" });
            return;
          }
        }
      } catch {
        // Fallback below
      }

      // Preserve transparency with PNG for PNG/WebP, or JPEG for JPEG photos
      const isOpaqueJpeg = extension === "jpg" || extension === "jpeg";
      try {
        const encoded = isOpaqueJpeg
          ? canvas.toDataURL("image/jpeg", 0.88)
          : canvas.toDataURL("image/png");
        resolve({
          dataUrl: encoded.length < rawDataUrl.length ? encoded : rawDataUrl,
          mimeType: isOpaqueJpeg ? "image/jpeg" : "image/png",
          extension: isOpaqueJpeg ? "jpg" : "png",
        });
      } catch {
        resolve({ dataUrl: rawDataUrl, mimeType: file.type || "image/png", extension });
      }
    };
    img.onerror = () =>
      resolve({ dataUrl: rawDataUrl, mimeType: file.type || "image/png", extension });
    img.src = rawDataUrl;
  });
}
