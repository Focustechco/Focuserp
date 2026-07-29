/**
 * Type declarations for @tanstack/react-start/api
 * Provides createAPIFileRoute for API route files
 */
declare module '@tanstack/react-start/api' {
  export function createAPIFileRoute(
    path: string
  ): (handlers: {
    GET?: (ctx: { request: Request }) => Response | Promise<Response>;
    POST?: (ctx: { request: Request }) => Response | Promise<Response>;
    PUT?: (ctx: { request: Request }) => Response | Promise<Response>;
    PATCH?: (ctx: { request: Request }) => Response | Promise<Response>;
    DELETE?: (ctx: { request: Request }) => Response | Promise<Response>;
  }) => void;
}
