import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 货币格式化
export function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// 日期格式化（中文）
export function formatDate(iso?: string, pattern = 'yyyy-MM-dd'): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}

// 日期时间格式化
export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'yyyy-MM-dd HH:mm');
  } catch {
    return iso;
  }
}

// 友好日期：2025年6月18日
export function formatDateZh(iso?: string): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'M月d日', { locale: zhCN });
  } catch {
    return iso;
  }
}

// 根据起始日期与服务天数计算结束日期
export function calcEndDate(startDate: string, serviceDays: number): string {
  return format(addDays(parseISO(startDate), serviceDays - 1), 'yyyy-MM-dd');
}

// 剩余天数（相对今天）
export function remainingDays(endDate: string): number {
  return differenceInCalendarDays(parseISO(endDate), new Date());
}

// 已过去天数
export function elapsedDays(startDate: string): number {
  return Math.max(0, differenceInCalendarDays(new Date(), parseISO(startDate)));
}

// 生成唯一 ID
export function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// 手机号脱敏
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

// 手机号校验
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 星级展示文本
export function ratingText(rating: number): string {
  return rating.toFixed(1);
}
