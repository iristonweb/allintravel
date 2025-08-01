# Travel Guide Interactive

## Overview

This is a full-stack interactive travel application that allows users to discover places, connect with fellow travelers, and plan trips. The application provides a comprehensive platform for tourists and travelers to find restaurants, hotels, attractions, and events while offering social features like chat, reviews, and travel companion matching.

The system is built as a modern web application using React for the frontend, Express.js for the backend, and PostgreSQL for data persistence. It features real-time communication through WebSockets, interactive maps, user authentication via Replit's OAuth system, and comprehensive travel-related functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI components with shadcn/ui design system for consistent, accessible interface
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript for type safety across the entire stack
- **Session Management**: Express sessions with PostgreSQL storage for user authentication
- **Real-time Communication**: WebSocket server for live chat functionality
- **API Design**: RESTful endpoints with proper HTTP status codes and error handling

### Data Storage
- **Primary Database**: PostgreSQL with Neon serverless hosting for scalability
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Design**: Relational database with tables for users, places, reviews, trips, events, and chat messages
- **Validation**: Zod schemas for runtime type validation and data integrity

### Authentication System
- **Provider**: Replit OAuth integration for seamless authentication
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Automatic user creation and profile management
- **Security**: HTTP-only cookies with secure session handling

### Key Features Implementation
- **Interactive Map**: Custom map component with place markers and filtering capabilities
- **Social Features**: Real-time chat system, user reviews, and travel companion matching
- **Content Management**: Places database with categories (restaurants, hotels, attractions), events calendar, and user-generated content
- **Search and Discovery**: Advanced filtering by type, rating, price range with pagination

### External Dependencies

- **Database Hosting**: Neon serverless PostgreSQL for managed database infrastructure
- **Authentication**: Replit OAuth system for user authentication and authorization
- **UI Framework**: Radix UI primitives for accessible component foundation
- **Real-time Communication**: Native WebSocket implementation for chat functionality
- **Image Hosting**: Unsplash API integration for placeholder images and content
- **Development Tools**: Vite with React plugins, ESBuild for production bundling
- **Session Store**: PostgreSQL session storage via connect-pg-simple adapter