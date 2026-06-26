/**
 * WhatsApp Business Cloud API Service
 * Uses Meta's Graph API v19 to send free-form text messages.
 *
 * Required environment variables:
 *   WHATSAPP_PHONE_NUMBER_ID  — the sender's Phone Number ID from Meta App
 *   WHATSAPP_ACCESS_TOKEN     — permanent System User access token
 */

const META_API_VERSION = "v19.0";
const META_API_BASE = "https://graph.facebook.com";

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Normalise a phone number to E.164 format.
 * Assumes Indian numbers (+91) when no country code is present.
 */
function normalisePhone(phone: string): string {
  // Strip all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) {
    return cleaned; // Already in E.164
  }

  if (cleaned.length === 10) {
    // Indian mobile — prepend +91
    return `+91${cleaned}`;
  }

  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned}`;
  }

  // Best-effort: add +
  return `+${cleaned}`;
}

/**
 * Send a free-form text message via WhatsApp Business Cloud API.
 *
 * NOTE: Free-form messages can only be sent within a 24-hour window after
 * the recipient last messaged your business number. For out-of-window
 * messages, use approved Template messages instead.
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return {
      success: false,
      error:
        "WhatsApp is not configured. Please set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in your .env file.",
    };
  }

  const recipient = normalisePhone(to);

  const url = `${META_API_BASE}/${META_API_VERSION}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "text",
    text: {
      preview_url: false,
      body,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      const errMsg =
        data?.error?.message ?? `Meta API error: ${response.status}`;
      return { success: false, error: errMsg };
    }

    const messageId: string | undefined =
      data?.messages?.[0]?.id ?? undefined;

    return { success: true, messageId };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message ?? "Unknown network error calling Meta API",
    };
  }
}
