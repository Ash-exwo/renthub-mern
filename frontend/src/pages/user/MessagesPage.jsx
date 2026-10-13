import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Send,
  Search,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import Container from "../../components/Container";
import { Button } from "../../components/ui";
import api from "../../utils/api";

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const targetBookingId = searchParams.get("bookingId");
  const targetUser = searchParams.get("targetUser");
  const targetListing = searchParams.get("listingTitle");

  const [conversations, setConversations] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("renthub_conversations") || "[]");
    } catch {
      return [];
    }
  });

  const [activeId, setActiveId] = useState(() => conversations[0]?.id || null);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize or activate specific chat thread from query parameters (e.g. from bookings page)
  useEffect(() => {
    if (targetBookingId) {
      const convId = `conv-${targetBookingId}`;
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === convId);
        if (existing) {
          setActiveId(convId);
          return prev;
        }

        const newConv = {
          id: convId,
          bookingId: targetBookingId,
          user: targetUser || "Rental Contact",
          listing: targetListing || "Rental Item",
          lastMessage: "Chat started for rental handover.",
          time: "Just now",
          messages: [
            {
              id: `msg-${Date.now()}-1`,
              sender: targetUser || "Host",
              text: `Hello! Regarding "${targetListing || "the item"}": What time and handover location work best for you?`,
              time: "Just now",
              isMe: false,
            },
          ],
        };

        const updated = [newConv, ...prev];
        try {
          localStorage.setItem("renthub_conversations", JSON.stringify(updated));
        } catch {}
        setActiveId(convId);
        return updated;
      });
    }
  }, [targetBookingId, targetUser, targetListing]);

  // If no conversations exist, check user's bookings to auto-populate chats
  useEffect(() => {
    if (conversations.length === 0 && !targetBookingId) {
      async function seedFromBookings() {
        try {
          const [rentalsRes, requestsRes] = await Promise.all([
            api.get("/bookings/my-rentals").catch(() => ({ data: { bookings: [] } })),
            api.get("/bookings/owner-requests").catch(() => ({ data: { bookings: [] } })),
          ]);

          const allBookings = [
            ...(rentalsRes.data?.bookings || []),
            ...(requestsRes.data?.bookings || []),
          ].filter((b) => b.status === "confirmed" || b.status === "completed" || b.status === "pending");

          if (allBookings.length > 0) {
            const seeded = allBookings.map((b) => {
              const otherUser = b.renter?.name || b.owner?.name || "Rental Partner";
              return {
                id: `conv-${b._id}`,
                bookingId: b._id,
                user: otherUser,
                listing: b.listing?.title || "Rental Asset",
                lastMessage: `Rental status: ${b.status}. Ready to coordinate meetup.`,
                time: "Today",
                messages: [
                  {
                    id: `msg-${b._id}-1`,
                    sender: otherUser,
                    text: `Hi! Let's coordinate pickup and return details for "${b.listing?.title}".`,
                    time: "Today",
                    isMe: false,
                  },
                ],
              };
            });

            setConversations(seeded);
            setActiveId(seeded[0]?.id || null);
            try {
              localStorage.setItem("renthub_conversations", JSON.stringify(seeded));
            } catch {}
          }
        } catch {}
      }
      seedFromBookings();
    }
  }, [conversations.length, targetBookingId]);

  const activeConv = conversations.find((c) => c.id === activeId) || conversations[0] || null;

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const userText = inputText.trim();
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: "Me",
      text: userText,
      time: "Just now",
      isMe: true,
    };

    const updated = conversations.map((c) => {
      if (c.id === activeConv.id) {
        return {
          ...c,
          lastMessage: userText,
          time: "Just now",
          messages: [...(c.messages || []), newMsg],
        };
      }
      return c;
    });

    setConversations(updated);
    try {
      localStorage.setItem("renthub_conversations", JSON.stringify(updated));
    } catch {}

    setInputText("");

    // Simulate friendly auto-reply after 1.5s for realistic testing
    setTimeout(() => {
      setConversations((current) => {
        const targeted = current.find((c) => c.id === activeConv.id);
        if (!targeted) return current;

        const replyMsg = {
          id: `msg-${Date.now()}-reply`,
          sender: targeted.user,
          text: `Got your message: "${userText}". Sounds good, see you then!`,
          time: "Just now",
          isMe: false,
        };

        const withReply = current.map((c) => {
          if (c.id === targeted.id) {
            return {
              ...c,
              lastMessage: replyMsg.text,
              time: "Just now",
              messages: [...(c.messages || []), replyMsg],
            };
          }
          return c;
        });

        try {
          localStorage.setItem("renthub_conversations", JSON.stringify(withReply));
        } catch {}
        return withReply;
      });
    }, 1500);
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.listing?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {conversations.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 grid place-items-center mb-4">
              <MessageSquare size={32} />
            </div>
            <h2 className="font-extrabold text-lg text-[var(--color-espresso)]">No Messages Yet</h2>
            <p className="text-xs text-[var(--color-muted-grey)] mt-1.5 leading-relaxed">
              When you inquire about a rental or receive messages from renters regarding your assets, your chats will appear here in real time.
            </p>
            <Link to="/explore" className="mt-5">
              <Button variant="primary" size="md">
                Browse Available Rentals
              </Button>
            </Link>
          </div>
        ) : (
          /* Messaging Split Screen */
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-espresso)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border-subtle)]">
                {filteredConversations.map((conv) => {
                  const isActive = conv.id === activeId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setActiveId(conv.id)}
                      className={`p-3.5 cursor-pointer transition-colors flex gap-3 items-center ${
                        isActive
                          ? "bg-[var(--color-surface)] border-l-3 border-l-[var(--color-brand-primary)]"
                          : "hover:bg-[var(--color-surface-hover)] border-l-3 border-l-transparent"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-brand-primary)] font-bold text-sm grid place-items-center shrink-0">
                        {conv.avatar || conv.user?.charAt(0) || "U"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-xs text-[var(--color-espresso)]">{conv.user}</span>
                          <span className="text-[10px] text-[var(--color-muted-grey)]">{conv.time}</span>
                        </div>
                        <div className="text-[11px] text-[var(--color-brand-primary)] font-semibold truncate">
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
            {activeConv ? (
              <div className="flex flex-col bg-[var(--color-surface)]">
                {/* Thread Header */}
                <div className="px-5 py-3 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-brand-primary)] font-bold text-xs grid place-items-center">
                      {activeConv.avatar || activeConv.user?.charAt(0) || "U"}
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
                  {(activeConv.messages || []).map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[75%] flex flex-col ${
                        msg.isMe ? "self-end items-end" : "self-start items-start"
                      }`}
                    >
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          msg.isMe
                            ? "bg-[var(--color-brand-primary)] text-white rounded-br-xs"
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
                    className="flex-1 px-4 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs sm:text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]"
                  />
                  <Button type="submit" variant="primary" size="md" icon={Send} className="rounded-full!">
                    Send
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1 text-xs text-[var(--color-muted-grey)]">
                Select a conversation to start chatting.
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
