import { Shield, Lock, Eye, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 cyber-bg-grid" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 cyber-border">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Emergency Cyber Response</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold font-mono leading-tight">
            <span className="text-foreground">Genxdual Cyber</span>
            <br />
            <span className="text-primary cyber-text-glow">Emergency Help Desk</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            This platform allows students and users to report cyber incidents such as scams, 
            phishing, fraud, hacking attempts, or suspicious activities. Our cybersecurity 
            response team will review your report and contact you as soon as possible.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <TrustBadge icon={<Lock className="h-4 w-4" />} label="Encrypted & Secure" />
            <TrustBadge icon={<Eye className="h-4 w-4" />} label="Confidential Review" />
            <TrustBadge icon={<Zap className="h-4 w-4" />} label="Rapid Response" />
          </div>
        </div>
      </div>
    </section>
  );
};

const TrustBadge = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card cyber-border">
    <span className="text-primary">{icon}</span>
    <span className="text-sm font-medium text-foreground">{label}</span>
  </div>
);

export default HeroSection;
