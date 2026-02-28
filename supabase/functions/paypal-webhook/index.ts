import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as crypto from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // CORSプリフライト要求への対応
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // PayPalからのWebhookボディを取得
    const bodyText = await req.text();
    const event = JSON.parse(bodyText);

    console.log("Received PayPal Webhook:", event.event_type);

    // *本来はここでPayPal SDK/APIを用いたSignature検証(Webhook Verification)を行いますが、
    // 本実装のデモ用としてスキップするか、簡略化してService Roleでの書き込みのみを実装します。

    // Supabase Service Role クライアントの初期化 (Edge Functionには環境変数が自動で注入されます)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // どの種類のレポートやサブスクリプションが購入されたかの情報を webhook custom_id などから取得する想定
    const customIdPayload = event.resource?.custom_id || event.resource?.custom;

    // イベント種別ごとの処理
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      // 単発決済 (買い切りレポート用)
      if (customIdPayload) {
        let meta;
        try {
          meta = JSON.parse(customIdPayload);
        } catch (e) {
          console.error("Invalid custom_id JSON:", customIdPayload);
          throw new Error("Invalid custom payload");
        }

        const { company_id, manager_id, report_type } = meta;
        const transactionId = event.resource.id;
        const amountStr = event.resource.amount?.value;

        // 重複チェック
        const { data: existing } = await supabaseClient
          .from("report_purchases")
          .select("id")
          .eq("paypal_transaction_id", transactionId)
          .single();

        if (!existing) {
          const { error: insertError } = await supabaseClient
            .from("report_purchases")
            .insert({
              company_id: company_id,
              manager_id: manager_id,
              report_type: report_type,
              paypal_transaction_id: transactionId,
              amount: parseFloat(amountStr || "0"),
            });

          if (insertError) throw insertError;
          console.log(`Report purchase unlocked for company ${company_id}, report: ${report_type}`);
        }
      }
    }
    else if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED" || event.event_type === "BILLING.SUBSCRIPTION.UPDATED") {
      // サブスクリプション決済
      const subscriptionId = event.resource.id;
      const customId = event.resource.custom_id || event.resource.custom; // 会社IDを持たせている想定

      let companyId = customId;
      if (customId && customId.startsWith("{")) {
        // JSONの場合
        try {
          companyId = JSON.parse(customId).company_id;
        } catch (e) { }
      }

      if (companyId) {
        // Upsert 処理
        const { data: existingSub } = await supabaseClient
          .from("subscriptions")
          .select("id")
          .eq("company_id", companyId)
          .single();

        if (existingSub) {
          await supabaseClient
            .from("subscriptions")
            .update({
              paypal_subscription_id: subscriptionId,
              status: "active",
              updated_at: new Date().toISOString()
            })
            .eq("id", existingSub.id);
        } else {
          await supabaseClient
            .from("subscriptions")
            .insert({
              company_id: companyId,
              paypal_subscription_id: subscriptionId,
              status: "active",
            });
        }
        console.log(`Subscription activated for company ${companyId}`);
      }
    }
    else if (event.event_type === "BILLING.SUBSCRIPTION.CANCELLED" || event.event_type === "BILLING.SUBSCRIPTION.SUSPENDED") {
      const subscriptionId = event.resource.id;
      // サブスクをキャンセル状態にする
      await supabaseClient
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("paypal_subscription_id", subscriptionId);

      console.log(`Subscription canceled: ${subscriptionId}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
