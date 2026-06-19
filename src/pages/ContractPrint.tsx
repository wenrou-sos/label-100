import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Divider, Button } from '@mui/material';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import { useAppStore } from '@/context/AppStoreContext';
import { contractApi } from '@/services/api';
import { formatMoney, formatDate, formatDateZh } from '@/utils/format';
import type { Contract, Matron, Order } from '@/types';

const A4_WIDTH = 794; // px (96dpi)
const A4_HEIGHT = 1123; // px (96dpi)

interface PrintPayload {
  contract: Contract;
  order: Order;
  matron: Matron;
  printedAt: string;
}

export default function ContractPrint() {
  const { orderId } = useParams();
  const { orders, matrons, loading: storeLoading } = useAppStore();

  const [contract, setContract] = useState<Contract | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [matron, setMatron] = useState<Matron | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const hasPrinted = useRef(false);

  // 1. 优先从 sessionStorage 读取（确保拿到最新数据）
  useEffect(() => {
    if (!orderId) return;
    const cacheKey = `contract_print_${orderId}`;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const payload: PrintPayload = JSON.parse(raw);
        if (payload.contract && payload.order && payload.matron) {
          setContract(payload.contract);
          setOrder(payload.order);
          setMatron(payload.matron);
          setFromCache(true);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // ignore parse errors
    }

    // 2. Fallback：从 API 加载（需要等 store 数据准备好）
    if (storeLoading) return;

    const loadFallback = async () => {
      const orderFromStore = orders.find((o) => o.id === orderId) || null;
      if (orderFromStore) {
        setOrder(orderFromStore);
      }
      const res = await contractApi.getByOrder(orderId);
      const c = res.data ?? null;
      setContract(c);
      if (orderFromStore && c) {
        const mid = c.matronId ?? orderFromStore.selectedMatronId;
        const m = matrons.find((x) => x.id === mid) || null;
        setMatron(m);
      } else if (orderFromStore) {
        const mid = orderFromStore.selectedMatronId;
        if (mid) {
          const m = matrons.find((x) => x.id === mid) || null;
          setMatron(m);
        }
      }
      setLoading(false);
    };
    loadFallback();
  }, [orderId, storeLoading, orders, matrons]);

  // 3. 只有所有数据就绪后才触发打印
  useEffect(() => {
    if (loading || !contract || !order || !matron) return;
    if (hasPrinted.current) return;
    hasPrinted.current = true;
    // 给浏览器一点时间确保 DOM 完全渲染
    const timer = setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        // ignore print errors
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [loading, contract, order, matron]);

  // 清理：窗口关闭前清除缓存
  useEffect(() => {
    const cleanup = () => {
      if (orderId) {
        try { sessionStorage.removeItem(`contract_print_${orderId}`); } catch (e) { /* ignore */ }
      }
    };
    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, [orderId]);

  const handleManualPrint = () => {
    hasPrinted.current = false;
    try {
      window.print();
    } catch (e) { /* ignore */ }
  };

  const dataReady = !loading && contract && order && matron;

  if (loading) {
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <Typography color="text.secondary">正在准备打印数据…</Typography>
      </Box>
    );
  }

  if (!dataReady) {
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>数据加载失败</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          无法获取合同数据，请返回合同详情页重新点击"打印合同"
        </Typography>
        <Button variant="contained" onClick={() => window.close()}>关闭窗口</Button>
      </Box>
    );
  }

  const finalAmount = contract.amount - contract.deposit;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        '@media print': {
          bgcolor: 'white',
          py: 0,
        },
      }}
    >
      {/* 打印操作栏（仅屏幕显示） */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          '@media print': { display: 'none' },
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {fromCache ? '数据来源：实时快照' : '数据来源：后台加载'} · 预览为 A4 纸比例
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<PrintRoundedIcon />}
          onClick={handleManualPrint}
        >
          打印 / 重新打印
        </Button>
      </Box>

      {/* A4 纸张 */}
      <Box
        sx={{
          width: `${A4_WIDTH}px`,
          minHeight: `${A4_HEIGHT}px`,
          bgcolor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          p: '80px 70px',
          boxSizing: 'border-box',
          position: 'relative',
          '@media print': {
            boxShadow: 'none',
            width: 'auto',
            minHeight: 'auto',
            p: 0,
            margin: 0,
          },
        }}
      >
        {/* 标题 */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: '#000',
              letterSpacing: '4px',
              mb: 1.5,
            }}
          >
            月嫂护理服务合同
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            合同编号：{contract.id}
          </Typography>
        </Box>

        <Divider sx={{ mb: 4, borderColor: '#333' }} />

        {/* 甲方乙方 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#000', mb: 2 }}>
            合同双方
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
                甲方（客户）
              </Typography>
              <Typography variant="body1" sx={{ color: '#000', mb: 0.5 }}>
                姓名：{order.customer.name}
              </Typography>
              <Typography variant="body1" sx={{ color: '#000', mb: 0.5 }}>
                联系电话：{order.customer.phone}
              </Typography>
              <Typography variant="body1" sx={{ color: '#000' }}>
                预产期：{formatDate(order.customer.expectedDeliveryDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
                乙方（月嫂）
              </Typography>
              <Typography variant="body1" sx={{ color: '#000', mb: 0.5 }}>
                姓名：{matron.name}
              </Typography>
              <Typography variant="body1" sx={{ color: '#000', mb: 0.5 }}>
                年龄：{matron.age}岁
              </Typography>
              <Typography variant="body1" sx={{ color: '#000' }}>
                籍贯：{matron.hometown}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 4, borderColor: '#ddd' }} />

        {/* 第一条 服务内容与期间 */}
        <Box sx={{ mb: 3.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#000', mb: 1.5 }}>
            第一条　服务内容与期限
          </Typography>
          <Typography variant="body1" sx={{ color: '#000', lineHeight: 2, textIndent: '2em' }}>
            乙方为甲方提供专业母婴护理服务，服务天数共计 {order.serviceDays} 天。
            服务期限自 {formatDateZh(order.startDate)} 起至 {formatDateZh(order.endDate)} 止。
            服务期间，乙方应按照行业规范和双方约定，为甲方及新生儿提供专业、细致的护理服务。
          </Typography>
        </Box>

        {/* 第二条 服务费用 */}
        <Box sx={{ mb: 3.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#000', mb: 1.5 }}>
            第二条　服务费用与支付方式
          </Typography>
          <Typography variant="body1" sx={{ color: '#000', lineHeight: 2, textIndent: '2em' }}>
            经双方协商一致，本合同服务费用明细如下：
          </Typography>
          <Box
            sx={{
              my: 2,
              mx: 'auto',
              width: '80%',
              border: '1px solid #333',
              borderCollapse: 'collapse',
            }}
          >
            <Box sx={{ display: 'flex', borderBottom: '1px solid #333' }}>
              <Box sx={{ flex: 1, p: 1.5, textAlign: 'center', borderRight: '1px solid #333', fontWeight: 600 }}>
                费用项目
              </Box>
              <Box sx={{ flex: 1, p: 1.5, textAlign: 'center', fontWeight: 600 }}>
                金额（元）
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #333' }}>
              <Box sx={{ flex: 1, p: 1.5, textAlign: 'center', borderRight: '1px solid #333' }}>
                合同总金额
              </Box>
              <Box sx={{ flex: 1, p: 1.5, textAlign: 'center', fontWeight: 600 }}>
                {formatMoney(contract.amount)}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #333' }}>
              <Box sx={{ flex: 1, p: 1.5, textAlign: 'center', borderRight: '1px solid #333' }}>
                定金（30%）
              </Box>
              <Box sx={{ flex: 1, p: 1.5, textAlign: 'center' }}>
                {formatMoney(contract.deposit)}
              </Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Box sx={{ flex: 1, p: 1.5, textAlign: 'center', borderRight: '1px solid #333' }}>
                尾款
              </Box>
              <Box sx={{ flex: 1, p: 1.5, textAlign: 'center' }}>
                {formatMoney(finalAmount)}
              </Box>
            </Box>
          </Box>
          <Typography variant="body1" sx={{ color: '#000', lineHeight: 2, textIndent: '2em' }}>
            支付方式：甲方应在本合同签署后支付定金 {formatMoney(contract.deposit)}，
            服务结束当日支付尾款 {formatMoney(finalAmount)}。
          </Typography>
        </Box>

        {/* 第三条 */}
        <Box sx={{ mb: 3.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#000', mb: 1.5 }}>
            第三条　档期锁定
          </Typography>
          <Typography variant="body1" sx={{ color: '#000', lineHeight: 2, textIndent: '2em' }}>
            本合同签署后，乙方在本合同约定服务期内的档期即被锁定，乙方不得承接其他与本合同服务期相冲突的订单。
            如因甲方原因需调整服务日期，应提前七日通知乙方并经双方协商一致。
          </Typography>
        </Box>

        {/* 第四条 */}
        <Box sx={{ mb: 3.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#000', mb: 1.5 }}>
            第四条　双方权利与义务
          </Typography>
          <Typography variant="body1" sx={{ color: '#000', lineHeight: 2, textIndent: '2em' }}>
            （一）乙方应按照行业规范及本合同约定，为甲方提供专业、优质的母婴护理服务，严格遵守服务时间及服务内容。
          </Typography>
          <Typography variant="body1" sx={{ color: '#000', lineHeight: 2, textIndent: '2em' }}>
            （二）甲方应按时足额支付服务费用，并为乙方提供必要的工作条件和食宿安排。
          </Typography>
          <Typography variant="body1" sx={{ color: '#000', lineHeight: 2, textIndent: '2em' }}>
            （三）服务期间，双方应本着友好协商的原则处理各类问题，确保服务顺利进行。
          </Typography>
        </Box>

        {/* 第五条 */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#000', mb: 1.5 }}>
            第五条　合同生效与其他
          </Typography>
          <Typography variant="body1" sx={{ color: '#000', lineHeight: 2, textIndent: '2em' }}>
            本合同自双方签署之日起生效。本合同一式两份，甲乙双方各执一份，具有同等法律效力。
            未尽事宜，由双方友好协商解决。
          </Typography>
        </Box>

        <Divider sx={{ mb: 5, borderColor: '#333' }} />

        {/* 签署区 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
          <Box sx={{ width: 200 }}>
            <Typography variant="body2" sx={{ color: '#333', mb: 1 }}>甲方（签字/盖章）</Typography>
            <Box sx={{ width: '100%', height: 60, borderBottom: '1px solid #000', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#333' }}>
              签署日期：{contract.signedAt ? formatDate(contract.signedAt) : '________年____月____日'}
            </Typography>
          </Box>
          <Box sx={{ width: 200 }}>
            <Typography variant="body2" sx={{ color: '#333', mb: 1 }}>乙方（签字/盖章）</Typography>
            <Box sx={{ width: '100%', height: 60, borderBottom: '1px solid #000', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#333' }}>
              签署日期：{contract.signedAt ? formatDate(contract.signedAt) : '________年____月____日'}
            </Typography>
          </Box>
        </Box>

        {/* 页码（仅打印时显示） */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '30px',
            right: '70px',
            fontSize: '12px',
            color: '#666',
            display: 'none',
            '@media print': { display: 'block' },
          }}
        >
          第 1 页 / 共 1 页
        </Box>
      </Box>
    </Box>
  );
}
