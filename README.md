# 🎨 Frontend - React Authentication Client

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

A modern React single-page application with authentication, built with Vite, TypeScript, and Tailwind CSS.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Pages & Routes](#-pages--routes)
- [Components](#-components)
- [State Management](#-state-management)
- [API Integration](#-api-integration)
- [Styling](#-styling)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)

---

## 🎯 Overview

This is the frontend application for the Auth React NestJS project. It provides a complete user interface for authentication, user management, and profile editing with a modern, responsive design.

**Key Highlights:**

- ⚡ Lightning-fast development with Vite
- 🎨 Beautiful UI with shadcn/ui and Tailwind CSS
- 🔒 Secure authentication flow with JWT
- 📱 Fully responsive and mobile-friendly
- 🌓 Dark/light mode support
- ✅ Form validation with Zod schemas
- 🚀 Optimized production builds

---

## ✨ Features

### 🔐 Authentication

- **Email/Password Login** - Traditional authentication with validation
- **User Registration** - Multi-step registration with real-time validation
- **Google OAuth** - One-click sign-in with Google
- **Remember Me** - Persistent sessions with refresh tokens
- **Auto-logout** - Token expiration handling
- **Protected Routes** - Automatic redirection for unauthenticated users

### 👥 User Management

- **User List** - Browse all registered users
- **User Profiles** - View detailed user information
- **Profile Editing** - Update personal information
- **Avatar Display** - User avatars with fallback initials
- **Role-based UI** - Different views for different user roles

### 🎨 UI/UX Features

- **Dark/Light Theme** - Toggle between themes with persistence
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Loading States** - Skeleton loaders and spinners
- **Error Handling** - User-friendly error messages
- **Toast Notifications** - Success and error feedback
- **Form Validation** - Real-time input validation
- **Accessibility** - ARIA labels and keyboard navigation

---

## 🛠️ Tech Stack

### Core

- **React** 19.2.0 - Latest React with concurrent features
- **TypeScript** 5.9.3 - Type-safe JavaScript
- **Vite** 7.2.4 - Next-generation frontend tooling

### UI & Styling

- **Tailwind CSS** 3.4.19 - Utility-first CSS framework
- **shadcn/ui** - Radix UI + Tailwind components
- **Radix UI** - Accessible component primitives
  - Dialog, Dropdown Menu, Select
  - Alert Dialog, Avatar, Checkbox
  - Label, Separator, Slot
- **Lucide React** - Beautiful icon library
- **next-themes** - Theme management
- **class-variance-authority** - Variant-based component styling
- **tailwind-merge** - Intelligent class merging

### Forms & Validation

- **React Hook Form** 7.69.0 - Performant form library
- **Zod** 4.2.1 - TypeScript-first schema validation
- **@hookform/resolvers** - Zod integration for React Hook Form

### Routing & HTTP

- **React Router** 7.11.0 - Client-side routing
- **Axios** 1.13.2 - Promise-based HTTP client
- **@react-oauth/google** - Google OAuth integration

### Notifications

- **Sonner** 2.0.7 - Beautiful toast notifications

### Development Tools

- **ESLint** - Code linting with React plugins
- **Prettier** (root) - Code formatting
- **TypeScript ESLint** - TypeScript-specific linting
- **Vite Plugin React** - Fast refresh and JSX support

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥18.0.0
- npm ≥10.9.2
- Backend server running (see root README)

### Installation

1. **Navigate to frontend directory**

   ```bash
   cd apps/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file**

   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   ```env
   VITE_BASE_PATH=/ysr-system-front/
   VITE_API_BASE_URL=http://localhost:3000
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:4000/ysr-system-front/`
   (the port and base path come from `vite.config.ts`).

---

## 📁 Project Structure

```
apps/frontend/
├── public/                    # Static assets
│   └── vite.svg              # App icon
│
├── src/
│   ├── api/                  # API client & endpoints
│   │   ├── axios.ts          # Axios instance configuration
│   │   ├── auth.ts           # Auth API calls
│   │   └── users.ts          # User API calls
│   │
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── avatar.tsx
│   │   │   └── ...
│   │   ├── Header.tsx       # App header with navigation
│   │   ├── ProtectedRoute.tsx # Route guard component
│   │   └── ThemeProvider.tsx  # Theme context provider
│   │
│   ├── context/             # React Context
│   │   └── AuthContext.tsx # Authentication state & actions
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── use-toast.ts    # Toast notification hook
│   │
│   ├── lib/                 # Utility functions
│   │   └── utils.ts        # cn() helper for class merging
│   │
│   ├── pages/               # Route components
│   │   ├── index.ts        # Page exports
│   │   ├── LoginPage.tsx   # Login form with Google OAuth
│   │   ├── RegisterPage.tsx # Registration form
│   │   ├── NotFoundPage.tsx # Catch-all for unknown URLs
│   │   ├── ProfilePage.tsx # User profile & edit
│   │   └── UsersPage.tsx   # User directory
│   │
│   ├── utils/               # Helper utilities
│   │   └── validators.ts   # Zod schemas (if applicable)
│   │
│   ├── utiles/             # Shared helpers
│   │   ├── axios.js        # HTTP client, base URL, auth interceptor
│   │   └── fileUtils.js    # Rewrites /uploads paths to the API origin
│   │
│   ├── App.tsx             # Main app component with routing
│   ├── App.css             # Global component styles
│   ├── main.tsx            # Application entry point
│   └── index.css           # Tailwind directives & globals
│
├── .github/
│   └── workflows/
│       └── deploy.yml       # Builds and publishes to GitHub Pages
│
├── .env                     # Local environment overrides
├── .env.production          # Build-time config baked into the deployed bundle
├── .env.example             # Environment template
├── components.json         # shadcn/ui configuration
├── eslint.config.js        # ESLint configuration
├── index.html              # HTML entry point
├── nginx.conf              # Docker/nginx SPA fallback + /uploads proxy
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── tsconfig.app.json       # TypeScript app-specific config
├── tsconfig.node.json      # TypeScript Node config
├── vite.config.ts          # Vite config: base path, alias, 404.html fallback
└── package.json            # Dependencies and scripts
```

---

## 🗺️ Pages & Routes

### Public Routes

| Route       | Component      | Description                              |
| ----------- | -------------- | ---------------------------------------- |
| `/login`    | `LoginPage`    | User login with email/password or Google |
| `/register` | `RegisterPage` | New user registration form               |
| `*`         | `NotFoundPage` | Catch-all for unknown URLs                |

> All routes are mounted under `basename` (`import.meta.env.BASE_URL`), so on
> GitHub Pages they are reached as `/ysr-system-front/login` etc. The basename
> is required — without it every deep link falls through to `NotFoundPage`.

### Protected Routes

| Route      | Component     | Description                |
| ---------- | ------------- | -------------------------- |
| `/`        | `ProfilePage` | User profile view and edit |
| `/profile` | `ProfilePage` | User profile view and edit |
| `/users`   | `UsersPage`   | Directory of all users     |

### Route Protection

Protected routes use the `ProtectedRoute` component which:

- Checks authentication status from `AuthContext`
- Redirects to `/login` if not authenticated
- Shows loading state during authentication check

**Example:**

```tsx
<Route
  path="/"
  element={
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  }
/>
```

---

## 🧩 Components

### UI Components (shadcn/ui)

All UI components are located in `src/components/ui/` and built with:

- **Radix UI** for accessibility
- **Tailwind CSS** for styling
- **CVA** for variant management

**Available Components:**

- `Button` - Clickable button with variants (default, destructive, outline, ghost)
- `Input` - Text input with validation states
- `Label` - Form label with accessibility
- `Select` - Dropdown selection
- `Checkbox` - Checkbox input
- `Dialog` - Modal dialog
- `AlertDialog` - Confirmation dialog
- `DropdownMenu` - Context/action menu
- `Avatar` - User avatar with fallback
- `Separator` - Divider line
- `Card` - Content container

### Custom Components

#### `Header.tsx`

Navigation header with:

- App logo/title
- Navigation links
- Theme toggle
- User menu (when authenticated)
- Logout functionality

#### `ProtectedRoute.tsx`

Route guard that:

- Checks authentication status
- Redirects unauthenticated users
- Shows loading state
- Passes through authenticated users

#### `ThemeProvider.tsx`

Theme management with:

- System theme detection
- Dark/light mode toggle
- Theme persistence

---

## 🔄 State Management

### AuthContext

Central authentication state managed by React Context:

**State:**

```typescript
{
  user: User | null,
  isAuthenticated: boolean,
  isLoading: boolean
}
```

**Actions:**

```typescript
login(email, password): Promise<void>
loginWithGoogle(credential): Promise<void>
register(userData): Promise<void>
logout(): void
updateUser(userData): Promise<void>
```

**Usage:**

```tsx
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Use auth state and actions
}
```

### Local State

Component-level state managed with:

- `useState` for simple state
- `useForm` from React Hook Form for forms
- `useToast` for notifications

---

## 🔌 API Integration

### Axios Configuration

Centralized Axios instance (`src/api/axios.ts`) with:

- Base URL from environment variables
- Request interceptors for auth tokens
- Response interceptors for error handling
- Automatic token refresh on 401 errors

### API Modules

#### `auth.ts` - Authentication API

```typescript
login(email, password): Promise<AuthResponse>
register(userData): Promise<AuthResponse>
googleLogin(credential): Promise<AuthResponse>
refreshToken(): Promise<TokenResponse>
getCurrentUser(): Promise<User>
```

#### `users.ts` - User API

```typescript
getUsers(): Promise<User[]>
getUserById(id): Promise<User>
updateUser(id, data): Promise<User>
deleteUser(id): Promise<void>
```

### Error Handling

API errors are handled with:

- Try-catch blocks in async functions
- Toast notifications for user feedback
- Automatic logout on authentication errors
- Retry logic for failed requests

---

## 🎨 Styling

### Tailwind CSS

Utility-first CSS framework configured with:

**Custom Theme (`tailwind.config.js`):**

- Custom color palette (primary, secondary, accent)
- Dark mode support
- Custom spacing and breakpoints
- Animation utilities

**Usage:**

```tsx
<button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
  Click Me
</button>
```

### CSS Utilities

**`cn()` Helper:**
Combines class names intelligently:

```tsx
import { cn } from "@/lib/utils";

cn("px-4 py-2", isActive && "bg-blue-500", className);
```

### Global Styles

**`index.css`:**

- Tailwind directives
- CSS variables for theming
- Global resets
- Custom scrollbar styles

**`App.css`:**

- Component-specific styles
- Animation keyframes
- Layout utilities

---

## 🔑 Environment Variables

Create a `.env.local` file in the frontend directory (copy `.env.example`):

```env
# Public base path the app is served from
VITE_BASE_PATH=/ysr-system-front/

# Backend API URL
VITE_API_BASE_URL=http://localhost:3000

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

> `VITE_API_BASE_URL` is the name the code reads. The old `VITE_API_URL` in
> earlier docs was never wired up — configuring it alone had no effect.

**Getting Google OAuth Credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized JavaScript origins: `http://localhost:4000`, and later each
   deployed origin (`https://abolfazlmahkam.github.io`, `https://panel.rohanian-ysr.ir`)
6. Copy the Client ID to your `.env` file

---

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server at localhost:4000/ysr-system-front/

# Building
npm run build           # Custom-domain build (base "/") for panel.rohanian-ysr.ir
                        # Output: dist/
npm run build:pages     # Project-site build (base "/ysr-system-front/")
                        # Output: dist-pages/

# Preview
npm run preview         # Preview production build locally

# Code Quality
npm run lint            # Run ESLint on src files
```

### Build Output

Production build creates optimized assets in `dist/`:

- Minified JavaScript bundles
- Optimized CSS
- Static assets
- Source maps (optional)

---

## 🏗️ Development Guide

### Adding a New Page

1. **Create page component** in `src/pages/`

   ```tsx
   // src/pages/NewPage.tsx
   export default function NewPage() {
     return <div>New Page</div>;
   }
   ```

2. **Export from index**

   ```tsx
   // src/pages/index.ts
   export { default as NewPage } from "./NewPage";
   ```

3. **Add route** in `App.tsx`
   ```tsx
   <Route
     path="/new"
     element={
       <ProtectedRoute>
         <NewPage />
       </ProtectedRoute>
     }
   />
   ```

### Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

Example:

```bash
npx shadcn@latest add card
```

### Form Validation with Zod

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(schema),
});
```

### Making API Calls

```tsx
import { useState } from "react";
import { getUsers } from "@/api/users";
import { toast } from "sonner";

function MyComponent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Use fetchUsers...
}
```

---

## 🔍 Debugging

### Vite Dev Server

- Hot Module Replacement (HMR) for instant updates
- Error overlay in browser
- Source maps for debugging

### React DevTools

Install the React DevTools browser extension for:

- Component tree inspection
- Props and state viewing
- Performance profiling

### Network Inspection

Use browser DevTools Network tab to:

- Monitor API calls
- Inspect request/response headers
- Debug authentication tokens

---

## 🚀 Deployment

### GitHub Pages (current target)

The app is published to **two** hosts, which need different base paths, so there
are two build targets:

| Host | URL | Base | Built by |
| --- | --- | --- | --- |
| Arvancdn (custom domain) | `https://panel.rohanian-ysr.ir` | `/` | `npm run build` → `dist/` |
| GitHub Pages (project site) | `https://abolfazlmahkam.github.io/ysr-system-front` | `/ysr-system-front/` | `npm run build:pages` → `dist-pages/` (CI) |

A project site is served from a **sub-path**, so every asset URL, the router
basename and the post-refresh redirect all have to carry `/ysr-system-front/`.
The custom domain is served from the **root**. That is the only difference
between the two builds — no component code changes. Changing a base means
changing one value, not editing components.

To reproduce a build locally:

```bash
npm run build        # custom domain  -> dist/
npm run build:pages  # project site   -> dist-pages/
npm run preview      # serves the most recent build at its configured base
```

Local development uses the project-site base, so `npm run dev` serves the app
at <http://localhost:4000/ysr-system-front/> rather than `http://localhost:4000/`.
That is intentional: it makes the sub-path layout that only exists in production
visible during development.

**Deep links.** GitHub Pages cannot rewrite requests to `index.html`, so a
refresh on `/ysr-system-front/admin/form-submissions` would 404. The build emits
a byte-identical copy of `index.html` as `404.html`, which Pages serves *at the
requested URL* — react-router then sees the original path and boots normally.
Unknown URLs land on the catch-all route in `src/pages/NotFoundPage.tsx`.

### Publishing to `panel.rohanian-ysr.ir`

The domain is served by **Arvancdn**, not GitHub Pages — its DNS points at
`185.143.233.131` / `185.143.234.131`, not at GitHub. So the domain is *not* a
Pages custom domain and **no CNAME is involved**. It is a static copy of `dist/`
uploaded to that host.

That also means the two URLs coexist: the project site keeps its own
`/ysr-system-front/` base and the domain gets `/`. Neither displaces the other.

To publish an update to the domain:

```bash
npm run build    # -> dist/ , base "/"
```

Then upload the **contents of `dist/`** to the document root of the Arvanchn
host. The whole directory matters, including the `assets/` folder and
`404.html` — uploading only `index.html` leaves every asset 404ing, which is the
exact failure mode a base mismatch produces.

### CI builds both targets on every push

`.github/workflows/deploy.yml` builds and verifies **both** artifacts on every
push to `main`, so the bundle destined for each host is always produced by the
same commit and can never be the wrong one:

| Job | Output | Destination |
| --- | --- | --- |
| `build` | `dist-pages/` (base `/ysr-system-front/`) | deployed to GitHub Pages |
| `build-domain` | `dist/` (base `/`), attached to the run as the `dist-domain` artifact | upload to Arvancdn |

`build-domain` attaches `dist/` as a downloadable artifact on every run, so the
correct bundle is always available even if the upload is not configured.

It can also publish for you. To enable push-to-live, set repository **variable**
`ARVAN_DEPLOY_ENABLED=true` and **secrets** `ARVAN_HOST`, `ARVAN_USER`,
`ARVAN_PASSWORD` (Settings -> Secrets and variables -> Actions). The step is
inert until that variable is set, so merging this cannot unexpectedly overwrite
the live site. It mirrors with `--delete`, meaning the published directory is
always exactly the artifact CI verified.

`check` (lint + type-check) is a hard gate: `deploy` depends on it, so a push
that fails either one never reaches either host. It currently passes, but the
API layer under `src/api` is still `.js` and its response bodies are typed `any`
via the declarations in `src/types/api.ts` — see that file for why `allowJs` makes
things worse and how to migrate off it.

> **How the two bases are kept apart.** `base` is baked into the bundle at build
> time, so a single build can only target one host.
> `.env.production` sets `VITE_BASE_PATH=/` and drives `npm run build`.
> `npm run build:pages` passes `--base=/ysr-system-front/`, which overrides that
> file, and the Pages workflow injects `VITE_BASE_PATH` as a real environment
> variable, which takes precedence over the file in `loadEnv`. Editing
> `.env.production` therefore does **not** disturb the Pages deploy.

Note that `base: "./"` is *not* used for the domain. This app has deep routes,
and a relative base would resolve assets against the current path segment
(`/admin/assets/…`); an explicit `/` is correct.

### Backend requirements

The API is called cross-origin from a different host than the page, so:

- **CORS** — the backend must allow the frontend origin exactly, including the
  `https://abolfazlmahkam.github.io` (and later `https://panel.rohanian-ysr.ir`)
  origins. Set the backend's `FRONTEND_URL` to the deployed origin.
- **Google OAuth** — add each origin under *Authorized JavaScript origins* in
  the Google Cloud console.
- **Uploads** — the backend returns uploads as root-relative `/uploads/<file>`.
  Under the Docker/nginx deployment these are proxied to the API (see
  `nginx.conf`), but GitHub Pages has no proxy, so `uploadUrl()` in
  `src/utiles/fileUtils.js` rewrites them to the absolute API origin. That is
  why the links keep working on any host.

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
vercel
```

### Deploy to Netlify

```bash
netlify deploy --prod --dir=dist
```

### Environment Variables

Vite inlines `VITE_*` variables into the bundle at **build time** — they are
public, never put secrets in them, and changing one requires a rebuild. See
`.env.production` for the deployed values and `.env.example` for local ones.

- `VITE_BASE_PATH` - Public base path (`/` for the custom domain,
  `/ysr-system-front/` for the project site)
- `VITE_API_BASE_URL` - Backend origin (`https://api.rohanian-ysr.ir`)
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID


---

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [React Router](https://reactrouter.com/)

---

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**

```bash
# Change port in vite.config.ts or kill process
lsof -ti:4000 | xargs kill
```

**Module not found:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Blank page after deploying to GitHub Pages:**

- The app is served from `/ysr-system-front/`, not `/`. `VITE_BASE_PATH` must
  match the host, and it must end with a trailing slash.
- Hard-refresh a deep route: if it 404s, `dist/404.html` is missing. The build
  emits it automatically — check that a custom `build.outDir` still has it.

**Every asset 404s but the page still renders (white screen, console full of 404s):**

This is a **base/host mismatch**, and it is the single most damaging deploy error
here because nothing fails at build time — `base` is baked into the bundle, so a
project-site build is internally consistent and looks fine until it meets a
root-hosted server.

The signature: `index.html` loads (200) but requests
`/ysr-system-front/assets/index-<hash>.js` and gets 404, while
`/assets/index-<hash>.js` returns 200. You are serving a **sub-path build on a
root host**, i.e. the wrong artifact.

Fix — rebuild for the host you are actually publishing to, then upload the whole
directory:

| Publishing to | Command | Upload |
| --- | --- | --- |
| `panel.rohanian-ysr.ir` (root) | `npm run build` | contents of `dist/` |
| GitHub Pages project site | `npm run build:pages` | contents of `dist-pages/` |

This cannot ship silently any more. Three layers cover it, and it is worth
knowing which layer catches what:

1. **The build itself** runs `scripts/verify-base.mjs` as a Vite plugin
   (`verifyBuiltBase` in `vite.config.ts`). It fails the build if a referenced
   file is missing from the output (a partial upload) or if the base is relative
   (`./`, which breaks deep routes). This covers `npm run build`,
   `npm run build:pages` and the Dockerfile.
2. **Each CI job** additionally asserts the base its destination requires —
   `verify:dist` expects `/`, `verify:dist-pages` expects `/ysr-system-front/`.
   This is the layer that catches the wrong artifact, because a build cannot know
   which host it is about to be uploaded to; only the job that owns that host can.
3. **`DEFAULT_BASE` is `/`**, not the sub-path. A build that loses its
   `VITE_BASE_PATH` (stripped by a `.dockerignore`, missing from a CI variable,
   absent from a PaaS build setting) falls back to the **production host**, which
   is the safe direction. The sub-path is an explicit opt-in via
   `npm run build:pages`.

Check an artifact by hand at any time:

```bash
npm run verify:dist         # dist/ must be built for the root
npm run verify:dist-pages   # dist-pages/ must be built for the sub-path
```

Layer 2 runs in CI, so the residual human step is only *uploading the right
artifact*. Compare the `src=` line in the two `index.html` files if unsure:
`/assets/...` is the domain, `/ysr-system-front/assets/...` is Pages.

**CORS errors:**

- Ensure the backend allows the exact deployed origin, e.g.
  `https://abolfazlmahkam.github.io` (note: no trailing path)
- Check `VITE_API_BASE_URL` in `.env.local`

**Google OAuth not working:**

- Verify Client ID in `.env`
- Check authorized origins in Google Console
- Clear browser cache

---

<div align="center">

**Part of the [Auth React NestJS](../../README.md) monorepo**

Made with ❤️ using React, TypeScript, and Vite

</div>
