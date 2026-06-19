import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import FingerprintRoundedIcon from '@mui/icons-material/FingerprintRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { MatronAvatar } from '@/components/common/MatronAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { checkinApi } from '@/services/api';
import { formatDate } from '@/utils/format';
import type { Checkin } from '@/types';

export default function Checkin() {
  const { matrons, orders, notify } = useAppStore();
  const [matronId, setMatronId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const myOrders = useMemo(
    () => orders.filter((o) => o.selectedMatronId === matronId && o.status === 'in_service'),
    [orders, matronId],
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayChecked = checkins.some((c) => c.date === todayStr);

  const loadCheckins = async (oid: string) => {
    const res = await checkinApi.byOrder(oid);
    setCheckins(res.data);
  };

  const handleOrderChange = (oid: string) => {
    setOrderId(oid);
    if (oid) loadCheckins(oid);
    else setCheckins([]);
  };

  const handleCheckin = async () => {
    if (!orderId || !matronId) return;
    setSubmitting(true);
    const res = await checkinApi.checkin({ orderId, matronId });
    await loadCheckins(orderId);
    setSubmitting(false);
    notify(res.message, res.message.includes('已签到') ? 'info' : 'success');
  };

  const matron = matrons.find((m) => m.id === matronId);

  return (
    <Box>
      <PageHeader title="签到面板" subtitle="月嫂每日打卡签到" icon={<FingerprintRoundedIcon />} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.4fr' }, gap: 2.5, alignItems: 'start' }}>
        {/* 签到卡片 */}
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">选择月嫂</Typography>
                <TextField select fullWidth value={matronId} onChange={(e) => { setMatronId(e.target.value); handleOrderChange(''); }} sx={{ mt: 0.5 }}>
                  {matrons.map((m) => (
                    <MenuItem key={m.id} value={m.id}>{m.name} · {m.hometown}</MenuItem>
                  ))}
                </TextField>
              </Box>
              {matron && (
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FAF7F2' }}>
                  <MatronAvatar name={matron.name} size={40} />
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{matron.name}</Typography>
                    <Typography variant="caption" color="text.secondary">从业{matron.experienceYears}年 · {matron.hometown}</Typography>
                  </Box>
                </Stack>
              )}
              {matronId && (
                <Box>
                  <Typography variant="caption" color="text.secondary">选择服务订单</Typography>
                  <TextField select fullWidth value={orderId} onChange={(e) => handleOrderChange(e.target.value)} sx={{ mt: 0.5 }} disabled={myOrders.length === 0}>
                    {myOrders.length === 0 ? (
                      <MenuItem value="" disabled>暂无可签到订单</MenuItem>
                    ) : (
                      myOrders.map((o) => (
                        <MenuItem key={o.id} value={o.id}>{o.id} · {o.customer.name}</MenuItem>
                      ))
                    )}
                  </TextField>
                </Box>
              )}
              {matronId && myOrders.length === 0 && (
                <Typography variant="caption" color="text.secondary">该月嫂暂无服务中（in_service）的订单，请先在服务进度页开始服务</Typography>
              )}

              {orderId && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="caption" color="text.secondary">今日 {formatDate(todayStr)}</Typography>
                  <Box sx={{ mt: 1.5 }}>
                    {todayChecked ? (
                      <Stack alignItems="center" spacing={1} sx={{ py: 1.5, borderRadius: 2, bgcolor: '#E3EDE8' }}>
                        <CheckCircleRoundedIcon sx={{ color: 'success.main', fontSize: 44 }} />
                        <Typography sx={{ fontWeight: 700, color: 'success.main' }}>今日已签到</Typography>
                      </Stack>
                    ) : (
                      <Button
                        size="large"
                        variant="contained"
                        startIcon={<FingerprintRoundedIcon />}
                        disabled={submitting}
                        onClick={handleCheckin}
                        sx={{ py: 1.5, px: 4, borderRadius: 3, fontSize: 16 }}
                      >
                        {submitting ? '签到中…' : '立即签到'}
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* 打卡记录 */}
        <Card>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <ScheduleRoundedIcon color="primary" />
              <Typography variant="h4">打卡记录</Typography>
            </Stack>
            {!orderId ? (
              <EmptyState icon={<FingerprintRoundedIcon />} title="请选择月嫂与订单" subtitle="选择后可签到并查看打卡记录" />
            ) : checkins.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>暂无打卡记录</Typography>
            ) : (
              <Stack spacing={1}>
                {[...checkins].reverse().map((c) => (
                  <Stack key={c.id} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.2, borderRadius: 1.5, border: '1px solid #EFE9DD' }}>
                    <ScheduleRoundedIcon color="action" fontSize="small" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(c.date)}</Typography>
                      <Typography variant="caption" color="text.secondary">签到时间 {c.matronTime}</Typography>
                    </Box>
                    <Chip label={c.adminConfirmedAt ? '已确认' : '待确认'} size="small" color={c.adminConfirmedAt ? 'success' : 'warning'} variant={c.adminConfirmedAt ? 'filled' : 'outlined'} />
                  </Stack>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
