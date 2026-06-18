import { Box, Stack, Typography, type SxProps, type Theme } from '@mui/material';

// 页面标题区：标题 + 副标题 + 右侧操作槽
export function PageHeader({
  title,
  subtitle,
  actions,
  icon,
  sx,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={2}
      sx={{ mb: 3, ...sx }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        {icon && (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: '0 6px 16px rgba(31,78,61,0.22)',
            }}
          >
            {icon}
          </Box>
        )}
        <Box>
          <Typography variant="h2" sx={{ lineHeight: 1.2 }}>{title}</Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ mt: 0.3 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {actions && <Stack direction="row" spacing={1.5}>{actions}</Stack>}
    </Stack>
  );
}
