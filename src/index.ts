import { Hono } from "hono";
import type { Context, Next } from "hono";

export type Env = {
  AI: Ai;
  AI_DEMO_API_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

const requireApiKey = (c: Context, next: Next) => {
  const key = c.req.header("x-api-key");
  if (!key || key !== c.env.AI_DEMO_API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
};

app.post("/text-to-image", requireApiKey, async (c) => {
  let body;
  try {
    body = await c.req.parseBody();
  } catch (e) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body || typeof body.prompt !== "string") {
    return c.json({ error: "Missing prompt" }, 400);
  }

  try {
    const image = await c.env.AI.run("@cf/lykon/dreamshaper-8-lcm", {
      prompt: body.prompt,
      // optionally other params
    });
    return new Response(image, {
      headers: { "content-type": "image/jpg" },
    });
  } catch (e) {
    return c.json(
      { error: "AI generation failed", details: (e as Error).message },
      500
    );
  }
});

export default app;
