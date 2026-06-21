import React, { useRef, useCallback } from 'react';
import { Box, IconButton, TextField, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';

interface AiChatInputProps {
  disabled?: boolean;
  pendingPreview?: string;
  onSend: (text: string) => void;
  onAttach: (file: File) => void;
  onClearAttachment: () => void;
}

export const AiChatInput: React.FC<AiChatInputProps> = ({
  disabled,
  pendingPreview,
  onSend,
  onAttach,
  onClearAttachment,
}) => {
  const [text, setText] = React.useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !pendingPreview) return;
    onSend(trimmed);
    setText('');
  }, [text, pendingPreview, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onAttach(file);
      e.target.value = '';
    },
    [onAttach]
  );

  return (
    <Box sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 1 }}>
      {pendingPreview && (
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 1, ml: 0.5 }}>
          <Box
            component="img"
            src={pendingPreview}
            alt="Imagen adjunta"
            sx={{ height: 72, width: 72, objectFit: 'cover', borderRadius: 1.5, border: 1, borderColor: 'divider' }}
          />
          <IconButton
            size="small"
            onClick={onClearAttachment}
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' },
            }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={handleFileChange}
        />
        <IconButton
          color="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Adjuntar imagen"
        >
          <ImageIcon />
        </IconButton>

        <TextField
          fullWidth
          multiline
          maxRows={3}
          size="small"
          placeholder="Describe el mueble o envía una foto..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  onClick={handleSubmit}
                  disabled={disabled || (!text.trim() && !pendingPreview)}
                  aria-label="Enviar"
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: 2, pr: 0.5 },
          }}
        />
      </Box>
    </Box>
  );
};
