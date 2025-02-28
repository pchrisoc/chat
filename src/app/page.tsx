'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isThinking) return; // Prevent multiple submissions

    setIsThinking(true);

    try {
      // Add user message to chat history
      setChatHistory((prev) => [...prev, { role: 'user', content: message }]);

      const res = await axios.post<{ response: string }>('/api/chat', { message });
      const botResponse = res.data.response;

      // Add bot response to chat history
      setChatHistory((prev) => [...prev, { role: 'bot', content: botResponse }]);

      // Clear the input field
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setChatHistory((prev) => [...prev, { role: 'bot', content: 'Failed to get a response. Please try again.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  // Scroll to bottom of chat container when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-6" ref={chatContainerRef}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-6">Chat with DeepSeek</h1>

          {/* Chat History */}
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
        </div>
      </div>

      {/* Chat Input */}
      <div className="sticky bottom-0 bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 p-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isThinking}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
              disabled={isThinking}
            >
              {isThinking ? 'Thinking...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}