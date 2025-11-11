# Zenith Dating Platform - Frontend

A production-grade, elite dating platform built with Next.js 14, Supabase, and modern React patterns.

## 🚀 Features

- **Elite UI/UX**: Premium design system with Framer Motion animations
- **Real-time Chat**: Instant messaging with Supabase real-time subscriptions
- **Advanced Discovery**: Smart filtering and matching algorithms
- **GDPR Compliance**: Complete data protection and privacy controls
- **Security First**: Rate limiting, CSP, and comprehensive security headers
- **Performance Optimized**: CDN, caching, and optimized bundles
- **Microservices Architecture**: Isolated components and services

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with OAuth support
- **UI Components**: Radix UI + Framer Motion
- **Styling**: Tailwind CSS with custom design tokens
- **Validation**: Zod schemas
- **Real-time**: Supabase real-time subscriptions
- **Deployment**: Vercel/Netlify ready

## 📦 Installation

1. **Clone and navigate**:
   ```bash
   cd apps/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment setup**:
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase credentials
   ```

4. **Database setup**:
   ```bash
   # Run the migration in Supabase SQL editor
   cat ../../migrations/001_zenith_production_schema.sql
   ```

5. **Development server**:
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── explore/      # Discovery and search components
│   ├── chat/         # Real-time chat components
│   └── filters/      # Filter and search components
├── lib/
│   ├── supabase.ts   # Supabase client configuration
│   ├── auth.ts       # Authentication utilities
│   ├── validation.ts # Zod schemas
│   └── utils.ts      # Helper functions
├── pages/            # Static pages (privacy, terms, etc.)
└── styles/           # Global styles and design tokens
```

## 🔧 Configuration

### Next.js Config
- Optimized for performance with image optimization
- Security headers and CSP configuration
- CDN and caching setup

### Supabase Setup
1. Create a new Supabase project
2. Run the migration script in SQL editor
3. Configure authentication providers
4. Set up real-time policies

### Environment Variables
See `.env.example` for all required variables.

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository
2. Set environment variables
3. Deploy automatically

### Manual Deployment
```bash
npm run build
npm start
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per minute per IP
- **Content Security Policy**: Strict CSP headers
- **XSS Protection**: Comprehensive XSS prevention
- **Row Level Security**: Database-level access control
- **Input Validation**: Zod schema validation
- **Secure Headers**: Security headers middleware

## 📊 Performance

- **Core Web Vitals**: Optimized for 90+ scores
- **Image Optimization**: Next.js automatic optimization
- **Code Splitting**: Automatic route-based splitting
- **Caching**: Aggressive caching strategies
- **CDN**: Global content delivery

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📈 Monitoring

- **Error Tracking**: Sentry integration
- **Analytics**: LogRocket for user behavior
- **Performance**: Real user monitoring
- **Uptime**: Health checks and monitoring

## 🤝 Contributing

1. Follow the established code style
2. Write tests for new features
3. Update documentation
4. Ensure GDPR compliance
5. Test accessibility (WCAG 2.1 AA)

## 📄 License

This project is proprietary software. See LICENSE file for details.

## 🆘 Support

- **Documentation**: See `/docs` directory
- **Issues**: GitHub Issues
- **Security**: security@zenith-dating.com
- **General**: support@zenith-dating.com

## 🎯 Quality Gates

Every component must pass:
- ✅ WCAG 2.1 AA accessibility
- ✅ GDPR compliance check
- ✅ Security audit
- ✅ Performance benchmarks
- ✅ Cross-browser testing
- ✅ Mobile responsiveness
- ✅ Type safety (TypeScript)
- ✅ Test coverage > 80%