import { createApi } from '@reduxjs/toolkit/query/react';
import { SearchResult, DetailResult } from './config';

const baseQuery = async (args: any) => {
  const response = await fetch(args.url, {
    method: args.method,
    body: args.body,
    headers: args.headers,
  });
  return response.json();
};

export const searchApi = createApi({
  reducerPath: 'searchApi',
  baseQuery,
  tagTypes: ['Records', 'Detail'],
  endpoints: (builder) => ({
    getAllRecords: builder.query<SearchResult[], void>({
      query: () => '/cansettings/all',
      providesTags: ['Records'],
    }),
    getRecordDetails: builder.query<DetailResult, string>({
      query: (id: string | number | boolean) => `/cansettings/${encodeURIComponent(id)}`,
      providesTags: ['Detail'],
    }),
  }),
});

export const {
  useGetAllRecordsQuery,
  useGetRecordDetailsQuery,
} = searchApi;