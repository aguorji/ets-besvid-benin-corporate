import React, { useState } from 'react';
import { Menu, X, Phone, Mail, MessageSquare } from 'lucide-react';

export default function Layout({ children, activePage, setActivePage }) {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'products', label: 'Products & Services' },
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Navigation Header */}
      <nav className="bg-navy border-b-2 border-gold px-6 md:px-12 h-16 sticky top-0 z-50 flex items-center justify-between">
        <div className="cursor-pointer" onClick={() => setActivePage('home')}>
          <span className="font-serif text-[17px] font-bold text-gold-light block tracking-tight">ETS Besvid Benin</span>
          <span className="text-[9px] text-white/50 block tracking-[0.18em] uppercase">Est. 2007 · Cotonou, Bénin</span>
        </div>

        <ul className="hidden md:flex gap-7 list-none">
          {navLinks.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => setActivePage(link.id)}
                className={`text-[12px] font-medium tracking-wider uppercase transition-colors ${
                  activePage === link.id ? 'text-gold-light font-semibold' : 'text-white/75 hover:text-gold-light'
                }`}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        <button 
          onClick={() => setActivePage('contact')} 
          className="hidden md:block bg-gold text-navy px-4 py-2 text-[11px] font-bold tracking-wider uppercase rounded-sm hover:bg-gold-light transition-all"
        >
          Get a Quote
        </button>

        <button className="md:hidden text-white/80" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-navy-mid border-b-2 border-gold z-40 p-6 flex flex-col gap-4 animate-fadeIn">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => { setActivePage(link.id); setIsOpen(false); }}
              className={`text-left text-sm font-medium uppercase py-2 border-b border-white/10 ${
                activePage === link.id ? 'text-gold-light' : 'text-white/80'
              }`}
            >
              {link.label}
            </button>
          ))}
          <button 
            onClick={() => { setActivePage('contact'); setIsOpen(false); }} 
            className="mt-2 bg-gold text-navy text-center py-3 font-bold uppercase rounded-sm"
          >
            Get a Quote
          </button>
        </div>
      )}

      {/* Primary Layout Engine */}
      <main className="flex-grow">{children}</main>

      {/* Footer System */}
      <footer className="bg-[#07111F] px-6 md:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left border-t border-navy">
        <div className="font-serif text-sm text-gold font-bold">ETS Besvid Benin</div>
        <div className="text-[11px] text-white/30">© 2007–2026 ETS Besvid Benin · Cotonou, République du Bénin</div>
        <div className="flex gap-5 text-[11px] uppercase tracking-wider">
          {navLinks.map(l => (
            <button key={l.id} onClick={() => setActivePage(l.id)} className="text-white/40 hover:text-gold-light transition-colors">
              {l.label}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}