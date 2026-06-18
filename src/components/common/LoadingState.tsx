import { Box, CircularProgress, Stack, Typography } from '@mui/material';

// 全屏加载
export function FullScreenLoader({ label = '加载中…' }: { label?: string }) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 12 }}>
      <CircularProgress size={40} sx={{ color: 'primary.main' }} />
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Stack>
  );
}

// 内联加载
export function InlineLoader({ label = '加载中…' }: { label?: string }) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
      <Stack alignItems="center" spacing={1.5}>
        <CircularProgress size={28} sx={{ color: 'primary.main' }} />
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Stack>
    </Box>
  );
}
