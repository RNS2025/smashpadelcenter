# Smash Padel Center Application

## Notification System

The application features a comprehensive notification system that works even when the app is not open:

### Tournament Notifications

Users receive notifications about their upcoming tournaments:

- Notifications are sent at 9 AM, 12 PM, and 5 PM daily
- Users with registered tournaments get notified about upcoming events
- The notifications include information about match counts and event dates
- Notifications are delivered even when the app is closed via push notifications

### Match Notifications

Users receive just-in-time notifications for their upcoming matches:

- Notifications are sent 30 minutes before a scheduled match
- The system checks for upcoming matches every 5 minutes
- Match notifications include court information, opponent names, and start time
- These time-sensitive notifications help users prepare for their upcoming matches

### Technical Implementation

The notification system consists of:

1. **Server-Side Components:**

   - Push notification service with username-based subscription
   - Tournament notification scheduler that runs periodically
   - Web push implementation for browser notifications when the app is closed

2. **Client-Side Components:**
   - Service worker for handling push events
   - Notification provider context for in-app notifications
   - Push subscription management in the notification service

### Testing Push Notifications

To test the notification systems manually:

```bash
# Test tournament notifications
node tests/triggerTournamentNotification.js

# Test match notifications (30 minute reminders)
node tests/triggerMatchNotification.js
```

### Generating VAPID Keys

Push notifications use VAPID keys for authentication. To generate new VAPID keys:

```bash
# From the server directory
node scripts/generateVAPIDKeys.js
```

Then update the `.env` file with the new keys.

## Features

- Real-time notifications for tournaments and matches
- Push notifications that work even when the app is closed
- Admin notifications for check-ins
- Customizable notification preferences
