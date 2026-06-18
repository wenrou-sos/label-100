import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { MatronAvatar } from '@/components/common/MatronAvatar';
import { CONTRACT_STATUS_META, PAYMENT_METHOD_META } from '@/constants/meta';
import { formatMoney, formatDateTime } from '@/utils/format';
import { paymentApi } from '@/services/api';
import type { Contract, PaymentMethod } from '@/types';

export default function Payments() {
  const { contracts, payments, orders, matrons, refreshContracts, refreshPayments, refreshOrders, notify } = useAppStore();
  const [target, setTarget] = useState<{ contract: Contract; type: 'deposit' | 'final' } | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('wechat');
  const [submitting, setSubmitting] = useState(false);

  const pending = contracts.filter((c) => c.status === 'signed' || c.status === 'deposit_paid');

  const handlePay = async () => {
    if (!target) return;
    setSubmitting(true);
    try {
      const res = target.type === 'deposit'
        ? await paymentApi.payDeposit(target.contract.id, method)
        : await paymentApi.settleFinal(target.contract.id, method);
      if (res.data) {
        await refreshContracts();
        await refreshPayments();
        await refreshOrders();
        notify(res.message);
        setTarget(null);
      } else {
        notify(res.message, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader title="支付管理" subtitle="定金支付与尾款结算" icon={<PaymentsRoundedIcon />} />

      {/* 待付款合同 */}
      <Typography variant="h4" sx={{ mb: 1.5 }}>待处理款项</Typography>
      <Card sx={{ mb: 3 }}>
        {pending.length === 0 ? (
          <EmptyState icon={<PaymentsRoundedIcon />} title="暂无待处理款项" subtitle="所有合同款项均已结清" />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>合同</TableCell>
                  <TableCell>月嫂 / 客户</TableCell>
                  <TableCell>款项</TableCell>
                  <TableCell>金额</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pending.map((c) => {
                  const order = orders.find((o) => o.id === c.orderId);
                  const matron = matrons.find((m) => m.id === c.matronId);
                  const meta = CONTRACT_STATUS_META[c.status];
                  return (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{c.id}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <MatronAvatar name={matron?.name ?? '?'} size={30} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{matron?.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{order?.customer.name}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{c.status === 'signed' ? '定金' : '尾款'}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{formatMoney(c.status === 'signed' ? c.deposit : c.amount - c.deposit)}</TableCell>
                      <TableCell><Chip label={meta.label} size="small" color={meta.color} /></TableCell>
                      <TableCell align="right">
                        {c.status === 'signed' ? (
                          <Button size="small" variant="contained" color="secondary" onClick={() => setTarget({ contract: c, type: 'deposit' })}>支付定金</Button>
                        ) : (
                          <Button size="small" variant="contained" onClick={() => setTarget({ contract: c, type: 'final' })}>结算尾款</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* 支付记录 */}
      <Typography variant="h4" sx={{ mb: 1.5 }}>支付记录</Typography>
      <Card>
        {payments.length === 0 ? (
          <EmptyState icon={<ReceiptLongRoundedIcon />} title="暂无支付记录" />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>支付单号</TableCell>
                  <TableCell>类型</TableCell>
                  <TableCell>金额</TableCell>
                  <TableCell>方式</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>支付时间</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{p.id}</TableCell>
                    <TableCell>{p.type === 'deposit' ? '定金' : '尾款'}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{formatMoney(p.amount)}</TableCell>
                    <TableCell>{PAYMENT_METHOD_META[p.method].icon} {PAYMENT_METHOD_META[p.method].label}</TableCell>
                    <TableCell><Chip label={p.status === 'paid' ? '已支付' : '待支付'} size="small" color={p.status === 'paid' ? 'success' : 'warning'} /></TableCell>
                    <TableCell>{p.paidAt ? formatDateTime(p.paidAt) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* 支付方式选择弹窗 */}
      <Dialog open={!!target} onClose={() => setTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{target?.type === 'deposit' ? '支付定金' : '结算尾款'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            应付 <b style={{ color: '#C8553D' }}>{target ? formatMoney(target.type === 'deposit' ? target.contract.deposit : target.contract.amount - target.contract.deposit) : ''}</b>，请选择支付方式
          </Typography>
          <Stack spacing={1}>
            {(Object.keys(PAYMENT_METHOD_META) as PaymentMethod[]).map((m) => (
              <Stack
                key={m}
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={() => setMethod(m)}
                sx={{ p: 1.5, borderRadius: 2, border: method === m ? '2px solid #1F4E3D' : '1px solid #EFE9DD', cursor: 'pointer', bgcolor: method === m ? '#F0F5F2' : 'transparent' }}
              >
                <Radio checked={method === m} color="primary" size="small" />
                <Typography variant="body2" sx={{ flex: 1 }}>{PAYMENT_METHOD_META[m].icon} {PAYMENT_METHOD_META[m].label}</Typography>
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setTarget(null)} color="inherit">取消</Button>
          <Button variant="contained" disabled={submitting} onClick={handlePay}>{submitting ? '处理中…' : '确认支付'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
