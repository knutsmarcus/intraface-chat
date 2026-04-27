/**
 * One-time script to get a Google OAuth2 refresh token.
 *
 * Usage:
 *   1. Create a Google Cloud project at https://console.cloud.google.com
 *   2. Enable the Google Calendar API
 *   3. Create OAuth2 credentials (Desktop app type)
 *   4. Copy Client ID and Client Secret into .env.local
 *   5. Run: GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/get-refresh-token.mjs
 *   6. Visit the URL printed, authorize, paste the code back
 *   7. Copy the printed refresh_token into .env.local as GOOGLE_REFRESH_TOKEN
 */

import { google } from "googleapis";
import * as readline from "readline";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET as env vars before running.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/calendar"],
  prompt: "consent",
});

console.log("\nOpen this URL in your browser and authorize the app:\n");
console.log(authUrl);
console.log();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Paste the authorization code here: ", async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log("\n✅ Success! Add this to your .env.local:\n");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
  } catch (err) {
    console.error("Failed to get token:", err.message);
  }
});
