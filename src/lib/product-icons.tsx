import { Activity, Dna, Shield, Sparkles, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ProductIconKey = 'activity' | 'sparkles' | 'dna' | 'shield' | 'zap';

export const productIconMap: Record<ProductIconKey, LucideIcon> = {
  activity: Activity,
  sparkles: Sparkles,
  dna: Dna,
  shield: Shield,
  zap: Zap,
};

export function renderProductIcon(iconKey: ProductIconKey, className = 'w-5 h-5') {
  const Icon = productIconMap[iconKey] ?? Activity;
  return <Icon className={className} />;
}
