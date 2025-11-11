import { Button } from '../design-system/atomic';

// GDPR Cookie Consent Component - Elite Compliance
export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
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
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
      applyConsent(savedPreferences);
    }
  }, []);

  const applyConsent = (prefs) => {
    // Apply Google Analytics
    if (window.gtag && prefs.analytics) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    } else if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    }

    // Apply marketing cookies
    if (prefs.marketing) {
      // Enable marketing pixels, retargeting, etc.
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
    if (window.fbq) {
      window.fbq('consent', 'grant');
    }

    // Google Ads
    if (window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: 'granted'
      });
    }

    // Enable other marketing scripts
    console.log('Marketing cookies enabled');
  };

  const disableMarketingCookies = () => {
    // Facebook Pixel
    if (window.fbq) {
      window.fbq('consent', 'revoke');
    }

    // Google Ads
    if (window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: 'denied'
      });
    }

    // Disable other marketing scripts
    console.log('Marketing cookies disabled');
  };

  const enableFunctionalCookies = () => {
    // Enable functional features like theme preferences, language settings
    localStorage.setItem('functional-cookies-enabled', 'true');
    console.log('Functional cookies enabled');
  };

  const disableFunctionalCookies = () => {
    // Clear functional preferences
    localStorage.removeItem('functional-cookies-enabled');
    console.log('Functional cookies disabled');
  };

  const handleAcceptAll = () => {
    const allPreferences = {
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
    const necessaryOnly = {
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

  const handlePreferenceChange = (type, value) => {
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
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #333',
        padding: '24px',
        zIndex: 1000,
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3 style={{
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              🍪 Cookie Preferences
            </h3>
            <p style={{
              color: '#a1a1aa',
              fontSize: '14px',
              lineHeight: '1.5',
              margin: 0
            }}>
              We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts.
              By continuing to use our site, you agree to our use of cookies. You can manage your preferences anytime.
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreferences(true)}
            >
              Manage Preferences
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAcceptNecessary}
            >
              Necessary Only
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAcceptAll}
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: '600',
                margin: 0
              }}>
                Cookie Preferences
              </h2>
              <button
                onClick={() => setShowPreferences(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{
                padding: '20px',
                border: '1px solid #333',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    Necessary Cookies
                  </h3>
                  <span style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    Always Active
                  </span>
                </div>
                <p style={{
                  color: '#a1a1aa',
                  fontSize: '14px',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  These cookies are essential for the website to function properly. They cannot be disabled.
                </p>
              </div>

              <CookiePreferenceItem
                title="Analytics Cookies"
                description="Help us understand how visitors interact with our website by collecting and reporting information anonymously."
                checked={preferences.analytics}
                onChange={(checked) => handlePreferenceChange('analytics', checked)}
              />

              <CookiePreferenceItem
                title="Marketing Cookies"
                description="Used to deliver personalized advertisements and track campaign effectiveness across websites."
                checked={preferences.marketing}
                onChange={(checked) => handlePreferenceChange('marketing', checked)}
              />

              <CookiePreferenceItem
                title="Functional Cookies"
                description="Enable enhanced functionality and personalization, such as remembering your preferences."
                checked={preferences.functional}
                onChange={(checked) => handlePreferenceChange('functional', checked)}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <Button
                variant="ghost"
                onClick={() => setShowPreferences(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSavePreferences}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Cookie Preference Item Component
const CookiePreferenceItem = ({ title, description, checked, onChange }) => {
  return (
    <div style={{
      padding: '20px',
      border: '1px solid #333',
      borderRadius: '8px',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <h3 style={{
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: '600',
          margin: 0,
          flex: 1
        }}>
          {title}
        </h3>
        <label style={{
          position: 'relative',
          display: 'inline-block',
          width: '44px',
          height: '24px',
          marginLeft: '12px'
        }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            style={{
              opacity: 0,
              width: 0,
              height: 0
            }}
          />
          <span style={{
            position: 'absolute',
            cursor: 'pointer',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: checked ? '#eab308' : '#374151',
            transition: '0.3s',
            borderRadius: '24px'
          }}>
            <span style={{
              position: 'absolute',
              height: '18px',
              width: '18px',
              left: checked ? '22px' : '3px',
              bottom: '3px',
              backgroundColor: '#ffffff',
              transition: '0.3s',
              borderRadius: '50%'
            }} />
          </span>
        </label>
      </div>
      <p style={{
        color: '#a1a1aa',
        fontSize: '14px',
        margin: 0,
        lineHeight: '1.5'
      }}>
        {description}
      </p>
    </div>
  );
};

export default CookieConsent;