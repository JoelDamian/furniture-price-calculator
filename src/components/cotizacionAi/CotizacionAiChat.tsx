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
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react';
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
  ChatMessage,
} from '../../services/cotizacionAiService';
import {
  generarPiezasMueble,
  parseQuoteReadyBlock,
  stripQuoteReadyBlock,
  extractQuoteFromConversation,
  CotizacionAiParams,
} from '../../utils/cotizacionAiUtils';

interface CotizacionAiChatProps {
  onQuoteApplied?: () => void;
}

export const CotizacionAiChat: React.FC<CotizacionAiChatProps> = ({ onQuoteApplied }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingQuote, setPendingQuote] = useState<CotizacionAiParams | null>(null);
  const [materialsLoaded, setMaterialsLoaded] = useState(false);
  const initializedRef = useRef(false);

  const materiales = useMaterialStore((state) => state.materiales);
  const setMateriales = useMaterialStore((state) => state.setMateriales);
  const addListItem = useCotizacionStore((state) => state.addListItem);
  const setDimensiones = useCotizacionStore((state) => state.setDimensiones);
  const clearPiezas = useCotizacionStore((state) => state.clearItems);
  const clearAccesorios = useAccessoryStore((state) => state.clearItems);
  const setCotizacion = useCotizacionGlobalStore((state) => state.setCotizacion);
  const resetGlobal = useCotizacionGlobalStore((state) => state.resetCotizacion);
  const navigate = useNavigate();

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

  const handleReset = useCallback(() => {
    resetAiChat();
    initializedRef.current = false;
    setPendingQuote(null);
    setError(null);
    setMessages([]);
    if (materiales.length > 0) {
      initializedRef.current = true;
      setMessages([{ role: 'assistant', content: getWelcomeMessage(materiales) }]);
    }
  }, [materiales]);

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setError(null);
    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const priorMessages = [...messages, userMessage];
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await sendAiMessage(trimmed, materiales, messages);
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
          content: 'Lo siento, hubo un problema al procesar tu mensaje. Verifica que la API de Gemini esté habilitada en Firebase o intenta de nuevo.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, materiales, messages]);

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

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              '& .cs-main-container': { border: 'none' },
              '& .cs-message--incoming .cs-message__content': {
                backgroundColor: '#fce4ec',
              },
              '& .cs-message--outgoing .cs-message__content': {
                backgroundColor: '#e91e63',
                color: '#fff',
              },
              '& .cs-button--send': {
                backgroundColor: '#e91e63',
              },
            }}
          >
            {!materialsLoaded ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <MainContainer>
                <ChatContainer>
                  <MessageList
                    typingIndicator={isTyping ? <TypingIndicator content="Escribiendo..." /> : undefined}
                  >
                    {messages.map((msg, index) => (
                      <Message
                        key={index}
                        model={{
                          message: msg.content,
                          sentTime: 'ahora',
                          sender: msg.role === 'user' ? 'Tú' : 'Asistente',
                          direction: msg.role === 'user' ? 'outgoing' : 'incoming',
                          position: 'single',
                        }}
                      />
                    ))}
                  </MessageList>
                  <MessageInput
                    placeholder="Describe el mueble que quieres cotizar..."
                    onSend={handleSend}
                    attachButton={false}
                    disabled={isTyping}
                  />
                </ChatContainer>
              </MainContainer>
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
