import { Box, Chip, Stack } from '@mui/material';
import { CERTIFICATE_META } from '@/constants/meta';
import type { Certificate } from '@/types';

// 证书标签组：按证书元数据着色，命中/缺失可标记
export function CertificateChips({
  certificates,
  required,
  size = 'medium',
}: {
  certificates: Certificate[];
  required?: Certificate[]; // 传入则高亮命中与缺失
  size?: 'small' | 'medium';
}) {
  const requiredSet = required ? new Set(required) : null;
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.6}>
      {certificates.length === 0 && <Chip label="暂无证书" size={size} variant="outlined" />}
      {certificates.map((c) => {
        const meta = CERTIFICATE_META[c];
        const hit = requiredSet ? requiredSet.has(c) : false;
        return (
          <Chip
            key={c}
            icon={<Box component={meta.icon} sx={{ color: `${meta.color} !important`, fontSize: 16 }} />}
            label={meta.short}
            size={size}
            sx={{
              bgcolor: meta.bg,
              color: meta.color,
              fontWeight: 600,
              borderColor: 'transparent',
              ...(hit ? { outline: `2px solid ${meta.color}`, outlineOffset: -1 } : {}),
            }}
          />
        );
      })}
    </Stack>
  );
}
