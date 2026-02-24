import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, CircularProgress,
    Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, MenuItem, Select, FormControl, InputLabel, Skeleton, Snackbar,
    TablePagination, Tabs, Tab, Grid
} from '@mui/material';
import { Refresh, Search, Language, MyLocation, Link as LinkIcon } from '@mui/icons-material';
import { fetchPrices, triggerScrape, triggerScrapeUrl, triggerScrapeGeo } from '../api';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [results, setResults] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [scraping, setScraping] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Filtering/Paging
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [search, setSearch] = useState('');
    const [pharmacy, setPharmacy] = useState('Todas');

    // Manual Scrape State
    const [manualUrl, setManualUrl] = useState('');

    // Auth
    const [openAuth, setOpenAuth] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [pendingAction, setPendingAction] = useState(null);

    const pharmacies = ['Todas', 'EcoFarmacias', 'Farmex', 'Meki', 'Manual'];

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchPrices({
                page: page + 1,
                limit: rowsPerPage,
                search: search,
                pharmacy: pharmacy
            });
            setResults(data.results);
            setTotal(data.total);
            setError(null);
        } catch (err) {
            setError('Error al conectar con la API.');
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, pharmacy]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleActionWithAuth = (action) => {
        if (!apiKey) {
            setPendingAction(() => action);
            setOpenAuth(true);
        } else {
            action();
        }
    };

    const handleManualScrape = async () => {
        if (!manualUrl) {
            setError('Por favor ingresa una URL válida.');
            return;
        }
        try {
            setScraping(true);
            const res = await triggerScrapeUrl(apiKey, manualUrl);
            setSuccessMsg(`Extracción manual finalizada: ${res.results.length} ítems encontrados.`);
            await loadData();
        } catch (err) {
            setError('Error en el scraping manual. Verifica la URL.');
        } finally {
            setScraping(false);
        }
    };

    const handleGeoScrape = () => {
        if (!navigator.geolocation) {
            setError('Geolocalización no soportada por este navegador.');
            return;
        }
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                setScraping(true);
                const { latitude, longitude } = pos.coords;
                await triggerScrapeGeo(apiKey, latitude, longitude);
                setSuccessMsg('Sincronización geolocalizada completada.');
                await loadData();
            } catch (err) {
                setError('Error en el scraping geolocalizado.');
            } finally {
                setScraping(false);
            }
        }, () => setError('Permiso de ubicación denegado.'));
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setSearch('');
        setPharmacy('Todas');
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="800" color="primary">
                    EcoFarmacias <Chip label="v3.0 General" color="secondary" size="small" />
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadData}
                        disabled={loading}
                        sx={{ mr: 1, borderRadius: 2 }}
                    >
                        Recargar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={scraping ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                        onClick={() => handleActionWithAuth(() => activeTab === 0 ? handleManualScrape() : handleGeoScrape())}
                        disabled={scraping}
                        sx={{ borderRadius: 2 }}
                    >
                        {scraping ? 'Sincronizando...' : activeTab === 0 ? 'Scrapear URL' : 'Actualizar Todo'}
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }} elevation={3}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab icon={<LinkIcon />} label="Scraping Manual" sx={{ fontWeight: 'bold' }} />
                    <Tab icon={<MyLocation />} label="Geolocalización" sx={{ fontWeight: 'bold' }} />
                </Tabs>

                <Box p={3}>
                    {activeTab === 0 ? (
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={9}>
                                <TextField
                                    fullWidth
                                    label="Cualquier URL de e-commerce (Farmacias, Supermercados, etc.)"
                                    placeholder="https://www.ejemplo.cl/producto/..."
                                    value={manualUrl}
                                    onChange={(e) => setManualUrl(e.target.value)}
                                    variant="filled"
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={() => handleActionWithAuth(handleManualScrape)}
                                    disabled={scraping}
                                    sx={{ height: '56px', borderRadius: 2 }}
                                >
                                    Scrapear Ahora
                                </Button>
                            </Grid>
                        </Grid>
                    ) : (
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1" color="text.secondary">
                                Monitorea precios locales en base a tu posición GPS actual en Chile.
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<MyLocation />}
                                onClick={() => handleActionWithAuth(handleGeoScrape)}
                                disabled={scraping}
                            >
                                Scan Mi Zona
                            </Button>
                        </Box>
                    )}
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }} elevation={2}>
                <Box display="flex" gap={2} flexWrap="wrap">
                    <TextField
                        label="Filtrar resultados locales..."
                        variant="outlined"
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ flexGrow: 1, minWidth: '250px' }}
                        InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
                    />
                    <FormControl sx={{ minWidth: 200 }} size="small">
                        <InputLabel>Fuente</InputLabel>
                        <Select
                            value={pharmacy}
                            label="Fuente"
                            onChange={(e) => { setPharmacy(e.target.value); setPage(0); }}
                        >
                            {pharmacies.map(phi => <MenuItem key={phi} value={phi}>{phi}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={4}>
                <Table>
                    <TableHead sx={{ backgroundColor: 'primary.main' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fuente</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Producto</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stock</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Precio (CLP)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Link</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [...Array(6)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={200} /></TableCell>
                                    <TableCell><Skeleton variant="circular" width={20} height={20} /></TableCell>
                                    <TableCell align="right"><Skeleton variant="text" width={60} /></TableCell>
                                    <TableCell><Skeleton variant="rectangular" width={40} height={20} /></TableCell>
                                </TableRow>
                            ))
                        ) : results.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                    <Typography variant="body1" color="text.secondary">Sin datos actuales. Inicia un scraping.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            results.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell><Chip label={row.pharmacy} size="small" color="primary" variant="outlined" /></TableCell>
                                    <TableCell><Typography variant="body2" fontWeight="500">{row.product}</Typography></TableCell>
                                    <TableCell>
                                        <Chip
                                            label={row.stock || 'N/A'}
                                            size="small"
                                            color={row.stock?.toLowerCase().includes('stock') && !row.stock?.toLowerCase().includes('sin') ? "success" : "default"}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight="bold" color="primary.main">
                                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(row.price)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {row.url ? <Button size="small" href={row.url} target="_blank"><Language fontSize="small" /></Button> : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10, 20, 50]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Filas:"
                />
            </TableContainer>

            <Snackbar open={!!successMsg} autoHideDuration={6000} onClose={() => setSuccessMsg('')}>
                <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%', borderRadius: 2 }}>{successMsg}</Alert>
            </Snackbar>

            <Dialog open={openAuth} onClose={() => setOpenAuth(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Seguridad del Sistema</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Ingresa tu `APP_API_KEY` para autorizar operaciones de scraping.
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        type="password"
                        label="X-API-Key"
                        variant="filled"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenAuth(false)}>Cancelar</Button>
                    <Button onClick={() => { setOpenAuth(false); pendingAction?.(); }} variant="contained" sx={{ borderRadius: 2 }}>Autorizar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Dashboard;
