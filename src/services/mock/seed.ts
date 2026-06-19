import { addDays, format, subDays } from 'date-fns';
import type {
  Checkin,
  Contract,
  Interview,
  Matron,
  Order,
  Payment,
  Review,
  Schedule,
} from '@/types';
import { PRICE_PER_DAY } from '@/constants/meta';

const today = new Date();
const iso = (d: Date) => format(d, 'yyyy-MM-dd');
const isoTime = (d: Date) => d.toISOString();

// 评价工厂
function mkReview(
  id: string,
  matronId: string,
  orderId: string,
  reviewerType: 'customer' | 'matron',
  rating: number,
  comment: string,
  daysAgo: number,
): Review {
  return { id, matronId, orderId, reviewerType, rating, comment, createdAt: iso(subDays(today, daysAgo)) };
}

// 月嫂档案（种子不带 averageRating，由 createSeedData 计算注入）
const matrons: Omit<Matron, 'averageRating'>[] = [
  {
    id: 'm_001',
    name: '王秀英',
    age: 42,
    hometown: '江苏苏州',
    experienceYears: 12,
    phone: '13862103377',
    avatar: '',
    certificates: ['senior_maternal_care', 'lactation', 'nutritionist'],
    schedules: [],
    reviews: [
      mkReview('r_001', 'm_001', 'o_005', 'customer', 5, '王姐特别细心，通乳手法专业，月子餐搭配营养又好吃，强烈推荐！', 12),
      mkReview('r_002', 'm_001', 'o_012', 'customer', 5, '夜间带睡让我睡了好觉，恢复得很快，非常感谢。', 60),
      mkReview('r_003', 'm_001', 'o_021', 'customer', 4, '整体满意，偶尔家务可以再细致些。', 130),
    ],
    status: 'busy',
    createdAt: iso(subDays(today, 400)),
  },
  {
    id: 'm_002',
    name: '李桂芳',
    age: 38,
    hometown: '四川成都',
    experienceYears: 9,
    phone: '13901562288',
    avatar: '',
    certificates: ['senior_maternal_care', 'pediatric_tuina'],
    schedules: [],
    reviews: [
      mkReview('r_004', 'm_002', 'o_008', 'customer', 4, '小儿推拿很专业，宝宝胀气缓解明显。', 30),
      mkReview('r_005', 'm_002', 'o_015', 'customer', 5, '性格开朗，相处愉快。', 90),
    ],
    status: 'available',
    createdAt: iso(subDays(today, 350)),
  },
  {
    id: 'm_003',
    name: '张玉梅',
    age: 45,
    hometown: '山东青岛',
    experienceYears: 15,
    phone: '13705326699',
    avatar: '',
    certificates: ['senior_maternal_care', 'lactation', 'nutritionist', 'pediatric_tuina'],
    schedules: [],
    reviews: [
      mkReview('r_006', 'm_003', 'o_003', 'customer', 5, '金牌月嫂实至名归，四证齐全，什么都懂，无可挑剔。', 8),
      mkReview('r_007', 'm_003', 'o_009', 'customer', 5, '专业又贴心，家人都很放心。', 45),
      mkReview('r_008', 'm_003', 'o_017', 'customer', 5, '第二次请张姐了，依然完美。', 100),
      mkReview('r_009', 'm_003', 'o_024', 'customer', 4, '非常专业，价格略高但值得。', 160),
    ],
    status: 'available',
    createdAt: iso(subDays(today, 500)),
  },
  {
    id: 'm_004',
    name: '陈素芬',
    age: 36,
    hometown: '湖南长沙',
    experienceYears: 7,
    phone: '13607314455',
    avatar: '',
    certificates: ['lactation', 'nutritionist'],
    schedules: [],
    reviews: [
      mkReview('r_010', 'm_004', 'o_011', 'customer', 4, '通乳和月子餐都做得好，很细心。', 25),
      mkReview('r_011', 'm_004', 'o_019', 'customer', 4, '营养搭配合理，恢复不错。', 80),
    ],
    status: 'available',
    createdAt: iso(subDays(today, 280)),
  },
  {
    id: 'm_005',
    name: '赵月兰',
    age: 41,
    hometown: '安徽合肥',
    experienceYears: 11,
    phone: '13855119988',
    avatar: '',
    certificates: ['senior_maternal_care', 'pediatric_tuina'],
    schedules: [],
    reviews: [
      mkReview('r_012', 'm_005', 'o_006', 'customer', 5, '带娃经验丰富，宝宝很黏她。', 18),
      mkReview('r_013', 'm_005', 'o_014', 'customer', 3, '基本满意，沟通需再主动些。', 70),
    ],
    status: 'available',
    createdAt: iso(subDays(today, 330)),
  },
  {
    id: 'm_006',
    name: '刘凤霞',
    age: 39,
    hometown: '浙江杭州',
    experienceYears: 8,
    phone: '13957126633',
    avatar: '',
    certificates: ['senior_maternal_care'],
    schedules: [],
    reviews: [
      mkReview('r_014', 'm_006', 'o_007', 'customer', 4, '踏实肯干，夜间带睡很辛苦但做得好。', 22),
      mkReview('r_015', 'm_006', 'o_016', 'customer', 4, '人很实在，家务也帮忙做了。', 65),
    ],
    status: 'available',
    createdAt: iso(subDays(today, 260)),
  },
  {
    id: 'm_007',
    name: '周美玲',
    age: 33,
    hometown: '河南郑州',
    experienceYears: 5,
    phone: '13703718866',
    avatar: '',
    certificates: ['nutritionist', 'pediatric_tuina'],
    schedules: [],
    reviews: [
      mkReview('r_016', 'm_007', 'o_010', 'customer', 4, '年轻有活力，营养餐花样多。', 20),
      mkReview('r_017', 'm_007', 'o_018', 'customer', 3, '经验稍浅，但态度很好。', 50),
    ],
    status: 'available',
    createdAt: iso(subDays(today, 200)),
  },
  {
    id: 'm_008',
    name: '孙翠萍',
    age: 44,
    hometown: '江西南昌',
    experienceYears: 13,
    phone: '13879125544',
    avatar: '',
    certificates: ['senior_maternal_care', 'lactation'],
    schedules: [],
    reviews: [
      mkReview('r_018', 'm_008', 'o_002', 'customer', 5, '催乳手法一绝，很快就通乳了。', 15),
      mkReview('r_019', 'm_008', 'o_013', 'customer', 5, '老练专业，家人都夸。', 75),
      mkReview('r_020', 'm_008', 'o_022', 'customer', 4, '不错，推荐。', 120),
    ],
    status: 'available',
    createdAt: iso(subDays(today, 420)),
  },
  {
    id: 'm_009',
    name: '吴金花',
    age: 37,
    hometown: '福建福州',
    experienceYears: 6,
    phone: '13959186677',
    avatar: '',
    certificates: ['senior_maternal_care', 'nutritionist', 'pediatric_tuina'],
    schedules: [],
    reviews: [
      mkReview('r_021', 'm_009', 'o_004', 'customer', 4, '月子餐和推拿都做得不错。', 28),
      mkReview('r_022', 'm_009', 'o_020', 'customer', 5, '细心温柔，宝宝照顾得很好。', 55),
    ],
    status: 'available',
    createdAt: iso(subDays(today, 240)),
  },
];

// 订单
const orders: Order[] = [
  // 进行中：已开始6天，26天服务
  {
    id: 'o_001',
    customer: { id: 'c_001', name: '林晓云', phone: '13800001111', expectedDeliveryDate: iso(subDays(today, 6)) },
    serviceDays: 26,
    startDate: iso(subDays(today, 6)),
    endDate: iso(addDays(today, 19)),
    requirement: { lactation: true, confinementMeal: true, nightCare: true, housework: false },
    status: 'in_service',
    matchedMatronIds: ['m_001'],
    selectedMatronId: 'm_001',
    createdAt: iso(subDays(today, 30)),
  },
  // 待匹配：20天后开始，42天
  {
    id: 'o_002',
    customer: { id: 'c_002', name: '陈婷', phone: '13800002222', expectedDeliveryDate: iso(addDays(today, 18)) },
    serviceDays: 42,
    startDate: iso(addDays(today, 20)),
    endDate: iso(addDays(today, 61)),
    requirement: { lactation: true, confinementMeal: true, nightCare: false, housework: true },
    status: 'matching',
    matchedMatronIds: [],
    createdAt: iso(subDays(today, 2)),
  },
  // 已完成：结束10天前，52天
  {
    id: 'o_003',
    customer: { id: 'c_003', name: '赵敏', phone: '13800003333', expectedDeliveryDate: iso(subDays(today, 70)) },
    serviceDays: 52,
    startDate: iso(subDays(today, 72)),
    endDate: iso(subDays(today, 21)),
    requirement: { lactation: true, confinementMeal: true, nightCare: true, housework: false },
    status: 'completed',
    matchedMatronIds: ['m_003'],
    selectedMatronId: 'm_003',
    createdAt: iso(subDays(today, 100)),
  },
  // 待签约：12天后开始，26天，已选定张玉梅
  {
    id: 'o_004',
    customer: { id: 'c_004', name: '黄丽', phone: '13800004444', expectedDeliveryDate: iso(addDays(today, 10)) },
    serviceDays: 26,
    startDate: iso(addDays(today, 12)),
    endDate: iso(addDays(today, 37)),
    requirement: { lactation: false, confinementMeal: true, nightCare: true, housework: false },
    status: 'matched',
    matchedMatronIds: ['m_003', 'm_001', 'm_009'],
    selectedMatronId: 'm_003',
    createdAt: iso(subDays(today, 5)),
  },
  // 已签约待服务：5天后开始，78天
  {
    id: 'o_005',
    customer: { id: 'c_005', name: '刘芳', phone: '13800005555', expectedDeliveryDate: iso(addDays(today, 3)) },
    serviceDays: 78,
    startDate: iso(addDays(today, 5)),
    endDate: iso(addDays(today, 82)),
    requirement: { lactation: true, confinementMeal: true, nightCare: true, housework: true },
    status: 'contracted',
    matchedMatronIds: ['m_001', 'm_003', 'm_008'],
    selectedMatronId: 'm_001',
    createdAt: iso(subDays(today, 8)),
  },
  // 赵敏的第二笔订单（同一手机号，测试客户去重）
  {
    id: 'o_006',
    customer: { id: 'c_006', name: '赵敏', phone: '13800003333', expectedDeliveryDate: iso(addDays(today, 60)) },
    serviceDays: 42,
    startDate: iso(addDays(today, 65)),
    endDate: iso(addDays(today, 106)),
    requirement: { lactation: true, confinementMeal: true, nightCare: true, housework: false },
    status: 'matching',
    matchedMatronIds: [],
    createdAt: iso(subDays(today, 1)),
  },
];

// 为月嫂补充档期（关联订单）
function attachSchedule(matronId: string, orderId: string, start: string, end: string) {
  const m = matrons.find((x) => x.id === matronId);
  if (m) m.schedules.push({ orderId, startDate: start, endDate: end } as Schedule);
}
attachSchedule('m_001', 'o_001', orders[0].startDate, orders[0].endDate); // 服务中
attachSchedule('m_001', 'o_005', orders[4].startDate, orders[4].endDate); // 已签约
attachSchedule('m_003', 'o_003', orders[2].startDate, orders[2].endDate); // 已完成
attachSchedule('m_003', 'o_004', orders[3].startDate, orders[3].endDate); // 待签约

// 合同
const contracts: Contract[] = [
  {
    id: 'ct_001',
    orderId: 'o_001',
    matronId: 'm_001',
    amount: 26 * PRICE_PER_DAY,
    deposit: Math.round(26 * PRICE_PER_DAY * 0.3),
    status: 'deposit_paid',
    signedAt: isoTime(subDays(today, 31)),
    depositPaidAt: isoTime(subDays(today, 30)),
    createdAt: isoTime(subDays(today, 32)),
  },
  {
    id: 'ct_002',
    orderId: 'o_003',
    matronId: 'm_003',
    amount: 52 * PRICE_PER_DAY,
    deposit: Math.round(52 * PRICE_PER_DAY * 0.3),
    status: 'final_settled',
    signedAt: isoTime(subDays(today, 73)),
    depositPaidAt: isoTime(subDays(today, 72)),
    settledAt: isoTime(subDays(today, 20)),
    createdAt: isoTime(subDays(today, 74)),
  },
  {
    id: 'ct_003',
    orderId: 'o_004',
    matronId: 'm_003',
    amount: 26 * PRICE_PER_DAY,
    deposit: Math.round(26 * PRICE_PER_DAY * 0.3),
    status: 'draft',
    createdAt: isoTime(subDays(today, 5)),
  },
  {
    id: 'ct_004',
    orderId: 'o_005',
    matronId: 'm_001',
    amount: 78 * PRICE_PER_DAY,
    deposit: Math.round(78 * PRICE_PER_DAY * 0.3),
    status: 'deposit_paid',
    signedAt: isoTime(subDays(today, 8)),
    depositPaidAt: isoTime(subDays(today, 7)),
    createdAt: isoTime(subDays(today, 9)),
  },
];

// 支付记录
const payments: Payment[] = [
  { id: 'p_001', contractId: 'ct_001', type: 'deposit', amount: contracts[0].deposit, method: 'wechat', status: 'paid', paidAt: isoTime(subDays(today, 30)) },
  { id: 'p_002', contractId: 'ct_002', type: 'deposit', amount: contracts[1].deposit, method: 'alipay', status: 'paid', paidAt: isoTime(subDays(today, 72)) },
  { id: 'p_003', contractId: 'ct_002', type: 'final', amount: contracts[1].amount - contracts[1].deposit, method: 'bank', status: 'paid', paidAt: isoTime(subDays(today, 20)) },
  { id: 'p_004', contractId: 'ct_004', type: 'deposit', amount: contracts[3].deposit, method: 'wechat', status: 'paid', paidAt: isoTime(subDays(today, 7)) },
];

// 面试预约
const interviews: Interview[] = [
  { id: 'iv_001', orderId: 'o_004', matronId: 'm_003', scheduledAt: isoTime(addDays(today, 1)), status: 'pending', note: '客户希望了解夜间带睡经验' },
  { id: 'iv_002', orderId: 'o_005', matronId: 'm_001', scheduledAt: isoTime(subDays(today, 6)), status: 'done' },
];

// 打卡记录（进行中订单 o_001，过去6天）
const checkins: Checkin[] = [];
for (let i = 6; i >= 1; i--) {
  const d = subDays(today, i);
  checkins.push({
    id: `ck_${i}`,
    orderId: 'o_001',
    matronId: 'm_001',
    date: iso(d),
    matronTime: '07:35:00',
    adminConfirmedAt: i > 0 ? isoTime(d) : undefined,
    note: i === 3 ? '宝宝夜间偶有哭闹，已安抚' : undefined,
  });
}

export interface SeedData {
  matrons: Matron[];
  orders: Order[];
  contracts: Contract[];
  payments: Payment[];
  interviews: Interview[];
  checkins: Checkin[];
}

export function createSeedData(): SeedData {
  // 深拷贝以免外部修改污染种子
  const data: SeedData = JSON.parse(
    JSON.stringify({ matrons, orders, contracts, payments, interviews, checkins }),
  );
  // 自动计算客户评价均分（仅统计客户评价，避免双向互评污染）
  data.matrons.forEach((m) => {
    const customerReviews = m.reviews.filter((r) => r.reviewerType === 'customer');
    m.averageRating = customerReviews.length
      ? Math.round((customerReviews.reduce((a, r) => a + r.rating, 0) / customerReviews.length) * 10) / 10
      : 0;
  });
  return data;
}
