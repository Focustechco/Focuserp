// API Route: POST /api/push/subscribe
// Receives and stores a push subscription in Supabase for cross-instance persistence
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lykwydydrctmjzcvugjd.supabase.co',
  'sb_publishable_LtPtjXysCTL1qZB6E0VuvQ_CsZbTvUs'
);

// Deterministic UUID for push subscriptions state row
const PUSH_SUBS_UUID = '00000000-0000-4000-b000-000000000001';

export const APIRoute = createAPIFileRoute('/api/push/subscribe')({
  POST: async ({ request }: { request: Request }) => {
    try {
      const body = await request.json();
      const { subscription, userId = 'default' } = body;

      if (!subscription || !subscription.endpoint) {
        return new Response(JSON.stringify({ error: 'Invalid subscription' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Load current subscriptions from Supabase
      const { data: existing } = await supabase
        .from('clients')
        .select('contact_email')
        .eq('id', PUSH_SUBS_UUID)
        .single();

      let subsMap: Record<string, any> = {};
      if (existing?.contact_email) {
        try {
          subsMap = JSON.parse(existing.contact_email);
        } catch (e) {
          subsMap = {};
        }
      }

      // Update or add this subscription
      subsMap[userId] = subscription;

      // Persist updated subscriptions in Supabase
      await supabase.from('clients').upsert({
        id: PUSH_SUBS_UUID,
        name: '__FOCUS_PUSH_SUBSCRIPTIONS__',
        status: 'inativo',
        contact_email: JSON.stringify(subsMap),
        updated_at: new Date().toISOString(),
      });

      console.log(`[Push] Subscription stored in Supabase for user: ${userId}`);

      return new Response(
        JSON.stringify({ success: true, message: 'Subscription registered' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error: any) {
      console.error('[Push] Error storing subscription:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store subscription', details: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },

  GET: async () => {
    try {
      const { data } = await supabase
        .from('clients')
        .select('contact_email')
        .eq('id', PUSH_SUBS_UUID)
        .single();

      let count = 0;
      if (data?.contact_email) {
        try {
          const subsMap = JSON.parse(data.contact_email);
          count = Object.keys(subsMap).length;
        } catch (e) {
          count = 0;
        }
      }

      return new Response(
        JSON.stringify({ subscriptionCount: count }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      return new Response(JSON.stringify({ subscriptionCount: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
});
