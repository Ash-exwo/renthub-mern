import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Send,
  Search,
  ShieldCheck,
  MessageSquare,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Tag,
  ExternalLink,
  Loader2,
  Info,
} from "lucide-react";
import Container from "../../components/Container";
import { Button, Badge } from "../../components/ui";
import ChatSafetyModal from "../../components/ChatSafetyModal";
import api from "../../utils/api";
import { isLoggedIn, getUser } from "../../utils/auth";

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = getUser();

  const targetBookingId = searchParams.get("bookingId");
  const targetListingId = searchParams.get("listingId");
  const targetOwnerId = searchParams.get("ownerId");
  const targetConvId = searchParams.get("conversationId");
  const initialTab = searchParams.get("tab") || "renting";

  // State: Tab ("renting" vs "hosting")
  const [activeTab, setActiveTab] = useState(initialTab === "hosting" ? "hosting" : "renting");

  // State: Conversations and active thread
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeId, setActiveId] = useState(targetConvId || null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // State: Input & search
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // State: Unread counters for both tabs
  const [tabStats, setTabStats] = useState({ rentingUnread: 0, hostingUnread: 0 });

  // State: Safety guidelines modal
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const isInitialMount = useRef(true);

  // Scroll to bottom of message thread
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Check safety modal acceptance on initial visit
  useEffect(() => {
    try {
      const accepted = localStorage.getItem("renthub_chat_safety_accepted");
      if (!accepted) {
        setSafetyModalOpen(true);
      }
    } catch {}
  }, []);

  // Fetch conversations for the active tab and calculate tab stats
  const fetchConversations = useCallback(
    async (tabToFetch = activeTab, shouldAutoSelect = false) => {
      try {
        const [currentRes, allRes] = await Promise.all([
          api.get(`/messages/conversations?role=${tabToFetch}`),
          api.get(`/messages/conversations`),
        ]);

        if (currentRes.data?.success) {
          // Strictly filter so only conversations matching tabToFetch are present
          const list = (currentRes.data.conversations || []).filter((c) => c.role === tabToFetch);
          setConversations(list);

          // Auto-select on desktop if requested, or if current activeId is not in this tab's list
          if (shouldAutoSelect || !activeId || !list.some((c) => (c._id || c.id) === activeId)) {
            if (list.length > 0 && window.innerWidth >= 768) {
              const firstId = list[0]._id || list[0].id;
              setActiveId(firstId);
            } else if (list.length === 0) {
              setActiveId(null);
              setActiveConv(null);
              setMessages([]);
            }
          }
        }

        if (allRes.data?.conversations) {
          const allList = allRes.data.conversations;
          const rentingCount = allList
            .filter((c) => c.role === "renting")
            .reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          const hostingCount = allList
            .filter((c) => c.role === "hosting")
            .reduce((sum, c) => sum + (c.unreadCount || 0), 0);

          setTabStats({
            rentingUnread: rentingCount,
            hostingUnread: hostingCount,
          });
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setLoadingConversations(false);
      }
    },
    [activeTab, activeId]
  );

  // Fetch messages for active conversation
  const fetchMessages = useCallback(
    async (convId, isBackground = false) => {
      if (!convId) return;
      if (!isBackground) setLoadingMessages(true);

      try {
        const res = await api.get(`/messages/conversation/${convId}`);
        if (res.data?.success && res.data.conversation) {
          const fetchedConv = res.data.conversation;
          // Strictly ensure this conversation matches the currently active tab
          if (fetchedConv.role === activeTab) {
            setMessages(res.data.messages || []);
            setActiveConv(fetchedConv);
          } else {
            // Mismatched tab: reset active thread
            setActiveId(null);
            setActiveConv(null);
            setMessages([]);
          }
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (!isBackground) setLoadingMessages(false);
      }
    },
    [activeTab]
  );

  // Initialize from query parameters (bookingId or listingId)
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login?redirect=/messages");
      return;
    }

    async function initFromParams() {
      if (targetBookingId || targetListingId || targetConvId) {
        try {
          if (targetConvId) {
            setActiveId(targetConvId);
            return;
          }

          const initRes = await api.post("/messages/conversations/init", {
            bookingId: targetBookingId || undefined,
            listingId: targetListingId || undefined,
            ownerId: targetOwnerId || undefined,
          });

          if (initRes.data?.success && initRes.data.conversation) {
            const conv = initRes.data.conversation;
            const targetRole = conv.role || "renting";
            setActiveTab(targetRole);
            setActiveId(conv._id || conv.id);
            fetchConversations(targetRole, false);
          }
        } catch (err) {
          console.error("Error auto-initializing conversation:", err);
        }
      }
    }

    initFromParams();
  }, [targetBookingId, targetListingId, targetConvId, targetOwnerId, navigate, fetchConversations]);

  // Load conversations on mount & tab switch
  useEffect(() => {
    fetchConversations(activeTab, true);
  }, [activeTab, fetchConversations]);

  // Load messages when activeId changes
  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId);
      fetchConversations(activeTab, false);
    }
  }, [activeId, fetchMessages, activeTab, fetchConversations]);

  // Auto-scroll on initial message load or new message
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(isInitialMount.current ? "auto" : "smooth");
      isInitialMount.current = false;
    }
  }, [messages.length]);

  // Real-time Background Polling & Window Focus sync (every 3.5s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(activeTab, false);
      if (activeId) {
        fetchMessages(activeId, true);
      }
    }, 3500);

    const handleFocus = () => {
      fetchConversations(activeTab, false);
      if (activeId) {
        fetchMessages(activeId, true);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [activeTab, activeId, fetchConversations, fetchMessages]);

  // Handle Tab Switch: Immediately clears state of the other mode
  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    setSearchTerm("");
    setActiveId(null);
    setActiveConv(null);
    setMessages([]);
    setConversations([]);
    setLoadingConversations(true);
    fetchConversations(newTab, true);
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeId || sending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const res = await api.post("/messages", {
        conversationId: activeId,
        text: textToSend,
      });

      if (res.data?.success && res.data.message) {
        setMessages((prev) => [...prev, res.data.message]);
        scrollToBottom("smooth");
        // Refresh conversations to update lastMessage
        fetchConversations(activeTab, false);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      // Revert text on error
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  // Filter conversations by search and enforce activeTab role
  const filteredConversations = conversations
    .filter((c) => c.role === activeTab)
    .filter((c) => {
      const contactName = c.otherUser?.name || "";
      const itemTitle = c.listing?.title || "";
      const term = searchTerm.toLowerCase();
      return contactName.toLowerCase().includes(term) || itemTitle.toLowerCase().includes(term);
    });

  return (
    <div className="py-6 sm:py-8 min-h-[calc(100vh-160px)]">
      <Container>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[var(--color-espresso)]">
              Messages & Inquiries
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-muted-grey)] mt-1">
              Direct messaging to coordinate rental pickups, deliveries, and handover details.
            </p>
          </div>

          {/* Safety Guidelines Trigger Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={ShieldCheck}
            onClick={() => setSafetyModalOpen(true)}
            className="self-start sm:self-auto text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
          >
            Safety Guidelines
          </Button>
        </div>

        {/* 2-Section Segmented Tab Switcher: Renting vs Hosting */}
        <div className="flex items-center gap-2 p-1.5 bg-[var(--color-surface-subtle)] rounded-2xl border border-[var(--color-border-subtle)] max-w-md mb-6">
          <button
            type="button"
            onClick={() => handleTabChange("renting")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "renting"
                ? "bg-[var(--color-surface)] text-[var(--color-espresso)] shadow-md border border-[var(--color-border)]"
                : "text-[var(--color-muted-grey)] hover:text-[var(--color-espresso)]"
            }`}
          >
            <span>🎒 Renting</span>
            <span className="text-[11px] font-normal text-[var(--color-muted-grey)] hidden sm:inline">
              (As Renter)
            </span>
            {tabStats.rentingUnread > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--color-brand-primary)] text-white animate-pulse">
                {tabStats.rentingUnread}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("hosting")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "hosting"
                ? "bg-[var(--color-surface)] text-[var(--color-espresso)] shadow-md border border-[var(--color-border)]"
                : "text-[var(--color-muted-grey)] hover:text-[var(--color-espresso)]"
            }`}
          >
            <span>🏠 Hosting</span>
            <span className="text-[11px] font-normal text-[var(--color-muted-grey)] hidden sm:inline">
              (As Host)
            </span>
            {tabStats.hostingUnread > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                {tabStats.hostingUnread}
              </span>
            )}
          </button>
        </div>

        {/* Messaging Container */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl h-[620px] grid grid-cols-1 md:grid-cols-[340px_1fr] overflow-hidden">
          {/* Left Column: Inbox List */}
          <div
            className={`border-r border-[var(--color-border-subtle)] flex flex-col bg-[var(--color-surface-subtle)] ${
              activeId ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Inbox Search & Count */}
            <div className="p-4 border-b border-[var(--color-border-subtle)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-[var(--color-muted-grey)]">
                  {activeTab === "renting" ? "Items You're Renting" : "Inquiries on Your Gear"}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-espresso)]">
                  {filteredConversations.length}
                </span>
              </div>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-grey)]"
                />
                <input
                  type="text"
                  placeholder="Search by name or item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-espresso)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]"
                />
              </div>
            </div>

            {/* Conversation Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border-subtle)]">
              {loadingConversations ? (
                <div className="p-8 text-center text-xs text-[var(--color-muted-grey)] flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-[var(--color-brand-primary)]" />
                  <span>Loading conversations...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-secondary)] text-[var(--color-muted-grey)] grid place-items-center mb-3">
                    <MessageSquare size={24} />
                  </div>
                  <h3 className="font-bold text-xs text-[var(--color-espresso)]">
                    {activeTab === "renting" ? "No Rental Chats Yet" : "No Host Inquiries Yet"}
                  </h3>
                  <p className="text-[11px] text-[var(--color-muted-grey)] mt-1 max-w-[200px] leading-relaxed">
                    {activeTab === "renting"
                      ? "When you message hosts or book items to rent, your conversations will show here."
                      : "When renters inquire about your equipment or book items, their chats appear here."}
                  </p>
                  {activeTab === "renting" ? (
                    <Link to="/explore" className="mt-4">
                      <Button variant="outline" size="sm">
                        Browse Gear
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/owner/dashboard" className="mt-4">
                      <Button variant="outline" size="sm">
                        Go to Host Dashboard
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = (conv._id || conv.id) === activeId;
                  const otherUser = conv.otherUser || { name: "Rental Partner" };
                  const listing = conv.listing || {};
                  const unread = conv.unreadCount || 0;

                  return (
                    <div
                      key={conv._id || conv.id}
                      onClick={() => setActiveId(conv._id || conv.id)}
                      className={`p-3.5 cursor-pointer transition-all flex gap-3 items-center relative ${
                        isSelected
                          ? "bg-[var(--color-surface)] border-l-4 border-l-[var(--color-brand-primary)] shadow-xs"
                          : "hover:bg-[var(--color-surface-hover)] border-l-4 border-l-transparent"
                      }`}
                    >
                      {/* Avatar / Listing Thumbnail */}
                      <div className="relative shrink-0">
                        {listing.images && listing.images[0] ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-11 h-11 rounded-xl object-cover border border-[var(--color-border)] shadow-xs"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold text-sm grid place-items-center border border-indigo-500/30">
                            {otherUser.name?.charAt(0) || "U"}
                          </div>
                        )}
                        {unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-brand-primary)] text-white text-[9px] font-extrabold grid place-items-center shadow-sm">
                            {unread}
                          </span>
                        )}
                      </div>

                      {/* Conversation Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span
                            className={`font-bold text-xs truncate ${
                              unread > 0 ? "text-[var(--color-espresso)] font-extrabold" : "text-[var(--color-espresso)]"
                            }`}
                          >
                            {otherUser.name}
                          </span>
                          <span className="text-[10px] text-[var(--color-muted-grey)] shrink-0 ml-2">
                            {conv.lastMessageAt
                              ? new Date(conv.lastMessageAt).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })
                              : ""}
                          </span>
                        </div>

                        <div className="text-[11px] font-medium text-[var(--color-brand-primary)] truncate">
                          {listing.title || "Rental Item"}
                        </div>

                        <div
                          className={`text-xs truncate mt-0.5 ${
                            unread > 0
                              ? "text-[var(--color-espresso)] font-bold"
                              : "text-[var(--color-muted-grey)]"
                          }`}
                        >
                          {conv.lastMessage || "Started conversation"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Chat Feed (Only rendered if conversation role matches activeTab) */}
          {activeId && activeConv && activeConv.role === activeTab ? (
            <div className={`flex flex-col bg-[var(--color-surface)] ${activeId ? "flex" : "hidden md:flex"}`}>
              {/* Thread Header with Counterparty & Item details */}
              <div className="px-5 py-3.5 border-b border-[var(--color-border-subtle)] flex items-center justify-between gap-3 bg-[var(--color-surface)]">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="md:hidden p-1.5 -ml-1 rounded-lg text-[var(--color-muted-grey)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold text-sm grid place-items-center shrink-0 border border-indigo-500/30">
                    {activeConv.otherUser?.name?.charAt(0) || "U"}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[var(--color-espresso)] truncate">
                        {activeConv.otherUser?.name || "Rental Contact"}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        {activeConv.role === "renting" ? "Host" : "Renter"}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--color-muted-grey)] truncate flex items-center gap-1.5 mt-0.5">
                      <span>Regarding:</span>
                      {activeConv.listing?._id ? (
                        <Link
                          to={`/listings/${activeConv.listing._id}`}
                          className="font-semibold text-[var(--color-espresso)] hover:text-[var(--color-brand-primary)] hover:underline truncate"
                          title="View item details in this browser"
                        >
                          {activeConv.listing?.title || "Item"}
                        </Link>
                      ) : (
                        <span className="font-semibold text-[var(--color-espresso)] truncate">
                          {activeConv.listing?.title || "Item"}
                        </span>
                      )}
                      {activeConv.listing?.rentalPricePerDay && (
                        <span className="text-[var(--color-brand-primary)] font-bold shrink-0">
                          (₹{activeConv.listing.rentalPricePerDay}/day)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Header Badges & View Listing Arrow */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeConv.booking && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Calendar size={12} />
                      <span className="capitalize">{activeConv.booking.status}</span>
                    </span>
                  )}
                  {activeConv.listing?._id && (
                    <Link
                      to={`/listings/${activeConv.listing._id}`}
                      className="p-2 rounded-xl text-[var(--color-muted-grey)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-brand-primary)] transition-colors"
                      title="View item details in this browser"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Booking Context Banner (if linked) */}
              {activeConv.booking && (
                <div className="px-5 py-2.5 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent border-b border-[var(--color-border-subtle)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[var(--color-muted-grey)]">
                    <Clock size={13} className="text-indigo-600" />
                    <span>
                      Dates:{" "}
                      <strong className="text-[var(--color-espresso)]">
                        {new Date(activeConv.booking.startDate).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </strong>{" "}
                      –{" "}
                      <strong className="text-[var(--color-espresso)]">
                        {new Date(activeConv.booking.endDate).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </strong>
                    </span>
                    {activeConv.booking.totalAmount && (
                      <span className="text-emerald-600 font-bold ml-1">
                        (₹{activeConv.booking.totalAmount})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                    <ShieldCheck size={14} />
                    <span className="hidden sm:inline">Escrow Protected</span>
                  </div>
                </div>
              )}

              {/* Message Feed */}
              <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3 bg-[var(--color-surface-subtle)]">
                {loadingMessages ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-xs text-[var(--color-muted-grey)] gap-2">
                    <Loader2 size={24} className="animate-spin text-[var(--color-brand-primary)]" />
                    <span>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-[var(--color-muted-grey)]">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 grid place-items-center mb-3">
                      <Sparkles size={22} />
                    </div>
                    <div className="font-bold text-sm text-[var(--color-espresso)]">
                      Start Your Conversation
                    </div>
                    <p className="mt-1 max-w-xs leading-relaxed text-[11px]">
                      Ask about pickup timing, equipment accessories, return location, or any details before rental handover.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const timeStr = msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Just now";

                    return (
                      <div
                        key={msg._id || msg.id}
                        className={`max-w-[78%] flex flex-col ${
                          msg.isMe ? "self-end items-end" : "self-start items-start"
                        }`}
                      >
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs break-words ${
                            msg.isMe
                              ? "bg-[var(--color-brand-primary)] text-white rounded-br-xs font-medium"
                              : "bg-[var(--color-surface)] text-[var(--color-espresso)] border border-[var(--color-border)] rounded-bl-xs"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-muted-grey)] mt-1 px-1">
                          <span>{timeStr}</span>
                          {msg.isMe && (
                            <span className="text-[10px]">
                              {msg.isRead ? "✓✓ Read" : "✓ Sent"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Footer */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex gap-2 items-center"
              >
                <input
                  type="text"
                  placeholder={`Message ${activeConv.otherUser?.name || "partner"}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-xs sm:text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={Send}
                  disabled={!inputText.trim() || sending}
                  className="rounded-full! shrink-0 shadow-md"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : "Send"}
                </Button>
              </form>
            </div>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center p-12 text-center bg-[var(--color-surface)]">
              <div className="w-16 h-16 rounded-3xl bg-[var(--color-surface-secondary)] text-[var(--color-muted-grey)] grid place-items-center mb-4">
                <MessageSquare size={32} />
              </div>
              <h3 className="font-bold text-base text-[var(--color-espresso)]">
                {activeTab === "renting" ? "No Rental Chat Selected" : "No Host Chat Selected"}
              </h3>
              <p className="text-xs text-[var(--color-muted-grey)] mt-1 max-w-sm leading-relaxed">
                {activeTab === "renting"
                  ? "Select an inquiry from the left to coordinate your rental pickup with the host."
                  : "Select a renter's inquiry from the left to coordinate handover details for your gear."}
              </p>
            </div>
          )}
        </div>

        {/* OLX-style Safety Tips Modal */}
        <ChatSafetyModal
          isOpen={safetyModalOpen}
          onClose={() => setSafetyModalOpen(false)}
          onAccept={() => setSafetyModalOpen(false)}
        />
      </Container>
    </div>
  );
}
