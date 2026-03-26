import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

/**
 * AppDatePicker — drop-in replacement for <TextField type="date" />
 *
 * Props:
 *   label        string
 *   value        string  "YYYY-MM-DD"
 *   onChange     fn(newValue: string "YYYY-MM-DD")
 *   required     bool
 *   fullWidth    bool
 *   size         "small" | "medium"
 *   disabled     bool
 *   minDate      string "YYYY-MM-DD"
 *   maxDate      string "YYYY-MM-DD"
 *   sx           object
 */
const AppDatePicker = ({
    label,
    value,
    onChange,
    required = false,
    fullWidth = true,
    size = 'medium',
    disabled = false,
    minDate,
    maxDate,
    sx,
    ...rest
}) => {
    const dayjsValue = value ? dayjs(value) : null;

    const handleChange = (newVal) => {
        if (!newVal || !newVal.isValid()) {
            onChange('');
        } else {
            onChange(newVal.format('YYYY-MM-DD'));
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                label={label}
                value={dayjsValue}
                onChange={handleChange}
                disabled={disabled}
                minDate={minDate ? dayjs(minDate) : undefined}
                maxDate={maxDate ? dayjs(maxDate) : undefined}
                slotProps={{
                    textField: {
                        required,
                        fullWidth,
                        size,
                        sx,
                        ...rest
                    },
                    actionBar: {
                        actions: ['clear', 'today', 'accept']
                    },
                    layout: {
                        sx: {
                            '& .MuiDateCalendar-root': {
                                height: 'auto',
                                maxHeight: 'none'
                            },
                            '& .MuiPickersSlideTransition-root': {
                                minHeight: '200px'
                            },
                            '& .MuiPickersLayout-actionBar': {
                                pt: 0,
                                pb: 0.5
                            }
                        }
                    }
                }}
                format="DD/MM/YYYY"
            />
        </LocalizationProvider>
    );
};

export default AppDatePicker;
