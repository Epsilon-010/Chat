import { useState } from "react";

interface MessageBarProps {
  onSend: (text: string) => void;
}

const MessageBar: React.FC<MessageBarProps> = ({ onSend }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;
    onSend(input);
    setInput("");
  };

  return (
  <div className="flex items-center p-4 border-t border-gray-700/70 
                  bg-gray-800/90 backdrop-blur shadow-inner">
    <input
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      placeholder="Escribe un mensaje..."
      className="flex-1 bg-gray-700/80 text-white rounded-l-xl px-4 py-2 
                 outline-none focus:ring-2 focus:ring-amber-400 shadow-md
                 placeholder-gray-400"
    />
    <button
      onClick={handleSend}
      className="bg-amber-400 text-black font-semibold px-6 py-2 rounded-r-xl 
                 hover:bg-amber-300 active:scale-95 transition-all shadow-md"
    >
      Enviar
    </button>
  </div>
);

};

export default MessageBar;
