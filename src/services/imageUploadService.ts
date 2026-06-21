import { DEFAULT_COTIZACION_IMAGE } from '../constants/images';
import { compressImageForUpload } from '../utils/compressImage';

const GOOGLE_DRIVE_UPLOAD_URL = import.meta.env.VITE_GOOGLE_DRIVE_UPLOAD_URL as string | undefined;
const GOOGLE_DRIVE_FOLDER_ID = '10uF_tAe33O_lajM-o-SDOJUON0uUP8qy';

interface UploadResult {
  url: string;
  fileId?: string;
}

interface GasUploadResponse {
  success: boolean;
  url?: string;
  fileId?: string;
  error?: string;
}

const getUploadUrl = (): string => {
  if (import.meta.env.DEV) {
    return '/api/drive-upload';
  }
  return GOOGLE_DRIVE_UPLOAD_URL!;
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const parseGasResponseText = (text: string): GasUploadResponse => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Respuesta vacía del servidor de Google Drive');
  }

  try {
    return JSON.parse(trimmed) as GasUploadResponse;
  } catch {
    const match = trimmed.match(/\{[\s\S]*"success"[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as GasUploadResponse;
    }
    throw new Error('No se pudo leer la respuesta del servidor');
  }
};

const uploadViaFetch = async (payload: string): Promise<GasUploadResponse> => {
  const response = await fetch(getUploadUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: payload,
  });

  const text = await response.text();
  const data = parseGasResponseText(text);

  if (!data.success) {
    throw new Error(data.error || 'Error al subir a Google Drive');
  }

  return data;
};

const uploadViaIframe = (payload: string): Promise<GasUploadResponse> =>
  new Promise((resolve, reject) => {
    if (!GOOGLE_DRIVE_UPLOAD_URL) {
      reject(new Error('URL de Google Drive no configurada'));
      return;
    }

    const iframeName = `gas-upload-${Date.now()}`;
    const iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.style.display = 'none';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${GOOGLE_DRIVE_UPLOAD_URL}?mode=iframe`;
    form.target = iframeName;
    form.style.display = 'none';

    const payloadInput = document.createElement('input');
    payloadInput.type = 'hidden';
    payloadInput.name = 'payload';
    payloadInput.value = payload;
    form.appendChild(payloadInput);

    const modeInput = document.createElement('input');
    modeInput.type = 'hidden';
    modeInput.name = 'mode';
    modeInput.value = 'iframe';
    form.appendChild(modeInput);

    document.body.appendChild(form);

    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
      iframe.remove();
      form.remove();
    };

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };

    const timeout = window.setTimeout(() => {
      finish(() =>
        reject(
          new Error(
            'Tiempo de espera agotado. Verifica que la implementación tenga acceso "Cualquier persona" y "Ejecutar como: Yo".'
          )
        )
      );
    }, 60000);

    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string;
        success?: boolean;
        url?: string;
        fileId?: string;
        error?: string;
      };
      if (data?.type !== 'gas-upload-result') return;

      finish(() => {
        if (data.success && data.url) {
          resolve({ success: true, url: data.url, fileId: data.fileId });
        } else {
          reject(new Error(data.error || 'Error al subir a Google Drive'));
        }
      });
    };

    window.addEventListener('message', onMessage);
    form.submit();
  });

export const uploadCotizacionImage = async (
  file: File,
  cotizacionNombre: string
): Promise<UploadResult> => {
  if (!GOOGLE_DRIVE_UPLOAD_URL) {
    throw new Error(
      'No está configurada la subida a Google Drive. Agrega VITE_GOOGLE_DRIVE_UPLOAD_URL en tu archivo .env'
    );
  }

  const compressedFile = await compressImageForUpload(file);
  const base64Data = await fileToBase64(compressedFile);
  const timestamp = Date.now();
  const safeName = cotizacionNombre.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s_-]/g, '').trim() || 'cotizacion';
  const extension = compressedFile.name.split('.').pop() || 'jpg';
  const fileName = `${safeName}_${timestamp}.${extension}`;

  const payload = JSON.stringify({
    fileName,
    mimeType: compressedFile.type,
    base64Data,
    folderId: GOOGLE_DRIVE_FOLDER_ID,
  });

  const data = import.meta.env.DEV
    ? await uploadViaFetch(payload)
    : await uploadViaIframe(payload);

  if (!data.url) {
    throw new Error('No se recibió la URL de la imagen');
  }

  return { url: data.url, fileId: data.fileId };
};

export const getCotizacionImageUrl = (imagenUrl?: string, imagenThumbnail?: string): string =>
  imagenUrl || imagenThumbnail || DEFAULT_COTIZACION_IMAGE;
