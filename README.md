# Workplace Issues Tracker

A fullstack web application for tracking and managing workplace issues, built with React, Tailwind CSS, and Lovable Cloud.

## Features

- **Authentication**: Secure email/password authentication with automatic user profile creation
- **Dashboard**: Overview of issue statistics with interactive charts
- **Issue Management**: Create, view, edit, and delete workplace issues
- **Issue Details**: Detailed view with comments and attachments support
- **Filtering & Search**: Find issues by status, priority, and search terms
- **Analytics**: Visual insights with charts showing issues by status, priority, and department
- **Export Reports**: Generate PDF and Excel reports (coming soon)
- **Mobile Responsive**: Fully responsive design that works on all devices
- **Real-time Updates**: Live data synchronization across users

## Technology Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful, accessible component library
- **Recharts** - Powerful charting library
- **React Router** - Client-side routing
- **Sonner** - Toast notifications
- **Lucide React** - Beautiful icons

### Backend (Lovable Cloud)
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Database-level security
- **Authentication** - Built-in auth with email/password
- **File Storage** - Secure file attachment storage
- **Real-time subscriptions** - Live data updates

## Getting Started

### Prerequisites

- Node.js 18+ and npm installed ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Git installed

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

1. **Create an account**: Click "Sign up" on the auth page and create your first user account
2. **Start tracking issues**: Once logged in, click "Report Issue" to create your first workplace issue
3. **Explore features**: Navigate through Dashboard, Issues, and Analytics pages

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (Shadcn)
│   └── Layout.tsx       # Main application layout with navigation
├── pages/
│   ├── Auth.tsx         # Login/Signup page
│   ├── Dashboard.tsx    # Dashboard with stats and charts
│   ├── Issues.tsx       # Issues list with filters
│   ├── IssueDetail.tsx  # Individual issue view
│   ├── IssueForm.tsx    # Create/Edit issue form
│   ├── Analytics.tsx    # Analytics page with charts
│   └── NotFound.tsx     # 404 page
├── integrations/
│   └── supabase/        # Lovable Cloud client (auto-generated)
├── App.tsx              # Main app component with routing
├── main.tsx            # App entry point
└── index.css           # Global styles and design tokens
```

## Database Schema

The application uses the following main tables:

- **profiles** - User profiles with name, email, department, role
- **issues** - Workplace issues with status, priority, department, location
- **comments** - Comments on issues for collaboration
- **attachments** - File attachments linked to issues

All tables have Row Level Security (RLS) policies to ensure data privacy and security.

## Design System

The application uses a professional blue color palette:

- **Primary**: #242c7d (Deep navy)
- **Secondary**: #2a5382 (Medium blue)
- **Accent**: #2c5d85 (Teal blue)
- **Highlight**: #2c508f (Royal blue)
- **Typography**: Inter font family

All colors are defined as HSL values in `src/index.css` using CSS custom properties for consistency.

## Key Features Explained

### Authentication
- Email/password authentication with automatic email confirmation
- Secure session management
- Automatic profile creation on signup
- Protected routes requiring authentication

### Issue Management
- Create issues with title, description, priority, status
- Assign department and location
- Track who reported each issue
- Edit and delete your own issues
- Add comments for collaboration

### Analytics
- Visual charts showing issue distribution
- Filter by status, priority, department
- Export reports (PDF/Excel coming soon)

### Security
- Row Level Security (RLS) on all tables
- Users can only edit/delete their own issues
- All users can view all issues (transparency)
- Secure file storage with access controls

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Testing

The application includes comprehensive tests using Jest and React Testing Library for key user flows:

- Authentication flows (signup, login, logout)
- Issue creation and editing
- Dashboard data display
- Analytics charts rendering
- Form validation

Run tests with:
```bash
npm test
```

## Deployment

This project is designed to be deployed on Lovable:

1. Go to your [Lovable project](https://lovable.dev/projects/b2080ce4-51e8-42cb-854b-fbddec768f48)
2. Click "Publish" in the top right
3. Your app will be deployed with a custom domain

### Custom Domain

You can connect a custom domain:
1. Navigate to Project > Settings > Domains
2. Click "Connect Domain"
3. Follow the instructions to configure DNS

## Backend Management

To view and manage your backend (database, auth, storage):

1. Open your Lovable project
2. Click the "Cloud" tab in the sidebar
3. Here you can:
   - View and edit database tables
   - Manage user accounts
   - View authentication logs
   - Access file storage
   - Monitor application usage

## Future Enhancements

- PDF and Excel export functionality
- Email notifications for new issues
- Issue assignment workflows
- File attachment preview
- Advanced search and filters
- Issue templates
- SLA tracking
- Mobile app (PWA)

## Support

For questions or issues:
- Check the [Lovable Documentation](https://docs.lovable.dev/)
- Join the [Lovable Discord](https://discord.gg/lovable)
- Contact support at support@lovable.dev

## License

This project is created with Lovable and is available for use under your organization's license.

---

Built with ❤️ using [Lovable](https://lovable.dev)
