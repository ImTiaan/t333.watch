# t333.watch - Multi-Stream Viewer for Twitch

A comprehensive platform for watching multiple Twitch streams simultaneously, creating and sharing stream Packs, and synchronizing VOD playback.

## Project Status

### Completed Features (Phase 1)

- ✅ **Authentication System**
  - Twitch OAuth integration
  - Secure token storage and refresh
  - User profile synchronization
  - Login/logout functionality

- ✅ **Multi-Stream Viewer (Core)**
  - Watch up to 3 streams simultaneously (free tier)
  - Responsive grid layout that adapts to the number of streams
  - Audio control system (one active audio at a time)
  - Stream addition and removal

- ✅ **Channel Selection**
  - Add channels manually by name
  - Browse and select from followed channels
  - Search for Twitch channels
  - Duplicate channel detection

- ✅ **Premium Upgrade Flow**
  - Free tier limitations (3 streams maximum)
  - Premium upgrade modal with subscription options
  - Feature comparison between free and premium tiers
  - Placeholder for Stripe integration

- ✅ **User Interface**
  - Twitch-like design language with purple accent color
  - Responsive layout for different screen sizes
  - Dashboard with quick actions
  - Navigation between different sections

### In Progress Features (Phase 2)

- 🔄 **Packs System**
  - Basic structure for saving stream collections
  - UI for Pack creation and management
  - Database schema for Packs

### Planned Features (Future Phases)

- 📅 **VOD Synchronization** (Phase 3)
  - Global timeline control
  - Per-stream offset adjustments
  - Drift detection and correction

- 📅 **Enhanced Discovery** (Phase 3)
  - Trending Packs
  - Pack categorization and tagging
  - Search functionality

- 📅 **Notifications** (Phase 4)
  - Alerts for followed Packs going live
  - Email notifications
  - In-app notification center

- 📅 **Mobile Optimizations** (Phase 4)
  - Mobile-specific layouts
  - Touch-friendly controls
  - Progressive Web App capabilities

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Authentication**: Twitch OAuth
- **State Management**: React Hooks
- **Styling**: Tailwind CSS with custom utilities
- **Future Integrations**: Supabase (PostgreSQL), Redis (Upstash), Stripe

## Project Structure

```
t333.watch/
├── docs/                 # Project documentation
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard page
│   │   ├── viewer/       # Multi-stream viewer
│   │   └── ...
│   ├── components/       # Reusable React components
│   │   ├── auth/         # Authentication components
│   │   ├── layout/       # Layout components (Header, Footer)
│   │   ├── premium/      # Premium/upgrade components
│   │   ├── stream/       # Stream-related components
│   │   └── ...
│   ├── lib/              # Utility functions and API clients
│   └── types/            # TypeScript type definitions
└── ...
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Twitch Developer Account and registered application

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/t333.watch.git
   cd t333.watch
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_TWITCH_CLIENT_ID=your_twitch_client_id
   TWITCH_CLIENT_SECRET=your_twitch_client_secret
   NEXT_PUBLIC_TWITCH_REDIRECT_URI=http://localhost:3000/auth/callback
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Setting up Twitch API Credentials

1. Go to the [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Create a new application
3. Set the OAuth Redirect URL to `http://localhost:3000/auth/callback`
4. Copy the Client ID and Client Secret to your `.env.local` file

## Development Roadmap

We're following a phased development approach:

- **Phase 1 (Complete)**: Core Multi-Stream Viewer & Authentication
- **Phase 2 (In Progress)**: Packs System & Monetization
- **Phase 3 (Planned)**: VOD Sync & Enhanced Discovery
- **Phase 4 (Planned)**: Notifications & Mobile Optimizations
- **Phase 5 (Planned)**: Performance Optimization & Scaling

## Contributing

1. Create a new branch for your feature or bug fix
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Twitch API](https://dev.twitch.tv/docs/api/) for providing the streaming capabilities
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
