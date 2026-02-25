import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

export const fetchPrices = async (params = {}) => {
    const response = await api.get('/prices', { params });
    return response.data;
};

export const triggerScrapeUrl = async (url) => {
    const response = await api.post('/scrape-url', { url });
    return response.data;
};

export const triggerScrapeGeo = async (lat, lng) => {
    const response = await api.post('/scrape-geo', { lat, lng });
    return response.data;
};

export const triggerScrape = async () => {
    const response = await api.post('/scrape', {});
    return response.data;
};
