# Instagram Profile Info API

Fast API to fetch Instagram profile information with proxy rotation support.

## 🚀 Deploy to Vercel

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Use the API**:
   ```
   GET https://your-app.vercel.app/api/user?username=zuck
   ```

## 📡 API Endpoints

### Get Profile Info
```
GET /api/user?username=<username>
```

**Example Request:**
```bash
curl "https://your-app.vercel.app/api/user?username=zuck"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "name": "Mark Zuckerberg",
    "username": "zuck",
    "user_id": "314216",
    "bio": "I build stuff",
    "verified": true,
    "private": false,
    "posts": 420,
    "followers": 16541851,
    "following": 623,
    "business": false,
    "category": null,
    "external_url": null,
    "profile_pic_url": "https://..."
  },
  "responseTime": "234ms",
  "credits": {
    "author": "@pluggerpy",
    "poweredBy": "@vexelsocials"
  }
}
```

## ⚡ Features

- 🔄 **Proxy Rotation** - 100 residential proxies for avoiding rate limits
- 🚀 **Fast Response** - Typically < 500ms
- 🌐 **CORS Enabled** - Use from any frontend
- 📱 **Full Profile Data** - Name, bio, followers, posts, verified status, etc.

## 🔧 Local Development

```bash
npm install
npm run dev
```

Then visit: `http://localhost:3000/api/user?username=zuck`

## 📁 Project Structure

```
├── api/
│   ├── index.js      # Root endpoint (docs)
│   └── user.js       # Main profile fetcher
├── package.json
├── vercel.json
└── proxies.txt       # Proxy list (optional)
```

## 🔐 Environment Variables (Optional)

You can set proxies via environment variable instead of hardcoding:

```
PROXIES=user:pass:host:port
user2:pass2:host2:port2
...
```

## Credits

- Author: [@pluggerpy](https://t.me/pluggerpy)
- Powered by: [@vexelsocials](https://t.me/vexelsocials)
