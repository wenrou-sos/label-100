import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Rating,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import SpaIcon from '@mui/icons-material/Spa';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { MatronAvatar } from '@/components/common/MatronAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { InlineLoader } from '@/components/common/LoadingState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { checkinApi, contractApi, reviewApi, orderApi, paymentApi } from '@/services/api';
import { formatMoney, formatDate, formatDateTime } from '@/utils/format';
import type { Checkin, Contract } from '@/types';

export default function ServiceProgress() {
  const { orderId } = useParams();
  const { orders, matrons, refreshOrders, refreshContracts, refreshMatrons, notify } = useAppStore();
  const navigate = useNavigate();

  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [custReview, setCustReview] = useState({ rating: 5, comment: '' });
  const [matReview, setMatReview] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState<'customer' | 'matron' | null>(null);

  const order = orders.find((o) => o.id === orderId);
  const matron = matrons.find((m) => m.id === (order?.selectedMatronId ?? ''));

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    const c = await checkinApi.byOrder(orderId);
    setCheckins(c.data);
    const ct = await contractApi.getByOrder(orderId);
    setContract(ct.data ?? null);
    setLoading(false);
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Card><InlineLoader label="服务记录加载中…" /></Card>;
  if (!order) return <Card><EmptyState title="订单不存在" actionLabel="返回订单" onAction={() => navigate('/orders')} /></Card>;
  if (!matron) return <Card><EmptyState title="未选定月嫂" /></Card>;

  const total = order.serviceDays;
  const elapsed = Math.min(total, Math.max(0, differenceInCalendarDays(new Date(), parseISO(order.startDate)) + 1));
  const remaining = Math.max(0, total - elapsed);
  const percent = Math.round((elapsed / total) * 100);

  const existingReviews = matron.reviews.filter((r) => r.orderId === order.id);
  const custDone = existingReviews.some((r) => r.reviewerType === 'customer');
  const matDone = existingReviews.some((r) => r.reviewerType === 'matron');

  const handleStart = async () => {
    setBusy(true);
    const res = await orderApi.startService(order.id);
    if (!res.data) {
      notify(res.message, 'error');
      setBusy(false);
      return;
    }
    await refreshOrders();
    setBusy(false);
    notify('服务已开始');
  };
  const handleConfirm = async (id: string) => {
    await checkinApi.confirm(id);
    await load();
    notify('已确认签到');
  };
  const handleFinish = async () => {
    if (!contract) return;
    setBusy(true);
    const res = await paymentApi.settleFinal(contract.id, 'bank');
    await refreshContracts();
    await refreshOrders();
    setBusy(false);
    setFinishOpen(false);
    notify(res.message);
  };
  const submitReview = async (type: 'customer' | 'matron') => {
    const payload = type === 'customer' ? custReview : matReview;
    setReviewSubmitting(type);
    await reviewApi.submit({ matronId: matron.id, orderId: order.id, reviewerType: type, rating: payload.rating, comment: payload.comment });
    await refreshMatrons();
    await load();
    setReviewSubmitting(null);
    notify(type === 'customer' ? '客户评价已提交' : '月嫂评价已提交');
  };

  return (
    <Box>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/orders')} sx={{ mb: 1.5, color: 'text.secondary' }}>返回订单列表</Button>
      <PageHeader title="服务进度" subtitle={`${order.customer.name} · ${matron.name} · ${total}天服务`} icon={<MatronAvatar name={matron.name} size={26} />} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.4fr' }, gap: 2.5, alignItems: 'start' }}>
        {/* 进度概览 */}
        <Stack spacing={2.5}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={3} alignItems="center" justifyContent="center" sx={{ py: 1 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress variant="determinate" value={100} size={120} thickness={6} sx={{ color: '#EAE3D7' }} />
                  <CircularProgress variant="determinate" value={percent} size={120} thickness={6} sx={{ color: 'primary.main', position: 'absolute', top: 0, left: 0 }} />
                  <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1 }}>{percent}%</Typography>
                      <Typography variant="caption" color="text.secondary">已完成</Typography>
                    </Box>
                  </Box>
                </Box>
                <Stack>
                  <Typography variant="caption" color="text.secondary">服务期</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{formatDate(order.startDate)} ~ {formatDate(order.endDate)}</Typography>
                  <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
                    <Box><Typography variant="h4" sx={{ color: 'primary.main' }}>{elapsed}</Typography><Typography variant="caption">已服务(天)</Typography></Box>
                    <Box><Typography variant="h4" sx={{ color: 'secondary.main' }}>{remaining}</Typography><Typography variant="caption">剩余(天)</Typography></Box>
                  </Stack>
                </Stack>
              </Stack>
              <Divider sx={{ my: 1.8 }} />
              {order.status === 'contracted' && (() => {
                const today = new Date().toISOString().slice(0, 10);
                const earliest = new Date(new Date(order.startDate).getTime() - 86400000).toISOString().slice(0, 10);
                const ok = today >= earliest;
                const tip = ok ? '' : `最早可于 ${order.startDate} 前1天（${earliest}）开始服务`;
                return (
                  <Tooltip title={tip} placement="top">
                    <span style={{ display: 'block', width: '100%' }}>
                      <Button fullWidth variant="contained" startIcon={<PlayArrowRoundedIcon />} disabled={busy || !ok} onClick={handleStart}>开始服务</Button>
                    </span>
                  </Tooltip>
                );
              })()}
              {order.status === 'in_service' && (
                <Button fullWidth variant="contained" color="secondary" startIcon={<CheckCircleRoundedIcon />} disabled={busy} onClick={() => setFinishOpen(true)}>结束服务并结算尾款</Button>
              )}
              {order.status === 'completed' && (
                <Chip icon={<CheckCircleRoundedIcon />} label="服务已完成" color="success" sx={{ width: '100%' }} />
              )}
              {contract && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>合同金额 {formatMoney(contract.amount)} · {contract.status === 'final_settled' ? '已结算' : '定金已付'}</Typography>}
            </CardContent>
          </Card>

          {/* 打卡统计 */}
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 1 }}>打卡概览</Typography>
              <Stack direction="row" spacing={3}>
                <Box><Typography variant="h4">{checkins.length}</Typography><Typography variant="caption">已签到天数</Typography></Box>
                <Box><Typography variant="h4">{checkins.filter((c) => c.adminConfirmedAt).length}</Typography><Typography variant="caption">已确认天数</Typography></Box>
                <Box sx={{ ml: 'auto' }}><Button size="small" variant="outlined" onClick={() => navigate('/checkin')}>前往签到面板</Button></Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* 打卡时间线 + 互评 */}
        <Stack spacing={2.5}>
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 1.5 }}>每日打卡</Typography>
              {checkins.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>暂无打卡记录，月嫂可在签到面板打卡</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {[...checkins].reverse().map((c) => {
                    const confirmed = !!c.adminConfirmedAt;
                    return (
                      <Stack key={c.id} direction="row" spacing={1.5} alignItems="flex-start">
                        <Box sx={{
                          mt: 0.3, width: 12, height: 12, borderRadius: '50%',
                          bgcolor: confirmed ? 'success.main' : 'transparent',
                          border: confirmed ? 'none' : '2px solid',
                          borderColor: 'warning.main',
                          flexShrink: 0,
                        }} />
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flex: 1, p: 1.2, borderRadius: 1.5, border: '1px solid #EFE9DD' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(c.date)}</Typography>
                            <Typography variant="caption" color="text.secondary">签到 {c.matronTime} {confirmed ? `· 已确认 ${formatDateTime(c.adminConfirmedAt)}` : '· 待确认'}</Typography>
                            {c.note && <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>备注：{c.note}</Typography>}
                          </Box>
                          {!confirmed && order.status === 'in_service' && (
                            <IconButton size="small" color="primary" onClick={() => handleConfirm(c.id)} title="确认签到"><VerifiedRoundedIcon fontSize="small" /></IconButton>
                          )}
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* 互评系统 */}
          {order.status === 'completed' && (
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 1.5 }}>服务结束互评</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <ReviewForm
                    title="客户评价月嫂"
                    done={custDone}
                    rating={custReview.rating}
                    comment={custReview.comment}
                    onRating={(v) => setCustReview((s) => ({ ...s, rating: v }))}
                    onComment={(v) => setCustReview((s) => ({ ...s, comment: v }))}
                    submitting={reviewSubmitting === 'customer'}
                    onSubmit={() => submitReview('customer')}
                  />
                  <ReviewForm
                    title="月嫂评价客户"
                    done={matDone}
                    rating={matReview.rating}
                    comment={matReview.comment}
                    onRating={(v) => setMatReview((s) => ({ ...s, rating: v }))}
                    onComment={(v) => setMatReview((s) => ({ ...s, comment: v }))}
                    submitting={reviewSubmitting === 'matron'}
                    onSubmit={() => submitReview('matron')}
                    accent="#C8553D"
                  />
                </Box>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>

      <ConfirmDialog
        open={finishOpen}
        title="结束服务并结算尾款"
        content="确认结束本次服务并触发尾款结算流程？结算后订单将标记为已完成，可进行互评。"
        confirmText="确认结算"
        confirmColor="secondary"
        onConfirm={handleFinish}
        onClose={() => setFinishOpen(false)}
      />
    </Box>
  );
}

function ReviewForm({
  title, done, rating, comment, onRating, onComment, onSubmit, submitting, accent = '#1F4E3D',
}: {
  title: string; done: boolean; rating: number; comment: string;
  onRating: (v: number) => void; onComment: (v: string) => void; onSubmit: () => void; submitting: boolean; accent?: string;
}) {
  if (done) {
    return (
      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F0F5F2', textAlign: 'center' }}>
        <CheckCircleRoundedIcon sx={{ color: 'success.main' }} />
        <Typography variant="body2" sx={{ mt: 0.5 }}>{title}已完成</Typography>
      </Box>
    );
  }
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: accent }}>{title}</Typography>
      <Rating value={rating} onChange={(_, v) => v && onRating(v)} icon={<SpaIcon sx={{ color: accent }} fontSize="inherit" />} emptyIcon={<SpaIcon sx={{ color: '#D8D0C2' }} fontSize="inherit" />} />
      <TextField multiline minRows={2} fullWidth placeholder="请输入评价内容…" value={comment} onChange={(e) => onComment(e.target.value)} sx={{ mt: 1 }} />
      <Button fullWidth variant="contained" disabled={submitting || !comment.trim()} onClick={onSubmit} sx={{ mt: 1, bgcolor: accent }}>
        {submitting ? '提交中…' : '提交评价'}
      </Button>
    </Box>
  );
}
