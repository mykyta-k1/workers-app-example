import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";

export type Env = {
  AI: Ai;
  AI_DEMO_API_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

const requireApiKey: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const key = c.req.header("x-api-key");
  if (!key || key !== c.env.AI_DEMO_API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
};

app.post("/text-to-image", requireApiKey, async (c) => {
  let body: { prompt?: string };

  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body?.prompt || typeof body.prompt !== "string") {
    return c.json({ error: "Missing prompt" }, 400);
  }

  try {
    const image = await c.env.AI.run("@cf/lykon/dreamshaper-8-lcm", {
      prompt: body.prompt,
    });

    return new Response(image as ReadableStream | Uint8Array, {
      headers: {
        "content-type": "image/png",
      },
    });
  } catch (e) {
    return c.json(
      { error: "AI generation failed", details: (e as Error).message },
      500
    );
  }
});

export default app;
