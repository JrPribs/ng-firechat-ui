import {
  onDocumentCreated,
  DocumentOptions,
} from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";

// Configure the function to listen to messages subcollection
const documentOptions: DocumentOptions = {
  document: "chats/{chatId}/messages/{messageId}",
};

// Define the function to update the last message when a new message is created
export const updateChatLastMessage = onDocumentCreated(
  documentOptions,
  async (event) => {
    const snapshot = event.data;
    const chatId = event.params.chatId;

    if (!snapshot) {
      console.log("No data associated with the event");
      return;
    }

    const messageData = snapshot.data();
    const messageText = messageData.text;

    if (!messageText) {
      console.log("Message text is empty");
      return;
    }

    try {
      const db = getFirestore();

      const chatMessagesRef = db.collection("chats").doc(chatId).collection("messages");
      const totalMessagesQuery = (await chatMessagesRef.count().get())
      const totalMessages = totalMessagesQuery.data()?.count ?? 0;

      // Update the parent chat document with the latest message
      await db.collection("chats").doc(chatId).update({
        lastMessage: messageText,
        updatedAt: new Date(),
        totalMessages: totalMessages,
        unread: true
      });

      console.log(`Updated chat ${chatId} with last message: ${messageText}`);
    } catch (error) {
      console.error("Error updating chat last message:", error);
    }
  }
);
