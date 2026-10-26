// Favicon Management and Browser Synchronization Helper for NightVerse

export const DEFAULT_FAVICON_URL = "/favicon.svg";
export const MAX_FAVICON_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const ALLOWED_FAVICON_EXTENSIONS = ["ico", "png", "svg"] as const;
export type FaviconExtension = typeof ALLOWED_FAVICON_EXTENSIONS[number];

/**
 * Validates favicon file format (.ico, .png, .svg) and size (<= 2MB)
 */
export function validateFaviconFile(file: File): { isValid: boolean; error?: string; extension?: FaviconExtension } {
  if (!file) {
    return { isValid: false, error: "Silakan pilih file favicon terlebih dahulu." };
  }

  // Check file size (max 2MB)
  if (file.size > MAX_FAVICON_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `Ukuran file (${sizeInMB} MB) melebihi batas maksimum 2MB.`
    };
  }

  // Extract and check extension
  const fileName = file.name.toLowerCase();
  const extMatch = fileName.match(/\.([a-z0-9]+)$/);
  const ext = (extMatch ? extMatch[1] : "") as FaviconExtension;

  const validMimes = [
    "image/x-icon",
    "image/vnd.microsoft.icon",
    "image/ico",
    "image/png",
    "image/svg+xml",
  ];

  const hasValidExt = ALLOWED_FAVICON_EXTENSIONS.includes(ext);
  const hasValidMime = validMimes.includes(file.type.toLowerCase());

  if (!hasValidExt && !hasValidMime) {
    return {
      isValid: false,
      error: "Format file tidak didukung. Harap unggah file dengan format .ico, .png, atau .svg."
    };
  }

  const resolvedExt: FaviconExtension = hasValidExt 
    ? ext 
    : (file.type.includes("svg") ? "svg" : file.type.includes("ico") ? "ico" : "png");

  return {
    isValid: true,
    extension: resolvedExt
  };
}

/**
 * Applies favicon to browser head links with cache busting and automatic fallback
 */
export function updateBrowserFavicon(url?: string, updatedAt?: number): void {
  if (typeof document === "undefined") return;

  const rawUrl = url && url.trim() ? url.trim() : DEFAULT_FAVICON_URL;
  
  // Format cache busted URL (unless it's a data URI)
  let finalUrl = rawUrl;
  if (!rawUrl.startsWith("data:")) {
    const separator = rawUrl.includes("?") ? "&" : "?";
    const buster = updatedAt && updatedAt > 0 ? updatedAt : Date.now();
    // Only append if it doesn't already have ?v= matching
    if (!rawUrl.includes("v=")) {
      finalUrl = `${rawUrl}${separator}v=${buster}`;
    }
  }

  // Determine MIME type based on extension
  let mimeType = "image/svg+xml";
  if (rawUrl.includes(".ico") || rawUrl.includes("image/x-icon")) {
    mimeType = "image/x-icon";
  } else if (rawUrl.includes(".png") || rawUrl.includes("image/png")) {
    mimeType = "image/png";
  }

  const applyToLink = (rel: string, id: string) => {
    let link = document.querySelector(`link#${id}`) as HTMLLinkElement | null;
    if (!link) {
      link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    }
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.type = mimeType;
    link.href = finalUrl;
    return link;
  };

  const primaryLink = applyToLink("icon", "app-favicon");
  applyToLink("shortcut icon", "app-shortcut-favicon");
  applyToLink("apple-touch-icon", "app-apple-favicon");

  // Fallback verification: test if image loads, else fall back to default
  if (!rawUrl.startsWith("data:") && rawUrl !== DEFAULT_FAVICON_URL) {
    const testImg = new Image();
    testImg.onerror = () => {
      console.warn("[NightVerse Favicon] Failed to load custom favicon from:", finalUrl, "- Reverting to default NightVerse icon.");
      if (primaryLink) {
        primaryLink.type = "image/svg+xml";
        primaryLink.href = DEFAULT_FAVICON_URL;
      }
      const shortcut = document.getElementById("app-shortcut-favicon") as HTMLLinkElement | null;
      if (shortcut) {
        shortcut.type = "image/svg+xml";
        shortcut.href = DEFAULT_FAVICON_URL;
      }
    };
    testImg.src = finalUrl;
  }
}
