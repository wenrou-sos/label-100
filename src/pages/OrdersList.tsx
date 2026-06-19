import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Checkbox,
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
  Tooltip,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import PublishRoundedIcon from '@mui/icons-material/PublishRounded';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ORDER_STATUS_META } from '@/constants/meta';
import { orderApi } from '@/services/api';
import { formatDate, formatDateZh, maskPhone } from '@/utils/format';
import type { OrderStatus } from '@/types';

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'matching', label: '待匹配' },
  { value: 'matched', label: '待签约' },
  { value: 'contracted', label: '已签约' },
  { value: 'in_service', label: '服务中' },
  { value: 'completed', label: '已完成' },
];

// 允许批量切换的目标状态（仅业务上合理的"正向流转"）
const BATCH_TARGET_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'matched', label: '转为已匹配（待签约）' },
  { value: 'contracted', label: '转为已签约' },
  { value: 'completed', label: '转为已完成' },
];

export default function OrdersList() {
  const { orders, refreshOrders, notify } = useAppStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  // 批量操作
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<OrderStatus>('matched');
  const [batchBusy, setBatchBusy] = useState(false);

  const list = useMemo(() => {
    return filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const listIds = useMemo(() => list.map((o) => o.id), [list]);
  const allSelected = listIds.length > 0 && listIds.every((id) => selected.has(id));
  const someSelected = listIds.some((id) => selected.has(id));
  const selectedOrders = useMemo(() => orders.filter((o) => selected.has(o.id)), [orders, selected]);
  const selectedCount = selected.size;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        listIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      listIds.forEach((id) => next.add(id));
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const handleBatchDelete = async () => {
    setBatchBusy(true);
    let okCount = 0;
    for (const id of selected) {
      const res = await orderApi.remove(id);
      if (res.data) okCount++;
    }
    await refreshOrders();
    setBatchBusy(false);
    setBatchDeleting(false);
    notify(`已批量删除 ${okCount} 笔订单`, 'success');
    clearSelection();
  };

  const handleBatchStatus = async () => {
    setBatchBusy(true);
    let okCount = 0;
    const failedMsgs: string[] = [];
    for (const id of selected) {
      const res = await orderApi.update(id, { status: targetStatus });
      if (res.data) {
        okCount++;
      } else if (res.message && res.message !== 'success') {
        failedMsgs.push(`订单 ${id}: ${res.message}`);
      }
    }
    await refreshOrders();
    setBatchBusy(false);
    setStatusDialogOpen(false);
    if (okCount > 0) {
      notify(`已将 ${okCount} 笔订单状态更新为「${ORDER_STATUS_META[targetStatus].label}」`, 'success');
    }
    if (failedMsgs.length > 0) {
      notify(`${failedMsgs.length} 笔订单更新失败：${failedMsgs[0]}${failedMsgs.length > 1 ? ` 等共 ${failedMsgs.length} 条` : ''}`, 'error');
    }
    clearSelection();
  };

  return (
    <Box>
      <PageHeader
        title="订单管理"
        subtitle={`共 ${orders.length} 笔订单`}
        icon={<AssignmentRoundedIcon />}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {selectedCount > 0 && (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<PublishRoundedIcon />}
                  onClick={() => setStatusDialogOpen(true)}
                  disabled={batchBusy}
                >
                  批量改状态（{selectedCount}）
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteSweepRoundedIcon />}
                  onClick={() => setBatchDeleting(true)}
                  disabled={batchBusy}
                >
                  批量删除（{selectedCount}）
                </Button>
              </>
            )}
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/orders/new')}>新建订单</Button>
          </Stack>
        }
      />

      <ToggleButtonGroup value={filter} exclusive size="small" sx={{ mb: 2, flexWrap: 'wrap' }} onChange={(_, v) => v && setFilter(v)}>
        {STATUS_FILTERS.map((s) => (
          <ToggleButton key={s.value} value={s.value} sx={{ px: 1.8, py: 0.5, borderRadius: '8px !important', border: '1px solid #DDD4C5 !important' }}>{s.label}</ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Card>
        {list.length === 0 ? (
          <EmptyState icon={<AssignmentRoundedIcon />} title="暂无订单" subtitle="点击右上角新建订单开始业务流程" actionLabel="新建订单" onAction={() => navigate('/orders/new')} />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      indeterminate={someSelected && !allSelected}
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </TableCell>
                  <TableCell>订单号</TableCell>
                  <TableCell>客户</TableCell>
                  <TableCell>服务期</TableCell>
                  <TableCell>天数</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((o) => (
                  <TableRow key={o.id} hover selected={selected.has(o.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={selected.has(o.id)}
                        onChange={() => toggleOne(o.id)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{o.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.customer.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{maskPhone(o.customer.phone)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{formatDateZh(o.startDate)} ~ {formatDateZh(o.endDate)}</Typography>
                    </TableCell>
                    <TableCell>{o.serviceDays}天</TableCell>
                    <TableCell><Chip label={ORDER_STATUS_META[o.status].label} size="small" color={ORDER_STATUS_META[o.status].color} /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {o.status === 'matching' && (
                          <Button size="small" variant="contained" color="secondary" startIcon={<AutoAwesomeRoundedIcon />} onClick={() => navigate(`/matching/${o.id}`)}>匹配</Button>
                        )}
                        {o.status === 'matched' && (
                          <Button size="small" variant="contained" startIcon={<DescriptionRoundedIcon />} onClick={() => navigate(`/contracts/${o.id}`)}>签约</Button>
                        )}
                        {(o.status === 'contracted' || o.status === 'in_service') && (
                          <Tooltip title="服务进度">
                            <IconButton size="small" color="primary" onClick={() => navigate(`/service/${o.id}`)}><TimelineRoundedIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {o.status === 'completed' && (
                          <Tooltip title="查看详情">
                            <IconButton size="small" onClick={() => navigate(`/service/${o.id}`)}><VisibilityRoundedIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* 批量改状态确认框 */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>批量修改订单状态</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              将把选中的 <b>{selectedCount}</b> 笔订单状态统一修改为：
            </Typography>
            <TextField select value={targetStatus} onChange={(e) => setTargetStatus(e.target.value as OrderStatus)} size="small" fullWidth>
              {BATCH_TARGET_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </TextField>
            {/* 预览选中订单的当前状态分布 */}
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#FAF7F2' }}>
              <Typography variant="caption" color="text.secondary">当前选中订单状态分布：</Typography>
              <Stack direction="row" spacing={0.8} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.8 }}>
                {Object.entries(
                  selectedOrders.reduce<Record<string, number>>((acc, o) => {
                    acc[o.status] = (acc[o.status] ?? 0) + 1;
                    return acc;
                  }, {}),
                ).map(([st, cnt]) => (
                  <Chip key={st} size="small" label={`${ORDER_STATUS_META[st as OrderStatus].label} ${cnt}`} color={ORDER_STATUS_META[st as OrderStatus].color} variant="outlined" />
                ))}
              </Stack>
            </Box>
            <Typography variant="caption" color="text.secondary">
              提示：批量改状态会跳过单笔业务的校验逻辑（如档期、合同等），仅用于管理员批量维护，请谨慎操作。
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setStatusDialogOpen(false)} color="inherit" variant="text">取消</Button>
          <Button onClick={handleBatchStatus} variant="contained" disabled={batchBusy}>{batchBusy ? '处理中…' : `确认修改 ${selectedCount} 笔`}</Button>
        </DialogActions>
      </Dialog>

      {/* 批量删除确认框 */}
      <ConfirmDialog
        open={batchDeleting}
        title="批量删除订单"
        content={`确定要删除选中的 ${selectedCount} 笔订单吗？该操作不可恢复，关联的合同、支付记录、面试预约、打卡记录和评价也会一并清除。`}
        confirmText={`删除 ${selectedCount} 笔`}
        confirmColor="error"
        onConfirm={handleBatchDelete}
        onClose={() => setBatchDeleting(false)}
      />
    </Box>
  );
}
