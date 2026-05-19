import { Rest } from 'ably';

interface Env {
  ABLY_API_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.ABLY_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ABLY_API_KEY environment variable is not set.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const client = new Rest({ key: apiKey });
    const tokenRequestData = await client.auth.createTokenRequest({ttl: 1000 * 60 * 60 * 6});
    
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
};
