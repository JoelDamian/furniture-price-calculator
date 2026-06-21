export interface ChatMessageImage {
  mimeType: string;
  data: string;
}

const AI_MAX_SIZE = 1024;
const AI_JPEG_QUALITY = 0.82;

export const fileToChatMessageImage = (file: File): Promise<ChatMessageImage> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Solo se permiten archivos de imagen'));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      const ratio = Math.min(AI_MAX_SIZE / width, AI_MAX_SIZE / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo procesar la imagen'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, AI_JPEG_QUALITY);
      const data = dataUrl.split(',')[1];

      resolve({ mimeType, data });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen'));
    };

    img.src = objectUrl;
  });

export const chatMessageImageToPreviewUrl = (image: ChatMessageImage): string =>
  `data:${image.mimeType};base64,${image.data}`;

export const fileToGenerativePart = (image: ChatMessageImage) => ({
  inlineData: {
    mimeType: image.mimeType,
    data: image.data,
  },
});

export const ACCEPTED_AI_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export const MAX_AI_IMAGE_MB = 5;
