import { designTokens, Button, Input, Card, Avatar } from '../design-system/atomic';

// Elite Landing Page Component
export const LandingPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)',
      color: designTokens.colors.neutral[100]
    }}>
      {/* GDPR Cookie Consent Banner */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: designTokens.colors.neutral[800],
        padding: designTokens.spacing.lg,
        borderTop: `1px solid ${designTokens.colors.neutral[600]}`,
        zIndex: designTokens.zIndex.banner
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: designTokens.spacing.md
        }}>
          <p style={{
            margin: 0,
            fontSize: designTokens.typography.sizes.sm,
            flex: 1,
            minWidth: '300px'
          }}>
            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
            <a href="/privacy" style={{ color: designTokens.colors.primary[400], marginLeft: designTokens.spacing.sm }}>
              Learn more
            </a>
          </p>
          <div style={{ display: 'flex', gap: designTokens.spacing.sm }}>
            <Button variant="ghost" size="sm">
              Reject
            </Button>
            <Button variant="primary" size="sm">
              Accept All
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section style={{
        padding: `${designTokens.spacing.xxxl} ${designTokens.spacing.md}`,
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(15,15,15,0.8) 0%, rgba(26,26,26,0.9) 100%)'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: designTokens.typography.sizes['5xl'],
            fontWeight: designTokens.typography.weights.bold,
            background: 'linear-gradient(135deg, #facc15 0%, #eab308 50%, #ca8a04 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: designTokens.spacing.lg
          }}>
            Zenith Elite Dating Platform
          </h1>
          
          <p style={{
            fontSize: designTokens.typography.sizes.xl,
            color: designTokens.colors.neutral[300],
            marginBottom: designTokens.spacing.xl,
            lineHeight: designTokens.typography.lineHeights.relaxed
          }}>
            Connect with elite singles in a secure, premium environment. 
            Advanced matching, real-time chat, and verified profiles.
          </p>
          
          <div style={{
            display: 'flex',
            gap: designTokens.spacing.md,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Button variant="primary" size="lg">
              Join Free Today
            </Button>
            <Button variant="secondary" size="lg">
              Explore Members
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: `${designTokens.spacing.xxl} ${designTokens.spacing.md}`,
        backgroundColor: designTokens.colors.background.surface
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: designTokens.typography.sizes['4xl'],
            fontWeight: designTokens.typography.weights.bold,
            textAlign: 'center',
            color: designTokens.colors.neutral[100],
            marginBottom: designTokens.spacing.xxl
          }}>
            Premium Features
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: designTokens.spacing.xl
          }}>
            {[
              {
                title: "AI-Powered Matching",
                description: "Advanced algorithms connect you with compatible partners based on personality, interests, and values.",
                icon: "🤖"
              },
              {
                title: "Verified Profiles",
                description: "All members undergo rigorous verification ensuring authentic connections and enhanced safety.",
                icon: "✅"
              },
              {
                title: "Real-Time Chat",
                description: "Instant messaging with read receipts, typing indicators, and media sharing capabilities.",
                icon: "💬"
              },
              {
                title: "Premium Security",
                description: "End-to-end encryption, GDPR compliance, and advanced privacy controls for your peace of mind.",
                icon: "🔒"
              },
              {
                title: "Video Calling",
                description: "High-quality video calls within the platform for deeper connections before meeting in person.",
                icon: "📹"
              },
              {
                title: "Event Networking",
                description: "Exclusive virtual and in-person events for premium members to connect in curated settings.",
                icon: "🎪"
              }
            ].map((feature, index) => (
              <Card key={index} elevation="md">
                <div style={{
                  textAlign: 'center',
                  padding: designTokens.spacing.xl
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: designTokens.spacing.lg
                  }}>
                    {feature.icon}
                  </div>
                  <h3 style={{
                    fontSize: designTokens.typography.sizes.xl,
                    fontWeight: designTokens.typography.weights.semibold,
                    color: designTokens.colors.neutral[800],
                    marginBottom: designTokens.spacing.md
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    color: designTokens.colors.neutral[600],
                    lineHeight: designTokens.typography.lineHeights.relaxed
                  }}>
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section style={{
        padding: `${designTokens.spacing.xxl} ${designTokens.spacing.md}`,
        background: 'linear-gradient(180deg, rgba(26,26,26,0.9) 0%, rgba(15,15,15,0.8) 100%)'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: designTokens.typography.sizes['3xl'],
            fontWeight: designTokens.typography.weights.bold,
            color: designTokens.colors.neutral[100],
            marginBottom: designTokens.spacing.xl
          }}>
            Trusted by Elite Singles Worldwide
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: designTokens.spacing.xl,
            marginBottom: designTokens.spacing.xxl
          }}>
            {[
              { number: "50,000+", label: "Active Members" },
              { number: "95%", label: "Success Rate" },
              { number: "150+", label: "Countries" },
              { number: "4.9/5", label: "User Rating" }
            ].map((stat, index) => (
              <div key={index}>
                <div style={{
                  fontSize: designTokens.typography.sizes['4xl'],
                  fontWeight: designTokens.typography.weights.bold,
                  color: designTokens.colors.primary[500],
                  marginBottom: designTokens.spacing.sm
                }}>
                  {stat.number}
                </div>
                <div style={{ color: designTokens.colors.neutral[400] }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <Button variant="primary" size="lg">
            Start Your Journey Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: `${designTokens.spacing.xl} ${designTokens.spacing.md}`,
        borderTop: `1px solid ${designTokens.colors.neutral[700]}`,
        backgroundColor: designTokens.colors.neutral[900]
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: designTokens.spacing.xl
        }}>
          <div>
            <h3 style={{
              color: designTokens.colors.neutral[100],
              marginBottom: designTokens.spacing.md
            }}>
              Zenith
            </h3>
            <p style={{ color: designTokens.colors.neutral[400] }}>
              The premier dating platform for discerning singles seeking meaningful connections.
            </p>
          </div>
          <div>
            <h4 style={{ color: designTokens.colors.neutral[300], marginBottom: designTokens.spacing.sm }}>
              Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR Compliance'].map((item) => (
                <li key={item} style={{ marginBottom: designTokens.spacing.xs }}>
                  <a href={`/${item.toLowerCase().replace(' ', '-')}`} style={{ 
                    color: designTokens.colors.neutral[400],
                    textDecoration: 'none'
                  }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{
          marginTop: designTokens.spacing.xl,
          paddingTop: designTokens.spacing.md,
          borderTop: `1px solid ${designTokens.colors.neutral[700]}`,
          textAlign: 'center',
          color: designTokens.colors.neutral[500]
        }}>
          © 2025 Zenith Dating Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;