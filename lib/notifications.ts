// Email notification stub.
// Wire up SMTP credentials in .env.local and implement sendEmail() to activate.
//
// Dependencies to add when implementing:
//   npm install nodemailer @types/nodemailer

import type { TrackedItem, SearchResult } from "@prisma/client";

/**
 * Send a notification email to a user about new listings.
 * TODO: Implement with nodemailer or Resend/SendGrid/etc.
 */
export async function sendNewMatchesEmail(
  userEmail: string,
  item: TrackedItem,
  newListings: SearchResult[]
): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.log(
      `[notifications stub] Would email ${userEmail} about ${newListings.length} new matches for "${item.title}"`
    );
    return;
  }

  // TODO: Implement with your email provider

  console.log(`[notifications] Email sending not yet configured.`);
}
