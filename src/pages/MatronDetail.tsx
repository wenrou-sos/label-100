import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { MatronAvatar } from '@/components/common/MatronAvatar';
import { RatingStars } from '@/components/common/RatingStars';
import { CertificateChips } from '@/components/common/CertificateChips';
import { EmptyState } from '@/components/common/EmptyState';
import { MatronFormDialog } from '@/components/matron/MatronFormDialog';
import { MATRON_STATUS_META, INTERVIEW_STATUS_META } from '@/constants/meta';
import { formatDate, formatDateZh, formatDateTime, maskPhone } from '@/utils/format';
import { interviewApi } from '@/services/api';

export default function MatronDetail() {
  const { id } = useParams();
  const { matrons, orders, interviews, refreshInterviews, notify } = useAppStore();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [interviewOrderId, setInterviewOrderId] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('10:00');
  const [interviewNote, setInterviewNote] = useState('');
  const [interviewSubmitting, setInterviewSubmitting] = useState(false);

  const matron = matrons.find((m) => m.id === id);

  // 从全局面试记录中筛选当前月嫂的（与面试管理页共享同一数据源）
  const matronInterviews = useMemo(() => {
    if (!id) return [];
    return interviews
      .filter((iv) => iv.matronId === id)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [interviews, id]);

  const availableOrders = useMemo(() => {
    // 仅待匹配(matching)或已匹配待签约(matched)的订单可预约面试；
    // 已签约(contracted)月嫂已确定，不再预约面试
    return orders.filter((o) => o.status === 'matching' || o.status === 'matched');
  }, [orders]);

  const handleCreateInterview = async () => {
    if (!id || !interviewOrderId || !interviewDate || !interviewTime) return;
    setInterviewSubmitting(true);
    try {
      const scheduledAt = new Date(`${interviewDate}T${interviewTime}:00`).toISOString();
      const res = await interviewApi.create({ orderId: interviewOrderId, matronId: id, scheduledAt, note: interviewNote });
      if (!res.data) {
        notify(res.message, 'error');
        return;
      }
      // 刷新全局面试记录，使面试管理页同步可见
      await refreshInterviews();
      setInterviewOpen(false);
      setInterviewOrderId('');
      setInterviewDate('');
      setInterviewTime('10:00');
      setInterviewNote('');
      notify('面试预约已创建');
    } finally {
      setInterviewSubmitting(false);
    }
  };

  // 评分分布
  const dist = useMemo(() => {
    const d = [0, 0, 0, 0, 0]; // index 0 => 1星
    matron?.reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) d[r.rating - 1]++;
    });
    return d.reverse(); // 5星在前
  }, [matron]);

  if (!matron) {
    return (
      <Card>
        <EmptyState title="月嫂档案不存在" subtitle="可能已被删除或链接有误" actionLabel="返回列表" onAction={() => navigate('/matrons')} />
      </Card>
    );
  }

  const infoRows = [
    { label: '年龄', value: `${matron.age} 岁` },
    { label: '籍贯', value: matron.hometown },
    { label: '从业年限', value: `${matron.experienceYears} 年` },
    { label: '联系电话', value: maskPhone(matron.phone) },
    { label: '档案编号', value: matron.id },
    { label: '建档日期', value: formatDate(matron.createdAt) },
  ];

  return (
    <Box>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/matrons')} sx={{ mb: 1.5, color: 'text.secondary' }}>
        返回月嫂列表
      </Button>
      <PageHeader
        title={matron.name}
        subtitle={`${matron.age}岁 · ${matron.hometown} · 从业${matron.experienceYears}年`}
        icon={<MatronAvatar name={matron.name} size={26} />}
        actions={
          <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => setEditOpen(true)}>编辑档案</Button>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' }, gap: 2.5 }}>
        {/* 左列 */}
        <Stack spacing={2.5}>
          {/* 基本信息 */}
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <EventRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="h4">基本信息</Typography>
                <Chip label={MATRON_STATUS_META[matron.status].label} size="small" color={MATRON_STATUS_META[matron.status].color} sx={{ ml: 'auto' }} />
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, gap: 1.8 }}>
                {infoRows.map((r) => (
                  <Box key={r.label}>
                    <Typography variant="caption" color="text.secondary">{r.label}</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{r.value}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* 持证情况 */}
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <VerifiedRoundedIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                <Typography variant="h4">持证情况</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>共 {matron.certificates.length} 项</Typography>
              </Stack>
              <CertificateChips certificates={matron.certificates} />
            </CardContent>
          </Card>

          {/* 档期 */}
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <EventRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="h4">档期占用</Typography>
              </Stack>
              {matron.schedules.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>暂无档期占用，可随时派单</Typography>
              ) : (
                <Stack spacing={1}>
                  {matron.schedules.map((s) => (
                    <Stack key={s.orderId} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.2, borderRadius: 1.5, bgcolor: '#FAF7F2', border: '1px solid #EFE9DD' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateZh(s.startDate)} — {formatDateZh(s.endDate)}</Typography>
                      </Box>
                      <Chip label={s.orderId} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>

        {/* 右列：评价 + 面试 */}
        <Stack spacing={2.5}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <RateReviewRoundedIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                <Typography variant="h4">客户评价</Typography>
              </Stack>
            <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ color: 'secondary.main', fontWeight: 700, lineHeight: 1 }}>
                  {matron.averageRating.toFixed(1)}
                </Typography>
                <RatingStars value={matron.averageRating} showValue={false} size="small" sx={{ mt: 0.5 }} />
                <Typography variant="caption" color="text.secondary">{matron.reviews.length} 条评价</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                {[5, 4, 3, 2, 1].map((star, idx) => {
                  const count = dist[idx] || 0;
                  const pct = matron.reviews.length ? (count / matron.reviews.length) * 100 : 0;
                  return (
                    <Stack key={star} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.3 }}>
                      <Typography variant="caption" sx={{ width: 28 }}>{star}星</Typography>
                      <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 7, borderRadius: 99 }} />
                      <Typography variant="caption" sx={{ width: 24, textAlign: 'right' }}>{count}</Typography>
                    </Stack>
                  );
                })}
              </Box>
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            {matron.reviews.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>暂无客户评价</Typography>
            ) : (
              <Stack spacing={1.5}>
                {matron.reviews.slice().reverse().map((r) => (
                  <Box key={r.id} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#FAF7F2' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <RatingStars value={r.rating} showValue={false} size="small" />
                      <Typography variant="caption" color="text.secondary">{formatDate(r.createdAt)}</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.8 }}>{r.comment}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
            </CardContent>
          </Card>

          {/* 面试记录 */}
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <VideocamOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="h4">面试记录</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddOutlinedIcon />}
                  onClick={() => setInterviewOpen(true)}
                  sx={{ ml: 'auto' }}
                >
                  预约面试
                </Button>
              </Stack>
              {matronInterviews.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>暂无面试记录</Typography>
              ) : (
                <Stack spacing={1}>
                  {matronInterviews.slice(0, 5).map((iv) => {
                    const meta = INTERVIEW_STATUS_META[iv.status];
                    const order = orders.find((o) => o.id === iv.orderId);
                    return (
                      <Stack
                        key={iv.id}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ p: 1.2, borderRadius: 1.5, border: '1px solid #EFE9DD' }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(iv.scheduledAt)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order?.customer.name} · {iv.orderId}
                          </Typography>
                          {iv.note && <Typography variant="caption" display="block" color="text.secondary">备注：{iv.note}</Typography>}
                        </Box>
                        <Chip label={meta.label} size="small" color={meta.color} />
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <MatronFormDialog open={editOpen} matron={matron} onClose={() => setEditOpen(false)} />

      {/* 预约面试弹窗 */}
      <Dialog open={interviewOpen} onClose={() => setInterviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>预约视频面试</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">月嫂</Typography>
              <Typography sx={{ fontWeight: 600 }}>{matron.name}</Typography>
            </Box>
            <TextField
              select
              label="选择订单"
              value={interviewOrderId}
              onChange={(e) => setInterviewOrderId(e.target.value)}
              fullWidth
              size="small"
            >
              {availableOrders.length === 0 && <MenuItem value="" disabled>暂无可预约订单</MenuItem>}
              {availableOrders.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.customer.name} · {o.id} · {formatDate(o.startDate)} 开始
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="面试日期"
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="面试时间"
                type="time"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <TextField
              label="备注（选填）"
              value={interviewNote}
              onChange={(e) => setInterviewNote(e.target.value)}
              multiline
              rows={3}
              fullWidth
              size="small"
              placeholder="例如：客户希望了解夜间带睡经验"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterviewOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleCreateInterview}
            disabled={!interviewOrderId || !interviewDate || !interviewTime || interviewSubmitting}
          >
            {interviewSubmitting ? '提交中…' : '确认预约'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
