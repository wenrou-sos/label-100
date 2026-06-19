import { useRef, useState } from 'react';
import { AppBar, Badge, Box, IconButton, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { titleFromPath } from './navConfig';
import { useAppStore } from '@/context/AppStoreContext';
import { NotificationPanel } from '@/components/common/NotificationPanel';

export function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = titleFromPath(pathname);
  const { unreadCount } = useAppStore();

  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);

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
            <Badge
              badgeContent={unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : 0}
              color="error"
              overlap="circular"
              sx={{
                '& .MuiBadge-badge': {
                  top: 6,
                  right: 6,
                  minWidth: 16,
                  height: 16,
                  fontSize: 10,
                  fontWeight: 700,
                },
              }}
            >
              <IconButton
                ref={notifBtnRef}
                onClick={() => setNotifOpen((o) => !o)}
                color={notifOpen ? 'primary' : 'default'}
              >
                <NotificationsNoneOutlinedIcon />
              </IconButton>
            </Badge>
          </Tooltip>
          <Tooltip title="账户">
            <IconButton>
              <AccountCircleOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>

      <NotificationPanel
        anchorEl={notifBtnRef.current}
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </AppBar>
  );
}
