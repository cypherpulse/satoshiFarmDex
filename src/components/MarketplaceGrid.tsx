import { useState } from 'react';
import { ShoppingCart, User, Package, Loader2 } from 'lucide-react';
import BitcoinIcon from './BitcoinIcon';
import { MarketItem, microStxToStx, shortenAddress } from '@/lib/stacks';

interface MarketplaceGridProps {
  items: MarketItem[];
  isLoading: boolean;
  onBuy: (itemId: number, quantity: bigint) => Promise<void>;
  isConnected: boolean;
}

const MarketplaceGrid = ({ items, isLoading, onBuy, isConnected }: MarketplaceGridProps) => {
  const [buyingItem, setBuyingItem] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, string>>({});

  const handleBuy = async (item: MarketItem) => {
    const qty = BigInt(quantities[item.id] || '1');
    if (qty <= 0 || qty > item.quantity) return;

    setBuyingItem(item.id);
    try {
      await onBuy(item.id, qty);
      setQuantities(prev => ({ ...prev, [item.id]: '1' }));
    } finally {
      setBuyingItem(null);
    }
  };

  const activeItems = items.filter(item => item.active && item.quantity > 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading marketplace...</p>
      </div>
    );
  }

  if (activeItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No items yet</h3>
        <p className="text-muted-foreground max-w-md">
          Be the first to list your farm products and start earning Sats!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
      {activeItems.map((item, index) => (
        <div
          key={item.id}
          className="card-farm opacity-0 animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
        >
          {/* Item Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground truncate">{item.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="font-mono truncate">{shortenAddress(item.seller)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg self-start sm:self-auto">
              <BitcoinIcon size={16} className="text-primary flex-shrink-0" />
              <span className="text-sm font-bold text-primary">
                {microStxToStx(item.price)}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {item.description}
          </p>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Package className="w-4 h-4 text-farm-green" />
            <span className="text-muted-foreground">
              Stock: <span className="text-foreground font-medium">{item.quantity.toString()}</span>
            </span>
          </div>

          {/* Buy Controls */}
          {isConnected && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="number"
                min="1"
                max={Number(item.quantity)}
                value={quantities[item.id] || '1'}
                onChange={(e) => setQuantities(prev => ({ ...prev, [item.id]: e.target.value }))}
                className="input-farm w-full sm:w-20 text-center"
                placeholder="Qty"
              />
              <button
                onClick={() => handleBuy(item)}
                disabled={buyingItem === item.id}
                className="btn-bitcoin flex-1 flex items-center justify-center gap-2"
              >
                {buyingItem === item.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Buy Now</span>
                <span className="sm:hidden">Buy</span>
              </button>
            </div>
          )}

          {!isConnected && (
            <p className="text-sm text-muted-foreground text-center py-2 bg-muted rounded-lg">
              Connect wallet to buy
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default MarketplaceGrid;
