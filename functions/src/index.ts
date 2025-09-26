/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import * as admin from 'firebase-admin';

setGlobalOptions({ maxInstances: 5 });

admin.initializeApp();

export * from "./update-chat-last-message";
export * from "./get-agent-response";
