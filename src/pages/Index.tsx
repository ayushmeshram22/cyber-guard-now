import { useState } from "react";
import CyberHeader from "@/components/CyberHeader";
import HeroSection from "@/components/HeroSection";
import IncidentForm from "@/components/IncidentForm";
import SuccessPage from "@/components/SuccessPage";
import SupportOptions from "@/components/SupportOptions";

const Index = () => {
  const [ticketCode, setTicketCode] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background cyber-bg-grid">
      <CyberHeader />
      {ticketCode ? (
        <SuccessPage ticketCode={ticketCode} onReset={() => setTicketCode(null)} />
      ) : (
        <>
          <HeroSection />
          <IncidentForm onSuccess={setTicketCode} />
          <SupportOptions />
        </>
      )}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 Genxdual Cyber Emergency Help Desk · All rights reserved · 
          All information is confidential and used strictly for cybersecurity support.
        </p>
      </footer>
    </div>
  );
};

export default Index;
