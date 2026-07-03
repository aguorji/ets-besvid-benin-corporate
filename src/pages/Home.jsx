import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Shirt, ShieldCheck, Globe, User } from 'lucide-react';

// Core Warehouse & Inventory Media Reel Array
const WAREHOUSE_IMAGES = [
  "/images/bales-mens-mix.jpg",
  "/images/bales-summer-dress.jpg",
  "/images/bale-500kg-magazine-1.jpg", 
  "/images/bale-500kg-magazine-2.jpg", 
  "/images/sorting-heaps-rags-1.jpg",   
  "/images/sorting-heaps-rags-2.jpg"    
];

export default function Home({ setActivePage }) { 
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const slides = [
    { 
      id: "bales",
      isInventoryReel: true, 
      icon: <Shirt size={20} className="text-gold" />, 
      label: "Premium Clothing Bales", 
      caption: "Grade A & B, Europe Sourced" 
    },
    { 
      id: "corridor",
      icon: <Globe size={20} className="text-gold" />, 
      label: "West African Logistics Corridor", 
      caption: "Cotonou – Lagos Ecosystem" 
    },
    { 
      id: "trust",
      isDirectorSlide: true,
      icon: <ShieldCheck size={20} className="text-gold" />, 
      label: "18+ Years Corporate Trust", 
      caption: "Established 2007" 
    }
  ];

  // Primary Carousel Slider Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Internal Warehouse Image Cycler
  useEffect(() => {
    const imgTimer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % WAREHOUSE_IMAGES.length);
    }, 2500);
    return () => clearInterval(imgTimer);
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-navy relative overflow-hidden min-h-[480px] flex items-center pb-12 md:pb-0">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#C9A84C_1px,transparent_1px),linear-gradient(to_bottom,#C9A84C_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 relative z-10">
          
          {/* Left Text and Action Column */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="text-gold text-[10px] font-semibold tracking-[0.22em] uppercase mb-4 flex items-center gap-2">
              <span className="w-7 h-[2px] bg-gold block"></span> West Africa's Trusted Trade Partner
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              Premium Goods.<br /><span className="text-gold-light">Reliable Trade.</span><br />West Africa.
            </h1>
            <p className="text-sm leading-relaxed text-white/60 max-w-sm mb-7">
              Over 18 years connecting global suppliers with Benin, Nigeria, and the broader West African market — from premium used clothing bales to agri-food products and market entry consulting.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setActivePage('products')} className="bg-gold text-navy text-[12px] font-bold tracking-wider uppercase px-6 py-3 rounded-sm flex items-center gap-1 hover:bg-gold-light transition-colors cursor-pointer">
                Explore Products <ArrowUpRight size={14} />
              </button>
              
              {/* Updated: Routed to target view 'team' for future Team.jsx display */}
              <button onClick={() => setActivePage('team')} className="border border-white/30 text-white text-[12px] font-bold tracking-wider uppercase px-6 py-3 rounded-sm hover:bg-white/5 transition-colors cursor-pointer">
                Consult Our Team
              </button>
            </div>
          </div>

          {/* Stateful Slider Column with Bottom Text Overlay Container */}
          <div className="bg-navy-mid min-h-[380px] md:min-h-[460px] relative flex flex-col justify-between p-6 overflow-hidden border-l border-white/5">
            
            {/* 1. Dynamic Background Media Layer */}
            <div className="absolute inset-0 z-0 w-full h-full">
              {slides[currentSlide].isInventoryReel && (
                <div className="w-full h-full relative bg-navy">
                  {WAREHOUSE_IMAGES.map((imgSrc, idx) => (
                    <img
                      key={imgSrc}
                      src={imgSrc}
                      alt="ETS Besvid Benin Operations Stock"
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                        idx === currentImageIndex ? 'opacity-40' : 'opacity-0'
                      }`}
                    />
                  ))}
                </div>
              )}

              {slides[currentSlide].isDirectorSlide && (
                <div className="w-full h-full bg-navy relative">
                  <img
                    src="/images/director.jpg"
                    alt="Managing Director"
                    className="absolute inset-0 w-full h-full object-cover opacity-35"
                  />
                </div>
              )}

              {!slides[currentSlide].isInventoryReel && !slides[currentSlide].isDirectorSlide && (
                <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,#112540,transparent)] opacity-60"></div>
              )}
            </div>

            {/* 2. Top Navigation Dots Indicators */}
            <div className="relative z-10 flex justify-end gap-1.5 pt-2">
              {slides.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setCurrentSlide(idx)} 
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${idx === currentSlide ? 'bg-gold scale-110 shadow-xs' : 'bg-white/20'}`}
                ></button>
              ))}
            </div>

            <div className="flex-grow"></div>

            {/* 3. Rectangle Information Panel Docked at Base */}
            <div className="relative z-10 mt-auto bg-navy/85 border border-white/10 p-4 rounded-sm shadow-xl backdrop-blur-md flex items-center gap-3">
              <div className="w-9 h-9 border border-gold/40 rounded-sm flex items-center justify-center bg-navy flex-shrink-0 text-gold shadow-sm">
                {slides[currentSlide].isDirectorSlide ? (
                  <User size={18} />
                ) : (
                  slides[currentSlide].icon
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-sm font-bold text-gold-light truncate tracking-wide">
                  {slides[currentSlide].label}
                </h3>
                <p className="text-[11px] text-white/70 truncate tracking-wide mt-0.5 font-medium">
                  {slides[currentSlide].caption}
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Numerical Data Band */}
      <section className="bg-gold px-8 py-5 flex justify-around flex-wrap gap-4 text-center">
        <div>
          <div className="font-serif text-2xl font-bold text-navy">2007</div>
          <div className="text-[10px] font-semibold text-navy/65 tracking-wider uppercase">Established</div>
        </div>
        <div className="hidden md:block w-[1px] bg-navy/20 h-9 self-center"></div>
        <div>
          <div className="font-serif text-2xl font-bold text-navy">100%</div>
          <div className="text-[10px] font-semibold text-navy/65 tracking-wider uppercase">Grade Certified</div>
        </div>
        <div className="hidden md:block w-[1px] bg-navy/20 h-9 self-center"></div>
        <div>
          <div className="font-serif text-2xl font-bold text-navy">48 hrs</div>
          <div className="text-[10px] font-semibold text-navy/65 tracking-wider uppercase">Quote Response</div>
        </div>
      </section>
    </div>
  );
}