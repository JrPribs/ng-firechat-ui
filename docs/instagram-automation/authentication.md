# Instagram Messaging API Authentication Guide

Complete guide for setting up authentication and permissions for Instagram Messaging API.

## Table of Contents
- [Overview](#overview)
- [Required Permissions](#required-permissions)
- [Account Setup](#account-setup)
- [Token Generation](#token-generation)
- [Token Management](#token-management)
- [App Review Process](#app-review-process)
- [Production Deployment](#production-deployment)

## Overview

Instagram Messaging API authentication requires:
1. Meta Developer account and app
2. Instagram Professional account (Business or Creator)
3. Facebook Page (for traditional method)
4. Proper permissions and access tokens
5. Business Verification
6. App Review for production (Advanced Access)

## Required Permissions

### Instagram Messaging Permissions

**Core Permissions (Required):**
- `instagram_basic` - Read basic Instagram Business account metadata
- `instagram_manage_messages` - Read and respond to Instagram Direct messages
- `pages_manage_metadata` - Subscribe to webhooks and update Page settings
- `pages_show_list` - Access list of Pages a person manages
- `business_management` - Manage business assets

### Access Levels

**Standard Access:**
- Available by default
- Only works with app role users (Administrators, Developers, Testers)
- Limited to development and testing
- No App Review required

**Advanced Access:**
- Required for production use
- Works with all users who grant permissions
- Requires Business Verification
- Requires App Review approval

## Account Setup

### Step 1: Create Meta Developer Account

1. Go to [Meta Developer Portal](https://developers.facebook.com)
2. Click "Get Started"
3. Verify email and phone number
4. Accept Developer Terms

### Step 2: Create Meta App

1. Navigate to [Create App](https://developers.facebook.com/apps/creation/)
2. Select use case:
   - Choose "Other" → "Business" for Instagram messaging
3. Enter app details:
   - App Name: "Chiropractic DM Automation"
   - Contact Email: Your business email
4. Create app
5. Note your **App ID** and **App Secret**

### Step 3: Add Products to App

1. In App Dashboard, click "Add Product"
2. Add **Instagram** product
3. Add **Messenger** product (required for messaging)
4. Add **Webhooks** (auto-added with Messenger)

### Step 4: Configure Instagram Professional Account

#### Convert to Business Account:

1. Open Instagram app
2. Go to Settings → Account
3. Select "Switch to Professional Account"
4. Choose **Business** (recommended) or Creator
5. Select category (Healthcare/Chiropractic)
6. Complete setup

#### Link to Facebook Page (Traditional Method):

1. Go to Instagram Settings → Account
2. Select "Linked Accounts" → Facebook
3. Connect to your Facebook Page
4. Or link via Facebook Page settings:
   - Go to Facebook Page → Settings
   - Click Instagram → Connect Account
   - Authenticate and confirm

**Note:** As of July 2024, new Instagram Business Login method may not require Facebook Page for conversations. Check latest documentation.

### Step 5: Enable Connected Tools

1. Go to Instagram Settings → Privacy
2. Select "Messages"
3. Scroll to "Connected tools"
4. Toggle ON to allow API access

## Token Generation

### Authentication Flow Options

#### Option A: Facebook Login (Traditional)

```typescript
// Step 1: Trigger Facebook Login
const loginUrl = 'https://www.facebook.com/v21.0/dialog/oauth?' +
  'client_id=' + encodeURIComponent(APP_ID) +
  '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
  '&scope=' + encodeURIComponent('instagram_basic,instagram_manage_messages,pages_manage_metadata,pages_show_list,business_management') +
  '&response_type=code';

// Step 2: User grants permissions, receives authorization code

// Step 3: Exchange code for User Access Token
const tokenResponse = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: APP_ID,
    client_secret: APP_SECRET,
    redirect_uri: REDIRECT_URI,
    code: authorizationCode
  })
});

const { access_token } = await tokenResponse.json();

// Step 4: Get Page Access Token
const pagesResponse = await fetch(
  `https://graph.facebook.com/v21.0/me/accounts?access_token=${access_token}`
);

const pages = await pagesResponse.json();
const pageAccessToken = pages.data[0].access_token;
const pageId = pages.data[0].id;
```

#### Option B: Instagram Business Login (New Method)

```typescript
// Step 1: Build authorization URL
const loginUrl = 'https://www.instagram.com/oauth/authorize?' +
  'client_id=' + encodeURIComponent(APP_ID) +
  '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
  '&scope=' + encodeURIComponent('instagram_business_basic,instagram_business_manage_messages') +
  '&response_type=code';

// Step 2: User grants permissions, receives authorization code

// Step 3: Exchange code for short-lived token
const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: APP_ID,
    client_secret: APP_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
    code: authorizationCode
  })
});

const { access_token, user_id } = await tokenResponse.json();

// Step 4: Exchange for long-lived token (60 days)
const longLivedResponse = await fetch(
  'https://graph.instagram.com/access_token?' +
  'grant_type=ig_exchange_token' +
  `&client_secret=${APP_SECRET}` +
  `&access_token=${access_token}`
);

const { access_token: longLivedToken } = await longLivedResponse.json();
```

### Firebase Implementation

```typescript
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { getFirestore } from 'firebase-admin/firestore';

const appId = defineString('INSTAGRAM_APP_ID');
const appSecret = defineSecret('INSTAGRAM_APP_SECRET');
const redirectUri = defineString('INSTAGRAM_REDIRECT_URI');

const db = getFirestore();

// Step 1: Initiate OAuth flow
export const instagramAuth = onRequest(async (req, res) => {
  const loginUrl = 'https://www.facebook.com/v21.0/dialog/oauth?' +
    `client_id=${appId.value()}` +
    `&redirect_uri=${encodeURIComponent(redirectUri.value())}` +
    '&scope=instagram_basic,instagram_manage_messages,pages_manage_metadata,pages_show_list,business_management' +
    '&response_type=code';

  res.redirect(loginUrl);
});

// Step 2: Handle OAuth callback
export const instagramAuthCallback = onRequest(async (req, res) => {
  const code = req.query.code as string;

  if (!code) {
    res.status(400).send('Missing authorization code');
    return;
  }

  try {
    // Exchange code for User Access Token
    const tokenResponse = await fetch(
      'https://graph.facebook.com/v21.0/oauth/access_token?' +
      `client_id=${appId.value()}` +
      `&client_secret=${appSecret.value()}` +
      `&redirect_uri=${encodeURIComponent(redirectUri.value())}` +
      `&code=${code}`
    );

    const tokenData = await tokenResponse.json();
    const userAccessToken = tokenData.access_token;

    // Get Page Access Token
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`
    );

    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      res.status(400).send('No Facebook Pages found');
      return;
    }

    const page = pagesData.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;

    // Get Instagram account linked to page
    const igResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    const igData = await igResponse.json();
    const instagramAccountId = igData.instagram_business_account?.id;

    if (!instagramAccountId) {
      res.status(400).send('No Instagram Business Account linked to Page');
      return;
    }

    // Exchange for long-lived Page Access Token (60 days)
    const longLivedResponse = await fetch(
      'https://graph.facebook.com/v21.0/oauth/access_token?' +
      'grant_type=fb_exchange_token' +
      `&client_id=${appId.value()}` +
      `&client_secret=${appSecret.value()}` +
      `&fb_exchange_token=${pageAccessToken}`
    );

    const longLivedData = await longLivedResponse.json();
    const longLivedToken = longLivedData.access_token;

    // Store tokens securely
    await db.collection('instagram_config').doc('credentials').set({
      pageId: pageId,
      instagramAccountId: instagramAccountId,
      pageAccessToken: longLivedToken,
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      updatedAt: new Date()
    });

    res.send('Authentication successful! Tokens stored securely.');

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication failed');
  }
});
```

## Token Management

### Token Types and Expiration

| Token Type | Lifetime | Usage |
|------------|----------|-------|
| Authorization Code | 1 hour | Exchange for access token |
| Short-lived User Token | 1 hour | Exchange for long-lived token |
| Long-lived User Token | 60 days | Get Page Access Tokens |
| Long-lived Page Token | 60 days | Send/receive messages |

### Automatic Token Refresh

```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore } from 'firebase-admin/firestore';

const appSecret = defineSecret('INSTAGRAM_APP_SECRET');
const db = getFirestore();

// Run daily to check and refresh tokens
export const refreshInstagramToken = onSchedule({
  schedule: 'every day 00:00',
  secrets: [appSecret]
}, async () => {
  const configDoc = await db.collection('instagram_config').doc('credentials').get();

  if (!configDoc.exists) {
    console.error('No credentials found');
    return;
  }

  const config = configDoc.data()!;
  const expiresAt = config.tokenExpiresAt.toDate();
  const daysUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

  // Refresh if less than 7 days until expiry
  if (daysUntilExpiry < 7) {
    console.log('Token expiring soon, refreshing...');

    try {
      const response = await fetch(
        'https://graph.facebook.com/v21.0/oauth/access_token?' +
        'grant_type=fb_exchange_token' +
        `&client_id=${process.env.INSTAGRAM_APP_ID}` +
        `&client_secret=${appSecret.value()}` +
        `&fb_exchange_token=${config.pageAccessToken}`
      );

      const data = await response.json();

      await db.collection('instagram_config').doc('credentials').update({
        pageAccessToken: data.access_token,
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        lastRefreshed: new Date()
      });

      console.log('Token refreshed successfully');

    } catch (error) {
      console.error('Token refresh failed:', error);
      // TODO: Alert admin to re-authenticate
    }
  } else {
    console.log(`Token valid for ${Math.floor(daysUntilExpiry)} more days`);
  }
});
```

### Manual Refresh (Instagram Business Login)

```typescript
async function refreshInstagramBusinessToken(currentToken: string) {
  const response = await fetch(
    'https://graph.instagram.com/refresh_access_token?' +
    'grant_type=ig_refresh_token' +
    `&access_token=${currentToken}`
  );

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in
  };
}
```

### Secure Token Storage

Use Firebase Secret Manager for tokens:

```bash
# Set Page Access Token as secret
firebase functions:secrets:set INSTAGRAM_PAGE_ACCESS_TOKEN

# Set Page ID as environment variable
firebase functions:config:set instagram.page_id="YOUR-PAGE-ID"
```

```typescript
import { defineSecret, defineString } from 'firebase-functions/params';

const pageAccessToken = defineSecret('INSTAGRAM_PAGE_ACCESS_TOKEN');
const pageId = defineString('INSTAGRAM_PAGE_ID');

export const sendMessage = onRequest({
  secrets: [pageAccessToken]
}, async (req, res) => {
  const url = `https://graph.facebook.com/v21.0/${pageId.value()}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pageAccessToken.value()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  });

  const data = await response.json();
  res.json(data);
});
```

## App Review Process

### Prerequisites

1. **Business Verification (Required as of Feb 1, 2023)**
   - Complete in Facebook Business Manager
   - Requires business documentation
   - Business Admin must complete verification
   - Timeline: 1-5 business days typically

2. **Working App in Development Mode**
   - Fully functional with app role users
   - All features implemented and tested
   - Webhook endpoints deployed and verified

3. **Use Case Documentation**
   - Clear description of how permissions are used
   - Screenshots/videos demonstrating functionality
   - Test credentials (if needed)

### Submission Process

#### Step 1: Complete Business Verification

1. Go to [Business Manager](https://business.facebook.com)
2. Business Settings → Security Center
3. Start Verification
4. Provide required documents:
   - Business registration documents
   - Tax ID or business license
   - Proof of address
5. Wait for approval (1-5 business days)

#### Step 2: Prepare App Review Submission

Create a demonstration video showing:

1. **User grants permissions:**
   - Show OAuth login flow
   - User granting required permissions

2. **How each permission is used:**
   - `instagram_manage_messages`: Receiving and sending DMs
   - `pages_manage_metadata`: Subscribing to webhooks
   - Show exact API calls made

3. **Complete user flow:**
   - User sends message
   - Bot responds with qualification question
   - User selects option
   - AI agent continues conversation

**Video Requirements:**
- Clear screen recording
- Narration or subtitles explaining each step
- Show actual API calls in network tab (optional but helpful)
- Under 5 minutes total

#### Step 3: Submit for App Review

1. Go to App Dashboard → App Review → Permissions and Features
2. Request Advanced Access for:
   - `instagram_manage_messages`
   - `pages_manage_metadata`
   - `pages_show_list`

3. For each permission, provide:
   - **Use case description:**
     ```
     Our app provides automated customer support for chiropractic practices.
     When patients message our Instagram Business account, our AI-powered bot
     helps qualify leads, answer questions, and schedule consultations.

     We use instagram_manage_messages to:
     - Receive incoming direct messages from patients
     - Send automated responses with qualification questions
     - Route conversations to AI agent for personalized support
     - Provide appointment scheduling assistance
     ```

   - **Upload demonstration video**
   - **Provide test credentials** (if app requires login)

4. Submit for review

#### Step 4: Review Process

**Timeline:** Typically 3-7 business days

**Possible Outcomes:**

**Approved:**
- Permissions granted Advanced Access
- Can now use with all users
- Switch app to Live mode

**Additional Information Needed:**
- Meta requests clarification
- Respond promptly with requested info
- Review continues after response

**Rejected:**
- Review feedback explains reason
- Address issues
- Resubmit (wait 7 days between submissions)

**Common Rejection Reasons:**
1. App not accessible for testing
2. Use case not clearly demonstrated
3. Requesting permissions not actually used
4. Business Verification incomplete
5. Privacy policy issues

## Production Deployment

### Step 1: Pre-Launch Checklist

- [ ] Business Verification complete
- [ ] App Review approved (Advanced Access)
- [ ] All tokens properly stored as secrets
- [ ] Webhook endpoints deployed and tested
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Monitoring and alerts set up
- [ ] Privacy policy published
- [ ] Terms of service published

### Step 2: Switch to Live Mode

1. **Admin Only:** Go to App Dashboard → Settings → Basic
2. Toggle "App Mode" to **Live**
3. Confirm you understand data visibility changes

**Important:** Once Live:
- All previously private test data becomes public
- App appears in public search
- Webhooks sent to all users (with Advanced Access)

### Step 3: Monitor Initial Traffic

```typescript
import { logger } from 'firebase-functions/v2';

export const instagramWebhook = onRequest(async (req, res) => {
  const startTime = Date.now();

  try {
    // Process webhook
    await processEvents(req.body);

    // Log success metrics
    logger.info('Webhook processed', {
      duration: Date.now() - startTime,
      eventCount: req.body.entry?.length || 0,
      environment: 'production'
    });

    res.sendStatus(200);

  } catch (error) {
    // Log error with context
    logger.error('Webhook processing failed', {
      error: error.message,
      duration: Date.now() - startTime,
      payload: JSON.stringify(req.body)
    });

    // Still respond 200 OK to prevent retries
    res.sendStatus(200);
  }
});
```

### Step 4: Set Up Alerts

Configure Cloud Monitoring alerts for:

1. **High error rate** (>5% errors)
2. **Token expiration** (<7 days remaining)
3. **Rate limit warnings** (>80% usage)
4. **Webhook failures** (>10 failures/hour)
5. **Signature validation failures**

### Step 5: Ongoing Maintenance

**Weekly:**
- [ ] Review error logs
- [ ] Check token expiration dates
- [ ] Monitor rate limit usage
- [ ] Review conversation metrics

**Monthly:**
- [ ] Analyze conversation success rates
- [ ] Optimize AI agent prompts
- [ ] Update Ice Breakers based on data
- [ ] Review and improve error handling

**Quarterly:**
- [ ] Update to latest API version
- [ ] Review Meta policy changes
- [ ] Renew Business Verification (if needed)
- [ ] Optimize conversation flows

## Security Best Practices

### 1. Never Expose Secrets

```typescript
// ❌ WRONG - Never do this
const appSecret = '1234567890abcdef';

// ✅ CORRECT - Use Firebase Secret Manager
import { defineSecret } from 'firebase-functions/params';
const appSecret = defineSecret('INSTAGRAM_APP_SECRET');
```

### 2. Validate All Webhook Signatures

```typescript
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
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

### 3. Implement Token Rotation

```typescript
// Rotate tokens before expiration
// Set up automated refresh at 50 days (10 days before expiry)
```

### 4. Encrypt Sensitive Data

```typescript
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// Store encrypted user data
await db.collection('conversations').doc(userId).set({
  messages: encryptedMessages,
  personalInfo: encryptedInfo,
  createdAt: new Date()
});
```

### 5. Audit Access Logs

```typescript
// Log all token usage
logger.info('Token accessed', {
  functionName: 'sendMessage',
  userId: userId,
  timestamp: new Date(),
  ipAddress: req.ip
});
```

## Troubleshooting

### Issue: "Invalid OAuth access token"

**Cause:** Expired or invalid token

**Solution:**
1. Check token expiration date
2. Refresh token if expired
3. Re-authenticate if refresh fails

### Issue: "Insufficient permissions"

**Cause:** Missing required permissions or not approved

**Solution:**
1. Verify all required permissions granted
2. Check if Advanced Access approved
3. Ensure user has role on Page (MODERATE or higher)

### Issue: "App not in Live mode"

**Cause:** App still in Development mode

**Solution:**
1. Complete Business Verification
2. Get App Review approval
3. Admin switches to Live mode

### Issue: "Token refresh failed"

**Cause:** Token cannot be refreshed after expiration

**Solution:**
1. Check if token completely expired (>90 days inactive)
2. If expired, user must re-authenticate
3. Implement proactive refresh before expiration

## Next Steps

1. Review [overview.md](./overview.md) for complete system architecture
2. Review [webhook-setup.md](./webhook-setup.md) for webhook configuration
3. Review [message-handling.md](./message-handling.md) for message flows
4. Begin authentication setup in your Firebase project
5. Test with app role users before App Review submission
