import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  RadioGroup,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import { format, parseISO } from 'date-fns';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { SERVICE_DAYS_OPTIONS, REQUIREMENT_META } from '@/constants/meta';
import { calcEndDate, isValidPhone } from '@/utils/format';
import { orderApi } from '@/services/api';
import type { ServiceDays, ServiceRequirement } from '@/types';

export default function OrderForm() {
  const { refreshOrders, notify } = useAppStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [expectedDate, setExpectedDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [serviceDays, setServiceDays] = useState<ServiceDays | null>(null);
  const [requirement, setRequirement] = useState<ServiceRequirement>({
    lactation: false,
    confinementMeal: false,
    nightCare: false,
    housework: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const endDate = useMemo(
    () => (startDate && serviceDays ? calcEndDate(format(startDate, 'yyyy-MM-dd'), serviceDays) : null),
    [startDate, serviceDays],
  );

  const toggleReq = (key: keyof ServiceRequirement) =>
    setRequirement((r) => ({ ...r, [key]: !r[key] }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '请输入客户姓名';
    if (!phone) e.phone = '请输入联系电话';
    else if (!isValidPhone(phone)) e.phone = '请输入正确的手机号';
    if (!expectedDate) e.expectedDate = '请选择预产期';
    if (!startDate) e.startDate = '请选择服务开始日期';
    if (!serviceDays) e.serviceDays = '请选择服务天数';
    const anyReq = Object.values(requirement).some(Boolean);
    if (!anyReq) e.requirement = '请至少勾选一项服务需求';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !startDate || !serviceDays || !expectedDate) return;
    setSubmitting(true);
    try {
      const res = await orderApi.create({
        customer: { name: name.trim(), phone: phone.trim(), expectedDeliveryDate: format(expectedDate, 'yyyy-MM-dd') },
        serviceDays,
        startDate: format(startDate, 'yyyy-MM-dd'),
        requirement,
      });
      await refreshOrders();
      notify('订单已创建，正在前往智能匹配');
      navigate(`/matching/${res.data.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader title="客户下单" subtitle="录入客户信息与服务需求，提交后自动进入智能匹配" icon={<PersonAddAltRoundedIcon />} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
        <Stack spacing={2.5}>
          {/* 客户信息 */}
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 2 }}>客户信息</Typography>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="客户姓名" value={name} onChange={(e) => setName(e.target.value)} error={!!errors.name} helperText={errors.name} fullWidth />
                  <TextField label="联系电话" value={phone} onChange={(e) => setPhone(e.target.value)} error={!!errors.phone} helperText={errors.phone} fullWidth />
                </Stack>
                <DatePicker
                  label="预产期"
                  value={expectedDate}
                  onChange={(v) => setExpectedDate(v)}
                  format="yyyy-MM-dd"
                  slotProps={{ textField: { fullWidth: true, error: !!errors.expectedDate, helperText: errors.expectedDate } }}
                />
                <DatePicker
                  label="服务开始日期"
                  value={startDate}
                  onChange={(v) => setStartDate(v)}
                  format="yyyy-MM-dd"
                  minDate={expectedDate ?? undefined}
                  slotProps={{ textField: { fullWidth: true, error: !!errors.startDate, helperText: errors.startDate } }}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* 服务天数 */}
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 2 }}>服务天数</Typography>
              <ToggleButtonGroup value={serviceDays} exclusive onChange={(_, v) => v && setServiceDays(v as ServiceDays)} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4,1fr)' }, gap: 1.2, width: '100%' }}>
                {SERVICE_DAYS_OPTIONS.map((opt) => (
                  <ToggleButton key={opt.value} value={opt.value} sx={{ flexDirection: 'column', py: 1.8, borderRadius: '12px !important', border: '1px solid #DDD4C5 !important', '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff' } }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{opt.label}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>{opt.desc}</Typography>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              {errors.serviceDays && <FormHelperText error>{errors.serviceDays}</FormHelperText>}
            </CardContent>
          </Card>

          {/* 需求勾选 */}
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 2 }}>服务需求</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr' }, gap: 1.5 }}>
                {(Object.keys(REQUIREMENT_META) as (keyof ServiceRequirement)[]).map((key) => {
                  const meta = REQUIREMENT_META[key];
                  return (
                    <FormControlLabel
                      key={key}
                      control={<Checkbox checked={requirement[key]} onChange={() => toggleReq(key)} icon={<meta.icon />} checkedIcon={<meta.icon />} sx={{ color: 'secondary.main', '&.Mui-checked': { color: 'secondary.main' } }} />}
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{meta.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{meta.desc}</Typography>
                        </Box>
                      }
                      sx={{ alignItems: 'flex-start', mr: 0, p: 1.2, borderRadius: 2, border: '1px solid #EFE9DD', bgcolor: requirement[key] ? '#FBF1EE' : 'transparent', margin: 0 }}
                    />
                  );
                })}
              </Box>
              {errors.requirement && <FormHelperText error sx={{ mt: 1 }}>{errors.requirement}</FormHelperText>}
            </CardContent>
          </Card>
        </Stack>

        {/* 预览 */}
        <Card sx={{ position: { md: 'sticky' }, top: 90 }}>
          <CardContent>
            <Typography variant="h4" sx={{ mb: 2 }}>订单预览</Typography>
            <Stack spacing={1.3}>
              <PreviewRow label="客户" value={name || '—'} />
              <PreviewRow label="电话" value={phone || '—'} />
              <PreviewRow label="预产期" value={expectedDate ? format(expectedDate, 'yyyy-MM-dd') : '—'} />
              <PreviewRow label="开始日期" value={startDate ? format(startDate, 'yyyy-MM-dd') : '—'} />
              <PreviewRow label="服务天数" value={serviceDays ? `${serviceDays} 天` : '—'} />
              <PreviewRow label="结束日期" value={endDate ?? '—'} />
              <Divider />
              <Typography variant="caption" color="text.secondary">已选需求</Typography>
              <Box>
                {(Object.keys(requirement) as (keyof ServiceRequirement)[]).filter((k) => requirement[k]).length ? (
                  <Stack direction="row" flexWrap="wrap" gap={0.6}>
                    {(Object.keys(requirement) as (keyof ServiceRequirement)[]).filter((k) => requirement[k]).map((k) => (
                      <Typography key={k} variant="caption" sx={{ px: 1, py: 0.3, borderRadius: 1, bgcolor: '#F6E4DF', color: 'secondary.dark' }}>{REQUIREMENT_META[k].label}</Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary">未选择</Typography>
                )}
              </Box>
            </Stack>
            <Button fullWidth variant="contained" size="large" sx={{ mt: 2.5 }} disabled={submitting} onClick={handleSubmit}>
              {submitting ? '提交中…' : '提交订单并智能匹配'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
    </Stack>
  );
}
