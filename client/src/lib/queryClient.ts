import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiClient } from "./apiClient";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  switch (method.toUpperCase()) {
    case 'GET':
      return apiClient.get(url);
    case 'POST':
      return apiClient.post(url, data);
    case 'PUT':
      return apiClient.put(url, data);
    case 'DELETE':
      return apiClient.delete(url);
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const url = queryKey.join("/") as string;
      return await apiClient.get(url);
    } catch (error: any) {
      if (unauthorizedBehavior === "returnNull" && error.message?.includes('401')) {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
