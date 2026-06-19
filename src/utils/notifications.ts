import type { Contract, Matron, Order, SystemNotification, NotificationType } from '@/types';
import { eachDayOfInterval, format, parseISO } from 'date-fns';

// 生成通知 ID（稳定：类型 + 关联 ID，保证重复运行同一订单不会产生新通知）
function nid(type: string, key: string): string {
  return `${type}_${key}`;
}

/**
 * 通知类型优先级（越小越紧急，显示越靠前）
 * 1 = 档期冲突（需立即处理）
 * 2 = 服务今日到期（当天必须办）
 * 3 = 合同待签署（下一步关键节点）
 * 4 = 新订单待匹配（常规处理）
 */
const TYPE_PRIORITY: Record<NotificationType, number> = {
  schedule_conflict:      1,
  service_expiring_today: 2,
  contract_pending_sign:  3,
  order_pending_match:    4,
};

/**
 * 从订单、合同、月嫂数据中聚合生成 4 类系统通知。
 * 排序规则：先按类型优先级（数字小=更紧急=靠前），
 *          同级再按业务发生日期倒序（最新=靠前）。
 *          createdAt 使用业务真实日期字段，不再虚构时分秒。
 */
export function aggregateNotifications(
  orders: Order[],
  contracts: Contract[],
  matrons: Matron[],
): SystemNotification[] {
  const list: SystemNotification[] = [];
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const contractByOrder = new Map(contracts.map((c) => [c.orderId, c]));

  // ===== 1. 新订单待匹配：订单仍处于 matching 状态即视为未完成 =====
  // 之前误判：只要 matchedMatronIds 非空就消失 —— 但候选列表只是推荐，
  // 只要状态没前进到 matched/contracted，匹配工作就还没完成，通知应一直存在。
  for (const o of orders) {
    if (o.status === 'matching') {
      list.push({
        id: nid('opm', o.id),
        type: 'order_pending_match',
        title: `新订单待匹配：${o.customer.name}`,
        description:
          `预产期 ${o.customer.expectedDeliveryDate}，` +
          `服务 ${o.serviceDays} 天，${o.startDate} 开始` +
          (o.matchedMatronIds.length > 0
            ? `（已推荐 ${o.matchedMatronIds.length} 名候选，尚未选定月嫂）`
            : '（尚无推荐候选，请尽快启动匹配）'),
        // 使用订单真实创建日期作为通知时间
        createdAt: o.createdAt,
        orderId: o.id,
        targetPath: `/matching/${o.id}`,
      });
    }
  }

  // ===== 2. 合同待签署：订单已 matched（已选定月嫂待签约）且合同仍为 draft =====
  for (const o of orders) {
    if (o.status === 'matched' && o.selectedMatronId) {
      const ct = contractByOrder.get(o.id);
      if (ct && ct.status === 'draft') {
        const matron = matrons.find((m) => m.id === o.selectedMatronId);
        list.push({
          id: nid('cps', o.id),
          type: 'contract_pending_sign',
          title: `合同待签署：${o.customer.name}`,
          description:
            `月嫂 ${matron?.name ?? o.selectedMatronId}，` +
            `合同金额 ¥${ct.amount}，请尽快签署以锁定档期`,
          // 使用合同真实创建日期
          createdAt: ct.createdAt ?? o.createdAt,
          orderId: o.id,
          targetPath: `/contracts/${o.id}`,
        });
      }
    }
  }

  // ===== 3. 服务今日到期：订单为 in_service 且 endDate === 今天 =====
  for (const o of orders) {
    if (o.status === 'in_service' && o.endDate === todayStr) {
      const matron = o.selectedMatronId
        ? matrons.find((m) => m.id === o.selectedMatronId)?.name ?? ''
        : '';
      list.push({
        id: nid('set', o.id),
        type: 'service_expiring_today',
        title: `服务今日到期：${o.customer.name}`,
        description:
          (matron ? `月嫂 ${matron}，` : '') +
          `订单 ${o.id} 今日服务结束，请记得办理尾款结算和双方互评`,
        // 到期通知的真实业务时间 = 订单结束日期
        createdAt: o.endDate,
        orderId: o.id,
        targetPath: `/service/${o.id}`,
      });
    }
  }

  // ===== 4. 月嫂档期冲突：已锁定档期（合同非 draft）在同一日期被多笔订单占用 =====
  const lockedContractOrderIds = new Set(
    contracts.filter((c) => c.status !== 'draft').map((c) => c.orderId),
  );
  for (const m of matrons) {
    if (m.schedules.length < 2) continue;
    const lockedSchedules = m.schedules.filter((s) => lockedContractOrderIds.has(s.orderId));
    if (lockedSchedules.length < 2) continue;

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
        description:
          `${firstConflictDate} 同日被 ${conflictOrders.length} 笔订单占用：` +
          `${conflictOrders.join('、')}，请立即处理`,
        // 冲突通知的真实业务时间 = 首个冲突发生日期
        createdAt: firstConflictDate,
        orderId: conflictOrders[0],
        matronId: m.id,
        targetPath: `/matrons/${m.id}`,
      });
    }
  }

  // ===== 稳定排序：先优先级（数字小→前），再按日期倒序（新→前） =====
  list.sort((a, b) => {
    const pDiff = TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
    if (pDiff !== 0) return pDiff;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return list;
}

// 通知类型 → 展示标签、图标颜色
export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  { label: string; color: 'warning' | 'primary' | 'info' | 'error'; icon: string }
> = {
  order_pending_match:    { label: '待匹配',   color: 'warning',  icon: '🧩' },
  contract_pending_sign:  { label: '待签署',   color: 'primary',  icon: '📝' },
  service_expiring_today: { label: '今日到期', color: 'info',     icon: '⏰' },
  schedule_conflict:      { label: '档期冲突', color: 'error',    icon: '⚠️' },
};
