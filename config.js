window.API_CONFIG = {
    BASE_URL: 'https://generativelanguage.googleapis.com',
    ENDPOINTS: {
        GENERATE: '/v1beta/models/gemini-2.0-flash:generateContent'
    },
    DEFAULT_PARAMS: {
        maxTokens: 8192, // Increased for longer outputs
        temperature: 0.7,
        topP: 0.9
    },
    API_KEY: 'your-api-key' // Replace with actual key
};