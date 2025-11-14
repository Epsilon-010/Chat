import React, { useEffect, useRef, useState } from "react";
import MessageBar from "./MessageBar";
import MessageList from "./MessageList";
import type { MessageChat } from "../../interfaces/message";

interface ContentProps {
  username: string;
}

const Content: React.FC<ContentProps> = ({ username }) => {
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8000/ws?username=${username}`);

    ws.current.onmessage = (event) => {
      const text = event.data;

      // Ejemplo: "pepe: hola"
      const [sender, content] = text.split(": ");
      setMessages((prev) => [
        ...prev,
        {
          sender_id: sender === username ? 1 : 0,
          sender_name: sender,
          content: content ?? text,
          create_at: new Date().toLocaleTimeString(),
        },
      ]);
    };

    ws.current.onclose = () => console.log("WebSocket cerrado");

    return () => {
      ws.current?.close();
    };
  }, [username]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(text);
      setMessages((prev) => [
        ...prev,
        {
          sender_id: 1,
          sender_name: username,
          content: text,
          create_at: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-2xl mx-auto bg-gray-900 rounded-lg shadow-lg border border-gray-700">
      <div className="bg-gray-800 text-center py-3 text-lg font-semibold border-b border-gray-700">
        Chat de {username}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, idx) => (
          <MessageList msg={msg} key={idx} />
        ))}
        <div ref={chatEndRef} />
      </div>

      <MessageBar onSend={sendMessage} />
    </div>
  );
};

export default Content;
