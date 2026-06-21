import { getAI, getGenerativeModel, GoogleAIBackend, ChatSession } from 'firebase/ai';
import { app } from '../config/firebase';
import { MaterialItem } from '../models/Interfaces';
import { formatMaterialesList, ChatMessage } from '../utils/cotizacionAiUtils';
import { ChatMessageImage, fileToGenerativePart } from '../utils/aiImageUtils';

export type { ChatMessage };

const SYSTEM_INSTRUCTION = `Eres un asistente experto en cotización de muebles de melamina para un taller de carpintería.
Ayudas al usuario a crear una cotización rápida conversando en español.

Puedes recibir FOTOS de muebles. Al analizar una imagen:
- Identifica el tipo de mueble (estante, gabinete, repisa, closet, etc.)
- Estima dimensiones aproximadas si el usuario no las da (pregunta para confirmar)
- Sugiere material acorde a lo visible
- Propón un nombre descriptivo para la cotización

Información requerida para cotizar:
1. Nombre de la cotización
2. Tipo de mueble: "estante" o "gabinete"
3. Dimensiones en METROS: ancho (frente), alto (altura vertical), profundidad (desde la pared hacia afuera)
4. Material (debe coincidir EXACTAMENTE con uno de los materiales disponibles)
5. Cantidad de repisas (opcional, default 1)

Reglas CRÍTICAS:
- LEE TODO el historial de la conversación. NUNCA vuelvas a preguntar datos que el usuario ya dio.
- Si el usuario envió una imagen, descríbrela brevemente y usa esa información para la cotización.
- Si el usuario dijo "largo" refiriéndose a la altura, interpreta "largo" como "alto".
- Si ya tienes nombre, tipo, las 3 dimensiones y material confirmados, NO hagas más preguntas.
- En ese caso responde confirmando el resumen y agrega el bloque [QUOTE_READY] al final.
- Haz como máximo 1-2 preguntas por mensaje solo si falta información.
- Usa el nombre EXACTO del material de la lista disponible.

Cuando tengas TODA la información, responde con un resumen amigable y este bloque al final:

[QUOTE_READY]
{"nombre":"...","tipoMueble":"estante","dimensiones":{"ancho":0.4,"alto":2,"profundidad":0.6},"material":"Melamina Blanca 15mm","repisas":1}
[/QUOTE_READY]`;

const AI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash-lite'] as const;

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type GeminiHistoryEntry = {
  role: 'user' | 'model';
  parts: GeminiPart[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isQuotaError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('429') || message.toLowerCase().includes('quota');
};

const parseRetryDelayMs = (error: unknown): number => {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000) + 500;
  }
  return 5000;
};

const toUserFriendlyError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);

  if (isQuotaError(error)) {
    return 'Se alcanzó el límite de uso gratuito de Gemini. Espera un minuto e intenta de nuevo, o activa facturación (plan Blaze) en Firebase para más cuota.';
  }

  return message || 'Error al comunicarse con la IA.';
};

let chatSession: ChatSession | null = null;
let sessionMaterialesKey = '';
let activeModel: (typeof AI_MODELS)[number] = AI_MODELS[0];

const buildSystemInstruction = (materiales: MaterialItem[]) => {
  return `${SYSTEM_INSTRUCTION}

Materiales disponibles en el sistema: ${formatMaterialesList(materiales)}`;
};

const buildMessageParts = (message: ChatMessage): GeminiPart[] => {
  const parts: GeminiPart[] = [];
  if (message.content.trim()) {
    parts.push({ text: message.content });
  }
  if (message.image) {
    parts.push(fileToGenerativePart(message.image));
  }
  if (parts.length === 0) {
    parts.push({ text: ' ' });
  }
  return parts;
};

const buildGeminiHistory = (priorMessages: ChatMessage[]): GeminiHistoryEntry[] => {
  const firstUserIndex = priorMessages.findIndex((message) => message.role === 'user');
  if (firstUserIndex === -1) return [];

  return priorMessages.slice(firstUserIndex).map((message) => ({
    role: message.role === 'user' ? 'user' : 'model',
    parts: buildMessageParts(message),
  }));
};

const buildSendRequest = (userMessage: string, image?: ChatMessageImage) => {
  const text =
    userMessage.trim() ||
    'Analiza esta imagen del mueble e indícame qué datos necesitas para cotizarlo en melamina.';

  if (image) {
    return [text, fileToGenerativePart(image)] as [string, ReturnType<typeof fileToGenerativePart>];
  }
  return text;
};

const invalidateChatSession = () => {
  chatSession = null;
  sessionMaterialesKey = '';
};

const createChatSession = (
  materiales: MaterialItem[],
  modelName: (typeof AI_MODELS)[number],
  priorMessages: ChatMessage[] = []
): ChatSession => {
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, {
    model: modelName,
    systemInstruction: buildSystemInstruction(materiales),
  });

  const history = buildGeminiHistory(priorMessages);
  return model.startChat({ history });
};

const getChatSession = (
  materiales: MaterialItem[],
  priorMessages: ChatMessage[] = []
): ChatSession => {
  const key = `${materiales.map((m) => m.id).join(',')}|${activeModel}`;
  if (chatSession && sessionMaterialesKey === key) {
    return chatSession;
  }

  chatSession = createChatSession(materiales, activeModel, priorMessages);
  sessionMaterialesKey = key;
  return chatSession;
};

export const resetAiChat = () => {
  invalidateChatSession();
  activeModel = AI_MODELS[0];
};

export const sendAiMessage = async (
  userMessage: string,
  materiales: MaterialItem[],
  priorMessages: ChatMessage[] = [],
  image?: ChatMessageImage
): Promise<string> => {
  let lastError: unknown;
  const startModelIndex = AI_MODELS.indexOf(activeModel);
  const modelsToTry = chatSession
    ? [activeModel]
    : AI_MODELS.slice(startModelIndex >= 0 ? startModelIndex : 0);

  for (const modelName of modelsToTry) {
    if (modelName !== activeModel) {
      activeModel = modelName;
      invalidateChatSession();
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const session = getChatSession(materiales, priorMessages);
        const result = await session.sendMessage(buildSendRequest(userMessage, image));
        const text = result.response.text();

        if (!text) {
          throw new Error('La IA no devolvió una respuesta.');
        }

        return text;
      } catch (error) {
        lastError = error;

        if (isQuotaError(error) && attempt === 0) {
          await sleep(parseRetryDelayMs(error));
          invalidateChatSession();
          continue;
        }

        if (isQuotaError(error)) {
          invalidateChatSession();
          break;
        }

        throw new Error(toUserFriendlyError(error));
      }
    }
  }

  throw new Error(toUserFriendlyError(lastError));
};

export const getWelcomeMessage = (materiales: MaterialItem[]): string => {
  const materialesText = formatMaterialesList(materiales);
  return `¡Hola! Soy tu asistente para cotizaciones rápidas de muebles de melamina.

Puedo ayudarte de dos formas:
• Describe el mueble: "Estante de 1.2m de ancho, 2m de alto y 40cm de profundidad en melamina blanca"
• Envía una foto del mueble (botón de imagen) y te preguntaré solo lo que falte para cotizar

Materiales disponibles: ${materialesText}

¿Qué mueble te gustaría cotizar hoy?`;
};
