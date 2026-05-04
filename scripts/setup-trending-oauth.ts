#!/usr/bin/env npx tsx
/**
 * setup-trending-oauth.ts
 * Gets a YouTube refresh token for the AITrendingNow channel.
 *
 * Usage:
 *   npx tsx scripts/setup-trending-oauth.ts
 *
 * Steps:
 *   1. Opens the Google OAuth URL in your terminal
 *   2. You visit it, select AITrendingNow channel, paste the code back
 *   3. Script exchanges it for a refresh token and saves to .env.local
 */

import * as path   from "path";
import * as fs     from "fs";
import * as readline from "readline";
import * as dotenv from "dotenv";

// Load trending env first, then fall back to shared env for OAuth creds
dotenv.config({ path: path.resolve(__dirname, "..", ".env.trending") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const CLIENT_ID     = process.env.YOUTUBE_CLIENT_ID!;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET!;
const REDIRECT_URI  = "urn:ietf:wg:oauth:2.0:oob";
const ENV_FILE      = path.resolve(__dirname, "..", ".env.trending");

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET must be set in .env.local");
  process.exit(1);
}

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=urn:ietf:wg:oauth:2.0:oob` +
  `&scope=https://www.googleapis.com/auth/youtube.upload` +
  `&response_type=code&access_type=offline&prompt=consent`;

console.log("\n═══════════════════════════════════════════════════════════");
console.log("🔐 YouTube OAuth Setup — AITrendingNow channel");
console.log("═══════════════════════════════════════════════════════════\n");
console.log("IMPORTANT: Make sure you are logged in as the Google account");
console.log("that owns the AITrendingNow channel BEFORE visiting this URL.\n");
console.log("1. Open this URL in your browser:");
console.log(`\n   ${authUrl}\n`);
console.log("2. Select the AITrendingNow channel when prompted");
console.log("3. Click Allow");
console.log("4. Copy the authorization code shown\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("Paste the authorization code here: ", async (code) => {
  rl.close();
  code = code.trim();
  if (!code) { console.error("No code provided."); process.exit(1); }

  console.log("\n🔄 Exchanging code for refresh token…");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    "authorization_code",
    }),
  });

  const data = await res.json() as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!data.refresh_token) {
    console.error("❌ Failed:", data.error_description ?? data.error ?? JSON.stringify(data));
    process.exit(1);
  }

  console.log("✅ Got refresh token!\n");

  // Save to .env.trending (dedicated file for AITrendingNow channel secrets)
  // This keeps trending credentials completely separate from .env.local
  let envContent = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, "utf8") : "";

  // Ensure the file has the required base vars if missing
  if (!envContent.includes("YOUTUBE_CLIENT_ID=")) {
    envContent += `\n# ── Shared OAuth app credentials (copied from .env.local) ───────\n`;
    envContent += `YOUTUBE_CLIENT_ID=${CLIENT_ID}\n`;
    envContent += `YOUTUBE_CLIENT_SECRET=${CLIENT_SECRET}\n`;
  }

  const varName = "TRENDING_YOUTUBE_REFRESH_TOKEN";
  if (envContent.includes(`${varName}=`)) {
    envContent = envContent.replace(
      new RegExp(`^${varName}=.*$`, "m"),
      `${varName}=${data.refresh_token}`
    );
  } else {
    envContent += `\n# ── AITrendingNow channel ────────────────────────────────────\n`;
    envContent += `${varName}=${data.refresh_token}\n`;
    envContent += `TRENDING_YOUTUBE_CHANNEL_ID=UCV5WqyXMzMsWf8XZ1Xi0HCA\n`;
  }

  fs.writeFileSync(ENV_FILE, envContent, "utf8");

  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ Saved TRENDING_YOUTUBE_REFRESH_TOKEN to .env.trending");
  console.log(`   Channel: AITrendingNow (UCV5WqyXMzMsWf8XZ1Xi0HCA)`);
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log("Next: run the agent to publish the first video:");
  console.log("  npx tsx scripts/ai-trending-agent.ts\n");
});
