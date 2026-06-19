import type { SvgIconComponent } from '@mui/icons-material';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import Diversity3Outlined from '@mui/icons-material/Diversity3Outlined';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import FingerprintOutlined from '@mui/icons-material/FingerprintOutlined';
import VideocamOutlined from '@mui/icons-material/VideocamOutlined';

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: '工作台', path: '/dashboard', icon: DashboardOutlined, group: '总览' },
  { label: '月嫂档案', path: '/matrons', icon: Diversity3Outlined, group: '资源' },
  { label: '客户下单', path: '/orders/new', icon: PersonAddAltOutlined, group: '业务' },
  { label: '订单管理', path: '/orders', icon: AssignmentOutlined, group: '业务' },
  { label: '合同管理', path: '/contracts', icon: DescriptionOutlined, group: '业务' },
  { label: '支付管理', path: '/payments', icon: PaymentsOutlined, group: '业务' },
  { label: '面试管理', path: '/interviews', icon: VideocamOutlined, group: '业务' },
  { label: '签到面板', path: '/checkin', icon: FingerprintOutlined, group: '服务' },
];

// 根据路径推断页面标题
export function titleFromPath(pathname: string): string {
  if (pathname.startsWith('/matrons')) return '月嫂档案';
  if (pathname.startsWith('/orders/new')) return '客户下单';
  if (pathname.startsWith('/orders')) return '订单管理';
  if (pathname.startsWith('/matching')) return '智能匹配';
  if (pathname.startsWith('/contracts')) return '合同管理';
  if (pathname.startsWith('/payments')) return '支付管理';
  if (pathname.startsWith('/interviews')) return '面试管理';
  if (pathname.startsWith('/service')) return '服务进度';
  if (pathname.startsWith('/checkin')) return '签到面板';
  if (pathname.startsWith('/dashboard')) return '工作台';
  return '月嫂管家';
}
