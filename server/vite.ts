import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // For Vercel, serve from the built client files
  const distPath = path.resolve(process.cwd(), "dist");
  const publicPath = path.resolve(distPath, "public");

  // Check if the dist directory exists
  if (!fs.existsSync(distPath)) {
    console.warn('Dist directory not found, serving development files');
    return;
  }

  // Serve static files from dist/public
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    console.log('Serving static files from:', publicPath);
  } else {
    // Fallback to dist directory
    app.use(express.static(distPath));
    console.log('Serving static files from:', distPath);
  }

  // Serve index.html for all routes (SPA)
  app.use("*", (req, res) => {
    const indexPath = fs.existsSync(publicPath) 
      ? path.resolve(publicPath, "index.html")
      : path.resolve(distPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ 
        message: "Static files not found. Please run 'npm run build' first." 
      });
    }
  });
}
