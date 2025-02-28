'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ChatContainer from '@/components/ChatContainer';
import ChatInput from '@/components/ChatInput';

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
      <ChatContainer chatHistory={chatHistory} chatContainerRef={chatContainerRef} />
      <ChatInput
        message={message}
        setMessage={setMessage}
        handleSubmit={handleSubmit}
        isThinking={isThinking}
      />
    </div>
  );
}