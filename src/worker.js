/**
 * Instagram Profile Info API - Cloudflare Workers
 * Optimized for global edge network distribution
 */

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatUserData(user) {
    return {
        name: user.full_name || null,
        username: user.username,
        user_id: user.id || user.pk || null,
        bio: user.biography || null,
        verified: user.is_verified || false,
        private: user.is_private || false,
        posts: user.edge_owner_to_timeline_media?.count || user.media_count || 0,
        followers: user.edge_followed_by?.count || user.follower_count || 0,
        following: user.edge_follow?.count || user.following_count || 0,
        business: user.is_business_account || false,
        category: user.category_name || null,
        external_url: user.external_url || null,
        profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url || null,
    };
}

// Scrape from HTML page
async function scrapeFromHTML(username) {
    const url = `https://www.instagram.com/${encodeURIComponent(username)}/`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': getRandomItem(USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        },
    });

    // Try to get HTML content FIRST (regardless of status code)
    // This allows us to detect banned/suspended accounts even when rate limited
    let html = '';
    try {
        html = await response.text();
    } catch (e) {
        // If we can't get HTML, fall back to status code only
        if (response.status === 404) {
            return { found: false, code: 'USER_NOT_FOUND', message: 'This account does not exist' };
        }
        if (response.status === 429) {
            throw new Error('RATE_LIMITED');
        }
        throw new Error(`HTTP_${response.status}`);
    }

    // Check for banned/suspended account patterns
    if (html.includes('Sorry, this page isn\'t available') ||
        html.includes('The link you followed may be broken') ||
        html.includes('Page Not Found')) {
        return {
            found: false,
            code: 'ACCOUNT_NOT_AVAILABLE',
            message: 'This account is not available. It may have been banned, deleted, or suspended.'
        };
    }

    // Check for deactivated account
    if (html.includes('User not found') || html.includes('accountNotFound')) {
        return {
            found: false,
            code: 'ACCOUNT_DEACTIVATED',
            message: 'This account has been deactivated or deleted by the user.'
        };
    }

    // Check for restricted/banned account
    if (html.includes('suspended') || html.includes('violated') || html.includes('community guidelines')) {
        return {
            found: false,
            code: 'ACCOUNT_SUSPENDED',
            message: 'This account has been suspended for violating Instagram\'s community guidelines.'
        };
    }

    // Check for temporarily unavailable
    if (html.includes('temporarily unavailable') || html.includes('try again later')) {
        return {
            found: false,
            code: 'TEMPORARILY_UNAVAILABLE',
            message: 'This account is temporarily unavailable. Please try again later.'
        };
    }

    // NOW check status codes AFTER HTML pattern checking
    if (response.status === 404) {
        return { found: false, code: 'USER_NOT_FOUND', message: 'This account does not exist' };
    }

    if (response.status === 429) {
        throw new Error('RATE_LIMITED');
    }

    if (response.status !== 200) {
        throw new Error(`HTTP_${response.status}`);
    }

    // Extract JSON data from HTML
    const scriptMatch = html.match(/<script type="application\/ld\+json">({[^<]+})<\/script>/);
    if (scriptMatch) {
        try {
            const jsonData = JSON.parse(scriptMatch[1]);
            if (jsonData && jsonData.name) {
                return {
                    found: true,
                    data: {
                        name: jsonData.name || null,
                        username: username,
                        user_id: null,
                        bio: jsonData.description || null,
                        verified: false,
                        private: false,
                        posts: 0,
                        followers: 0,
                        following: 0,
                        business: false,
                        category: null,
                        external_url: jsonData.url || null,
                        profile_pic_url: jsonData.image || null,
                    }
                };
            }
        } catch (e) {
            // Continue to regex extraction
        }
    }

    // Fallback to regex extraction
    const sharedData = html.match(/window\._sharedData = ({.+?});<\/script>/);
    if (sharedData) {
        try {
            const data = JSON.parse(sharedData[1]);
            const userData = data?.entry_data?.ProfilePage?.[0]?.graphql?.user;
            if (userData) {
                return { found: true, data: formatUserData(userData) };
            }
        } catch (e) {
            // Failed to parse
        }
    }

    throw new Error('DATA_PARSE_FAILED');
}

// Try API endpoint first
async function fetchInstagram(username) {

    // Add small random delay to appear more human-like
    const randomDelay = 100 + Math.random() * 300; // 100-400ms
    await sleep(randomDelay);

    // Method 1: Try web_profile_info API
    try {
        const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'User-Agent': getRandomItem(USER_AGENTS),
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'X-IG-App-ID': '936619743392459',
                'X-ASBD-ID': '129477',
                'X-IG-WWW-Claim': '0',
                'X-Requested-With': 'XMLHttpRequest',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'Referer': `https://www.instagram.com/${username}/`,
                'Cookie': 'ig_did=' + Math.random().toString(36).substring(2) + '; ' +
                    'mid=' + Math.random().toString(36).substring(2) + '; csrftoken=' + Math.random().toString(36).substring(2),
            },
        });

        if (response.status === 404) {
            return { found: false, code: 'USER_NOT_FOUND', message: 'This account does not exist' };
        }

        if (response.status === 429) {
            throw new Error('RATE_LIMITED');
        }

        if (response.status === 200) {
            const data = await response.json();
            const user = data?.data?.user;

            if (user) {
                return { found: true, data: formatUserData(user), method: 'API' };
            }

            // Check if API returned an error message
            if (data?.message) {
                const message = data.message.toLowerCase();
                if (message.includes('user not found') || message.includes('doesn\'t exist')) {
                    return { found: false, code: 'USER_NOT_FOUND', message: 'This account does not exist' };
                }
                if (message.includes('suspended') || message.includes('banned')) {
                    return { found: false, code: 'ACCOUNT_SUSPENDED', message: 'This account has been suspended' };
                }
            }
        }
    } catch (apiError) {
        // API failed, try HTML scraping
    }

    // Method 2: Fallback to HTML scraping
    const htmlResult = await scrapeFromHTML(username);
    if (htmlResult.found) {
        htmlResult.method = 'HTML';
    }
    return htmlResult;
}

// Retry with exponential backoff
async function fetchWithRetry(username, maxRetries = 3) {
    const errors = [];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Add delay before retry (not on first attempt)
            if (attempt > 0) {
                const baseDelay = 1000; // 1 second
                const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
                const jitter = Math.random() * 500; // Random 0-500ms
                const totalDelay = exponentialDelay + jitter;

                await sleep(totalDelay);
            }

            const result = await fetchInstagram(username);

            if (result.found === false) {
                return { success: false, code: result.code, message: result.message };
            }

            if (result.found === true) {
                return {
                    success: true,
                    data: result.data,
                    method: result.method,
                    attempt: attempt + 1
                };
            }
        } catch (err) {
            const errorMsg = err.message;
            errors.push({ attempt: attempt + 1, error: errorMsg });

            // If rate limited, wait longer before retry
            if (errorMsg === 'RATE_LIMITED' && attempt < maxRetries - 1) {
                await sleep(2000 + Math.random() * 1000); // Wait 2-3 seconds
            }
        }
    }

    return {
        success: false,
        code: 'FETCH_FAILED',
        message: 'Unable to fetch account information. Please try again later.',
        errors: errors.slice(0, 3)
    };
}

// Main request handler
async function handleRequest(request) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // Only allow GET
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Root endpoint - API documentation
    if (url.pathname === '/' || url.pathname === '/api') {
        return new Response(JSON.stringify({
            name: 'Instagram Profile Info API',
            version: '2.0.0',
            platform: 'Cloudflare Workers',
            endpoints: {
                'GET /api/user?username=<username>': 'Get Instagram profile info',
            },
            example: '/api/user?username=zuck',
            features: [
                'Global edge network (300+ locations)',
                'No cold starts',
                'Automatic failover',
                'Smart retry logic',
                'Rate limit handling'
            ],
            author: '@pluggerpy',
            poweredBy: '@vexelsocials'
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // User endpoint
    if (url.pathname === '/api/user') {
        let username = url.searchParams.get('username');

        if (!username) {
            return new Response(JSON.stringify({ success: false, error: 'Username required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        username = username.trim().toLowerCase().replace(/^@/, '');

        if (!username || !/^[a-z0-9._]{1,30}$/.test(username)) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid username format' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const startTime = Date.now();

        try {
            const result = await fetchWithRetry(username, 3);
            const responseTime = Date.now() - startTime;

            if (result.success) {
                return new Response(JSON.stringify({
                    success: true,
                    data: result.data,
                    responseTime: `${responseTime}ms`,
                    method: result.method,
                    attempt: result.attempt,
                    edge: request.cf?.colo || 'unknown', // Cloudflare edge location
                    credits: { author: '@pluggerpy', poweredBy: '@vexelsocials' },
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Handle specific error codes
            if (result.code === 'USER_NOT_FOUND') {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'User not found',
                    message: 'This Instagram account does not exist',
                    code: 'USER_NOT_FOUND',
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (result.code === 'ACCOUNT_SUSPENDED') {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Account suspended',
                    message: 'This account has been suspended for violating Instagram\'s community guidelines',
                    code: 'ACCOUNT_SUSPENDED',
                }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (result.code === 'ACCOUNT_NOT_AVAILABLE') {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Account not available',
                    message: 'This account is not available. It may have been banned, deleted, or suspended',
                    code: 'ACCOUNT_NOT_AVAILABLE',
                }), {
                    status: 410,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (result.code === 'ACCOUNT_DEACTIVATED') {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Account deactivated',
                    message: 'This account has been deactivated or deleted by the user',
                    code: 'ACCOUNT_DEACTIVATED',
                }), {
                    status: 410,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (result.code === 'TEMPORARILY_UNAVAILABLE') {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Temporarily unavailable',
                    message: 'This account is temporarily unavailable. Please try again later',
                    code: 'TEMPORARILY_UNAVAILABLE',
                }), {
                    status: 503,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Generic error
            return new Response(JSON.stringify({
                success: false,
                error: 'Service unavailable',
                message: 'Unable to fetch account information at this time',
                code: result.code || 'FETCH_FAILED',
                debug: result.errors,
            }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (error) {
            const responseTime = Date.now() - startTime;

            // Handle rate limiting
            if (error.message === 'RATE_LIMITED') {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Rate limited',
                    message: 'Too many requests. Please try again later',
                    code: 'RATE_LIMITED',
                    responseTime: `${responseTime}ms`,
                }), {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                success: false,
                error: 'Internal error',
                message: error.message || 'An unexpected error occurred',
                code: 'INTERNAL_ERROR',
                responseTime: `${responseTime}ms`,
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Export for Cloudflare Workers
export default {
    async fetch(request, env, ctx) {
        return handleRequest(request);
    }
};
