import type { MessageChat } from "../../interfaces/message";

interface Props {
  msg: MessageChat;
}

const MessageList = ({ msg }: Props) => {
  const isSelf = msg.sender_id === 1;
  const isSystem = msg.sender_name === "System";

  if (isSystem) {
    return (
      <div className="text-center text-sm text-blue-400 italic">
        {msg.content}
      </div>
    );
  }

  return (
  <div
    className={`flex mb-3 ${
      isSelf ? "justify-end" : "justify-start"
    } transition-all`}
  >
    <div
      className={`p-3 rounded-2xl max-w-xs shadow-lg border
      ${
        isSelf
          ? "bg-gradient-to-br from-amber-400 to-amber-300 text-black border-amber-200"
          : "bg-gray-700/90 text-white border-gray-600"
      }`}
    >
      {!isSelf && (
        <p className="text-xs font-semibold text-gray-300 mb-1">
          {msg.sender_name}
        </p>
      )}
      <p className="text-sm leading-relaxed">{msg.content}</p>
      <p className="text-xs text-gray-400 mt-1 text-right">{msg.create_at}</p>
    </div>
  </div>
);

};

export default MessageList;
