import { QRCodeSVG } from "qrcode.react";
import { Shield, Phone, MessageCircle, Mail, FileText, AlertTriangle } from "lucide-react";

const REPORT_URL = window.location.origin;

const threats = [
  "Scams & Fraud",
  "Phishing Emails / SMS",
  "Fake Calls",
  "Hacking Attempts",
  "Suspicious Links",
];

const QRPoster = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 print:p-0 print:bg-background">
      <div className="w-full max-w-lg bg-card rounded-2xl cyber-border cyber-glow p-8 space-y-6 print:shadow-none print:border print:border-border">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <AlertTriangle className="h-7 w-7 text-warning" />
            <span className="text-2xl font-black font-mono text-warning tracking-tight">
              CYBER EMERGENCY?
            </span>
          </div>
          <h1 className="text-3xl font-black font-mono text-primary cyber-text-glow tracking-tight">
            REPORT IT NOW
          </h1>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-foreground p-4 rounded-xl">
            <QRCodeSVG
              value={REPORT_URL}
              size={200}
              level="H"
              bgColor="hsl(160, 10%, 90%)"
              fgColor="hsl(220, 20%, 6%)"
            />
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Scan the QR code to report:
        </p>

        {/* Threat list */}
        <div className="space-y-2">
          {threats.map((threat) => (
            <div
              key={threat}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-secondary cyber-border"
            >
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">{threat}</span>
            </div>
          ))}
        </div>

        {/* Branding */}
        <div className="text-center space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold font-mono text-foreground">
              Genxdual Cyber
            </span>
          </div>
          <p className="text-xs text-primary font-medium">Emergency Help Desk</p>
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <span>✔ Secure</span>
          <span>✔ Confidential</span>
          <span>✔ Rapid Response</span>
        </div>

        {/* Contact options */}
        <div className="flex justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-primary" /> Call
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3 text-primary" /> WhatsApp
          </span>
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3 text-primary" /> Email
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3 text-primary" /> Report
          </span>
        </div>

        {/* Warning */}
        <p className="text-center text-xs text-warning font-medium">
          ⚠️ Do not interact with suspicious sources.
        </p>

        {/* Print button (hidden in print) */}
        <div className="text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 rounded-lg cyber-gradient text-sm font-semibold text-primary-foreground"
          >
            🖨️ Print Poster
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRPoster;
