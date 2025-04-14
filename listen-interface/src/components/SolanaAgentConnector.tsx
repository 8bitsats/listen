import React, { useState, useEffect } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import { Spinner } from './Spinner';
import { ChatMessage } from './ChatMessage';

interface ToolCall {
  id: string;
  name: string;
  params: string;
}

interface ToolResult {
  id: string;
  name: string;
  result: string;
}

interface SolanaAgentMessage {
  role: string;
  content: string;
  id: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  [key: string]: unknown;
}

interface AgentResponse {
  messages: SolanaAgentMessage[];
}

interface SolanaAgentConnectorProps {
  apiUrl?: string;
  defaultModel?: string;
}

export const SolanaAgentConnector: React.FC<SolanaAgentConnectorProps> = ({
  apiUrl = 'http://localhost:3030',
  defaultModel = 'gemini',
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<SolanaAgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(defaultModel);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if API is running
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${apiUrl}/health`);
        if (response.ok) {
          setConnected(true);
          setError(null);
        } else {
          setConnected(false);
          setError('API responded with an error');
        }
      } catch {
        setConnected(false);
        setError('Could not connect to the Solana Agent API');
      }
    };

    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage: SolanaAgentMessage = {
      role: 'user',
      content: inputMessage,
      id: Date.now().toString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setInputMessage('');

    try {
      const response = await fetch(`${apiUrl}/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          model,
          features: {
            autonomous: false,
            deep_research: false,
          },
          language: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data: AgentResponse = await response.json();
      setMessages(prev => [...prev, ...data.messages]);
    } catch (err) {
      console.error('Error calling Solana Agent API:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Add error message to chat
      const errorMessage: SolanaAgentMessage = {
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to get response from agent'}`,
        id: Date.now().toString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setModel(e.target.value);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Solana Agent</h2>
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
          
          <select 
            value={model}
            onChange={handleModelChange}
            className="ml-4 p-2 rounded bg-gray-700 border border-gray-600 text-white"
          >
            <option value="gemini">Gemini</option>
            <option value="claude">Claude</option>
            <option value="deepseek">DeepSeek</option>
            <option value="openrouter-llama">OpenRouter (Llama)</option>
            <option value="openrouter-claude">OpenRouter (Claude)</option>
            <option value="openrouter-gemini">OpenRouter (Gemini)</option>
            <option value="openrouter-openai">OpenRouter (OpenAI)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 p-3 mb-4 rounded text-red-100">
          Error: {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-800/30 rounded border border-gray-700">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Start a conversation with the Solana Agent
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.role === 'user' ? 'bg-blue-900/30 ml-10' : 'bg-gray-700/30 mr-10'
                }`}
              >
                <div className="font-semibold mb-1">
                  {msg.role === 'user' ? 'You' : 'Agent'}
                </div>
                <ChatMessage message={msg.content} direction={msg.role === 'user' ? 'outgoing' : 'incoming'} />
              </div>
            ))}
            {loading && (
              <div className="flex justify-center p-4">
                <Spinner />
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask the Solana Agent something..."
          className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-l text-white"
          disabled={loading || !connected}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-r"
          disabled={loading || !connected}
        >
          <FaArrowRight />
        </button>
      </form>
    </div>
  );
};
