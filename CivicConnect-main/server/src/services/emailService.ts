import nodemailer, { type Transporter } from "nodemailer";
import type { ComplaintStatus } from "../models/Complaint";

type EmailPayload = {
  recipientEmail: string;
  subject: string;
  html: string;
};

/* ------------------------------------------------ */
/* EMAIL PROVIDER SELECTOR */
/* ------------------------------------------------ */

const getEmailProvider = () =>
  process.env.NODE_ENV === "production" ? "resend" : "mailtrap";

/* ------------------------------------------------ */
/* MAILTRAP SETUP */
/* ------------------------------------------------ */

let mailtrapTransporter: Transporter | null = null;

const getMailtrapTransporter = (): Transporter | null => {
  const { MAILTRAP_HOST, MAILTRAP_PORT, MAILTRAP_USER, MAILTRAP_PASS } =
    process.env;

  if (!MAILTRAP_HOST || !MAILTRAP_PORT || !MAILTRAP_USER || !MAILTRAP_PASS) {
    console.warn(
      "⚠️ Mailtrap SMTP email skipped because MAILTRAP env variables are missing."
    );
    return null;
  }

  if (!mailtrapTransporter) {
    console.log("📧 Initializing Mailtrap transporter...");

    mailtrapTransporter = nodemailer.createTransport({
      host: MAILTRAP_HOST,
      port: Number(MAILTRAP_PORT),
      secure: Number(MAILTRAP_PORT) === 465,
      auth: {
        user: MAILTRAP_USER,
        pass: MAILTRAP_PASS,
      },
    });
  }

  return mailtrapTransporter;
};

const sendWithMailtrapSmtp = async ({
  recipientEmail,
  subject,
  html,
}: EmailPayload): Promise<void> => {
  console.log("📧 Sending email using MAILTRAP...");
  console.log("Recipient:", recipientEmail);

  const transporter = getMailtrapTransporter();
  const senderEmail = process.env.MAILTRAP_SENDER_EMAIL;

  if (!transporter || !senderEmail) {
    console.warn(
      "⚠️ Mailtrap email skipped because transporter setup or sender email is missing."
    );
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: senderEmail,
      to: recipientEmail,
      subject,
      html,
    });

    console.log("✅ Mailtrap email sent successfully");

  } catch (error) {
    console.error("❌ Mailtrap email failed");
    console.error(error);
  }
};

/* ------------------------------------------------ */
/* RESEND EMAIL */
/* ------------------------------------------------ */

const sendWithResend = async ({
  recipientEmail,
  subject,
  html,
}: EmailPayload): Promise<void> => {
  console.log("📧 Sending email using RESEND...");
  console.log("Recipient:", recipientEmail);

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error("❌ RESEND ENV VARIABLES MISSING");
    console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
    console.log("RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL);
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [recipientEmail],
        subject,
        html,
      }),
    });

    const responseBody = await response.text();

    console.log("📨 Resend Response Status:", response.status);
    console.log("📨 Resend Response Body:", responseBody);

    if (!response.ok) {
      throw new Error(
        `Resend email failed with status ${response.status}: ${responseBody}`
      );
    }

    console.log("✅ Email sent successfully via Resend");
  } catch (error) {
    console.error("❌ RESEND EMAIL ERROR");
    console.error(error);
    throw error;
  }
};

/* ------------------------------------------------ */
/* EMAIL TEMPLATE */
/* ------------------------------------------------ */

const buildComplaintStatusEmail = ({
  complaintTitle,
  status,
  message,
}: {
  complaintTitle: string;
  status: ComplaintStatus;
  message: string;
}) => {
  return {
    subject: `Civic Connect | Complaint Status Update: ${status}`,
    html: `
      <div style="background:#f1f5f9;padding:30px 0;font-family:Arial,Helvetica,sans-serif;">
        <table align="center" width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          
          <tr>
            <td style="background:#1e3a8a;color:white;padding:18px 24px;">
              <h2 style="margin:0;font-size:20px;">Civic Connect Portal</h2>
              <p style="margin:4px 0 0;font-size:13px;color:#cbd5f5;">
                Official Citizen Complaint Management System
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 24px;color:#0f172a;">
              <h3 style="margin-top:0;color:#1e293b;">
                Complaint Status Update
              </h3>

              <p style="font-size:14px;color:#334155;">Dear Citizen,</p>

              <p style="font-size:14px;color:#334155;">
                The status of your complaint has been updated.
              </p>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:18px 0;">
                
                <p><strong>Complaint Title:</strong></p>

                <p style="color:#475569;">${complaintTitle}</p>

                <p><strong>Current Status:</strong></p>

                <p style="
                  display:inline-block;
                  margin-top:8px;
                  padding:6px 12px;
                  border-radius:4px;
                  font-size:13px;
                  font-weight:bold;
                  background:${
                    status === "Resolved"
                      ? "#dcfce7"
                      : status === "Rejected"
                      ? "#fee2e2"
                      : "#dbeafe"
                  };
                  color:${
                    status === "Resolved"
                      ? "#166534"
                      : status === "Rejected"
                      ? "#991b1b"
                      : "#1e40af"
                  };
                ">
                  ${status}
                </p>

                <p style="margin-top:16px;color:#475569;">
                  ${message}
                </p>
              </div>

              <p style="font-size:14px;color:#334155;">
                Please log in to Civic Connect to view further details.
              </p>

              <p style="margin-top:24px;font-size:14px;">
                Regards,<br/>
                <strong>Civic Connect Administration</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc;padding:16px 24px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">
                This is an automated message. Please do not reply.
              </p>

              <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} Civic Connect
              </p>
            </td>
          </tr>

        </table>
      </div>
    `,
  };
};

/* ------------------------------------------------ */
/* MAIN EMAIL FUNCTION */
/* ------------------------------------------------ */

export const sendComplaintStatusEmail = async ({
  recipientEmail,
  complaintTitle,
  status,
  message,
}: {
  recipientEmail: string;
  complaintTitle: string;
  status: ComplaintStatus;
  message: string;
}): Promise<void> => {
  if (!["In Progress", "Resolved", "Rejected"].includes(status)) {
    console.log("ℹ️ Email skipped because status does not require notification");
    return;
  }

  console.log("🚀 Starting complaint status email process");

  const emailContent = buildComplaintStatusEmail({
    complaintTitle,
    status,
    message,
  });

  const provider = getEmailProvider();

  console.log("📬 Selected Email Provider:", provider);

  try {
    if (provider === "resend") {
      await sendWithResend({
        recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      console.log("✅ Email sent via Resend");
      return;
    }

    await sendWithMailtrapSmtp({
      recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("✅ Email sent via Mailtrap");
  } catch (error) {
    console.error(
      `❌ Failed to send complaint status email using provider: ${provider}`
    );
    console.error(error);
  }
};