import { Sprout, Wallet, ArrowRight } from 'lucide-react';
import BitcoinIcon from './BitcoinIcon';

interface HeroSectionProps {
  isConnected: boolean;
  onConnect: () => void;
}

const HeroSection = ({ isConnected, onConnect }: HeroSectionProps) => {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      
      {/* Floating Bitcoin Icons */}
      <div className="absolute top-20 left-[10%] opacity-20 float-animation" style={{ animationDelay: '0s' }}>
        <BitcoinIcon size={48} className="text-primary" />
      </div>
      <div className="absolute top-40 right-[15%] opacity-15 float-animation" style={{ animationDelay: '1s' }}>
        <BitcoinIcon size={32} className="text-primary" />
      </div>
      <div className="absolute bottom-20 left-[20%] opacity-10 float-animation" style={{ animationDelay: '2s' }}>
        <BitcoinIcon size={40} className="text-primary" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8 opacity-0 animate-fade-in-up">
            <Sprout className="w-4 h-4 text-farm-green" />
            <span className="text-sm font-medium text-primary">Powered by Stacks</span>
            <BitcoinIcon size={16} className="text-primary" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 opacity-0 animate-fade-in-up animate-delay-100">
            <span className="text-gradient-bitcoin">SatoshiFarm</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 opacity-0 animate-fade-in-up animate-delay-200">
            The Decentralized Farmers Marketplace
          </p>
          <p className="text-lg text-muted-foreground/80 mb-10 max-w-xl mx-auto opacity-0 animate-fade-in-up animate-delay-300">
            List your farm products, trade with crypto, and harvest your Sats on Bitcoin L2
          </p>

          {/* CTA */}
          {!isConnected && (
            <button
              onClick={onConnect}
              className="btn-bitcoin text-lg px-8 py-4 flex items-center gap-3 mx-auto opacity-0 animate-fade-in-up animate-delay-400 glow-pulse"
            >
              <Wallet className="w-6 h-6" />
              Connect Wallet (Mobile QR Ready)
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 opacity-0 animate-fade-in-up animate-delay-400">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient-bitcoin">100%</div>
              <div className="text-sm text-muted-foreground mt-1">Decentralized</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient-bitcoin">₿</div>
              <div className="text-sm text-muted-foreground mt-1">Bitcoin Secured</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient-bitcoin">0</div>
              <div className="text-sm text-muted-foreground mt-1">Middlemen</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
