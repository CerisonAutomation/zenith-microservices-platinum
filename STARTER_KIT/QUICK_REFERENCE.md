# ⚡ ZENITH PLATFORM - QUICK REFERENCE CARD

**One-page cheat sheet for daily development**

---

## 🚀 ONE-COMMAND SETUP

```bash
bash setup-cursor.sh && pnpm db:start && pnpm dev
```

---

## 📦 ESSENTIAL COMMANDS

### Development
```bash
pnpm dev                # Start all apps (ports 3000, 3001, 8000)
pnpm dev --filter=@zenith/web    # Web app only
pnpm dev --filter=@zenith/admin  # Admin only
pnpm build              # Build for production
```

### Database
```bash
pnpm db:start          # Start Supabase (http://localhost:54323)
pnpm db:stop           # Stop Supabase
pnpm db:reset          # Reset & re-migrate
pnpm db:migrate        # Run new migrations
```

### Testing & Quality
```bash
pnpm test              # Run all tests
pnpm lint              # Lint all code
pnpm format            # Format with Prettier
pnpm clean             # Clean all builds
```

---

## 🌐 LOCAL URLS

| Service | URL | Purpose |
|---------|-----|---------|
| **Main App** | http://localhost:3000 | User-facing app |
| **Admin** | http://localhost:3001 | Admin dashboard |
| **API Docs** | http://localhost:8000/docs | FastAPI docs |
| **Supabase** | http://localhost:54323 | Database Studio |

---

## 📁 KEY DIRECTORIES

```
apps/web/
  ├── app/              # Routes & pages
  │   ├── (auth)/      # Login, signup
  │   ├── (dashboard)/ # Main dashboard
  │   │   ├── @sidebar/    # Parallel route
  │   │   ├── @main/       # Parallel route
  │   │   └── @modal/      # Parallel route
  │   ├── api/         # API routes
  │   ├── profiles/    # Profile pages
  │   └── (.)profiles/ # Profile modals (intercepting)
  ├── components/      # React components
  └── lib/            # Utilities

packages/
  ├── ui/             # Shared UI components
  ├── database/       # Supabase client
  └── auth/           # Auth utilities
```

---

## 🔧 ENVIRONMENT VARIABLES

**Required for AI features:**
```bash
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GEMINI_API_KEY=...
```

**Required for payments:**
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Required for database:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Required for video/voice calls & GIFs:**
```bash
DAILY_API_KEY=your_daily_api_key
NEXT_PUBLIC_GIPHY_API_KEY=your_giphy_key
```

*See `ENVIRONMENT_VARIABLES_UPDATE.md` for complete setup guide*

---

## 🎨 UI COMPONENTS & PRIMITIVES

### Radix UI Primitives (28 Installed)

| Primitive | Usage | Import |
|-----------|-------|--------|
| **Avatar** | Profile pictures | `@radix-ui/react-avatar` |
| **Checkbox** | Form checkboxes | `@radix-ui/react-checkbox` |
| **Dialog** | Modal dialogs | `@radix-ui/react-dialog` |
| **Dropdown Menu** | Dropdown menus | `@radix-ui/react-dropdown-menu` |
| **Icons** | Icon set | `@radix-ui/react-icons` |
| **Radio Group** | Radio buttons | `@radix-ui/react-radio-group` |
| **Select** | Select dropdowns | `@radix-ui/react-select` |
| **Slider** | Range sliders | `@radix-ui/react-slider` |
| **Tabs** | Tab navigation | `@radix-ui/react-tabs` |
| **Toast** | Notifications | `@radix-ui/react-toast` |
| **Tooltip** | Hover tooltips | `@radix-ui/react-tooltip` |

**Available (not yet installed):**
- Accordion, Alert Dialog, Aspect Ratio, Collapsible, Context Menu
- Hover Card, Label, Menubar, Navigation Menu, Popover
- Progress, Radio, Scroll Area, Separator, Switch, Toggle

**Installation:**
```bash
pnpm add @radix-ui/react-{component-name}
```

---

### shadcn/ui Components (59 Available)

**Form Components:**
- Button, Input, Textarea, Checkbox, Radio Group
- Select, Switch, Slider, Calendar, Date Picker
- Combobox, Command, Form

**Layout Components:**
- Card, Separator, Tabs, Accordion, Collapsible
- Aspect Ratio, Scroll Area, Resizable

**Overlay Components:**
- Dialog, Sheet, Popover, Tooltip, Hover Card
- Alert Dialog, Dropdown Menu, Context Menu
- Navigation Menu, Menubar

**Feedback Components:**
- Toast, Alert, Progress, Skeleton, Badge
- Avatar, Loading Spinner

**Data Display:**
- Table, Data Table, Carousel, Pagination
- Breadcrumb, Badge, Avatar

**Installation:**
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
# ... add any component you need
```

**Full list:** https://ui.shadcn.com/docs/components

---

### Custom Zenith Components

**Chat Components:** (`apps/web/components/chat/`)
- `MessageReactions.tsx` - Emoji reactions (❤️ 😂 👍 😮 😢 😍 🔥 💯)
- `VoiceRecorder.tsx` - Voice message recording
- `VideoCall.tsx` - Video/audio calling with Daily.co
- `TypingIndicator.tsx` - Real-time typing status
- `MessageBubble.tsx` - Chat message display
- `ChatInput.tsx` - Message input field
- `ConversationList.tsx` - Chat list sidebar

**Profile Components:** (`apps/web/components/profile/`)
- `ProfileCard.tsx` - User profile card
- `ProfileGallery.tsx` - Photo gallery
- `ProfileEditor.tsx` - Edit profile form
- `VerificationBadge.tsx` - Verified badge
- `InterestsSelector.tsx` - Interest tags

**Matching Components:** (`apps/web/components/matching/`)
- `SwipeCard.tsx` - Tinder-style swipe cards
- `MatchModal.tsx` - Match notification
- `DiscoveryFilters.tsx` - Search filters
- `MatchList.tsx` - List of matches

**Booking Components:** (`apps/web/components/booking/`)
- `BookingForm.tsx` - Create booking
- `CalendarView.tsx` - Availability calendar
- `PackageSelector.tsx` - Choose package
- `BookingConfirmation.tsx` - Confirmation screen
- `PaymentForm.tsx` - Stripe payment form

**AI Components:** (`apps/web/components/ai/`)
- `AIChat.tsx` - AI companion chat
- `PersonalitySelector.tsx` - Choose AI personality
- `VoiceAssistant.tsx` - Voice AI interface

---

### Lucide React Icons (1000+ Icons)

**Common icons used:**
```tsx
import {
  // Navigation
  Home, Search, Heart, User, Settings, Menu, X,

  // Actions
  Send, Edit, Trash2, Download, Upload, Plus,

  // Media
  Image, Video, Mic, MicOff, Camera, Phone, PhoneOff,

  // Status
  Check, CheckCircle, AlertCircle, Info, XCircle,

  // Social
  MessageCircle, Bell, Share2, Bookmark, ThumbsUp,

  // UI
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  MoreVertical, MoreHorizontal, Eye, EyeOff
} from 'lucide-react'
```

**Usage:**
```tsx
<Heart className="w-5 h-5 text-red-500" />
<Send className="w-4 h-4" />
```

**Browse all:** https://lucide.dev/icons

---

### Animation with Framer Motion

**Installed:** `framer-motion@^11.18.2`

**Common patterns:**
```tsx
import { motion } from 'framer-motion'

// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Slide up
<motion.div
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
>
  Content
</motion.div>

// Scale on tap
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>
```

---

### Styling Utilities

**Tailwind CSS v3.4.1**
- Full utility-first CSS framework
- Custom config in `tailwind.config.ts`
- Dark mode support

**class-variance-authority (CVA)**
```tsx
import { cva } from 'class-variance-authority'

const buttonVariants = cva('base-classes', {
  variants: {
    variant: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-500'
    }
  }
})
```

**cn() utility (tailwind-merge + clsx)**
```tsx
import { cn } from '@/lib/utils'

<div className={cn('base-class', isActive && 'active-class', className)} />
```

---

## 🎯 CURSOR AI COMMANDS

```
"Start development server"
"Run database migrations"
"Create a new API route for [feature]"
"Add a new component for [feature]"
"Fix all TypeScript errors"
"Explain this function"
"Refactor to use Server Components"
"Add error handling"
"Write tests for this component"
"Optimize this database query"
```

---

## 🗄️ DATABASE TABLES

**Core Tables:**
| Table | Purpose |
|-------|---------|
| `profiles` | User profiles & settings |
| `matches` | Swipe matches |
| `messages` | Real-time chat |
| `bookings` | Date reservations |
| `booking_packages` | Provider pricing |
| `availability_schedules` | Provider availability |

**AI Tables:**
| Table | Purpose |
|-------|---------|
| `ai_conversations` | AI chat history |
| `ai_personalities` | AI companion types |

**Moderation Tables:**
| Table | Purpose |
|-------|---------|
| `notifications` | User notifications |
| `user_reports` | Content moderation |
| `blocked_users` | Blocked/muted users |

**NEW - Chat Features:** (Added 2025-01-14)
| Table | Purpose |
|-------|---------|
| `message_reactions` | Emoji reactions (❤️ 😂 👍) |
| `voice_messages` | Voice recordings |
| `calls` | Video/audio call logs |
| `stories` | 24-hour ephemeral posts |
| `story_views` | Story view tracking |
| `gif_messages` | GIF attachments |

*Total: 40+ tables. See `ZENITH_EXPERT_CRITIQUE/DATABASE_IMPROVEMENTS.sql` for complete schema*

---

## 🔐 API ROUTES

### Authentication
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/user
```

### AI Features
```
POST   /api/ai/chat           # Chat with AI
POST   /api/ai/voice          # Text-to-speech
POST   /api/ai/memory         # Store/retrieve memories
```

### Bookings
```
GET    /api/bookings          # List bookings
POST   /api/bookings          # Create booking
PATCH  /api/bookings/[id]     # Update status
DELETE /api/bookings/[id]     # Cancel booking
GET    /api/availability/[id] # Get provider availability
```

### Matching
```
GET    /api/matches           # Get matches
POST   /api/matches/swipe     # Swipe left/right
GET    /api/matches/suggestions # Get recommendations
```

### Payments
```
POST   /api/payments/intent   # Create payment intent
POST   /api/webhooks/stripe   # Stripe webhooks
```

### NEW - Video/Voice Calls
```
POST   /api/calls/create      # Create call room
GET    /api/calls/[id]        # Get call details
PATCH  /api/calls/[id]/status # Update call status
```

### NEW - Stories
```
GET    /api/stories           # Get active stories
POST   /api/stories           # Create story
POST   /api/stories/[id]/view # Record story view
DELETE /api/stories/[id]      # Delete story
```

---

## 🧪 TESTING CHECKLIST

**Basic Setup:**
```bash
✓ Run setup script
✓ Start Supabase
✓ Run migrations (including new features)
✓ Start dev servers
✓ Install new packages (pnpm install)
```

**Core Features:**
```bash
✓ Create test account
✓ Test login/logout
✓ Test profile creation
✓ Test matching (swipe)
✓ Test chat messaging
✓ Test booking creation
✓ Test AI chat
✓ Test payments (Stripe test mode)
```

**NEW Features (2025-01-14):**
```bash
✓ Test emoji reactions on messages
✓ Test voice message recording
✓ Test video/audio calling
✓ Test typing indicators
✓ Test GIF sending (Giphy)
✓ Test story posting & viewing
```

---

## 🐛 COMMON ISSUES

| Issue | Solution |
|-------|----------|
| Port in use | `lsof -ti:3000 \| xargs kill -9` |
| Module not found | `pnpm clean && pnpm install` |
| Database error | `pnpm db:reset` |
| Supabase not starting | Check Docker is running |
| Type errors | `pnpm build` to see all errors |

---

## 📚 DOCUMENTATION

| Document | Location |
|----------|----------|
| Setup Guide | `CURSOR_SETUP.md` |
| Expert Analysis | `ZENITH_EXPERT_CRITIQUE/SETUP_CRITIQUE_EXPERT_ANALYSIS.md` |
| Database Schema | `ZENITH_EXPERT_CRITIQUE/DATABASE_IMPROVEMENTS.sql` |
| Security Guide | `ZENITH_EXPERT_CRITIQUE/SECURITY_HARDENING.md` |
| Production Checklist | `ZENITH_EXPERT_CRITIQUE/PRODUCTION_LAUNCH_CHECKLIST.md` |
| Implementation Guide | `ZENITH_EXPERT_CRITIQUE/IMPLEMENTATION_GUIDE.md` |

---

## 🚀 DEPLOYMENT

```bash
# Deploy to Vercel
vercel --prod

# Deploy API to Railway
railway up

# Push database changes
supabase db push
```

---

## 💡 QUICK TIPS

1. **Use Turborepo filtering** to work on single apps:
   ```bash
   pnpm dev --filter=@zenith/web
   ```

2. **Use Supabase Studio** for database management:
   ```
   http://localhost:54323
   ```

3. **Use FastAPI docs** for API testing:
   ```
   http://localhost:8000/docs
   ```

4. **Use Cursor AI** for code generation:
   ```
   Select code → Ask Cursor to refactor/explain/optimize
   ```

5. **Check logs** for debugging:
   ```bash
   # Terminal shows all app logs in parallel
   # Filter by app name in output
   ```

---

## 🎯 DAILY WORKFLOW

```bash
# Morning
pnpm db:start
pnpm dev

# Development
# Use Cursor AI to implement features
# Test in browser
# Check database in Supabase Studio

# Before commit
pnpm lint
pnpm test

# End of day
git add .
git commit -m "feat: description"
git push
```

---

## 🔗 USEFUL LINKS

**Documentation:**
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Turborepo Docs:** https://turbo.build/repo/docs

**UI Libraries:**
- **shadcn/ui:** https://ui.shadcn.com
- **Radix UI:** https://radix-ui.com
- **Lucide Icons:** https://lucide.dev
- **Tailwind CSS:** https://tailwindcss.com
- **Framer Motion:** https://framer.com/motion

**Services:**
- **Stripe Testing:** https://stripe.com/docs/testing
- **Daily.co Docs:** https://docs.daily.co
- **Giphy API:** https://developers.giphy.com
- **Google Gemini:** https://ai.google.dev

---

## 📦 QUICK INSTALL COMMANDS

**Add new Radix primitive:**
```bash
pnpm add @radix-ui/react-{component-name}
```

**Add shadcn/ui component:**
```bash
npx shadcn-ui@latest add {component-name}
```

**Add icons:**
```bash
pnpm add lucide-react  # Already installed
```

**Add animation:**
```bash
pnpm add framer-motion  # Already installed
```

---

## 🎨 COMPONENT USAGE EXAMPLES

**Emoji Reactions:**
```tsx
import { MessageReactions } from '@/components/chat/MessageReactions'

<MessageReactions
  messageId="msg-123"
  currentUserId="user-456"
/>
```

**Voice Recording:**
```tsx
import { VoiceRecorder } from '@/components/chat/VoiceRecorder'

<VoiceRecorder
  onRecordingComplete={async (url, duration) => {
    await sendVoiceMessage(url, duration)
  }}
/>
```

**Video Call:**
```tsx
import { VideoCall } from '@/components/chat/VideoCall'

<VideoCall
  roomUrl="https://your-domain.daily.co/room-name"
  userName="John Doe"
  onLeave={() => router.push('/messages')}
/>
```

**Typing Indicator:**
```tsx
import { TypingIndicator, useTypingIndicator } from '@/components/chat/TypingIndicator'

// Display indicator
<TypingIndicator
  conversationId="conv-123"
  currentUserId="user-456"
  otherUserName="Jane"
/>

// Broadcast typing
const { handleTyping, stopTyping } = useTypingIndicator('conv-123', 'user-456')

<input
  onChange={handleTyping}
  onBlur={stopTyping}
/>
```

---

**Keep this page handy while developing! 📌**

*Last updated: 2025-01-14*
*Added: Video/voice calling, emoji reactions, voice messages, typing indicators, stories, GIF support*
