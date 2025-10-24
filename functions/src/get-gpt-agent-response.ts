import { getFirestore, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { genkit, z } from 'genkit';
import { openAI } from '@genkit-ai/compat-oai/openai';
import { GPT_SYSTEM_PROMPT } from './prompts/system-gpt.prompt';
import { getGptMessagePrompt } from './prompts/message-gpt.prompt';
import { openAiApiKey } from './config/secrets';

const AgentMessageSchema = z.object({
  text: z.string().min(1),
  phase: z.enum([
    'INITIAL_CONTACT',
    'DISCOVERY',
    'QUALIFICATION',
    'CONNECTION',
    'POSITIONING',
    'CONVERSION',
  ]),
  responseDelaySeconds: z.number().int().min(5).max(60),
  approvalRequired: z.boolean().default(false),
  confidenceScore: z.number().min(0).max(1),
});

const AgentResponseSchema = z.object({
  analysis: z.string().min(1),
  messages: z.array(AgentMessageSchema).min(1).max(4),
  nextAction: z.object({
    shouldOfferSchedulingLink: z.boolean(),
    notes: z.string(),
  }),
});

type AgentResponse = z.infer<typeof AgentResponseSchema>;
type AgentMessage = z.infer<typeof AgentMessageSchema>;
type SanitizedAgentMessage = {
  text: string;
  phase: AgentMessage['phase'];
  approvalRequired: boolean;
  responseDelay: number;
  confidenceScore: number;
};

type ChatMessageDoc = {
  username: string;
  text: string;
  timestamp: string;
  responseDelay?: number;
  respondAtTimestamp?: string;
  approvalRequired?: boolean | string;
  confidenceScore?: number | string;
  phase?: string;
};

const SYSTEM_USERNAME = 'Dr. Accordo';

const createConversationHistory = (docs: QueryDocumentSnapshot[]) => {
  const history = docs.map((doc) => {
    const data = doc.data() as ChatMessageDoc;
    const isAgent = data.username === SYSTEM_USERNAME;

    return {
      role: isAgent ? 'agent' : 'prospect',
      sender: data.username,
      message: data.text,
      timestamp: data.timestamp,
    };
  });

  return JSON.stringify(history, null, 2);
};

const clampDelay = (delay: number) => {
  if (Number.isNaN(delay) || !Number.isFinite(delay)) {
    return 10;
  }

  const rounded = Math.round(delay);
  if (rounded < 5) return 5;
  if (rounded > 60) return 60;
  return rounded;
};

export const getGptAgentResponse = onCall(
  { secrets: [openAiApiKey] },
  async (req) => {
    try {
      const db = getFirestore();

      const { chatId } = req.data as { chatId?: string };

      if (!chatId) {
        throw new HttpsError('invalid-argument', 'Chat ID is required.');
      }

      const apiKey = openAiApiKey.value();
      if (!apiKey) {
        logger.error('OpenAI API key not set');
        throw new HttpsError(
          'failed-precondition',
          'OpenAI API key not configured in environment variables.',
        );
      }

      const chatRef = db.collection('chats').doc(chatId);
      const messagesRef = chatRef.collection('messages');

      const [messagesSnapshot, chatSnapshot] = await Promise.all([
        messagesRef.orderBy('timestamp', 'asc').get(),
        chatRef.get(),
      ]);

      if (messagesSnapshot.empty) {
        throw new HttpsError('not-found', 'No messages found for this chat.');
      }

      if (!chatSnapshot.exists) {
        throw new HttpsError('not-found', 'Chat not found.');
      }

      const chatData = chatSnapshot.data() as { username?: string } | undefined;
      const prospectName = chatData?.username ?? 'Friend';

      const messageDocs = messagesSnapshot.docs;
      const messageNumber = messageDocs.length + 1;
      const conversationHistory = createConversationHistory(messageDocs);

      const ai = genkit({
        plugins: [openAI({ apiKey })],
      });

      const prompt = `${GPT_SYSTEM_PROMPT}\n\n${getGptMessagePrompt(
        prospectName,
        messageNumber,
        conversationHistory,
      )}`;

      const { output } = await ai.generate({
        model: openAI.model('gpt-5'),
        prompt,
        config: {
          temperature: 0.9,
        },
        output: {
          schema: AgentResponseSchema,
        },
      });

      if (!output) {
        throw new HttpsError('internal', 'No structured output from GPT model.');
      }

      const agentResponse = output as AgentResponse;
      const agentMessages = agentResponse.messages ?? [];

      if (!agentMessages.length) {
        throw new HttpsError('internal', 'GPT did not return any messages.');
      }

      let cumulativeDelaySeconds = 0;
      const now = Date.now();
      const persistedMessages: string[] = [];

      for (const message of agentMessages) {
        const sanitizedMessage = sanitizeMessage(message);
        cumulativeDelaySeconds += sanitizedMessage.responseDelay;

        const respondAtTimestamp = new Date(now + cumulativeDelaySeconds * 1000).toISOString();

        await messagesRef.add({
          chatId,
          username: SYSTEM_USERNAME,
          text: sanitizedMessage.text,
          responseDelay: sanitizedMessage.responseDelay,
          respondAtTimestamp,
          approvalRequired: sanitizedMessage.approvalRequired,
          confidenceScore: sanitizedMessage.confidenceScore,
          phase: sanitizedMessage.phase,
          analysis: agentResponse.analysis,
          nextAction: agentResponse.nextAction,
          model: 'openai:gpt-5',
          timestamp: new Date().toISOString(),
        });

        persistedMessages.push(sanitizedMessage.text);
      }

      return {
        message: persistedMessages[0],
        allMessages: persistedMessages,
        chatId,
        timestamp: new Date().toISOString(),
        analysis: agentResponse.analysis,
        nextAction: agentResponse.nextAction,
      };
    } catch (error) {
      logger.error('Error getting GPT agent response', { error });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        'Failed to get GPT agent response',
        error instanceof Error ? error.message : String(error),
      );
    }
  },
);

const sanitizeMessage = (message: AgentMessage): SanitizedAgentMessage => {
  const responseDelay = clampDelay(message.responseDelaySeconds);
  const confidenceScore = Number.isFinite(message.confidenceScore)
    ? Number(message.confidenceScore.toFixed(2))
    : 0.5;

  return {
    text: message.text.trim(),
    phase: message.phase,
    approvalRequired: Boolean(message.approvalRequired),
    responseDelay,
    confidenceScore,
  };
};
