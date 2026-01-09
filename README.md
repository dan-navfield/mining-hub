# Mining Hub - Tenement Management Platform

A production-ready Phase 1 tenement management platform to replace Landtracker for Western Australia. The app consolidates WA government register data, automates obligation tracking, and generates due diligence packs.

## 🚀 Deployment Status

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/mining-hub)

**Live Demo:** [https://mining-hub.vercel.app](https://mining-hub.vercel.app)  
**API Docs:** [https://mining-hub.vercel.app/api/docs](https://mining-hub.vercel.app/api/docs)

## 🎯 Product Definition

**Audience:** Mining consultants and admins at Hetherington  
**Goal:** Never miss an obligation, and make tenement status and history instantly visible

### Phase 1 Scope
- **Module 1:** Tenement register with comprehensive data management
- **Module 2:** Actions list with automated obligation tracking  
- **Module 3:** Due diligence generator with customizable templates
- **System Services:** Nightly data sync, notifications, reporting, and audit trail

## 🏗️ Architecture

### Tech Stack
- **Frontend:** Next.js 14 with TypeScript, App Router, Tailwind, React Query, TanStack Table, Radix UI, Zod
- **Backend:** NestJS with TypeScript, REST API, OpenAPI docs, class-validator, class-transformer
- **Database:** PostgreSQL 15 with Prisma ORM
- **Jobs:** BullMQ with Redis for background processing
- **Auth:** JWT with OIDC integration (Descope/Azure AD ready)
- **Email:** SendGrid for notifications
- **Storage:** S3 compatible bucket for files
- **Infrastructure:** Monorepo with TurboRepo, Docker, GitHub Actions

### External Data Sources
- **DMIRS-003 Mining Tenements WFS** for spatial and public attributes
- **Mineral Titles Online XML** for detailed rent, expenditure, and Section 29 data

## 📁 Project Structure

```
mining-hub/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # NestJS backend application
├── packages/
│   ├── ui/           # Shared UI components (Radix UI + Tailwind)
│   ├── config/       # Shared configuration (ESLint, Tailwind, TypeScript)
│   ├── types/        # Shared TypeScript types and Zod schemas
│   └── workers/      # BullMQ job processors and queue definitions
└── README.md
```

## 🚀 Quick Start with Supabase

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier available)
- Redis 6+ (for background jobs)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd mining-hub
npm install
```

2. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and keys
   - Run the database migrations in the Supabase SQL editor:
     ```sql
     -- Copy and paste contents of supabase/migrations/001_initial_schema.sql
     -- Then copy and paste contents of supabase/migrations/002_rls_policies.sql
     ```

3. **Set up environment variables:**
```bash
# API environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your Supabase credentials:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Web environment  
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env with your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. **Start Redis (for background jobs):**
```bash
# Option 1: Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Option 2: Install locally (macOS)
brew install redis
brew services start redis
```

5. **Start development servers:**
```bash
npm run dev
```

This starts:
- Web app on http://localhost:3000
- API server on http://localhost:4000
- API docs on http://localhost:4000/api/docs

### Supabase Features Used

- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Built-in auth with email/password
- **Storage**: File uploads for CSV imports and report exports
- **Real-time**: Live updates for tenement and action changes
- **Edge Functions**: Background processing for data sync

## 📊 Data Model

### Core Entities

**Tenement**
- Jurisdiction, number, type, status
- Holder information and key dates
- Area, Section 29 flag, sync metadata
- Assigned consultant

**Action** 
- Type: Anniversary, RentDue, Section29, AdHoc
- Due date, amount, status, assignee
- Source: System-generated or Manual
- Notes and audit trail

**User**
- Role-based access: Administrator, Consultant
- Email, name, creation date

**DueDiligenceRun**
- Template selection and tenement scope
- Output generation status and S3 URI

**AuditEvent**
- Complete change tracking for tenements and actions
- Actor, timestamp, before/after state

## 🔧 Developer Commands

```bash
# Development
npm run dev              # Start all apps in development mode
npm run build           # Build all apps for production
npm run lint            # Lint all packages
npm run test            # Run all tests

# Database
npm run db:migrate      # Run Prisma migrations
npm run db:generate     # Generate Prisma client
npm run db:studio       # Open Prisma Studio
npm run seed            # Load sample data

# Background Jobs
npm run sync:nightly    # Run nightly sync manually

# Individual apps
cd apps/web && npm run dev     # Frontend only
cd apps/api && npm run dev     # Backend only
```

## 🔄 Background Jobs

### Nightly Sync Pipeline
1. **WFS Sync:** Fetch updated tenements from DMIRS WFS service
2. **MTO XML Sync:** Process Mineral Titles Online XML data (when available)
3. **Rules Engine:** Generate system actions based on tenement data

### Reminder System
- Email notifications for upcoming and overdue actions
- Configurable reminder schedules
- User and action type filtering

### Export Generation
- Excel reports with multiple sheets (Summary, Actions, History)
- PDF reports using Handlebars templates
- S3 storage with secure access URLs

## 🎨 UI Components

Built with Radix UI primitives and Tailwind CSS:

- **Data Tables:** Virtualized tables with sorting, filtering, pagination
- **Status Badges:** Color-coded status indicators
- **Date Pickers:** Accessible date selection
- **Empty States:** Helpful messaging for empty data
- **Loading States:** Consistent loading indicators

### Visual Cues
- **Expiring tenements:** Yellow highlight for tenements expiring within 60 days
- **Overdue actions:** Red left border for overdue items
- **Status colors:** Consistent color scheme across all status indicators

## 🔐 Authentication & Authorization

### Development Mode
- Mock authentication for local development
- Automatic admin user creation

### Production Ready
- OIDC integration with Descope or Azure AD
- JWT token-based authentication
- Role-based access control (RBAC)

### Permissions
- **Administrator:** Full system access, user management, sync controls
- **Consultant:** Access to assigned tenements and actions

## 📋 Rules Engine

Declarative rules system for automated action generation:

### Anniversary Rules
- Creates anniversary actions 30 days before due date
- Prevents duplicate actions for same tenement

### Rent Due Rules  
- Derives rent due dates from anniversary dates
- Configurable lead times

### Section 29 Rules
- Triggers compliance actions for flagged tenements
- Annual compliance cycle tracking

### Extensibility
- Plugin architecture for additional jurisdictions
- Custom rule definitions via configuration

## 📈 Monitoring & Observability

### Audit Trail
- Complete change history for all tenements and actions
- User attribution and timestamps
- Before/after state capture

### System Statistics
- Tenement counts by status and jurisdiction
- Action metrics by type and status
- User activity tracking

### Error Handling
- Comprehensive error logging
- Failed job retry mechanisms
- User-friendly error messages

## 🧪 Testing Strategy

### Unit Tests
- Rules engine logic validation
- XML parser functionality
- API endpoint testing

### Integration Tests
- End-to-end due diligence generation
- Database transaction integrity
- External service mocking

### Fixtures
- Realistic sample data for development
- Automated test data generation
- Performance testing datasets

## 🚢 Deployment

### Environment Setup
- **Development:** Local PostgreSQL and Redis
- **Testing:** Containerized services with test data
- **Production:** Managed cloud services with monitoring

### CI/CD Pipeline
- GitHub Actions for automated testing
- Docker containerization
- Environment-specific deployments

## 📝 API Documentation

Interactive API documentation available at `/api/docs` when running the development server.

### Key Endpoints

**Authentication**
- `POST /auth/callback` - OIDC callback handling
- `GET /auth/me` - Current user profile

**Tenements**
- `GET /tenements` - List with filtering and pagination
- `GET /tenements/:id` - Detailed tenement view
- `POST /tenements` - Create new tenement
- `PATCH /tenements/:id` - Update tenement
- `POST /tenements/import/csv` - Bulk CSV import

**Actions**
- `GET /actions` - List with filtering
- `PATCH /actions/:id` - Update action status/notes
- `POST /actions/bulk` - Bulk status updates

**Due Diligence**
- `POST /due-diligence/run` - Generate report
- `GET /due-diligence/:id` - Check generation status

**Admin**
- `GET /admin/sync/status` - Sync pipeline status
- `POST /admin/sync/run` - Manual sync trigger
- `GET /admin/stats` - System statistics

## 🔮 Future Enhancements

### Phase 2 Considerations
- **Multi-jurisdiction support:** NT, QLD, SA expansion
- **Advanced reporting:** Custom report builder
- **Mobile app:** Field data collection
- **GIS integration:** Spatial analysis and mapping
- **Document management:** File attachments and versioning

### Technical Debt
- **Performance optimization:** Database indexing, query optimization
- **Security hardening:** Rate limiting, input validation
- **Monitoring:** Application performance monitoring (APM)
- **Backup strategy:** Automated database backups

## 🤝 Contributing

1. Follow the established code style and patterns
2. Add tests for new functionality
3. Update documentation for API changes
4. Use conventional commit messages
5. Ensure all checks pass before submitting PRs

## 📄 License

Proprietary software for Hetherington Mining Consultants.

---

**Built with ❤️ for the Australian mining industry**
