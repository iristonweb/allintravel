import type { Express } from "express";
import type { Server } from "http";

export function log() {}

export async function setupVite(_app: Express, _server: Server): Promise<void> {}

export function serveStatic(_app: Express): void {}
