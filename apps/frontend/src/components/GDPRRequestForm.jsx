import { Container, Typography, Box, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Button, Alert, Paper } from '@mui/material';
import { supabase } from '../lib/supabase';

// GDPR Data Request Form Component - Elite Compliance
export const GDPRRequestForm = () => {
  const [formData, setFormData] = useState({
    requestType: '',
    email: '',
    fullName: '',
    userId: '',
    description: '',
    consent: false
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const requestTypes = [
    {
      value: 'access',
      label: 'Right to Access',
      description: 'Request a copy of all personal data we hold about you'
    },
    {
      value: 'rectification',
      label: 'Right to Rectification',
      description: 'Request correction of inaccurate or incomplete personal data'
    },
    {
      value: 'erasure',
      label: 'Right to Erasure (Right to be Forgotten)',
      description: 'Request deletion of your personal data'
    },
    {
      value: 'restriction',
      label: 'Right to Restriction',
      description: 'Request limitation of how we process your personal data'
    },
    {
      value: 'portability',
      label: 'Right to Data Portability',
      description: 'Request your data in a structured, machine-readable format'
    },
    {
      value: 'objection',
      label: 'Right to Object',
      description: 'Object to processing of your personal data'
    },
    {
      value: 'withdraw_consent',
      label: 'Withdraw Consent',
      description: 'Withdraw previously given consent for data processing'
    },
    {
      value: 'complaint',
      label: 'File a Complaint',
      description: 'Report a concern about our data processing practices'
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.requestType) {
      setError('Please select a request type');
      return false;
    }
    if (!formData.email) {
      setError('Email address is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.consent) {
      setError('You must confirm that you are the data subject');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Create GDPR request record
      const { data, error: insertError } = await supabase
        .from('gdpr_requests')
        .insert([
          {
            request_type: formData.requestType,
            email: formData.email,
            full_name: formData.fullName,
            user_id: formData.userId || null,
            description: formData.description,
            status: 'pending',
            requested_at: new Date().toISOString(),
            consent_given: formData.consent
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Send confirmation email (would be handled by backend service)
      console.log('GDPR request submitted:', data);

      // Log the request for audit purposes
      await supabase
        .from('audit_logs')
        .insert([
          {
            action: 'gdpr_request_submitted',
            user_id: formData.userId || null,
            details: {
              request_type: formData.requestType,
              email: formData.email,
              request_id: data.id
            },
            ip_address: 'client_ip', // Would be captured server-side
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        ]);

      setSubmitted(true);

    } catch (err) {
      console.error('Error submitting GDPR request:', err);
      setError('Failed to submit request. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'success.main', mb: 2 }}>
            ✅ Request Submitted Successfully
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Your GDPR request has been submitted and is being processed. You will receive a confirmation email shortly.
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Request ID: Will be provided in your confirmation email
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Processing Time: We aim to respond within 30 days as required by GDPR.
            For urgent requests or complex cases, this may take up to 90 days.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" href="/privacy-policy">
              View Privacy Policy
            </Button>
            <Button variant="contained" href="/">
              Return to Home
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: 'primary.main',
          textAlign: 'center',
          mb: 2
        }}>
          GDPR Data Request
        </Typography>
        <Typography variant="body1" sx={{
          textAlign: 'center',
          color: 'text.secondary',
          fontSize: '1.1rem',
          mb: 3
        }}>
          Exercise your rights under the General Data Protection Regulation (GDPR)
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <FormControl component="fieldset" sx={{ mb: 4, width: '100%' }}>
            <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.2rem', fontWeight: 600 }}>
              Select Request Type *
            </FormLabel>
            <RadioGroup
              value={formData.requestType}
              onChange={(e) => handleInputChange('requestType', e.target.value)}
            >
              {requestTypes.map((type) => (
                <Box key={type.value} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <FormControlLabel
                    value={type.value}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {type.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {type.description}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              ))}
            </RadioGroup>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              sx={{ minWidth: '250px', flex: 1 }}
            />
            <TextField
              fullWidth
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              sx={{ minWidth: '250px', flex: 1 }}
            />
          </Box>

          <TextField
            fullWidth
            label="User ID (if known)"
            value={formData.userId}
            onChange={(e) => handleInputChange('userId', e.target.value)}
            sx={{ mb: 3 }}
            helperText="Optional: Your account ID if you know it"
          />

          <TextField
            fullWidth
            label="Additional Details"
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            sx={{ mb: 3 }}
            helperText="Please provide any additional context or specific data you want to access/modify"
          />

          <FormControlLabel
            control={
              <input
                type="checkbox"
                checked={formData.consent}
                onChange={(e) => handleInputChange('consent', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
            }
            label={
              <Typography variant="body2">
                I confirm that I am the data subject making this request and understand that providing false information may result in rejection of this request. *
              </Typography>
            }
            sx={{ mb: 3, alignItems: 'flex-start' }}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => window.history.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ minWidth: '150px' }}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Box>
        </form>
      </Paper>

      <Box sx={{ mt: 4, p: 3, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Important Information
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          • We will respond to your request within 30 days, or 90 days for complex requests.
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          • You may be required to provide additional verification to process your request.
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          • Some requests may incur a reasonable fee or may be refused if they are manifestly unfounded or excessive.
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          • You have the right to lodge a complaint with your local data protection authority if you are not satisfied with our response.
        </Typography>
        <Typography variant="body2">
          • For questions about this form or GDPR in general, contact our Data Protection Officer at privacy@zenithdating.com
        </Typography>
      </Box>
    </Container>
  );
};

export default GDPRRequestForm;