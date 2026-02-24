import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

export const fetchPrices = async (params = {}) => {
    const response = await api.get('/prices', { params });
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
