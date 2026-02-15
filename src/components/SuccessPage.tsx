import { CheckCircle, Copy, AlertTriangle, ArrowLeft, Phone, MessageCircle, Mail, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface SuccessPageProps {
  ticketCode: string;
  onReset: () => void;
}

const SuccessPage = ({ ticketCode, onReset }: SuccessPageProps) => {
  const copyTicket = () => {
    navigator.clipboard.writeText(ticketCode);
    toast.success("Ticket ID copied to clipboard");
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center space-y-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 cyber-border flex items-center justify-center cyber-glow-strong">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold font-mono text-foreground">
              Report Submitted Successfully
            </h2>
            <p className="text-muted-foreground">
              Your cyber incident report has been submitted. Our Genxdual Cyber Response Team
              has been notified and will contact you shortly.
            </p>
          </div>

          {/* Ticket ID */}
          <div className="bg-card rounded-xl cyber-border p-6 space-y-3">
            <p className="text-sm text-muted-foreground">Your Ticket ID</p>
            <div className="flex items-center justify-center gap-3">
              <code className="text-2xl font-mono font-bold text-primary cyber-text-glow">
                {ticketCode}
              </code>
              <button
                onClick={copyTicket}
                className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20 text-left">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              If the issue is urgent, please avoid interacting further with the suspicious source.
              Do not click any suspicious links or provide further personal information.
            </p>
          </div>

          {/* Direct Support */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Need immediate help?</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" size="sm" className="cyber-border" asChild>
                <a href="tel:+1234567890">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </a>
              </Button>
              <Button variant="outline" size="sm" className="cyber-border" asChild>
                <a href="https://wa.me/1234567890?text=I%20need%20help%20with%20a%20cyber%20incident" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </a>
              </Button>
              <Button variant="outline" size="sm" className="cyber-border" asChild>
                <a href="mailto:support@genxdualcyber.com?subject=Cyber%20Incident%20Report">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Us
                </a>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={onReset} variant="outline" className="cyber-border">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Submit Another Report
            </Button>
            <Button variant="outline" className="cyber-border" asChild>
              <Link to="/track">
                <Search className="h-4 w-4 mr-2" />
                Track Your Ticket
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessPage;
