import { Phone, MessageCircle, Mail } from "lucide-react";

const SupportOptions = () => (
  <section className="py-12 border-t border-border">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h3 className="text-lg font-bold font-mono text-foreground">Direct Support</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="tel:+1234567890"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card cyber-border hover:cyber-glow transition-all"
          >
            <Phone className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-foreground">Call Now</span>
            <span className="text-xs text-muted-foreground">Urgent Cases</span>
          </a>
          <a
            href="https://wa.me/1234567890?text=I%20need%20help%20with%20a%20cyber%20incident"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card cyber-border hover:cyber-glow transition-all"
          >
            <MessageCircle className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-foreground">WhatsApp</span>
            <span className="text-xs text-muted-foreground">Text / Chat</span>
          </a>
          <a
            href="mailto:support@genxdualcyber.com?subject=Cyber%20Incident%20Report"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card cyber-border hover:cyber-glow transition-all"
          >
            <Mail className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-foreground">Email Us</span>
            <span className="text-xs text-muted-foreground">Detailed Reports</span>
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default SupportOptions;
