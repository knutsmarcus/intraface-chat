"use client";

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

export default function Message({ message }: MessageProps) {
  const isUser = message.role === "user";
  const displayContent = message.content.replace("[SHOW_BOOKING_FORM]", "").trim();

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold mr-3 flex-shrink-0 mt-1">
          M
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gray-900 text-white rounded-br-sm whitespace-pre-wrap"
            : "bg-gray-100 text-gray-900 rounded-bl-sm"
        }`}
      >
        {isUser ? (
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
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 animate-pulse rounded-sm" />
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold ml-3 flex-shrink-0 mt-1">
          You
        </div>
      )}
    </div>
  );
}
