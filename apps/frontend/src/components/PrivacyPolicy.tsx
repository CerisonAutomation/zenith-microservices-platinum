'use client';

import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Comprehensive GDPR Privacy Policy Component
export const PrivacyPolicy = () => {
  const lastUpdated = 'November 15, 2024';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary text-center mb-4">
          Privacy Policy
        </h1>
        <p className="text-center text-muted-foreground text-lg">
          Last updated: {lastUpdated}
        </p>
      </div>

      <div className="mb-8">
        <p className="mb-6 leading-relaxed text-foreground">
          At Zenith Dating Platform ("we," "our," or "us"), we are committed to protecting your privacy and personal data.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our
          dating platform and services. By using Zenith, you agree to the collection and use of information in accordance
          with this policy.
        </p>
      </div>

      <Accordion type="single" collapsible className="space-y-4" defaultValue="item-1">
        <AccordionItem value="item-1" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            1. Information We Collect
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                1.1 Personal Information
              </h3>
              <p className="mb-2">
                We collect personal information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name, email address, phone number, and date of birth</li>
                <li>Profile information (photos, bio, interests, preferences)</li>
                <li>Location data (with your consent)</li>
                <li>Communication data (messages, chat history)</li>
                <li>Payment information (processed securely through third-party providers)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                1.2 Automatically Collected Information
              </h3>
              <p className="mb-2">
                We automatically collect certain information when you use our platform:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Location data (approximate location based on IP)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            2. How We Use Your Information
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p className="mb-2">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and maintain our dating services</li>
              <li>Create and manage your account and profile</li>
              <li>Match you with potential partners based on your preferences</li>
              <li>Facilitate communication between users</li>
              <li>Process payments and subscriptions</li>
              <li>Send service-related notifications and updates</li>
              <li>Improve our platform and develop new features</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations</li>
              <li>Analyze usage patterns and user behavior</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            3. Legal Basis for Processing (GDPR)
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p className="mb-2">
              Under GDPR, we process your personal data based on the following legal grounds:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Consent:</strong> When you explicitly agree to our data processing</li>
              <li><strong className="text-foreground">Contract:</strong> To provide services you have requested</li>
              <li><strong className="text-foreground">Legitimate Interest:</strong> To improve our services and user experience</li>
              <li><strong className="text-foreground">Legal Obligation:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            4. Information Sharing and Disclosure
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p className="mb-2">
              We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>With your explicit consent</li>
              <li>To service providers who assist our operations (under strict confidentiality)</li>
              <li>To comply with legal obligations or court orders</li>
              <li>To protect our rights, property, or safety</li>
              <li>In connection with a business transfer or merger</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            5. Data Retention
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p className="mb-2">
              We retain your personal data for as long as necessary to provide our services and fulfill the purposes outlined in this policy:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account data: Retained while your account is active and for 3 years after deactivation</li>
              <li>Communication data: Retained for 2 years or until deleted by users</li>
              <li>Payment data: Retained for 7 years for tax and accounting purposes</li>
              <li>Analytics data: Anonymized after 2 years</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            6. Your GDPR Rights
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p className="mb-2">
              As a EU resident, you have the following rights under GDPR:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-foreground">Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong className="text-foreground">Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong className="text-foreground">Right to Restriction:</strong> Limit how we process your data</li>
              <li><strong className="text-foreground">Right to Data Portability:</strong> Receive your data in a structured format</li>
              <li><strong className="text-foreground">Right to Object:</strong> Object to processing based on legitimate interests</li>
              <li><strong className="text-foreground">Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at privacy@zenithdating.com
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-7" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            7. Cookies and Tracking Technologies
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p className="mb-2">
              We use cookies and similar technologies to enhance your experience:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Essential Cookies:</strong> Required for platform functionality</li>
              <li><strong className="text-foreground">Analytics Cookies:</strong> Help us understand user behavior</li>
              <li><strong className="text-foreground">Marketing Cookies:</strong> Used for personalized advertising</li>
              <li><strong className="text-foreground">Functional Cookies:</strong> Remember your preferences</li>
            </ul>
            <p className="mt-4">
              You can manage cookie preferences through your browser settings or our cookie consent tool.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-8" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            8. Data Security
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p className="mb-2">
              We implement comprehensive security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>End-to-end encryption for all communications</li>
              <li>Secure data storage with regular backups</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and employee training</li>
              <li>Incident response procedures</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-9" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            9. International Data Transfers
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p className="mb-2">
              Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Standard Contractual Clauses approved by the European Commission</li>
              <li>Adequacy decisions for certain countries</li>
              <li>Your explicit consent for transfers</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-10" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            10. Children's Privacy
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p>
              Our services are not intended for children under 18. We do not knowingly collect personal information from children under 18.
              If we become aware that we have collected such information, we will delete it immediately.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-11" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            11. Changes to This Privacy Policy
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p className="mb-2">
              We may update this Privacy Policy from time to time. We will notify you of any changes by:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Posting the new policy on this page</li>
              <li>Sending you an email notification</li>
              <li>Displaying a prominent notice on our platform</li>
            </ul>
            <p>
              Your continued use of Zenith after changes constitutes acceptance of the updated policy.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="text-center mt-12 p-6 bg-card rounded-lg border">
        <h2 className="text-2xl font-semibold mb-4">
          Contact Us
        </h2>
        <p className="mb-2 text-muted-foreground">
          If you have any questions about this Privacy Policy, please contact us:
        </p>
        <p className="mb-1">
          Email: privacy@zenithdating.com
        </p>
        <p className="mb-6 text-muted-foreground">
          Address: [Your Business Address]
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Button variant="outline" asChild>
            <a href="/gdpr-request">Submit GDPR Request</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/cookie-preferences">Manage Cookies</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/data-export">Request Data Export</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
