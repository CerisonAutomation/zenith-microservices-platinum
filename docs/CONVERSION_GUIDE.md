# pH7Builder to Zenith Feature Conversion

## Phase 1: User Management Extraction

### Database Schema Analysis
pH7Builder uses a comprehensive user management system with:
- `ph7_members` - Core user data (email, username, password, profile info)
- `ph7_members_info` - Extended profile information
- `ph7_members_friends` - Friend connections
- `ph7_members_who_views` - Profile view tracking

### FastAPI Endpoints to Create
```python
# User Registration & Authentication
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET /api/v1/auth/profile

# User Profile Management
GET /api/v1/users/{user_id}
PUT /api/v1/users/{user_id}
GET /api/v1/users/search

# Friend System
GET /api/v1/friends
POST /api/v1/friends/{user_id}/add
DELETE /api/v1/friends/{user_id}/remove
```

### React Components to Create
- `UserProfile.jsx` - Profile display and editing
- `UserSearch.jsx` - Search and discovery interface
- `FriendList.jsx` - Friend management
- `AuthForm.jsx` - Registration and login forms

## Phase 2: Social Features Extraction

### Dating/Social Features
- Profile matching algorithms
- Messaging system
- Photo/video galleries
- Blog/notes functionality
- Forum discussions

### Conversion Strategy
1. Extract PHP models and business logic
2. Convert to Python/FastAPI endpoints
3. Create React components
4. Integrate with existing Zenith booking system

## Next Immediate Steps
1. Create FastAPI user management endpoints
2. Build React user profile components
3. Test integration with existing Zenith frontend
4. Extract messaging system

## Files to Create
- `zenith_production_ready/app/api/v1/users.py` - User endpoints
- `zenith_production_ready/app/models/users.py` - User models
- `frontend/src/components/UserProfile.jsx` - Profile component
- `frontend/src/pages/UserDiscoveryPage.jsx` - User discovery page