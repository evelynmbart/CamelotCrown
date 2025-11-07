"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: string;
  player_id: string;
  message: string;
  created_at: string;
  player: {
    username: string;
  };
}

interface GameChatProps {
  gameId: string;
  userId: string;
  whitePlayerId: string;
  blackPlayerId: string;
}

export function GameChat({
  gameId,
  userId,
  whitePlayerId,
  blackPlayerId,
}: GameChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("game_chat")
        .select(
          `
          id,
          player_id,
          message,
          created_at,
          player:profiles!game_chat_player_id_fkey(username)
        `
        )
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching chat messages:", error);
        return;
      }

      setMessages(data as any);
    };

    fetchMessages();

    const channel = supabase
      .channel(`game-chat-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_chat",
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          console.log("[Chat Realtime] New message detected:", payload);
          // Fetch the full message with player info
          const { data, error } = await supabase
            .from("game_chat")
            .select(
              `
              id,
              player_id,
              message,
              created_at,
              player:profiles!game_chat_player_id_fkey(username)
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (!error && data) {
            console.log("[Chat Realtime] Message added to state");
            setMessages((prev) => [...prev, data as any]);
          } else {
            console.error("[Chat Realtime] Error fetching message:", error);
          }
        }
      )
      .subscribe((status) => {
        console.log("[Chat Realtime] Subscription status:", status);
      });

    return () => {
      console.log("[Chat Realtime] Unsubscribing");
      supabase.removeChannel(channel);
    };
  }, [gameId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("game_chat").insert({
        game_id: gameId,
        player_id: userId,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 flex flex-col h-[400px]">
      <h3 className="font-medium text-foreground mb-3">Game Chat</h3>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No messages yet
          </p>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.player_id === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {msg.player.username}
                  </div>
                  <div className="text-sm">{msg.message}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
          maxLength={500}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !newMessage.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
