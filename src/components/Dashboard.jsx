import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, CircularProgress,
    Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, MenuItem, Select, FormControl, InputLabel, Skeleton, Snackbar,
    TablePagination
} from '@mui/material';
import { Refresh, Search, Language } from '@mui/icons-material';
import { fetchPrices, triggerScrape } from '../api';

const Dashboard = () => {
    const [results, setResults] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [scraping, setScraping] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    // States for filtering and paging
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [search, setSearch] = useState('');
    const [pharmacy, setPharmacy] = useState('Todas');

    const [openAuth, setOpenAuth] = useState(false);
    const [apiKey, setApiKey] = useState('');

    const pharmacies = ['Todas', 'EcoFarmacias', 'Farmex', 'Meki'];

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
            setError('Error al conectar con la API de EcoFarmacias.');
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, pharmacy]);

    // Initial load and auto-refresh every 5 minutes
    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 300000); // 5 minutes
        return () => clearInterval(interval);
    }, [loadData]);

    const handleScrape = async () => {
        if (!apiKey) {
            setOpenAuth(true);
            return;
        }
        try {
            setScraping(true);
            const res = await triggerScrape(apiKey);
            setSuccessMsg(`Scraping completado: ${res.count} productos actualizados.`);
            await loadData();
        } catch (err) {
            setError(err.response?.status === 403 ? 'X-API-Key inválida.' : 'Error en el servidor de scraping.');
        } finally {
            setScraping(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box display="flex" alignItems="center">
                    <Typography variant="h4" fontWeight="800" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        EcoFarmacias <Chip label="v2.0 Beta" color="secondary" size="small" />
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={scraping ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                    onClick={handleScrape}
                    disabled={scraping}
                    sx={{ borderRadius: 2, px: 4 }}
                >
                    {scraping ? 'Sincronizando...' : 'Actualizar Precios'}
                </Button>
            </Box>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }} elevation={2}>
                <Box display="flex" gap={2} flexWrap="wrap">
                    <TextField
                        label="Buscar producto (ej: Paracetamol)"
                        variant="outlined"
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ flexGrow: 1, minWidth: '250px' }}
                        InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
                    />
                    <FormControl sx={{ minWidth: 200 }} size="small">
                        <InputLabel>Farmacia</InputLabel>
                        <Select
                            value={pharmacy}
                            label="Farmacia"
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
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Farmacia</TableCell>
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
                                    <Typography variant="body1" color="text.secondary">No se encontraron productos.</Typography>
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

            {/* Snackbar Notifications */}
            <Snackbar open={!!successMsg} autoHideDuration={6000} onClose={() => setSuccessMsg('')}>
                <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%' }}>{successMsg}</Alert>
            </Snackbar>

            {/* Auth Modal */}
            <Dialog open={openAuth} onClose={() => setOpenAuth(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Autenticación Root</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Se requiere `APP_API_KEY` para disparar el scraping masivo en paralelo.
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
                    <Button onClick={() => { setOpenAuth(false); handleScrape(); }} variant="contained">Autorizar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Dashboard;
