import type {
  Certificate,
  ContractStatus,
  OrderStatus,
  PaymentMethod,
  ServiceDays,
  ServiceRequirement,
} from '@/types';
import {
  ChildCare,
  LocalDining,
  Nightlight,
  Spa,
  VolunteerActivism,
} from '@mui/icons-material';
import type { SxProps } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

// 证书元数据
export const CERTIFICATE_META: Record<
  Certificate,
  { label: string; short: string; color: string; bg: string; icon: typeof Spa }
> = {
  senior_maternal_care: {
    label: '高级母婴护理师证',
    short: '母婴护理',
    color: '#1F4E3D',
    bg: '#E3EDE8',
    icon: Spa,
  },
  lactation: {
    label: '催乳师证',
    short: '催乳',
    color: '#C8553D',
    bg: '#F6E4DF',
    icon: VolunteerActivism,
  },
  nutritionist: {
    label: '营养师证',
    short: '营养',
    color: '#4A7A8C',
    bg: '#E1EBEF',
    icon: LocalDining,
  },
  pediatric_tuina: {
    label: '小儿推拿证',
    short: '小儿推拿',
    color: '#7B5EA7',
    bg: '#ECE6F3',
    icon: ChildCare,
  },
};

export const CERTIFICATE_LIST: Certificate[] = [
  'senior_maternal_care',
  'lactation',
  'nutritionist',
  'pediatric_tuina',
];

// 订单状态元数据
export const ORDER_STATUS_META: Record<OrderStatus, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' }> = {
  matching: { label: '待匹配', color: 'warning' },
  matched: { label: '待签约', color: 'info' },
  contracted: { label: '已签约', color: 'primary' },
  in_service: { label: '服务中', color: 'success' },
  completed: { label: '已完成', color: 'default' },
};

// 合同状态元数据
export const CONTRACT_STATUS_META: Record<ContractStatus, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' }> = {
  draft: { label: '待签署', color: 'warning' },
  signed: { label: '已签署·待付定金', color: 'info' },
  deposit_paid: { label: '已付定金·服务中', color: 'primary' },
  final_settled: { label: '已结算', color: 'success' },
};

// 月嫂状态
export const MATRON_STATUS_META: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' }> = {
  available: { label: '在岗可派', color: 'success' },
  busy: { label: '服务中', color: 'warning' },
  off: { label: '休假', color: 'default' },
};

// 支付方式
export const PAYMENT_METHOD_META: Record<PaymentMethod, { label: string; icon: string }> = {
  wechat: { label: '微信支付', icon: '💚' },
  alipay: { label: '支付宝', icon: '🔵' },
  bank: { label: '银行转账', icon: '🏦' },
  cash: { label: '现金', icon: '💵' },
};

// 服务天数选项
export const SERVICE_DAYS_OPTIONS: { value: ServiceDays; label: string; desc: string }[] = [
  { value: 26, label: '26天', desc: '标准月子·经济之选' },
  { value: 42, label: '42天', desc: '科学双月·恢复更佳' },
  { value: 52, label: '52天', desc: '黄金周期·深度调理' },
  { value: 78, label: '78天', desc: '百日安护·尊享套餐' },
];

// 需求勾选项元数据
export const REQUIREMENT_META: Record<
  keyof ServiceRequirement,
  { label: string; desc: string; icon: typeof Nightlight }
> = {
  lactation: { label: '是否需通乳', desc: '需要催乳师专项技能', icon: VolunteerActivism },
  confinementMeal: { label: '月子餐制作', desc: '需营养师配餐烹饪', icon: LocalDining },
  nightCare: { label: '夜间带睡', desc: '夜间照料新生儿', icon: Nightlight },
  housework: { label: '家务兼做', desc: '兼顾日常家务', icon: Spa },
};

// 需求项 → 所需证书 映射（用于匹配算法）
export const REQUIREMENT_CERT_MAP: Partial<Record<keyof ServiceRequirement, Certificate[]>> = {
  lactation: ['lactation'],
  confinementMeal: ['nutritionist'],
  nightCare: ['senior_maternal_care'],
  housework: ['senior_maternal_care'],
};

// 服务天数单价（元/天）用于估算合同金额
export const PRICE_PER_DAY = 480;

// 卡片公共阴影 sx
export const softCardSx: SxProps<Theme> = {
  border: '1px solid #EAE3D7',
  boxShadow: '0 2px 8px rgba(26,43,37,0.04)',
};
