import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Fab,
  Box,
  Paper,
  Typography,
  IconButton,
  Slide,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import { useMaterialStore } from '../../store/materialStore';
import { useCotizacionStore } from '../../store/cotizacionStore';
import { useCotizacionGlobalStore } from '../../store/finalCotizacion';
import { useAccessoryStore } from '../../store/accessoryStore';
import { fetchMaterials } from '../../services/materialService';
import {
  getWelcomeMessage,
  resetAiChat,
  sendAiMessage,
} from '../../services/cotizacionAiService';
import {
  generarPiezasMueble,
  parseQuoteReadyBlock,
  stripQuoteReadyBlock,
  extractQuoteFromConversation,
  CotizacionAiParams,
  ChatMessage,
} from '../../utils/cotizacionAiUtils';
import {
  fileToChatMessageImage,
  chatMessageImageToPreviewUrl,
  MAX_AI_IMAGE_MB,
} from '../../utils/aiImageUtils';
import { AiChatInput } from './AiChatInput';

interface CotizacionAiChatProps {
  onQuoteApplied?: () => void;
}

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
        px: 1,
      }}
    >
      <Box
        sx={{
          maxWidth: '85%',
          px: 1.5,
          py: 1,
          borderRadius: 2,
          bgcolor: isUser ? 'primary.main' : '#fce4ec',
          color: isUser ? 'primary.contrastText' : 'text.primary',
        }}
      >
        {message.image && (
          <Box
            component="img"
            src={chatMessageImageToPreviewUrl(message.image)}
            alt="Imagen enviada"
            sx={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: 160,
              borderRadius: 1,
              mb: message.content ? 1 : 0,
              objectFit: 'cover',
            }}
          />
        )}
        {message.content && (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {message.content}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export const CotizacionAiChat: React.FC<CotizacionAiChatProps> = ({ onQuoteApplied }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingQuote, setPendingQuote] = useState<CotizacionAiParams | null>(null);
  const [materialsLoaded, setMaterialsLoaded] = useState(false);
  const [pendingImage, setPendingImage] = useState<ChatMessage['image']>();
  const [pendingPreview, setPendingPreview] = useState<string>();
  const initializedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const materiales = useMaterialStore((state) => state.materiales);
  const setMateriales = useMaterialStore((state) => state.setMateriales);
  const addListItem = useCotizacionStore((state) => state.addListItem);
  const setDimensiones = useCotizacionStore((state) => state.setDimensiones);
  const clearPiezas = useCotizacionStore((state) => state.clearItems);
  const clearAccesorios = useAccessoryStore((state) => state.clearItems);
  const setCotizacion = useCotizacionGlobalStore((state) => state.setCotizacion);
  const resetGlobal = useCotizacionGlobalStore((state) => state.resetCotizacion);
  const navigate = useNavigate();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const loadMaterials = useCallback(async () => {
    if (materiales.length > 0) {
      setMaterialsLoaded(true);
      return;
    }
    try {
      const loaded = await fetchMaterials();
      setMateriales(loaded);
      setMaterialsLoaded(true);
    } catch {
      setError('No se pudieron cargar los materiales. Verifica tu conexión.');
    }
  }, [materiales.length, setMateriales]);

  const initChat = useCallback(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setMessages([{ role: 'assistant', content: getWelcomeMessage(materiales) }]);
  }, [materiales]);

  useEffect(() => {
    if (open) {
      loadMaterials();
    }
  }, [open, loadMaterials]);

  useEffect(() => {
    if (open && materialsLoaded && materiales.length > 0) {
      initChat();
    }
  }, [open, materialsLoaded, materiales, initChat]);

  const clearAttachment = useCallback(() => {
    setPendingImage(undefined);
    setPendingPreview(undefined);
  }, []);

  const handleReset = useCallback(() => {
    resetAiChat();
    initializedRef.current = false;
    setPendingQuote(null);
    setError(null);
    clearAttachment();
    setMessages([]);
    if (materiales.length > 0) {
      initializedRef.current = true;
      setMessages([{ role: 'assistant', content: getWelcomeMessage(materiales) }]);
    }
  }, [materiales, clearAttachment]);

  const handleAttach = useCallback(async (file: File) => {
    if (file.size > MAX_AI_IMAGE_MB * 1024 * 1024) {
      setError(`La imagen no puede superar ${MAX_AI_IMAGE_MB} MB`);
      return;
    }
    try {
      const image = await fileToChatMessageImage(file);
      setPendingImage(image);
      setPendingPreview(chatMessageImageToPreviewUrl(image));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar la imagen');
    }
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if ((!trimmed && !pendingImage) || isTyping) return;

      setError(null);
      const userMessage: ChatMessage = {
        role: 'user',
        content: trimmed || (pendingImage ? '📷 Imagen del mueble' : ''),
        image: pendingImage,
      };
      const priorMessages = [...messages, userMessage];
      const imageToSend = pendingImage;

      setMessages((prev) => [...prev, userMessage]);
      clearAttachment();
      setIsTyping(true);

      try {
        const response = await sendAiMessage(trimmed, materiales, messages, imageToSend);
        let quoteParams = parseQuoteReadyBlock(response);
        const displayText = stripQuoteReadyBlock(response) || response;

        if (!quoteParams) {
          quoteParams = extractQuoteFromConversation(priorMessages, materiales);
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: displayText }]);

        if (quoteParams) {
          setPendingQuote(quoteParams);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al comunicarse con la IA.';
        setError(message);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'Lo siento, hubo un problema al procesar tu mensaje. Verifica que la API de Gemini esté habilitada en Firebase o intenta de nuevo.',
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, materiales, messages, pendingImage, clearAttachment]
  );

  const handleApplyQuote = useCallback(() => {
    if (!pendingQuote) return;

    try {
      const { piezas, materialUsado } = generarPiezasMueble(pendingQuote, materiales);

      clearPiezas();
      clearAccesorios();
      resetGlobal();

      addListItem(piezas);
      setDimensiones(pendingQuote.dimensiones);

      const totalPiezas = piezas.reduce((sum, p) => sum + p.precioTotal, 0);
      setCotizacion({
        id: '',
        nombre: pendingQuote.nombre,
        piezas,
        accesorios: [],
        manoDeObra: totalPiezas * 0.05,
        total: totalPiezas,
        precioVenta: totalPiezas * 1.05,
        precioVentaConIva: totalPiezas * 2.5,
        dimensiones: pendingQuote.dimensiones,
      });

      setPendingQuote(null);
      setOpen(false);
      onQuoteApplied?.();
      navigate('/cotizacion', {
        state: {
          isEdit: false,
          fromAi: true,
          tipoMueble: pendingQuote.tipoMueble,
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `¡Listo! Generé la cotización "${pendingQuote.nombre}" con material ${materialUsado}. Te llevo al formulario para que revises las piezas.`,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo generar la cotización.';
      setError(message);
    }
  }, [
    pendingQuote,
    materiales,
    clearPiezas,
    clearAccesorios,
    resetGlobal,
    addListItem,
    setDimensiones,
    setCotizacion,
    navigate,
    onQuoteApplied,
  ]);

  return (
    <>
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 88,
            right: 24,
            width: { xs: 'calc(100vw - 32px)', sm: 380 },
            height: { xs: 'calc(100vh - 120px)', sm: 520 },
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToyIcon fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Asistente de Cotización
              </Typography>
            </Box>
            <Box>
              <IconButton size="small" color="inherit" onClick={handleReset} aria-label="Reiniciar chat">
                <RefreshIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="inherit" onClick={() => setOpen(false)} aria-label="Cerrar chat">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mx: 1, mt: 1 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {pendingQuote && (
            <Box sx={{ px: 2, py: 1, bgcolor: 'success.50', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="success.dark" gutterBottom>
                Cotización lista: <strong>{pendingQuote.nombre}</strong> ({pendingQuote.tipoMueble})
              </Typography>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<OpenInNewIcon />}
                onClick={handleApplyQuote}
              >
                Crear cotización
              </Button>
            </Box>
          )}

          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {!materialsLoaded ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <>
                <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
                  {messages.map((msg, index) => (
                    <MessageBubble key={index} message={msg} />
                  ))}
                  {isTyping && (
                    <Box sx={{ px: 2, py: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Escribiendo...
                      </Typography>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                <AiChatInput
                  disabled={isTyping}
                  pendingPreview={pendingPreview}
                  onSend={handleSend}
                  onAttach={handleAttach}
                  onClearAttachment={clearAttachment}
                />
              </>
            )}
          </Box>
        </Paper>
      </Slide>

      <Fab
        color="primary"
        aria-label="Abrir asistente de cotización"
        onClick={() => setOpen((prev) => !prev)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1301,
        }}
      >
        {open ? <CloseIcon /> : <SmartToyIcon />}
      </Fab>
    </>
  );
};
