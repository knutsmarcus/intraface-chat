import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { NextRequest } from "next/server";
import { Resend } from "resend";

const client = new Anthropic();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendVisitorNotification(firstMessage: string) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Intraface <notifications@intraface.se>",
      to: "marcus@intraface.se",
      subject: "💬 New visitor on Intraface.se",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
          <h2 style="margin-bottom: 8px;">Someone just started a chat on Intraface.se</h2>
          <p style="color: #666; font-size: 14px; margin-bottom: 16px;">${new Date().toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })} (Stockholm)</p>
          <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; font-size: 15px; line-height: 1.5;">
            ${firstMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
          </div>
          <p style="margin-top: 16px; font-size: 13px; color: #999;">Sent from intraface.se</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Notification email failed:", err);
  }
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // Send notification on first visitor message (awaited so Vercel doesn't kill it early)
  if (messages.length === 1 && messages[0].role === "user") {
    await sendVisitorNotification(messages[0].content);
  }

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
