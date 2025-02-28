import React from 'react';
import ChatHistory from './ChatHistory';

interface ChatContainerProps {
  chatHistory: Array<{ role: string; content: string }>;
  chatContainerRef: React.RefObject<HTMLDivElement>;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  chatHistory,
  chatContainerRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6" ref={chatContainerRef}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Chat with DeepSeek</h1>

        {/* Chat History */}
        <ChatHistory chatHistory={chatHistory} />
      </div>
    </div>
  );
};

export default ChatContainer;