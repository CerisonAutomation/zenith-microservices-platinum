/**
 * 18+ Age Gate Component
 *
 * Required before accessing the dating app
 * - Age verification (18+)
 * - Terms & Conditions acceptance
 * - Privacy Policy acceptance
 * - Warning about adult content
 * - Cannot proceed without checkbox confirmation
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle, Heart, Lock } from 'lucide-react';
import Link from 'next/link';

interface AgeGateProps {
  onVerified: () => void;
}

export function AgeGate({ onVerified }: AgeGateProps) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const canProceed = ageConfirmed && termsAccepted && privacyAccepted;

  const handleSubmit = () => {
    if (!canProceed) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
      return;
    }

    // Store verification in localStorage
    localStorage.setItem('age_verified', 'true');
    localStorage.setItem('terms_accepted', 'true');
    localStorage.setItem('privacy_accepted', 'true');
    localStorage.setItem('verification_date', new Date().toISOString());

    onVerified();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-pink-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 border-purple-500/20 bg-black/40 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>

            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Age Verification Required
            </CardTitle>

            <CardDescription className="text-lg text-gray-300">
              You must be 18 years or older to access this platform
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Warning Alert */}
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <AlertDescription className="text-amber-200">
                This platform contains adult content and is intended for mature audiences only.
                By proceeding, you confirm that you are of legal age in your jurisdiction.
              </AlertDescription>
            </Alert>

            {/* Age Confirmation */}
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Checkbox
                id="age"
                checked={ageConfirmed}
                onCheckedChange={(checked) => setAgeConfirmed(checked as boolean)}
                className="mt-1 border-purple-400"
              />
              <div className="flex-1">
                <Label
                  htmlFor="age"
                  className="text-base font-semibold text-white cursor-pointer flex items-center gap-2"
                >
                  <Heart className="w-4 h-4 text-red-400" />
                  I am 18 years of age or older
                </Label>
                <p className="text-sm text-gray-400 mt-1">
                  You must be at least 18 years old to use this dating platform
                </p>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="mt-1 border-purple-400"
              />
              <div className="flex-1">
                <Label
                  htmlFor="terms"
                  className="text-base font-semibold text-white cursor-pointer flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-purple-400" />
                  I accept the Terms & Conditions
                </Label>
                <p className="text-sm text-gray-400 mt-1">
                  Please read and accept our{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Terms & Conditions
                  </Link>
                </p>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Checkbox
                id="privacy"
                checked={privacyAccepted}
                onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                className="mt-1 border-purple-400"
              />
              <div className="flex-1">
                <Label
                  htmlFor="privacy"
                  className="text-base font-semibold text-white cursor-pointer flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-blue-400" />
                  I accept the Privacy Policy
                </Label>
                <p className="text-sm text-gray-400 mt-1">
                  Please read and accept our{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Privacy Policy
                  </Link>{' '}
                  and GDPR compliance
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <AnimatePresence>
              {showWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <AlertDescription className="text-red-200">
                      You must confirm all checkboxes above to proceed
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Legal Notice */}
            <div className="text-xs text-gray-500 space-y-2 p-4 rounded-lg bg-white/5">
              <p>
                <strong>Legal Notice:</strong> By clicking "Enter", you certify under penalty of perjury that:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>You are at least 18 years of age</li>
                <li>You are not offended by adult-oriented material</li>
                <li>You will not permit any minor to access this platform</li>
                <li>You understand this platform contains adult dating services</li>
                <li>Accessing this platform is legal in your jurisdiction</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              onClick={handleSubmit}
              disabled={!canProceed}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canProceed ? 'Enter Platform' : 'Accept All to Continue'}
            </Button>

            <p className="text-center text-sm text-gray-500">
              By entering, you agree to our use of cookies and data processing
              practices outlined in our Privacy Policy
            </p>
          </CardFooter>
        </Card>

        {/* Footer Links */}
        <div className="mt-6 text-center space-x-4 text-sm text-gray-400">
          <Link href="/about" className="hover:text-purple-400">
            About Us
          </Link>
          <span>•</span>
          <Link href="/safety" className="hover:text-purple-400">
            Safety Center
          </Link>
          <span>•</span>
          <Link href="/support" className="hover:text-purple-400">
            Support
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
