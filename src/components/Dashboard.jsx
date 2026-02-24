import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, CircularProgress,
    Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Refresh, FilterList } from '@mui/icons-material';
import { fetchPrices, triggerScrape } from '../api';

const Dashboard = () => {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scraping, setScraping] = useState(false);
    const [error, setError] = useState(null);
    const [openAuth, setOpenAuth] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [filterPharmacy, setFilterPharmacy] = useState('Todas');

    const pharmacies = ['Todas', 'EcoFarmacias', 'Farmex', 'Meki'];

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await fetchPrices();
            setPrices(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar precios. Verifique la conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleScrape = async () => {
        if (!apiKey) {
            setOpenAuth(true);
            return;
        }

        try {
            setScraping(true);
            await triggerScrape(apiKey);
            await loadData();
            setError(null);
        } catch (err) {
            setError(err.response?.status === 403 ? 'API Key inválida.' : 'Error al iniciar scraping.');
        } finally {
            setScraping(false);
        }
    };

    const filteredPrices = filterPharmacy === 'Todas'
        ? prices
        : prices.filter(p => p.pharmacy === filterPharmacy);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
                    EcoFarmacias Monitor 🇨🇱
                </Typography>
                <Box display="flex" gap={2}>
                    <FormControl sx={{ minWidth: 150 }} size="small">
                        <InputLabel>Farmacia</InputLabel>
                        <Select
                            value={filterPharmacy}
                            label="Farmacia"
                            onChange={(e) => setFilterPharmacy(e.target.value)}
                        >
                            {pharmacies.map(name => (
                                <MenuItem key={name} value={name}>{name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={scraping ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                        onClick={handleScrape}
                        disabled={scraping}
                    >
                        {scraping ? 'Actualizando...' : 'Actualizar'}
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#2e7d32' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Farmacia</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Producto</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Precio (CLP)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Última Actualización</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredPrices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                    No hay datos disponibles para la farmacia seleccionada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPrices.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>
                                        <Chip label={row.pharmacy} color="primary" variant="outlined" size="small" />
                                    </TableCell>
                                    <TableCell>{row.product}</TableCell>
                                    <TableCell align="right">
                                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(row.price)}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(row.timestamp).toLocaleString('es-CL')}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Auth Dialog */}
            <Dialog open={openAuth} onClose={() => setOpenAuth(false)}>
                <DialogTitle>Autenticación Requerida</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" mb={2}>
                        Ingrese la `APP_API_KEY` para autorizar el escaneo de precios.
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="API Key"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAuth(false)}>Cancelar</Button>
                    <Button onClick={() => { setOpenAuth(false); handleScrape(); }} variant="contained">
                        Continuar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Dashboard;
