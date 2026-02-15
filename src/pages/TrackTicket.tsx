import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Search, Lock, Clock, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type IncidentStatus = Database["public"]["Enums"]["incident_status"];

const statusConfig: Record<IncidentStatus, { icon: React.ReactNode; label: string; color: string }> = {
  new: { icon: <AlertTriangle className="h-5 w-5" />, label: "New — Under Review", color: "bg-primary/20 text-primary border-primary/30" },
  in_progress: { icon: <Clock className="h-5 w-5" />, label: "In Progress", color: "bg-accent/20 text-accent border-accent/30" },
  escalated: { icon: <AlertTriangle className="h-5 w-5" />, label: "Escalated", color: "bg-destructive/20 text-destructive border-destructive/30" },
  resolved: { icon: <CheckCircle className="h-5 w-5" />, label: "Resolved", color: "bg-primary/10 text-primary/70 border-primary/20" },
  closed: { icon: <CheckCircle className="h-5 w-5" />, label: "Closed", color: "bg-muted text-muted-foreground border-border" },
};

const TrackTicket = () => {
  const [ticketCode, setTicketCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ticket_code: string;
    status: IncidentStatus;
    issue_type: string;
    created_at: string;
    updated_at: string;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = ticketCode.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);

    const { data, error } = await supabase
      .from("complaints")
      .select("ticket_code, status, issue_type, created_at, updated_at")
      .eq("ticket_code", code)
      .maybeSingle();

    if (error) {
      toast.error("Something went wrong. Please try again.");
    } else if (!data) {
      setNotFound(true);
    } else {
      setResult(data);
    }
    setLoading(false);
  };

  const formatIssueType = (type: string) =>
    type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const statusInfo = result ? statusConfig[result.status] : null;

  return (
    <div className="min-h-screen bg-background cyber-bg-grid">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-bold font-mono text-foreground">Genxdual Cyber</h1>
              <p className="text-xs text-muted-foreground">Emergency Help Desk</p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 cyber-border">
            <Lock className="h-3 w-3 text-primary" />
            <span className="text-xs text-primary font-medium">Secure Connection</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 cyber-border flex items-center justify-center cyber-glow">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-mono text-foreground">Track Your Incident</h2>
            <p className="text-sm text-muted-foreground">Enter your ticket code to check the status of your report</p>
          </div>

          <form onSubmit={handleSearch} className="bg-card rounded-xl cyber-border p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ticket Code</label>
              <Input
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                placeholder="GCX-XXXX-XXXX"
                className="bg-secondary border-border font-mono text-center text-lg tracking-wider"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full cyber-gradient">
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Searching..." : "Track Incident"}
            </Button>
          </form>

          {notFound && (
            <div className="bg-card rounded-xl cyber-border p-6 text-center space-y-2">
              <AlertTriangle className="h-8 w-8 mx-auto text-warning" />
              <p className="text-sm text-foreground font-medium">Ticket not found</p>
              <p className="text-xs text-muted-foreground">Please double-check your ticket code and try again.</p>
            </div>
          )}

          {result && statusInfo && (
            <div className="bg-card rounded-xl cyber-border p-6 space-y-5">
              <div className="text-center space-y-2">
                <code className="text-xl font-mono font-bold text-primary cyber-text-glow">{result.ticket_code}</code>
              </div>

              <div className="flex justify-center">
                <Badge variant="outline" className={`text-sm px-4 py-2 gap-2 ${statusInfo.color}`}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Issue Type</span>
                  <span className="text-sm text-foreground">{formatIssueType(result.issue_type)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Submitted</span>
                  <span className="text-sm text-foreground">{new Date(result.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Last Updated</span>
                  <span className="text-sm text-foreground">{new Date(result.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <Link to="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              Report a new incident <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrackTicket;
