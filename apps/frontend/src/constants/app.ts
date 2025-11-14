// Application-wide constants

// Age constraints
export const MIN_AGE = 18;
export const MAX_AGE = 80;
export const DEFAULT_MIN_AGE = 18;
export const DEFAULT_MAX_AGE = 50;

// Distance constraints (km)
export const MIN_DISTANCE = 1;
export const MAX_DISTANCE = 100;
export const DEFAULT_DISTANCE = 10;

// Location refresh intervals (ms)
export const LOCATION_REFRESH_INTERVAL = 30000; // 30 seconds
export const PRESENCE_UPDATE_INTERVAL = 60000; // 1 minute

// Typing indicator timeout (ms)
export const TYPING_INDICATOR_TIMEOUT = 3000; // 3 seconds

// Input validation limits
export const MAX_EMAIL_LENGTH = 254; // RFC 5321 compliant
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_NAME_LENGTH = 100;
export const MAX_BIO_LENGTH = 500;
export const MAX_MESSAGE_LENGTH = 2000;

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_NEARBY_USERS = 50;

// File upload limits
export const MAX_PHOTO_SIZE_MB = 10;
export const MAX_PHOTOS_COUNT = 6;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Tribes/Categories
export const TRIBES = [
  "Bear", "Otter", "Twink", "Jock", "Geek",
  "Leather", "Daddy", "Poz", "Clean-Cut", "Rugged"
] as const;

// Meeting types
export const MEETING_TYPES = [
  { id: 'coffee', label: 'Coffee' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'activity', label: 'Activity' },
  { id: 'video', label: 'Video Call' },
  { id: 'phone', label: 'Phone Call' },
] as const;

// Time slots for bookings
export const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
] as const;
