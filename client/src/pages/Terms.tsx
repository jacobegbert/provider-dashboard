import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Terms and Conditions</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 19, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the Black Label Medicine patient portal, website, and related services (collectively, the "Services"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our Services. These terms apply to all users of the Services, including patients, authorized representatives, and visitors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Black Label Medicine provides concierge medicine services through an online patient portal that enables secure messaging with your provider, viewing and tracking treatment protocols, scheduling and managing appointments, tracking biomarkers and health data, and receiving notifications about your care. The Services are intended to supplement, not replace, direct medical consultations with your provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Account Registration and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Access to the patient portal requires an invitation from Black Label Medicine. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these terms or pose a security risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. SMS and Email Messaging Program</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Black Label Medicine offers an SMS and email notification program to keep you informed about your care. By providing your phone number and/or email address through our patient portal, you consent to receive the following types of messages:
            </p>
            <div className="bg-muted/30 rounded-lg p-5 space-y-3 mb-4">
              <div>
                <h3 className="font-medium text-sm text-foreground">Program Name</h3>
                <p className="text-sm text-muted-foreground">Black Label Medicine Patient Notifications</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">Message Types</h3>
                <p className="text-sm text-muted-foreground">Appointment reminders and confirmations, new message alerts from your provider, patient portal onboarding invitations, and care-related updates.</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">Message Frequency</h3>
                <p className="text-sm text-muted-foreground">Message frequency varies based on your care activity. You may receive multiple messages per week during active treatment periods, or fewer during maintenance periods. We do not send marketing or promotional messages.</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">Costs</h3>
                <p className="text-sm text-muted-foreground">There is no charge from Black Label Medicine for receiving SMS or email messages. However, standard message and data rates from your mobile carrier may apply.</p>
              </div>
            </div>

            <h3 className="font-medium mb-2">Opt-In</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You opt in to receive SMS and email notifications by providing your phone number and/or email address in the Black Label Medicine patient portal during onboarding or by updating your profile. You may also opt in by texting <strong>START</strong> or <strong>SUBSCRIBE</strong> to our messaging number.
            </p>

            <h3 className="font-medium mb-2">Opt-Out</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You may opt out of SMS messages at any time by replying <strong>STOP</strong> to any text message you receive from us. After opting out, you will receive a confirmation message and will no longer receive SMS notifications. You may opt out of email notifications by contacting us directly at jacob@blacklabelmedicine.com. Opting out of notifications does not affect your ability to use the patient portal or receive medical care.
            </p>

            <h3 className="font-medium mb-2">Help</h3>
            <p className="text-muted-foreground leading-relaxed">
              For help with SMS messaging, reply <strong>HELP</strong> to any text message or contact us at jacob@blacklabelmedicine.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Privacy and Health Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the Services is also governed by our <Link to="/privacy-policy" className="text-gold hover:underline">Privacy Policy</Link>, which describes how we collect, use, and protect your personal and health information. As a healthcare provider, we comply with HIPAA and all applicable privacy regulations. By using our Services, you acknowledge that you have read and understood our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to use the Services only for their intended purpose of managing your healthcare relationship with Black Label Medicine. You may not use the Services to transmit harmful, threatening, or illegal content; attempt to gain unauthorized access to other users' accounts or data; interfere with the operation or security of the Services; or use the Services for any commercial purpose unrelated to your care.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Medical Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The patient portal is a communication and care management tool. It is not intended for emergency medical situations. If you are experiencing a medical emergency, call 911 or go to your nearest emergency room immediately. Messages sent through the portal may not be reviewed immediately. Response times vary and are not guaranteed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, design, and functionality of the Services are the property of Black Label Medicine and are protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from any part of the Services without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Black Label Medicine shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Services, including but not limited to loss of data, service interruptions, or unauthorized access to your account. Our total liability for any claim arising from the Services shall not exceed the fees you have paid to us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms and Conditions at any time. Material changes will be communicated through the patient portal or by email. Your continued use of the Services after any modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms and Conditions are governed by and construed in accordance with the laws of the State of Utah, without regard to its conflict of law provisions. Any disputes arising from these terms shall be resolved in the courts of the State of Utah.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms and Conditions, please contact us at:
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
