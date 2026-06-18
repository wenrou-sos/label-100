import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ORDER_STATUS_META } from '@/constants/meta';
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

export default function OrdersList() {
  const { orders } = useAppStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const list = useMemo(() => {
    return filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  return (
    <Box>
      <PageHeader
        title="订单管理"
        subtitle={`共 ${orders.length} 笔订单`}
        icon={<AssignmentRoundedIcon />}
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/orders/new')}>新建订单</Button>
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
                  <TableRow key={o.id} hover>
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
    </Box>
  );
}
