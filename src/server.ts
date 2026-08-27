import { fetchServerEntry } from "@tanstack/react-start/server";

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    return fetchServerEntry(request, env, ctx);
  },
};
