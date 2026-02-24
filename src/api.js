import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// For production on Vercel, relative path /api works fine.
// For local dev, we might need a proxy or full URL.

export const fetchPrices = async () => {
    const response = await api.get('/prices');
    return response.data;
};

export const triggerScrape = async (apiKey) => {
    const response = await api.post('/scrape', {}, {
        headers: {
            'X-API-Key': apiKey,
        },
    });
    return response.data;
};
