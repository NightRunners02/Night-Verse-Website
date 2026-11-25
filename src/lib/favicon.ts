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

function resolveFaviconMimeType(rawUrl: string): string | null {
  const lower = rawUrl.toLowerCase();
  if (lower.startsWith("data:")) {
    if (lower.startsWith("data:image/x-icon") || lower.startsWith("data:image/vnd.microsoft.icon") || lower.startsWith("data:image/ico")) {
      return "image/x-icon";
    }
    if (lower.startsWith("data:image/png")) {
      return "image/png";
    }
    if (lower.startsWith("data:image/svg+xml")) {
      return "image/svg+xml";
    }
    return null;
  }

  if (/[?&]ext=ico(?:&|$)/i.test(lower) || /\.ico(?:[?#]|$)/i.test(lower)) {
    return "image/x-icon";
  }
  if (/[?&]ext=png(?:&|$)/i.test(lower) || /\.png(?:[?#]|$)/i.test(lower)) {
    return "image/png";
  }
  if (/[?&]ext=svg(?:&|$)/i.test(lower) || /\.svg(?:[?#]|$)/i.test(lower)) {
    return "image/svg+xml";
  }
  return null;
}

function buildCacheBustedFaviconUrl(rawUrl: string, updatedAt?: number): string {
  if (rawUrl.startsWith("data:")) {
    return rawUrl;
  }

  const buster = updatedAt && updatedAt > 0 ? updatedAt : 0;
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const parsed = new URL(rawUrl, origin);
    if (buster > 0) {
      parsed.searchParams.set("v", String(buster));
    } else if (!parsed.searchParams.has("v") && rawUrl !== DEFAULT_FAVICON_URL) {
      parsed.searchParams.set("v", String(Date.now()));
    }
    if (rawUrl.startsWith("/") && !rawUrl.startsWith("//")) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return parsed.toString();
  } catch {
    if (buster <= 0 && rawUrl === DEFAULT_FAVICON_URL) {
      return rawUrl;
    }
    const separator = rawUrl.includes("?") ? "&" : "?";
    const cleanUrl = rawUrl.replace(/([?&])v=[^&]*&?/g, "$1").replace(/[?&]$/, "");
    const nextSep = cleanUrl.includes("?") ? "&" : separator;
    return `${cleanUrl}${nextSep}v=${buster > 0 ? buster : Date.now()}`;
  }
}

/**
 * Applies favicon to browser head links with cache busting and automatic fallback
 */
export function updateBrowserFavicon(url?: string, updatedAt?: number): void {
  if (typeof document === "undefined" || !document.head) return;

  const rawUrl = url && url.trim() ? url.trim() : DEFAULT_FAVICON_URL;
  const finalUrl = buildCacheBustedFaviconUrl(rawUrl, updatedAt);
  const mimeType = resolveFaviconMimeType(rawUrl);

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
    } else {
      link.id = id;
      link.rel = rel;
    }

    if (mimeType) {
      link.type = mimeType;
    } else {
      link.removeAttribute("type");
    }
    link.href = finalUrl;
    return link;
  };

  const primaryLink = applyToLink("icon", "app-favicon");
  const shortcutLink = applyToLink("shortcut icon", "app-shortcut-favicon");
  const appleLink = applyToLink("apple-touch-icon", "app-apple-favicon");

  // Fallback verification: test if image loads, else fall back to default
  const isDefaultUrl = rawUrl === DEFAULT_FAVICON_URL || rawUrl.startsWith(`${DEFAULT_FAVICON_URL}?`);
  if (!rawUrl.startsWith("data:") && !isDefaultUrl) {
    const testImg = new Image();
    testImg.onerror = () => {
      console.warn("[NightVerse Favicon] Failed to load custom favicon from:", finalUrl, "- Reverting to default NightVerse icon.");
      [primaryLink, shortcutLink, appleLink].forEach((el) => {
        if (el) {
          el.type = "image/svg+xml";
          el.href = DEFAULT_FAVICON_URL;
        }
      });
    };
    testImg.src = finalUrl;
  }
}

