import { Box, CircularProgress, Stack, Typography } from '@mui/material';

// 匹配度环形进度
export function MatchScoreRing({
  score,
  size = 72,
  label = '匹配度',
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const color = score >= 100 ? '#1F4E3D' : score >= 60 ? '#3E7D5B' : score > 0 ? '#D9923B' : '#B5413A';
  return (
    <Stack alignItems="center" spacing={0.5}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={6}
          sx={{ color: '#EAE3D7' }}
        />
        <CircularProgress
          variant="determinate"
          value={score}
          size={size}
          thickness={6}
          sx={{ color, position: 'absolute', left: 0, top: 0 }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color, lineHeight: 1 }}>
            {score}
            <Typography component="span" variant="caption" sx={{ fontWeight: 600 }}>
              %
            </Typography>
          </Typography>
        </Box>
      </Box>
      {label && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
      )}
    </Stack>
  );
}
