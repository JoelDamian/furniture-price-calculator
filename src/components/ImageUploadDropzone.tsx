import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import { uploadCotizacionImage } from '../services/imageUploadService';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from '../constants/images';
import { createThumbnailDataUrl } from '../utils/compressImage';
import { getDisplayImageUrl } from '../utils/pdfImageUtils';

interface ImageUploadDropzoneProps {
  value?: string;
  thumbnail?: string;
  cotizacionNombre: string;
  onChange: (url: string | undefined, thumbnail?: string) => void;
  variant?: 'default' | 'hero';
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  value,
  thumbnail,
  cotizacionNombre,
  onChange,
  variant = 'default',
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | undefined>(
    getDisplayImageUrl(value, thumbnail)
  );
  const [localThumbnail, setLocalThumbnail] = useState<string | undefined>(thumbnail);
  const isHero = variant === 'hero';

  useEffect(() => {
    setPreview(getDisplayImageUrl(value, thumbnail));
    setLocalThumbnail(thumbnail);
  }, [value, thumbnail]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setError(null);
      setUploading(true);

      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      const thumbDataUrl = await createThumbnailDataUrl(file);

      try {
        const result = await uploadCotizacionImage(file, cotizacionNombre || 'cotizacion');
        setPreview(result.url);
        setLocalThumbnail(thumbDataUrl);
        onChange(result.url, thumbDataUrl);
      } catch (err) {
        setPreview(getDisplayImageUrl(value, thumbnail));
        setLocalThumbnail(thumbnail);
        setError(err instanceof Error ? err.message : 'Error al subir la imagen');
      } finally {
        setUploading(false);
        URL.revokeObjectURL(localPreview);
      }
    },
    [cotizacionNombre, onChange, value, thumbnail]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    maxSize: MAX_IMAGE_SIZE_MB * 1024 * 1024,
    multiple: false,
    disabled: uploading,
  });

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setPreview(undefined);
      setLocalThumbnail(undefined);
      onChange(undefined, undefined);
      setError(null);
    },
    [onChange]
  );

  const handleImageError = useCallback(() => {
    if (localThumbnail && preview !== localThumbnail) {
      setPreview(localThumbnail);
    }
  }, [localThumbnail, preview]);

  const borderColor = isDragReject
    ? 'error.main'
    : isDragActive
      ? 'primary.main'
      : isHero
        ? 'grey.200'
        : 'divider';

  return (
    <Box>
      <Box
        {...getRootProps()}
        sx={{
          border: isHero && preview ? 0 : 2,
          borderStyle: 'dashed',
          borderColor,
          borderRadius: 3,
          p: isHero && preview ? 0 : 2,
          textAlign: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          bgcolor: isHero ? 'grey.50' : 'background.paper',
          transition: 'border-color 0.2s, background-color 0.2s',
          position: 'relative',
          minHeight: isHero ? 220 : 160,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          '&:hover': {
            borderColor: preview ? borderColor : 'primary.light',
            bgcolor: preview ? undefined : 'primary.50',
          },
        }}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 4 }}>
            <CircularProgress size={40} color="primary" />
            <Typography variant="body2" color="text.secondary">
              Subiendo imagen...
            </Typography>
          </Box>
        ) : preview ? (
          <Box sx={{ position: 'relative', width: '100%', height: isHero ? 260 : 'auto' }}>
            <Box
              component="img"
              src={preview}
              alt="Vista previa"
              onError={handleImageError}
              data-cotizacion-imagen="true"
              sx={{
                width: '100%',
                height: isHero ? 260 : 'auto',
                maxHeight: isHero ? 260 : 180,
                objectFit: 'cover',
                borderRadius: 3,
                display: 'block',
              }}
            />
            <IconButton
              size="small"
              onClick={handleRemove}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: isHero ? 4 : 2 }}>
            {isDragActive ? (
              <>
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                <Typography variant="body1" color="primary" fontWeight={600}>
                  Suelta la imagen aquí
                </Typography>
              </>
            ) : (
              <>
                <ImageIcon sx={{ fontSize: isHero ? 56 : 48, color: 'primary.light' }} />
                <Typography variant="body1" fontWeight={500}>
                  Arrastra una imagen o haz clic para seleccionar
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  JPG, PNG, WebP o GIF — máx. {MAX_IMAGE_SIZE_MB} MB
                </Typography>
              </>
            )}
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
};
