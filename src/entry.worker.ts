import { Rest } from 'ably';

export interface Env {
  ABLY_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/ably-token') {
      const apiKey = env.ABLY_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'ABLY_API_KEY environment variable is not set.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        const client = new Rest({ key: apiKey });
        const clientId = url.searchParams.get('clientId');
        const tokenParams: { ttl: number; clientId?: string } = { ttl: 1000 * 60 * 60 * 6 };
        if (clientId) {
          tokenParams.clientId = clientId;
        }
        const tokenRequestData = await client.auth.createTokenRequest(tokenParams);

        return new Response(JSON.stringify(tokenRequestData), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: (error as Error).message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fallback for any other unhandled route that reaches the Worker.
    return new Response('Not Found', { status: 404 });
  }
};
