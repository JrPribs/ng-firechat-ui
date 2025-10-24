# Instagram Message Handling Guide

Complete guide for sending and receiving Instagram direct messages via the Messaging API.

## Table of Contents
- [Sending Messages](#sending-messages)
- [Receiving Messages](#receiving-messages)
- [Message Types](#message-types)
- [Interactive Elements](#interactive-elements)
- [24-Hour Messaging Window](#24-hour-messaging-window)
- [Complete Implementation Example](#complete-implementation-example)

## Sending Messages

### Basic Setup

```typescript
import { defineSecret } from 'firebase-functions/params';

const pageAccessToken = defineSecret('INSTAGRAM_PAGE_ACCESS_TOKEN');
const pageId = defineSecret('INSTAGRAM_PAGE_ID');

async function sendMessage(recipientId: string, message: any) {
  const url = `https://graph.facebook.com/v21.0/${pageId.value()}/messages`;

  const payload = {
    recipient: { id: recipientId },
    messaging_type: 'RESPONSE',
    message: message
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pageAccessToken.value()}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send message: ${JSON.stringify(error)}`);
  }

  return response.json();
}
```

### Messaging Types

- **`RESPONSE`** - Reply to user message (within 24-hour window)
- **`UPDATE`** - Proactive message to user
- **`MESSAGE_TAG`** - Tagged message outside 24-hour window (requires specific use case)

## Message Types

### 1. Text Messages

```typescript
async function sendTextMessage(recipientId: string, text: string) {
  return sendMessage(recipientId, {
    text: text
  });
}

// Usage
await sendTextMessage('USER-ID', 'Hello! How can I help you today?');
```

**Constraints:**
- Maximum 1,000 characters (Instagram-specific limit)
- UTF-8 encoded
- Plain text only (no rich formatting)

### 2. Quick Replies

Quick Replies provide buttons that disappear after user selection:

```typescript
async function sendQuickReply(recipientId: string, text: string, options: Array<{title: string, payload: string}>) {
  return sendMessage(recipientId, {
    text: text,
    quick_replies: options.map(opt => ({
      content_type: 'text',
      title: opt.title,
      payload: opt.payload
    }))
  });
}

// Usage - Initial qualification message
await sendQuickReply('USER-ID',
  'Thanks for reaching out! Are you interested in chiropractic care or just here for the content?',
  [
    { title: 'Chiropractic Care', payload: 'INTERESTED_IN_CARE' },
    { title: 'Just for Content', payload: 'CONTENT_ONLY' }
  ]
);
```

**Quick Reply Specifications:**
- Maximum 13 quick replies per message
- Title: Brief text (recommended under 20 characters)
- Payload: Custom string (up to 1000 characters) sent back in webhook
- Optional image_url for icons
- Buttons disappear after user taps one

**Content Types:**
- `text` - Regular button
- `user_phone_number` - Request user's phone number
- `user_email` - Request user's email

### 3. Images

```typescript
async function sendImage(recipientId: string, imageUrl: string) {
  return sendMessage(recipientId, {
    attachment: {
      type: 'image',
      payload: {
        url: imageUrl,
        is_reusable: true
      }
    }
  });
}

// Usage
await sendImage('USER-ID', 'https://example.com/chiropractic-services.jpg');
```

**Image Specifications:**
- Max size: 8MB
- Formats: PNG, JPEG, GIF
- Must be publicly accessible URL
- HTTPS required

### 4. Generic Template (Carousel)

Create a horizontal scrollable carousel:

```typescript
async function sendCarousel(recipientId: string, elements: Array<any>) {
  return sendMessage(recipientId, {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: elements
      }
    }
  });
}

// Usage - Showcase services
await sendCarousel('USER-ID', [
  {
    title: 'Initial Consultation',
    subtitle: 'Comprehensive assessment and treatment plan',
    image_url: 'https://example.com/consultation.jpg',
    buttons: [
      {
        type: 'web_url',
        url: 'https://example.com/book-consultation',
        title: 'Book Now'
      },
      {
        type: 'postback',
        title: 'Learn More',
        payload: 'CONSULTATION_INFO'
      }
    ]
  },
  {
    title: 'Adjustments',
    subtitle: 'Specialized spinal adjustments',
    image_url: 'https://example.com/adjustments.jpg',
    buttons: [
      {
        type: 'postback',
        title: 'View Pricing',
        payload: 'ADJUSTMENT_PRICING'
      }
    ]
  }
]);
```

**Generic Template Specifications:**
- Max 10 elements (cards)
- Title: Max 80 characters (required)
- Subtitle: Max 80 characters (optional)
- Image URL: Optional
- Buttons: Max 3 per element
- Button types: `web_url`, `postback` only
- Not available on desktop

### 5. Button Template

Single message with buttons:

```typescript
async function sendButtonTemplate(recipientId: string, text: string, buttons: Array<any>) {
  return sendMessage(recipientId, {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: text,
        buttons: buttons
      }
    }
  });
}

// Usage - Follow-up options
await sendButtonTemplate('USER-ID',
  'Great! I can help you schedule a consultation or answer questions. What would you prefer?',
  [
    {
      type: 'postback',
      title: 'Schedule Appointment',
      payload: 'SCHEDULE_APPOINTMENT'
    },
    {
      type: 'postback',
      title: 'Ask Questions',
      payload: 'ASK_QUESTIONS'
    },
    {
      type: 'web_url',
      url: 'https://example.com/faq',
      title: 'View FAQ'
    }
  ]
);
```

**Button Template Specifications:**
- Text: Max 640 characters
- Buttons: 1-3 buttons
- Supported types: `web_url`, `postback`

## Sender Actions

### Mark Message as Seen

```typescript
async function markSeen(recipientId: string) {
  return sendMessage(recipientId, {
    sender_action: 'mark_seen'
  });
}
```

### Typing Indicators

```typescript
async function sendTypingOn(recipientId: string) {
  const url = `https://graph.facebook.com/v21.0/${pageId.value()}/messages`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pageAccessToken.value()}`
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      sender_action: 'typing_on'
    })
  });
}

async function sendTypingOff(recipientId: string) {
  const url = `https://graph.facebook.com/v21.0/${pageId.value()}/messages`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pageAccessToken.value()}`
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      sender_action: 'typing_off'
    })
  });
}
```

**Best Practices:**
1. Send `mark_seen` immediately when receiving message
2. Send `typing_on` before processing response
3. Send `typing_off` right before sending actual message
4. Mimic natural human typing patterns

## Receiving Messages

### Parse Incoming Messages

From webhook event:

```typescript
async function handleIncomingMessage(event: any) {
  const senderId = event.sender.id;
  const message = event.message;

  // Text message
  if (message.text) {
    console.log(`Text from ${senderId}: ${message.text}`);

    // Check for quick reply
    if (message.quick_reply) {
      const payload = message.quick_reply.payload;
      await handleQuickReplyResponse(senderId, payload, message.text);
      return;
    }

    await handleTextMessage(senderId, message.text);
  }

  // Media attachments
  else if (message.attachments) {
    for (const attachment of message.attachments) {
      await handleAttachment(senderId, attachment);
    }
  }
}

async function handleQuickReplyResponse(senderId: string, payload: string, text: string) {
  switch (payload) {
    case 'INTERESTED_IN_CARE':
      // Route to AI agent for lead qualification
      await routeToAIAgent(senderId, 'interested_in_care');
      break;

    case 'CONTENT_ONLY':
      // Send resource links and end conversation
      await sendContentResources(senderId);
      break;

    default:
      console.log('Unknown quick reply payload:', payload);
  }
}

async function handleTextMessage(senderId: string, text: string) {
  // Mark as seen
  await markSeen(senderId);

  // Show typing indicator
  await sendTypingOn(senderId);

  // Process with AI agent
  const response = await processWithAIAgent(senderId, text);

  // Stop typing
  await sendTypingOff(senderId);

  // Send response
  await sendTextMessage(senderId, response);
}
```

### Handle Attachments

```typescript
async function handleAttachment(senderId: string, attachment: any) {
  const type = attachment.type;
  const url = attachment.payload?.url;

  switch (type) {
    case 'image':
      console.log(`Image received: ${url}`);
      await sendTextMessage(senderId, 'Thanks for the image! How can I help you?');
      break;

    case 'video':
      console.log(`Video received: ${url}`);
      await sendTextMessage(senderId, 'Thanks for sharing!');
      break;

    case 'audio':
      console.log(`Audio received: ${url}`);
      await sendTextMessage(senderId, 'I received your audio message.');
      break;

    default:
      console.log(`Unknown attachment type: ${type}`);
  }
}
```

### Handle Postbacks (Buttons, Ice Breakers)

```typescript
async function handlePostback(event: any) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;
  const title = event.postback.title;

  console.log(`Postback from ${senderId}: ${title} (${payload})`);

  switch (payload) {
    case 'GET_STARTED':
      await sendWelcomeMessage(senderId);
      break;

    case 'SCHEDULE_APPOINTMENT':
      await initiateScheduling(senderId);
      break;

    case 'ASK_QUESTIONS':
      await routeToAIAgent(senderId, 'questions');
      break;

    default:
      console.log('Unknown postback payload:', payload);
  }
}
```

## Ice Breakers Setup

Ice Breakers are pre-defined conversation starters:

```typescript
async function setupIceBreakers() {
  const url = 'https://graph.facebook.com/v21.0/me/messenger_profile';

  const payload = {
    platform: 'instagram',
    ice_breakers: [
      {
        call_to_actions: [
          {
            question: 'What services do you offer?',
            payload: 'SERVICES_INFO'
          },
          {
            question: 'Schedule a consultation',
            payload: 'SCHEDULE_CONSULTATION'
          },
          {
            question: 'What are your hours?',
            payload: 'HOURS_INFO'
          },
          {
            question: 'Do you accept insurance?',
            payload: 'INSURANCE_INFO'
          }
        ],
        locale: 'default'
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pageAccessToken.value()}`
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}
```

**Ice Breaker Specifications:**
- Maximum 4 ice breakers
- Locale support (use "default" as fallback)
- Not available on desktop
- Triggers postback webhook event

## 24-Hour Messaging Window

### Understanding the Window

The 24-hour window starts when:
- User sends a message
- User clicks "Get Started" button
- User clicks an Ice Breaker
- User reacts to your message
- User clicks a Click-to-Messenger ad

### Within the 24-Hour Window

You can send:
- Any type of message
- Promotional content
- Multiple messages (one per user message received)

```typescript
async function sendWithinWindow(recipientId: string, text: string) {
  return sendMessage(recipientId, {
    text: text,
    messaging_type: 'RESPONSE'
  });
}
```

### Outside the 24-Hour Window

Must use message tags (limited use cases):

```typescript
async function sendWithTag(recipientId: string, text: string, tag: string) {
  const url = `https://graph.facebook.com/v21.0/${pageId.value()}/messages`;

  const payload = {
    recipient: { id: recipientId },
    messaging_type: 'MESSAGE_TAG',
    tag: tag,
    message: {
      text: text
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pageAccessToken.value()}`
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}

// Usage
await sendWithTag('USER-ID',
  'Your appointment has been confirmed for tomorrow at 2 PM.',
  'CONFIRMED_EVENT_UPDATE'
);
```

### Available Message Tags

| Tag | Use Case | Time Limit | Notes |
|-----|----------|------------|-------|
| `HUMAN_AGENT` | Customer support | 7 days | Requires App Review for Instagram |
| `ACCOUNT_UPDATE` | Account changes | No limit | Non-promotional only |
| `CONFIRMED_EVENT_UPDATE` | Appointment reminders | No limit | Must be for confirmed events |
| `POST_PURCHASE_UPDATE` | Order/shipping updates | No limit | No promotional content |

**Important:** Most tags don't work for Instagram. Only `HUMAN_AGENT` is explicitly supported and requires Advanced Access.

## Complete Implementation Example

### Conversation Flow for Chiropractic Lead Qualification

```typescript
import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// Step 1: User initiates conversation
async function handleUserInitiation(senderId: string, messageText: string) {
  // Mark as seen
  await markSeen(senderId);

  // Check if first-time user
  const userDoc = await db.collection('instagram_users').doc(senderId).get();

  if (!userDoc.exists) {
    // New user - send welcome message with quick replies
    await sendTypingOn(senderId);

    await sendQuickReply(senderId,
      'Hi! 👋 Thanks for reaching out. Are you interested in chiropractic care or are you here for the health content we share?',
      [
        { title: 'Chiropractic Care 💆', payload: 'INTERESTED_IN_CARE' },
        { title: 'Just for Content 📱', payload: 'CONTENT_ONLY' }
      ]
    );

    // Store user state
    await db.collection('instagram_users').doc(senderId).set({
      state: 'awaiting_interest_selection',
      createdAt: new Date(),
      lastInteraction: new Date()
    });
  } else {
    // Returning user - route to AI agent
    await routeToAIAgent(senderId, messageText);
  }
}

// Step 2: Handle quick reply response
async function handleInterestSelection(senderId: string, payload: string) {
  await markSeen(senderId);
  await sendTypingOn(senderId);

  if (payload === 'INTERESTED_IN_CARE') {
    // Update user state
    await db.collection('instagram_users').doc(senderId).update({
      state: 'qualified_lead',
      interestedInCare: true,
      lastInteraction: new Date()
    });

    // Send to AI agent for qualification
    await sendTextMessage(senderId,
      'Great! I\'d love to learn more about what brings you in. What\'s been going on with your health?'
    );

    // Initialize AI conversation
    await initializeAIConversation(senderId, 'lead_qualification');

  } else if (payload === 'CONTENT_ONLY') {
    // Update user state
    await db.collection('instagram_users').doc(senderId).update({
      state: 'content_follower',
      interestedInCare: false,
      lastInteraction: new Date()
    });

    // Send resource links
    await sendButtonTemplate(senderId,
      'Awesome! We share health tips and wellness content regularly. Check out these resources:',
      [
        {
          type: 'web_url',
          url: 'https://example.com/blog',
          title: 'Health Blog'
        },
        {
          type: 'web_url',
          url: 'https://example.com/videos',
          title: 'Video Library'
        }
      ]
    );
  }

  await sendTypingOff(senderId);
}

// Step 3: AI Agent Integration
async function routeToAIAgent(senderId: string, userMessage: string) {
  await sendTypingOn(senderId);

  try {
    // Get conversation history
    const conversationDoc = await db.collection('conversations').doc(senderId).get();
    const history = conversationDoc.exists ? conversationDoc.data()?.messages || [] : [];

    // Call your existing AI agent function
    const aiResponse = await processWithCustomAIAgent({
      userId: senderId,
      message: userMessage,
      conversationHistory: history,
      context: 'chiropractic_lead_qualification'
    });

    // Save to conversation history
    await db.collection('conversations').doc(senderId).set({
      messages: [
        ...history,
        { role: 'user', content: userMessage, timestamp: new Date() },
        { role: 'assistant', content: aiResponse, timestamp: new Date() }
      ],
      updatedAt: new Date()
    }, { merge: true });

    await sendTypingOff(senderId);

    // Send AI response
    await sendTextMessage(senderId, aiResponse);

  } catch (error) {
    console.error('AI agent error:', error);
    await sendTypingOff(senderId);

    // Fallback to human agent
    await sendTextMessage(senderId,
      'I apologize, but I\'m having trouble processing your request. Let me connect you with a team member who can help.'
    );
  }
}

// Step 4: Webhook handler
export const instagramWebhook = onRequest(async (req, res) => {
  // ... verification and signature validation ...

  res.sendStatus(200);

  const body = req.body;

  for (const entry of body.entry) {
    if (entry.messaging) {
      for (const event of entry.messaging) {
        const senderId = event.sender.id;

        // Handle incoming message
        if (event.message) {
          const text = event.message.text;

          // Check for quick reply
          if (event.message.quick_reply) {
            await handleInterestSelection(senderId, event.message.quick_reply.payload);
          } else if (text) {
            await handleUserInitiation(senderId, text);
          }
        }

        // Handle postback (ice breakers, buttons)
        else if (event.postback) {
          await handlePostback(event);
        }
      }
    }
  }
});

// Mock AI agent function (replace with your actual implementation)
async function processWithCustomAIAgent(params: any): Promise<string> {
  // This should call your existing AI agent function
  // For example, if you have a Cloud Function named 'claudeAgent':

  const response = await fetch('https://YOUR-REGION-PROJECT.cloudfunctions.net/claudeAgent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: params.message,
      conversationHistory: params.conversationHistory,
      context: params.context
    })
  });

  const result = await response.json();
  return result.response;
}
```

## Rate Limits

**Instagram-specific limits:**
- Text messages: 300 calls/second
- Audio/Video: 10 calls/second
- Daily limit: 200 × number of engaged users per 24 hours

**Check rate limit headers:**

```typescript
async function sendMessageWithRateLimit(recipientId: string, message: any) {
  const response = await fetch(/* ... */);

  // Check rate limit usage
  const usageHeader = response.headers.get('X-Business-Use-Case-Usage');
  if (usageHeader) {
    const usage = JSON.parse(usageHeader);
    console.log('Rate limit usage:', usage);

    // If approaching limit, implement backoff
    if (usage.call_count > 250) {
      console.warn('Approaching rate limit, implementing backoff');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return response.json();
}
```

## Error Handling

```typescript
async function sendMessageWithRetry(recipientId: string, message: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendMessage(recipientId, message);
    } catch (error: any) {
      console.error(`Send attempt ${attempt} failed:`, error);

      // Check error type
      if (error.code === 'RATE_LIMIT') {
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      if (error.code === 'INVALID_RECIPIENT') {
        // User blocked or deleted account
        console.error('Invalid recipient, cannot send');
        break;
      }

      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}
```

## Best Practices

1. **Always respond quickly** - Users expect fast responses
2. **Use typing indicators** - Makes conversation feel natural
3. **Mark messages as seen** - Shows you received the message
4. **One message per user message** - Instagram limits responses
5. **Leverage Quick Replies** - Makes user selection easy
6. **Handle errors gracefully** - Always have fallback responses
7. **Track conversation state** - Store in Firestore for context
8. **Monitor rate limits** - Implement backoff strategies
9. **Test thoroughly** - Use app role users before production
10. **Log everything** - Essential for debugging and improvement

## Next Steps

1. Review [webhook-setup.md](./webhook-setup.md) for webhook configuration
2. Review [authentication.md](./authentication.md) for token setup
3. Implement message handlers in your Firebase project
4. Integrate with your existing AI agent
5. Test conversation flows with team members
6. Submit for App Review for production access
