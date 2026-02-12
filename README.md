# GiftTracker - Comprehensive Gift Management Application

A modern, fully-featured gift tracking application built with React, TypeScript, Tailwind CSS, and Supabase. Track birthdays, manage gift ideas, and receive timely email reminders to never miss a special occasion.

## Features

### Authentication & Security
- Email/password registration with strong password requirements (8+ characters, mixed case, numbers)
- Secure login with session management
- Row-level security policies ensuring users only access their own data
- Protected routes preventing unauthorized access

### Dashboard
- Welcome overview with quick statistics
- Total recipients, upcoming birthdays this month, and gift ideas count
- Upcoming birthdays in chronological order (next 60 days)
- Visual countdown with color-coded urgency indicators
- Quick navigation to recipient details

### Recipients Management
- **Create**: Add new gift recipients with full details
  - Name (2-50 characters)
  - Birthday (date picker)
  - Relationship (Family, Friend, Colleague, Other)
  - Tags (comma-separated interests/preferences)
  - Notes (up to 500 characters)
- **Read**: Browse all recipients with search and sort functionality
  - Search by name, relationship, or tags
  - Sort by name, birthday, relationship, or gift ideas count
  - View recipients in responsive table format
- **Update**: Edit recipient information anytime
- **Delete**: Remove recipients with confirmation (cascades to gift ideas)

### Gift Ideas Management
- Track multiple gift ideas per recipient
- Fields for each gift idea:
  - Title (required)
  - Estimated cost (optional)
  - Purchase status (checkbox)
  - Additional notes
- Visual indication of purchased vs. unpurchased items
- Quick-add modal for adding gift ideas from recipient detail page
- Automatic cost calculation for unpurchased items

### Recipient Detail Page
- Comprehensive profile view with:
  - Full recipient information
  - Age calculation
  - Next birthday countdown
  - Gift summary statistics
  - Complete gift ideas list
  - Edit and delete options

### Email Notifications
- Automated birthday reminders via email
- Three notification tiers:
  - 14 days before birthday
  - 7 days before birthday
  - 1 day before birthday
- Smart duplicate prevention (only one email per tier per day)
- Configurable notifications (enable/disable in settings)
- Gift ideas preview in email templates

### Data Management
- **Export**: Download your data in JSON or CSV format
  - JSON: Complete data structure for backup
  - CSV: Spreadsheet format for analysis or migration
- **Import**: Upload previously exported data
  - File validation and preview before import
  - Duplicate recipient detection
  - Batch import with success/failure reporting

### Settings & Preferences
- Notification preferences toggle
- Account email display
- Data import/export functionality
- Secure logout

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Backend**: Supabase Edge Functions
- **Deployment-Ready**: Vite build optimization

## Database Schema

### profiles
- User profile information and preferences
- Stores timezone and notification settings
- Links to Supabase auth.users

### recipients
- Gift recipient information per user
- Fields: id, user_id, name, birthday, relationship, tags, notes
- Indexes on user_id and birthday for performance

### gift_ideas
- Gift suggestions associated with recipients
- Fields: id, recipient_id, title, estimated_cost, purchased, notes
- Cascades delete on recipient deletion

### notification_log
- Tracks sent birthday notifications
- Prevents duplicate emails
- Fields: id, user_id, recipient_id, notification_type, sent_date

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Supabase project (already configured)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are pre-configured in `.env`:
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

Build outputs to the `dist/` directory.

### Type Checking

Run TypeScript compiler:
```bash
npm run typecheck
```

## File Structure

```
src/
├── components/
│   ├── Button.tsx              # Reusable button component
│   ├── Layout.tsx              # Main application layout with navigation
│   ├── Modal.tsx               # Modal dialog component
│   ├── ProtectedRoute.tsx       # Route protection wrapper
│   ├── RecipientForm.tsx        # Form for adding/editing recipients
│   └── Toast.tsx               # Notification system
├── contexts/
│   └── AuthContext.tsx          # Authentication state management
├── lib/
│   └── supabase.ts             # Supabase client configuration and types
├── pages/
│   ├── AddRecipient.tsx         # Add new recipient page
│   ├── Dashboard.tsx            # Dashboard/home page
│   ├── EditRecipient.tsx        # Edit recipient page
│   ├── Login.tsx                # Login page
│   ├── RecipientDetail.tsx      # Recipient profile and gift ideas
│   ├── Recipients.tsx           # Recipients list with search/sort
│   ├── Register.tsx             # Registration page
│   └── Settings.tsx             # Settings and data management
├── utils/
│   ├── dates.ts                # Date calculation utilities
│   └── validation.ts           # Form validation functions
├── App.tsx                      # Main application with routing
├── main.tsx                     # React DOM render entry
└── index.css                    # Global styles

supabase/
└── functions/
    └── send-birthday-notifications/
        └── index.ts             # Edge Function for email notifications
```

## Key Features Explained

### Birthday Calculations
- Automatically calculates next birthday regardless of year
- Counts down days until birthday
- Identifies birthdays in current month
- Sorts upcoming birthdays chronologically

### Password Requirements
Registration enforces:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Real-time validation feedback

### Email Notifications
The Edge Function (`send-birthday-notifications`) runs periodically to:
1. Find recipients with birthdays matching the notification tiers (14, 7, 1 day)
2. Check user notification preferences
3. Verify notification hasn't already been sent today
4. Fetch gift ideas and generate HTML email
5. Send email and log the notification
6. Prevent duplicates via notification_log table

### Row-Level Security (RLS)
Every table has RLS policies ensuring:
- Users can only read their own data
- Users can only create/update/delete their own recipients and gift ideas
- Gift ideas are accessible only through authorized recipients

### Import/Export
- **Export**: Generates downloadable backup files
- **Import**: Validates and previews before importing
- Supports both JSON (complete backup) and CSV (spreadsheet)
- Handles edge cases like duplicate names and missing fields

## Sample Data

To test the application, you can import sample data in JSON format:

```json
{
  "recipients": [
    {
      "name": "Sarah Johnson",
      "birthday": "1988-03-15",
      "relationship": "Family",
      "tags": "cooking, gardening, tea",
      "notes": "Loves organic products"
    },
    {
      "name": "Mike Chen",
      "birthday": "1992-07-22",
      "relationship": "Friend",
      "tags": "photography, hiking, coffee",
      "notes": "New mirrorless camera enthusiast"
    }
  ],
  "giftIdeas": []
}
```

## Usage Guide

### Adding a Recipient
1. Click "Add Recipient" button or navigate to `/recipients/new`
2. Fill in recipient details (name, birthday, relationship required)
3. Add tags for interests and preferences
4. Include notes about their preferences
5. Click "Create Recipient"

### Managing Gift Ideas
1. Open recipient detail page
2. Click "Add Idea" button
3. Enter gift title and optional cost
4. Add notes about the gift
5. Check checkbox to mark as purchased
6. Purchased items show as struck-through

### Searching and Filtering
1. Use search bar to filter by name, relationship, or tags
2. Use sort dropdown to arrange recipients
3. Filters are case-insensitive and apply in real-time

### Exporting Data
1. Go to Settings page
2. Click "Export as JSON" or "Export as CSV"
3. File downloads automatically with date stamp

### Importing Data
1. Go to Settings page
2. Click "Import Data"
3. Select JSON or CSV file
4. Review preview of recipients to import
5. Confirm import

## Troubleshooting

### Authentication Issues
- Ensure password meets all requirements (8+ chars, mixed case, numbers)
- Check that email hasn't already been registered
- Clear browser cache if login state seems stuck

### Recipients Not Showing
- Check that you're logged in to the correct account
- Verify recipients were created in your current session
- Try refreshing the page

### Email Notifications Not Received
- Verify notifications are enabled in Settings
- Check spam/junk folder
- Ensure birthday dates are set correctly
- Note: Notifications send once per day per tier

### Export/Import Issues
- For CSV: Ensure proper formatting with quoted fields
- For JSON: Validate JSON syntax
- Check file size (most imports are fast unless very large)

## Performance Optimizations

- Database indexes on frequently queried columns (user_id, birthday)
- Pagination ready (can be added to recipients list)
- Image optimization via Lucide icons (SVG)
- Code splitting with Vite for faster page loads
- Skeleton loading states during data fetches

## Security Considerations

- All data isolation via RLS policies
- No sensitive data in localStorage
- Supabase handles password hashing
- Edge Function for email prevents API key exposure
- CORS properly configured

## Future Enhancements

Potential features for future versions:
- Birthday wish lists (links to Amazon, Etsy, etc.)
- Photo gallery per recipient
- Recurring notifications for similar birthdays
- Budget tracking per recipient
- Wishlist sharing with friends/family
- Calendar view of all birthdays
- Advanced analytics and spending reports
- Mobile app version

## Support & Contributing

For issues or feature requests, refer to the application logs and error messages for debugging. The application includes comprehensive error handling and user-friendly feedback for all operations.

## License

This project is provided as-is for personal and commercial use.

---

Built with React, Supabase, and Tailwind CSS. Manage your gift giving with style and never forget a birthday again!
