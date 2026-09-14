import { useQuery } from "@tanstack/react-query";

import { fetchPostDetail, fetchPostsFeed } from "../lib/client";

export function usePostsFeed() {
  return useQuery({
    queryKey: ["posts", "feed"],
    queryFn: () => fetchPostsFeed(),
  });
}

export function usePostDetail(slug: string) {
  return useQuery({
    queryKey: ["posts", "detail", slug],
    queryFn: () => fetchPostDetail(slug),
    enabled: Boolean(slug),
  });
}
