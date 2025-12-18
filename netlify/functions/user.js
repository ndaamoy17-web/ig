/**
 * Instagram Profile Info API - Netlify Serverless Function
 * Wrapper for the main user API logic
 */

const userHandler = require('../../api/user');

exports.handler = async (event, context) => {
    // Create request and response objects compatible with the existing code
    const req = {
        method: event.httpMethod,
        query: event.queryStringParameters || {},
        headers: event.headers || {}
    };

    // Mock response object
    let statusCode = 200;
    let headers = {
        'Content-Type': 'application/json'
    };
    let body = '';

    const res = {
        setHeader: (key, value) => {
            headers[key] = value;
        },
        status: (code) => {
            statusCode = code;
            return res;
        },
        json: (data) => {
            body = JSON.stringify(data);
            return res;
        },
        end: () => {
            return res;
        }
    };

    // Call the original handler
    await userHandler(req, res);

    return {
        statusCode,
        headers,
        body
    };
};
