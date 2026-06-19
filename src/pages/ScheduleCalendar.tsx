import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { MatronAvatar } from '@/components/common/MatronAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDateZh } from '@/utils/format';
import type { Matron, Order, Schedule } from '@/types';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

// 只有订单进入「已签约」及之后的状态，月嫂档期才算真正锁定，才计入日历
const LOCKED_ORDER_STATUSES = new Set<Order['status']>(['contracted', 'in_service', 'completed']);

type FilterKey = 'all' | 'scheduled' | 'free' | 'off';

const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
  { value: 'all', label: '全部月嫂' },
  { value: 'scheduled', label: '本月有排班' },
  { value: 'free', label: '本月可接单' },
  { value: 'off', label: '休假中' },
];

function findHitSchedule(m: Matron, d: Date): Schedule | undefined {
  return m.schedules.find((s) => {
    const start = parseISO(s.startDate);
    const end = parseISO(s.endDate);
    return d >= start && d <= end;
  });
}

// 判断某条档期是否为「已锁定」（对应订单已签约及之后），未签约订单的档期不计入
function isScheduleEffective(orders: Order[], schedule: Schedule): boolean {
  const order = orders.find((o) => o.id === schedule.orderId);
  if (!order) return false;
  return LOCKED_ORDER_STATUSES.has(order.status);
}

// 构建 日期 -> 月嫂列表 的映射，仅含已锁定档期
function buildScheduleMap(matrons: Matron[], orders: Order[]): Map<string, Matron[]> {
  const map = new Map<string, Matron[]>();
  for (const m of matrons) {
    for (const s of m.schedules) {
      if (!isScheduleEffective(orders, s)) continue;
      const start = parseISO(s.startDate);
      const end = parseISO(s.endDate);
      const days = eachDayOfInterval({ start, end });
      for (const d of days) {
        const key = format(d, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        const list = map.get(key)!;
        if (!list.find((x) => x.id === m.id)) list.push(m);
      }
    }
  }
  return map;
}

export default function ScheduleCalendar() {
  const { matrons, orders } = useAppStore();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 全量有效档期映射（已过滤未签约订单）
  const allScheduleMap = useMemo(() => buildScheduleMap(matrons, orders), [matrons, orders]);

  // 当前视图月份内「有有效排班」的月嫂 ID 集合，作为筛选"服务中/可接单"的事实依据
  const scheduledIdsInMonth = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const ids = new Set<string>();
    for (const [key, list] of allScheduleMap) {
      const d = parseISO(key);
      if (d >= monthStart && d <= monthEnd) {
        list.forEach((m) => ids.add(m.id));
      }
    }
    return ids;
  }, [allScheduleMap, viewMonth]);

  // 按档期事实过滤月嫂，避免档案 status 与实际排班自相矛盾
  const filteredMatrons = useMemo(() => {
    return matrons.filter((m) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'scheduled') return scheduledIdsInMonth.has(m.id);
      if (statusFilter === 'free') return m.status !== 'off' && !scheduledIdsInMonth.has(m.id);
      if (statusFilter === 'off') return m.status === 'off';
      return true;
    });
  }, [matrons, statusFilter, scheduledIdsInMonth]);

  // 展示用档期映射：在全量有效档期基础上，仅保留筛选后的月嫂
  const scheduleMap = useMemo(() => {
    if (statusFilter === 'all') return allScheduleMap;
    const idSet = new Set(filteredMatrons.map((m) => m.id));
    const map = new Map<string, Matron[]>();
    for (const [key, list] of allScheduleMap) {
      const filtered = list.filter((m) => idSet.has(m.id));
      if (filtered.length > 0) map.set(key, filtered);
    }
    return map;
  }, [allScheduleMap, filteredMatrons, statusFilter]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const selectedDayMatrons = useMemo<Matron[]>(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return scheduleMap.get(key) ?? [];
  }, [selectedDate, scheduleMap]);

  const openDayDetail = (d: Date) => {
    setSelectedDate(d);
    setDialogOpen(true);
  };

  // 状态统计：基于档期事实而非档案 status 字段
  const scheduledCount = scheduledIdsInMonth.size;
  const offCount = matrons.filter((m) => m.status === 'off').length;
  const freeCount = matrons.filter((m) => m.status !== 'off' && !scheduledIdsInMonth.has(m.id)).length;

  return (
    <Box>
      <PageHeader
        title="档期日历"
        subtitle="按月查看所有月嫂的服务档期安排（仅已签约及之后的订单锁定档期）"
        icon={<EventAvailableRoundedIcon />}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterKey)}
              sx={{ minWidth: 150 }}
            >
              {FILTER_OPTIONS.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </TextField>
          </Stack>
        }
      />

      <Card sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip label={`本月有排班 ${scheduledCount}`} size="small" color="warning" variant="outlined" />
            <Chip label={`本月可接单 ${freeCount}`} size="small" color="success" variant="outlined" />
            <Chip label={`休假中 ${offCount}`} size="small" color="default" variant="outlined" />
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton size="small" onClick={() => setViewMonth((prev) => addMonths(prev, -1))}>
              <ChevronLeftRoundedIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 700, minWidth: 140, textAlign: 'center' }}>
              {format(viewMonth, 'yyyy年 M月')}
            </Typography>
            <IconButton size="small" onClick={() => setViewMonth((prev) => addMonths(prev, 1))}>
              <ChevronRightRoundedIcon />
            </IconButton>
            <Button size="small" onClick={() => setViewMonth(new Date())}>今天</Button>
          </Stack>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
          {WEEK_LABELS.map((w) => (
            <Box
              key={w}
              sx={{
                py: 1,
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 600,
                color: 'text.secondary',
                borderBottom: '1px solid #EFE9DD',
              }}
            >
              周{w}
            </Box>
          ))}
          {monthDays.map((d, idx) => {
            const key = format(d, 'yyyy-MM-dd');
            const dayMatrons = scheduleMap.get(key) ?? [];
            const inMonth = isSameMonth(d, viewMonth);
            const today = isToday(d);
            const overflow = dayMatrons.length > 3;
            return (
              <Box
                key={idx}
                onClick={() => openDayDetail(d)}
                sx={{
                  minHeight: 92,
                  p: 0.8,
                  border: '1px solid #F0EADD',
                  borderRadius: 1.2,
                  bgcolor: today ? '#FFF8EC' : inMonth ? '#FFFFFF' : '#FAF7F2',
                  cursor: 'pointer',
                  transition: 'all .15s',
                  '&:hover': { borderColor: '#D9C9A3', bgcolor: today ? '#FFEFC9' : '#FFF8EC' },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: today ? 700 : 500,
                      color: today ? 'primary.main' : inMonth ? 'text.primary' : 'text.disabled',
                    }}
                  >
                    {format(d, 'd')}
                  </Typography>
                  {dayMatrons.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                      {dayMatrons.length}人
                    </Typography>
                  )}
                </Stack>
                <Stack spacing={0.4}>
                  {dayMatrons.slice(0, 3).map((m) => {
                    const hit = findHitSchedule(m, d);
                    return (
                      <Tooltip
                        key={m.id}
                        title={hit ? `${m.name} · ${formatDateZh(hit.startDate)} ~ ${formatDateZh(hit.endDate)}` : m.name}
                      >
                        <Box
                          sx={{
                            px: 0.8,
                            py: 0.3,
                            borderRadius: 0.8,
                            bgcolor: '#1F4E3D',
                            color: '#FFFFFF',
                            fontSize: 11,
                            lineHeight: 1.4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {m.name}
                        </Box>
                      </Tooltip>
                    );
                  })}
                  {overflow && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, pl: 0.5 }}>
                      +{dayMatrons.length - 3} 更多…
                    </Typography>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">{selectedDate ? formatDateZh(format(selectedDate, 'yyyy-MM-dd')) : ''} 排班详情</Typography>
          <IconButton size="small" onClick={() => setDialogOpen(false)}><CloseRoundedIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDayMatrons.length === 0 ? (
            <EmptyState
              icon={<EventAvailableRoundedIcon />}
              title="当日无排班月嫂"
              subtitle={statusFilter === 'all' ? '当日所有月嫂档期空闲' : '所选筛选条件下当日没有已锁定的排班'}
            />
          ) : (
            <Stack spacing={1.2} sx={{ pt: 0.5 }}>
              {selectedDayMatrons.map((m) => {
                const hit = selectedDate ? findHitSchedule(m, selectedDate) : undefined;
                return (
                  <Box
                    key={m.id}
                    onClick={() => { setDialogOpen(false); navigate(`/matrons/${m.id}`); }}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid #EFE9DD',
                      cursor: 'pointer',
                      transition: 'all .15s',
                      '&:hover': { bgcolor: '#FAF7F2', borderColor: '#D9C9A3' },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <MatronAvatar name={m.name} size={44} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ fontWeight: 700 }}>{m.name}</Typography>
                          {/* 状态基于当日排班事实，而非档案 status，避免"已排班却显示在岗可派"的矛盾 */}
                          <Chip label="当日排班中" size="small" color="success" variant="filled" />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {m.hometown} · 从业{m.experienceYears}年
                        </Typography>
                        {hit && (
                          <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.3 }}>
                            服务期：{formatDateZh(hit.startDate)} ~ {formatDateZh(hit.endDate)}（订单 {hit.orderId}）
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" variant="text">关闭</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
