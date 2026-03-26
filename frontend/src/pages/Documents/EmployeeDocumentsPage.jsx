import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, InputAdornment,
    List, ListItemButton, ListItemAvatar, ListItemText,
    Avatar, CircularProgress, Alert, Divider, Chip,
} from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon, ArrowForwardIos as ArrowIcon } from '@mui/icons-material';
import employeeService from '../../services/employeeService';
import EmployeeDocuments from '../../components/Documents/EmployeeDocuments';

const EmployeeDocumentsPage = () => {
    const [employees, setEmployees] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null); // { employee_id, name }

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await employeeService.getAllEmployees();
                if (res.success) {
                    const list = Array.isArray(res.data) ? res.data : [];
                    setEmployees(list);
                    setFiltered(list);
                } else {
                    setError('Failed to load employees');
                }
            } catch {
                setError('Failed to load employees');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            employees.filter(e =>
                (e.employee_name || '').toLowerCase().includes(q) ||
                (e.employee_code || '').toLowerCase().includes(q) ||
                (e.department || '').toLowerCase().includes(q)
            )
        );
    }, [search, employees]);

    if (selected) {
        return (
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <Chip
                        label="← All Employees"
                        onClick={() => setSelected(null)}
                        clickable
                        variant="outlined"
                    />
                    <Typography variant="body2" color="text.secondary">
                        / {selected.name}
                    </Typography>
                </Box>
                <EmployeeDocuments
                    employeeId={selected.employee_id}
                    employeeName={selected.name}
                />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Employee Documents
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select an employee to view and manage their uploaded documents
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField
                fullWidth
                placeholder="Search by name, code or department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                }}
                sx={{ mb: 2 }}
            />

            <Paper>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : filtered.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">No employees found</Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {filtered.map((emp, idx) => (
                            <Box key={emp.employee_id}>
                                <ListItemButton
                                    onClick={() => setSelected({
                                        employee_id: emp.employee_id,
                                        name: emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
                                    })}
                                    sx={{ py: 1.5, px: 2 }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                                            <PersonIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body1" fontWeight={500}>
                                                {emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="caption" color="text.secondary">
                                                {emp.employee_code} • {emp.department} • {emp.designation}
                                            </Typography>
                                        }
                                    />
                                    <Chip
                                        label={emp.status}
                                        size="small"
                                        color={emp.status === 'ACTIVE' ? 'success' : 'default'}
                                        sx={{ mr: 1 }}
                                    />
                                    <ArrowIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                </ListItemButton>
                                {idx < filtered.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                )}
            </Paper>
        </Box>
    );
};

export default EmployeeDocumentsPage;
