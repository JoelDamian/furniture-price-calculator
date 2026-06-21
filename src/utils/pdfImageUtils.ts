export const extractDriveFileId = (url: string): string | null => {
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const fetchImageAsDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return blobToDataUrl(blob);
  } catch {
    return null;
  }
};

/** Resuelve una imagen embebible para html2canvas / PDF (sin CORS) */
export const resolveImageForPdf = async (
  imagenUrl?: string,
  imagenThumbnail?: string
): Promise<string | null> => {
  if (imagenThumbnail) return imagenThumbnail;
  if (!imagenUrl) return null;

  const fileId = extractDriveFileId(imagenUrl);
  if (fileId) {
    const proxyUrl = import.meta.env.DEV
      ? `/api/drive-image?id=${fileId}`
      : null;

    if (proxyUrl) {
      const dataUrl = await fetchImageAsDataUrl(proxyUrl);
      if (dataUrl) return dataUrl;
    }
  }

  return fetchImageAsDataUrl(imagenUrl);
};

/** URL preferida para mostrar en UI (miniatura local si Drive falla) */
export const getDisplayImageUrl = (
  imagenUrl?: string,
  imagenThumbnail?: string
): string | undefined => imagenUrl || imagenThumbnail;
