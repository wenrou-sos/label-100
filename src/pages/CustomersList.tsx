import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Chip,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ORDER_STATUS_META } from '@/constants/meta';
import { formatDate, maskPhone } from '@/utils/format';
import type { Customer, Order, OrderStatus } from '@/types';

export interface CustomerAggregate extends Customer {
  orderCount: number;
  orders: Order[];
  latestOrderDate: string;
}

function aggregateCustomers(orders: Order[]): CustomerAggregate[] {
  const map = new Map<string, CustomerAggregate>();
  for (const order of orders) {
    const phone = order.customer.phone;
    if (!map.has(phone)) {
      map.set(phone, {
        ...order.customer,
        id: phone,
        orderCount: 0,
        orders: [],
        latestOrderDate: order.createdAt,
      });
    }
    const agg = map.get(phone)!;
    agg.orderCount += 1;
    agg.orders.push(order);
    if (order.createdAt > agg.latestOrderDate) {
      agg.latestOrderDate = order.createdAt;
      agg.name = order.customer.name;
      agg.expectedDeliveryDate = order.customer.expectedDeliveryDate;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.latestOrderDate.localeCompare(a.latestOrderDate));
}

export default function CustomersList() {
  const { orders } = useAppStore();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const customers = useMemo(() => aggregateCustomers(orders), [orders]);

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    if (!kw) return customers;
    return customers.filter((c) => c.name.includes(kw) || c.phone.includes(kw));
  }, [customers, keyword]);

  return (
    <Box>
      <PageHeader
        title="客户档案"
        subtitle={`共 ${customers.length} 位客户 · 数据从订单自动聚合`}
        icon={<PeopleOutlineRoundedIcon />}
      />

      <Card sx={{ mb: 2.5, p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="搜索姓名 / 手机号"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            size="small"
            sx={{ minWidth: 240 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary">
            提示：客户信息从历史订单中自动聚合，按手机号去重
          </Typography>
        </Stack>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={<PeopleOutlineRoundedIcon />} title="暂无客户数据" subtitle="客户数据将在创建订单后自动聚合" />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>客户姓名</TableCell>
                  <TableCell>手机号</TableCell>
                  <TableCell>预产期</TableCell>
                  <TableCell>历史订单</TableCell>
                  <TableCell>最近下单</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((c) => {
                  const statuses: OrderStatus[] = [...new Set(c.orders.map((o) => o.status))];
                  return (
                    <TableRow
                      key={c.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/customers/${c.id}`)}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{c.id}</Typography>
                      </TableCell>
                      <TableCell>{maskPhone(c.phone)}</TableCell>
                      <TableCell>{formatDate(c.expectedDeliveryDate)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip label={`${c.orderCount} 笔`} size="small" color="primary" variant="outlined" />
                          <Stack direction="row" spacing={0.3} sx={{ ml: 0.5 }}>
                            {statuses.slice(0, 3).map((s) => (
                              <Chip
                                key={s}
                                label={ORDER_STATUS_META[s].label}
                                size="small"
                                color={ORDER_STATUS_META[s].color}
                                variant="outlined"
                                sx={{ transform: 'scale(0.85)', transformOrigin: 'left' }}
                              />
                            ))}
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell>{formatDate(c.latestOrderDate)}</TableCell>
                      <TableCell align="right">
                        <ChevronRightRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
