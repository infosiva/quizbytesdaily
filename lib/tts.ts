/**
 * lib/tts.ts
 * Microsoft Edge TTS — free neural text-to-speech, no API key needed.
 * Uses the same WebSocket API as Edge browser's "Read Aloud" feature.
 * Returns MP3 audio as a Buffer.
 */

import crypto from "node:crypto";
import WebSocket from "ws";

const ENDPOINT = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
const TOKEN    = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"; // public token used by Edge browser

/** Default voice — clear, professional, works great for quiz narration */
export const DEFAULT_VOICE = "en-US-GuyNeural"; // calm male voice
// Alternatives: "en-US-AriaNeural" (female), "en-US-EricNeural" (male)

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Convert plain text to MP3 via Microsoft Edge TTS (free, no API key).
 * @param text  Plain text to synthesize
 * @param voice Edge TTS voice name (default: en-US-GuyNeural)
 * @param rate  Speaking rate, e.g. "+10%" or "-5%"
 */
export function edgeTTS(
  text:  string,
  voice: string = DEFAULT_VOICE,
  rate:  string = "+10%",
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const connId = crypto.randomUUID().replace(/-/g, "");
    const ws = new WebSocket(
      `${ENDPOINT}?TrustedClientToken=${TOKEN}&ConnectionId=${connId}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Origin":     "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        },
      }
    );

    const chunks: Buffer[] = [];
    let settled = false;

    const settle = (err?: Error) => {
      if (settled) return;
      settled = true;
      ws.removeAllListeners();
      try { ws.close(); } catch { /* ignore */ }
      if (err) {
        reject(err);
      } else {
        const buf = Buffer.concat(chunks);
        if (buf.length === 0) reject(new Error("Edge TTS: no audio received"));
        else resolve(buf);
      }
    };

    ws.on("error", (err) => settle(err));

    ws.on("open", () => {
      const ts = new Date().toISOString();

      // 1. Send speech.config (output format: 24 kHz 48 kbps mono MP3)
      ws.send(
        `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`
      );

      // 2. Send SSML with the text and voice settings
      const ssml = [
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>`,
        `<voice name='${voice}'>`,
        `<prosody rate='${rate}' pitch='+0Hz'>${escapeXml(text)}</prosody>`,
        `</voice>`,
        `</speak>`,
      ].join("");

      ws.send(
        `X-RequestId:${connId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts}\r\nPath:ssml\r\n\r\n${ssml}`
      );
    });

    ws.on("message", (raw: Buffer | string, isBinary: boolean) => {
      if (!isBinary) {
        // Text frame — signals turn.end (synthesis complete)
        const msg = typeof raw === "string" ? raw : raw.toString();
        if (msg.includes("Path:turn.end")) settle();
        return;
      }

      // Binary frame format: [uint16 headerLen][header][audio bytes]
      const buf       = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as unknown as ArrayBuffer);
      if (buf.length < 2) return;
      const headerLen = buf.readUInt16BE(0);
      const header    = buf.slice(2, 2 + headerLen).toString("utf8");

      if (header.includes("Path:audio")) {
        const audio = buf.slice(2 + headerLen);
        if (audio.length > 0) chunks.push(audio);
      }
    });

    // Hard timeout — should never be needed in practice
    setTimeout(() => settle(new Error("Edge TTS: 30s timeout")), 30_000);
  });
}

/**
 * Estimate MP3 duration in seconds from buffer size.
 * Edge TTS outputs 24 kHz 48 kbps mono MP3, so: duration = bytes * 8 / 48000
 */
export function mp3Duration(buf: Buffer): number {
  return (buf.length * 8) / 48_000;
}
