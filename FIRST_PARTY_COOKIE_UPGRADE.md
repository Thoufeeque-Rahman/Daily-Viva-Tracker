# First-Party Cookie Upgrade Guide 🍪➡️🥇

## Overview
This upgrade converts your cookies from **third-party** (blocked by iPhone Safari) to **first-party** (allowed by all browsers) using Vercel's proxy feature.

## How It Works

### Before (Third-Party Cookies - ❌ Blocked by iPhone)
```
Frontend: https://daily-viva-tracker.vercel.app
API:      https://daily-viva-tracker-3p9w.vercel.app
Result:   Safari sees different domains = Third-party cookies = BLOCKED
```

### After (First-Party Cookies - ✅ Works on iPhone)
```
Frontend: https://daily-viva-tracker.vercel.app
API:      https://daily-viva-tracker.vercel.app/api (proxied to backend)
Result:   Safari sees same domain = First-party cookies = ALLOWED
```

## Changes Made

### 1. ✅ Client-Side Proxy Configuration
**File:** `client/vercel.json`
```json
{
  "rewrites": [
    { 
      "source": "/api/(.*)", 
      "destination": "https://daily-viva-tracker-3p9w.vercel.app/api/$1" 
    },
    { 
      "source": "/(.*)", 
      "destination": "/" 
    }
  ]
}
```
**What this does:** All `/api/*` requests from your frontend are automatically proxied to your backend server.

### 2. ✅ Adaptive Cookie Settings
**Files:** All authentication routes now use adaptive cookies:

```javascript
res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: process.env.VERCEL_ENV ? 'lax' : 'none', // 🔑 KEY CHANGE
  maxAge: 7 * 24 * 60 * 60 * 1000
});
```

**Logic:**
- **Production (Vercel):** `sameSite: 'lax'` = First-party cookies
- **Development:** `sameSite: 'none'` = Cross-site cookies (for localhost)

### 3. ✅ Session Configuration Updated
**File:** `server/config/session.js`
- Uses the same adaptive logic for session cookies
- Automatically switches between first-party and cross-site modes

### 4. ✅ Client Configuration Updated
**File:** `client/src/lib/axios.tsx`
- Supports both proxied (production) and direct (development) API calls
- Maintains `withCredentials: true` for cookie handling

## Deployment Steps

### Step 1: Deploy Frontend Changes
```bash
cd client
git add .
git commit -m "Add API proxy for first-party cookies"
git push
```

### Step 2: Deploy Backend Changes  
```bash
cd server
git add .
git commit -m "Update cookie settings for first-party mode"
git push
```

### Step 3: Verify Deployment
1. Check frontend deployment at `https://daily-viva-tracker.vercel.app`
2. Check backend deployment at `https://daily-viva-tracker-3p9w.vercel.app`
3. Test API proxy: `https://daily-viva-tracker.vercel.app/api/test` should work

## Testing Checklist

### iPhone Safari Testing:
- [ ] Login works and stays logged in
- [ ] Page refresh maintains session
- [ ] Logout properly clears session
- [ ] Navigation between pages works
- [ ] No "logged out" messages appearing unexpectedly

### Other Browser Testing:
- [ ] Desktop Chrome/Firefox/Safari still work
- [ ] Android browsers still work  
- [ ] In-app browsers (WhatsApp, Facebook) work

### Development Environment:
- [ ] `npm run dev` still works locally
- [ ] Local API calls work with CORS
- [ ] Login/logout works in development

## Environment Variables

Make sure these are set in both Vercel deployments:

**Frontend (.env):**
```bash
VITE_BASE_URL=  # Leave empty for relative URLs in production
```

**Backend (.env):**
```bash
VERCEL_ENV=production  # Automatically set by Vercel
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
MONGODB_URL=your-mongodb-connection
```

## How to Verify It's Working

### Method 1: Browser Developer Tools
1. Open iPhone Safari
2. Login to your app
3. Open Web Inspector (if connected to Mac)
4. Check Network tab - cookies should be sent with requests
5. Check Application/Storage tab - cookies should be stored

### Method 2: Server Logs
Add temporary logging to see cookies:
```javascript
app.use((req, res, next) => {
  console.log('Cookies received:', req.cookies);
  next();
});
```

### Method 3: Test API Directly
- Try: `https://daily-viva-tracker.vercel.app/api/test`
- Should return API response (proving proxy works)

## Troubleshooting

### Issue: API proxy not working
**Solution:** Check that the backend URL in `client/vercel.json` matches your actual backend deployment URL.

### Issue: Still getting logged out
**Solutions:**
1. Clear Safari cache and cookies
2. Check that both frontend and backend are deployed
3. Verify `VERCEL_ENV` is set in backend deployment

### Issue: Development environment broken
**Solution:** Set `VITE_BASE_URL` in your local `.env` file to point to your local backend.

### Issue: CORS errors in development
**Solution:** The backend CORS config should allow localhost origins for development.

## Benefits of First-Party Cookies

✅ **Universal Browser Support:** Works on all browsers including iPhone Safari  
✅ **Better Security:** Less susceptible to tracking protection  
✅ **Improved Performance:** No cross-origin requests for authentication  
✅ **Simpler Architecture:** Single domain for both frontend and API  
✅ **Future-Proof:** Aligns with browser privacy trends  

## Technical Details

### Cookie Lifecycle:
1. User logs in via `https://daily-viva-tracker.vercel.app/api/login` (proxied)
2. Server sets cookie with `sameSite: lax` (first-party)
3. Browser stores cookie for `daily-viva-tracker.vercel.app` domain
4. All subsequent requests include the cookie automatically
5. iPhone Safari allows this because it's same-domain

### Proxy Behavior:
- Frontend Vercel deployment automatically forwards `/api/*` requests
- Backend receives requests with proper headers and cookies
- Response cookies are set on the frontend domain
- No CORS issues because browser sees same-domain requests

This upgrade eliminates the iPhone cookie issue completely while maintaining compatibility with all other browsers and development workflows! 🎉