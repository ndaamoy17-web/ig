# 🚀 Cloudflare Workers Deployment Guide

## Why Workers?

✅ **300+ Edge Locations** - Requests come from different IPs worldwide  
✅ **No Cold Starts** - Instant response times  
✅ **100k Free Requests/Day** - Generous free tier  
✅ **Better Rate Limit Handling** - Distributed IPs reduce Instagram blocking  

---

## Quick Start

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate.

### 3. Deploy to Workers

```bash
npm run workers:deploy
```

Or:

```bash
wrangler deploy
```

**That's it!** Your API will be live at:
```
https://ig-api.<your-subdomain>.workers.dev
```

---

## Test Locally

```bash
npm run workers:dev
```

Then visit: `http://localhost:8787/api/user?username=zuck`

---

## API Endpoints

### Get User Info
```
GET https://your-worker.workers.dev/api/user?username=zuck
```

### API Docs
```
GET https://your-worker.workers.dev/
```

---

## Features

✅ **All Error Detection**
- User not found
- Account suspended
- Account banned/deactivated
- Rate limiting (with retry)

✅ **Workers Benefits**
- Global edge distribution
- Edge location tracking (shows which datacenter handled request)
- No server maintenance
- Auto-scaling

✅ **Smart Retry Logic**
- Exponential backoff
- Random jitter
- 3 retry attempts

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "responseTime": "120ms",
  "method": "API",
  "attempt": 1,
  "edge": "SJC", 
  "credits": { ... }
}
```

Note: `edge` field shows which Cloudflare datacenter handled your request (e.g., "SJC" = San Jose, "LHR" = London)

### Error
```json
{
  "success": false,
  "error": "Account suspended",
  "message": "This account has been suspended...",
  "code": "ACCOUNT_SUSPENDED"
}
```

---

## Configuration

Edit `wrangler.toml`:

```toml
name = "ig-api"              # Your worker name
main = "src/worker.js"       # Entry point
compatibility_date = "2024-01-01"
```

---

## Custom Domain (Optional)

1. Go to Workers dashboard
2. Click your worker
3. Go to **Triggers** → **Custom Domains**
4. Add your domain (e.g., `api.yourdomain.com`)

---

## Monitoring

View analytics at:
https://dash.cloudflare.com → Workers & Pages → Your Worker → Analytics

Track:
- Requests per day
- Success rate
- Response times
- Edge locations used

---

## Comparison

| Platform | Free Requests | Cold Starts | Global IPs | Rate Limits |
|----------|---------------|-------------|------------|-------------|
| **Workers** | 100k/day | ❌ None | ✅ 300+ | 🟢 Low |
| Netlify | 125k/month | ✅ ~100ms | ❌ Few | 🔴 High |
| Vercel | Unlimited* | ✅ ~100ms | ❌ Few | 🟡 Medium |

---

## Need Help?

**Author:** [@pluggerpy](https://t.me/pluggerpy)  
**Powered by:** [@vexelsocials](https://t.me/vexelsocials)

---

## Next Steps

1. Deploy: `wrangler deploy`
2. Test: Visit your workers.dev URL
3. Monitor: Check Cloudflare dashboard
4. Enjoy: Better performance & fewer rate limits! 🎉
