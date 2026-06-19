import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { MatronAvatar } from '@/components/common/MatronAvatar';
import { INTERVIEW_STATUS_META } from '@/constants/meta';
import { formatDateTime } from '@/utils/format';
import { interviewApi } from '@/services/api';
import type { Interview } from '@/types';

type FilterStatus = 'all' | 'pending' | 'done' | 'cancelled';

export default function Interviews() {
  const { interviews, orders, matrons, refreshInterviews, notify } = useAppStore();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [detail, setDetail] = useState<Interview | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...interviews];
    if (filter !== 'all') list = list.filter((iv) => iv.status === filter);
    list.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    return list;
  }, [interviews, filter]);

  const stats = useMemo(() => ({
    all: interviews.length,
    pending: interviews.filter((iv) => iv.status === 'pending').length,
    done: interviews.filter((iv) => iv.status === 'done').length,
    cancelled: interviews.filter((iv) => iv.status === 'cancelled').length,
  }), [interviews]);

  const handleComplete = async (id: string) => {
    setBusyId(id);
    await interviewApi.update(id, { status: 'done' });
    await refreshInterviews();
    setBusyId(null);
    notify('面试已标记为完成');
  };

  const handleCancel = async (id: string) => {
    setBusyId(id);
    await interviewApi.update(id, { status: 'cancelled' });
    await refreshInterviews();
    setBusyId(null);
    notify('面试已取消');
  };

  return (
    <Box>
      <PageHeader title="面试管理" subtitle="视频面试预约记录与状态管理" icon={<VideocamOutlinedIcon />} />

      {/* 筛选栏 */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => v && setFilter(v)} size="small" color="primary">
          <ToggleButton value="all">全部 ({stats.all})</ToggleButton>
          <ToggleButton value="pending">待面试 ({stats.pending})</ToggleButton>
          <ToggleButton value="done">已完成 ({stats.done})</ToggleButton>
          <ToggleButton value="cancelled">已取消 ({stats.cancelled})</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ flex: 1 }} />
      </Stack>

      {/* 列表 */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={<VideocamOutlinedIcon />} title="暂无面试记录" subtitle="可在智能匹配或月嫂详情页发起面试预约" />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>面试编号</TableCell>
                  <TableCell>月嫂</TableCell>
                  <TableCell>客户 / 订单</TableCell>
                  <TableCell>预约时间</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>备注</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((iv) => {
                  const order = orders.find((o) => o.id === iv.orderId);
                  const matron = matrons.find((m) => m.id === iv.matronId);
                  const meta = INTERVIEW_STATUS_META[iv.status];
                  const isPending = iv.status === 'pending';
                  return (
                    <TableRow key={iv.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{iv.id}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <MatronAvatar name={matron?.name ?? '?'} size={30} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{matron?.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{matron?.hometown}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{order?.customer.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{iv.orderId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(iv.scheduledAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={meta.label} size="small" color={meta.color} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {iv.note || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton size="small" color="info" title="查看详情" onClick={() => setDetail(iv)}>
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                          {isPending && (
                            <>
                              <IconButton
                                size="small"
                                color="success"
                                title="标记完成"
                                disabled={busyId === iv.id}
                                onClick={() => handleComplete(iv.id)}
                              >
                                <CheckCircleOutlinedIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="default"
                                title="取消面试"
                                disabled={busyId === iv.id}
                                onClick={() => handleCancel(iv.id)}
                              >
                                <CancelOutlinedIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>面试详情</DialogTitle>
        <DialogContent>
          {detail && (() => {
            const order = orders.find((o) => o.id === detail.orderId);
            const matron = matrons.find((m) => m.id === detail.matronId);
            const meta = INTERVIEW_STATUS_META[detail.status];
            return (
              <Stack spacing={2} sx={{ pt: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 1 }}>
                  <Typography color="text.secondary">面试编号</Typography>
                  <Typography sx={{ fontFamily: 'monospace' }}>{detail.id}</Typography>
                  <Typography color="text.secondary">月嫂</Typography>
                  <Typography>{matron?.name} · {matron?.hometown}</Typography>
                  <Typography color="text.secondary">客户</Typography>
                  <Typography>{order?.customer.name} · {order?.customer.phone}</Typography>
                  <Typography color="text.secondary">服务订单</Typography>
                  <Typography>{detail.orderId}</Typography>
                  <Typography color="text.secondary">预约时间</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{formatDateTime(detail.scheduledAt)}</Typography>
                  <Typography color="text.secondary">状态</Typography>
                  <Box><Chip label={meta.label} size="small" color={meta.color} /></Box>
                  <Typography color="text.secondary">备注</Typography>
                  <Typography>{detail.note || '—'}</Typography>
                </Box>
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
