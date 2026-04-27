"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Message, { MessageType } from "./Message";
import MeetingBookingForm from "./MeetingBookingForm";

const SUGGESTED_PROMPTS = [
  "What's Marcus's background?",
  "What did he do at Sony Mobile?",
  "What tools and skills does he have?",
  "Book a meeting with Marcus",
];

let idCounter = 0;
function nextId() {
  return `msg-${++idCounter}`;
}

type ChatItem =
  | { type: "message"; message: MessageType }
  | { type: "booking-form" }
  | { type: "booking-confirmed"; text: string };

export default function ChatInterface() {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showJobPaste, setShowJobPaste] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingShown, setBookingShown] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Conversation history for Claude (only actual messages)
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    setInput("");
    setIsLoading(true);

    const userMessage: MessageType = { id: nextId(), role: "user", content: text };
    historyRef.current = [...historyRef.current, { role: "user", content: text }];

    const assistantId = nextId();
    const assistantMessage: MessageType = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setItems((prev) => [
      ...prev,
      { type: "message", message: userMessage },
      { type: "message", message: assistantMessage },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyRef.current }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });

        const displayText = fullText.replace("[SHOW_BOOKING_FORM]", "").trimEnd();
        setItems((prev) =>
          prev.map((item) =>
            item.type === "message" && item.message.id === assistantId
              ? { ...item, message: { ...item.message, content: displayText } }
              : item
          )
        );
      }

      // Finalise
      setItems((prev) =>
        prev.map((item) =>
          item.type === "message" && item.message.id === assistantId
            ? {
                ...item,
                message: {
                  ...item.message,
                  content: fullText.replace("[SHOW_BOOKING_FORM]", "").trim(),
                  isStreaming: false,
                },
              }
            : item
        )
      );

      historyRef.current = [
        ...historyRef.current,
        { role: "assistant", content: fullText.replace("[SHOW_BOOKING_FORM]", "").trim() },
      ];

      // Show booking form if Claude triggered it
      if (fullText.includes("[SHOW_BOOKING_FORM]") && !bookingShown) {
        setBookingShown(true);
        setItems((prev) => [...prev, { type: "booking-form" }]);
      }
    } catch {
      setItems((prev) =>
        prev.map((item) =>
          item.type === "message" && item.message.id === assistantId
            ? {
                ...item,
                message: {
                  ...item.message,
                  content: "Sorry, something went wrong. Please try again.",
                  isStreaming: false,
                },
              }
            : item
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  async function sendJobDescription() {
    if (!jobDescription.trim()) return;
    const prompt = `Please analyse this job description and assess Marcus's fit for the role:\n\n---\n${jobDescription}\n---`;
    setShowJobPaste(false);
    setJobDescription("");
    await sendMessage(prompt);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleBookingConfirmed(confirmationText: string) {
    setItems((prev) => [
      ...prev.filter((i) => i.type !== "booking-form"),
      { type: "booking-confirmed", text: confirmationText },
    ]);
    historyRef.current = [
      ...historyRef.current,
      { role: "assistant", content: confirmationText },
    ];
  }

  const hasMessages = items.length > 0;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Image
            src="/intraface-logo.svg"
            alt="Intraface"
            width={90}
            height={24}
            className="h-5 w-auto"
            priority
          />
          <div>
            <p className="text-sm font-semibold text-gray-900">Marcus Hansson</p>
            <p className="text-xs text-gray-600">Product Manager · UX Leader · AI Consultant</p>
          </div>
        </div>
        <a
          href="https://linkedin.com/in/knutsmarcushansson"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          LinkedIn →
        </a>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto h-full flex flex-col">
          {!hasMessages && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Hi, I&apos;m Marcus&apos;s AI assistant
              </h1>
              <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
                Ask me anything about Marcus&apos;s background, skills, or experience — or paste a job description to check the fit.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-sm px-4 py-2 border border-gray-200 rounded-full text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {items.map((item, idx) => {
            if (item.type === "message") {
              return <Message key={item.message.id} message={item.message} />;
            }
            if (item.type === "booking-form") {
              return (
                <div key={`booking-form-${idx}`} className="flex justify-start mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center mr-3 flex-shrink-0 mt-1 overflow-hidden p-1.5">
                    <Image src="/intraface-logo.svg" alt="Intraface" width={20} height={20} className="w-full h-full invert" />
                  </div>
                  <MeetingBookingForm onBooked={handleBookingConfirmed} />
                </div>
              );
            }
            if (item.type === "booking-confirmed") {
              return (
                <Message
                  key={`booking-confirmed-${idx}`}
                  message={{
                    id: `confirmed-${idx}`,
                    role: "assistant",
                    content: item.text,
                  }}
                />
              );
            }
          })}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Job description paste area */}
      {showJobPaste && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-medium text-gray-600 mb-2">Paste job description</p>
            <textarea
              autoFocus
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none bg-white"
              placeholder="Paste the full job description here..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={sendJobDescription}
                disabled={!jobDescription.trim()}
                className="text-xs bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                Analyse fit
              </button>
              <button
                onClick={() => { setShowJobPaste(false); setJobDescription(""); }}
                className="text-xs text-gray-500 px-4 py-2 rounded-lg hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-gray-400 transition-colors">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about Marcus..."
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none max-h-32"
              style={{ minHeight: "24px" }}
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowJobPaste((v) => !v)}
                title="Check job fit"
                className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75a2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
                <span className="text-xs">Job fit</span>
              </button>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-center text-gray-300 mt-2">
            Powered by Claude · intraface.se
          </p>
        </div>
      </div>
    </div>
  );
}
