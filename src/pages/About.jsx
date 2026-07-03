import React from 'react';
import { ArrowUpRight, Globe, Shirt, ShieldCheck, Heart, Award, Zap, Anchor } from 'lucide-react';

export default function About({ setActivePage }) {
  const timelineData = [
    { year: '2007', heading: 'ETS Besvid Benin Established', desc: 'Launched as a wholesale used clothing supplier, importing premium bales from Europe for distribution across local and regional markets in Benin.', highlight: true },
    { year: '2010', heading: 'Regional Distribution Network Built', desc: 'Established partnerships with distributors and retailers across southern Benin and the Nigerian border corridor, increasing volume and product diversity.', highlight: false },
    { year: '2014', heading: 'Trade Consulting Services Launched', desc: 'Formalised consulting offerings to support foreign businesses seeking to enter the Benin and Nigeria markets, leveraging accumulated regulatory and logistics expertise.', highlight: false },
    { year: '2018', heading: 'New Verticals Added', desc: 'Extended services beyond textiles to include agricultural and food product sourcing, responding to growing demand from regional buyers and international suppliers.', highlight: false },
    { year: '2026', heading: 'Nearly Two Decades of Trusted Operations', desc: 'Today ETS Besvid Benin remains one of Cotonou\'s most established trade enterprises — continuing to deliver quality goods, expert counsel, and reliable partnerships across West Africa.', highlight: true }
  ];

  const coreValues = [
    { icon: <Award className="text-gold" size={24} />, title: 'Integrity First', desc: 'Every transaction is built on honest terms. We say what we mean, deliver what we promise, and maintain transparency at every stage.' },
    { icon: <Shirt className="text-gold" size={24} />, title: 'Consistent Quality', desc: 'We source and grade all products to a high standard. Clients know exactly what they\'re receiving — no surprises, no shortcuts.' },
    { icon: <Globe className="text-gold" size={24} />, title: 'Local Knowledge', desc: 'Nearly two decades on the ground in Cotonou means we understand the nuances of West African trade protocols better than anyone.' },
    { icon: <Heart className="text-gold" size={24} />, title: 'Long-Term Partnerships', desc: 'We invest in relationships, not just transactions. Our most valued clients have worked with us for years.' },
    { icon: <Zap className="text-gold" size={24} />, title: 'Operational Reliability', desc: 'Supply chains depend on dependable partners. We coordinate logistics and follow through on every single commitment.' },
    { icon: <Anchor className="text-gold" size={24} />, title: 'Growth Mindset', desc: 'We continuously expand our sourcing networks and adapt our services so our clients always have access to the best opportunities.' }
  ];

  return (
    <div className="bg-white">
      {/* Page Hero */}
      <section className="bg-navy relative overflow-hidden py-16 md:py-24 text-white">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#C9A84C_1px,transparent_1px),linear-gradient(to_bottom,#C9A84C_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="text-gold text-[10px] font-bold tracking-widest uppercase mb-3">Home / About Us</div>
          <h1 className="font-serif text-3xl md:text-5xl font-black mb-6 leading-tight">
            Rooted in <span className="text-gold-light">Cotonou.</span><br />Connected to the World.
          </h1>
          <p className="text-sm md:text-base leading-relaxed text-white/75 max-w-2xl mx-auto mb-6">
            Since 2007, ETS Besvid Benin has been a cornerstone of West African trade — supplying premium goods and guiding businesses through one of Africa's most dynamic commercial corridors.
          </p>
          <div className="w-12 h-0.5 bg-gold mx-auto"></div>
        </div>
      </section>

      {/* Mission Strip */}
      <div className="bg-gold px-6 py-6 text-center">
        <div className="max-w-2xl mx-auto font-serif text-sm md:text-base font-bold text-navy leading-relaxed">
          "Our mission is to be the most trusted bridge between international suppliers and West African markets — delivering quality goods and expert guidance with integrity."
          <span className="block font-sans text-[11px] font-medium opacity-70 uppercase tracking-wider mt-2">— ETS Besvid Benin, Founded 2007</span>
        </div>
      </div>

      {/* Story Section */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-gold text-[10px] font-bold tracking-widest uppercase block mb-2">Our Story</span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-navy mb-5">18 Years of Trade at the Heart of West Africa</h2>
          <div className="space-y-4 text-text-mid text-xs leading-relaxed">
            <p>ETS Besvid Benin was founded in 2007 in Cotonou, Republic of Benin — a city renowned as one of West Africa's most active commercial hubs. From day one, our focus was clear: build reliable supply chains, foster honest trade relationships, and create real value for our partners on both sides of the transaction.</p>
            <p>What began as a wholesale used clothing operation has grown into a multi-service trade enterprise. Today we source premium clothing bales from Europe and North America, consult businesses entering the Benin and Nigeria markets, and facilitate the movement of agri-food products across the region.</p>
            <p>Our strength lies not just in the goods we move, but in the networks we have built — with customs authorities, freight partners, regional distributors, and international suppliers — over nearly two decades of consistent, principled work.</p>
          </div>
        </div>

        {/* Blueprint Visual Sidecard */}
        <div className="bg-navy rounded p-6 relative overflow-hidden border border-gold/10">
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#C9A84C_1px,transparent_1px),linear-gradient(to_bottom,#C9A84C_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <div className="relative z-10 text-white">
            <div className="font-serif text-5xl font-black text-gold mb-1">2007</div>
            <div className="text-[10px] font-semibold text-white/50 tracking-wider uppercase mb-6">Year of Founding · Cotonou, Bénin</div>
            
            <div className="space-y-4">
              <div className="flex gap-3 items-start text-xs text-white/70">
                <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0 text-[14px]">🌍</div>
                <div><strong className="block text-gold-light font-medium">West African Reach</strong>Benin, Nigeria & regional partners</div>
              </div>
              <div className="flex gap-3 items-start text-xs text-white/70">
                <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0 text-[14px]">👕</div>
                <div><strong className="block text-gold-light font-medium">Premium Clothing Bales</strong>Grade A & B, Europe & North America sourced</div>
              </div>
              <div className="flex gap-3 items-start text-xs text-white/70">
                <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0 text-[14px]">🤝</div>
                <div><strong className="block text-gold-light font-medium">Trade Consulting</strong>Market entry, customs & distribution expertise</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-off-white py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-gold text-[10px] font-bold tracking-widest uppercase block mb-1">Our Journey</span>
            <h2 className="font-serif text-2xl font-bold text-navy">Milestones & Growth</h2>
            <div className="w-8 h-0.5 bg-gold mx-auto mt-3"></div>
          </div>

          <div className="relative border-l-2 border-gold/30 ml-4 pl-6 space-y-8">
            {timelineData.map((item, index) => (
              <div key={index} className="relative">
                {/* Timeline Node Dot */}
                <span className={`absolute -left-[32px] top-1 w-3.5 h-3.5 rounded-full border-2 border-gold ${item.highlight ? 'bg-gold scale-110' : 'bg-navy'}`}></span>
                <div className="text-[10px] font-bold text-gold uppercase tracking-wider mb-0.5">{item.year}</div>
                <h4 className="font-serif text-sm font-bold text-navy mb-1">{item.heading}</h4>
                <p className="text-text-mid text-xs leading-relaxed max-w-xl">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Grid Section */}
      <section className="bg-navy text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-gold-light text-[10px] font-bold tracking-widest uppercase block mb-1">What Guides Us</span>
            <h2 className="font-serif text-2xl font-bold">Our Core Values</h2>
            <div className="w-8 h-0.5 bg-gold mx-auto mt-3"></div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {coreValues.map((value, idx) => (
              <div key={idx} className="border border-gold/10 rounded p-5 hover:border-gold/30 hover:bg-white/5 transition-all">
                <div className="mb-3 text-[22px]">{value.icon}</div>
                <h4 className="text-xs font-semibold text-gold-light tracking-wider uppercase mb-2">{value.title}</h4>
                <p className="text-white/50 text-[11px] leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Key Markets */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="text-gold text-[10px] font-bold tracking-widest uppercase block mb-1">Where We Operate</span>
          <h2 className="font-serif text-2xl font-bold text-navy">Our Key Markets</h2>
          <div className="w-8 h-0.5 bg-gold mx-auto mt-3"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-off-white border border-navy/10 rounded p-6 hover:border-gold/30 transition-all flex gap-4 items-start">
            <span className="text-3xl select-none shrink-0">🇧🇯</span>
            <div>
              <h4 className="font-serif text-base font-bold text-navy mb-0.5">Republic of Benin</h4>
              <span className="text-[9px] font-bold uppercase tracking-wider text-gold block mb-3">Home Market · Headquarters</span>
              <p className="text-text-mid text-xs leading-relaxed mb-4">Cotonou is our base and one of West Africa's premier trading cities. We operate across the full Beninese market with strong local relationships at every level of the supply chain.</p>
              <ul className="space-y-1.5 text-[11px] text-text-mid">
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gold shrink-0"></span> Wholesale clothing distribution nationwide</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gold shrink-0"></span> Regulatory & customs navigation</li>
              </ul>
            </div>
          </div>

          <div className="bg-off-white border border-navy/10 rounded p-6 hover:border-gold/30 transition-all flex gap-4 items-start">
            <span className="text-3xl select-none shrink-0">🇳🇬</span>
            <div>
              <h4 className="font-serif text-base font-bold text-navy mb-0.5">Nigeria</h4>
              <span className="text-[9px] font-bold uppercase tracking-wider text-gold block mb-3">Key Export & Consulting Market</span>
              <p className="text-text-mid text-xs leading-relaxed mb-4">Nigeria is Africa's largest economy and one of the continent's most important used clothing markets. We facilitate cross-border trade and guide businesses navigating this complex ecosystem.</p>
              <ul className="space-y-1.5 text-[11px] text-text-mid">
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gold shrink-0"></span> Cross-border wholesale supply chains</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gold shrink-0"></span> Nigeria market entry consulting modules</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Lower Call To Action Band */}
      <div className="bg-off-white border-t border-navy/5 py-12 px-6 text-center">
        <h3 className="font-serif text-xl font-bold text-navy mb-1">Want to work with us?</h3>
        <p className="text-xs text-text-mid mb-6 max-w-sm mx-auto">Whether you're a supplier, buyer, or business exploring West Africa — we'd love to hear from you.</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => setActivePage('contact')} className="bg-navy text-gold-light text-[11px] font-bold tracking-wider uppercase px-5 py-3 rounded-sm hover:bg-navy-mid transition-colors flex items-center gap-1">Get In Touch →</button>
          <button onClick={() => setActivePage('products')} className="border border-navy/20 text-navy text-[11px] font-bold tracking-wider uppercase px-5 py-3 rounded-sm hover:bg-navy/5 transition-colors">View Our Services</button>
        </div>
      </div>
    </div>
  );
}