import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FiSend, FiShare2, FiStopCircle } from "react-icons/fi";
import { usePrivyWallets } from "../hooks/usePrivyWallet";
import { NewChatTiles } from "./NewChatTiles";

interface ChatContainerProps {
  inputMessage: string;
  isGenerating?: boolean;
  onSendMessage?: (message: string) => void;
  onInputChange?: (message: string) => void;
  onStopGeneration?: () => void;
  onShareChat?: () => void;
  isSharedChat?: boolean;
  children: ReactNode;
  handleQuestionClick?: (question: string) => void;
  displayTiles?: boolean;
  hasMessages?: boolean;
}

export function ChatContainer({
  inputMessage,
  isGenerating = false,
  onSendMessage = () => {},
  onInputChange = () => {},
  onStopGeneration = () => {},
  onShareChat,
  isSharedChat = false,
  children,
  handleQuestionClick,
  displayTiles = false,
  hasMessages = false,
}: ChatContainerProps) {
  const { t } = useTranslation();
  const RECOMMENDED_QUESTIONS_TILES = [
    {
      question: t("recommended_questions.what_actions_can_you_perform_for_me"),
      enabled: true,
      display: t("recommended_questions.learn_about_listen"),
    },
    {
      question: t(
        "recommended_questions.how_do_pipelines_work_and_what_pipelines_can_you_create_for_me"
      ),
      enabled: true,
      display: t("recommended_questions.complex_made_simple"),
    },
    {
      question: t("recommended_questions.what_chains_are_supported"),
      enabled: true,
      display: t("recommended_questions.supported_chains"),
    },
    {
      question: t(
        "recommended_questions.what_tokens_have_received_largest_inflows_outflows_in_the_past_days"
      ),
      enabled: true,
      display: t("recommended_questions.discover_coins"),
    },
  ];

  return (
    <div className="relative mx-auto flex h-full w-full max-w-3xl flex-col md:px-2">
      <div
        className="flex-1 overflow-y-auto scrollable-container"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "smooth",
          maxHeight: "calc(100vh - 100px)",
        }}
      >
        <div className="flex flex-col gap-3 px-4 pt-1">{children}</div>
      </div>
      {displayTiles && (
        <NewChatTiles
          questions={RECOMMENDED_QUESTIONS_TILES}
          onSelect={handleQuestionClick || (() => {})}
        />
      )}
      <div className="sticky bottom-0 left-0 right-0 bg-[#151518]/80 backdrop-blur-sm pb-2 px-4 lg:px-0 pt-3">
        <ChatInput
          inputMessage={inputMessage}
          isGenerating={isGenerating}
          onSendMessage={onSendMessage}
          onInputChange={onInputChange}
          onStopGeneration={onStopGeneration}
          onShareChat={onShareChat}
          isSharedChat={isSharedChat}
          hasMessages={hasMessages}
        />
      </div>
    </div>
  );
}

interface ChatInputProps {
  inputMessage: string;
  isGenerating: boolean;
  onSendMessage: (message: string) => void;
  onInputChange: (message: string) => void;
  onStopGeneration: () => void;
  onShareChat?: () => void;
  isSharedChat?: boolean;
  hasMessages?: boolean;
}

export function ChatInput({
  inputMessage,
  isGenerating,
  onSendMessage,
  onInputChange,
  onStopGeneration,
  onShareChat,
  isSharedChat = false,
  hasMessages = false,
}: ChatInputProps) {
  const handleSend = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
    }
  };

  const { data: wallets } = usePrivyWallets();

  const walletsReady =
    wallets?.evmWallet !== undefined && wallets?.solanaWallet !== undefined;

  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-row items-center justify-center gap-1 px-2 pl-4 py-2 bg-[#151518]/40 backdrop-blur-sm border border-[#2D2D2D] rounded-[99px] mb-2`}
    >
      <textarea
        value={inputMessage}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (isGenerating) {
              onStopGeneration();
            } else {
              handleSend();
            }
          }
          if (e.key === "Escape" && isGenerating) {
            e.preventDefault();
            onStopGeneration();
          }
        }}
        rows={1}
        className="w-full bg-transparent text-white outline-none resize-none chat-input"
        placeholder={t("chat.placeholder")}
        style={{
          minHeight: "20px",
          maxHeight: "200px",
        }}
        disabled={isSharedChat}
      />

      <div className="flex-shrink-0 ml-2 flex items-center gap-2">
        {!isSharedChat && onShareChat && (
          <button
            onClick={onShareChat}
            className="p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 transition-colors"
            title="Share this chat"
          >
            <FiShare2 size={18} />
          </button>
        )}

        {hasMessages && (
          <Link
            to="/"
            search={{ new: true }}
            className={`p-2 rounded-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 transition-colors`}
            title="New Chat"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </Link>
        )}

        {isGenerating ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStopGeneration();
            }}
            className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors"
            aria-label="Stop generating"
          >
            <FiStopCircle className="text-red-400" size={18} />
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSend();
            }}
            disabled={!inputMessage.trim() || !walletsReady || isSharedChat}
            className={`p-2 rounded-full ${
              inputMessage.trim() && walletsReady && !isSharedChat
                ? "bg-purple-500/20 hover:bg-purple-500/40 text-purple-300"
                : "bg-gray-500/10 text-gray-500"
            } transition-colors`}
            aria-label="Send message"
          >
            <FiSend size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
