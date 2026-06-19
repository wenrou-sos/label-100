import type { Contract, Matron, Order, SystemNotification } from '@/types';
import { eachDayOfInterval, format, parseISO } from 'date-fns';

// 生成通知 ID（稳定：类型 + 关联 ID，保证重复运行同一订单不会产生新通知）
function nid(type: string, key: string): string {
  return `${type}_${key}`;
}

/**
 * 从订单、合同、月嫂数据中聚合生成 4 类系统通知。
 * 按 createdAt 倒序排列（最新的在前）。
 */
export function aggregateNotifications(
  orders: Order[],
  contracts: Contract[],
  matrons: Matron[],
): SystemNotification[] {
  const list: SystemNotification[] = [];
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // ===== 1. 新订单待匹配：状态为 matching 且 matchedMatronIds 为空 =====
  for (const o of orders) {
    if (o.status === 'matching' && o.matchedMatronIds.length === 0) {
      list.push({
        id: nid('opm', o.id),
        type: 'order_pending_match',
        title: `新订单待匹配：${o.customer.name}`,
        description: `预产期 ${o.customer.expectedDeliveryDate}，服务 ${o.serviceDays} 天，${o.startDate} 开始`,
        createdAt: o.createdAt + 'T09:00:00',
        orderId: o.id,
        targetPath: `/matching/${o.id}`,
      });
    }
  }

  // ===== 2. 合同待签署：订单为 matched（已选月嫂待签约）且合同状态为 draft =====
  const contractByOrder = new Map(contracts.map((c) => [c.orderId, c]));
  for (const o of orders) {
    if (o.status === 'matched' && o.selectedMatronId) {
      const ct = contractByOrder.get(o.id);
      if (ct && ct.status === 'draft') {
        const matron = matrons.find((m) => m.id === o.selectedMatronId);
        list.push({
          id: nid('cps', o.id),
          type: 'contract_pending_sign',
          title: `合同待签署：${o.customer.name}`,
          description: `月嫂 ${matron?.name ?? o.selectedMatronId}，合同金额 ¥${ct.amount}，请尽快签署并锁定档期`,
          createdAt: (ct.createdAt ?? o.createdAt),
          orderId: o.id,
          targetPath: `/contracts/${o.id}`,
        });
      }
    }
  }

  // ===== 3. 服务今日到期：订单状态为 in_service，且 endDate === 今天 =====
  for (const o of orders) {
    if (o.status === 'in_service' && o.endDate === todayStr) {
      list.push({
        id: nid('set', o.id),
        type: 'service_expiring_today',
        title: `服务今日到期：${o.customer.name}`,
        description: `月嫂 ${o.selectedMatronId ? matrons.find((m) => m.id === o.selectedMatronId)?.name ?? '' : ''}，` +
          `订单 ${o.id} 今日服务结束，请记得办理尾款结算和双方互评`,
        createdAt: todayStr + 'T08:30:00',
        orderId: o.id,
        targetPath: `/service/${o.id}`,
      });
    }
  }

  // ===== 4. 月嫂档期冲突：同一个月嫂存在已锁定档期（对应订单为 contracted/in_service/completed）日期重叠 =====
  const lockedContractOrderIds = new Set(
    contracts
      .filter((c) => c.status !== 'draft')
      .map((c) => c.orderId),
  );
  for (const m of matrons) {
    if (m.schedules.length < 2) continue;
    const lockedSchedules = m.schedules.filter((s) => lockedContractOrderIds.has(s.orderId));
    if (lockedSchedules.length < 2) continue;
    // 用日期计数法找任意冲突
    const dateToOrders = new Map<string, string[]>();
    for (const s of lockedSchedules) {
      const days = eachDayOfInterval({ start: parseISO(s.startDate), end: parseISO(s.endDate) });
      for (const d of days) {
        const k = format(d, 'yyyy-MM-dd');
        if (!dateToOrders.has(k)) dateToOrders.set(k, []);
        dateToOrders.get(k)!.push(s.orderId);
      }
    }
    let firstConflictDate: string | null = null;
    let conflictOrders: string[] = [];
    for (const [k, arr] of dateToOrders) {
      if (arr.length >= 2) {
        firstConflictDate = k;
        conflictOrders = Array.from(new Set(arr));
        break;
      }
    }
    if (firstConflictDate && conflictOrders.length >= 2) {
      list.push({
        id: nid('scf', m.id),
        type: 'schedule_conflict',
        title: `档期冲突：月嫂 ${m.name}`,
        description: `${firstConflictDate} 同日被 ${conflictOrders.length} 笔订单占用：${conflictOrders.join('、')}，请立即处理`,
        createdAt: todayStr + 'T07:00:00',
        orderId: conflictOrders[0],
        matronId: m.id,
        targetPath: `/matrons/${m.id}`,
      });
    }
  }

  // ===== 按 createdAt 倒序排（最新的在前） =====
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list;
}

// 通知类型 → 展示标签和图标颜色（供 UI 使用）
export const NOTIFICATION_TYPE_META: Record<
  SystemNotification['type'],
  { label: string; color: 'warning' | 'primary' | 'info' | 'error'; icon: string }
> = {
  order_pending_match:   { label: '待匹配',   color: 'warning',  icon: '🧩' },
  contract_pending_sign: { label: '待签署',   color: 'primary',  icon: '📝' },
  service_expiring_today:{ label: '今日到期', color: 'info',     icon: '⏰' },
  schedule_conflict:     { label: '档期冲突', color: 'error',    icon: '⚠️' },
};
