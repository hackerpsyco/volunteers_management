# WesFellow Hub

A comprehensive platform for managing volunteers, sessions, curriculum, and feedback. Built with modern web technologies, WesFellow Hub provides a seamless experience for administrators, facilitators, and coordinators.

## 🚀 Technlogy Stack

- **Frontend Framework:** [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/)
- **Backend & Auth:** [Supabase](https://supabase.com/)
- **State Management & Data Fetching:** [TanStack Query](https://tanstack.com/query/latest)
- **Routing:** [React Router](https://reactrouter.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

## ✨ Key Features

### 1. 🔐 Authentication & Roles
- **Secure Login:** Email/password authentication via Supabase.
- **Role-Based Access Control (RBAC):**
    - **Admin:** Full access to all features, including sensitive data like session recordings and feedback details.
    - **Facilitator/Coordinator:** Access to operational features (calendar, sessions, curriculum) but restricted from admin-only areas.
- **User Profiles:** Manage operational details and roles.

### 2. 📊 Dashboard
- **Real-time Stats:** Overview of total volunteers, sessions, centres, and facilitators.
- **Session Status:** Visual breakdown of sessions (Pending, Committed, Available, Completed).
- **Quick Actions:** Shortcuts to create new sessions, topics, facilitators, or volunteers.

### 3. 📅 Session Management
- **Calendar View:** Schedule and view sessions in a calendar interface.
- **Session Details:** Comprehensive view of session status, timing, and assigned personnel.
- **Recording:** Admins can record session data and track hours (Admin Only).
- **Feedback:** Collect and view feedback for sessions (Details restricted to Admin).

### 4. 📚 Curriculum & Classes
- **Curriculum Library:** Manage and access educational content and categories.
- **Class Management:** Organize classes and track student performance.
- **Student Performance:** Monitor progress and attendance.

### 5. 👥 People Management
- **Volunteers:** Directory of volunteers with "Add Volunteer" functionality.
- **Facilitators & Coordinators:** Manage staff roles and assignments.
- **Centres:** Manage locations and slots.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd volunteers_management
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment Setup**
   A `.env` file is required with Supabase credentials.
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔒 Security

- **Protected Routes:** Pages are protected ensuring only authenticated users access the dashboard.
- **Role Verification:** Critical pages like Session Recording and Feedback Details perform an additional check for Admin `role_id` before granting access.

## 📁 Project Structure

- `src/pages`: Main application views (Dashboard, Sessions, etc.)
- `src/components`: Reusable UI components
- `src/integrations/supabase`: Database client and configuration
- `src/hooks`: Custom React hooks
