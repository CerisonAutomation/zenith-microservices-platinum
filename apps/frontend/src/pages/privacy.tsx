import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Zenith Dating',
  description: 'Our commitment to protecting your privacy and personal data.',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Data Collection</h2>
              <p className="mb-4">
                We collect only the data necessary to provide our dating services:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Profile information:</strong> Name, age, gender, interests, photos</li>
                <li><strong>Communication data:</strong> Messages, matches, chat history</li>
                <li><strong>Usage analytics:</strong> App usage patterns (anonymized and aggregated)</li>
                <li><strong>Technical data:</strong> IP address, device information, location data</li>
                <li><strong>Payment information:</strong> For premium subscriptions (processed securely)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Data Usage</h2>
              <p className="mb-4">
                Your data is used exclusively for:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Matching you with compatible partners based on your preferences</li>
                <li>Facilitating communication between verified users</li>
                <li>Improving our services through anonymized analytics</li>
                <li>Ensuring platform safety and preventing fraud</li>
                <li>Providing customer support and responding to inquiries</li>
                <li>Complying with legal obligations and enforcing our terms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Data Sharing</h2>
              <p className="mb-4">
                We do not sell your personal data. We may share data only in these circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>With your consent:</strong> When you choose to share information</li>
                <li><strong>Service providers:</strong> Trusted partners who help operate our platform</li>
                <li><strong>Legal requirements:</strong> When required by law or to protect safety</li>
                <li><strong>Platform safety:</strong> To investigate violations of our terms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Your Rights (GDPR)</h2>
              <p className="mb-4">
                Under GDPR and other privacy laws, you have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectify:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Erase:</strong> Delete your data (Right to be Forgotten)</li>
                <li><strong>Restrict:</strong> Limit how we process your data</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Withdraw consent:</strong> Revoke consent for data processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="mb-4">
                We implement industry-standard security measures:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>End-to-end encryption for all messages and sensitive data</li>
                <li>Regular security audits and penetration testing</li>
                <li>Secure data storage with encryption at rest</li>
                <li>Access controls and employee training on data protection</li>
                <li>Regular backups with secure storage</li>
                <li>Incident response plan for data breaches</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p className="mb-4">
                We retain your data for the following periods:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Active accounts:</strong> As long as your account is active</li>
                <li><strong>Deleted accounts:</strong> 30 days for recovery, then anonymized</li>
                <li><strong>Messages:</strong> Retained until account deletion</li>
                <li><strong>Analytics:</strong> Aggregated and anonymized after 2 years</li>
                <li><strong>Legal holds:</strong> Retained as required by law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
              <p className="mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Keep you logged in and secure</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze usage patterns to improve our service</li>
                <li>Provide personalized recommendations</li>
              </ul>
              <p className="mt-4">
                You can control cookie preferences through your browser settings or our cookie banner.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
              <p className="mb-4">
                Your data may be transferred to and processed in countries other than your own.
                We ensure appropriate safeguards are in place, including:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Standard contractual clauses approved by the European Commission</li>
                <li>Adequacy decisions for certain countries</li>
                <li>Your explicit consent for transfers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
              <p className="mb-4">
                For privacy-related inquiries or to exercise your rights, contact our Data Protection Officer:
              </p>
              <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                <p><strong>Email:</strong> privacy@zenith-dating.com</p>
                <p><strong>Data Protection Officer:</strong> dpo@zenith-dating.com</p>
                <p><strong>Address:</strong> Data Protection Office, Zenith Dating Ltd.</p>
                <p><strong>Response time:</strong> We respond to all requests within 30 days</p>
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                You also have the right to lodge a complaint with your local data protection authority.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}