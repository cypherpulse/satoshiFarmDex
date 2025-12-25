import { Loader2, TrendingUp, Sprout } from 'lucide-react';
import BitcoinIcon from './BitcoinIcon';
import { microStxToStx } from '@/lib/stacks';

interface SellerDashboardProps {
  earnedSats: bigint;
  isLoading: boolean;
  onHarvest: () => Promise<void>;
  isHarvesting: boolean;
  isConnected: boolean;
}

const SellerDashboard = ({
  earnedSats,
  isLoading,
  onHarvest,
  isHarvesting,
  isConnected,
}: SellerDashboardProps) => {
  if (!isConnected) {
    return null;
  }

  return (
    <div className="card-farm bg-gradient-to-br from-card to-primary/5 border-primary/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center float-animation">
          <Sprout className="w-6 h-6 text-farm-green" />
        </div>
        <div>
          <h3 className="text-xl font-bold">My Farm Dashboard</h3>
          <p className="text-sm text-muted-foreground">Your earnings from sales</p>
        </div>
      </div>

      {/* Earnings Display */}
      <div className="bg-background/50 rounded-xl p-6 mb-6 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-farm-green" />
            Earned Sats
          </span>
          <BitcoinIcon size={24} className="text-primary" />
        </div>
        <div className="flex items-end gap-2">
          {isLoading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <>
              <span className="text-3xl font-bold text-gradient-bitcoin">
                {microStxToStx(earnedSats)}
              </span>
              <span className="text-lg text-muted-foreground mb-1">STX</span>
            </>
          )}
        </div>
      </div>

      {/* Harvest Button */}
      <button
        onClick={onHarvest}
        disabled={isHarvesting || earnedSats === 0n}
        className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3
          ${earnedSats > 0n 
            ? 'btn-bitcoin glow-pulse' 
            : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
      >
        {isHarvesting ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Harvesting...
          </>
        ) : (
          <>
            <BitcoinIcon size={24} className="text-current" />
            Harvest Your Sats ₿
          </>
        )}
      </button>

      {earnedSats === 0n && !isLoading && (
        <p className="text-center text-sm text-muted-foreground mt-3">
          List and sell items to earn Sats!
        </p>
      )}
    </div>
  );
};

export default SellerDashboard;
