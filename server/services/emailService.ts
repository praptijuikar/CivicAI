import { Resend } from "resend";

// Resend instance will be lazily initialized or rely on process.env dynamically
const getResend = () => {
  return new Resend(process.env.RESEND_API_KEY || "re_dummy");
};

export interface ComplaintEmailData {
  email: string;
  userName: string;
  complaintId: string;
  issueType: string;
  location: string;
  description?: string;
  confidence?: number;
  submittedAt: Date | string;
}

export async function sendComplaintConfirmation(data: ComplaintEmailData) {
  try {
    const resend = getResend();
    
    // Check if real API key exists, otherwise mock
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('xxx')) {
      console.log("[MOCK EMAIL SENT] Issue Submitted Successfully -", data.complaintId);
      return { success: true, mock: true };
    }

    const submittedDate = new Date(data.submittedAt).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Civic Issue Portal <onboarding@resend.dev>",
      to: [data.email],
      subject: `Issue Submitted Successfully - ${data.complaintId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background:#f5f7fa; padding:30px;">
            <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:30px;">
              <h2 style="margin-top:0;">Issue Submitted Successfully</h2>
              <p>Hi ${data.userName},</p>
              <p>Thank you for reporting a civic issue. Your complaint has been successfully registered.</p>
              
              <div style="background:#f4f6f8; padding:20px; border-radius:8px; margin:20px 0;">
                <p><strong>Complaint ID:</strong> ${data.complaintId}</p>
                <p><strong>Issue Type:</strong> ${data.issueType}</p>
                <p><strong>Location:</strong> ${data.location}</p>
                ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ""}
                ${data.confidence ? `<p><strong>AI Verification:</strong> ${Math.round(data.confidence * 100)}%</p>` : ""}
                <p><strong>Status:</strong> Submitted</p>
                <p><strong>Submitted:</strong> ${submittedDate}</p>
              </div>

              <p>You can use your Complaint ID to track the status of this issue.</p>
              <p>We will notify you when there is an update regarding your complaint.</p>
              <br>
              <p>Regards,<br><strong>Civic Issue Reporting Team</strong></p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Complaint confirmation email sent:", result);
    return { success: true, result };
  } catch (error) {
    console.error("Failed to send complaint email:", error);
    return { success: false, error };
  }
}
