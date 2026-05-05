import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

export const exportFactoryGridToExcel = async (startDate, endDate, records) => {
    try {
        if (records.length === 0) {
            alert('No factory attendance data found for the selected period');
            return;
        }

        // Group by employee
        const employeeMap = {};
        
        records.forEach(record => {
            if (!employeeMap[record.employee_id]) {
                employeeMap[record.employee_id] = {
                    employee_code: record.employee_code || '',
                    name: record.employee_name,
                    department: record.department || 'N/A',
                    days: {},
                    hasPresent: false
                };
            }
            const dateKey = dayjs(record.attendance_date).format('YYYY-MM-DD');
            employeeMap[record.employee_id].days[dateKey] = record.display_value || '';
            
            // Track if employee has any present days
            if (record.display_value && record.display_value !== 'A') {
                employeeMap[record.employee_id].hasPresent = true;
            }
        });

        // Sort employees: present first (sorted by emp code), then absent (sorted by emp code)
        const sortedEmployees = Object.entries(employeeMap).sort((a, b) => {
            // Sort by hasPresent (true first), then by employee code
            if (a[1].hasPresent !== b[1].hasPresent) {
                return b[1].hasPresent ? 1 : -1;
            }
            // Within same group, sort by employee code numerically
            const codeA = parseInt(a[1].employee_code) || 0;
            const codeB = parseInt(b[1].employee_code) || 0;
            return codeA - codeB;
        });

        const totalEmployees = Object.keys(employeeMap).length;
        
        // Generate all dates in range
        const dateColumns = [];
        let currentDate = startDate.clone();
        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
            dateColumns.push({
                dateKey: currentDate.format('YYYY-MM-DD'),
                day: currentDate.date()
            });
            currentDate = currentDate.add(1, 'day');
        }

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Factory Attendance', {
            views: [{ state: 'frozen', xSplit: 3, ySplit: 1 }]
        });

        // Define columns
        const columns = [
            { header: 'DEPARTMENT', key: 'department', width: 20 },
            { header: 'NAME', key: 'name', width: 25 },
            { header: 'EMP CODE', key: 'empCode', width: 12 },
            { header: 'BANK/CASH', key: 'bankCash', width: 12 }
        ];
        
        dateColumns.forEach(col => {
            columns.push({ header: col.day.toString(), key: `day_${col.day}`, width: 6 });
        });
        
        columns.push(
            { header: 'Total Hours', key: 'totalHours', width: 12 },
            { header: 'No of Days', key: 'noOfDays', width: 12 },
            { header: 'Rate', key: 'rate', width: 10 },
            { header: 'Gross Amount', key: 'grossAmount', width: 15 },
            { header: 'Advance', key: 'advance', width: 12 },
            { header: 'Net Payable', key: 'netPayable', width: 15 },
            { header: 'SIGNATURE OF EMPLOYEE', key: 'signature', width: 25 }
        );
        
        worksheet.columns = columns;

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            };
            cell.font = {
                bold: true,
                color: { argb: 'FFFFFFFF' },
                size: 11
            };
            cell.alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        });

        // Add employee rows
        let rowIndex = 0;
        sortedEmployees.forEach(([empId, emp]) => {
            let totalHours = 0;
            let workingDays = 0;
            
            const rowData = {
                department: emp.department,
                name: emp.name,
                empCode: emp.employee_code,
                bankCash: '' // Keep blank as requested
            };
            
            dateColumns.forEach(col => {
                const value = emp.days[col.dateKey] || '';
                rowData[`day_${col.day}`] = value;
                
                // Calculate totals from display value
                if (value && !isNaN(value)) {
                    // Numeric value = hours worked (already includes OT from backend)
                    totalHours += parseInt(value);
                    workingDays++;
                } else if (value === 'HD') {
                    workingDays += 1; // Count as 1 day
                } else if (value === 'P') {
                    workingDays++;
                }
            });
            
            rowData.totalHours = totalHours;
            rowData.noOfDays = workingDays;
            rowData.rate = '';
            rowData.grossAmount = '';
            rowData.advance = '';
            rowData.netPayable = '';
            rowData.signature = '';
            
            const row = worksheet.addRow(rowData);
            row.height = 22;
            
            // Alternating row colors
            const isEvenRow = rowIndex % 2 === 0;
            
            // Style employee row
            row.eachCell((cell, colNumber) => {
                // Alternating background
                if (isEvenRow) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF8F9FA' }
                    };
                }
                
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'center'
                };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                    left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                    bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                    right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
                };
                
                // Bold and left-align department, name, and emp code columns
                if (colNumber === 1 || colNumber === 2 || colNumber === 3) {
                    cell.font = { bold: true, size: 11 };
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'left'
                    };
                }
                
                // Color code attendance values
                const cellValue = cell.value;
                if (cellValue === 'A') {
                    // Absent - red background
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFC7CE' }
                    };
                    cell.font = { bold: true, color: { argb: 'FF9C0006' } };
                } else if (cellValue === 'HD') {
                    // Half day - yellow background
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFEB9C' }
                    };
                    cell.font = { bold: true, color: { argb: 'FF9C5700' } };
                } else if (cellValue === 'L') {
                    // Leave - blue background
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD9E1F2' }
                    };
                    cell.font = { bold: true, color: { argb: 'FF1F4E78' } };
                } else if (cellValue && !isNaN(cellValue) && colNumber > 4 && colNumber <= 4 + dateColumns.length) {
                    // Hours worked - green tint
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFC6EFCE' }
                    };
                    cell.font = { bold: true, color: { argb: 'FF006100' } };
                }
                
                // Highlight totals columns
                if (colNumber === 4 + dateColumns.length + 1 || colNumber === 4 + dateColumns.length + 2) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE2EFDA' }
                    };
                    cell.font = { bold: true, size: 11, color: { argb: 'FF375623' } };
                }
            });
            
            rowIndex++;
        });

        // Add empty row
        worksheet.addRow({});

        // Footer calculations
        const footerRows = [
            { label: 'TOTAL HRS IN A DAY', calc: (col) => {
                let total = 0;
                Object.values(employeeMap).forEach(emp => {
                    const value = emp.days[col.dateKey] || '';
                    if (value && !isNaN(value)) total += parseInt(value);
                });
                return total || '';
            }},
            { label: 'TOTAL HEADS WORKED IN A DAY', calc: (col) => {
                let count = 0;
                Object.values(employeeMap).forEach(emp => {
                    const value = emp.days[col.dateKey] || '';
                    if (value && value !== 'A' && value !== '') count++;
                });
                return count || '';
            }},
            { label: 'AVG WORKING', calc: (col) => {
                let total = 0, count = 0;
                Object.values(employeeMap).forEach(emp => {
                    const value = emp.days[col.dateKey] || '';
                    if (value && !isNaN(value)) {
                        total += parseInt(value);
                        count++;
                    }
                });
                return count > 0 ? Math.round(total / count) : '';
            }},
            { label: 'NO OF HEADS IN SECTION', calc: () => totalEmployees },
            { label: 'ON LEAVE', calc: (col) => {
                let count = 0;
                Object.values(employeeMap).forEach(emp => {
                    const value = emp.days[col.dateKey] || '';
                    if (value === 'L') count++;
                });
                return count || '';
            }},
            { label: 'WORKING IN PLANT', calc: (col) => {
                let count = 0;
                Object.values(employeeMap).forEach(emp => {
                    const value = emp.days[col.dateKey] || '';
                    if (value && value !== 'A' && value !== '' && value !== 'L') count++;
                });
                return count || '';
            }},
            { label: 'ABSENT (IN ROOM)', calc: (col) => {
                let count = 0;
                Object.values(employeeMap).forEach(emp => {
                    const value = emp.days[col.dateKey] || '';
                    if (value === 'A') count++;
                });
                return count || '';
            }}
        ];

        footerRows.forEach((footer, index) => {
            const rowData = {
                department: footer.label,
                name: '',
                empCode: '',
                bankCash: ''
            };
            
            dateColumns.forEach(col => {
                rowData[`day_${col.day}`] = footer.calc(col);
            });
            
            rowData.totalHours = '';
            rowData.noOfDays = '';
            rowData.rate = '';
            rowData.grossAmount = '';
            rowData.advance = '';
            rowData.netPayable = '';
            rowData.signature = '';
            
            const row = worksheet.addRow(rowData);
            row.height = 24;
            
            // Different colors for different footer sections
            let bgColor = 'FFE7E6E6';
            let fontColor = 'FF000000';
            
            if (index === 0 || index === 1 || index === 2) {
                // Calculation rows - light blue
                bgColor = 'FFDCE6F1';
                fontColor = 'FF1F4E78';
            } else if (index === 3) {
                // Total heads - light green
                bgColor = 'FFD9EAD3';
                fontColor = 'FF274E13';
            } else if (index === 4) {
                // On leave - light yellow
                bgColor = 'FFFFF2CC';
                fontColor = 'FF7F6000';
            } else if (index === 5) {
                // Working - light green
                bgColor = 'FFD0E0E3';
                fontColor = 'FF0C343D';
            } else if (index === 6) {
                // Absent - light red
                bgColor = 'FFF4CCCC';
                fontColor = 'FF660000';
            }
            
            // Style footer row
            row.eachCell((cell, colNumber) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
                cell.font = {
                    bold: true,
                    size: 10,
                    color: { argb: fontColor }
                };
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: colNumber === 1 ? 'left' : 'center'
                };
                cell.border = {
                    top: { style: 'medium', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'medium', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
                
                // Make label column extra bold
                if (colNumber === 1) {
                    cell.font = {
                        bold: true,
                        size: 11,
                        color: { argb: fontColor }
                    };
                }
            });
        });

        // Generate filename
        const filename = `Factory_Attendance_${startDate.format('YYYY-MM-DD')}_to_${endDate.format('YYYY-MM-DD')}.xlsx`;

        // Write file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();

        console.log('Factory grid Excel export successful');
    } catch (error) {
        console.error('Factory grid export failed:', error);
        throw error;
    }
};
