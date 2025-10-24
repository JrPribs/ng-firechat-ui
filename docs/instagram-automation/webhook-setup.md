# Instagram Webhook Setup Guide

This guide covers the complete setup and implementation of Instagram webhooks for automated DM responses.

## Prerequisites

- Meta Developer account
- Instagram Professional account (Business or Creator)
- Facebook Page linked to Instagram account
- HTTPS endpoint with valid SSL certificate
- Firebase Functions v2 project

## Webhook Types

Instagram supports two webhook systems:

### 1. Instagram Graph API Webhooks
Used for: Comments, Mentions, Story Insights

### 2. Instagram Messaging Webhooks (Messenger Platform)
Used for: Direct messages, Reactions, Postbacks, Read receipts

## Setup Steps

### Step 1: Configure Meta App

1. Go to [Meta Developer Dashboard](https://developers.facebook.com/apps)
2. Create a new app or select existing app
3. Add Instagram product
4. Add Messenger product (for messaging webhooks)
5. Note your App ID and App Secret

### Step 2: Create Webhook Endpoint in Firebase Functions

```typescript
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as crypto from 'crypto';

const appSecret = defineSecret('INSTAGRAM_APP_SECRET');
const verifyToken = defineSecret('WEBHOOK_VERIFY_TOKEN');

export const instagramWebhook = onRequest({
  secrets: [appSecret, verifyToken],
  cors: true,
}, async (req, res) => {

  // Webhook Verification (GET request)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === verifyToken.value()) {
      console.log('Webhook verified successfully');
      res.status(200).send(challenge);
      return;
    }

    console.error('Webhook verification failed');
    res.sendStatus(403);
    return;
  }

  // Handle Webhook Events (POST request)
  if (req.method === 'POST') {
    // Verify signature
    const signature = req.headers['x-hub-signature-256'] as string;

    if (!signature) {
      console.error('Missing signature header');
      res.sendStatus(403);
      return;
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', appSecret.value())
      .update(payload)
      .digest('hex');

    // Timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      console.error('Invalid signature');
      res.sendStatus(403);
      return;
    }

    // Process webhook payload
    const body = req.body;

    // Respond immediately with 200 OK
    res.sendStatus(200);

    // Process events asynchronously (don't block response)
    processWebhookEvents(body).catch(error => {
      console.error('Error processing webhook:', error);
    });

    return;
  }

  res.sendStatus(405); // Method not allowed
});

async function processWebhookEvents(body: any) {
  if (body.object !== 'instagram') {
    console.log('Not an Instagram webhook');
    return;
  }

  for (const entry of body.entry) {
    // Handle Graph API webhooks (comments, mentions, story_insights)
    if (entry.changes) {
      for (const change of entry.changes) {
        await handleGraphAPIEvent(change);
      }
    }

    // Handle Messaging webhooks
    if (entry.messaging) {
      for (const event of entry.messaging) {
        await handleMessagingEvent(event);
      }
    }
  }
}

async function handleGraphAPIEvent(change: any) {
  const field = change.field;
  const value = change.value;

  switch (field) {
    case 'comments':
      console.log('New comment:', value.text);
      // TODO: Handle comment (potentially reply via DM)
      break;

    case 'mentions':
      console.log('New mention:', value.media_id);
      // TODO: Handle mention
      break;

    case 'story_insights':
      console.log('Story insights received');
      // TODO: Store insights for analytics
      break;

    default:
      console.log('Unknown field:', field);
  }
}

async function handleMessagingEvent(event: any) {
  const senderId = event.sender.id;
  const recipientId = event.recipient.id;
  const timestamp = event.timestamp;

  // Handle incoming message
  if (event.message) {
    const messageId = event.message.mid;
    const messageText = event.message.text;

    console.log(`Message from ${senderId}: ${messageText}`);

    // Check for quick reply payload
    if (event.message.quick_reply) {
      const payload = event.message.quick_reply.payload;
      console.log('Quick reply payload:', payload);
      // TODO: Route to AI agent based on payload
    }

    // TODO: Send to AI agent for processing
    await handleIncomingMessage(senderId, messageText, messageId);
  }

  // Handle reaction
  else if (event.reaction) {
    const messageId = event.reaction.mid;
    const reaction = event.reaction.reaction;
    console.log(`Reaction ${reaction} to message ${messageId}`);
  }

  // Handle postback (button clicks, ice breakers)
  else if (event.postback) {
    const payload = event.postback.payload;
    const title = event.postback.title;
    console.log(`Postback: ${title} (${payload})`);
    // TODO: Handle button clicks
  }

  // Handle read receipt
  else if (event.read) {
    console.log(`Message marked as read by ${senderId}`);
  }
}

async function handleIncomingMessage(
  senderId: string,
  text: string,
  messageId: string
) {
  // TODO: Implement your message handling logic
  // 1. Mark message as seen
  // 2. Send typing indicator
  // 3. Process with AI agent
  // 4. Send response
}
```

### Step 3: Deploy to Firebase

```bash
# Set secrets
firebase functions:secrets:set INSTAGRAM_APP_SECRET
firebase functions:secrets:set WEBHOOK_VERIFY_TOKEN

# Deploy function
firebase deploy --only functions:instagramWebhook
```

### Step 4: Configure Webhook in Meta App Dashboard

1. Go to App Dashboard → Products → Webhooks
2. Select webhook object type:
   - **"Instagram"** for Graph API (comments, mentions)
   - **"Instagram Messaging"** for DMs
3. Enter Callback URL: `https://YOUR-REGION-PROJECT-ID.cloudfunctions.net/instagramWebhook`
4. Enter Verify Token (must match your secret)
5. Click "Verify and Save"

### Step 5: Subscribe to Webhook Fields

#### For Instagram Messaging Webhooks:

Send POST request to enable messaging webhooks:

```bash
curl -X POST "https://graph.facebook.com/v21.0/{PAGE-ID}/subscribed_apps" \
  -d "subscribed_fields=messages,messaging_postbacks,message_reactions,messaging_seen" \
  -d "access_token={PAGE-ACCESS-TOKEN}"
```

**Required subscriptions for DM automation:**
- `messages` - Incoming text, media, story replies
- `messaging_postbacks` - Ice breaker clicks, button clicks
- `message_reactions` - User reactions to messages
- `messaging_seen` - Read receipts

#### For Instagram Graph API Webhooks:

Send POST request:

```bash
curl -X POST "https://graph.facebook.com/v21.0/{IG-USER-ID}/subscribed_apps" \
  -d "subscribed_fields=comments,mentions" \
  -d "access_token={ACCESS-TOKEN}"
```

## Webhook Event Types

### Messaging Events

#### 1. Text Message
```json
{
  "object": "instagram",
  "entry": [{
    "messaging": [{
      "sender": { "id": "USER-ID" },
      "recipient": { "id": "PAGE-ID" },
      "timestamp": 1234567890,
      "message": {
        "mid": "MESSAGE-ID",
        "text": "Hello!"
      }
    }]
  }]
}
```

#### 2. Message with Attachments
```json
{
  "message": {
    "mid": "MESSAGE-ID",
    "attachments": [{
      "type": "image",
      "payload": {
        "url": "https://example.com/image.jpg"
      }
    }]
  }
}
```

#### 3. Quick Reply Response
```json
{
  "message": {
    "mid": "MESSAGE-ID",
    "text": "Option 1",
    "quick_reply": {
      "payload": "OPTION_1_PAYLOAD"
    }
  }
}
```

#### 4. Postback (Ice Breakers, Buttons)
```json
{
  "postback": {
    "mid": "MESSAGE-ID",
    "title": "Get Started",
    "payload": "GET_STARTED_PAYLOAD"
  }
}
```

#### 5. Message Reaction
```json
{
  "reaction": {
    "mid": "MESSAGE-ID",
    "action": "react",
    "reaction": "love",
    "emoji": "❤️"
  }
}
```

### Graph API Events

#### 1. Comment
```json
{
  "object": "instagram",
  "entry": [{
    "changes": [{
      "field": "comments",
      "value": {
        "id": "COMMENT-ID",
        "text": "Great post!",
        "media_id": "MEDIA-ID"
      }
    }]
  }]
}
```

#### 2. Mention
```json
{
  "changes": [{
    "field": "mentions",
    "value": {
      "comment_id": "COMMENT-ID",
      "media_id": "MEDIA-ID"
    }
  }]
}
```

## Security Best Practices

### 1. Signature Verification (Critical)

Always validate the `X-Hub-Signature-256` header:

```typescript
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### 2. Token Security

- Store app secret in Firebase Secret Manager
- Never commit secrets to git
- Use different secrets for dev/prod environments
- Rotate verify token periodically

### 3. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'second'
});

async function handleWebhook(req: any, res: any) {
  const remaining = await limiter.removeTokens(1);

  if (remaining < 0) {
    res.status(429).send('Rate limit exceeded');
    return;
  }

  // Process webhook
}
```

### 4. Input Validation

Always validate webhook payloads:

```typescript
function validateWebhookPayload(body: any): boolean {
  if (!body || typeof body !== 'object') return false;
  if (body.object !== 'instagram') return false;
  if (!Array.isArray(body.entry)) return false;
  return true;
}
```

## Error Handling

### Webhook Retry Logic

Meta automatically retries failed webhooks:
- Immediate retry on initial failure
- Additional retries with decreasing frequency over 36 hours
- Dropped after 36 hours

**Best Practice:** Always respond with 200 OK immediately:

```typescript
export const instagramWebhook = onRequest(async (req, res) => {
  // Validate and verify

  // Respond immediately
  res.sendStatus(200);

  // Process asynchronously
  processEvents(req.body).catch(console.error);
});
```

### Deduplication

Implement deduplication to handle retry duplicates:

```typescript
import { getFirestore } from 'firebase-admin/firestore';

const processedEvents = new Set<string>();

async function handleMessage(event: any) {
  const eventId = `${event.sender.id}_${event.timestamp}_${event.message.mid}`;

  // Check if already processed
  const db = getFirestore();
  const eventDoc = await db.collection('processed_events').doc(eventId).get();

  if (eventDoc.exists) {
    console.log('Duplicate event, skipping');
    return;
  }

  // Mark as processed
  await db.collection('processed_events').doc(eventId).set({
    processedAt: new Date(),
    senderId: event.sender.id,
    messageId: event.message.mid
  });

  // Process event
  await processMessage(event);
}
```

## Testing Webhooks

### Development Testing

1. **Use ngrok for local testing:**
```bash
ngrok http 5001
```

2. **Update webhook URL in Meta Dashboard** with ngrok URL

3. **Test with app role users:**
   - Add test users to app (Administrators, Developers, Testers)
   - Send test messages from their Instagram accounts

### Webhook Debugging

1. **Enable detailed logging:**
```typescript
console.log('Webhook received:', JSON.stringify(req.body, null, 2));
```

2. **Use Meta's Webhook Testing Tool:**
   - Go to App Dashboard → Webhooks
   - Click "Test" to send sample payloads

3. **Monitor Firebase Functions logs:**
```bash
firebase functions:log --only instagramWebhook
```

## Common Issues and Solutions

### Issue 1: Webhook Verification Fails

**Cause:** Verify token mismatch

**Solution:**
- Ensure token in code matches token in Meta Dashboard
- Check for extra whitespace in token
- Verify secret is properly set in Firebase

### Issue 2: Signature Validation Fails

**Cause:** App secret mismatch or payload modification

**Solution:**
- Verify app secret is correct
- Use raw request body for signature validation
- Don't modify body before validation

### Issue 3: Webhooks Not Received

**Cause:** Subscription not enabled or app not in Live mode

**Solution:**
- Check subscribed_apps endpoint response
- Verify app is in Live mode for non-role users
- Ensure Advanced Access is approved

### Issue 4: Timeout Errors

**Cause:** Slow processing blocking webhook response

**Solution:**
- Respond with 200 OK immediately
- Process events asynchronously
- Use message queues for heavy processing

## Advanced Configuration

### Message Queue Integration

For high-volume processing, use Cloud Tasks:

```typescript
import { CloudTasksClient } from '@google-cloud/tasks';

const tasksClient = new CloudTasksClient();

async function queueMessageProcessing(event: any) {
  const project = 'your-project-id';
  const location = 'us-central1';
  const queue = 'instagram-messages';

  const parent = tasksClient.queuePath(project, location, queue);

  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url: 'https://your-region-project.cloudfunctions.net/processMessage',
      body: Buffer.from(JSON.stringify(event)).toString('base64'),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  };

  await tasksClient.createTask({ parent, task });
}
```

### Webhook Event Filtering

Filter events before processing:

```typescript
async function processWebhookEvents(body: any) {
  for (const entry of body.entry) {
    if (entry.messaging) {
      for (const event of entry.messaging) {
        // Filter: Only process text messages
        if (event.message && event.message.text) {
          await handleTextMessage(event);
        }

        // Filter: Only process ice breaker postbacks
        if (event.postback && event.postback.payload.startsWith('ICE_BREAKER_')) {
          await handleIceBreaker(event);
        }
      }
    }
  }
}
```

## Monitoring and Alerts

### Set up monitoring:

```typescript
import { logger } from 'firebase-functions/v2';

export const instagramWebhook = onRequest(async (req, res) => {
  const startTime = Date.now();

  try {
    // Process webhook

    logger.info('Webhook processed successfully', {
      duration: Date.now() - startTime,
      eventCount: req.body.entry?.length || 0
    });
  } catch (error) {
    logger.error('Webhook processing failed', {
      error: error.message,
      duration: Date.now() - startTime
    });

    // Don't fail the webhook response
    res.sendStatus(200);
  }
});
```

### Alert on failures:

Configure Cloud Monitoring alerts for:
- High error rate (>5% errors)
- Slow processing (>2 seconds avg)
- Signature validation failures
- Unexpected event types

## Next Steps

1. Review [message-handling.md](./message-handling.md) for sending/receiving messages
2. Review [authentication.md](./authentication.md) for token management
3. Implement webhook endpoint in your Firebase project
4. Test with app role users
5. Submit for App Review for production access
