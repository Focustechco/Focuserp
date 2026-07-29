// API Route: GET /api/push/vapid-public-key
// Returns the VAPID public key for client-side push subscription setup
import { createAPIFileRoute } from '@tanstack/react-start/api';

const VAPID_PUBLIC_KEY = 'BEweG7jjNfn6TCYk3V68sAjeXapH31Qlcy1DUhmzvB_TV5cUebOrWHlR7QI81BpNb6ivphx-z8pjb906bq1f8tA';

export const APIRoute = createAPIFileRoute('/api/push/vapid-public-key')({
  GET: async () => {
    return new Response(
      JSON.stringify({ publicKey: VAPID_PUBLIC_KEY }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400',
        },
      }
    );
  },
});
