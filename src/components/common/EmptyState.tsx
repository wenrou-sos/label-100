import { Box, Button, Stack, Typography } from '@mui/material';

// 空状态
export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 8, textAlign: 'center' }}>
      {icon && (
        <Box
          sx={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: '#F2EDE4',
            color: 'text.secondary',
            '& svg': { fontSize: 40 },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h4">{title}</Typography>
      {subtitle && <Typography variant="body2" sx={{ maxWidth: 380 }}>{subtitle}</Typography>}
      {actionLabel && onAction && (
        <Button variant="contained" color="primary" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
