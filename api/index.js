/**
 * Instagram Profile Info API
 * Root endpoint - shows API documentation
 */

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.status(200).json({
    name: 'Instagram Profile Info API',
    version: '1.0.0',
    endpoints: {
      'GET /api/user?username=<username>': 'Get Instagram profile info',
      'GET /api/user/<username>': 'Get Instagram profile info (alternative)',
    },
    example: '/api/user?username=zuck',
    author: '@pluggerpy',
    poweredBy: '@vexelsocials'
  });
};
