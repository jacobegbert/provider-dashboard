export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // AI
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  // Legacy — leave empty; features using these will fail gracefully if unset
  forgeApiUrl: "",
  forgeApiKey: "",
  // Google
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // Email & SMS
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  fromEmail: process.env.FROM_EMAIL ?? "notifications@blacklabelmedicine.com",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
};
