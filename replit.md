# FINANZAS PRO EMPRESA - Sistema Integral de Gestión de Gastos y Finanzas

## Overview

This is a full-stack financial management application built for small/medium businesses. The application provides comprehensive financial tracking including expenses, income, bank accounts, and loans management. It features a modern React frontend with Express.js backend, PostgreSQL database with Drizzle ORM, and includes plans for Telegram bot integration for remote transaction recording.

## Recent Changes (July 10, 2025)

- ✓ Added "third party" field to transaction schema for tracking money recipients/providers
- ✓ Updated transaction creation modal with dynamic third party input field
- ✓ Fixed sidebar DOM nesting warnings by replacing anchor tags with spans
- ✓ Enhanced transaction table to display third party information
- ✓ Improved error handling and debugging in transaction creation
- ✓ Confirmed admin category management panel is fully functional in settings page

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with Tailwind CSS for styling
- **Design System**: shadcn/ui component library with "new-york" style variant

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with JSON responses
- **Middleware**: Express middleware for logging, CORS, and error handling
- **Session Management**: Express sessions (configured for PostgreSQL storage)

### Data Layer
- **Database**: PostgreSQL (configured with Replit Database)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Database schema defined in `shared/schema.ts` with push deployment
- **Storage**: DatabaseStorage class implementing complete CRUD operations
- **Validation**: Zod schemas for runtime type validation
- **Seeding**: Initial data includes admin user, default categories, and sample accounts

## Key Components

### Database Schema
The application uses a well-structured PostgreSQL schema with the following main entities:

1. **Users Table**: Authentication and user management with roles (admin/employee)
2. **Categories Table**: Configurable expense/income categories with color coding
3. **Accounts Table**: Bank accounts and loan management with balance tracking
4. **Transactions Table**: Comprehensive transaction recording with receipts support
5. **Telegram Config Table**: Bot configuration for remote access

### Authentication System
- Session-based authentication using Express sessions
- Role-based access control (admin vs employee permissions)
- Secure login/logout functionality with proper session management

### Financial Management Modules
1. **Dashboard**: Overview of financial health with charts and summaries
2. **Transactions**: Full CRUD operations for income and expense tracking
3. **Accounts**: Bank account and loan management
4. **Analytics**: Financial reporting with Chart.js visualizations
5. **Settings**: User profile and category management
6. **Telegram Integration**: Bot configuration (prepared for future implementation)

### UI Components
- Comprehensive component library based on Radix UI primitives
- Custom financial charts using Chart.js and react-chartjs-2
- Responsive design with mobile-first approach
- Modal dialogs for transaction entry and data management

## Data Flow

### Client-Server Communication
1. **Frontend**: React components make HTTP requests using TanStack Query
2. **API Layer**: Express.js routes handle requests and respond with JSON
3. **Database**: Drizzle ORM manages PostgreSQL operations
4. **Validation**: Zod schemas validate data at API boundaries

### State Management
- **Server State**: Managed by TanStack Query with automatic caching and invalidation
- **Local State**: React useState for component-specific state
- **Global State**: Minimal global state, primarily authentication status

### Request Flow
1. User interactions trigger React Query mutations or queries
2. API requests sent to Express.js endpoints with authentication checks
3. Server validates requests using Zod schemas
4. Database operations performed through Drizzle ORM
5. Responses cached by React Query for optimized performance

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router

### UI and Styling
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety across the stack
- **tsx**: TypeScript execution for Node.js

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server for frontend, tsx for backend hot reload
- **Database**: Neon Database PostgreSQL instance
- **Environment Variables**: DATABASE_URL for database connection

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Deployment**: Single-command deployment with `npm run build && npm start`

### Database Management
- **Schema Push**: `npm run db:push` deploys schema changes to PostgreSQL
- **Schema**: Centralized in `shared/schema.ts` with relations for type sharing
- **Connection**: `server/db.ts` configures Neon serverless PostgreSQL
- **Storage Layer**: Complete replacement of MemStorage with DatabaseStorage
- **Initial Data**: Seeded with admin user (admin/demo123), categories, and accounts

### Architecture Benefits
1. **Type Safety**: Full-stack TypeScript with shared schemas
2. **Developer Experience**: Hot reload, fast builds, automatic type checking
3. **Scalability**: Modular architecture with clear separation of concerns
4. **Maintainability**: Consistent patterns and well-structured codebase
5. **Performance**: Optimized builds and efficient state management

The application follows modern full-stack development practices with emphasis on type safety, developer experience, and maintainable code structure. The architecture supports future enhancements like the planned Telegram bot integration and additional financial features.