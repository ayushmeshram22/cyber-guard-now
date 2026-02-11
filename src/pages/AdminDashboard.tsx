import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, LogOut, AlertTriangle, CheckCircle, Clock, FileWarning, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Complaint = Database["public"]["Tables"]["complaints"]["Row"];
type IncidentStatus = Database["public"]["Enums"]["incident_status"];

const statusColors: Record<IncidentStatus, string> = {
  new: "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-accent/20 text-accent border-accent/30",
  escalated: "bg-destructive/20 text-destructive border-destructive/30",
  resolved: "bg-primary/10 text-primary/70 border-primary/20",
  closed: "bg-muted text-muted-foreground border-border",
};

const priorityColors: Record<string, string> = {
  high: "bg-destructive/20 text-destructive border-destructive/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  low: "bg-muted text-muted-foreground border-border",
};

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!roles || roles.length === 0) {
        navigate("/admin/login");
        return;
      }

      setUserRole(roles[0].role);
      await fetchComplaints();
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/admin/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch incidents");
    } else {
      setComplaints(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: IncidentStatus) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success("Status updated");
      fetchComplaints();
      if (selectedComplaint?.id === id) {
        setSelectedComplaint((prev) => prev ? { ...prev, status } : null);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const stats = {
    total: complaints.length,
    new: complaints.filter((c) => c.status === "new").length,
    escalated: complaints.filter((c) => c.status === "escalated").length,
    closed: complaints.filter((c) => c.status === "closed" || c.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-lg font-bold font-mono text-foreground">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Genxdual Cyber · {userRole.replace("_", " ").toUpperCase()}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="cyber-border">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard icon={<Users className="h-5 w-5" />} label="Total Reports" value={stats.total} />
          <KPICard icon={<Clock className="h-5 w-5" />} label="New" value={stats.new} accent />
          <KPICard icon={<AlertTriangle className="h-5 w-5" />} label="Escalated" value={stats.escalated} destructive />
          <KPICard icon={<CheckCircle className="h-5 w-5" />} label="Closed" value={stats.closed} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incident List */}
          <div className="lg:col-span-2 bg-card rounded-xl cyber-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-base font-bold font-mono text-foreground">Incidents</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : complaints.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No incidents reported yet.</div>
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {complaints.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedComplaint(c)}
                    className={`p-4 cursor-pointer hover:bg-secondary/50 transition-colors ${
                      selectedComplaint?.id === c.id ? "bg-secondary/50" : ""
                    } ${c.status === "escalated" ? "border-l-2 border-l-destructive" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-primary">{c.ticket_code}</code>
                          <Badge variant="outline" className={`text-[10px] ${priorityColors[c.priority]}`}>
                            {c.priority}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">{c.full_name}</p>
                        <p className="text-xs text-muted-foreground">{c.issue_type.replace("_", " ")} · {new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColors[c.status]}`}>
                        {c.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="bg-card rounded-xl cyber-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-base font-bold font-mono text-foreground">Incident Detail</h2>
            </div>
            {selectedComplaint ? (
              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                <div className="space-y-3">
                  <DetailRow label="Ticket" value={selectedComplaint.ticket_code} mono />
                  <DetailRow label="Name" value={selectedComplaint.full_name} />
                  <DetailRow label="User ID" value={selectedComplaint.user_identifier} />
                  <DetailRow label="Phone" value={selectedComplaint.phone || "N/A"} />
                  <DetailRow label="Email" value={selectedComplaint.email || "N/A"} />
                  <DetailRow label="Type" value={selectedComplaint.issue_type.replace("_", " ")} />
                  <DetailRow label="Priority" value={selectedComplaint.priority} />
                  <DetailRow label="Date" value={new Date(selectedComplaint.created_at).toLocaleString()} />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Description</span>
                  <p className="text-sm text-foreground bg-secondary rounded-lg p-3">{selectedComplaint.description}</p>
                </div>

                {/* Status Update */}
                {userRole !== "auditor" && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">Update Status</span>
                    <Select
                      value={selectedComplaint.status}
                      onValueChange={(val) => updateStatus(selectedComplaint.id, val as IncidentStatus)}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="escalated">Escalated</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <FileWarning className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Select an incident to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({
  icon,
  label,
  value,
  accent,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
  destructive?: boolean;
}) => (
  <div className={`bg-card rounded-xl cyber-border p-4 space-y-2 ${destructive ? "border-destructive/30" : accent ? "border-primary/30" : ""}`}>
    <div className={`${destructive ? "text-destructive" : accent ? "text-primary" : "text-muted-foreground"}`}>
      {icon}
    </div>
    <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

const DetailRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-sm text-foreground ${mono ? "font-mono text-primary" : ""}`}>{value}</span>
  </div>
);

export default AdminDashboard;
