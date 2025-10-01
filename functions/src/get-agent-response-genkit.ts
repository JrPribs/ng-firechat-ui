import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCallGenkit } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';
import { genkit, z } from 'genkit';
import { anthropic, claude35Sonnet } from 'genkitx-anthropic';
import { getMessagePromptGenkit } from './prompts/message-genkit.prompt';
import { SYSTEM_PROMPT_GENKIT } from './prompts/system-genkit.prompt';

const anthropicApiKeyGenkit = defineSecret('ANTHROPIC_API_KEY');

// Input schema for the callable function
const GetAgentResponseInput = z.object({
  chatId: z.string().min(1, 'Chat ID is required'),
});

// Output schema for the function
const GetAgentResponseOutput = z.object({
  message: z.string(),
  allMessages: z.array(z.string()),
  chatId: z.string(),
  timestamp: z.string(),
});

// Initialize Genkit with Anthropic plugin
const ai = genkit({
  plugins: [
    anthropic({
      apiKey: anthropicApiKeyGenkit.value()
    })
  ],
  model: claude35Sonnet,
});

// Define the Genkit flow
const agentResponseFlow = ai.defineFlow(
  {
    name: 'agentResponseFlow',
    inputSchema: GetAgentResponseInput,
    outputSchema: GetAgentResponseOutput,
  },
  async (input) => {
    const db = getFirestore();
    const { chatId } = input;

    logger.info('getAgentResponseGenkit', {
      chatId,
      hasApiKey: !!anthropicApiKeyGenkit.value()
    });

    // Check if API key is set
    if (!anthropicApiKeyGenkit.value()) {
      logger.error('Anthropic API key not set');
      throw new HttpsError(
        'failed-precondition',
        'Anthropic API key not configured in environment variables.'
      );
    }

    // Get all messages for the chat
    const messagesRef = db.collection('chats').doc(chatId).collection('messages');
    const messagesSnapshot = await messagesRef.orderBy('timestamp', 'asc').get();

    if (messagesSnapshot.empty) {
      throw new HttpsError(
        'not-found',
        'No messages found for this chat.'
      );
    }

    // Get all messages in chronological order
    const messages = messagesSnapshot.docs.map(doc => {
      const msgData = doc.data();
      return `
         user: ${msgData.username}
         message: ${msgData.text}
         timestamp: ${msgData.timestamp}
        `;
    });

    // Get chat document to get username
    const chatDoc = await db.collection('chats').doc(chatId).get();
    if (!chatDoc.exists) {
      throw new HttpsError(
        'not-found',
        'Chat not found.'
      );
    }

    const chatData = chatDoc.data();
    const username = chatData?.username || 'User';
    const messageNumber = messages.length + 1;

    // Build conversation history string
    const history = messages.join('\n');

    // Get AI response using Genkit
    const response = await ai.generate({
      model: claude35Sonnet,
      prompt: getMessagePromptGenkit(username, messageNumber, history),
      system: SYSTEM_PROMPT_GENKIT,
      config: {
        maxTokens: 20000,
        temperature: 1,
      },
    });

    const aiResponse = response.text;

    if (!aiResponse) {
      throw new HttpsError(
        'internal',
        'Empty response from AI service.'
      );
    }

    // Extract messages from AI response (between <response> tags)
    const responseMatch = aiResponse.match(/<response>([\s\S]*?)<\/response>/);
    let agentMessages: string[];

    if (responseMatch) {
      agentMessages = responseMatch[1]
        .split('|||')
        .map((msg: string) => msg.trim())
        .filter((msg: string) => msg.length > 0);
    } else {
      agentMessages = [aiResponse.trim()];
    }

    let collectiveResponseDelay = 0;

    for (const message of agentMessages) {
      const responseDelay = Math.floor(Math.random() * 55) + 5;
      collectiveResponseDelay += responseDelay;

      await db.collection(`chats/${chatId}/messages`).add({
        chatId,
        username: 'Dr. Accordo',
        text: message,
        responseDelay: responseDelay,
        respondAtTimestamp: new Date(Date.now() + collectiveResponseDelay * 1000).toISOString(),
        approvalRequired: 'coming-soon',
        confidenceScore: 'coming-soon',
        phase: 'coming-soon',
        timestamp: new Date().toISOString()
      });
    }

    return {
      message: agentMessages[0],
      allMessages: agentMessages,
      chatId: chatId,
      timestamp: new Date().toISOString()
    };
  }
);

// Export the callable Cloud Function
export const getAgentResponseGenkit = onCallGenkit(
  {
    secrets: [anthropicApiKeyGenkit],
  },
  agentResponseFlow
);
