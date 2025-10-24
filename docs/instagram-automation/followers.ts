import fetch from 'node-fetch'; // npm install node-fetch
import {
  initializeApp, credential, firestore
} from 'firebase-admin';

initializeApp({ credential: credential.applicationDefault() });
const db = firestore();

const INSTAGRAM_USER_ID = 'your_instagram_user_id';
const ACCESS_TOKEN = 'your_access_token';

// Fetch followers from Instagram Graph API (see notes about real limitations)
async function fetchInstagramFollowers(): Promise<string[]> {
  const res = await fetch(`https://graph.facebook.com/v17.0/${INSTAGRAM_USER_ID}/followers?access_token=${ACCESS_TOKEN}`);
  const data = await res.json();
  return data.data.map((f: { username: string }) => f.username); // Adjust key for data format
}

// Read Firestore followers (stored usernames)
async function fetchStoredFollowers(): Promise<string[]> {
  const snapshot = await db.collection('followers').get();
  return snapshot.docs.map(doc => doc.data().username);
}

// Compare lists
async function detectNewFollowers() {
  const instaFollowers = await fetchInstagramFollowers();
  const storedFollowers = await fetchStoredFollowers();
  const storedSet = new Set(storedFollowers);

  const newFollowers = instaFollowers.filter(u => !storedSet.has(u));
  console.log('New Followers:', newFollowers);

  // Optionally update Firestore with detected new followers
  for (const username of newFollowers) {
    await db.collection('followers').add({ username });
  }
}

detectNewFollowers();
