// Vercel Serverless Function — wraps the Express app
// This file is the entry point for all /api/* requests on Vercel.
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // @ts-ignore
  const app = (await import("../artifacts/api-server/dist/app.mjs")).default;
  // Vercel passes the request to Express
  return (app as any)(req, res);
}
