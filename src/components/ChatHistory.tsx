import React from 'react';

interface ChatHistoryProps {
  chatHistory: Array<{ role: string; content: string }>;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ chatHistory }) => {
  return (
    <div className="space-y-4">
      {chatHistory.map((chat, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg ${
            chat.role === 'user' ? 'bg-gray-800' : 'bg-gray-700'
          }`}
        >
          <p className="font-semibold">{chat.role === 'user' ? 'You' : 'Bot'}:</p>
          <p className="text-gray-200">{chat.content}</p>
        </div>
      ))}
    </div>
  );
};

export default ChatHistory;