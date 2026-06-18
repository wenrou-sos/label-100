import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { isSameMonth, parseISO } from 'date-fns';
import { useAppStore } from '@/context/AppStoreContext';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { MatronAvatar } from '@/components/common/MatronAvatar';
import { formatMoney, formatDateZh, formatDate } from '@/utils/format';
import { ORDER_STATUS_META } from '@/constants/meta';

interface TodoItem { label: string; count: number; path: string; color: string }

export default function Dashboard() {
  const { matrons, orders, contracts, payments } = useAppStore();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const now = new Date();
    const inService = orders.filter((o) => o.status === 'in_service').length;
    const matching = orders.filter((o) => o.status === 'matching').length;
    const monthRevenue = payments
      .filter((p) => p.status === 'paid' && p.paidAt && isSameMonth(parseISO(p.paidAt), now))
      .reduce((s, p) => s + p.amount, 0);
    return { matronCount: matrons.length, inService, matching, monthRevenue };
  }, [matrons, orders, payments]);

  // 近30天档期占用
  const upcoming = useMemo(() => {
    const now = new Date();
    const in30 = new Date();
    in30.setDate(now.getDate() + 30);
    const rows: { matronName: string; matronId: string; orderId: string; startDate: string; endDate: string }[] = [];
    matrons.forEach((m) => {
      m.schedules.forEach((s) => {
        const start = parseISO(s.startDate);
        if (start >= now && start <= in30) {
          rows.push({ matronName: m.name, matronId: m.id, orderId: s.orderId, startDate: s.startDate, endDate: s.endDate });
        }
      });
    });
    return rows.sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 6);
  }, [matrons]);

  const todos: TodoItem[] = [
    { label: '待匹配订单', count: orders.filter((o) => o.status === 'matching').length, path: '/orders', color: '#D9923B' },
    { label: '待签约订单', count: orders.filter((o) => o.status === 'matched').length, path: '/orders', color: '#4A7A8C' },
    { label: '待结算合同', count: contracts.filter((c) => c.status === 'deposit_paid').length, path: '/payments', color: '#1F4E3D' },
    { label: '待评价服务', count: orders.filter((o) => o.status === 'completed').length, path: '/orders', color: '#7B5EA7' },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <Box>
      <PageHeader
        title="工作台"
        subtitle={`今日 ${formatDate(new Date().toISOString())} · 月嫂中介运营全景`}
        icon={<AutorenewRoundedIcon />}
        actions={
          <Button variant="contained" startIcon={<ArrowForwardIosRoundedIcon />} onClick={() => navigate('/orders/new')}>
            新建订单
          </Button>
        }
      />

      {/* 指标卡片 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        <StatCard label="在册月嫂" value={stats.matronCount} icon={<GroupsRoundedIcon />} accent="#1F4E3D" trend="可派人员储备" />
        <StatCard label="进行中服务" value={stats.inService} icon={<AutorenewRoundedIcon />} accent="#3E7D5B" trend="服务进行中" />
        <StatCard label="待匹配订单" value={stats.matching} icon={<HourglassEmptyRoundedIcon />} accent="#D9923B" trend="等待智能匹配" />
        <StatCard label="本月营收" value={formatMoney(stats.monthRevenue)} icon={<PaidRoundedIcon />} accent="#C8553D" trend="已到账收入" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 2.5 }}>
        {/* 近30天档期预警 */}
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EventBusyRoundedIcon sx={{ color: 'secondary.main' }} />
                <Typography variant="h4">近30天档期预警</Typography>
              </Stack>
              <Button size="small" endIcon={<ArrowForwardIosRoundedIcon sx={{ fontSize: 14 }} />} onClick={() => navigate('/matrons')}>
                查看档案
              </Button>
            </Stack>
            <Divider sx={{ mb: 1 }} />
            {upcoming.length === 0 ? (
              <Typography variant="body2" sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                近30天暂无档期占用
              </Typography>
            ) : (
              <List disablePadding>
                {upcoming.map((u, i) => (
                  <ListItem key={i} disablePadding divider>
                    <ListItemButton onClick={() => navigate(`/matrons/${u.matronId}`)}>
                      <MatronAvatar name={u.matronName} size={36} />
                      <ListItemText
                        sx={{ ml: 1.5 }}
                        primary={u.matronName}
                        secondary={`${formatDateZh(u.startDate)} — ${formatDateZh(u.endDate)}`}
                        primaryTypographyProps={{ fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      <Chip label={u.orderId} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* 待办事项 */}
        <Card>
          <CardContent>
            <Typography variant="h4" sx={{ mb: 1.5 }}>待办事项</Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={1.2}>
              {todos.map((t) => (
                <Stack
                  key={t.label}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#FAF7F2',
                    border: '1px solid #EFE9DD',
                    cursor: 'pointer',
                    transition: 'all .2s',
                    '&:hover': { borderColor: t.color, transform: 'translateX(3px)' },
                  }}
                  onClick={() => navigate(t.path)}
                >
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: t.color }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.label}</Typography>
                  </Stack>
                  <Chip label={t.count} size="small" sx={{ bgcolor: t.color, color: '#fff', fontWeight: 700, minWidth: 28 }} />
                </Stack>
              ))}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>最近订单</Typography>
            <List disablePadding dense>
              {recentOrders.map((o) => (
                <ListItem key={o.id} disableGutters>
                  <ListItemText
                    primary={`${o.customer.name} · ${o.serviceDays}天`}
                    secondary={o.id}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption', sx: { fontFamily: 'monospace' } }}
                  />
                  <Chip label={ORDER_STATUS_META[o.status].label} size="small" color={ORDER_STATUS_META[o.status].color} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
