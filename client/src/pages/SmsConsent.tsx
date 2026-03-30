import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  MessageSquare,
  Shield,
  Bell,
  UserCheck,
  CheckCircle2,
  Phone,
  FileText,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Public SMS Consent & Opt-In Disclosure page.
 * Required for Twilio toll-free verification (Error 30513 compliant).
 * Accessible at /sms-consent (no auth required).
 *
 * Key compliance features:
 * - Visible opt-in form with unchecked-by-default checkbox
 * - Clear voluntary consent language (not bundled with service)
 * - All required TCPA/CTIA disclosures
 * - Message frequency, data rates, opt-out instructions
 * - Links to Privacy Policy and Terms of Service
 * - Explicit statement that opt-in data is not shared with third parties
 */
export default function SmsConsent() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (consentChecked && phoneNumber.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/main" className="text-gold hover:text-gold-light transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gold flex items-center justify-center">
              <span className="text-white font-bold text-sm">BL</span>
            </div>
            <span className="font-semibold text-foreground">Black Label Medicine</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
          {/* Title section */}
          <div className="bg-[oklch(0.75_0.08_85)]/5 border-b border-border/30 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-6 h-6 text-[oklch(0.75_0.08_85)]" />
              <h1 className="text-2xl font-bold text-foreground">
                SMS Text Message Consent
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Last updated: March 8, 2026
            </p>
          </div>

          <div className="px-6 py-8 sm:px-8 space-y-8 text-muted-foreground leading-relaxed">

            {/* ========== OPT-IN FORM (Visible consent collection mechanism) ========== */}
            <section className="bg-[oklch(0.75_0.08_85)]/5 rounded-xl p-6 border-2 border-[oklch(0.75_0.08_85)]/20">
              <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <Phone className="w-5 h-5 text-[oklch(0.75_0.08_85)]" />
                Opt-In to Receive SMS Messages
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                By completing this form, you are voluntarily choosing to receive SMS text messages
                from Black Label Medicine. <strong className="text-foreground">Consent is not required to purchase any goods
                or services or to receive care from Black Label Medicine.</strong> You may choose not to
                opt in and still receive all medical services.
              </p>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Phone number input */}
                  <div>
                    <label htmlFor="sms-phone" className="block text-sm font-medium text-foreground mb-1">
                      Mobile Phone Number
                    </label>
                    <input
                      id="sms-phone"
                      type="tel"
                      placeholder="(555) 555-1234"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.75_0.08_85)]/50 focus:border-[oklch(0.75_0.08_85)]"
                    />
                  </div>

                  {/* Consent checkbox — MUST be unchecked by default per Twilio requirements */}
                  <div className="flex items-start gap-3">
                    <input
                      id="sms-consent"
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-border text-[oklch(0.75_0.08_85)] focus:ring-[oklch(0.75_0.08_85)] accent-[oklch(0.75_0.08_85)] shrink-0"
                    />
                    <label htmlFor="sms-consent" className="text-sm text-foreground leading-relaxed cursor-pointer">
                      I voluntarily agree to receive SMS text messages from Black Label Medicine
                      at the mobile phone number provided above. I understand that:
                      <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside ml-1">
                        <li>Messages may include appointment reminders, care notifications, and portal alerts</li>
                        <li>Message frequency varies (approximately 1–10 messages per month)</li>
                        <li>Message and data rates may apply</li>
                        <li>I can reply <strong className="text-foreground">STOP</strong> at any time to opt out</li>
                        <li>I can reply <strong className="text-foreground">HELP</strong> for assistance</li>
                        <li>Consent is not a condition of purchasing any goods or services</li>
                      </ul>
                    </label>
                  </div>

                  {/* Required disclosure links */}
                  <p className="text-xs text-muted-foreground">
                    By opting in, you agree to our{" "}
                    <Link href="/privacy-policy" className="text-[oklch(0.75_0.08_85)] underline hover:text-[oklch(0.80_0.08_85)]">
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link href="/terms" className="text-[oklch(0.75_0.08_85)] underline hover:text-[oklch(0.80_0.08_85)]">
                      Terms of Service
                    </Link>
                    . Your mobile phone number and SMS opt-in data will not be shared with or sold
                    to any third parties or affiliates for marketing or promotional purposes.
                  </p>

                  <Button
                    type="submit"
                    disabled={!consentChecked || !phoneNumber.trim()}
                    className="w-full bg-gold hover:bg-gold-dark text-white font-medium py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    I Agree — Opt In to SMS Messages
                  </Button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">You're Opted In</h3>
                  <p className="text-sm text-muted-foreground">
                    You have successfully opted in to receive SMS messages from Black Label Medicine
                    at <strong className="text-foreground">{phoneNumber}</strong>. You can opt out at any time
                    by replying <strong className="text-foreground">STOP</strong> to any message.
                  </p>
                </div>
              )}
            </section>

            {/* ========== PROGRAM DESCRIPTION ========== */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[oklch(0.75_0.08_85)]" />
                About Our SMS Program
              </h2>
              <p>
                Black Label Medicine ("we," "us," or "our") is a concierge medicine practice that
                offers an optional SMS text messaging program to help patients stay informed about
                their care. This program is entirely voluntary and is not required to receive any
                medical services from our practice.
              </p>
            </section>

            {/* ========== TYPES OF MESSAGES ========== */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Bell className="w-5 h-5 text-[oklch(0.75_0.08_85)]" />
                Types of Messages You May Receive
              </h2>
              <p className="mb-3">
                If you opt in, you may receive the following types of SMS messages from Black Label Medicine:
              </p>
              <ul className="space-y-2 ml-1">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span><strong className="text-foreground">Appointment Reminders</strong> — Notifications about upcoming appointments, including date, time, and type of visit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span><strong className="text-foreground">Secure Message Alerts</strong> — Notifications when your provider sends you a new message through the patient portal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span><strong className="text-foreground">Protocol Updates</strong> — Alerts when a care protocol is assigned to you or updated by your provider.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span><strong className="text-foreground">Portal Invitations</strong> — One-time invitation to join the Black Label Medicine patient portal.</span>
                </li>
              </ul>
              <p className="mt-3 text-sm">
                We do not send marketing, promotional, or advertising messages. All messages are
                related to your healthcare and care coordination with Black Label Medicine.
              </p>
            </section>

            {/* ========== HOW CONSENT IS COLLECTED ========== */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[oklch(0.75_0.08_85)]" />
                How Consent Is Collected
              </h2>
              <p className="mb-3">
                Consent to receive SMS messages from Black Label Medicine is collected through the
                following voluntary opt-in methods. In every case, opting in is a separate, distinct
                action — it is never required as a condition of receiving care or using our services.
              </p>
              <ul className="space-y-2 ml-1">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span><strong className="text-foreground">This Web Form</strong> — By completing the opt-in form above on this page, you voluntarily consent to receive SMS messages.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span><strong className="text-foreground">Patient Portal</strong> — When you enter or update your phone number in your patient profile settings and check the SMS consent box.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span><strong className="text-foreground">Patient Intake Form</strong> — During onboarding, you may optionally provide your phone number and separately consent to SMS notifications.</span>
                </li>
              </ul>
              <p className="mt-3 font-medium text-foreground text-sm">
                In all cases, the SMS consent checkbox is unchecked by default and must be actively
                selected by you. Providing your phone number alone does not constitute consent to
                receive SMS messages.
              </p>
            </section>

            {/* ========== MESSAGE FREQUENCY & CHARGES ========== */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Message Frequency & Charges
              </h2>
              <p>
                Message frequency varies based on your care plan and appointment schedule. You may
                receive approximately <strong className="text-foreground">1 to 10 messages per month</strong>.{" "}
                <strong className="text-foreground">Message and data rates may apply</strong> depending on your
                mobile carrier and plan. Black Label Medicine does not charge for SMS messages, but
                standard carrier messaging and data rates may apply. Contact your wireless carrier
                for details about your messaging plan.
              </p>
            </section>

            {/* ========== OPT-OUT ========== */}
            <section className="bg-[oklch(0.75_0.08_85)]/5 rounded-lg p-5 border border-[oklch(0.75_0.08_85)]/15">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                How to Opt Out
              </h2>
              <p className="mb-3">
                You may opt out of receiving SMS messages at any time. Opting out will not affect
                your ability to receive care from Black Label Medicine or use the patient portal.
              </p>
              <ul className="space-y-2 ml-1">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span>Reply <strong className="text-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">STOP</strong> to any message you receive from us to immediately stop all SMS messages.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span>Update your notification preferences in the patient portal under <strong className="text-foreground">Profile → Notifications</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span>Contact us directly at <strong className="text-foreground">jacob@blacklabelmedicine.com</strong> and request to be removed from SMS notifications.</span>
                </li>
              </ul>
              <p className="mt-3 text-sm">
                After opting out, you will receive one final confirmation message confirming your
                removal. You will no longer receive SMS notifications, but you may still receive
                communications through other channels (email, patient portal messages).
              </p>
            </section>

            {/* ========== HELP ========== */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Need Help?
              </h2>
              <p>
                If you have questions about our SMS messaging program, reply{" "}
                <strong className="font-mono text-foreground bg-muted/50 px-1.5 py-0.5 rounded">HELP</strong>{" "}
                to any message from Black Label Medicine. You can also contact us directly:
              </p>
              <div className="bg-muted/30 rounded-lg p-4 mt-3">
                <p className="font-medium text-foreground">Black Label Medicine</p>
                <p className="text-sm">Email: jacob@blacklabelmedicine.com</p>
                <p className="text-sm">Website: www.blacklabelmedicine.com</p>
              </div>
            </section>

            {/* ========== PRIVACY & DATA PROTECTION ========== */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[oklch(0.75_0.08_85)]" />
                Privacy & Data Protection
              </h2>
              <p className="mb-3">
                Your phone number and messaging data are handled in accordance with HIPAA regulations
                and our{" "}
                <Link href="/privacy-policy" className="text-[oklch(0.75_0.08_85)] underline hover:text-[oklch(0.80_0.08_85)]">
                  Privacy Policy
                </Link>
                . We take the following measures to protect your information:
              </p>
              <ul className="space-y-2 ml-1">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span>We <strong className="text-foreground">do not sell, share, or disclose</strong> your mobile phone number, SMS opt-in data, or text messaging consent to any third parties or affiliates for marketing or promotional purposes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span>The above excludes text messaging originator opt-in data and consent; this information will not be shared with any third parties.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span>Mobile information may be shared only with service providers (e.g., our SMS delivery platform) that assist in delivering our messaging services, and only for that purpose.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.08_85)] mt-2 shrink-0" />
                  <span>SMS messages may contain limited health information such as appointment types and provider names. We minimize sensitive details in text messages to protect your privacy.</span>
                </li>
              </ul>
            </section>

            {/* ========== TERMS & POLICIES ========== */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[oklch(0.75_0.08_85)]" />
                Terms & Policies
              </h2>
              <p className="mb-3">
                For complete details about how we handle your data and the terms governing our services,
                please review the following:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/privacy-policy"
                  className="flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border border-border hover:border-[oklch(0.75_0.08_85)]/40 hover:bg-[oklch(0.75_0.08_85)]/5 transition-colors"
                >
                  <Shield className="w-4 h-4 text-[oklch(0.75_0.08_85)]" />
                  <span className="text-sm font-medium text-foreground">Privacy Policy</span>
                </Link>
                <Link
                  href="/terms"
                  className="flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border border-border hover:border-[oklch(0.75_0.08_85)]/40 hover:bg-[oklch(0.75_0.08_85)]/5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-[oklch(0.75_0.08_85)]" />
                  <span className="text-sm font-medium text-foreground">Terms of Service</span>
                </Link>
              </div>
            </section>

            {/* ========== SUMMARY DISCLOSURE BOX ========== */}
            <section className="bg-muted/30 rounded-lg p-5 border border-border/40 text-sm">
              <h3 className="font-semibold text-foreground mb-2">SMS Program Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <span className="text-muted-foreground">Program Name:</span>{" "}
                  <span className="text-foreground">Black Label Medicine Notifications</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Message Frequency:</span>{" "}
                  <span className="text-foreground">Varies, approx. 1–10/month</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Message Types:</span>{" "}
                  <span className="text-foreground">Account Notifications</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Carrier Costs:</span>{" "}
                  <span className="text-foreground">Msg & data rates may apply</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Opt-Out:</span>{" "}
                  <span className="text-foreground">Reply STOP to unsubscribe</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Help:</span>{" "}
                  <span className="text-foreground">Reply HELP or email us</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Consent Required:</span>{" "}
                  <span className="text-foreground">No, consent is voluntary</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Data Sharing:</span>{" "}
                  <span className="text-foreground">Opt-in data not shared</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground space-y-1">
          <p>© {new Date().getFullYear()} Black Label Medicine. All rights reserved.</p>
          <p>
            <Link href="/privacy-policy" className="text-[oklch(0.75_0.08_85)] hover:underline">Privacy Policy</Link>
            {" · "}
            <Link href="/terms" className="text-[oklch(0.75_0.08_85)] hover:underline">Terms of Service</Link>
            {" · "}
            <Link href="/main" className="text-[oklch(0.75_0.08_85)] hover:underline">Home</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
