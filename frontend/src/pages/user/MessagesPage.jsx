import React, { useState } from "react";
import {
  Send,
  Search,
  ShieldCheck,
} from "lucide-react";
import Container from "../../components/Container";
import { Button } from "../../components/ui";

const CONVERSATIONS = [
  {
    id: "conv-1",
    user: "Rahul Nair",
    avatar: "R",
    listing: "Sony FX3 Cinema Camera Kit",
    lastMessage: "Sounds great! The Pelican case and 4 batteries are packed.",
    time: "10:42 AM",
    unread: false,
    messages: [
      { id: "m1", sender: "Rahul Nair", text: "Hi! Thanks for reserving the FX3 kit for your documentary shoot.", time: "10:30 AM", isMe: false },
      { id: "m2", sender: "Me", text: "Hi Rahul! Could you confirm if the 24-70mm GM lens has the lens hood included?", time: "10:35 AM", isMe: true },
      { id: "m3", sender: "Rahul Nair", text: "Yes, original lens hood and UV filter are both attached.", time: "10:38 AM", isMe: false },
      { id: "m4", sender: "Rahul Nair", text: "Sounds great! The Pelican case and 4 batteries are packed.", time: "10:42 AM", isMe: false },
    ],
  },
  {
    id: "conv-2",
    user: "Aswathy V",
    avatar: "A",
    listing: "Panoramic Sea-View 2BHK Apartment",
    lastMessage: "Keys are in the lockbox. Code is 4829.",
    time: "Yesterday",
    unread: true,
    messages: [
      { id: "m1", sender: "Aswathy V", text: "Welcome to Kochi! Check-in is after 2:00 PM today.", time: "Yesterday", isMe: false },
      { id: "m2", sender: "Aswathy V", text: "Keys are in the lockbox. Code is 4829.", time: "Yesterday", isMe: false },
    ],
  },
];

export default function MessagesPage() {
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [activeId, setActiveId] = useState("conv-1");
  const [inputText, setInputText] = useState("");

  const activeConv = conversations.find((c) => c.id === activeId) || conversations[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: "Me",
      text: inputText.trim(),
      time: "Just now",
      isMe: true,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          return {
            ...c,
            lastMessage: inputText.trim(),
            time: "Just now",
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setInputText("");
  };

  return (
    <div className="py-6 sm:py-10 min-h-[calc(100vh-180px)]">
      <Container>
        <div className="mb-6">
          <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[var(--color-espresso)]">
            Messages & Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-muted-grey)] mt-1">
            Chat with owners and renters to coordinate pickup, delivery, and handover details.
          </p>
        </div>

        {/* Messaging Split Screen */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl h-[560px] grid grid-cols-1 md:grid-cols-[300px_1fr] overflow-hidden">
          {/* Left Column: Inbox List */}
          <div className="border-r border-[var(--color-border-subtle)] flex flex-col bg-[var(--color-surface-subtle)]">
            <div className="p-3.5 border-b border-[var(--color-border-subtle)]">
              <div className="font-bold text-sm text-[var(--color-espresso)] mb-2">Conversations</div>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-grey)]" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-espresso)] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border-subtle)]">
              {conversations.map((conv) => {
                const isActive = conv.id === activeId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    className={`p-3.5 cursor-pointer transition-colors flex gap-3 items-center ${
                      isActive
                        ? "bg-[var(--color-surface)] border-l-3 border-l-[var(--color-terracotta)]"
                        : "hover:bg-[var(--color-surface-hover)] border-l-3 border-l-transparent"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-terracotta)] font-bold text-sm grid place-items-center shrink-0">
                      {conv.avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-xs text-[var(--color-espresso)]">{conv.user}</span>
                        <span className="text-[10px] text-[var(--color-muted-grey)]">{conv.time}</span>
                      </div>
                      <div className="text-[11px] text-[var(--color-terracotta)] font-semibold truncate">
                        {conv.listing}
                      </div>
                      <div className="text-xs text-[var(--color-secondary-text)] truncate mt-0.5">
                        {conv.lastMessage}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Thread */}
          <div className="flex flex-col bg-[var(--color-surface)]">
            {/* Thread Header */}
            <div className="px-5 py-3 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-terracotta)] font-bold text-xs grid place-items-center">
                  {activeConv.avatar}
                </div>
                <div>
                  <div className="font-bold text-sm text-[var(--color-espresso)]">{activeConv.user}</div>
                  <div className="text-[11px] text-[var(--color-muted-grey)]">
                    Regarding: {activeConv.listing}
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <ShieldCheck size={16} />
                <span>Verified Escrow Chat</span>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3">
              {activeConv.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[75%] flex flex-col ${
                    msg.isMe ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.isMe
                        ? "bg-[var(--color-terracotta)] text-white rounded-br-xs"
                        : "bg-[var(--color-surface-secondary)] text-[var(--color-espresso)] rounded-bl-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-[var(--color-muted-grey)] mt-1 px-1">
                    {msg.time}
                  </span>
                </div>
              ))}
            </div>

            {/* Message Input Footer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-[var(--color-border-subtle)] flex gap-2 items-center"
            >
              <input
                type="text"
                placeholder="Type your message to host..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs sm:text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-1 focus:ring-[var(--color-terracotta)]"
              />
              <Button type="submit" variant="primary" size="md" icon={Send} className="rounded-full!">
                Send
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
}
