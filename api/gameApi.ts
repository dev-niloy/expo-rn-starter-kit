import { baseApi } from "./baseApi";

interface AuthGuestResponse {
  success: boolean;
  user: {
    id: number;
    name: string;
    avatar: string | null;
    highScore: number;
    isGuest: boolean;
  };
}

interface SubmitScoreResponse {
  success: boolean;
  rank: number | string;
  highScore: number;
  isNewHighScore: boolean;
}

interface LeaderboardEntry {
  name: string;
  avatar: string | null;
  score: number;
  rank?: number;
}

interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
}

export const gameApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    guestLogin: builder.mutation<AuthGuestResponse, { name: string }>({
      query: (body) => ({
        url: "/auth/guest",
        method: "POST",
        body,
      }),
    }),
    submitScore: builder.mutation<
      SubmitScoreResponse,
      { userId: number; score: number }
    >({
      query: (body) => ({
        url: "/scores",
        method: "POST",
        body,
      }),
    }),
    getLeaderboard: builder.query<LeaderboardEntry[], void>({
      query: () => "/leaderboard",
      transformResponse: (response: LeaderboardResponse) =>
        response.leaderboard || [],
    }),
  }),
});

export const {
  useGuestLoginMutation,
  useSubmitScoreMutation,
  useGetLeaderboardQuery,
  useLazyGetLeaderboardQuery,
} = gameApi;
