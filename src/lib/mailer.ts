import { CONTACT_EMAIL } from "./contact";

/**
 * Envoi d'un courriel par l'API Resend (https://resend.com), sans SDK.
 * Sans RESEND_API_KEY, l'envoi est simplement ignoré : le message reste consultable dans le back-office.
 */
export async function sendMail(opts: { subject: string; text: string; replyTo?: string; to?: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const to = opts.to || process.env.CONTACT_TO || CONTACT_EMAIL;
  const from = process.env.CONTACT_FROM || "Formations ferroviaires <onboarding@resend.dev>";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: opts.subject, text: opts.text, reply_to: opts.replyTo }),
    });
    if (!r.ok) console.error("Resend :", r.status, await r.text());
    return r.ok;
  } catch (err) {
    console.error("Resend :", err);
    return false;
  }
}
