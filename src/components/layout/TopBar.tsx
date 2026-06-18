import { AppBar, Box, IconButton, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { titleFromPath } from './navConfig';

export function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = titleFromPath(pathname);

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ px: { xs: 2, md: 3 }, gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="帮助">
            <IconButton onClick={() => navigate('/dashboard')}>
              <HelpOutlineOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="通知">
            <IconButton>
              <NotificationsNoneOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="账户">
            <IconButton>
              <AccountCircleOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
