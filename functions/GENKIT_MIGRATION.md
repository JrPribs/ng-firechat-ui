# Genkit Migration Summary

## Overview
Created a new Genkit-based version of the `getAgentResponse` function that maintains the same functionality as the original while leveraging Firebase Genkit and the genkitx-anthropic plugin.

## Files Created

### 1. Main Function
**File:** `src/get-agent-response-genkit.ts`
- Replaces direct Anthropic SDK calls with Genkit flows
- Uses `onCallGenkit` for Firebase callable function integration
- Maintains same input/output schema as original function
- Implements proper input/output validation with Zod schemas

### 2. Prompt Files
**Files:**
- `src/prompts/message-genkit.prompt.ts`
- `src/prompts/system-genkit.prompt.ts`

These are duplicates of the original prompt files to keep the implementations separate and avoid any conflicts.

## Key Differences from Original

### Architecture
- **Original:** Direct Anthropic SDK client initialization and API calls
- **Genkit:** Uses Genkit flows with the genkitx-anthropic plugin

### API Structure
```typescript
// Original
const anthropic = new Anthropic({ apiKey: ... });
const response = await anthropic.messages.create({ ... });

// Genkit
const ai = genkit({ plugins: [anthropic({ apiKey: ... })] });
const response = await ai.generate({ prompt: ..., system: ... });
```

### Benefits of Genkit Version
1. **Structured Flows:** Genkit flows provide better organization and testability
2. **Input/Output Validation:** Built-in Zod schema validation
3. **Streaming Support:** Automatic support for both streaming and JSON responses
4. **Firebase Integration:** Seamless integration with Firebase Functions
5. **Monitoring:** Better observability through Genkit's built-in tooling

## Configuration

### Dependencies Added
```json
{
  "genkitx-anthropic": "^0.25.0"
}
```

### Environment Variables
Both functions use the same secret:
- `ANTHROPIC_API_KEY` (Firebase secret)

## Usage

### Client-Side Call
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const getAgentResponseGenkit = httpsCallable(functions, 'getAgentResponseGenkit');

const result = await getAgentResponseGenkit({ chatId: 'chat-123' });
```

### Response Format
```typescript
{
  message: string;           // First message from the agent
  allMessages: string[];     // All messages generated
  chatId: string;           // The chat ID
  timestamp: string;        // ISO timestamp
}
```

## Next Steps

1. **Testing:** Test the new function in the Firebase emulator
2. **Deployment:** Deploy alongside the existing function for A/B testing
3. **Migration:** Gradually migrate traffic from the old function to the new one
4. **Monitoring:** Monitor performance and response quality
5. **Cleanup:** Remove the old function once migration is complete

## Function Exports

The new function is exported in `src/index.ts`:
```typescript
export * from "./get-agent-response-genkit";
```

This allows it to be deployed alongside the existing functions without conflicts.
