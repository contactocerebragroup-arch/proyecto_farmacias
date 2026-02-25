import React, { useState, useEffect, useMemo } from 'react';
import {
    Container, Typography, Box, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, CircularProgress,
    Alert, TextField, Chip, MenuItem, Select, FormControl, InputLabel,
    Skeleton, Snackbar, Grid, IconButton, useMediaQuery, CssBaseline, ThemeProvider, createTheme
} from '@mui/material';
import { Search, Language, AutoFixHigh, KeyboardArrowUp, KeyboardArrowDown, Tune } from '@mui/icons-material';
import { fetchPrices, triggerScrapeUrl } from '../api';

const AppContent = () => {
    // State
    const [url, setUrl] = useState('');
    const [apiKey, setApiKey] = useState(localStorage.getItem('APP_API_KEY') || '');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scraping, setScraping] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [showConfig, setShowConfig] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('Todos'); // 'Todos', 'Ofertas', 'Normales'
    const [sortOrder, setSortOrder] = useState('asc');

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchPrices({ page: 1, limit: 100 });
            setResults(data.results);
        } catch (err) {
            console.error("No se pudieron cargar los datos", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleScrape = async () => {
        if (!url) {
            setError('Ingresa una URL válida de farmacia o producto.');
            return;
        }
        localStorage.setItem('APP_API_KEY', apiKey);
        setScraping(true);
        setError(null);
        try {
            const res = await triggerScrapeUrl(apiKey, url);
            setSuccessMsg(`Extracción Genius completada: ${res.results.length} ítems extraídos.`);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.detail || 'Error en el análisis. Revisa la consola o la configuración X-API-Key.');
        } finally {
            setScraping(false);
        }
    };

    const filteredAndSorted = useMemo(() => {
        let items = [...results];

        // Search Filter
        if (search) {
            items = items.filter(i => i.product.toLowerCase().includes(search.toLowerCase()));
        }

        // Type Filter
        if (filterType === 'Ofertas') {
            items = items.filter(i => i.es_oferta);
        } else if (filterType === 'Normales') {
            items = items.filter(i => !i.es_oferta);
        }

        // Sort
        items.sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);

        return items;
    }, [results, search, filterType, sortOrder]);

    const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);

    return (
        <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
            <Box textAlign="center" mb={6}>
                <Typography variant="h3" fontWeight="900" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    WebCheck Farmacias <Chip label="Genius Scraping" color="secondary" icon={<AutoFixHigh />} />
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Pega cualquier enlace de farmacia y extraeremos precios, stock y ofertas (renderizado JS completo).
                </Typography>
            </Box>

            <Paper sx={{ p: 4, mb: 4, borderRadius: 4, background: 'rgba(128, 128, 128, 0.05)' }} elevation={4}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={9}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            label="Ingresa URL principal (Producto, Categoría, Búsqueda...)"
                            placeholder="https://www.cruzverde.cl/medicamentos/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            InputProps={{ sx: { fontSize: '1.2rem', padding: 1, borderRadius: 3 } }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleScrape}
                            disabled={scraping}
                            sx={{ height: '70px', borderRadius: 3, fontSize: '1.2rem', fontWeight: 'bold' }}
                            startIcon={scraping ? <CircularProgress color="inherit" size={24} /> : <AutoFixHigh />}
                        >
                            {scraping ? 'Analizando...' : 'Analizar Ahora'}
                        </Button>
                    </Grid>
                </Grid>
                <Box mt={2} display="flex" justifyContent="flex-end" alignItems="center">
                    <IconButton onClick={() => setShowConfig(!showConfig)} color={apiKey ? 'primary' : 'warning'} title="Configurar Seguridad">
                        <Tune />
                    </IconButton>
                </Box>
                {showConfig && (
                    <Box mt={2} p={2} bgcolor="background.default" borderRadius={2}>
                        <TextField
                            fullWidth
                            type="password"
                            label="APP_API_KEY (Seguridad Vercel)"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            size="small"
                        />
                        <Typography variant="caption" color="text.secondary" mt={1} display="block">
                            La API está asegurada. Añade tu API Key para permitir la extracción.
                        </Typography>
                    </Box>
                )}
            </Paper>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <TextField
                    placeholder="Buscar producto localmente..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
                    sx={{ width: { xs: '100%', md: '300px' } }}
                />

                <Box display="flex" gap={2}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Filtro de Ofertas</InputLabel>
                        <Select value={filterType} label="Filtro de Ofertas" onChange={(e) => setFilterType(e.target.value)}>
                            <MenuItem value="Todos">Todos</MenuItem>
                            <MenuItem value="Ofertas">Solo Ofertas 🔥</MenuItem>
                            <MenuItem value="Normales">Precios Normales</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        startIcon={sortOrder === 'asc' ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        sx={{ minWidth: 120 }}
                    >
                        Precio {sortOrder === 'asc' ? 'Menor' : 'Mayor'}
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={2}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Stock</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Precio (CLP)</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Link</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                                    <TableCell><Skeleton width={80} /></TableCell>
                                    <TableCell><Skeleton width={60} /></TableCell>
                                    <TableCell><Skeleton width={80} /></TableCell>
                                    <TableCell><Skeleton width={40} /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredAndSorted.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Typography color="text.secondary" variant="h6">Sin extracciones recientes.</Typography>
                                    <Typography color="text.secondary" variant="body2">Ingresa tu URL arriba para iniciar análisis.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSorted.map((row, i) => (
                                <TableRow key={i} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{row.product}</TableCell>
                                    <TableCell>
                                        {row.es_oferta ? (
                                            <Chip label="Oferta 🔥" color="error" size="small" sx={{ fontWeight: 'bold' }} />
                                        ) : (
                                            <Chip label="Normal" variant="outlined" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color={row.stock.toLowerCase().includes('stock') ? 'success.main' : 'text.secondary'}>
                                            {row.stock}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight="bold" color="primary">
                                            {formatPrice(row.price)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        {row.url ? <IconButton href={row.url} target="_blank" size="small" color="primary"><Language /></IconButton> : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Snackbar open={!!successMsg} autoHideDuration={6000} onClose={() => setSuccessMsg('')}>
                <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%', borderRadius: 2 }}>{successMsg}</Alert>
            </Snackbar>
        </Container>
    );
};

// Theme Wrapper
const Dashboard = () => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    const theme = React.useMemo(() => createTheme({
        palette: {
            mode: prefersDarkMode ? 'dark' : 'light',
            primary: { main: prefersDarkMode ? '#66bb6a' : '#2e7d32' },
            secondary: { main: '#f44336' },
            background: {
                default: prefersDarkMode ? '#121212' : '#f5f5f5',
                paper: prefersDarkMode ? '#1e1e1e' : '#ffffff'
            }
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: { textTransform: 'none' }
                }
            }
        }
    }), [prefersDarkMode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppContent />
        </ThemeProvider>
    );
};

export default Dashboard;
