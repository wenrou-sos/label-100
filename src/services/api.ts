import { store } from './mock/store';
import { matchMatrons } from './matching';
import { calcEndDate } from '@/utils/format';
import { PRICE_PER_DAY } from '@/constants/meta';
import type {
  ApiResponse,
  Certificate,
  Checkin,
  Contract,
  Interview,
  MatchCandidate,
  Matron,
  Order,
  Payment,
  PaymentMethod,
  Review,
  ServiceDays,
  ServiceRequirement,
} from '@/types';

// 模拟网络延迟
function delay<T>(value: T, min = 320, max = 760): Promise<T> {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function ok<T>(data: T, message = 'success'): Promise<ApiResponse<T>> {
  return delay({ code: 0, data, message });
}

// ============ 月嫂 ============
export const matronApi = {
  list: () => ok<Matron[]>(store.listMatrons()),
  get: (id: string) => ok<Matron | undefined>(store.getMatron(id)),
  create: (input: { name: string; age: number; hometown: string; experienceYears: number; phone: string; certificates: Certificate[] }) =>
    ok<Matron>(store.createMatron({ ...input, status: 'available' })),
  update: (id: string, patch: Partial<Matron>) => ok<Matron | undefined>(store.updateMatron(id, patch)),
  remove: (id: string) => ok<boolean>(store.deleteMatron(id)),
  addReview: (matronId: string, review: Omit<Review, 'id' | 'createdAt'>) =>
    ok<Review>(store.addReview(matronId, review)),
};

// ============ 订单 ============
export const orderApi = {
  list: () => ok<Order[]>(store.listOrders()),
  get: (id: string) => ok<Order | undefined>(store.getOrder(id)),
  create: (input: {
    customer: { name: string; phone: string; expectedDeliveryDate: string };
    serviceDays: ServiceDays;
    startDate: string;
    requirement: ServiceRequirement;
  }) => {
    const endDate = calcEndDate(input.startDate, input.serviceDays);
    const order = store.createOrder({
      customer: { id: `c_${Date.now().toString(36)}`, ...input.customer },
      serviceDays: input.serviceDays,
      startDate: input.startDate,
      endDate,
      requirement: input.requirement,
    });
    return ok<Order>(order);
  },
  update: (id: string, patch: Partial<Order>) => ok<Order | undefined>(store.updateOrder(id, patch)),
  remove: (id: string) => ok<boolean>(store.deleteOrder(id)),
  setMatched: (id: string, matronIds: string[]) =>
    ok<Order | undefined>(store.updateOrder(id, { matchedMatronIds: matronIds })),
  selectMatron: (id: string, matronId: string) => {
    const order = store.updateOrder(id, { selectedMatronId: matronId, status: 'matched' });
    // 选定月嫂后，自动为该订单创建合同草稿
    if (order) {
      const createContract = () => {
        const existing = store.getContractByOrder(id);
        if (existing) return existing;
        const selectedMatron = store.listMatrons().find(m => m.id === matronId);
        if (!selectedMatron) return undefined;
        const amount = order.serviceDays * PRICE_PER_DAY;
        const deposit = Math.round(amount * 0.3);
        return store.createContract({ orderId: id, matronId, amount, deposit });
      };
      createContract();
    }
    return ok<Order | undefined>(order);
  },
  startService: (id: string) => {
    const order = store.getOrder(id);
    if (!order) return ok<Order | undefined>(undefined, '订单不存在');
    if (order.status !== 'contracted') {
      const statusMap: Record<string, string> = { pending: '待匹配', matched: '待签约', contracted: '已签约待开始', in_service: '服务中', completed: '已完成' };
      return ok<Order | undefined>(undefined, `当前状态不可开始服务（${statusMap[order.status]}）`);
    }
    const today = new Date().toISOString().slice(0, 10);
    const earliest = new Date(new Date(order.startDate).getTime() - 86400000).toISOString().slice(0, 10);
    if (today < earliest) {
      return ok<Order | undefined>(undefined, `未到服务开始日期，最早可于 ${order.startDate} 前1天开始服务`);
    }
    return ok<Order | undefined>(store.updateOrder(id, { status: 'in_service' }));
  },
};

// ============ 智能匹配 ============
export const matchingApi = {
  // 针对订单执行匹配，返回全部候选人（已排序），并将 Top 候选写回订单 matchedMatronIds
  match: (orderId: string): Promise<ApiResponse<{ candidates: MatchCandidate[]; order: Order | undefined }>> => {
    const order = store.getOrder(orderId);
    if (!order) return ok({ candidates: [], order: undefined }, 'order not found');
    const matrons = store.listMatrons();
    const candidates = matchMatrons(matrons, order);
    const topIds = candidates.filter((c) => c.available).slice(0, 3).map((c) => c.matron.id);
    store.updateOrder(orderId, { matchedMatronIds: topIds });
    return ok({ candidates, order: store.getOrder(orderId) });
  },
};

// ============ 合同 ============
export const contractApi = {
  list: () => ok<Contract[]>(store.listContracts()),
  get: (id: string) => ok<Contract | undefined>(store.getContract(id)),
  getByOrder: (orderId: string) => ok<Contract | undefined>(store.getContractByOrder(orderId)),
  // 为已选定月嫂的订单生成草稿合同
  createForOrder: (orderId: string) => {
    const order = store.getOrder(orderId);
    if (!order || !order.selectedMatronId) return ok<Contract | undefined>(undefined, '订单未选定月嫂');
    const existing = store.getContractByOrder(orderId);
    if (existing) return ok<Contract>(existing);
    const amount = order.serviceDays * PRICE_PER_DAY;
    const deposit = Math.round(amount * 0.3);
    const contract = store.createContract({ orderId, matronId: order.selectedMatronId, amount, deposit });
    return ok<Contract>(contract);
  },
  // 签署合同：锁定月嫂档期，订单进入已签约
  sign: (contractId: string) => {
    const contract = store.getContract(contractId);
    if (!contract) return ok<Contract | undefined>(undefined, '合同不存在');
    const order = store.getOrder(contract.orderId);
    store.updateContract(contractId, { status: 'signed', signedAt: new Date().toISOString() });
    // 锁定月嫂档期
    if (order) {
      store.addSchedule(contract.matronId, {
        orderId: order.id,
        startDate: order.startDate,
        endDate: order.endDate,
      });
      store.updateOrder(order.id, { status: 'contracted' });
    }
    return ok<Contract | undefined>(store.getContract(contractId), '合同已签署，月嫂档期已锁定');
  },
  update: (id: string, patch: Partial<Contract>) => ok<Contract | undefined>(store.updateContract(id, patch)),
};

// ============ 支付 ============
export const paymentApi = {
  list: () => ok<Payment[]>(store.listPayments()),
  byContract: (contractId: string) => ok<Payment[]>(store.getPaymentsByContract(contractId)),
  // 支付定金
  payDeposit: (contractId: string, method: PaymentMethod) => {
    const contract = store.getContract(contractId);
    if (!contract) return ok<Payment | undefined>(undefined, '合同不存在');
    const payment = store.createPayment({
      contractId,
      type: 'deposit',
      amount: contract.deposit,
      method,
      status: 'paid',
      paidAt: new Date().toISOString(),
    });
    store.updateContract(contractId, { status: 'deposit_paid', depositPaidAt: new Date().toISOString() });
    return ok<Payment>(payment, '定金支付成功');
  },
  // 尾款结算（服务结束后触发）
  settleFinal: (contractId: string, method: PaymentMethod) => {
    const contract = store.getContract(contractId);
    if (!contract) return ok<Payment | undefined>(undefined, '合同不存在');
    const order = store.listOrders().find((o) => o.id === contract.orderId);
    // 只有服务中(in_service)或已完成的订单才能结算尾款，且必须已过结束日期
    if (order && order.status !== 'in_service' && order.status !== 'completed') {
      return ok<Payment | undefined>(undefined, '当前订单状态不可结算尾款，请先开始服务');
    }
    const today = new Date().toISOString().slice(0, 10);
    if (order && order.endDate > today) {
      return ok<Payment | undefined>(undefined, `服务尚未结束，${order.endDate} 后方可结算尾款`);
    }
    // 已结算则不再重复
    if (contract.status === 'final_settled') {
      return ok<Payment | undefined>(undefined, '该合同尾款已结算');
    }
    const finalAmount = contract.amount - contract.deposit;
    const payment = store.createPayment({
      contractId,
      type: 'final',
      amount: finalAmount,
      method,
      status: 'paid',
      paidAt: new Date().toISOString(),
    });
    store.updateContract(contractId, { status: 'final_settled', settledAt: new Date().toISOString() });
    if (order) store.updateOrder(order.id, { status: 'completed' });
    return ok<Payment>(payment, '尾款结算成功，订单已完成');
  },
};

// ============ 面试预约 ============
export const interviewApi = {
  list: () => ok<Interview[]>(store.listInterviews()),
  byOrder: (orderId: string) => ok<Interview[]>(store.getInterviewsByOrder(orderId)),
  create: (input: { orderId: string; matronId: string; scheduledAt: string; note?: string }) => {
    const order = store.getOrder(input.orderId);
    if (!order) return ok<Interview | undefined>(undefined, '订单不存在');
    // 仅待匹配(matching)或已匹配待签约(matched)的订单可预约面试；
    // 已签约及之后的状态月嫂已确定，不再预约面试
    if (order.status !== 'matching' && order.status !== 'matched') {
      const statusMap: Record<string, string> = { pending: '待匹配', matched: '待签约', contracted: '已签约', in_service: '服务中', completed: '已完成' };
      return ok<Interview | undefined>(undefined, `该订单已${statusMap[order.status]}，不可再预约面试`);
    }
    return ok<Interview>(store.createInterview(input), '面试预约已创建');
  },
  update: (id: string, patch: Partial<Interview>) => ok<Interview | undefined>(store.updateInterview(id, patch)),
};

// ============ 打卡 ============
export const checkinApi = {
  byOrder: (orderId: string) => ok<Checkin[]>(store.getCheckinsByOrder(orderId)),
  // 月嫂签到
  checkin: (input: { orderId: string; matronId: string; note?: string }) => {
    const order = store.getOrder(input.orderId);
    if (!order) return ok<Checkin | undefined>(undefined, '订单不存在');
    // 只有服务中(in_service)的订单才能签到
    if (order.status !== 'in_service') {
      const statusMap: Record<string, string> = { pending: '待匹配', matched: '待签约', contracted: '已签约待开始', in_service: '服务中', completed: '已完成' };
      return ok<Checkin | undefined>(undefined, `订单未开始服务（${statusMap[order.status]}），无法签到`);
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const exist = store.getCheckinsByOrder(input.orderId).find((c) => c.date === todayStr);
    if (exist) return ok<Checkin>(exist, '今日已签到');
    const c = store.createCheckin({
      orderId: input.orderId,
      matronId: input.matronId,
      date: todayStr,
      matronTime: new Date().toTimeString().slice(0, 8),
      note: input.note,
    });
    return ok<Checkin>(c, '签到成功');
  },
  // 管理员确认
  confirm: (id: string) => ok<Checkin | undefined>(store.updateCheckin(id, { adminConfirmedAt: new Date().toISOString() })),
};

// ============ 评价（服务结束互评） ============
export const reviewApi = {
  submit: (input: { matronId: string; orderId: string; reviewerType: 'customer' | 'matron'; rating: number; comment: string }) =>
    ok<Review>(store.addReview(input.matronId, input), '评价已提交，已同步至月嫂档案'),
};
