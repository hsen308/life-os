import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:hussein@lifeos.local";

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // Service role client bypasses RLS for scheduled background delivery
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const nowUtc = new Date().toISOString();

    // 1. Fetch pending notifications due for delivery (up to 50 items)
    const { data: pendingNotifications, error: fetchErr } = await supabase
      .from("scheduled_notifications")
      .select("*")
      .is("sent_at", null)
      .is("cancelled_at", null)
      .lte("send_at", nowUtc)
      .order("send_at", { ascending: true })
      .limit(50);

    if (fetchErr) throw fetchErr;

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(JSON.stringify({ message: "No notifications due" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const notif of pendingNotifications) {
      // 2. Quiet hours enforcement (23:00 - 07:00), except focus timer alerts
      if (notif.type !== "focus_timer") {
        const userTimezone = notif.timezone || "Asia/Beirut";
        const localHour = parseInt(
          new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            hour12: false,
            timeZone: userTimezone,
          }).format(new Date()),
          10
        );

        if (localHour >= 23 || localHour < 7) {
          // Delay processing until 07:00
          continue;
        }

        // 3. Daily Cap (max 4 scheduled alerts per day, excluding active focus timers)
        const todayStartLocal = new Date();
        todayStartLocal.setHours(0, 0, 0, 0);

        const { count: sentTodayCount } = await supabase
          .from("scheduled_notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", notif.user_id)
          .neq("type", "focus_timer")
          .not("sent_at", "is", null)
          .gte("sent_at", todayStartLocal.toISOString());

        if ((sentTodayCount || 0) >= 4) {
          await supabase
            .from("scheduled_notifications")
            .update({ cancelled_at: new Date().toISOString() })
            .eq("id", notif.id);
          continue;
        }
      }

      // 4. Fetch User's Push Subscriptions
      const { data: subs, error: subErr } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", notif.user_id);

      if (subErr || !subs || subs.length === 0) {
        continue;
      }

      // 5. Build Push Payload
      const payload = JSON.stringify({
        title: notif.title,
        body: notif.body,
        url: notif.url || "/",
        actions: notif.actions || [],
        data: {
          id: notif.id,
          type: notif.type,
          url: notif.url || "/",
        },
      });

      // 6. Deliver to All Registered Subscriptions for this User
      let sentSuccess = false;
      for (const sub of subs) {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          sentSuccess = true;
        } catch (err: any) {
          // Auto-delete stale / expired subscriptions (HTTP 410 Gone or 404 Not Found)
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }

      // 7. Mark as Sent
      if (sentSuccess) {
        await supabase
          .from("scheduled_notifications")
          .update({ sent_at: new Date().toISOString() })
          .eq("id", notif.id);
        results.push({ id: notif.id, status: "sent" });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
