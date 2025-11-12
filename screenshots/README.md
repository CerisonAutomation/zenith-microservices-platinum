# Page Screenshots

This directory contains automatically generated screenshots of all pages in the Zenith Dating Platform.

## How It Works

Screenshots are automatically captured by GitHub Actions on every push to:
- `claude/**` branches
- `main` branch
- `develop` branch

## Pages Captured

The following pages are captured in both desktop (1920x1080) and mobile (375x812) viewports:

- **Home** (`/`) - Landing/authentication page
- **Explore** (`/explore`) - Profile discovery and browsing
- **Favorites** (`/favorites`) - Saved/liked profiles
- **Messages** (`/messages`) - Real-time chat interface
- **Bookings** (`/bookings`) - Appointment scheduling
- **Profile** (`/profile`) - User profile management
- **Notifications** (`/notifications`) - Activity notifications
- **Wallet** (`/wallet`) - Payment and subscription management

## Running Locally

To capture screenshots locally:

```bash
cd apps/frontend

# Install dependencies if needed
npm install

# Build the app
npm run build

# Start the app in one terminal
npm run start

# In another terminal, capture screenshots
npm run screenshots
```

## Screenshot Naming

Screenshots are named using the pattern: `{page-name}-{viewport}.png`

Examples:
- `home-desktop.png`
- `explore-mobile.png`
- `messages-desktop.png`

---

*Last updated: Awaiting first automated run*
