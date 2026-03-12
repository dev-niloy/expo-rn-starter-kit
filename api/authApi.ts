import { baseApi } from "./baseApi";

const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (args) => ({
        url: "/auth/login",
        method: "POST",
        body: args,
      }),
    }),
  }),
});

export const { useLoginMutation } = uploadApi;
export default uploadApi;
