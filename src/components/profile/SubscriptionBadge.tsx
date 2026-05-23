import { Crown, CheckCircle } from 'lucide-react';

type Props = {
  tier: string | null | undefined;
  size?: 'xs' | 'sm';
};

// Cosmetic badge shown to OTHER users on a member's profile surfaces.
// Free / null / undefined / unknown values render nothing — call sites do
// not need their own conditionals.
//
// Strictly a payment-tier label. Do not extend with words like "Verified",
// "Trusted", "Recommended", "Premium", or anything that could imply
// safety, religious quality, or endorsement.
export default function SubscriptionBadge({ tier, size = 'sm' }: Props) {
  const normalized = (tier ?? '').toString().trim().toLowerCase();

  if (normalized !== 'silver' && normalized !== 'gold') return null;

  const isGold = normalized === 'gold';
  const Icon = isGold ? Crown : CheckCircle;
  const label = isGold ? 'Gold' : 'Silver';
  const ariaLabel = isGold ? 'Gold member' : 'Silver member';

  const gradient = isGold
    ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
    : 'bg-gradient-to-r from-slate-500 to-gray-500';

  if (size === 'xs') {
    return (
      <span
        role="img"
        aria-label={ariaLabel}
        className={`${gradient} inline-flex items-center justify-center rounded-full p-1 text-white whitespace-nowrap`}
      >
        <Icon className="h-3 w-3" />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={`${gradient} inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white whitespace-nowrap`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
