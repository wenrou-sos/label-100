import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Divider } from '@mui/material';
import { useAppStore } from '@/context/AppStoreContext';
import { contractApi } from '@/services/api';
import { formatMoney, formatDate, formatDateZh } from '@/utils/format';
import type { Contract } from '@/types';

const A4_WIDTH = 794; // px (96dpi)
const A4_HEIGHT = 1123; // px (96dpi)

export default function ContractPrint() {
  const { orderId } = useParams();
  const { orders, matrons } = useAppStore();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  const order = orders.find((o) => o.id === orderId);
  const matron = matrons.find((m) => m.id === (contract?.matronId ?? order?.selectedMatronId));

  useEffect(() => {
    const load = async () => {
      if (!orderId) return;
      const res = await contractApi.getByOrder(orderId);
      setContract(res.data ?? null);
      setLoading(false);
    };
    load();
  }, [orderId]);

  useEffect(() => {
    if (loading || !contract) return;
    const timer = setTimeout(() => {
      window.print();
    }, 300);
    return () => clearTimeout(timer);
  }, [loading, contract]);

  if (loading || !contract || !order || !matron) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>加载中...</Typography>
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
      {/* 打印提示（仅屏幕显示） */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          gap: 2,
          '@media print': { display: 'none' },
        }}
      >
        <Typography variant="caption" color="text.secondary">
          预览为 A4 纸比例 · 按 Ctrl+P 或 Cmd+P 可重新打印
        </Typography>
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
