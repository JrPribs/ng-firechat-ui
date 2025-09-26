// import dotenv from 'dotenv';
// import express from 'express';
// import cors from 'cors';
// import Anthropic from '@anthropic-ai/sdk';
// import { getMessagePrompt } from './prompts/message.prompt';
// import { SYSTEM_PROMPT } from './prompts/system.prompt';


// // Load environment variables
// dotenv.config({override: true});

// const app = express();
// const port = process.env.PORT || 3001;

// app.use(cors());
// app.use(express.json());

// // Serve static files from current directory (where index.html is located)
// app.use(express.static(__dirname + '/../'));

// // Serve index.html for root route
// app.get('/', (req, res) => {
//   res.sendFile('index.html', { root: __dirname + '/../' });
// });

// // Check if API key is set
// if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'my_api_key') {
//   console.warn('⚠️  ANTHROPIC_API_KEY not set. Please set your API key in .env file');
//   console.log('Get your API key from: https://console.anthropic.com/');
//   process.exit(1);
// } else {
//   console.log('✅ Anthropic API key loaded successfully');
// }

// // Initialize Anthropic client
// const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY || 'my_api_key', // Should be set via environment variable
// });

// // In-memory storage for demo purposes (use a real database in production)
// interface Conversation {
//   id: number;
//   name: string;
//   createdAt: Date;
//   updatedAt: Date;
//   isActive: boolean;
// }

// interface Message {
//   id: number;
//   conversationId: number;
//   sender: 'user' | 'agent';
//   content: string;
//   timestamp: Date;
//   messageNumber: number;
// }

// let conversations: Conversation[] = [];
// let messages: Message[] = [];
// let nextConversationId = 1;
// let nextMessageId = 1;

// // API Routes

// // Get all conversations
// app.get('/api/conversations', async (req, res) => {
//   try {
//     res.json(conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
//   } catch (error) {
//     console.error('Error fetching conversations:', error);
//     res.status(500).json({ error: 'Failed to fetch conversations', details: error instanceof Error ? error.message : String(error) });
//   }
// });

// // Create new conversation
// app.post('/api/conversations', async (req, res) => {
//   try {
//     const { name } = req.body;

//     if (!name || name.trim() === '') {
//       return res.status(400).json({ error: 'Name is required' });
//     }

//     const now = new Date();
//     const conversationId = nextConversationId++;

//     // Create conversation
//     const conversation: Conversation = {
//       id: conversationId,
//       name: name.trim(),
//       createdAt: now,
//       updatedAt: now,
//       isActive: true
//     };

//     conversations.push(conversation);

//     // Add initial agent message
//     const initialMessage: Message = {
//       id: nextMessageId++,
//       conversationId,
//       sender: 'agent',
//       content: `Thanks for the follow ${name.trim()} 👊🏽|||Are you here for the content or do you have questions about Chiro care?`,
//       timestamp: now,
//       messageNumber: 1
//     };

//     messages.push(initialMessage);

//     res.json(conversation);
//   } catch (error) {
//     console.error('Error creating conversation:', error);
//     res.status(500).json({ error: 'Failed to create conversation', details: error instanceof Error ? error.message : String(error) });
//   }
// });

// // Get conversation messages
// app.get('/api/conversations/:id/messages', async (req, res) => {
//   try {
//     const conversationId = parseInt(req.params.id);

//     if (isNaN(conversationId)) {
//       return res.status(400).json({ error: 'Invalid conversation ID' });
//     }

//     const conversationMessages = messages
//       .filter(msg => msg.conversationId === conversationId)
//       .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

//     res.json(conversationMessages);
//   } catch (error) {
//     console.error('Error fetching messages:', error);
//     res.status(500).json({ error: 'Failed to fetch messages', details: error instanceof Error ? error.message : String(error) });
//   }
// });

// // Send user message and get AI response
// app.post('/api/conversations/:id/messages', async (req, res) => {
//   try {
//     const conversationId = parseInt(req.params.id);
//     const { content } = req.body;

//     if (isNaN(conversationId)) {
//       return res.status(400).json({ error: 'Invalid conversation ID' });
//     }

//     if (!content || content.trim() === '') {
//       return res.status(400).json({ error: 'Message content is required' });
//     }

//     // Check if API key is set
//     if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'my_api_key') {
//       console.error('Anthropic API key not set');
//       return res.status(500).json({ error: 'AI service not configured. Please set ANTHROPIC_API_KEY in .env file.' });
//     }

//     // Get conversation
//     const conversation = conversations.find(c => c.id === conversationId);
//     if (!conversation) {
//       return res.status(404).json({ error: 'Conversation not found' });
//     }

//     // Add user message
//     const conversationMessages = messages.filter(m => m.conversationId === conversationId);
//     const messageNumber = conversationMessages.length + 1;

//     const userMessage: Message = {
//       id: nextMessageId++,
//       conversationId,
//       sender: 'user',
//       content: content.trim(),
//       timestamp: new Date(),
//       messageNumber
//     };

//     messages.push(userMessage);

//     // Get all messages for context
//     const conversationHistoryMessages = messages
//       .filter(m => m.conversationId === conversationId)
//       .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

//     // Build conversation history for AI
//     const conversationHistory = conversationHistoryMessages.map(msg => ({
//       role: msg.sender === 'user' ? 'user' : 'assistant',
//       content: msg.content
//     }));

//     // Add current user message to history
//     conversationHistory.push({
//       role: 'user',
//       content: content.trim()
//     });

//     // Get AI response
//     let response;
//     try {

//       const name = conversation.name;
//       const number = messageNumber + 1;
//       const history = conversationHistory.map(msg => msg.content).join('\n');

//       response = await anthropic.messages.create({
//         model: "claude-sonnet-4-20250514",
//         max_tokens: 20000,
//         temperature: 1,
//         system: SYSTEM_PROMPT,
//         messages: [
//           {
//             role: "user",
//             content: getMessagePrompt(name, number, history)
//           }
//         ]
//       });
//     } catch (anthropicError) {
//       console.error('Anthropic API error:', anthropicError);
//       return res.status(500).json({
//         error: 'Failed to get AI response',
//         details: anthropicError instanceof Error ? anthropicError.message : String(anthropicError),
//         suggestion: 'Please check your ANTHROPIC_API_KEY'
//       });
//     }

//     if (!response.content || response.content.length === 0) {
//       return res.status(500).json({ error: 'No response from AI service' });
//     }

//     const contentBlock = response.content[0];
//     const aiResponse = contentBlock.type === 'text' ? contentBlock.text : '';

//     if (!aiResponse) {
//       return res.status(500).json({ error: 'Empty response from AI service' });
//     }

//     // Extract messages from AI response (between <response> tags)
//     const responseMatch = aiResponse.match(/<response>(.*?)<\/response>/s);
//     let agentMessages: string[];

//     if (responseMatch) {
//       agentMessages = responseMatch[1].split('|||').map((msg: string) => msg.trim()).filter((msg: string) => msg.length > 0);
//     } else {
//       agentMessages = [aiResponse.trim()];
//     }

//     if (agentMessages.length === 0) {
//       agentMessages = ['I understand. Let me know if you have any questions about chiropractic care!'];
//     }

//     // Add each agent message
//     const newMessageNumber = messageNumber + 1;
//     for (let i = 0; i < agentMessages.length; i++) {
//       const agentMessage: Message = {
//         id: nextMessageId++,
//         conversationId,
//         sender: 'agent',
//         content: agentMessages[i],
//         timestamp: new Date(),
//         messageNumber: newMessageNumber + i
//       };
//       messages.push(agentMessage);
//     }

//     // Update conversation timestamp
//     const conversationIndex = conversations.findIndex(c => c.id === conversationId);
//     if (conversationIndex !== -1) {
//       conversations[conversationIndex].updatedAt = new Date();
//     }

//     // Get updated messages
//     const updatedMessages = messages
//       .filter(m => m.conversationId === conversationId)
//       .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

//     res.json(updatedMessages);
//   } catch (error) {
//     console.error('Error sending message:', error);
//     res.status(500).json({ error: 'Failed to send message', details: error instanceof Error ? error.message : String(error) });
//   }
// });

// // Delete conversation
// app.delete('/api/conversations/:id', async (req, res) => {
//   try {
//     const conversationId = parseInt(req.params.id);

//     if (isNaN(conversationId)) {
//       return res.status(400).json({ error: 'Invalid conversation ID' });
//     }

//     // Check if conversation exists
//     const conversation = conversations.find(c => c.id === conversationId);
//     if (!conversation) {
//       return res.status(404).json({ error: 'Conversation not found' });
//     }

//     // Delete messages first
//     messages = messages.filter(m => m.conversationId !== conversationId);

//     // Delete conversation
//     conversations = conversations.filter(c => c.id !== conversationId);

//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error deleting conversation:', error);
//     res.status(500).json({ error: 'Failed to delete conversation', details: error instanceof Error ? error.message : String(error) });
//   }
// });

// app.listen(port, () => {
//   console.log(`Instagram Agent Testbed API running on http://localhost:${port}`);
// });
