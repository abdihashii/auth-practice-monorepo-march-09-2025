// Third-party imports
import { Hono } from "hono";

// Local imports
import type { CustomEnv } from "@/types";

export const authRoutes = new Hono<CustomEnv>();
