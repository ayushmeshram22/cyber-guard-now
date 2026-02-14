import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotifyRequest {
  ticketCode: string;
  fullName: string;
  issueType: string;
  priority: string;
  email?: string;
  phone?: string;
  description: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: NotifyRequest = await req.json();
    const { ticketCode, fullName, issueType, priority, email, description } = body;

    if (!ticketCode || !fullName || !issueType) {
      throw new Error("Missing required fields");
    }

    const priorityColor = priority === "high" ? "#ef4444" : priority === "medium" ? "#eab308" : "#22c55e";
    const priorityLabel = priority.toUpperCase();

    // Send admin notification email
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "admin@genxdualcyber.com";
    
    const adminEmailResult = await resend.emails.send({
      from: "Genxdual Cyber <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🚨 [${priorityLabel}] New Incident: ${ticketCode} - ${issueType.replace("_", " ")}`,
      html: `
        <div style="font-family: 'Courier New', monospace; background: #0d1117; color: #e6e6e6; padding: 32px; border-radius: 12px;">
          <div style="border-bottom: 2px solid #00e676; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #00e676; margin: 0; font-size: 20px;">🛡️ Genxdual Cyber · Incident Alert</h1>
          </div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #888;">Ticket ID</td>
              <td style="padding: 8px 0; color: #00e676; font-weight: bold;">${ticketCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Reporter</td>
              <td style="padding: 8px 0;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Issue Type</td>
              <td style="padding: 8px 0;">${issueType.replace("_", " ")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Priority</td>
              <td style="padding: 8px 0;"><span style="background: ${priorityColor}20; color: ${priorityColor}; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;">${priorityLabel}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Contact Email</td>
              <td style="padding: 8px 0;">${email || "Not provided"}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 16px; background: #161b22; border-radius: 8px; border-left: 3px solid #00e676;">
            <p style="color: #888; margin: 0 0 8px 0; font-size: 12px;">INCIDENT DESCRIPTION</p>
            <p style="margin: 0; line-height: 1.6;">${description}</p>
          </div>
          
          <p style="margin-top: 24px; color: #888; font-size: 12px;">
            Log in to the Admin Dashboard to review and respond to this incident.
          </p>
        </div>
      `,
    });

    console.log("Admin notification sent:", adminEmailResult);

    // If user provided email and consented, send them a confirmation
    let userEmailResult = null;
    if (email) {
      userEmailResult = await resend.emails.send({
        from: "Genxdual Cyber <onboarding@resend.dev>",
        to: [email],
        subject: `Your Incident Report ${ticketCode} - Genxdual Cyber`,
        html: `
          <div style="font-family: 'Courier New', monospace; background: #0d1117; color: #e6e6e6; padding: 32px; border-radius: 12px;">
            <div style="border-bottom: 2px solid #00e676; padding-bottom: 16px; margin-bottom: 24px;">
              <h1 style="color: #00e676; margin: 0; font-size: 20px;">🛡️ Genxdual Cyber</h1>
              <p style="color: #888; margin: 4px 0 0 0; font-size: 13px;">Emergency Help Desk</p>
            </div>
            
            <p>Dear ${fullName},</p>
            <p>Your cyber incident report has been received and is being reviewed by our response team.</p>
            
            <div style="margin: 20px 0; padding: 16px; background: #161b22; border-radius: 8px; text-align: center;">
              <p style="color: #888; margin: 0 0 8px 0; font-size: 12px;">YOUR TICKET ID</p>
              <p style="color: #00e676; font-size: 24px; font-weight: bold; margin: 0;">${ticketCode}</p>
            </div>
            
            <p>Please keep this ticket ID for your reference. You will be contacted shortly.</p>
            
            <div style="margin-top: 20px; padding: 12px; background: #332800; border-radius: 8px; border-left: 3px solid #eab308;">
              <p style="margin: 0; font-size: 13px; color: #eab308;">⚠️ If the issue is urgent, avoid interacting with the suspicious source.</p>
            </div>
            
            <p style="margin-top: 24px; color: #888; font-size: 12px;">
              All information is confidential. — Genxdual Cyber Response Team
            </p>
          </div>
        `,
      });

      console.log("User confirmation sent:", userEmailResult);
    }

    return new Response(
      JSON.stringify({ success: true, adminEmail: adminEmailResult, userEmail: userEmailResult }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-incident:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
