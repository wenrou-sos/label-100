import { useMemo } from 'react';
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
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import { useAppStore } from '@/context/AppStoreContext';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { RatingStars } from '@/components/common/RatingStars';
import { MatronAvatar } from '@/components/common/MatronAvatar';
import { ORDER_STATUS_META } from '@/constants/meta';
import { formatDate, formatDateZh, maskPhone } from '@/utils/format';
import type { Review } from '@/types';

interface CustomerReview extends Review {
  matronName: string;
}

export default function CustomerDetail() {
  const { id } = useParams();
  const { orders, matrons } = useAppStore();
  const navigate = useNavigate();

  const customerOrders = useMemo(() => {
    if (!id) return [];
    return orders
      .filter((o) => o.customer.id === id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, id]);

  const customer = customerOrders[0]?.customer;

  const customerReviews = useMemo(() => {
    if (!id) return [] as CustomerReview[];
    const orderIds = new Set(customerOrders.map((o) => o.id));
    const reviews: CustomerReview[] = [];
    for (const matron of matrons) {
      for (const review of matron.reviews) {
        if (orderIds.has(review.orderId) && review.reviewerType === 'customer') {
          reviews.push({ ...review, matronName: matron.name });
        }
      }
    }
    return reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [customerOrders, matrons, id]);

  const getMatron = (matronId: string) => {
    return matrons.find((m) => m.id === matronId);
  };

  if (!customer) {
    return (
      <Card>
        <EmptyState title="客户不存在" subtitle="可能已被删除或链接有误" actionLabel="返回列表" onAction={() => navigate('/customers')} />
      </Card>
    );
  }

  const infoRows = [
    { label: '客户姓名', value: customer.name },
    { label: '联系电话', value: maskPhone(customer.phone) },
    { label: '预产期', value: formatDate(customer.expectedDeliveryDate) },
    { label: '客户编号', value: customer.id },
    { label: '历史订单', value: `${customerOrders.length} 笔` },
    { label: '首次下单', value: formatDate(customerOrders[customerOrders.length - 1]?.createdAt) },
  ];

  return (
    <Box>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/customers')} sx={{ mb: 1.5, color: 'text.secondary' }}>
        返回客户列表
      </Button>
      <PageHeader
        title={customer.name}
        subtitle={`共 ${customerOrders.length} 笔历史订单`}
        icon={<PeopleOutlineRoundedIcon />}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' }, gap: 2.5 }}>
        {/* 左列 */}
        <Stack spacing={2.5}>
          {/* 基本信息 */}
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <EventRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="h4">基本信息</Typography>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, gap: 1.8 }}>
                {infoRows.map((r) => (
                  <Box key={r.label}>
                    <Typography variant="caption" color="text.secondary">{r.label}</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{r.value}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* 历史订单 */}
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <AssignmentRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="h4">历史订单</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>共 {customerOrders.length} 笔</Typography>
              </Stack>
              {customerOrders.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>暂无订单记录</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {customerOrders.map((order) => {
                    const matron = order.selectedMatronId ? getMatron(order.selectedMatronId) : null;
                    return (
                      <Card
                        key={order.id}
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#FAF7F2' },
                          border: '1px solid #EFE9DD',
                        }}
                        onClick={() => navigate(`/service/${order.id}`)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{order.id}</Typography>
                                <Chip
                                  label={ORDER_STATUS_META[order.status].label}
                                  size="small"
                                  color={ORDER_STATUS_META[order.status].color}
                                />
                              </Stack>
                              <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDateZh(order.startDate)} ~ {formatDateZh(order.endDate)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  服务 {order.serviceDays} 天
                                </Typography>
                              </Stack>
                            </Box>
                            <Divider orientation="vertical" flexItem />
                            <Box sx={{ width: 140 }}>
                              <Typography variant="caption" color="text.secondary">服务月嫂</Typography>
                              {matron ? (
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.3 }}>
                                  <MatronAvatar name={matron.name} size={28} />
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{matron.name}</Typography>
                                </Stack>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>待匹配</Typography>
                              )}
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>

        {/* 右列：评价记录 */}
        <Stack spacing={2.5}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <RateReviewRoundedIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                <Typography variant="h4">评价记录</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>共 {customerReviews.length} 条</Typography>
              </Stack>
              {customerReviews.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>暂无评价记录</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {customerReviews.map((r) => (
                    <Box key={r.id} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#FAF7F2' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Stack direction="row" alignItems="center" spacing={0.8}>
                          <MatronAvatar name={r.matronName || '月嫂'} size={24} />
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>{r.matronName || '未知月嫂'}</Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">{formatDate(r.createdAt)}</Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.8 }}>
                        <RatingStars value={r.rating} showValue={false} size="small" />
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{r.orderId}</Typography>
                      </Stack>
                      <Typography variant="body2">{r.comment}</Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}
