import type {
  Certificate,
  MatchCandidate,
  Matron,
  Order,
  Review,
  ServiceRequirement,
} from '@/types';
import { REQUIREMENT_CERT_MAP } from '@/constants/meta';

// 区间重叠检测：[s1,e1] 与 [s2,e2] 是否重叠
export function isOverlap(
  s1: string,
  e1: string,
  s2: string,
  e2: string,
): boolean {
  return s1 <= e2 && s2 <= e1;
}

// 根据需求计算所需证书集合（去重）
export function getRequiredCerts(req: ServiceRequirement): Certificate[] {
  const set = new Set<Certificate>();
  (Object.keys(req) as (keyof ServiceRequirement)[]).forEach((key) => {
    if (req[key]) {
      const certs = REQUIREMENT_CERT_MAP[key];
      certs?.forEach((c) => set.add(c));
    }
  });
  return Array.from(set);
}

// 计算客户评价均分（仅客户评价）
export function calcAverageRating(reviews: Review[]): number {
  const customer = reviews.filter((r) => r.reviewerType === 'customer');
  if (!customer.length) return 0;
  const sum = customer.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / customer.length) * 10) / 10;
}

// 档期冲突检测：月嫂档期是否与订单服务区间冲突
export function hasScheduleConflict(matron: Matron, startDate: string, endDate: string): boolean {
  return matron.schedules.some((s) => isOverlap(s.startDate, s.endDate, startDate, endDate));
}

/**
 * 智能匹配核心算法
 * 三阶段：
 *   1) 档期冲突检测 —— 标记可用性
 *   2) 技能证书匹配度 —— 命中证书 / 所需证书
 *   3) 评价均分排序 —— 可用优先，再按匹配度，再按均分
 * 返回全部候选人（含明细），由调用方取前 N 名。
 */
export function matchMatrons(matrons: Matron[], order: Order): MatchCandidate[] {
  const requiredCerts = getRequiredCerts(order.requirement);

  const candidates: MatchCandidate[] = matrons.map((matron) => {
    const available = !hasScheduleConflict(matron, order.startDate, order.endDate);
    const matchedCerts = requiredCerts.filter((c) => matron.certificates.includes(c));
    // 匹配度：无需求证书约束时记满分 100；否则 命中/所需*100
    const matchScore = requiredCerts.length === 0
      ? 100
      : Math.round((matchedCerts.length / requiredCerts.length) * 100);
    return {
      matron,
      available,
      requiredCerts,
      matchedCerts,
      matchScore,
      averageRating: calcAverageRating(matron.reviews),
    };
  });

  // 排序：可用优先 → 匹配度高 → 评价分高 → 经验长
  candidates.sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1;
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
    return b.matron.experienceYears - a.matron.experienceYears;
  });

  return candidates;
}

// 取前 N 名可用候选人（Top3 默认）
export function matchTopN(matrons: Matron[], order: Order, n = 3): MatchCandidate[] {
  return matchMatrons(matrons, order)
    .filter((c) => c.available)
    .slice(0, n);
}
