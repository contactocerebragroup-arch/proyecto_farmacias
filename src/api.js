import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

export const fetchPrices = async (params = {}) => {
    const response = await api.get('/prices', { params });
    return response.data;
};

export const triggerScrapeUrl = async (apiKey, url) => {
    const response = await api.post('/scrape-url', { url }, {
        headers: { 'X-API-Key': apiKey },
    });
    return response.data;
};

export const triggerScrapeGeo = async (apiKey, lat, lng) => {
    const response = await api.post('/scrape-geo', { lat, lng }, {
        headers: { 'X-API-Key': apiKey },
    });
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
