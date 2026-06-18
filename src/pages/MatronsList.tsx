import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import Diversity3RoundedIcon from '@mui/icons-material/Diversity3Rounded';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { MatronAvatar } from '@/components/common/MatronAvatar';
import { RatingStars } from '@/components/common/RatingStars';
import { CertificateChips } from '@/components/common/CertificateChips';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MatronFormDialog } from '@/components/matron/MatronFormDialog';
import { CERTIFICATE_LIST, CERTIFICATE_META, MATRON_STATUS_META } from '@/constants/meta';
import { matronApi } from '@/services/api';
import type { Certificate, Matron } from '@/types';

type SortKey = 'rating' | 'experience' | 'age';

export default function MatronsList() {
  const { matrons, refreshMatrons, notify, loading } = useAppStore();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [certFilter, setCertFilter] = useState<Certificate[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortKey>('rating');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Matron | null>(null);
  const [deleting, setDeleting] = useState<Matron | null>(null);

  const filtered = useMemo(() => {
    let list = matrons.filter((m) => {
      const kw = keyword.trim();
      if (kw && !m.name.includes(kw) && !m.hometown.includes(kw)) return false;
      if (certFilter.length && !certFilter.every((c) => m.certificates.includes(c))) return false;
      if (m.averageRating < minRating) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'rating') return b.averageRating - a.averageRating;
      if (sort === 'experience') return b.experienceYears - a.experienceYears;
      return b.age - a.age;
    });
    return list;
  }, [matrons, keyword, certFilter, minRating, sort]);

  const handleDelete = async () => {
    if (!deleting) return;
    await matronApi.remove(deleting.id);
    await refreshMatrons();
    notify('月嫂档案已删除', 'success');
    setDeleting(null);
  };

  return (
    <Box>
      <PageHeader
        title="月嫂档案"
        subtitle={`共 ${matrons.length} 名月嫂 · 支持筛选、排序与增删改查`}
        icon={<Diversity3RoundedIcon />}
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}>
            新增月嫂
          </Button>
        }
      />

      {/* 筛选栏 */}
      <Card sx={{ mb: 2.5, p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="搜索姓名 / 籍贯"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
          />
          <ToggleButtonGroup
            value={certFilter}
            size="small"
            onChange={(_, v: Certificate[]) => setCertFilter(v)}
            sx={{ flexWrap: 'wrap', gap: 0.5 }}
          >
            {CERTIFICATE_LIST.map((c) => (
              <ToggleButton key={c} value={c} sx={{ px: 1.2, py: 0.4, fontSize: 12, borderRadius: '8px !important', border: '1px solid #DDD4C5 !important' }}>
                {CERTIFICATE_META[c].short}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <TextField select label="最低均分" size="small" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} sx={{ minWidth: 120 }}>
            {[0, 3, 4, 4.5].map((v) => (
              <MenuItem key={v} value={v}>{v === 0 ? '不限' : `${v} 分以上`}</MenuItem>
            ))}
          </TextField>
          <TextField select label="排序" size="small" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} sx={{ minWidth: 130 }}>
            <MenuItem value="rating">评价均分</MenuItem>
            <MenuItem value="experience">从业年限</MenuItem>
            <MenuItem value="age">年龄</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <ToggleButtonGroup value={view} exclusive size="small" onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="grid"><GridViewRoundedIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="list"><ViewListRoundedIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<Diversity3RoundedIcon />} title="未找到符合条件的月嫂" subtitle="试试调整筛选条件或新增月嫂档案" actionLabel="新增月嫂" onAction={() => { setEditing(null); setFormOpen(true); }} /></Card>
      ) : view === 'grid' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3,1fr)' }, gap: 2 }}>
          {filtered.map((m) => (
            <Card key={m.id} sx={{ overflow: 'hidden', transition: 'all .2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 28px rgba(26,43,37,0.10)' } }}>
              <CardActionArea onClick={() => navigate(`/matrons/${m.id}`)}>
                <CardContent>
                  <Stack direction="row" spacing={1.6} alignItems="center">
                    <MatronAvatar name={m.name} size={56} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{m.name}</Typography>
                        <Chip label={MATRON_STATUS_META[m.status].label} size="small" color={MATRON_STATUS_META[m.status].color} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">{m.age}岁 · {m.hometown} · 从业{m.experienceYears}年</Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ mt: 1.5 }}>
                    <CertificateChips certificates={m.certificates} size="small" />
                  </Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.8 }}>
                    <RatingStars value={m.averageRating} size="small" />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{m.id}</Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
              <Stack direction="row" justifyContent="flex-end" spacing={0.5} sx={{ px: 1.5, pb: 1 }}>
                <IconButton size="small" onClick={() => { setEditing(m); setFormOpen(true); }}><EditRoundedIcon fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => setDeleting(m)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
              </Stack>
            </Card>
          ))}
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            {filtered.map((m, i) => (
              <Stack
                key={m.id}
                direction="row"
                alignItems="center"
                spacing={2}
                divider={undefined}
                sx={{ p: 1.8, borderBottom: i < filtered.length - 1 ? '1px solid #EFE9DD' : 'none', cursor: 'pointer', '&:hover': { bgcolor: '#FAF7F2' } }}
                onClick={() => navigate(`/matrons/${m.id}`)}
              >
                <MatronAvatar name={m.name} size={44} />
                <Box sx={{ width: 130 }}>
                  <Typography sx={{ fontWeight: 700 }}>{m.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.age}岁 · {m.hometown}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}><CertificateChips certificates={m.certificates} size="small" /></Box>
                <Typography variant="body2" sx={{ width: 70 }}>从业{m.experienceYears}年</Typography>
                <RatingStars value={m.averageRating} size="small" showValue />
                <Box onClick={(e) => e.stopPropagation()}>
                  <IconButton size="small" onClick={() => { setEditing(m); setFormOpen(true); }}><EditRoundedIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleting(m)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                </Box>
              </Stack>
            ))}
          </CardContent>
        </Card>
      )}

      <MatronFormDialog open={formOpen} matron={editing} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!deleting}
        title="删除月嫂档案"
        content={`确定要删除「${deleting?.name}」的档案吗？该操作不可恢复。`}
        confirmText="删除"
        confirmColor="error"
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
