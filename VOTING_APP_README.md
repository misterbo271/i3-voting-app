# Beautiful Vase Contest - Company Voting App

A responsive mobile-first voting application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Team Selection**: Users select which team they belong to (4 teams available)
- **Restricted Voting**: Users can only vote for the 3 teams they don't belong to
- **One Vote Only**: Each user can vote only once, persisted across browser sessions
- **Real-time Results**: Live vote counting and results display
- **Mobile-First Design**: Optimized for mobile devices with beautiful animations
- **Persistent State**: Uses localStorage to prevent multiple votes even after page refresh

## Teams

- 🌸 **Team Alpha** (Blue)
- 🌺 **Team Beta** (Green) 
- 🌻 **Team Gamma** (Purple)
- 🌷 **Team Delta** (Orange)

## User Flow

1. **Team Selection**: User selects their team from 4 available options
2. **Voting Interface**: User sees 3 remaining teams and can vote for one
3. **Results Display**: After voting, user sees current results and cannot vote again

## Technical Details

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom gradients and animations
- **Animations**: Framer Motion for smooth transitions
- **State Management**: React hooks with localStorage persistence
- **TypeScript**: Full type safety throughout the application

## Running the App

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Mobile Optimization

- Responsive design that works on all screen sizes
- Touch-friendly buttons and interactions
- Optimized viewport settings
- Smooth animations and transitions
- Beautiful gradient backgrounds

## Vote Persistence

The app uses localStorage to track:
- Which team the user belongs to
- Whether they have voted
- Which team they voted for
- Current vote counts

This ensures users cannot vote multiple times even if they:
- Refresh the page
- Close and reopen the browser
- Clear cookies (localStorage persists)

To reset voting data, users would need to manually clear localStorage or use developer tools.
