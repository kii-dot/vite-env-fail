import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { appRouter } from "./trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import express from "express";
import { renderPage } from "vike/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";
const root = __dirname;

startServer();

async function startServer() {
  const app = express();

  if (isProduction) {
    app.use(express.static(`${root}/dist/client`));
  } else {
    // Instantiate Vite's development server and integrate its middleware to our server.
    // ⚠️ We should instantiate it *only* in development. (It isn't needed in production
    // and would unnecessarily bloat our server in production.)
    const vite = await import("vite");
    const viteDevMiddleware = (
      await vite.createServer({
        root,
        server: { middlewareMode: true },
      })
    ).middlewares;
    app.use(viteDevMiddleware);
  }

  app.use(
    "/api/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext({ req, res }: trpcExpress.CreateExpressContextOptions) {
        return { req, res };
      },
    }),
  );

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/
  app.all("*", async (req, res, next) => {
    const pageContextInit = { urlOriginal: req.originalUrl };
    const pageContext = await renderPage(pageContextInit);
    if (pageContext.httpResponse === null) return next();

    const { statusCode, contentType } = pageContext.httpResponse;
    res.status(statusCode).type(contentType);
    pageContext.httpResponse.pipe(res);
  });

  app.listen(process.env.PORT ? parseInt(process.env.PORT) : 3000, () => {
    console.log("Server listening on http://localhost:3000");
  });
}
