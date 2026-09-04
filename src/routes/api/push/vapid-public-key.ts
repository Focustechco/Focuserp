// API Route: GET /api/push/vapid-public-key
// Returns the VAPID public key for client-side push subscription setup
import { createAPIFileRoute } from '@tanstack/react-start/api';

const VAPID_PUBLIC_KEY = 'BL5RHwVE0bhKAmQG_I4tXCXdAGBT_xCUNoN7jG-Y-fpmQKvnyP2Kko7ugl9gNZ8-yjahCSgeRHPkV9zHtBdqaLA';

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
