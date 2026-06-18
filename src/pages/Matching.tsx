import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import VideoCameraFrontRoundedIcon from '@mui/icons-material/VideoCameraFrontRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import { format, parseISO } from 'date-fns';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { MatronAvatar } from '@/components/common/MatronAvatar';
import { RatingStars } from '@/components/common/RatingStars';
import { CertificateChips } from '@/components/common/CertificateChips';
import { MatchScoreRing } from '@/components/common/MatchScoreRing';
import { InlineLoader } from '@/components/common/LoadingState';
import { matchingApi, interviewApi, orderApi } from '@/services/api';
import { CERTIFICATE_META } from '@/constants/meta';
import { formatDate, formatDateTime } from '@/utils/format';
import type { Interview, MatchCandidate, Order } from '@/types';

export default function Matching() {
  const { orderId } = useParams();
  const { orders, refreshOrders, notify } = useAppStore();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExcluded, setShowExcluded] = useState(false);
  const [bookingMatronId, setBookingMatronId] = useState<string | null>(null);
  const [bookTime, setBookTime] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const runMatch = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    const res = await matchingApi.match(orderId);
    setCandidates(res.data.candidates);
    setOrder(res.data.order);
    const iv = await interviewApi.byOrder(orderId);
    setInterviews(iv.data);
    setLoading(false);
  }, [orderId]);

  useEffect(() => { runMatch(); }, [runMatch]);

  const orderFromCtx = orders.find((o) => o.id === orderId) ?? order;
  const available = candidates.filter((c) => c.available);
  const top3 = available.slice(0, 3);
  const excluded = candidates.filter((c) => !c.available);
  const selectedId = orderFromCtx?.selectedMatronId;

  const handleSelect = async (matronId: string) => {
    if (!orderId) return;
    await orderApi.selectMatron(orderId, matronId);
    await refreshOrders();
    await runMatch();
    notify('已选定月嫂，可前往签约或预约面试');
  };

  const handleBook = async () => {
    if (!orderId || !bookingMatronId || !bookTime) return;
    setSubmitting(true);
    try {
      await interviewApi.create({ orderId, matronId: bookingMatronId, scheduledAt: bookTime.toISOString() });
      const iv = await interviewApi.byOrder(orderId);
      setInterviews(iv.data);
      notify('视频面试预约成功');
      setBookingMatronId(null);
      setBookTime(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (!orderFromCtx) {
    return <Card><InlineLoader label="订单加载中…" /></Card>;
  }

  const requiredCerts = top3[0]?.requiredCerts ?? available[0]?.requiredCerts ?? [];
  const reqNames = requiredCerts.map((c) => CERTIFICATE_META[c].label);

  return (
    <Box>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/orders')} sx={{ mb: 1.5, color: 'text.secondary' }}>返回订单列表</Button>
      <PageHeader title="智能匹配" subtitle={`订单 ${orderFromCtx.id} · ${orderFromCtx.customer.name}`} icon={<AutoAwesomeRoundedIcon />} />

      {/* 订单摘要 */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">服务区间 · {orderFromCtx.serviceDays}天</Typography>
              <Typography sx={{ fontWeight: 700 }}>{formatDate(orderFromCtx.startDate)} ~ {formatDate(orderFromCtx.endDate)}</Typography>
            </Box>
            <Box sx={{ flex: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>所需证书（由需求映射）</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.6}>
                {reqNames.length ? reqNames.map((n) => (
                  <Chip key={n} label={n} size="small" variant="outlined" sx={{ borderColor: 'primary.main', color: 'primary.main' }} />
                )) : <Typography variant="caption">无特定证书要求</Typography>}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* 算法说明 */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Stepper activeStep={3} alternativeLabel>
            <Step><StepLabel>① 档期冲突检测</StepLabel></Step>
            <Step><StepLabel>② 技能证书匹配度</StepLabel></Step>
            <Step><StepLabel>③ 评价均分排序</StepLabel></Step>
          </Stepper>
        </CardContent>
      </Card>

      {loading ? (
        <Card><InlineLoader label="正在执行智能匹配算法…" /></Card>
      ) : (
        <>
          <Typography variant="h4" sx={{ mb: 1.5 }}>🏆 推荐候选人（Top {top3.length}）</Typography>
          {top3.length === 0 ? (
            <Card><CardContent><Typography color="text.secondary">暂无档期可用的候选人，请调整档期或新增月嫂。</Typography></CardContent></Card>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3,1fr)' }, gap: 2, mb: 2.5 }}>
              {top3.map((c, idx) => {
                const selected = c.matron.id === selectedId;
                return (
                  <Card key={c.matron.id} sx={{ position: 'relative', overflow: 'visible', border: selected ? '2px solid #1F4E3D' : '1px solid #EAE3D7' }}>
                    {selected && (
                      <Chip icon={<CheckCircleRoundedIcon sx={{ fontSize: 16 }} />} label="已选定" size="small" color="success" sx={{ position: 'absolute', top: -10, right: 16 }} />
                    )}
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                        <Box sx={{ position: 'relative' }}>
                          <MatronAvatar name={c.matron.name} size={48} />
                          {idx === 0 && <Chip label="1" size="small" sx={{ position: 'absolute', top: -8, left: -8, bgcolor: 'secondary.main', color: '#fff', fontWeight: 700, minWidth: 22, height: 22 }} />}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>{c.matron.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{c.matron.age}岁 · {c.matron.hometown} · 从业{c.matron.experienceYears}年</Typography>
                        </Box>
                        <MatchScoreRing score={c.matchScore} size={64} />
                      </Stack>
                      <Box sx={{ mb: 1 }}>
                        <CertificateChips certificates={c.matron.certificates} required={c.requiredCerts} size="small" />
                      </Box>
                      <RatingStars value={c.averageRating} size="small" sx={{ mb: 1.5 }} />
                      <Typography variant="caption" color="text.secondary">证书命中 {c.matchedCerts.length}/{c.requiredCerts.length}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                        <Button fullWidth size="small" variant={selected ? 'contained' : 'outlined'} onClick={() => handleSelect(c.matron.id)} disabled={selected}>
                          {selected ? '已选定' : '选定月嫂'}
                        </Button>
                        <Button size="small" variant="outlined" color="secondary" onClick={() => { setBookingMatronId(c.matron.id); setBookTime(new Date(Date.now() + 86400000)); }}>
                          <VideoCameraFrontRoundedIcon fontSize="small" />
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {/* 排除候选人（档期冲突） */}
          {excluded.length > 0 && (
            <Card sx={{ mb: 2.5 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setShowExcluded((s) => !s)}>
                  <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>档期冲突的月嫂（{excluded.length}）</Typography>
                  <IconButton size="small"><ExpandMoreRoundedIcon sx={{ transform: showExcluded ? 'rotate(180deg)' : 'none', transition: '.2s' }} /></IconButton>
                </Stack>
                <Collapse in={showExcluded}>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {excluded.map((c) => (
                      <Stack key={c.matron.id} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1, borderRadius: 1.5, bgcolor: '#FBF1EE' }}>
                        <MatronAvatar name={c.matron.name} size={32} />
                        <Typography variant="body2" sx={{ flex: 1 }}>{c.matron.name}</Typography>
                        <Chip label="档期冲突" size="small" color="error" variant="outlined" />
                      </Stack>
                    ))}
                  </Stack>
                </Collapse>
              </CardContent>
            </Card>
          )}

          {/* 已选月嫂操作 */}
          {selectedId && (
            <Card sx={{ mb: 2.5, bgcolor: 'primary.main', color: '#fff' }}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>已选定月嫂，可继续签约流程</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>签署合同后将自动锁定该月嫂档期</Typography>
                  </Box>
                  <Button variant="contained" sx={{ bgcolor: '#fff', color: 'primary.main' }} onClick={() => navigate(`/contracts/${orderFromCtx.id}`)}>前往签约</Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* 面试预约列表 */}
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <VideoCameraFrontRoundedIcon sx={{ color: 'secondary.main' }} />
                <Typography variant="h4">视频面试预约</Typography>
              </Stack>
              {interviews.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>暂无面试预约，点击候选人卡片上的摄像头按钮预约</Typography>
              ) : (
                <Stack spacing={1}>
                  {interviews.map((iv) => {
                    const m = candidates.find((c) => c.matron.id === iv.matronId)?.matron;
                    return (
                      <Stack key={iv.id} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.2, borderRadius: 1.5, border: '1px solid #EFE9DD' }}>
                        <EventRoundedIcon color="action" />
                        <MatronAvatar name={m?.name ?? '?'} size={32} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{m?.name ?? iv.matronId}</Typography>
                          <Typography variant="caption" color="text.secondary">{formatDateTime(iv.scheduledAt)}</Typography>
                        </Box>
                        <Chip label={iv.status === 'pending' ? '待面试' : iv.status === 'done' ? '已完成' : '已取消'} size="small" color={iv.status === 'done' ? 'success' : 'default'} />
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* 预约弹窗 */}
      <Dialog open={!!bookingMatronId} onClose={() => setBookingMatronId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>预约视频面试</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>选择面试时间，系统将生成在线面试链接</Typography>
          <DateTimePicker label="面试时间" value={bookTime} onChange={setBookTime} format="yyyy-MM-dd HH:mm" slotProps={{ textField: { fullWidth: true } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setBookingMatronId(null)} color="inherit">取消</Button>
          <Button variant="contained" disabled={!bookTime || submitting} onClick={handleBook}>{submitting ? '预约中…' : '确认预约'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
