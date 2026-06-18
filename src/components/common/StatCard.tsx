import { Box, Card, Stack, Typography } from '@mui/material';

// 指标统计卡片
export function StatCard({
  label,
  value,
  icon,
  accent = '#1F4E3D',
  trend,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: string;
  trend?: string;
  hint?: string;
}) {
  return (
    <Card sx={{ p: 2.5, height: '100%', transition: 'transform .2s, box-shadow .2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(26,43,37,0.10)' } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: 0.4 }}>
            {label}
          </Typography>
          <Typography variant="h3" sx={{ mt: 0.8, fontWeight: 700, color: 'text.primary' }}>
            {value}
          </Typography>
          {trend && (
            <Typography variant="caption" sx={{ color: accent, fontWeight: 600, mt: 0.5, display: 'block' }}>
              {trend}
            </Typography>
          )}
          {hint && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {hint}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: `${accent}14`,
            color: accent,
            '& svg': { fontSize: 24 },
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Card>
  );
}
