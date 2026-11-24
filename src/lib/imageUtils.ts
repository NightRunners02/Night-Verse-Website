// Client-side image compression utility for lightweight SQL JSONB storage
// Preserves animated GIFs below maxGifBytes while resizing/compressing static avatars & banners.

export interface CompressOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
  maxGifBytes?: number;
}

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read file as Data URL"));
    };
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(file);
  });

export async function compressImageFile(file: File, options: CompressOptions): Promise<string> {
  const { maxWidth, maxHeight, quality = 0.82, maxGifBytes = 2.5 * 1024 * 1024 } = options;

  if (!file.type.startsWith("image/")) {
    throw new Error("File yang dipilih bukan gambar yang valid.");
  }

  // Keep GIF animations intact if size is reasonable
  if (file.type === "image/gif") {
    if (file.size > maxGifBytes) {
      throw new Error(`Ukuran GIF terlalu besar (maksimal ${(maxGifBytes / (1024 * 1024)).toFixed(1)} MB).`);
    }
    return readAsDataUrl(file);
  }

  const rawDataUrl = await readAsDataUrl(file);

  // Skip canvas re-encoding for SVGs
  if (file.type === "image/svg+xml") {
    return rawDataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      try {
        const webp = canvas.toDataURL("image/webp", quality);
        if (webp.startsWith("data:image/webp")) {
          resolve(webp.length < rawDataUrl.length ? webp : rawDataUrl);
          return;
        }
      } catch {
        // Fallback to JPEG below
      }
      try {
        const jpeg = canvas.toDataURL("image/jpeg", quality);
        resolve(jpeg.length < rawDataUrl.length ? jpeg : rawDataUrl);
      } catch {
        resolve(rawDataUrl);
      }
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}
