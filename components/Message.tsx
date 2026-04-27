"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

export type Role = "user" | "assistant";

export interface MessageType {
  id: string;
  role: Role;
  content: string;
  isStreaming?: boolean;
}

interface MessageProps {
  message: MessageType;
  isCyberpunk?: boolean;
}

const SPRING = { type: "spring", stiffness: 500, damping: 36 } as const;

export default function Message({ message, isCyberpunk = false }: MessageProps) {
  const isUser = message.role === "user";
  const cp = isCyberpunk;
  const displayContent = message.content.replace("[SHOW_BOOKING_FORM]", "").trim();
  const isThinking = message.isStreaming && !displayContent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      {!isUser && (
        <motion.div
          animate={message.isStreaming ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
          transition={message.isStreaming ? { repeat: Infinity, duration: 1.4, ease: "easeInOut" } : {}}
          className={`w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0 mt-1 overflow-hidden p-1.5 ${
            cp
              ? "rounded-none bg-[#FCE300] border border-[#FCE300]"
              : "rounded-full bg-gray-900"
          }`}
        >
          <Image
            src="/intraface-logo.svg"
            alt="Intraface"
            width={20}
            height={20}
            className={`w-full h-full ${cp ? "" : "invert"}`}
          />
        </motion.div>
      )}

      <div
        className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? cp
              ? "rounded-none bg-[#FCE300] text-black font-mono whitespace-pre-wrap border border-[#FCE300]"
              : "rounded-2xl rounded-br-sm bg-gray-900 text-white whitespace-pre-wrap"
            : cp
              ? "rounded-none bg-[#12121A] text-[#00D4FF] border border-[#FCE300]/40 font-mono"
              : "rounded-2xl rounded-bl-sm bg-gray-100 text-gray-900"
        }`}
      >
        {isThinking ? (
          cp ? (
            <span className="cp-yellow font-mono text-base cp-blink">█</span>
          ) : (
            <div className="flex gap-1.5 items-center py-0.5 px-0.5">
              {[0, 160, 320].map((delay) => (
                <span
                  key={delay}
                  className="w-2 h-2 rounded-full bg-gray-400 inline-block animate-bounce"
                  style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
                />
              ))}
            </div>
          )
        ) : isUser ? (
          displayContent
        ) : (
          <div className={cp
            ? "prose-none [&_strong]:text-[#FCE300] [&_h1]:text-[#FCE300] [&_h2]:text-[#FCE300] [&_h3]:text-[#FCE300] [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:my-0.5 [&_p]:my-1 [&_hr]:border-[#FCE300]/20"
            : "prose prose-sm prose-gray max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1 prose-p:leading-relaxed prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5 prose-ol:my-1 prose-ol:pl-4 prose-strong:font-semibold prose-strong:text-gray-900 prose-hr:my-2 prose-hr:border-gray-300"
          }>
            <ReactMarkdown>{displayContent}</ReactMarkdown>
          </div>
        )}
        {!isThinking && message.isStreaming && (
          cp
            ? <span className="cp-yellow font-mono ml-1 cp-blink">_</span>
            : <span className="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 animate-pulse rounded-sm" />
        )}
      </div>

      {isUser && (
        <div className={`w-8 h-8 flex items-center justify-center text-xs font-semibold ml-3 flex-shrink-0 mt-1 ${
          cp
            ? "rounded-none bg-[#12121A] border border-[#FCE300]/40 text-[#FCE300] font-mono"
            : "rounded-full bg-gray-200 text-gray-600"
        }`}>
          You
        </div>
      )}
    </motion.div>
  );
}
