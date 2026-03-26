import { useContext } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Stack } from '@mui/material';
import {
    Description as LettersIcon,
    Article as TemplateIcon,
    Send as GenerateIcon,
    FolderShared as EmpDocsIcon,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';
import LetterTemplates from './Admin/LetterTemplates';
import GenerateLetter from './Admin/GenerateLetter';
import MyLetters from './Documents/MyLetters';
import EmployeeDocumentsPage from './Documents/EmployeeDocumentsPage';
import { useState } from 'react';

const Documents = () => {
    const { user } = useContext(AuthContext);
    const { currentView } = useProfileSwitching();
    // Show HR tabs only when actually in HR view
    const isHR = user?.role === 'HR' && currentView === 'HR';

    // HR tabs: My Letters | Letter Templates | Generate Letter
    // Employee/Manager tabs: My Letters only
    const tabs = isHR
        ? [
            { label: 'All Letters',          icon: <LettersIcon />,  component: MyLetters },
            { label: 'Employee Documents',   icon: <EmpDocsIcon />,  component: EmployeeDocumentsPage },
            { label: 'Letter Templates',     icon: <TemplateIcon />, component: LetterTemplates },
            { label: 'Generate Letter',      icon: <GenerateIcon />, component: GenerateLetter },
          ]
        : [
            { label: 'My Documents', icon: <LettersIcon />, component: MyLetters },
          ];

    const [activeTab, setActiveTab] = useState(0);
    const ActiveComponent = tabs[activeTab].component;

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>Documents</Typography>
                <Typography variant="body2" color="text.secondary">
                    {isHR ? 'Manage letter templates, generate letters, and view all employee documents' : 'View and download your letters and documents'}
                </Typography>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            minHeight: 56,
                            textTransform: 'none',
                            fontWeight: 500,
                            minWidth: { xs: 120, sm: 160 },
                        },
                    }}
                >
                    {tabs.map((tab, i) => (
                        <Tab
                            key={i}
                            label={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    {tab.icon}
                                    <Typography variant="body2">{tab.label}</Typography>
                                </Stack>
                            }
                        />
                    ))}
                </Tabs>
            </Paper>

            <ActiveComponent />
        </Box>
    );
};

export default Documents;
