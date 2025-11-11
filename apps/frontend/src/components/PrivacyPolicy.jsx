import { Container, Typography, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button } from '../design-system/atomic';

// Comprehensive GDPR Privacy Policy Component
export const PrivacyPolicy = () => {
  const lastUpdated = 'November 15, 2024';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: 'primary.main',
          textAlign: 'center',
          mb: 2
        }}>
          Privacy Policy
        </Typography>
        <Typography variant="body1" sx={{
          textAlign: 'center',
          color: 'text.secondary',
          fontSize: '1.1rem'
        }}>
          Last updated: {lastUpdated}
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
          At Zenith Dating Platform ("we," "our," or "us"), we are committed to protecting your privacy and personal data.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our
          dating platform and services. By using Zenith, you agree to the collection and use of information in accordance
          with this policy.
        </Typography>
      </Box>

      <Accordion defaultExpanded sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            1. Information We Collect
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            1.1 Personal Information
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            We collect personal information that you provide directly to us, including:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            <li>Name, email address, phone number, and date of birth</li>
            <li>Profile information (photos, bio, interests, preferences)</li>
            <li>Location data (with your consent)</li>
            <li>Communication data (messages, chat history)</li>
            <li>Payment information (processed securely through third-party providers)</li>
          </Box>

          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            1.2 Automatically Collected Information
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            We automatically collect certain information when you use our platform:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage data (pages visited, features used, time spent)</li>
            <li>Location data (approximate location based on IP)</li>
            <li>Cookies and similar tracking technologies</li>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            2. How We Use Your Information
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            We use the collected information for the following purposes:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
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
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            3. Legal Basis for Processing (GDPR)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Under GDPR, we process your personal data based on the following legal grounds:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            <li><strong>Consent:</strong> When you explicitly agree to our data processing</li>
            <li><strong>Contract:</strong> To provide services you have requested</li>
            <li><strong>Legitimate Interest:</strong> To improve our services and user experience</li>
            <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            4. Information Sharing and Disclosure
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            <li>With your explicit consent</li>
            <li>To service providers who assist our operations (under strict confidentiality)</li>
            <li>To comply with legal obligations or court orders</li>
            <li>To protect our rights, property, or safety</li>
            <li>In connection with a business transfer or merger</li>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            5. Data Retention
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            We retain your personal data for as long as necessary to provide our services and fulfill the purposes outlined in this policy:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            <li>Account data: Retained while your account is active and for 3 years after deactivation</li>
            <li>Communication data: Retained for 2 years or until deleted by users</li>
            <li>Payment data: Retained for 7 years for tax and accounting purposes</li>
            <li>Analytics data: Anonymized after 2 years</li>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            6. Your GDPR Rights
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            As a EU resident, you have the following rights under GDPR:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
            <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
            <li><strong>Right to Restriction:</strong> Limit how we process your data</li>
            <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
            <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            To exercise these rights, contact us at privacy@zenithdating.com
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            7. Cookies and Tracking Technologies
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            We use cookies and similar technologies to enhance your experience:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
            <li><strong>Analytics Cookies:</strong> Help us understand user behavior</li>
            <li><strong>Marketing Cookies:</strong> Used for personalized advertising</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences</li>
          </Box>
          <Typography variant="body2">
            You can manage cookie preferences through your browser settings or our cookie consent tool.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            8. Data Security
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            We implement comprehensive security measures to protect your data:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            <li>End-to-end encryption for all communications</li>
            <li>Secure data storage with regular backups</li>
            <li>Regular security audits and penetration testing</li>
            <li>Access controls and employee training</li>
            <li>Incident response procedures</li>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            9. International Data Transfers
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            <li>Standard Contractual Clauses approved by the European Commission</li>
            <li>Adequacy decisions for certain countries</li>
            <li>Your explicit consent for transfers</li>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            10. Children's Privacy
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2">
            Our services are not intended for children under 18. We do not knowingly collect personal information from children under 18.
            If we become aware that we have collected such information, we will delete it immediately.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 4 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            11. Changes to This Privacy Policy
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            <li>Posting the new policy on this page</li>
            <li>Sending you an email notification</li>
            <li>Displaying a prominent notice on our platform</li>
          </Box>
          <Typography variant="body2">
            Your continued use of Zenith after changes constitutes acceptance of the updated policy.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Contact Us
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          If you have any questions about this Privacy Policy, please contact us:
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Email: privacy@zenithdating.com
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Address: [Your Business Address]
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="outlined" href="/gdpr-request">
            Submit GDPR Request
          </Button>
          <Button variant="outlined" href="/cookie-preferences">
            Manage Cookies
          </Button>
          <Button variant="outlined" href="/data-export">
            Request Data Export
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default PrivacyPolicy;