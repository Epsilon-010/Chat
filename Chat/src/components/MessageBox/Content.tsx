import React, { useEffect, useRef, useState } from "react";
import MessageBar from "./MessageBar";
import MessageList from "./MessageList";
import type { MessageChat } from "../../interfaces/message";
import CryptoJS from "crypto-js";

interface ContentProps {
  username: string;
}

const Content: React.FC<ContentProps> = ({ username }) => {
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Diffie-Hellman parámetros ---
  const P = 23;
  const G = 5;

  // --- claves locales del cliente ---
  const privateKey = useRef<number>(Math.floor(Math.random() * 10) + 1);
  const sharedKey = useRef<string>(""); // clave AES final derivada

  // --- AES: cifrar ---
  const encrypt = (plaintext: string) => {
    const key = CryptoJS.enc.Hex.parse(sharedKey.current);
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv,
      mode: CryptoJS.mode.CFB,
      padding: CryptoJS.pad.NoPadding
    });
    return iv.concat(encrypted.ciphertext).toString(CryptoJS.enc.Hex);
  };

  // --- AES: descifrar ---
  const decrypt = (cipherHex: string) => {
    const raw = CryptoJS.enc.Hex.parse(cipherHex);
    const iv = CryptoJS.lib.WordArray.create(raw.words.slice(0, 4));
    const ciphertext = CryptoJS.lib.WordArray.create(raw.words.slice(4));

    const key = CryptoJS.enc.Hex.parse(sharedKey.current);
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext },
      key,
      { iv, mode: CryptoJS.mode.CFB, padding: CryptoJS.pad.NoPadding }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  };

  useEffect(() => {
    // --- Paso 1: calcular public key A ---
    const a = privateKey.current;
    const A = Math.pow(G, a) % P;

    // --- Abrir websocket con la pubkey ---
    ws.current = new WebSocket(
      `ws://localhost:8000/ws?username=${username}&pub=${A}`
    );

    ws.current.onmessage = (event) => {
      let data = event.data;

      // --- Detectar handshake del servidor ---
      if (data.startsWith("{")) {
        try {
          const obj = JSON.parse(data);
          if (obj.server_pub) {
            // --- Paso 3: calcular clave compartida ---
            const B = obj.server_pub;
            const shared = Math.pow(B, a) % P;

            // SHA-256(shared)
            const k = CryptoJS.SHA256(shared.toString()).toString();
            sharedKey.current = k;
            return;
          }
        } catch (e) {}
      }

      // --- Procesar mensaje normal ---
      let plaintext = data;

      // Si el mensaje está cifrado, lo intentamos descifrar
      if (/^[0-9a-fA-F]+$/.test(data) && data.length > 32) {
        try {
          plaintext = decrypt(data);
        } catch { /* no se pudo descifrar */ }
      }

      const [sender, content] = plaintext.split(": ");

      setMessages((prev) => [
        ...prev,
        {
          sender_id: sender === username ? 1 : 0,
          sender_name: sender || "???",
          content: content ?? plaintext,
          create_at: new Date().toLocaleTimeString()
        }
      ]);
    };

    ws.current.onclose = () => console.log("WebSocket cerrado");

    return () => ws.current?.close();
  }, [username]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const encrypted = encrypt(text);
      ws.current.send(encrypted);

      setMessages((prev) => [
        ...prev,
        {
          sender_id: 1,
          sender_name: username,
          content: text,
          create_at: new Date().toLocaleTimeString()
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
