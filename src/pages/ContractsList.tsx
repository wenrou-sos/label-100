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
  Typography,
} from '@mui/material';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { MatronAvatar } from '@/components/common/MatronAvatar';
import { CONTRACT_STATUS_META } from '@/constants/meta';
import { formatMoney, formatDate } from '@/utils/format';

export default function ContractsList() {
  const { contracts, orders, matrons } = useAppStore();
  const navigate = useNavigate();

  const rows = contracts.map((c) => {
    const order = orders.find((o) => o.id === c.orderId);
    const matron = matrons.find((m) => m.id === c.matronId);
    return { contract: c, order, matron };
  });

  return (
    <Box>
      <PageHeader title="合同管理" subtitle={`共 ${contracts.length} 份合同`} icon={<DescriptionRoundedIcon />} />
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={<DescriptionRoundedIcon />} title="暂无合同" subtitle="完成匹配并选定月嫂后将自动生成合同" />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>合同号</TableCell>
                  <TableCell>月嫂</TableCell>
                  <TableCell>客户</TableCell>
                  <TableCell>金额</TableCell>
                  <TableCell>定金</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>签署日期</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(({ contract, order, matron }) => {
                  const meta = CONTRACT_STATUS_META[contract.status];
                  return (
                    <TableRow key={contract.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{contract.id}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <MatronAvatar name={matron?.name ?? '?'} size={30} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{matron?.name ?? '—'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{order?.customer.name ?? '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{formatMoney(contract.amount)}</TableCell>
                      <TableCell>{formatMoney(contract.deposit)}</TableCell>
                      <TableCell><Chip label={meta.label} size="small" color={meta.color} /></TableCell>
                      <TableCell>{contract.signedAt ? formatDate(contract.signedAt) : '—'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />} onClick={() => navigate(`/contracts/${contract.orderId}`)}>查看</Button>
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
