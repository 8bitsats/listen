/**
 * Birdeye API Service for Solana token data
 * This service provides access to Birdeye's API endpoints for token prices, market data,
 * wallet information, and trending tokens.
 */

import { z } from 'zod';
import { config } from '../config';

// Define environment variable for API key
// Use default from config, or empty string if not set
const BIRDEYE_API_KEY = import.meta.env.VITE_BIRDEYE_API_KEY || config.birdeyeApiKey || '';

// Base URL for Birdeye API
const BIRDEYE_API_BASE_URL = 'https://public-api.birdeye.so';

// Validation schema for token address
const TokenAddressSchema = z.string().min(32).max(64);
const WalletAddressSchema = z.string().min(32).max(64);

// Standard fetch options for API calls
const getStandardOptions = (chain: string = 'solana') => ({
  headers: {
    'accept': 'application/json',
    'x-chain': chain,
    ...(BIRDEYE_API_KEY ? { 'x-api-key': BIRDEYE_API_KEY } : {})
  }
});

/**
 * Error handler for API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Birdeye API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

// Type definitions for API responses
interface TokenPrice {
  address: string;
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  name: string;
  symbol: string;
  decimals: number;
  volume24h: number;
  liquidity: number;
  logoURI?: string;
}

interface TokenPriceResponse {
  success: boolean;
  data: TokenPrice;
}

interface TokenPriceVolumeMulti {
  success: boolean;
  data: Record<string, {
    value: number;
    valueChange24h: number;
    valueChange7d: number;
  }>;
}

interface TokenList {
  success: boolean;
  data: {
    items: TokenPrice[];
    total: number;
  };
}

interface TrendingTokens {
  success: boolean;
  data: {
    items: {
      address: string;
      symbol: string;
      name: string;
      liquidity: number;
      price: number;
      volume24h: number;
      priceChange24h: number;
      rank: number;
      logoURI?: string;
    }[];
    total: number;
  };
}

interface WalletTokens {
  success: boolean;
  data: {
    tokens: {
      address: string;
      symbol: string;
      name: string;
      price: number;
      amount: number;
      value: number;
      decimals: number;
      logoURI?: string;
    }[];
    totalValue: number;
  };
}

interface TokenMetadata {
  success: boolean;
  data: {
    address: string;
    symbol: string;
    name: string;
    logoURI?: string;
    decimals: number;
    totalSupply: string;
  };
}

/**
 * Get the latest price information for a specified token
 * @param tokenAddress Solana token address
 * @returns Token price information
 */
export async function getTokenPrice(tokenAddress: string): Promise<TokenPrice> {
  try {
    const validatedAddress = TokenAddressSchema.parse(tokenAddress);
    const url = `${BIRDEYE_API_BASE_URL}/defi/price?address=${validatedAddress}`;
    const response = await fetch(url, getStandardOptions());
    const data = await handleResponse<TokenPriceResponse>(response);
    return data.data;
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw error;
  }
}

/**
 * Retrieve price and volume updates of multiple tokens
 * @param tokenAddresses Array of token addresses (max 50)
 * @param type Time period (24h, 7d, etc.)
 * @returns Price and volume information for multiple tokens
 */
export async function getMultiTokenPriceVolume(
  tokenAddresses: string[],
  type: '24h' | '7d' = '24h'
): Promise<TokenPriceVolumeMulti> {
  try {
    // Validate all addresses
    const validatedAddresses = tokenAddresses.map(addr => TokenAddressSchema.parse(addr));
    
    if (validatedAddresses.length > 50) {
      throw new Error('Maximum 50 token addresses allowed');
    }
    
    const url = `${BIRDEYE_API_BASE_URL}/defi/price_volume/multi`;
    const requestBody = {
      list_address: validatedAddresses.join(','),
      type
    };
    
    const response = await fetch(url, {
      ...getStandardOptions(),
      method: 'POST',
      headers: {
        ...getStandardOptions().headers,
        'content-type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    return handleResponse<TokenPriceVolumeMulti>(response);
  } catch (error) {
    console.error('Error fetching multi token price volume:', error);
    throw error;
  }
}

/**
 * Retrieve a list of tokens sorted by criteria
 * @param sortBy Field to sort by (e.g., v24hUSD)
 * @param sortType Sort direction (asc/desc)
 * @param offset Pagination offset
 * @param limit Number of results per page
 * @param minLiquidity Minimum liquidity filter
 * @returns List of tokens matching criteria
 */
export async function getTokenList(
  sortBy: string = 'v24hUSD',
  sortType: 'asc' | 'desc' = 'desc',
  offset: number = 0,
  limit: number = 50,
  minLiquidity: number = 100
): Promise<TokenList> {
  try {
    const url = `${BIRDEYE_API_BASE_URL}/defi/tokenlist?sort_by=${sortBy}&sort_type=${sortType}&offset=${offset}&limit=${limit}&min_liquidity=${minLiquidity}`;
    const response = await fetch(url, getStandardOptions());
    return handleResponse<TokenList>(response);
  } catch (error) {
    console.error('Error fetching token list:', error);
    throw error;
  }
}

/**
 * Get trending tokens based on various criteria
 * @param sortBy Field to sort by (usually 'rank')
 * @param sortType Sort direction
 * @param offset Pagination offset
 * @param limit Number of results
 * @returns List of trending tokens
 */
export async function getTrendingTokens(
  sortBy: string = 'rank',
  sortType: 'asc' | 'desc' = 'asc',
  offset: number = 0, 
  limit: number = 20
): Promise<TrendingTokens> {
  try {
    const url = `${BIRDEYE_API_BASE_URL}/defi/token_trending?sort_by=${sortBy}&sort_type=${sortType}&offset=${offset}&limit=${limit}`;
    const response = await fetch(url, getStandardOptions());
    return handleResponse<TrendingTokens>(response);
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    throw error;
  }
}

/**
 * Get a list of newly listed tokens
 * @param limit Number of tokens to return
 * @param memePlatformEnabled Include meme tokens
 * @returns List of newly listed tokens
 */
export async function getNewListings(
  limit: number = 10,
  memePlatformEnabled: boolean = false
): Promise<any> {
  try {
    const url = `${BIRDEYE_API_BASE_URL}/defi/v2/tokens/new_listing?limit=${limit}&meme_platform_enabled=${memePlatformEnabled}`;
    const response = await fetch(url, getStandardOptions());
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching new listings:', error);
    throw error;
  }
}

/**
 * Get token list for a specific wallet
 * @param walletAddress Solana wallet address
 * @returns List of tokens in the wallet with balances
 */
export async function getWalletTokens(walletAddress: string): Promise<WalletTokens> {
  try {
    const validatedAddress = WalletAddressSchema.parse(walletAddress);
    const url = `${BIRDEYE_API_BASE_URL}/v1/wallet/token_list?wallet=${validatedAddress}`;
    const response = await fetch(url, getStandardOptions());
    return handleResponse<WalletTokens>(response);
  } catch (error) {
    console.error('Error fetching wallet tokens:', error);
    throw error;
  }
}

/**
 * Get balance of a specific token in a wallet
 * @param walletAddress Wallet address
 * @param tokenAddress Token address
 * @returns Token balance information
 */
export async function getWalletTokenBalance(
  walletAddress: string, 
  tokenAddress: string
): Promise<any> {
  try {
    const validatedWallet = WalletAddressSchema.parse(walletAddress);
    const validatedToken = TokenAddressSchema.parse(tokenAddress);
    
    const url = `${BIRDEYE_API_BASE_URL}/v1/wallet/token_balance?wallet=${validatedWallet}&token_address=${validatedToken}`;
    const response = await fetch(url, getStandardOptions());
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching wallet token balance:', error);
    throw error;
  }
}

/**
 * Get transaction history for a wallet
 * @param walletAddress Wallet address
 * @param limit Number of transactions to return
 * @returns Transaction history
 */
export async function getWalletTransactions(
  walletAddress: string,
  limit: number = 100
): Promise<any> {
  try {
    const validatedWallet = WalletAddressSchema.parse(walletAddress);
    const url = `${BIRDEYE_API_BASE_URL}/v1/wallet/tx_list?wallet=${validatedWallet}&limit=${limit}`;
    const response = await fetch(url, getStandardOptions());
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    throw error;
  }
}

/**
 * Search for tokens and market data
 * @param searchTerm Term to search for (name, symbol, address)
 * @param searchBy Field to search by (name, symbol, address)
 * @param limit Number of results
 * @returns Search results
 */
export async function searchTokens(
  searchTerm: string,
  searchBy: 'symbol' | 'name' | 'address' = 'symbol',
  limit: number = 20
): Promise<any> {
  try {
    const url = `${BIRDEYE_API_BASE_URL}/defi/v3/search?chain=all&target=all&search_mode=exact&search_by=${searchBy}&sort_by=volume_24h_usd&sort_type=desc&offset=0&limit=${limit}`;
    const response = await fetch(url, getStandardOptions());
    return handleResponse(response);
  } catch (error) {
    console.error('Error searching tokens:', error);
    throw error;
  }
}

/**
 * Get detailed metadata for a token
 * @param tokenAddress Token address
 * @returns Token metadata
 */
export async function getTokenMetadata(tokenAddress: string): Promise<TokenMetadata> {
  try {
    const validatedAddress = TokenAddressSchema.parse(tokenAddress);
    // Using the single token metadata endpoint
    const url = `${BIRDEYE_API_BASE_URL}/defi/token_meta?address=${validatedAddress}`;
    const response = await fetch(url, getStandardOptions());
    return handleResponse<TokenMetadata>(response);
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    throw error;
  }
}
