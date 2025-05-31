import { apiRequest } from "@/lib/queryClient";
import { getAuthHeader } from "@/lib/auth";

// Authentication API
export const authApi = {
  signUp: async (userData: { email: string; password: string }) => {
    const response = await apiRequest("POST", "/api/signup", userData);
    return await response.json();
  },

  signIn: async (credentials: { email: string; password: string }) => {
    const response = await apiRequest("POST", "/api/signin", credentials);
    return await response.json();
  },

  getCurrentUser: async () => {
    const response = await apiRequest("GET", "/api/auth/me");
    return await response.json();
  }
};

// Dive Sites API
export const diveSitesApi = {
  getAll: async () => {
    const response = await apiRequest("GET", "/api/dive-sites");
    return await response.json();
  },

  getRankings: async () => {
    const response = await apiRequest("GET", "/api/rankings");
    return await response.json();
  },

  getByRegion: async () => {
    const response = await apiRequest("GET", "/api/dive-sites/by-region");
    return await response.json();
  }
};

// Matchup API
export const matchupApi = {
  getRandomMatchup: async (winnerId?: number, winnerSide?: 'A' | 'B') => {
    const params = new URLSearchParams();
    if (winnerId) params.append('winnerId', winnerId.toString());
    if (winnerSide) params.append('winnerSide', winnerSide);
    
    const url = `/api/matchup${params.toString() ? '?' + params.toString() : ''}`;
    const response = await apiRequest("GET", url);
    return await response.json();
  }
};

// Voting API
export const votingApi = {
  castVote: async (voteData: { winnerId: number; loserId: number }) => {
    const response = await apiRequest("POST", "/api/vote", voteData, getAuthHeader());
    return await response.json();
  },

  getUserVotes: async () => {
    const response = await apiRequest("GET", "/api/my-votes", null, getAuthHeader());
    return await response.json();
  },

  getRecentActivity: async () => {
    const response = await apiRequest("GET", "/api/recent-activity");
    return await response.json();
  }
};