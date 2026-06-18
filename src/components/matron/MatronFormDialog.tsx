import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CERTIFICATE_LIST, CERTIFICATE_META } from '@/constants/meta';
import type { Certificate, Matron } from '@/types';
import { isValidPhone } from '@/utils/format';
import { useAppStore } from '@/context/AppStoreContext';
import { matronApi } from '@/services/api';

interface FormState {
  name: string;
  age: string;
  hometown: string;
  experienceYears: string;
  phone: string;
  certificates: Certificate[];
}

const EMPTY: FormState = { name: '', age: '', hometown: '', experienceYears: '', phone: '', certificates: [] };

export function MatronFormDialog({
  open,
  matron,
  onClose,
}: {
  open: boolean;
  matron?: Matron | null;
  onClose: () => void;
}) {
  const { refreshMatrons, notify } = useAppStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (matron) {
      setForm({
        name: matron.name,
        age: String(matron.age),
        hometown: matron.hometown,
        experienceYears: String(matron.experienceYears),
        phone: matron.phone,
        certificates: [...matron.certificates],
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [matron, open]);

  const toggleCert = (c: Certificate) =>
    setForm((f) => ({
      ...f,
      certificates: f.certificates.includes(c)
        ? f.certificates.filter((x) => x !== c)
        : [...f.certificates, c],
    }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = '请输入姓名';
    const age = Number(form.age);
    if (!form.age || isNaN(age) || age < 18 || age > 60) e.age = '年龄需在 18-60 之间';
    if (!form.hometown.trim()) e.hometown = '请输入籍贯';
    const exp = Number(form.experienceYears);
    if (form.experienceYears === '' || isNaN(exp) || exp < 0) e.experienceYears = '请输入有效年限';
    if (!form.phone) e.phone = '请输入电话';
    else if (!isValidPhone(form.phone)) e.phone = '请输入正确的手机号';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      age: Number(form.age),
      hometown: form.hometown.trim(),
      experienceYears: Number(form.experienceYears),
      phone: form.phone.trim(),
      certificates: form.certificates,
    };
    try {
      if (matron) {
        await matronApi.update(matron.id, payload);
        notify('月嫂档案已更新');
      } else {
        await matronApi.create(payload);
        notify('月嫂档案已创建');
      }
      await refreshMatrons();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{matron ? '编辑月嫂档案' : '新增月嫂档案'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.2} sx={{ mt: 0.5 }}>
          <TextField
            label="姓名"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="年龄"
              type="number"
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              error={!!errors.age}
              helperText={errors.age}
              fullWidth
            />
            <TextField
              label="从业年限（年）"
              type="number"
              value={form.experienceYears}
              onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))}
              error={!!errors.experienceYears}
              helperText={errors.experienceYears}
              fullWidth
            />
          </Stack>
          <TextField
            label="籍贯"
            value={form.hometown}
            placeholder="如 江苏苏州"
            onChange={(e) => setForm((f) => ({ ...f, hometown: e.target.value }))}
            error={!!errors.hometown}
            helperText={errors.hometown}
            fullWidth
          />
          <TextField
            label="联系电话"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            error={!!errors.phone}
            helperText={errors.phone}
            fullWidth
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>持证情况</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {CERTIFICATE_LIST.map((c) => {
                const meta = CERTIFICATE_META[c];
                const active = form.certificates.includes(c);
                return (
                  <Button
                    key={c}
                    size="small"
                    variant={active ? 'contained' : 'outlined'}
                    onClick={() => toggleCert(c)}
                    startIcon={<meta.icon />}
                    sx={{
                      bgcolor: active ? meta.color : 'transparent',
                      color: active ? '#fff' : meta.color,
                      borderColor: meta.color,
                      borderRadius: 2,
                      textTransform: 'none',
                    }}
                  >
                    {meta.label}
                  </Button>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">取消</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {submitting ? '保存中…' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
