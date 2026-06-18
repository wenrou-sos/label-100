// 月嫂中介管理面板 数据模型定义

// 证书类型
export type Certificate =
  | 'senior_maternal_care' // 高级母婴护理师证
  | 'lactation' // 催乳师证
  | 'nutritionist' // 营养师证
  | 'pediatric_tuina'; // 小儿推拿证

// 月嫂在档状态
export type MatronStatus = 'available' | 'busy' | 'off';

// 已占用档期
export interface Schedule {
  orderId: string;
  startDate: string; // ISO yyyy-MM-dd
  endDate: string;
}

// 客户评价
export interface Review {
  id: string;
  matronId: string;
  orderId: string;
  reviewerType: 'customer' | 'matron';
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

// 月嫂档案
export interface Matron {
  id: string;
  name: string;
  age: number;
  hometown: string; // 籍贯
  experienceYears: number; // 从业年限
  phone: string;
  avatar: string;
  certificates: Certificate[];
  schedules: Schedule[];
  reviews: Review[];
  averageRating: number; // 客户评价均分（自动计算）
  status: MatronStatus;
  createdAt: string;
}

// 客户
export interface Customer {
  id: string;
  name: string;
  phone: string;
  expectedDeliveryDate: string; // 预产期
}

// 服务天数
export type ServiceDays = 26 | 42 | 52 | 78;

// 服务需求勾选项
export interface ServiceRequirement {
  lactation: boolean; // 是否需通乳
  confinementMeal: boolean; // 月子餐制作
  nightCare: boolean; // 夜间带睡
  housework: boolean; // 家务兼做
}

// 订单状态
export type OrderStatus =
  | 'matching' // 待匹配
  | 'matched' // 已匹配待签约
  | 'contracted' // 已签约
  | 'in_service' // 服务中
  | 'completed'; // 已完成

// 订单
export interface Order {
  id: string;
  customer: Customer;
  serviceDays: ServiceDays;
  startDate: string;
  endDate: string;
  requirement: ServiceRequirement;
  status: OrderStatus;
  matchedMatronIds: string[]; // 匹配算法给出的候选人
  selectedMatronId?: string; // 最终选定
  createdAt: string;
}

// 合同状态
export type ContractStatus =
  | 'draft' // 待签署
  | 'signed' // 已签署待付定金
  | 'deposit_paid' // 已付定金待服务
  | 'final_settled'; // 已尾款结算

// 合同
export interface Contract {
  id: string;
  orderId: string;
  matronId: string;
  amount: number; // 合同总金额（元）
  deposit: number; // 定金
  status: ContractStatus;
  signedAt?: string;
  depositPaidAt?: string;
  settledAt?: string;
  createdAt: string;
}

// 支付方式
export type PaymentMethod = 'wechat' | 'alipay' | 'bank' | 'cash';

// 支付记录
export interface Payment {
  id: string;
  contractId: string;
  type: 'deposit' | 'final';
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'paid';
  paidAt?: string;
}

// 视频面试预约
export interface Interview {
  id: string;
  orderId: string;
  matronId: string;
  scheduledAt: string; // ISO datetime
  status: 'pending' | 'done' | 'cancelled';
  note?: string;
}

// 每日打卡
export interface Checkin {
  id: string;
  orderId: string;
  matronId: string;
  date: string; // yyyy-MM-dd
  matronTime?: string; // 月嫂签到时间 HH:mm:ss
  adminConfirmedAt?: string; // 管理确认时间 ISO
  note?: string;
}

// 服务记录（聚合订单服务期打卡）
export interface ServiceRecord {
  orderId: string;
  matronId: string;
  startDate: string;
  endDate: string;
  checkins: Checkin[];
  customerReviewId?: string;
  matronReviewId?: string;
}

// 匹配算法输出：候选人匹配明细
export interface MatchCandidate {
  matron: Matron;
  available: boolean; // 档期是否可用
  requiredCerts: Certificate[]; // 该需求所需证书集合
  matchedCerts: Certificate[]; // 月嫂命中的证书
  matchScore: number; // 0-100 匹配度
  averageRating: number;
}

// 统一 Mock 响应
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}
