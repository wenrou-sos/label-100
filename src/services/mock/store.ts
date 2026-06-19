import { createSeedData, type SeedData } from './seed';
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

// 计算月嫂客户评价均分（仅客户评价计入均分，保留一位）
function computeAverageRating(reviews: Review[]): number {
  const customer = reviews.filter((r) => r.reviewerType === 'customer');
  if (!customer.length) return 0;
  const sum = customer.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / customer.length) * 10) / 10;
}

function withRating(m: Matron): Matron {
  return { ...m, averageRating: computeAverageRating(m.reviews) };
}

/**
 * 内存数据存储：模拟数据库。
 * 所有方法均为同步操作，由上层 API 封装包裹模拟延迟。
 */
class MemoryStore {
  private data: SeedData;

  constructor() {
    this.data = createSeedData();
  }

  // ---- 月嫂 ----
  listMatrons(): Matron[] {
    return this.data.matrons.map(withRating);
  }
  getMatron(id: string): Matron | undefined {
    const m = this.data.matrons.find((x) => x.id === id);
    return m ? withRating(m) : undefined;
  }
  createMatron(input: Omit<Matron, 'id' | 'schedules' | 'reviews' | 'createdAt' | 'avatar' | 'averageRating'>): Matron {
    const m: Matron = {
      ...input,
      id: `m_${Date.now().toString(36)}`,
      avatar: '',
      schedules: [],
      reviews: [],
      averageRating: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this.data.matrons.push(m);
    return withRating(m);
  }
  updateMatron(id: string, patch: Partial<Matron>): Matron | undefined {
    const idx = this.data.matrons.findIndex((x) => x.id === id);
    if (idx < 0) return undefined;
    this.data.matrons[idx] = { ...this.data.matrons[idx], ...patch, id };
    return withRating(this.data.matrons[idx]);
  }
  deleteMatron(id: string): boolean {
    const before = this.data.matrons.length;
    this.data.matrons = this.data.matrons.filter((x) => x.id !== id);
    return this.data.matrons.length < before;
  }
  addReview(matronId: string, review: Omit<Review, 'id' | 'createdAt'>): Review {
    const m = this.data.matrons.find((x) => x.id === matronId);
    const r: Review = { ...review, id: `r_${Date.now().toString(36)}`, createdAt: new Date().toISOString() };
    m?.reviews.push(r);
    return r;
  }
  // 给月嫂追加档期（签约锁定时调用）
  addSchedule(matronId: string, schedule: Schedule) {
    const m = this.data.matrons.find((x) => x.id === matronId);
    if (m && !m.schedules.some((s) => s.orderId === schedule.orderId)) {
      m.schedules.push(schedule);
    }
  }

  // ---- 订单 ----
  listOrders(): Order[] {
    return [...this.data.orders];
  }
  getOrder(id: string): Order | undefined {
    return this.data.orders.find((x) => x.id === id);
  }
  createOrder(input: Omit<Order, 'id' | 'createdAt' | 'matchedMatronIds' | 'status'>): Order {
    const o: Order = {
      ...input,
      id: `o_${Date.now().toString(36)}`,
      matchedMatronIds: [],
      status: 'matching',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this.data.orders.unshift(o);
    return o;
  }
  updateOrder(id: string, patch: Partial<Order>): Order | undefined {
    const idx = this.data.orders.findIndex((x) => x.id === id);
    if (idx < 0) return undefined;
    this.data.orders[idx] = { ...this.data.orders[idx], ...patch, id };
    return this.data.orders[idx];
  }
  deleteOrder(id: string): boolean {
    const before = this.data.orders.length;
    this.data.orders = this.data.orders.filter((x) => x.id !== id);
    return this.data.orders.length < before;
  }

  // ---- 合同 ----
  listContracts(): Contract[] {
    return [...this.data.contracts];
  }
  getContract(id: string): Contract | undefined {
    return this.data.contracts.find((x) => x.id === id);
  }
  getContractByOrder(orderId: string): Contract | undefined {
    return this.data.contracts.find((x) => x.orderId === orderId);
  }
  createContract(input: Omit<Contract, 'id' | 'createdAt' | 'status'>): Contract {
    const c: Contract = {
      ...input,
      id: `ct_${Date.now().toString(36)}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    this.data.contracts.unshift(c);
    return c;
  }
  updateContract(id: string, patch: Partial<Contract>): Contract | undefined {
    const idx = this.data.contracts.findIndex((x) => x.id === id);
    if (idx < 0) return undefined;
    this.data.contracts[idx] = { ...this.data.contracts[idx], ...patch, id };
    return this.data.contracts[idx];
  }

  // ---- 支付 ----
  listPayments(): Payment[] {
    return [...this.data.payments];
  }
  getPaymentsByContract(contractId: string): Payment[] {
    return this.data.payments.filter((x) => x.contractId === contractId);
  }
  createPayment(input: Omit<Payment, 'id'>): Payment {
    const p: Payment = { ...input, id: `p_${Date.now().toString(36)}` };
    this.data.payments.unshift(p);
    return p;
  }

  // ---- 面试预约 ----
  listInterviews(): Interview[] {
    return [...this.data.interviews];
  }
  getInterviewsByOrder(orderId: string): Interview[] {
    return this.data.interviews.filter((x) => x.orderId === orderId);
  }
  createInterview(input: Omit<Interview, 'id' | 'status'>): Interview {
    const iv: Interview = { ...input, id: `iv_${Date.now().toString(36)}`, status: 'pending' };
    this.data.interviews.unshift(iv);
    return iv;
  }
  updateInterview(id: string, patch: Partial<Interview>): Interview | undefined {
    const idx = this.data.interviews.findIndex((x) => x.id === id);
    if (idx < 0) return undefined;
    this.data.interviews[idx] = { ...this.data.interviews[idx], ...patch, id };
    return this.data.interviews[idx];
  }

  // ---- 打卡 ----
  listCheckins(): Checkin[] {
    return [...this.data.checkins];
  }
  getCheckinsByOrder(orderId: string): Checkin[] {
    return this.data.checkins
      .filter((x) => x.orderId === orderId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  createCheckin(input: Omit<Checkin, 'id'>): Checkin {
    const c: Checkin = { ...input, id: `ck_${Date.now().toString(36)}` };
    this.data.checkins.push(c);
    return c;
  }
  updateCheckin(id: string, patch: Partial<Checkin>): Checkin | undefined {
    const idx = this.data.checkins.findIndex((x) => x.id === id);
    if (idx < 0) return undefined;
    this.data.checkins[idx] = { ...this.data.checkins[idx], ...patch, id };
    return this.data.checkins[idx];
  }
}

export const store = new MemoryStore();
