import { Rating, Stack, Typography, type SxProps, type Theme } from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';

// 星级评分展示，可显示数字
export function RatingStars({
  value,
  showValue = true,
  size = 'medium',
  sx,
}: {
  value: number;
  showValue?: boolean;
  size?: 'small' | 'medium' | 'large';
  sx?: SxProps<Theme>;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.8} sx={sx}>
      <Rating
        value={value}
        precision={0.1}
        readOnly
        size={size}
        icon={<SpaIcon sx={{ color: 'secondary.main' }} fontSize="inherit" />}
        emptyIcon={<SpaIcon sx={{ color: '#D8D0C2' }} fontSize="inherit" />}
      />
      {showValue && (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {value > 0 ? value.toFixed(1) : '暂无'}
        </Typography>
      )}
    </Stack>
  );
}
