// Vercel Serverless Function — wraps the Express app
// This file is the entry point for all /api/* requests on Vercel.
import type { VercelRequest, VercelResponse } from "@vercel/node";
// @ts-ignore
import app from "../artifacts/api-server/dist/app.mjs";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel passes the request to Express
  return (app as any)(req, res);
}
