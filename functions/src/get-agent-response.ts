
import { getFirestore } from 'firebase-admin/firestore';
import Anthropic from '@anthropic-ai/sdk';
import { getMessagePrompt } from './prompts/message.prompt';
import { SYSTEM_PROMPT } from './prompts/system.prompt';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';

export const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');

// HTTP function to get AI agent response for a chat
export const getAgentResponse = onCall(
  { secrets: [anthropicApiKey] },
  async (req) => {
    try {
      const db = getFirestore();

      logger.info('getAgentResponse', { anthropicApiKey: anthropicApiKey.value() });

      const { chatId } = req.data as unknown as { chatId: string };

      if (!chatId) {
        throw new HttpsError(
          'invalid-argument',
          'Chat ID is required.'
        );
      }


      // Check if API key is set
      if (!anthropicApiKey.value()) {
        console.error('Anthropic API key not set');
        throw new HttpsError(
          'failed-precondition',
          'Anthropic API key not configured in environment variables.'
        );
      }
      // Initialize Anthropic client
      const anthropic = new Anthropic({
        apiKey: anthropicApiKey.value(),
      });

      // Get all messages for the chat
      const messagesRef = db.collection('chats').doc(chatId).collection('messages');
      const messagesSnapshot = await messagesRef.orderBy('timestamp', 'asc').get();

      if (messagesSnapshot.empty) {
        throw new HttpsError(
          'not-found',
          'No messages found for this chat.'
        );
      }

      // Get all messages in chronological order (no role mapping needed)
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

      // Get AI response using Anthropic
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 20000,
        temperature: 1,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: getMessagePrompt(username, messageNumber, history)
          }
        ]
      });

      if (!response.content || response.content.length === 0) {
        throw new HttpsError(
          'internal',
          'No response from AI service.'
        );
      }

      const contentBlock = response.content[0];
      const aiResponse = contentBlock.type === 'text' ? contentBlock.text : '';

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
        agentMessages = responseMatch[1].split('|||').map((msg: string) => msg.trim()).filter((msg: string) => msg.length > 0);
      } else {
        agentMessages = [aiResponse.trim()];
      }

      if (agentMessages.length === 0) {
        agentMessages = ['I understand. Let me know if you have any questions about chiropractic care!'];
      }

      // Return the first message as the primary response
      // Additional messages could be handled by the client if needed
      return {
        message: agentMessages[0],
        allMessages: agentMessages,
        chatId: chatId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting agent response:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        'Failed to get agent response',
        error instanceof Error ? error.message : String(error)
      );
    }
  }
);

