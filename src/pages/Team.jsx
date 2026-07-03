import React from 'react';
import { Shield, Truck, ClipboardCheck, Users, Mail, Phone, Briefcase } from 'lucide-react';

export default function Team() {
  // Executive Leadership (Sole Proprietor)
  const principalLeader = {
    name: "Managing Director", // You can replace this with your actual name
    role: "Founder & Managing Director",
    bio: "Established ETS Besvid Benin in 2007 in Cotonou. Over 18 years of pioneering international textile procurement, high-volume logistics coordination, and cross-border trade consulting throughout the West African economic corridor.",
    image: "/images/director.jpg",
    specialty: "International Trade Strategy & Supplier Relations"
  };

  // Operational Management & Key Staff Pillars
  const teamStaff = [
    {
      id: "staff-1",
      name: "Operations & Magazine Manager",
      role: "Head of Warehouse Operations",
      responsibilities: "Oversees bulk intake processing lines, 500kg giant bale volume segregation, inventory logs, and local sorting team coordination inside our primary Cotonou magazines.",
      icon: <Briefcase size={20} className="text-gold" />,
      tag: "Operations"
    },
    {
      id: "staff-2",
      name: "Logistics & Customs Coordinator",
      role: "Lead Cross-Border Transit Officer",
      responsibilities: "Manages port clearance logistics, sea-freight documentations, and secure transit freight lines connecting our Cotonou hub smoothly to Lagos networks.",
      icon: <Truck size={20} className="text-gold" />,
      tag: "Logistics"
    },
    {
      id: "staff-3",
      name: "Quality Assurance Supervisor",
      role: "Chief Grading Auditor",
      responsibilities: "Enforces our strict 100% Grade Certified standard, inspecting original European shipments down to individual bale category compositions.",
      icon: <ClipboardCheck size={20} className="text-gold" />,
      tag: "Quality Control"
    }
  ];

  return (
    <div className="min-h-screen bg-off-white text-navy font-sans pb-24">
      
      {/* 1. HERO TITLE BANNER */}
      <section className="bg-navy text-white py-16 border-b-2 border-gold relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#C9A84C_1px,transparent_1px),linear-gradient(to_bottom,#C9A84C_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center md:text-left">
          <span className="text-gold font-bold tracking-widest text-[10px] uppercase block mb-3 flex items-center justify-center md:justify-start gap-2">
            <Shield size={12} /> Corporate Governance
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight">Our Management &amp; Operations Team</h1>
          <p className="text-white/60 text-xs md:text-sm mt-3 max-w-xl leading-relaxed">
            Meet the operational framework behind ETS Besvid Benin. Driven by sole-proprietor leadership and backed by experienced logistics and sorting managers since 2007.
          </p>
        </div>
      </section>

      {/* 2. EXECUTIVE SOLE PROPRIETOR LEADERSHIP SPOTLIGHT */}
      <main className="max-w-6xl mx-auto px-6 mt-16">
        <div className="bg-white border border-navy/10 rounded-sm shadow-xs overflow-hidden grid md:grid-cols-12 gap-0">
          
          {/* Director Image Column */}
          <div className="md:col-span-4 bg-navy relative min-h-[320px] md:min-h-full">
            <img 
              src={principalLeader.image} 
              alt={principalLeader.name}
              className="absolute inset-0 w-full h-full object-cover opacity-90"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback frame if image is loading or missing locally */}
            <div className="hidden absolute inset-0 bg-navy-mid flex-col items-center justify-center text-gold/40 space-y-2 p-6 text-center">
              <Users size={48} />
              <span className="text-[10px] uppercase tracking-wider font-semibold">ETS Executive Portrait</span>
            </div>
          </div>

          {/* Director Bio Profile Column */}
          <div className="md:col-span-8 p-8 md:p-12 flex flex-col justify-between space-y-6 bg-[linear-gradient(135deg,rgba(201,168,76,0.02)_0%,transparent_100%)]">
            <div className="space-y-4">
              <div>
                <span className="text-gold text-[10px] font-bold tracking-widest uppercase block mb-1">Corporate Principal</span>
                <h2 className="font-serif text-2xl md:text-3xl font-black text-navy tracking-tight">{principalLeader.name}</h2>
                <p className="text-xs md:text-sm font-semibold text-navy/60 italic mt-0.5">{principalLeader.role}</p>
              </div>
              
              <p className="text-sm text-navy/80 leading-relaxed max-w-2xl pt-2">
                {principalLeader.bio}
              </p>
              
              <div className="inline-block bg-off-white border border-navy/5 rounded px-4 py-2 text-xs font-medium text-navy/70">
                <span className="font-bold text-navy text-gold-light mr-1">Core Focus:</span> {principalLeader.specialty}
              </div>
            </div>

            {/* Direct Official Contact Actions */}
            <div className="border-t border-navy/5 pt-6 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2 text-navy/70 font-medium">
                <Mail size={14} className="text-gold" />
                <span>management@ets-besvid.com</span>
              </div>
              <div className="hidden md:block text-navy/20">|</div>
              <div className="flex items-center gap-2 text-navy/70 font-medium">
                <Phone size={14} className="text-gold" />
                <span>Cotonou, Benin Republic Hub</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* 3. MANAGEMENT STAFF PILLARS GRID */}
      <section className="max-w-6xl mx-auto px-6 mt-16 space-y-6">
        <div>
          <h3 className="font-serif text-xl font-bold tracking-tight text-navy">Operational Infrastructure Pillars</h3>
          <p className="text-xs text-navy/50 mt-1">Dedicated professional staff managing our day-to-day warehouse mechanics, freight pipelines, and sorting lines.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teamStaff.map((staff) => (
            <div key={staff.id} className="bg-white border border-navy/10 p-6 rounded-sm shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div className="space-y-4">
                {/* Header Icon Badge Row */}
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 bg-navy rounded-sm flex items-center justify-center text-gold shadow-sm">
                    {staff.icon}
                  </div>
                  <span className="text-[9px] font-bold tracking-widest uppercase bg-gold/10 text-gold px-2 py-0.5 rounded border border-gold/10">
                    {staff.tag}
                  </span>
                </div>

                {/* Role Titles */}
                <div>
                  <h4 className="font-serif text-base font-bold text-navy leading-tight">{staff.name}</h4>
                  <p className="text-[11px] font-semibold text-navy/50 mt-0.5">{staff.role}</p>
                </div>

                {/* Job Summary Description */}
                <p className="text-xs text-navy/70 leading-relaxed font-normal">
                  {staff.responsibilities}
                </p>
              </div>

              {/* Verified Badge Footer */}
              <div className="border-t border-navy/5 pt-4 mt-6 text-[10px] font-bold tracking-wider text-navy/40 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-gold rounded-full"></span> Active Operation Asset
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}