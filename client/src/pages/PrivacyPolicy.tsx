import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 max-w-4xl">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">Black Label Medicine</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl py-12 px-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 19, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Black Label Medicine ("we," "us," or "our") is a concierge medicine practice committed to protecting the privacy and security of your personal and health information. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our patient portal, website, and related services (collectively, the "Services"). By using our Services, you consent to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We collect the following categories of information to provide and improve our Services:
            </p>
            <div className="bg-muted/30 rounded-lg p-5 space-y-3">
              <div>
                <h3 className="font-medium text-sm text-foreground">Personal Information</h3>
                <p className="text-sm text-muted-foreground">Name, email address, phone number, date of birth, and mailing address provided during account creation or patient onboarding.</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">Health Information</h3>
                <p className="text-sm text-muted-foreground">Medical history, biomarker data, lab results, treatment protocols, appointment records, and messages exchanged with your provider through the patient portal. This information is classified as Protected Health Information (PHI) under HIPAA.</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">Communication Data</h3>
                <p className="text-sm text-muted-foreground">Email addresses and phone numbers used to send appointment reminders, new message notifications, and other service-related communications via email and SMS text messages.</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">Usage Data</h3>
                <p className="text-sm text-muted-foreground">Browser type, device information, IP address, and interaction data collected automatically when you access our Services, used solely to improve functionality and security.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your information exclusively for the following purposes: providing and managing your healthcare services and treatment protocols; communicating with you about appointments, messages, and care updates via email and SMS; maintaining and improving the security and functionality of our patient portal; complying with legal and regulatory obligations, including HIPAA requirements; and responding to your inquiries and support requests. We do not sell, rent, or share your personal information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. SMS and Email Communications</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              When you provide your phone number and/or email address through our patient portal, you consent to receive service-related communications including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Appointment reminders and scheduling confirmations</li>
              <li>Notifications when your provider sends you a new message</li>
              <li>Patient portal onboarding and invitation links</li>
              <li>Important updates about your care or treatment protocols</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Message frequency varies based on your care activity. Standard message and data rates may apply for SMS. You may opt out of SMS communications at any time by replying <strong>STOP</strong> to any text message. You may opt out of email communications by contacting us directly. Opting out of notifications does not affect your ability to use the patient portal or receive care.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. HIPAA Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              As a healthcare provider, we comply with the Health Insurance Portability and Accountability Act (HIPAA) and its implementing regulations. Your Protected Health Information (PHI) is handled in accordance with our Notice of Privacy Practices, which is provided to you separately. We implement administrative, physical, and technical safeguards to protect your PHI, including encryption of data in transit and at rest, role-based access controls, and audit logging of all access to patient records.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We employ industry-standard security measures to protect your information, including TLS/SSL encryption for all data transmitted between your device and our servers, encrypted database storage, secure authentication via OAuth, and regular security audits. While no system can guarantee absolute security, we are committed to maintaining the highest practical level of protection for your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use trusted third-party service providers to deliver our Services. These providers are contractually obligated to protect your information and use it only for the purposes we specify. Our service providers include cloud hosting and database providers for secure data storage, email delivery services for sending notifications, and SMS delivery services for sending text message alerts. We do not share your health information with any third party except as required to provide your care or as required by law. We do not sell, share, or disclose your mobile phone number, SMS opt-in data, or text messaging originator consent to any third parties or affiliates for marketing or promotional purposes. The above excludes text messaging originator opt-in data and consent; this information will not be shared with any third parties. Mobile information may be shared only with service providers that assist in delivering our messaging services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal and health information for as long as necessary to provide our Services and comply with legal obligations. Medical records are retained in accordance with applicable state and federal retention requirements. You may request deletion of your account and non-medical personal data by contacting us directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to access, correct, or request deletion of your personal information. Under HIPAA, you have additional rights regarding your Protected Health Information, including the right to request an accounting of disclosures and the right to request restrictions on certain uses. To exercise any of these rights, please contact us using the information below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on our website and, where appropriate, by sending you a notification through the patient portal. Your continued use of our Services after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us at:
            </p>
            <div className="bg-muted/30 rounded-lg p-5 mt-3">
              <p className="font-medium">Black Label Medicine</p>
              <p className="text-sm text-muted-foreground">Email: jacob@blacklabelmedicine.com</p>
              <p className="text-sm text-muted-foreground">Website: blacklabelmedicine.com</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
