"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BiSolidHide } from "react-icons/bi";
import { FaCircle, FaPause, FaRegStar } from "react-icons/fa";
import { setupWebSocket } from "../services/websocketService";
import { useTokenStore } from "../store/tokenStore";
import { TokenTile } from "./TokenTile";

interface PriceUpdatesProps {
  marketCapFilter: string;
  volumeFilter: "bought" | "sold" | "all";
  isListFrozen: boolean;
  setIsListFrozen: (frozen: boolean) => void;
  showWatchlistOnly: boolean;
  showHiddenOnly: boolean;
}

export function PriceUpdates({
  marketCapFilter,
  volumeFilter,
  isListFrozen,
  setIsListFrozen,
  showWatchlistOnly,
  showHiddenOnly,
}: PriceUpdatesProps) {
  const { tokenMap, filterAndSortTokens, isWatchlisted, isHidden } =
    useTokenStore();
  const [frozenTokens, setFrozenTokens] = useState<any[]>([]);

  // Setup WebSocket connection
  useEffect(() => {
    const ws = setupWebSocket();
    return () => {
      ws.close();
    };
  }, []);

  // Get the current tokens based on filters
  const currentTokens = useMemo(() => {
    let tokens = filterAndSortTokens(
      Array.from(tokenMap.values()),
      marketCapFilter,
      volumeFilter
    ).slice(0, 20);

    // Filter by watchlist if needed
    if (showWatchlistOnly) {
      tokens = tokens.filter((token) => isWatchlisted(token.pubkey));
    }

    if (showHiddenOnly) {
      tokens = tokens.filter((token) => isHidden(token.pubkey));
    }

    return tokens;
  }, [
    tokenMap,
    marketCapFilter,
    volumeFilter,
    filterAndSortTokens,
    showWatchlistOnly,
    isWatchlisted,
  ]);

  // Keep frozen tokens updated with current tokens when not frozen
  useEffect(() => {
    if (!isListFrozen) {
      setFrozenTokens(currentTokens);
    }
  }, [currentTokens, isListFrozen]);

  // Use frozen tokens when list is frozen, otherwise use current tokens
  const topTokens = isListFrozen ? frozenTokens : currentTokens;

  const handleMouseEnter = () => {
    setIsListFrozen(true);
  };

  const handleMouseLeave = () => {
    setIsListFrozen(false);
  };

  return (
    <div className="h-full font-mono overflow-y-auto scrollable-container">
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {topTokens.map((token) => (
          <TokenTile key={token.pubkey} token={token} />
        ))}
      </div>
    </div>
  );
}

interface PriceUpdatesHeaderProps {
  volumeFilter: "bought" | "sold" | "all";
  setVolumeFilter: (filter: "bought" | "sold" | "all") => void;
  marketCapFilter: string;
  setMarketCapFilter: (filter: string) => void;
  isListFrozen: boolean;
  showWatchlistOnly: boolean;
  showHiddenOnly: boolean;
  setShowWatchlistOnly: (show: boolean) => void;
  setShowHiddenOnly: (show: boolean) => void;
}

// Export the filter header component separately
export function PriceUpdatesHeader({
  volumeFilter,
  setVolumeFilter,
  marketCapFilter,
  setMarketCapFilter,
  isListFrozen,
  showWatchlistOnly,
  setShowWatchlistOnly,
  showHiddenOnly,
  setShowHiddenOnly,
}: PriceUpdatesHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 h-full">
      <div className="flex gap-2 h-full items-center">
        {isListFrozen && (
          <div className="flex items-center gap-1 bg-black/60 border border-teal-400/30 rounded px-2 h-8 text-xs text-teal-300">
            <FaPause className="text-teal-300 text-[10px]" />
          </div>
        )}
        <button
          onClick={() =>
            setVolumeFilter(volumeFilter === "bought" ? "all" : "bought")
          }
          className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center ${
            volumeFilter === "bought" ? "bg-[#2D2D2D]" : "bg-black/40"
          } hover:bg-[#2D2D2D] transition-all`}
        >
          <FaCircle className="text-green-500 text-xs" />
        </button>
        <button
          onClick={() =>
            setVolumeFilter(volumeFilter === "sold" ? "all" : "sold")
          }
          className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center ${
            volumeFilter === "sold" ? "bg-[#2D2D2D]" : "bg-black/40"
          } hover:bg-[#2D2D2D] transition-all`}
        >
          <FaCircle className="text-red-500 text-xs" />
        </button>
        <button
          onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
          className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center ${
            showWatchlistOnly
              ? "bg-yellow-500/20 text-yellow-300"
              : "bg-black/40 text-gray-300"
          } hover:bg-[#2D2D2D] transition-all`}
          title={showWatchlistOnly ? "Show all tokens" : "Show watchlist only"}
        >
          <FaRegStar size={14} />
        </button>
        <button
          onClick={() => setShowHiddenOnly(!showHiddenOnly)}
          className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center ${
            showHiddenOnly
              ? "bg-red-500/20 text-red-300"
              : "bg-black/40 text-gray-300"
          } hover:bg-[#2D2D2D] transition-all`}
          title={showHiddenOnly ? "Show all tokens" : "Show hidden tokens"}
        >
          <BiSolidHide size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={marketCapFilter}
          onChange={(e) => setMarketCapFilter(e.target.value)}
          className="bg-black/40 text-white rounded-lg px-2 h-8 text-sm focus:outline-none w-[120px] border border-[#2D2D2D]"
        >
          <option value="all">{t("price_updates.all")}</option>
          <option value="under1m">&lt;$1M</option>
          <option value="1mTo10m">$1M-$10M</option>
          <option value="10mTo100m">$10M-$100M</option>
          <option value="over100m">&gt;$100M</option>
        </select>
      </div>
    </div>
  );
}
