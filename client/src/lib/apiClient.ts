// API client that can work with both backend and mock service
import { mockApiService } from '../services/mockApiService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' || 
                    (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'));

class ApiClient {
  private async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    if (USE_MOCK_API) {
      return this.handleMockRequest(url, options);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Backend API unavailable, falling back to mock data');
      return this.handleMockRequest(url, options);
    }
  }

  private async handleMockRequest(url: string, options: RequestInit = {}): Promise<any> {
    const method = options.method || 'GET';
    
    // Parse URL and query parameters
    const [path, queryString] = url.split('?');
    const params = new URLSearchParams(queryString);

    switch (true) {
      case path === '/api/tokens' && method === 'GET':
        return mockApiService.getTokens();
      
      case path === '/api/trades' && method === 'GET':
        return mockApiService.getTrades();
      
      case path === '/api/trade/quote' && method === 'GET':
        return mockApiService.getTradeQuote(
          params.get('fromToken') || '',
          params.get('toToken') || '',
          params.get('amountIn') || '0'
        );
      
      case path === '/api/trade' && method === 'POST':
        const tradeData = JSON.parse(options.body as string);
        return mockApiService.executeTrade(tradeData);
      
      case path === '/api/upload' && method === 'POST':
        return mockApiService.uploadData(options.body as FormData);
      
      case path === '/api/irys/balance' && method === 'GET':
        return mockApiService.getIrysBalance();
      
      case path.startsWith('/api/tokens/creator/') && method === 'GET':
        const address = path.split('/').pop() || '';
        return mockApiService.getTokensByCreator(address);
      
      default:
        throw new Error(`Mock API: Unhandled request ${method} ${path}`);
    }
  }

  // Public API methods
  async get(url: string): Promise<any> {
    return this.makeRequest(url, { method: 'GET' });
  }

  async post(url: string, data: any): Promise<any> {
    if (data instanceof FormData) {
      return this.makeRequest(url, {
        method: 'POST',
        body: data,
        headers: {} // Let browser set Content-Type for FormData
      });
    }

    return this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(url: string, data: any): Promise<any> {
    return this.makeRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(url: string): Promise<any> {
    return this.makeRequest(url, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();