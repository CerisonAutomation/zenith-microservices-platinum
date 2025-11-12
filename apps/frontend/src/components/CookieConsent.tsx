'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

// GDPR Cookie Consent Component - Elite Compliance
export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      const savedPreferences = JSON.parse(consent) as CookiePreferences;
      setPreferences(savedPreferences);
      applyConsent(savedPreferences);
    }
  }, []);

  const applyConsent = (prefs: CookiePreferences) => {
    // Apply Google Analytics
    if ((window as any).gtag && prefs.analytics) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    } else if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    }

    // Apply marketing cookies
    if (prefs.marketing) {
      enableMarketingCookies();
    } else {
      disableMarketingCookies();
    }

    // Apply functional cookies
    if (prefs.functional) {
      enableFunctionalCookies();
    } else {
      disableFunctionalCookies();
    }
  };

  const enableMarketingCookies = () => {
    // Facebook Pixel
    if ((window as any).fbq) {
      (window as any).fbq('consent', 'grant');
    }

    // Google Ads
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        ad_storage: 'granted'
      });
    }

    console.log('Marketing cookies enabled');
  };

  const disableMarketingCookies = () => {
    // Facebook Pixel
    if ((window as any).fbq) {
      (window as any).fbq('consent', 'revoke');
    }

    // Google Ads
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        ad_storage: 'denied'
      });
    }

    console.log('Marketing cookies disabled');
  };

  const enableFunctionalCookies = () => {
    localStorage.setItem('functional-cookies-enabled', 'true');
    console.log('Functional cookies enabled');
  };

  const disableFunctionalCookies = () => {
    localStorage.removeItem('functional-cookies-enabled');
    console.log('Functional cookies disabled');
  };

  const handleAcceptAll = () => {
    const allPreferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    setPreferences(allPreferences);
    localStorage.setItem('cookie-consent', JSON.stringify(allPreferences));
    applyConsent(allPreferences);
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    setPreferences(necessaryOnly);
    localStorage.setItem('cookie-consent', JSON.stringify(necessaryOnly));
    applyConsent(necessaryOnly);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    applyConsent(preferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handlePreferenceChange = (type: keyof CookiePreferences, value: boolean) => {
    if (type === 'necessary') return; // Cannot disable necessary cookies
    setPreferences(prev => ({
      ...prev,
      [type]: value
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-700 p-6 z-[1000] shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-5">
          <div className="flex-1 min-w-[300px]">
            <h3 className="text-white text-lg font-semibold mb-2">
              🍪 Cookie Preferences
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed m-0">
              We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts.
              By continuing to use our site, you agree to our use of cookies. You can manage your preferences anytime.
            </p>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreferences(true)}
            >
              Manage Preferences
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcceptNecessary}
            >
              Necessary Only
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleAcceptAll}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Cookie Preferences</DialogTitle>
            <DialogDescription>
              Manage your cookie preferences and control how we use data on our platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Necessary Cookies */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Necessary Cookies</CardTitle>
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Always Active
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  These cookies are essential for the website to function properly. They cannot be disabled.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Analytics Cookies */}
            <CookiePreferenceCard
              title="Analytics Cookies"
              description="Help us understand how visitors interact with our website by collecting and reporting information anonymously."
              checked={preferences.analytics}
              onChange={(checked) => handlePreferenceChange('analytics', checked)}
            />

            {/* Marketing Cookies */}
            <CookiePreferenceCard
              title="Marketing Cookies"
              description="Used to deliver personalized advertisements and track campaign effectiveness across websites."
              checked={preferences.marketing}
              onChange={(checked) => handlePreferenceChange('marketing', checked)}
            />

            {/* Functional Cookies */}
            <CookiePreferenceCard
              title="Functional Cookies"
              description="Enable enhanced functionality and personalization, such as remembering your preferences."
              checked={preferences.functional}
              onChange={(checked) => handlePreferenceChange('functional', checked)}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setShowPreferences(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePreferences}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Cookie Preference Card Component
interface CookiePreferenceCardProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const CookiePreferenceCard: React.FC<CookiePreferenceCardProps> = ({
  title,
  description,
  checked,
  onChange
}) => {
  return (
    <Card className="border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Switch
            checked={checked}
            onCheckedChange={onChange}
            aria-label={`Toggle ${title}`}
          />
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

export default CookieConsent;
