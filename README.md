# Instagram Profile Info API

Fast Instagram Profile Info API with Proxy Rotation support.

## API Endpoints

- `GET /api/user?username=<username>` - Get Instagram profile info
- `GET /api/` - API documentation

## Example

```bash
curl https://your-site.netlify.app/api/user?username=zuck
```

## Deployment

### Netlify (Current Setup)

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Connect your repository to Netlify
3. Netlify will auto-detect the configuration from `netlify.toml`
4. Deploy!

Or use Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod
```

### Vercel (Alternative)

If you prefer Vercel instead:

```bash
npm run deploy
```

## Configuration Files

- `netlify.toml` - Netlify configuration (redirects `/api/*` to serverless functions)
- `netlify/functions/` - Netlify serverless functions
- `api/` - Original Vercel-style API handlers (reused by Netlify wrappers)

## Features

- ✅ Direct Instagram API requests
- ✅ Fallback to HTML scraping
- ✅ Automatic retry mechanism
- ✅ CORS enabled
- ✅ Fast response times
- ✅ Serverless deployment ready

## Credits

- Author: @pluggerpy
- Powered by: @vexelsocials
