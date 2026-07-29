// API Route: POST /api/push/send
// Sends a push notification to all subscribed clients (loads subscriptions from Supabase)
import { createAPIFileRoute } from '@tanstack/react-start/api';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lykwydydrctmjzcvugjd.supabase.co',
  'sb_publishable_LtPtjXysCTL1qZB6E0VuvQ_CsZbTvUs'
);

// Deterministic UUID for push subscriptions state row (same as subscribe.ts)
const PUSH_SUBS_UUID = '00000000-0000-4000-b000-000000000001';

// VAPID Keys — generated for Focus ERP
const VAPID_PUBLIC_KEY = 'BEweG7jjNfn6TCYk3V68sAjeXapH31Qlcy1DUhmzvB_TV5cUebOrWHlR7QI81BpNb6ivphx-z8pjb906bq1f8tA';
const VAPID_PRIVATE_KEY = 'NThTl8fP9BAsO0WPvFPvHzAEan5aU2-QXqtqH6rN0bE';

webpush.setVapidDetails(
  'mailto:contato@focustecnologia.com.br',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export const APIRoute = createAPIFileRoute('/api/push/send')({
  POST: async ({ request }: { request: Request }) => {
    try {
      const body = await request.json();
      const { title, body: msgBody, url = '/', tag, userId } = body;

      if (!title) {
        return new Response(JSON.stringify({ error: 'Title is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Load subscriptions from Supabase (persisted across all serverless instances)
      const { data: stateRow } = await supabase
        .from('clients')
        .select('contact_email')
        .eq('id', PUSH_SUBS_UUID)
        .single();

      let subsMap: Record<string, any> = {};
      if (stateRow?.contact_email) {
        try {
          subsMap = JSON.parse(stateRow.contact_email);
        } catch (e) {
          subsMap = {};
        }
      }

      if (Object.keys(subsMap).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No subscriptions found. User must enable push notifications first.' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const payload = JSON.stringify({
        title,
        body: msgBody,
        url,
        tag: tag || `focus-${Date.now()}`,
        requireInteraction: true, // Keep visible on locked screen
      });

      const results: { userId: string; success: boolean; error?: string }[] = [];

      // Send to specific user or ALL subscribed users (Desktop → ALL mobile devices)
      const targets = userId
        ? (subsMap[userId] ? [[userId, subsMap[userId]]] : [])
        : Object.entries(subsMap);

      for (const [uid, subscription] of targets) {
        try {
          await webpush.sendNotification(subscription as any, payload);
          results.push({ userId: uid, success: true });
          console.log(`[Push] ✅ Sent to user: ${uid}`);
        } catch (err: any) {
          console.error(`[Push] ❌ Failed to send to user ${uid}:`, err.message);
          results.push({ userId: uid, success: false, error: err.message });

          // Remove expired/invalid subscriptions from Supabase
          if (err.statusCode === 404 || err.statusCode === 410) {
            delete subsMap[uid];
            await supabase.from('clients').upsert({
              id: PUSH_SUBS_UUID,
              name: '__FOCUS_PUSH_SUBSCRIPTIONS__',
              status: 'inativo',
              contact_email: JSON.stringify(subsMap),
              updated_at: new Date().toISOString(),
            });
          }
        }
      }

      const successCount = results.filter((r) => r.success).length;
      return new Response(
        JSON.stringify({
          success: true,
          sent: successCount,
          total: results.length,
          results,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error: any) {
      console.error('[Push] Error sending notification:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send notification', details: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
});
