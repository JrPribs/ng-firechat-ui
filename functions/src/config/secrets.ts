/**
 * Centralized configuration for Firebase Functions v2 secrets.
 *
 * IMPORTANT: Only define secrets here. Never call .value() at the module level.
 * Secret values can only be accessed at runtime within function handlers.
 */
import { defineSecret } from 'firebase-functions/params';

/**
 * Anthropic API key for Claude AI services
 */
export const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');

/**
 * OpenAI API key for GPT services
 */
export const openAiApiKey = defineSecret('OPENAI_API_KEY');

/**
 * Webhook API key for validating incoming requests
 */
export const webhookApiKey = defineSecret('WEBHOOK_API_KEY');
