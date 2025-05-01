import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as birdeyeService from '../services/birdeyeService';
import './MarketData.css';

// Define types for our component state
interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  rank: number;
  logoURI?: string;
}

interface TokenPrice {
  address: string;
  price: number;
  priceChange24h: number;
  name: string;
  symbol: string;
  volume24h: number;
  liquidity: number;
  logoURI?: string;
}

const DEFAULT_TOKENS = [
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  '7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx', // GMT
];

export function MarketData() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [watchlistTokens, setWatchlistTokens] = useState<TokenPrice[]>([]);
  const [activeTab, setActiveTab] = useState<'trending' | 'watchlist'>('trending');
  const [birdeyeApiKey, setBirdeyeApiKey] = useState<string | null>(
    localStorage.getItem('birdeyeApiKey') || ''
  );
  const [apiKeyInput, setApiKeyInput] = useState(birdeyeApiKey || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!birdeyeApiKey);

  // Format price with appropriate precision
  const formatPrice = (price: number): string => {
    if (price < 0.0001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 100) return price.toFixed(2);
    return price.toFixed(2);
  };

  // Format percentage for price changes
  const formatPercent = (value: number): string => {
    const formatted = (value * 100).toFixed(2);
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  // Format volume/liquidity values
  const formatValue = (value: number): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  // Save API key to local storage
  const saveApiKey = () => {
    if (apiKeyInput) {
      localStorage.setItem('birdeyeApiKey', apiKeyInput);
      setBirdeyeApiKey(apiKeyInput);
      setShowApiKeyInput(false);
      // Reload data with new API key
      loadData();
    }
  };

  // Toggle API key input visibility
  const toggleApiKeyInput = () => {
    setShowApiKeyInput(!showApiKeyInput);
  };

  // Load data from Birdeye API
  const loadData = async () => {
    if (!birdeyeApiKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get trending tokens
      const trendingResponse = await birdeyeService.getTrendingTokens();
      setTrendingTokens(trendingResponse.data.items.slice(0, 10));
      
      // Get watchlist token prices
      const watchlistData: TokenPrice[] = [];
      
      // Get prices for default tokens
      for (const tokenAddress of DEFAULT_TOKENS) {
        try {
          const tokenData = await birdeyeService.getTokenPrice(tokenAddress);
          watchlistData.push(tokenData);
        } catch (tokenError) {
          console.error(`Error loading token ${tokenAddress}:`, tokenError);
        }
      }
      
      setWatchlistTokens(watchlistData);
    } catch (err) {
      console.error('Error loading market data:', err);
      setError('Failed to load market data. Please check your API key.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount and when API key changes
  useEffect(() => {
    if (birdeyeApiKey) {
      loadData();
    }
  }, [birdeyeApiKey]);

  return (
    <div className="market-data-container">
      <div className="market-data-header">
        <h2 className="market-data-title">Solana Market Data</h2>
        <button onClick={toggleApiKeyInput} className="api-key-button">
          {showApiKeyInput ? 'Cancel' : 'Set API Key'}
        </button>
      </div>
      
      {showApiKeyInput && (
        <div className="api-key-form">
          <input
            type="text"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Enter Birdeye API Key"
            className="api-key-input"
          />
          <button onClick={saveApiKey} className="save-api-key-button">
            Save Key
          </button>
          <p className="api-key-info">
            You can get a Birdeye API key from <a href="https://birdeye.so/developers" target="_blank" rel="noopener noreferrer">birdeye.so/developers</a>
          </p>
        </div>
      )}
      
      {!birdeyeApiKey && !showApiKeyInput && (
        <div className="api-key-required">
          <p>Birdeye API key is required to display market data.</p>
          <button onClick={toggleApiKeyInput} className="set-api-key-button">
            Set API Key
          </button>
        </div>
      )}
      
      {birdeyeApiKey && (
        <>
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'trending' ? 'active' : ''}`}
              onClick={() => setActiveTab('trending')}
            >
              Trending
            </button>
            <button
              className={`tab ${activeTab === 'watchlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('watchlist')}
            >
              Watchlist
            </button>
          </div>
          
          {isLoading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading market data...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={toggleApiKeyInput} className="retry-button">
                Update API Key
              </button>
            </div>
          ) : (
            <div className="tokens-list">
              <div className="tokens-header">
                <span className="token-column">{t('market.token')}</span>
                <span className="price-column">{t('market.price')}</span>
                <span className="change-column">{t('market.change')}</span>
                <span className="volume-column">{activeTab === 'trending' ? t('market.volume') : t('market.liquidity')}</span>
              </div>
              
              {activeTab === 'trending' ? (
                trendingTokens.map((token) => (
                  <div key={token.address} className="token-row">
                    <div className="token-column">
                      {token.logoURI && (
                        <img src={token.logoURI} alt={token.symbol} className="token-logo" />
                      )}
                      <div className="token-info">
                        <span className="token-symbol">{token.symbol}</span>
                        <span className="token-name">{token.name}</span>
                      </div>
                    </div>
                    <div className="price-column">${formatPrice(token.price)}</div>
                    <div className={`change-column ${token.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(token.priceChange24h)}
                    </div>
                    <div className="volume-column">{formatValue(token.volume24h)}</div>
                  </div>
                ))
              ) : (
                watchlistTokens.map((token) => (
                  <div key={token.address} className="token-row">
                    <div className="token-column">
                      {token.logoURI && (
                        <img src={token.logoURI} alt={token.symbol} className="token-logo" />
                      )}
                      <div className="token-info">
                        <span className="token-symbol">{token.symbol}</span>
                        <span className="token-name">{token.name}</span>
                      </div>
                    </div>
                    <div className="price-column">${formatPrice(token.price)}</div>
                    <div className={`change-column ${token.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(token.priceChange24h)}
                    </div>
                    <div className="volume-column">{formatValue(token.liquidity)}</div>
                  </div>
                ))
              )}
            </div>
          )}
          
          <div className="powered-by">
            <span>Powered by</span>
            <a href="https://birdeye.so" target="_blank" rel="noopener noreferrer" className="birdeye-link">
              <img src="https://birdeye.so/icon-192.png" alt="Birdeye" className="birdeye-logo" />
              Birdeye
            </a>
          </div>
        </>
      )}
    </div>
  );
}
