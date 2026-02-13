import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Upload, X, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const issueTypes = [
  { value: "scam", label: "Scam" },
  { value: "phishing", label: "Phishing" },
  { value: "online_fraud", label: "Online Fraud" },
  { value: "hacking_attempt", label: "Hacking Attempt" },
  { value: "malware", label: "Malware / Suspicious Link" },
  { value: "social_media_threat", label: "Social Media Threat" },
  { value: "other", label: "Other" },
] as const;

const formSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  userId: z.string().trim().min(1, "Student ID / User ID is required").max(50),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  issueType: z.enum(["scam", "phishing", "online_fraud", "hacking_attempt", "malware", "social_media_threat", "other"]),
  description: z.string().trim().min(10, "Please describe the incident in at least 10 characters").max(5000),
  consent: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface IncidentFormProps {
  onSuccess: (ticketCode: string) => void;
}

const getPriority = (issueType: string): string => {
  switch (issueType) {
    case "scam":
    case "phishing":
    case "online_fraud":
      return "high";
    case "hacking_attempt":
      return "medium";
    default:
      return "low";
  }
};

const IncidentForm = ({ onSuccess }: IncidentFormProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      userId: "",
      phone: "",
      email: "",
      description: "",
      consent: false,
    },
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: Unsupported file type`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: File exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    setFiles((prev) => {
      const combined = [...prev, ...valid].slice(0, MAX_FILES);
      if (prev.length + valid.length > MAX_FILES) {
        toast.warning(`Maximum ${MAX_FILES} files allowed`);
      }
      return combined;
    });
    e.target.value = "";
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      // Generate ticket code
      const { data: ticketData, error: ticketError } = await supabase.rpc("generate_ticket_code");
      if (ticketError) throw ticketError;
      const ticketCode = ticketData as string;

      // Insert complaint
      const { error: complaintError } = await supabase
        .from("complaints")
        .insert({
          ticket_code: ticketCode,
          full_name: values.fullName,
          user_identifier: values.userId,
          phone: values.phone || null,
          email: values.email || null,
          issue_type: values.issueType,
          description: values.description,
          priority: getPriority(values.issueType) as "high" | "medium" | "low",
          consent_notifications: values.consent,
        });

      if (complaintError) throw complaintError;

      // Upload files using ticket code as folder
      for (const file of files) {
        const filePath = `${ticketCode}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("incident-attachments")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("incident-attachments")
          .getPublicUrl(filePath);

        // Attachments are stored in storage and can be found by ticket code folder
      }

      onSuccess(ticketCode);
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-12" id="report-form">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-xl cyber-border cyber-glow p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold font-mono text-foreground">Report a Cyber Incident</h2>
              <p className="text-sm text-muted-foreground">
                Fill out the form below to submit your incident report
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} className="bg-secondary border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student ID / User ID *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your ID" {...field} className="bg-secondary border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Recommended" {...field} className="bg-secondary border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" type="email" {...field} className="bg-secondary border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="issueType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-secondary border-border">
                            <SelectValue placeholder="Select the type of incident" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {issueTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Describe the Incident *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide detailed information about the incident..."
                          className="min-h-[120px] bg-secondary border-border"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* File Upload */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Upload Screenshots / Evidence
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/40 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag files here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, PDF, WEBP · Max 5 files · 10MB each
                      </p>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-secondary">
                          {file.type.startsWith("image/") ? (
                            <Image className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                          )}
                          <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                          <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Consent */}
                <FormField
                  control={form.control}
                  name="consent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 rounded-lg bg-secondary">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-foreground">
                          I consent to receive SMS, Email, and WhatsApp updates regarding my report.
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 text-base font-semibold cyber-gradient"
                  size="lg"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  {submitting ? "Submitting Report..." : "Report Cyber Issue"}
                </Button>
              </form>
            </Form>

            <p className="text-xs text-center text-muted-foreground">
              All information is confidential and used strictly for cybersecurity support and investigation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IncidentForm;
