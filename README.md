# Workplace Issues Tracker

A fullstack web application for tracking and managing workplace issues with role-based access control, built with React, Tailwind CSS, and Lovable Cloud.

## Features

### Authentication & Security
- **Secure Authentication**: Email/password login with automatic email confirmation
- **Password Reset Flow**: Complete forgot password functionality via email
- **Remember Me**: Persistent sessions for returning users
- **Role-Based Access Control (RBAC)**: Four user roles with different permissions
  - **Reporter**: Can create and view issues
  - **Technician**: Can update all issues
  - **Manager**: Can access analytics and delete issues
  - **Admin**: Full system access including user management
- **Protected Routes**: Pages automatically restricted based on user role
- **Secure Session Management**: Automatic session handling and refresh

### Issue Management
- **Complete CRUD**: Create, view, edit, and delete workplace issues
- **Rich Details**: Track date, title, description, component, operator, priority, status
- **File Attachments**: Upload, download, and manage files (max 10MB per file)
- **Comments**: Collaborate with threaded comments on each issue
- **Activity Logs**: Automatic tracking of all changes (who, what, when)
- **Notifications**: Optional email notification flag per issue
- **Advanced Filtering**: Search and filter by status, priority, department

### Dashboard & Analytics
- **Real-time Statistics**: Live overview of issue counts and status
- **Interactive Charts**: Bar charts and pie charts for data visualization
- **Department Analytics**: Track issues by department and component
- **Role-Specific Views**: Managers and admins see additional analytics

### User Experience
- **Optimistic Updates**: Instant UI feedback with React Query
- **Mobile Responsive**: Fully responsive design for all devices
- **Brand Consistency**: Company colors (#242c7d, #2a5382, etc.) and Inter font throughout
- **Loading States**: Smooth loading indicators and transitions
- **Error Handling**: User-friendly error messages and validation

## Technology Stack

### Frontend
- **React 18** with TypeScript - Type-safe modern UI
- **React Router** - Client-side routing with protected routes
- **React Query** - Data fetching with optimistic updates
- **Tailwind CSS** - Utility-first styling with custom design tokens
- **Shadcn/ui** - Beautiful, accessible component library
- **Recharts** - Interactive data visualization
- **Sonner** - Toast notifications
- **Lucide React** - Consistent iconography

### Backend (Lovable Cloud)
- **PostgreSQL** - Relational database with custom types
- **Row Level Security (RLS)** - Database-level security with role-aware policies
- **Supabase Auth** - Authentication with email/password and password reset
- **File Storage** - Secure attachment storage with access controls
- **Database Functions** - Helper functions for role checking and activity logging
- **Triggers** - Automatic profile creation and activity tracking

## Getting Started

### Prerequisites

- Node.js 18+ and npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   Navigate to `http://localhost:8080`

### First Time Setup

1. **Create an account**: Sign up with your email and password
2. **Default role**: New users are assigned the "Reporter" role
3. **Upgrade to Admin**: In Lovable Cloud → Database → user_roles table, manually change your role to 'admin'
4. **Manage users**: Access the Admin page to assign roles to other users

## User Roles & Permissions

### Reporter (Default)
- ✅ View dashboard
- ✅ Create new issues
- ✅ View all issues
- ✅ Edit own issues
- ✅ Delete own issues
- ✅ Add comments and attachments
- ❌ Access analytics
- ❌ Manage users

### Technician
- ✅ All Reporter permissions
- ✅ **Update any issue** (not just own)
- ❌ Access analytics
- ❌ Delete others' issues

### Manager
- ✅ All Technician permissions
- ✅ **Access analytics dashboard**
- ✅ **Delete any issue**
- ❌ Manage users

### Admin
- ✅ All Manager permissions
- ✅ **Manage user roles**
- ✅ Full system access

## Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components (Shadcn)
│   ├── Layout.tsx             # Main layout with role-based navigation
│   └── ProtectedRoute.tsx     # Route protection HOC
├── contexts/
│   └── AuthContext.tsx        # Auth state and role management
├── hooks/
│   ├── useIssues.ts          # React Query hooks for issues
│   ├── useAttachments.ts     # File upload/download hooks
│   └── useActivityLogs.ts    # Activity tracking hooks
├── pages/
│   ├── Auth.tsx              # Login/Signup with forgot password
│   ├── ResetPassword.tsx     # Password reset page
│   ├── Dashboard.tsx         # Main dashboard with stats
│   ├── Issues.tsx            # Issues list with filters
│   ├── IssueDetail.tsx       # Individual issue view
│   ├── IssueForm.tsx         # Create/Edit issue form
│   ├── Analytics.tsx         # Analytics (Manager/Admin only)
│   ├── Admin.tsx             # User management (Admin only)
│   └── NotFound.tsx          # 404 page
├── integrations/
│   └── supabase/             # Lovable Cloud client (auto-generated)
├── App.tsx                   # Main app with route protection
└── index.css                 # Global styles and design tokens
```

## Database Schema

### Core Tables
- **profiles** - User profiles (auto-created on signup)
- **user_roles** - User role assignments with RLS
- **issues** - Workplace issues with all tracking fields
- **comments** - Issue comments for collaboration
- **attachments** - File attachment metadata
- **activity_logs** - Automatic change tracking

### Security Features
- All tables have Row Level Security (RLS) enabled
- Role-aware policies using security definer functions
- Automatic triggers for profile creation and activity logging
- Secure file storage with user-specific access controls

## Authentication Flows

### Sign Up
1. User enters email, password, and full name
2. Account created with email auto-confirmed (for testing)
3. Profile automatically created in database
4. Default "Reporter" role assigned
5. User redirected to dashboard

### Sign In
1. User enters email and password
2. Optional "Remember me" checkbox
3. Session persisted securely
4. User role fetched and cached
5. Redirected to dashboard with role badge

### Forgot Password
1. User clicks "Forgot password?" on login page
2. Enters email address
3. Receives password reset link via email
4. Clicks link to access reset page
5. Sets new password
6. Redirected to login

## Design System

### Colors (HSL Values)
All colors use the company's blue palette defined in `src/index.css`:

- **Primary**: #242c7d (Deep navy) - Main brand color
- **Secondary**: #2a5382 (Medium blue) - Secondary actions
- **Accent**: #2c5d85 (Teal blue) - Highlights
- **Success**: Green for resolved issues
- **Warning**: Orange for high priority
- **Info**: Blue for in-progress status

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- Consistent sizing and spacing throughout

### Components
All components use semantic tokens from the design system:
- No hardcoded colors (e.g., text-white, bg-blue-500)
- Custom badge variants for status and priority
- Branded buttons and cards
- Consistent border radius and shadows

## Key Features Explained

### Optimistic Updates
Uses React Query for instant UI feedback:
- Issue creation appears immediately
- Updates reflect before server confirms
- Automatic rollback on errors
- Background refetching keeps data fresh

### File Attachments
Secure file handling:
- Upload to Lovable Cloud storage
- Files organized by issue ID
- Download with single click
- Only uploaders can delete their files
- 10MB file size limit

### Activity Logging
Automatic change tracking:
- Triggers log every create/update
- Shows who made what changes
- Timeline view on issue detail page
- Helps with audit trails

### Role-Based Access
Smart route protection:
- Routes check user role automatically
- Friendly "Access Denied" messages
- Navigation hides unauthorized pages
- Role badge visible in header

## Backend Management

Access your Lovable Cloud backend:

1. Open your Lovable project
2. Click "Cloud" in the sidebar
3. Manage:
   - Database tables and records
   - User accounts and roles
   - File storage
   - Authentication logs
   - Application usage

### Manual Role Assignment

Until you have an admin user:
1. Go to Cloud → Database → user_roles
2. Find your user_id from profiles table
3. Update your role to 'admin'
4. Refresh the app

## Security Considerations

### Implemented
✅ Row Level Security on all tables
✅ Security definer functions for role checks
✅ Protected routes based on user role
✅ Secure session management
✅ File storage access controls
✅ Input validation on forms
✅ XSS protection via React
✅ CSRF protection via Supabase

### Recommended
- Enable leaked password protection in Cloud settings
- Review and customize RLS policies for your use case
- Set up email templates for password reset
- Configure production email provider (not Resend test domain)
- Add rate limiting on API endpoints
- Enable 2FA for admin accounts

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Roles
1. Update the user_role enum in database migration
2. Add role to AuthContext type definition
3. Update RLS policies as needed
4. Add role-specific routes in App.tsx

### Customizing Permissions
Edit RLS policies in Lovable Cloud:
- Go to Cloud → Database → Tables
- Select table → Policies
- Modify or add policies using helper functions

## Deployment

Deploy via Lovable:
1. Go to your [Lovable project](https://lovable.dev/projects/b2080ce4-51e8-42cb-854b-fbddec768f48)
2. Click "Publish"
3. Your app deploys with custom domain option

### Custom Domain
1. Project > Settings > Domains
2. Click "Connect Domain"
3. Follow DNS configuration steps

## Troubleshooting

### "Access Denied" on All Pages
- Check that user role was assigned in user_roles table
- Verify RLS policies are not blocking access
- Check browser console for errors

### Password Reset Not Working
- Verify email configuration in Cloud → Authentication
- Check spam folder for reset emails
- Ensure redirect URL is correct

### Files Not Uploading
- Check file size (max 10MB)
- Verify storage bucket exists (issue-attachments)
- Check storage policies in Cloud

### Role Not Updating
- Clear browser cache and refresh
- Check user_roles table for correct user_id
- Verify only one role per user

## Future Enhancements

- [ ] Email notifications via Resend integration
- [ ] PDF report generation
- [ ] Excel export functionality
- [ ] Issue assignment workflows
- [ ] SLA tracking and alerts
- [ ] Mobile app (PWA)
- [ ] Bulk operations on issues
- [ ] Custom fields per department
- [ ] Issue templates
- [ ] Advanced search with saved filters

