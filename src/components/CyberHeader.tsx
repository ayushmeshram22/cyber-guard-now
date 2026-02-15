import { Shield, Lock, Wifi, Search } from "lucide-react";
import { Link } from "react-router-dom";

const CyberHeader = () => {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="h-8 w-8 text-primary" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse-slow" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono tracking-tight text-foreground">
              Genxdual Cyber
            </h1>
            <p className="text-xs text-muted-foreground">Emergency Help Desk</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/track"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium cyber-border hover:bg-accent/20 transition-colors"
          >
            <Search className="h-3 w-3" />
            Track Ticket
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium cyber-border">
            <Wifi className="h-3 w-3" />
            Cyber Incident Reporting
          </span>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 cyber-border">
            <Lock className="h-3 w-3 text-primary" />
            <span className="text-xs text-primary font-medium">Secure Connection</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CyberHeader;
