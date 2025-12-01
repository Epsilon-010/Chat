import React, { useEffect, useRef, useState } from "react";
import MessageBar from "./MessageBar";
import MessageList from "./MessageList";
import type { MessageChat } from "../../interfaces/message";

interface ContentProps {
  username: string;
}

// Parámetros Diffie-Hellman pequeños
const DH_P = BigInt(101);
const DH_G = BigInt(2);

const Content: React.FC<ContentProps> = ({ username }) => {
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [keyBytes, setKeyBytes] = useState<ArrayBuffer | null>(null);
  const [allowed, setAllowed] = useState<boolean>(true);
  const [dhCompleted, setDhCompleted] = useState<boolean>(false);

  // -------- AES-GCM Decrypt --------
  const decryptMessage = async (keyBuf: ArrayBuffer, encrypted: string) => {
    try {
      const decoded = JSON.parse(atob(encrypted));

      const key = await crypto.subtle.importKey(
        "raw",
        keyBuf,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      const iv = new Uint8Array(decoded.iv);
      const data = new Uint8Array(decoded.data);
      const tag = new Uint8Array(decoded.tag || new Array(16));

      const ciphertextWithTag = new Uint8Array(data.length + tag.length);
      ciphertextWithTag.set(data);
      ciphertextWithTag.set(tag, data.length);

      const decrypted = await crypto.subtle.decrypt(
        { 
          name: "AES-GCM", 
          iv: iv,
        },
        key,
        ciphertextWithTag
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error("Error descifrando:", error);
      return "🔒 Error al descifrar";
    }
  };

  // modular exponentiation (BigInt)
  function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = 1n;
    let b = base % mod;
    let e = exp;
    while (e > 0) {
      if (e & 1n) result = (result * b) % mod;
      e = e >> 1n;
      b = (b * b) % mod;
    }
    return result;
  }

  async function deriveKeyFromString(s: string): Promise<ArrayBuffer> {
    const enc = new TextEncoder();
    const buf = enc.encode(s);
    return await crypto.subtle.digest("SHA-256", buf);
  }

  // -------- Connect WebSocket --------
  useEffect(() => {
    (async () => {
      // Generar clave privada aleatoria en el rango [2, P-2]
      const a = BigInt(Math.floor(Math.random() * (Number(DH_P) - 3)) + 2);
      const A = modPow(DH_G, a, DH_P);

      ws.current = new WebSocket(`ws://localhost:8000/ws?username=${username}`);

      ws.current.onopen = () => {
        console.log("WS abierto, esperando server_pub...");
      };

      ws.current.onmessage = async (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          console.error("mensaje no json", event.data);
          return;
        }

        if (data.type === "server_pub") {
          const B = BigInt(data.value);
          const shared = modPow(B, a, DH_P);
          const sharedStr = shared.toString();
          const kb = await deriveKeyFromString(sharedStr);
          setKeyBytes(kb);
          setDhCompleted(true);

          ws.current?.send(JSON.stringify({ 
            type: "client_pub", 
            value: A.toString() 
          }));
          return;
        }

        if (data.type === "perm") {
          setAllowed(Boolean(data.allowed));
          return;
        }

        if (data.type === "system") {
          setMessages((prev) => [
            ...prev,
            {
              sender_id: -1,
              sender_name: "Sistema",
              content: data.msg,
              create_at: new Date().toLocaleTimeString(),
            },
          ]);
          return;
        }

        if (data.type === "message") {
          let displayText = data.msg;
          const isOwnMessage = data.sender === username;

          // Lógica de visualización:
          // 1. Si es mi propio mensaje -> mostrar texto plano
          // 2. Si soy usuario permitido -> mostrar texto plano
          // 3. Si soy usuario NO permitido y NO es mi mensaje -> mostrar cifrado
          
          if (isOwnMessage) {
            // Mi propio mensaje: ya viene en texto plano del backend
            displayText = data.msg;
          } else if (allowed) {
            // Usuario permitido: mostrar texto plano
            displayText = data.msg;
          } else {
            // Usuario NO permitido y es mensaje de otro
            // Verificar si parece ser un mensaje cifrado (base64 JSON)
            const isEncrypted = data.msg && typeof data.msg === 'string' && 
                               (data.msg.includes('iv') || 
                                data.msg.includes('data') || 
                                data.msg.includes('tag') ||
                                (data.msg.startsWith('ey') && data.msg.length > 100));
            
            if (isEncrypted) {
              // Mostrar indicador de mensaje cifrado
              displayText = ` [MENSAJE CIFRADO DE ${data.sender.toUpperCase()}]`;
            } else {
              // Si por alguna razón no está cifrado, mostrar como está
              displayText = data.msg;
            }
          }

          setMessages((prev) => [
            ...prev,
            {
              sender_id: data.sender === username ? 1 : 0,
              sender_name: data.sender,
              content: displayText,
              create_at: new Date().toLocaleTimeString(),
            },
          ]);
        }
      };

      ws.current.onclose = () => console.log("WebSocket cerrado");
    })();

    return () => {
      ws.current?.close();
    };
  }, [username]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    // enviamos el mensaje al servidor
    // servidor lo difunde y recibiremos como cualquier otro mensaje
    ws.current.send(JSON.stringify({ type: "msg", msg: text }));
    
    // mensaje se añade cuando recibamos del servidor en onmessage
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-2xl mx-auto bg-gray-900 rounded-lg shadow-lg border border-gray-700">
      <div className="bg-gray-800 text-center py-3 text-lg font-semibold border-b border-gray-700">
        Chat de {username}
        <div className="text-sm text-gray-300 mt-1">
          {allowed ? "Usuario Permitido" : "Usuario No Permitido 😭😭"}
        </div>
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