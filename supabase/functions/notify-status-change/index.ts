import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StatusChangeRequest {
  ticketCode: string;
  fullName: string;
  email: string;
  oldStatus: string;
  newStatus: string;
}

const statusLabels: Record<string, string> = {
  new: "New — Under Review",
  in_progress: "In Progress",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketCode, fullName, email, oldStatus, newStatus }: StatusChangeRequest = await req.json();

    if (!ticketCode || !email || !newStatus) {
      throw new Error("Missing required fields");
    }

    const statusLabel = statusLabels[newStatus] || newStatus;
    const statusColor = newStatus === "resolved" || newStatus === "closed" ? "#00e676" : newStatus === "escalated" ? "#ef4444" : "#00bcd4";

    const result = await resend.emails.send({
      from: "Genxdual Cyber <onboarding@resend.dev>",
      to: [email],
      subject: `Status Update: ${ticketCode} — ${statusLabel}`,
      html: `
        <div style="font-family: 'Courier New', monospace; background: #0d1117; color: #e6e6e6; padding: 32px; border-radius: 12px;">
          <div style="border-bottom: 2px solid #00e676; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #00e676; margin: 0; font-size: 20px;">🛡️ Genxdual Cyber</h1>
            <p style="color: #888; margin: 4px 0 0 0; font-size: 13px;">Emergency Help Desk — Status Update</p>
          </div>
          
          <p>Dear ${fullName},</p>
          <p>The status of your incident report has been updated.</p>
          
          <div style="margin: 20px 0; padding: 16px; background: #161b22; border-radius: 8px; text-align: center;">
            <p style="color: #888; margin: 0 0 8px 0; font-size: 12px;">TICKET ID</p>
            <p style="color: #00e676; font-size: 22px; font-weight: bold; margin: 0 0 16px 0;">${ticketCode}</p>
            <p style="color: #888; margin: 0 0 4px 0; font-size: 12px;">NEW STATUS</p>
            <p style="margin: 0;"><span style="background: ${statusColor}20; color: ${statusColor}; padding: 4px 16px; border-radius: 6px; font-size: 14px; font-weight: bold;">${statusLabel}</span></p>
          </div>
          
          ${newStatus === "resolved" || newStatus === "closed" 
            ? `<p style="color: #22c55e;">✅ Your case has been ${newStatus}. If you need further assistance, please submit a new report.</p>` 
            : `<p>Our response team is actively working on your case. You will be notified of any further updates.</p>`
          }
          
          <p style="margin-top: 24px; color: #888; font-size: 12px;">
            All information is confidential. — Genxdual Cyber Response Team
          </p>
        </div>
      `,
    });

    console.log("Status change notification sent:", result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-status-change:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
