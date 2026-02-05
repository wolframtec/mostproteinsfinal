/**
 * Simple Router for Cloudflare Workers
 * Mimics Express-like routing for easy migration
 */

import { Env } from '../index';

export type Handler = (request: Request, env: Env, ctx: ExecutionContext, params?: Record<string, string>) => Promise<Response> | Response;

interface Route {
  method: string;
  path: string;
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];
  private middlewares: Handler[] = [];

  // Register middleware
  use(pathOrHandler: string | Handler, handler?: Router | Handler): void {
    if (typeof pathOrHandler === 'string' && handler) {
      // Mount sub-router at path
      if (handler instanceof Router) {
        const prefix = pathOrHandler;
        for (const route of handler.getRoutes()) {
          this.routes.push({
            method: route.method,
            path: prefix + route.path,
            handler: route.handler,
          });
        }
        // Add sub-router middlewares
        this.middlewares.push(...handler.getMiddlewares());
      } else {
        // Add middleware for specific path
        this.middlewares.push(async (req, env, ctx, params) => {
          const url = new URL(req.url);
          if (url.pathname.startsWith(pathOrHandler)) {
            return handler(req, env, ctx, params);
          }
          return new Response(null, { status: 404 }); // Continue to next
        });
      }
    } else if (typeof pathOrHandler === 'function') {
      // Global middleware
      this.middlewares.push(pathOrHandler);
    }
  }

  // HTTP methods
  get(path: string, handler: Handler): void {
    this.routes.push({ method: 'GET', path, handler });
  }

  post(path: string, handler: Handler): void {
    this.routes.push({ method: 'POST', path, handler });
  }

  put(path: string, handler: Handler): void {
    this.routes.push({ method: 'PUT', path, handler });
  }

  patch(path: string, handler: Handler): void {
    this.routes.push({ method: 'PATCH', path, handler });
  }

  delete(path: string, handler: Handler): void {
    this.routes.push({ method: 'DELETE', path, handler });
  }

  // Handle incoming request
  async handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // Find matching route
    for (const route of this.routes) {
      const match = this.matchPath(route.path, url.pathname);
      if (route.method === method && match) {
        // Run middlewares first
        for (const middleware of this.middlewares) {
          const result = await middleware(request, env, ctx, match.params);
          // If middleware returns a response with status >= 400, return it
          if (result instanceof Response && result.status >= 400) {
            return result;
          }
        }

        // Call route handler
        return await route.handler(request, env, ctx, match.params);
      }
    }

    // No route matched
    return new Response(
      JSON.stringify({ 
        error: 'Not Found',
        message: `No route found for ${method} ${url.pathname}` 
      }),
      { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Match path with parameters
  private matchPath(routePath: string, requestPath: string): { matched: boolean; params?: Record<string, string> } | null {
    // Handle exact match
    if (routePath === requestPath) {
      return { matched: true, params: {} };
    }

    // Handle parameterized routes like /orders/:id
    const routeParts = routePath.split('/');
    const requestParts = requestPath.split('/');

    if (routeParts.length !== requestParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        // This is a parameter
        const paramName = routeParts[i].slice(1);
        params[paramName] = decodeURIComponent(requestParts[i]);
      } else if (routeParts[i] !== requestParts[i]) {
        // No match
        return null;
      }
    }

    return { matched: true, params };
  }

  getRoutes(): Route[] {
    return this.routes;
  }

  getMiddlewares(): Handler[] {
    return this.middlewares;
  }
}
