import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

export function apiHandler(
  handler: (req: NextRequest, params?: any) => Promise<Response>
) {
  return async (req: NextRequest, context: { params: Promise<any> }) => {
    const resolvedParams = context.params ? await context.params : undefined;
    const requestId = crypto.randomUUID();
    try {
      const response = await handler(req, { params: resolvedParams });
      if (response && typeof response === 'object' && 'headers' in response) {
        try {
          response.headers.set('X-Request-Id', requestId);
        } catch {
          // response headers may be immutable in some edge cases
        }
      }
      return response;
    } catch (err: any) {
      logger.error('Unhandled API error', {
        requestId,
        path: req?.url,
        method: req?.method,
        error: err?.message,
        stack: err?.stack,
      });
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 }
      );
    }
  };
}
