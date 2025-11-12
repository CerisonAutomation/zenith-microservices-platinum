'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface FormData {
  requestType: string;
  email: string;
  fullName: string;
  userId: string;
  description: string;
  consent: boolean;
}

// GDPR Data Request Form Component - Elite Compliance
export const GDPRRequestForm = () => {
  const [formData, setFormData] = useState<FormData>({
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

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl text-green-600 mb-4">
            Request Submitted Successfully
          </CardTitle>
          <CardDescription className="text-base mb-6">
            Your GDPR request has been submitted and is being processed. You will receive a confirmation email shortly.
          </CardDescription>
          <p className="text-sm text-muted-foreground mb-6">
            Request ID: Will be provided in your confirmation email
          </p>
          <p className="text-sm mb-6">
            Processing Time: We aim to respond within 30 days as required by GDPR.
            For urgent requests or complex cases, this may take up to 90 days.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <a href="/privacy-policy">View Privacy Policy</a>
            </Button>
            <Button asChild>
              <a href="/">Return to Home</a>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary text-center mb-4">
          GDPR Data Request
        </h1>
        <p className="text-center text-muted-foreground text-lg mb-6">
          Exercise your rights under the General Data Protection Regulation (GDPR)
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-lg font-semibold mb-4 block">
                Select Request Type *
              </Label>
              <RadioGroup
                value={formData.requestType}
                onValueChange={(value) => handleInputChange('requestType', value)}
                className="space-y-3"
              >
                {requestTypes.map((type) => (
                  <Card key={type.value} className="p-4 border">
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                      <Label htmlFor={type.value} className="flex-1 cursor-pointer">
                        <div className="font-semibold text-base mb-1">
                          {type.label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {type.description}
                        </div>
                      </Label>
                    </div>
                  </Card>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="your.email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">User ID (if known)</Label>
              <Input
                id="userId"
                value={formData.userId}
                onChange={(e) => handleInputChange('userId', e.target.value)}
                placeholder="Optional: Your account ID if you know it"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional Details</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                placeholder="Please provide any additional context or specific data you want to access/modify"
              />
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent"
                checked={formData.consent}
                onCheckedChange={(checked) => handleInputChange('consent', checked as boolean)}
              />
              <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                I confirm that I am the data subject making this request and understand that providing false information may result in rejection of this request. *
              </Label>
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[150px]"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Alert className="mt-8">
        <AlertTitle className="text-lg font-semibold mb-3">
          Important Information
        </AlertTitle>
        <AlertDescription className="space-y-2 text-sm">
          <p>• We will respond to your request within 30 days, or 90 days for complex requests.</p>
          <p>• You may be required to provide additional verification to process your request.</p>
          <p>• Some requests may incur a reasonable fee or may be refused if they are manifestly unfounded or excessive.</p>
          <p>• You have the right to lodge a complaint with your local data protection authority if you are not satisfied with our response.</p>
          <p>• For questions about this form or GDPR in general, contact our Data Protection Officer at privacy@zenithdating.com</p>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default GDPRRequestForm;
