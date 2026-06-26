/**
 * Mailercloud Email API v2.0 Service
 *
 * Required environment variables:
 *   MAILERCLOUD_API_KEY       — Your Mailercloud API Key
 *   MAILERCLOUD_SENDER_EMAIL  — Your verified sender email address in Mailercloud
 *   MAILERCLOUD_SENDER_NAME   — Optional sender name (defaults to "FirstCry Intellitots Admissions")
 */

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmailMessage(
  to: string,
  subject: string,
  htmlContent: string
): Promise<EmailSendResult> {
  const apiKey = process.env.MAILERCLOUD_API_KEY;
  const senderEmail = process.env.MAILERCLOUD_SENDER_EMAIL;
  const senderName = process.env.MAILERCLOUD_SENDER_NAME || "FirstCry Intellitots Admissions";

  if (!apiKey || !senderEmail) {
    return {
      success: false,
      error: "Mailercloud Email API is not fully configured. Please set MAILERCLOUD_API_KEY and MAILERCLOUD_SENDER_EMAIL in your .env file.",
    };
  }

  // The base host is https://email-api.mailercloud.com
  // The path we verified from Stoplight is /v2/email/send
  const url = "https://email-api.mailercloud.com/v2/email/send";

  // Build a highly robust payload with standard & alternative field names
  // so it will successfully resolve under any variation of the schema.
  const payload = {
    // Standard properties
    from: {
      email: senderEmail,
      name: senderName,
    },
    to: [
      {
        email: to,
      },
    ],
    subject: subject,
    html: htmlContent,

    // Aliases & alternative property names for Mailercloud v2
    sender: {
      email: senderEmail,
      name: senderName,
    },
    recipients: [
      {
        email: to,
      },
    ],
    content: htmlContent,
    body: htmlContent,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": apiKey, // Auth token header from Stoplight settings
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Check if the response contains content
    const text = await response.text();
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const errMsg =
        data?.error?.message ||
        data?.message ||
        `Mailercloud API error: ${response.status}`;
      return { success: false, error: errMsg };
    }

    const messageId = data?.message_id || data?.id || undefined;
    return { success: true, messageId };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message ?? "Unknown network error calling Mailercloud API",
    };
  }
}
