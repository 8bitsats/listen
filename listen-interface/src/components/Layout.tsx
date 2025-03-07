import { usePrivy } from "@privy-io/react-auth";
import { Link } from "@tanstack/react-router";
import { createContext, memo, useContext, useState } from "react";
import { UseBalanceReturnType } from "wagmi";
import ethereumIcon from "../assets/icons/ethereum.svg";
import { imageMap } from "../hooks/util";
import { Background } from "./Background";

import { useTranslation } from "react-i18next";
import { FaXTwitter } from "react-icons/fa6";
import { TbHistoryToggle } from "react-icons/tb";
import LanguageSwitcher from "./LanguageSwitcher";
import { PanelSelector } from "./PanelSelector";
import { RecentChats } from "./RecentChats";
import { SimpleHeader } from "./SimpleHeader";

function balanceToUI(balance: UseBalanceReturnType["data"]) {
  if (!balance?.value || !balance?.decimals) return 0;
  return Number(balance?.value) / 10 ** balance?.decimals;
}

// Memoize the NavLink component
const MemoizedNavLink = memo(function NavLink({
  to,
  icon: Icon,
  label,
  isSidebarOpen = true,
  isChat = false,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isSidebarOpen?: boolean;
  isChat?: boolean;
}) {
  const setIsSidebarOpen = useContext(SidebarContext);

  return (
    <div className="relative">
      <Link
        to={to}
        className="flex items-center h-10 rounded-lg text-gray-300 hover:text-white hover:bg-purple-500/10 [&.active]:bg-purple-500/20 [&.active]:text-white transition-colors"
        onClick={() => {
          if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
          }
        }}
      >
        <div
          className={`flex items-center h-full ${
            isSidebarOpen ? "px-4 w-full" : "justify-center w-16"
          }`}
        >
          <Icon className="w-5 h-5 min-w-[20px]" />
          {isSidebarOpen && (
            <>
              <span className="ml-3 flex-1">{label}</span>
              {isChat && (
                <Link
                  to="/"
                  search={{ new: true }}
                  className="p-1 hover:bg-purple-500/20 rounded-full transition-colors"
                  title="New Chat"
                >
                  <svg
                    width="16"
                    height="16"
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
            </>
          )}
        </div>
      </Link>
      {isChat && isSidebarOpen && (
        <div className="mt-1">
          <RecentChats />
        </div>
      )}
    </div>
  );
});

// Memoize the BottomLink component
const MemoizedBottomLink = memo(function BottomLink({
  href,
  icon: Icon,
  label,
  isSidebarOpen = true,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isSidebarOpen?: boolean;
}) {
  return (
    <a
      href={href}
      className="flex items-center h-10 rounded-lg text-gray-300 hover:text-white hover:bg-purple-500/10 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div
        className={`flex items-center h-full ${
          isSidebarOpen ? "px-4 w-full" : "justify-center w-16"
        }`}
      >
        <Icon />
        {isSidebarOpen && <span className="ml-3">{label}</span>}
      </div>
    </a>
  );
});

// Balance Display Component
export function BalanceDisplay({
  isSidebarOpen,
  solanaBalance,
  ethereumBalance,
}: {
  isSidebarOpen: boolean;
  solanaBalance?: number;
  ethereumBalance?: UseBalanceReturnType["data"];
}) {
  return (
    <div className="mt-8 space-y-1">
      <div
        className={`flex items-center h-10 ${
          isSidebarOpen ? "px-4" : "justify-center"
        }`}
      >
        <img src={imageMap.solana} alt="SOL" className="w-6 h-6 rounded-full" />
        {isSidebarOpen && (
          <span className="ml-3 text-sm text-gray-300">
            {solanaBalance?.toFixed(2) || "0.00"}
          </span>
        )}
      </div>
      <div
        className={`flex items-center h-10 ${
          isSidebarOpen ? "px-4" : "justify-center"
        }`}
      >
        <img src={ethereumIcon} alt="ETH" className="w-6 h-6 rounded-full" />
        {isSidebarOpen && (
          <span className="ml-3 text-sm text-gray-300">
            {balanceToUI(ethereumBalance)?.toFixed(4) || "0.0000"}
          </span>
        )}
      </div>
    </div>
  );
}

// Version Display Component
export function VersionAndLanguageDisplay() {
  return (
    <div className="flex justify-around items-center w-full">
      <span className="text-xs text-gray-400">version: 1.1.4</span>
      <LanguageSwitcher />
    </div>
  );
}

// Add this near the top of the file, after imports
const SidebarContext = createContext<(open: boolean) => void>(() => {});

// Move these outside the component as functions that take the translation function
function getNavItems(t: (key: string) => string) {
  return [
    {
      to: "/",
      icon: TbHistoryToggle,
      label: t("layout.chat_history"),
      isChat: true, // This will show the recent chats
    },
  ] as const;
}

function getBottomItems(t: (key: string) => string) {
  return [
    {
      href: "https://docs.listen-rs.com",
      icon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      ),
      label: t("layout.documentation"),
    },
    {
      href: "https://github.com/piotrostr/listen",
      icon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
      label: t("layout.github"),
    },
    {
      href: "https://x.com/listenonsol",
      icon: () => <FaXTwitter />,
      label: t("layout.twitter"),
    },
  ] as const;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState(
    localStorage.getItem("activePanel") || null
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = usePrivy();
  const { t } = useTranslation();

  // Call the function with the current translation function
  const BOTTOM_ITEMS = getBottomItems(t);

  // Memoize the bottom items to prevent unnecessary re-renders
  const memoizedBottomItems = BOTTOM_ITEMS.map((item, index) => (
    <MemoizedBottomLink
      key={index}
      href={item.href}
      icon={item.icon}
      label={item.label}
      isSidebarOpen={isSidebarOpen}
    />
  ));

  // Handle sidebar hover effects
  const handleSidebarMouseEnter = () => {
    setIsSidebarOpen(true);
  };

  const handleSidebarMouseLeave = () => {
    setIsSidebarOpen(false);
  };

  return (
    <SidebarContext.Provider value={setIsSidebarOpen}>
      <div className="relative h-screen flex flex-col text-white overflow-hidden">
        <Background />

        {/* Header */}
        <div className="z-20 bg-black/40 backdrop-blur-sm">
          <SimpleHeader
            activePanel={activePanel}
            setActivePanel={(panel) => {
              setActivePanel(panel);
              if (panel) {
                localStorage.setItem("activePanel", panel);
              } else {
                localStorage.removeItem("activePanel");
              }
            }}
          />
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Collapsible Sidebar */}
          <div
            className={`absolute left-0 top-0 bottom-0 z-10 transition-all duration-300 ${
              isSidebarOpen ? "w-64" : "w-16"
            } border-r border-purple-500/30 bg-black/40 backdrop-blur-sm flex flex-col`}
            onMouseEnter={handleSidebarMouseEnter}
            onMouseLeave={handleSidebarMouseLeave}
          >
            {/* New Chat Button */}
            <div className="p-4">
              <Link
                to="/"
                search={{ new: true }}
                className="flex items-center justify-center h-10 rounded-lg bg-purple-500/20 text-white hover:bg-purple-500/30 transition-colors"
              >
                <div className="flex items-center">
                  <svg
                    width="20"
                    height="20"
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
                  {isSidebarOpen && <span className="ml-3">New Chat</span>}
                </div>
              </Link>
            </div>

            {/* Recent Chats Section */}
            <div className="px-4 mb-2">
              {isSidebarOpen && (
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 px-4">
                  {t("layout.recent_chats")}
                </div>
              )}
              <div className={isSidebarOpen ? "block" : "hidden"}>
                <RecentChats />
              </div>
            </div>

            {/* Bottom section */}
            <div className="mt-auto p-4 space-y-1">
              {isSidebarOpen && <VersionAndLanguageDisplay />}
              {memoizedBottomItems}
              {user && (
                <button
                  onClick={() => logout()}
                  className="flex items-center h-10 w-full rounded-lg text-gray-300 hover:text-white hover:bg-purple-500/10 transition-colors"
                >
                  <div
                    className={`flex items-center h-full ${
                      isSidebarOpen ? "px-4 w-full" : "justify-center w-16"
                    }`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <path d="M16 17l5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
                    {isSidebarOpen && (
                      <span className="ml-3">{t("layout.logout")}</span>
                    )}
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Centered Chat Content */}
          <div className="flex-1 flex overflow-hidden z-0">
            {/* Chat is always visible and centered */}
            <div
              className={`flex-1 overflow-hidden ${
                activePanel && window.innerWidth < 1024 ? "hidden" : "block"
              } mx-auto max-w-4xl px-4 lg:px-0`}
            >
              {children}
            </div>

            {/* Right panel for toggleable components */}
            <PanelSelector
              activePanel={activePanel}
              setActivePanel={(panel) => {
                setActivePanel(panel);
                if (panel) {
                  localStorage.setItem("activePanel", panel);
                } else {
                  localStorage.removeItem("activePanel");
                }
              }}
            />
          </div>
        </div>
      </div>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
    </SidebarContext.Provider>
  );
}
