/**
 * Instagram Profile Info API - Optimized for Vercel
 * Direct requests without proxies
 */

const fetch = require('node-fetch');


const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
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
        timeout: 2500,
    });

    if (response.status === 404) {
        return { found: false, code: 'USER_NOT_FOUND' };
    }

    if (response.status !== 200) {
        throw new Error(`HTTP_${response.status}`);
    }

    const html = await response.text();

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
            timeout: 2500,
        });

        if (response.status === 404) {
            return { found: false, code: 'USER_NOT_FOUND' };
        }

        if (response.status === 200) {
            const data = await response.json();
            const user = data?.data?.user;

            if (user) {
                return { found: true, data: formatUserData(user), method: 'API' };
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

// Retry with different attempts
async function fetchWithRetry(username, maxRetries = 2) {
    const errors = [];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const result = await fetchInstagram(username);

            if (result.found === false) {
                return { success: false, code: result.code };
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
            errors.push({ attempt: attempt + 1, error: err.message });
            // Continue to next attempt
        }
    }

    return {
        success: false,
        code: 'FETCH_FAILED',
        errors: errors.slice(0, 2) // Return first 2 errors for debugging
    };
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    let username = req.query.username;

    if (!username) {
        return res.status(400).json({ success: false, error: 'Username required' });
    }

    username = username.trim().toLowerCase().replace(/^@/, '');

    if (!username || !/^[a-z0-9._]{1,30}$/.test(username)) {
        return res.status(400).json({ success: false, error: 'Invalid username' });
    }

    const startTime = Date.now();

    try {
        const result = await fetchWithRetry(username, 2);
        const responseTime = Date.now() - startTime;

        if (result.success) {
            return res.status(200).json({
                success: true,
                data: result.data,
                responseTime: `${responseTime}ms`,
                method: result.method,
                note: `attempt:${result.attempt}`,
                credits: { author: '@pluggerpy', poweredBy: '@vexelsocials' },
            });
        }

        if (result.code === 'USER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                code: 'USER_NOT_FOUND',
            });
        }

        return res.status(503).json({
            success: false,
            error: 'Service unavailable',
            code: result.code,
            debug: result.errors,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal error',
            message: error.message,
        });
    }
};
