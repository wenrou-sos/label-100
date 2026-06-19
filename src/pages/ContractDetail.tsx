import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DrawRoundedIcon from '@mui/icons-material/DrawRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { MatronAvatar } from '@/components/common/MatronAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { InlineLoader } from '@/components/common/LoadingState';
import { contractApi, paymentApi } from '@/services/api';
import { CONTRACT_STATUS_META } from '@/constants/meta';
import { formatMoney, formatDate, formatDateTime } from '@/utils/format';
import type { Contract, Payment } from '@/types';

export default function ContractDetail() {
  const { orderId } = useParams();
  const { orders, matrons, refreshContracts, refreshOrders, notify } = useAppStore();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  const order = orders.find((o) => o.id === orderId);
  const matron = matrons.find((m) => m.id === (contract?.matronId ?? order?.selectedMatronId));

  const load = async () => {
    if (!orderId) return;
    setLoading(true);
    let res = await contractApi.getByOrder(orderId);
    if (!res.data && order?.selectedMatronId) {
      res = await contractApi.createForOrder(orderId);
    }
    setContract(res.data ?? null);
    const p = await paymentApi.byContract(res.data?.id ?? '');
    setPayments(p.data);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [orderId, order?.selectedMatronId]);

  const handleSign = async () => {
    if (!contract) return;
    setSigning(true);
    try {
      await contractApi.sign(contract.id);
      await refreshContracts();
      await refreshOrders();
      await load();
      notify('合同已签署，月嫂档期已锁定');
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <Card><InlineLoader label="合同加载中…" /></Card>;
  if (!order) return <Card><EmptyState title="订单不存在" actionLabel="返回订单" onAction={() => navigate('/orders')} /></Card>;
  if (!order.selectedMatronId) {
    return (
      <Card>
        <EmptyState title="尚未选定月嫂" subtitle="请先完成智能匹配并选定一名月嫂" actionLabel="前往匹配" onAction={() => navigate(`/matching/${order.id}`)} />
      </Card>
    );
  }
  if (!contract) return <Card><EmptyState title="合同生成失败" /></Card>;

  const finalAmount = contract.amount - contract.deposit;
  const meta = CONTRACT_STATUS_META[contract.status];

  return (
    <Box>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/contracts')} sx={{ mb: 1.5, color: 'text.secondary' }}>返回合同列表</Button>
      <PageHeader title="电子合同" subtitle={`合同号 ${contract.id}`} icon={<DrawRoundedIcon />} actions={<Chip label={meta.label} color={meta.color} />} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.6fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
        {/* 合同正文 */}
        <Card>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h3" align="center" sx={{ mb: 0.5 }}>月嫂护理服务合同</Typography>
            <Typography variant="caption" align="center" color="text.secondary" sx={{ display: 'block', mb: 3 }}>合同编号：{contract.id} · 签订日期：{formatDate(contract.createdAt)}</Typography>
            <Divider sx={{ mb: 2.5 }} />
            <Stack spacing={1.5}>
              <Clause title="甲方（客户）" content={`${order.customer.name}，联系电话 ${order.customer.phone}，预产期 ${formatDate(order.customer.expectedDeliveryDate)}。`} />
              <Clause title="乙方（月嫂）" content={`${matron?.name ?? '—'}，${matron?.age ?? ''}岁，籍贯${matron?.hometown ?? '—'}，从业${matron?.experienceYears ?? ''}年，持证：${matron?.certificates.length ?? 0} 项。`} />
              <Clause title="第一条 服务内容与期间" content={`乙方为甲方提供 ${order.serviceDays} 天母婴护理服务，服务期自 ${formatDate(order.startDate)} 起至 ${formatDate(order.endDate)} 止。`} />
              <Clause title="第二条 服务费用" content={`合同总金额 ${formatMoney(contract.amount)}（含 ${order.serviceDays} 天 × 单价）。甲方需在签署后支付定金 ${formatMoney(contract.deposit)}，服务结束后支付尾款 ${formatMoney(finalAmount)}。`} />
              <Clause title="第三条 档期锁定" content="本合同签署后，乙方对应服务期档期即被锁定，不得承接其他冲突订单。" />
              <Clause title="第四条 双方权利义务" content="乙方应按行业规范提供专业护理；甲方应按时支付费用并提供必要工作条件。" />
            </Stack>
            <Divider sx={{ my: 3 }} />
            <Stack direction="row" justifyContent="space-between">
              <Box>
                <Typography variant="caption" color="text.secondary">甲方签字</Typography>
                <Box sx={{ width: 160, borderBottom: '1.5px dashed #BFB6A6', height: 40 }} />
                {contract.signedAt && <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>已签署 · {formatDateTime(contract.signedAt)}</Typography>}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">乙方签字</Typography>
                <Box sx={{ width: 160, borderBottom: '1.5px dashed #BFB6A6', height: 40 }} />
                {contract.signedAt && <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>已签署 · {formatDateTime(contract.signedAt)}</Typography>}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* 侧栏：状态与操作 */}
        <Stack spacing={2.5}>
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 1.5 }}>签约方</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <MatronAvatar name={matron?.name ?? '?'} size={44} />
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{matron?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">从业{matron?.experienceYears}年 · {matron?.hometown}</Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 1.8 }} />
              <Row label="合同金额" value={formatMoney(contract.amount)} />
              <Row label="定金（30%）" value={formatMoney(contract.deposit)} />
              <Row label="尾款" value={formatMoney(finalAmount)} />
              <Row label="签署时间" value={contract.signedAt ? formatDateTime(contract.signedAt) : '未签署'} />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 1.5 }}>操作</Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PrintRoundedIcon />}
                onClick={() => window.open(`/contracts/${order.id}/print`, '_blank', 'width=900,height=1200')}
                sx={{ mb: 1.5 }}
              >
                打印合同
              </Button>
              {contract.status === 'draft' && (
                <Stack spacing={1.2}>
                  <Button fullWidth variant="contained" startIcon={<DrawRoundedIcon />} disabled={signing} onClick={handleSign}>
                    {signing ? '签署中…' : '签署合同并锁定档期'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">签署后将自动锁定月嫂档期，并进入支付定金环节</Typography>
                </Stack>
              )}
              {contract.status === 'signed' && (
                <Button fullWidth variant="contained" color="secondary" startIcon={<PaymentsRoundedIcon />} onClick={() => navigate('/payments')}>前往支付定金</Button>
              )}
              {(contract.status === 'deposit_paid' || contract.status === 'final_settled') && (
                <Button fullWidth variant="outlined" startIcon={<LockRoundedIcon />} onClick={() => navigate(`/service/${order.id}`)}>查看服务进度</Button>
              )}
              {payments.length > 0 && (
                <>
                  <Divider sx={{ my: 1.8 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>支付记录</Typography>
                  {payments.map((p) => (
                    <Stack key={p.id} direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption">{p.type === 'deposit' ? '定金' : '尾款'} · {formatDateTime(p.paidAt)}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatMoney(p.amount)}</Typography>
                    </Stack>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}

function Clause({ title, content }: { title: string; content: string }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{title}</Typography>
      <Typography variant="body2" sx={{ mt: 0.3, lineHeight: 1.8 }}>{content}</Typography>
    </Box>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.6 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
    </Stack>
  );
}
