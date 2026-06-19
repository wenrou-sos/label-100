import { Box, Button, Chip, Divider, Popover, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useAppStore } from '@/context/AppStoreContext';
import { NOTIFICATION_TYPE_META } from '@/utils/notifications';
import { EmptyState } from './EmptyState';
import type { SystemNotification } from '@/types';
import { format, isToday, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function formatTime(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return `今天 ${format(d, 'HH:mm')}`;
  return format(d, 'M月d日 HH:mm', { locale: zhCN });
}

interface Props {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ anchorEl, open, onClose }: Props) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    readNotificationIds,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppStore();

  const handleClick = (n: SystemNotification) => {
    markNotificationRead(n.id);
    onClose();
    navigate(n.targetPath);
  };

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: { mt: 1.2, borderRadius: 3, boxShadow: 6, width: 380, maxWidth: '92vw' },
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.2, py: 1.6 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>通知中心</Typography>
          {unreadCount > 0 && (
            <Chip
              size="small"
              color="primary"
              label={`${unreadCount} 条未读`}
              sx={{ height: 20, fontSize: 11 }}
            />
          )}
        </Stack>
        <Button
          size="small"
          color="primary"
          variant="text"
          startIcon={<DoneAllRoundedIcon fontSize="small" />}
          disabled={unreadCount === 0}
          onClick={() => markAllNotificationsRead()}
          sx={{ fontSize: 12, minWidth: 'auto', py: 0.3 }}
        >
          全部标为已读
        </Button>
      </Stack>
      <Divider />
      {notifications.length === 0 ? (
        <Box sx={{ py: 6 }}>
          <EmptyState title="暂无待办通知" subtitle="一切正常，稍后再来看看吧" />
        </Box>
      ) : (
        <Box sx={{ maxHeight: 440, overflow: 'auto' }}>
          {notifications.map((n, idx) => {
            const meta = NOTIFICATION_TYPE_META[n.type];
            const isUnread = !readNotificationIds.has(n.id);
            return (
              <Box key={n.id}>
                <Box
                  onClick={() => handleClick(n)}
                  sx={{
                    px: 2.2,
                    py: 1.6,
                    cursor: 'pointer',
                    bgcolor: isUnread ? '#F6FBFF' : 'transparent',
                    position: 'relative',
                    '&:hover': { bgcolor: isUnread ? '#ECF5FD' : '#FAF7F2' },
                  }}
                >
                  {isUnread && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 18,
                        left: 10,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#1976D2',
                        boxShadow: 1,
                      }}
                    />
                  )}
                  <Stack direction="row" spacing={1.2} alignItems="flex-start" sx={{ pl: isUnread ? 0.2 : 0.2 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        flexShrink: 0,
                        bgcolor:
                          meta.color === 'warning' ? '#FFF4E0' :
                          meta.color === 'primary' ? '#E3EEF7' :
                          meta.color === 'error' ? '#FBE3E0' : '#E1EBEF',
                        color:
                          meta.color === 'warning' ? '#B7791F' :
                          meta.color === 'primary' ? '#1A5276' :
                          meta.color === 'error' ? '#A93226' : '#2C3E50',
                      }}
                    >
                      {meta.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {n.title}
                        </Typography>
                        <Chip
                          label={meta.label}
                          size="small"
                          color={meta.color}
                          variant="outlined"
                          sx={{ height: 18, fontSize: 10, flexShrink: 0 }}
                        />
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', lineHeight: 1.5 }}
                      >
                        {n.description}
                      </Typography>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                        {n.orderId && (
                          <Typography variant="caption" color="primary" sx={{ fontFamily: 'monospace' }}>
                            订单 {n.orderId}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.disabled">
                          {formatTime(n.createdAt)}
                        </Typography>
                      </Stack>
                    </Box>
                    <ArrowForwardRoundedIcon
                      color="action"
                      fontSize="small"
                      sx={{ mt: 0.3, flexShrink: 0, opacity: 0.5 }}
                    />
                  </Stack>
                </Box>
                {idx < notifications.length - 1 && <Divider variant="middle" />}
              </Box>
            );
          })}
        </Box>
      )}
    </Popover>
  );
}
