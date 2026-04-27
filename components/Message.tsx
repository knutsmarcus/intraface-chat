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
}

const SPRING = { type: "spring", stiffness: 500, damping: 36 } as const;

export default function Message({ message }: MessageProps) {
  const isUser = message.role === "user";
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
          className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center mr-3 flex-shrink-0 mt-1 overflow-hidden p-1.5"
        >
          <Image src="/intraface-logo.svg" alt="Intraface" width={20} height={20} className="w-full h-full invert" />
        </motion.div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gray-900 text-white rounded-br-sm whitespace-pre-wrap"
            : "bg-gray-100 text-gray-900 rounded-bl-sm"
        }`}
      >
        {isThinking ? (
          <div className="flex gap-1.5 items-center py-0.5 px-0.5">
            {[0, 160, 320].map((delay) => (
              <span
                key={delay}
                className="w-2 h-2 rounded-full bg-gray-400 inline-block animate-bounce"
                style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
              />
            ))}
          </div>
        ) : isUser ? (
          displayContent
        ) : (
          <div className="prose prose-sm prose-gray max-w-none
            prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:mt-3 prose-headings:mb-1
            prose-p:my-1 prose-p:leading-relaxed
            prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5
            prose-ol:my-1 prose-ol:pl-4
            prose-strong:font-semibold prose-strong:text-gray-900
            prose-hr:my-2 prose-hr:border-gray-300">
            <ReactMarkdown>{displayContent}</ReactMarkdown>
          </div>
        )}
        {!isThinking && message.isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 animate-pulse rounded-sm" />
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-semibold ml-3 flex-shrink-0 mt-1">
          You
        </div>
      )}
    </motion.div>
  );
}
