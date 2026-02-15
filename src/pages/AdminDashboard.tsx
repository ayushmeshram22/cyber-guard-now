import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Lock, LogOut, AlertTriangle, CheckCircle, Clock, Users, FileWarning, MessageSquare, Send, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import AnalyticsCharts from "@/components/AnalyticsCharts";

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
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<Array<{ id: string; content: string; created_at: string }>>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
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

  const fetchNotes = async (complaintId: string) => {
    const { data } = await supabase
      .from("incident_notes")
      .select("id, content, created_at")
      .eq("complaint_id", complaintId)
      .order("created_at", { ascending: false });
    setNotes(data || []);
  };

  const selectComplaint = (c: Complaint) => {
    setSelectedComplaint(c);
    fetchNotes(c.id);
  };

  const addNote = async () => {
    if (!noteText.trim() || !selectedComplaint) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("incident_notes").insert({
      complaint_id: selectedComplaint.id,
      author_id: user.id,
      content: noteText.trim(),
    });

    if (error) {
      toast.error("Failed to add note");
    } else {
      toast.success("Note added");
      setNoteText("");
      fetchNotes(selectedComplaint.id);
    }
  };

  const updateStatus = async (id: string, status: IncidentStatus) => {
    const complaint = complaints.find((c) => c.id === id);
    const oldStatus = complaint?.status;

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

      // Send notification to reporter if they have an email
      if (complaint?.email) {
        supabase.functions.invoke("notify-status-change", {
          body: {
            ticketCode: complaint.ticket_code,
            fullName: complaint.full_name,
            email: complaint.email,
            oldStatus,
            newStatus: status,
          },
        }).catch((err) => console.warn("Status notification failed:", err));
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

  const formatIssueType = (type: string) =>
    type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="min-h-screen bg-background cyber-bg-grid">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-lg font-bold font-mono">
                Genxdual <span className="text-primary">Cyber</span>
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">Emergency Help Desk</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 cyber-border">
              <Lock className="h-3 w-3 text-primary" />
              <span className="text-xs text-primary font-mono tracking-wider uppercase">Secure Connection</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="cyber-border">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
          </div>
          <Badge variant="outline" className="cyber-border text-primary font-mono text-xs tracking-wider px-3 py-1.5">
            Response Team
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard icon={<Users className="h-5 w-5" />} label="Total Reports" value={stats.total} />
          <KPICard icon={<AlertTriangle className="h-5 w-5" />} label="New" value={stats.new} accent />
          <KPICard icon={<Clock className="h-5 w-5" />} label="Escalated" value={stats.escalated} destructive />
          <KPICard icon={<CheckCircle className="h-5 w-5" />} label="Closed" value={stats.closed} />
        </div>

        {/* Analytics Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="cyber-border"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {showAnalytics ? "Hide Analytics" : "Show Analytics"}
        </Button>

        {showAnalytics && <AnalyticsCharts complaints={complaints} />}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incident List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="bg-card rounded-xl cyber-border p-8 text-center text-muted-foreground">Loading...</div>
            ) : complaints.length === 0 ? (
              <div className="bg-card rounded-xl cyber-border p-8 text-center text-muted-foreground">No incidents reported yet.</div>
            ) : (
              complaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => selectComplaint(c)}
                  className={`bg-card rounded-xl cyber-border p-4 cursor-pointer hover:cyber-glow transition-all ${
                    selectedComplaint?.id === c.id ? "cyber-glow border-primary/40" : ""
                  } ${c.status === "escalated" ? "border-l-4 border-l-destructive" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs font-mono text-primary">{c.ticket_code}</code>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[c.status]}`}>
                          <span className="mr-1">
                            {c.status === "new" ? "⚠" : c.status === "escalated" ? "🔴" : c.status === "closed" || c.status === "resolved" ? "✅" : "🔄"}
                          </span>
                          {c.status.replace("_", " ").charAt(0).toUpperCase() + c.status.replace("_", " ").slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatIssueType(c.issue_type)} · {new Date(c.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      {userRole !== "auditor" && (
                        <Select
                          value={c.status}
                          onValueChange={(val) => updateStatus(c.id, val as IncidentStatus)}
                        >
                          <SelectTrigger className="w-32 bg-secondary border-border text-xs h-9">
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
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail Panel */}
          <div className="bg-card rounded-xl cyber-border overflow-hidden sticky top-20 self-start">
            <div className="p-4 border-b border-border">
              <h3 className="text-base font-bold font-mono text-foreground">Incident Detail</h3>
            </div>
            {selectedComplaint ? (
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-3">
                  <DetailRow label="Ticket" value={selectedComplaint.ticket_code} mono />
                  <DetailRow label="Name" value={selectedComplaint.full_name} />
                  <DetailRow label="User ID" value={selectedComplaint.user_identifier} />
                  <DetailRow label="Phone" value={selectedComplaint.phone || "—"} />
                  <DetailRow label="Email" value={selectedComplaint.email || "—"} />
                  <DetailRow label="Type" value={formatIssueType(selectedComplaint.issue_type)} />
                  <DetailRow label="Priority">
                    <Badge variant="outline" className={`text-[10px] ${priorityColors[selectedComplaint.priority]}`}>
                      {selectedComplaint.priority.toUpperCase()}
                    </Badge>
                  </DetailRow>
                  <DetailRow label="Status">
                    <Badge variant="outline" className={`text-[10px] ${statusColors[selectedComplaint.status]}`}>
                      {selectedComplaint.status.replace("_", " ")}
                    </Badge>
                  </DetailRow>
                  <DetailRow label="Date" value={new Date(selectedComplaint.created_at).toLocaleString()} />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Description</span>
                  <p className="text-sm text-foreground bg-secondary rounded-lg p-3 leading-relaxed">{selectedComplaint.description}</p>
                </div>

                {/* Notes section */}
                {userRole !== "auditor" && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Internal Notes</span>
                    </div>

                    {notes.map((note) => (
                      <div key={note.id} className="bg-secondary rounded-lg p-3 space-y-1">
                        <p className="text-sm text-foreground">{note.content}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(note.created_at).toLocaleString()}</p>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add a note..."
                        className="bg-secondary border-border text-sm min-h-[60px]"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={addNote}
                      disabled={!noteText.trim()}
                      className="w-full cyber-gradient"
                    >
                      <Send className="h-3 w-3 mr-2" />
                      Add Note
                    </Button>
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
  icon, label, value, accent, destructive,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
  destructive?: boolean;
}) => (
  <div className={`bg-card rounded-xl cyber-border p-5 space-y-3 ${destructive ? "border-destructive/20" : accent ? "border-primary/20" : ""}`}>
    <div className="flex items-center gap-2">
      <span className={`${destructive ? "text-destructive" : accent ? "text-primary" : "text-muted-foreground"}`}>{icon}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className={`text-3xl font-bold font-mono ${destructive ? "text-destructive" : accent ? "text-primary" : "text-foreground"}`}>{value}</p>
  </div>
);

const DetailRow = ({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs text-muted-foreground">{label}</span>
    {children || <span className={`text-sm text-foreground ${mono ? "font-mono text-primary" : ""}`}>{value}</span>}
  </div>
);

export default AdminDashboard;
