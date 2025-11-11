import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Zenith Dating',
  description: 'Terms and conditions for using Zenith Dating platform.',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
            Terms of Service
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
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using Zenith Dating ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. User Eligibility</h2>
              <p className="mb-4">
                To use our Service, you must:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Be at least 18 years old</li>
                <li>Have the legal capacity to enter into this agreement</li>
                <li>Not be prohibited from using the service under applicable laws</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the accuracy of your information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Conduct</h2>
              <p className="mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Post false, misleading, or inappropriate content</li>
                <li>Impersonate any person or entity</li>
                <li>Share your account credentials with others</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use automated tools to interact with the service</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Content and Privacy</h2>
              <p className="mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>You retain ownership of content you submit</li>
                <li>You grant us license to use your content as described in our Privacy Policy</li>
                <li>We may remove content that violates these terms</li>
                <li>You are responsible for content you share</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Safety and Reporting</h2>
              <p className="mb-4">
                We are committed to user safety:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Report suspicious or inappropriate behavior</li>
                <li>Use the blocking and reporting features</li>
                <li>Do not share personal information with strangers</li>
                <li>Meet in public places for first meetings</li>
                <li>Trust your instincts and prioritize safety</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Subscription and Payment</h2>
              <p className="mb-4">
                For premium features:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Subscriptions auto-renew unless cancelled</li>
                <li>Prices may change with 30 days notice</li>
                <li>Refunds processed according to our policy</li>
                <li>Payment information is processed securely</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Account Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your account:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>For violation of these terms</li>
                <li>Upon your request</li>
                <li>For extended inactivity</li>
                <li>To comply with legal requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Disclaimers</h2>
              <p className="mb-4">
                The Service is provided "as is" without warranties. We do not guarantee:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Uninterrupted or error-free service</li>
                <li>Accuracy of user-generated content</li>
                <li>Successful matches or relationships</li>
                <li>Compatibility with all devices</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p className="mb-4">
                Our liability is limited to the maximum extent permitted by law. We are not liable for:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of data, profits, or opportunities</li>
                <li>Third-party actions or content</li>
                <li>Service interruptions or technical issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
              <p className="mb-4">
                If you have questions about these Terms:
              </p>
              <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                <p><strong>Email:</strong> legal@zenith-dating.com</p>
                <p><strong>Support:</strong> support@zenith-dating.com</p>
                <p><strong>Address:</strong> Legal Department, Zenith Dating Ltd.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}