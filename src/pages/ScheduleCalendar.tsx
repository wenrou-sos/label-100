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
import { MATRON_STATUS_META } from '@/constants/meta';
import { formatDateZh } from '@/utils/format';
import type { Matron, MatronStatus } from '@/types';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const STATUS_FILTERS: { value: MatronStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部月嫂' },
  { value: 'available', label: '在岗可派' },
  { value: 'busy', label: '服务中' },
  { value: 'off', label: '休假' },
];

interface DaySchedule {
  date: string;
  matrons: Matron[];
}

function buildScheduleMap(matrons: Matron[]): Map<string, Matron[]> {
  const map = new Map<string, Matron[]>();
  for (const m of matrons) {
    for (const s of m.schedules) {
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
  const { matrons } = useAppStore();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<MatronStatus | 'all'>('all');
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredMatrons = useMemo(() => {
    return statusFilter === 'all' ? matrons : matrons.filter((m) => m.status === statusFilter);
  }, [matrons, statusFilter]);

  const scheduleMap = useMemo(() => buildScheduleMap(filteredMatrons), [filteredMatrons]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const selectedDaySchedule = useMemo<DaySchedule | null>(() => {
    if (!selectedDate) return null;
    const key = format(selectedDate, 'yyyy-MM-dd');
    return { date: key, matrons: scheduleMap.get(key) ?? [] };
  }, [selectedDate, scheduleMap]);

  const openDayDetail = (d: Date) => {
    setSelectedDate(d);
    setDialogOpen(true);
  };

  const busyCount = matrons.filter((m) => m.status === 'busy').length;
  const availableCount = matrons.filter((m) => m.status === 'available').length;
  const offCount = matrons.filter((m) => m.status === 'off').length;

  return (
    <Box>
      <PageHeader
        title="档期日历"
        subtitle="按月查看所有月嫂的服务档期安排"
        icon={<EventAvailableRoundedIcon />}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MatronStatus | 'all')}
              sx={{ minWidth: 150 }}
            >
              {STATUS_FILTERS.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </TextField>
          </Stack>
        }
      />

      <Card sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip label={`在岗可派 ${availableCount}`} size="small" color="success" variant="outlined" />
            <Chip label={`服务中 ${busyCount}`} size="small" color="warning" variant="outlined" />
            <Chip label={`休假 ${offCount}`} size="small" color="default" variant="outlined" />
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
                  {dayMatrons.slice(0, 3).map((m) => (
                    <Tooltip key={m.id} title={`${m.name} · ${formatDateZh(m.schedules.find((s) => {
                      const start = parseISO(s.startDate);
                      const end = parseISO(s.endDate);
                      return d >= start && d <= end;
                    })!.startDate)}~${formatDateZh(m.schedules.find((s) => {
                      const start = parseISO(s.startDate);
                      const end = parseISO(s.endDate);
                      return d >= start && d <= end;
                    })!.endDate)}`}>
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
                  ))}
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
          {!selectedDaySchedule || selectedDaySchedule.matrons.length === 0 ? (
            <EmptyState
              icon={<EventAvailableRoundedIcon />}
              title="当日无排班月嫂"
              subtitle={statusFilter === 'all' ? '所有月嫂当日都空闲' : '所选状态的月嫂当日没有服务安排'}
            />
          ) : (
            <Stack spacing={1.2} sx={{ pt: 0.5 }}>
              {selectedDaySchedule.matrons.map((m) => {
                const hit = m.schedules.find((s) => {
                  if (!selectedDate) return false;
                  const start = parseISO(s.startDate);
                  const end = parseISO(s.endDate);
                  return selectedDate >= start && selectedDate <= end;
                });
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
                          <Chip label={MATRON_STATUS_META[m.status].label} size="small" color={MATRON_STATUS_META[m.status].color} variant="outlined" />
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
