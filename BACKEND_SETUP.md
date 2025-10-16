# 🚀 Backend Voting Server Setup

## Overview
The voting app now uses a custom Express.js backend server instead of Google Forms. This gives you complete control over the voting data and provides real-time results.

## 🏗️ Architecture

```
Frontend (Next.js) ←→ Backend API (Express.js) ←→ In-Memory Storage
     Port 3001              Port 3002              (votes & users)
```

## 🚀 Quick Start

### Option 1: Start Both Frontend and Backend
```bash
# Terminal 1: Start the backend server
npm run server

# Terminal 2: Start the frontend (in another terminal)
npm run dev
```

### Option 2: Start Everything at Once (if you have concurrently installed)
```bash
npm run dev:full
```

## 📡 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/results` - Get current vote results
- `GET /api/vote-status/:id` - Check if user has voted
- `POST /api/vote` - Submit a vote

### Admin Endpoints
- `GET /api/admin/votes` - Get all votes with details
- `POST /api/admin/reset` - Reset all votes (requires confirmation)

## 🗳️ How Voting Works

1. **User Identification**: Each user gets a unique identifier stored in localStorage
2. **Team Selection**: User selects their team (Team 01-04)
3. **Vote Submission**: User votes for one of the other 3 teams
4. **Backend Validation**: Server validates the vote and prevents duplicates
5. **Real-time Results**: Updated vote counts are returned immediately

## 📊 Vote Storage

Currently using **in-memory storage** for simplicity:
- ✅ Fast and simple
- ✅ Perfect for demos and small events
- ⚠️ Data is lost when server restarts
- ⚠️ Not suitable for production with high traffic

### For Production
Consider upgrading to a database:
- **SQLite**: Simple file-based database
- **PostgreSQL**: Full-featured database
- **MongoDB**: NoSQL option

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://192.168.20.52:3002
PORT=3002
```

### CORS Settings
The server allows requests from:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://192.168.20.52:3002`

## 🧪 Testing the API

### Using curl:
```bash
# Health check
curl http://192.168.20.52:3002/api/health

# Get results
curl http://192.168.20.52:3002/api/results

# Submit a vote
curl -X POST http://192.168.20.52:3002/api/vote \
  -H "Content-Type: application/json" \
  -d '{"userTeam":"team-a","votedFor":"team-b","userIdentifier":"test-user-123"}'

# Check vote status
curl http://192.168.20.52:3002/api/vote-status/test-user-123
```

### Using the Browser Console:
```javascript
// Test the API connection
fetch('http://192.168.20.52:3002/api/health')
  .then(r => r.json())
  .then(console.log);

// Get current results
fetch('http://192.168.20.52:3002/api/results')
  .then(r => r.json())
  .then(console.log);
```

## 📈 Real-time Features

- **Live Vote Counts**: Results update immediately after each vote
- **Duplicate Prevention**: Users cannot vote twice
- **Team Validation**: Users cannot vote for their own team
- **Error Handling**: Graceful error messages for all scenarios

## 🛠️ Admin Features

### View All Votes
```bash
curl http://192.168.20.52:3002/api/admin/votes
```

### Reset All Votes (Use with caution!)
```bash
curl -X POST http://192.168.20.52:3002/api/admin/reset \
  -H "Content-Type: application/json" \
  -d '{"confirm":"RESET_ALL_VOTES"}'
```

## 🔍 Monitoring

The server logs all important events:
- ✅ New votes submitted
- ⚠️ Duplicate vote attempts
- ❌ Invalid requests
- 🔄 Server startup/shutdown

## 🚨 Troubleshooting

### Backend not starting?
1. Check if port 3002 is available
2. Ensure all dependencies are installed: `npm install`
3. Check for TypeScript errors: `npm run typecheck`

### Frontend can't connect to backend?
1. Verify backend is running on port 3002
2. Check CORS settings in server/index.ts
3. Ensure API_BASE_URL is correct in src/lib/api.ts

### Votes not saving?
1. Check browser console for API errors
2. Verify backend logs for error messages
3. Test API endpoints directly with curl

## 📝 Data Format

### Vote Object
```typescript
{
  id: string;           // Unique vote ID
  userTeam: string;     // team-a, team-b, team-c, or team-d
  votedFor: string;     // team-a, team-b, team-c, or team-d
  timestamp: Date;      // When the vote was cast
  ipAddress?: string;   // Client IP (optional)
}
```

### Results Format
```typescript
{
  results: [
    {
      teamId: "team-a",
      teamName: "Team 01",
      votes: 5,
      percentage: 25
    }
    // ... other teams
  ],
  totalVotes: 20,
  timestamp: "2024-01-01T12:00:00.000Z"
}
```

## 🎯 Next Steps

1. **Start the servers** using the commands above
2. **Test the voting flow** by selecting teams and voting
3. **Check the results** update in real-time
4. **Monitor the backend logs** to see votes being processed
5. **Use admin endpoints** to view detailed vote data

The backend is now ready and provides much better control than Google Forms!
