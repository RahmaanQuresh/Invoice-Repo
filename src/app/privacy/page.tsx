export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-muted-foreground">
            When you use DeathFear, we collect the following types of information:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
            <li><strong>Account Information:</strong> Name, email address, and profile information you provide when creating an account.</li>
            <li><strong>Invoice Data:</strong> Information about your clients, invoices, payment amounts, and payment statuses.</li>
            <li><strong>Communication Data:</strong> Reminder message templates, AI tone samples, and email delivery status (opens, clicks, bounces).</li>
            <li><strong>Payment Information:</strong> We store references to subscription payments (e.g., Stripe subscription IDs) but never store full credit card numbers or banking details — those are handled by our payment processors.</li>
            <li><strong>Usage Data:</strong> How you interact with the platform (pages visited, features used) to improve our service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="text-muted-foreground">
            We use your information to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
            <li>Provide and maintain the DeathFear service (invoice creation, reminder automation, legal escalation)</li>
            <li>Send automated reminders to your clients on your behalf</li>
            <li>Process subscription payments and manage your account</li>
            <li>Improve our AI tone adaptation feature</li>
            <li>Send service-related communications (payment received, reminder bounced, subscription updates)</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">3. Data Sharing</h2>
          <p className="text-muted-foreground">
            We share your data only with third parties that are essential to providing the service:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
            <li><strong>Resend:</strong> For sending reminder emails. Resend tracks opens to report delivery status.</li>
            <li><strong>OpenAI:</strong> For AI tone adaptation (when you use this Premium feature). We send your writing sample and reminder template to generate adapted content.</li>
            <li><strong>Stripe / PayPal / Razorpay:</strong> For processing subscription payments. We share your name, email, and payment amount with the processor you choose.</li>
            <li><strong>Vercel / Neon:</strong> For hosting and database services.</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            We do not sell your personal data to third parties. We do not share your client data with anyone except as necessary to provide the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">4. Data Retention</h2>
          <p className="text-muted-foreground">
            We retain your data for the following periods:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
            <li><strong>Active accounts:</strong> Data retained until account deletion</li>
            <li><strong>Deleted accounts:</strong> Soft-deleted for 30 days, then permanently purged</li>
            <li><strong>Deleted invoices:</strong> Soft-deleted for 90 days, then permanently purged</li>
            <li><strong>Notification logs:</strong> Retained for 12 months</li>
            <li><strong>Reminder delivery status:</strong> Retained for 24 months (for proof of delivery in legal disputes)</li>
            <li><strong>Payment records:</strong> Subscription ID references retained for 7 years (tax compliance)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">5. Your Rights (GDPR)</h2>
          <p className="text-muted-foreground">
            If you are in the European Union, you have the following rights:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
            <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
            <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
            <li><strong>Right to Deletion:</strong> Request deletion of your account and associated data (Settings → Delete Account)</li>
            <li><strong>Right to Data Portability:</strong> Export your data as JSON (Settings → Download My Data)</li>
            <li><strong>Right to Object:</strong> Object to processing of your data</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            To exercise these rights, contact us at privacy@deathear.app.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">6. Email Tracking</h2>
          <p className="text-muted-foreground">
            Reminder emails sent through DeathFear include a tracking pixel that records when an email is opened. 
            This information is shared with you (the freelancer) so you know when your client has viewed the reminder.
            Opens are not shared with any third parties. Every email footer includes a notice about open tracking.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">7. Security</h2>
          <p className="text-muted-foreground">
            We implement appropriate security measures including encryption in transit (TLS), 
            encrypted password storage (bcrypt), and JWT-based authentication. 
            Payment processing is handled by PCI-compliant third parties (Stripe, PayPal, Razorpay).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">8. Contact</h2>
          <p className="text-muted-foreground">
            For privacy-related inquiries, contact us at privacy@deathear.app.
          </p>
        </section>
      </div>
    </div>
  );
}
