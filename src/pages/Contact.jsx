import React, { useState, useEffect } from 'react';

export default function Contact({ predefinedCode }) {
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    subject: '',
    baleCode: predefinedCode || '',
    country: '',
    message: '',
    consent: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [hoursHTML, setHoursHTML] = useState([]);

  // Auto-fill or adjust if a predefined bale code comes from the products page
  useEffect(() => {
    if (predefinedCode) {
      setFormData(prev => ({
        ...prev,
        subject: 'product-code',
        baleCode: predefinedCode,
        message: `Hello,\n\nI am interested in exploring availability for Bale Code: ${predefinedCode}.\n\nPlease send pricing information.\n\nThank you.`
      }));
    }
  }, [predefinedCode]);

  // Generate dynamic business hours grid
  useEffect(() => {
    const days = [
      { day: 'Monday',    h: '08:00 – 18:00' },
      { day: 'Tuesday',   h: '08:00 – 18:00' },
      { day: 'Wednesday', h: '08:00 – 18:00' },
      { day: 'Thursday',  h: '08:00 – 18:00' },
      { day: 'Friday',    h: '08:00 – 17:00' },
      { day: 'Saturday',  h: '09:00 – 13:00' },
      { day: 'Sunday',    h: 'Closed' },
    ];
    // Adjust JS day (0=Sun, 1=Mon...) to fit our array layout indexing (0=Mon, 6=Sun)
    const todayIndex = (new Date().getDay() + 6) % 7;
    
    const elements = days.map((d, i) => ({
      ...d,
      isToday: i === todayIndex,
      showDivider: i === 5
    }));
    setHoursHTML(elements);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear validation error dynamically on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const validateForm = () => {
    let tempErrors = {};
    if (formData.fullName.trim().length < 2) tempErrors.fullName = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) tempErrors.email = true;
    if (!formData.subject) tempErrors.subject = true;
    if (!formData.country) tempErrors.country = true;
    if (formData.message.trim().length < 20) tempErrors.message = true;
    if (!formData.consent) tempErrors.consent = true;
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulate network request latency
      await new Promise(resolve => setTimeout(resolve, 1200));
      setSubmitStatus('success');
      setFormData({
        fullName: '', company: '', email: '', phone: '',
        subject: '', baleCode: '', country: '', message: '', consent: false
      });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showBaleGroup = formData.subject === 'product-code' || formData.subject === 'wholesale-quote';

  return (
    <div className="bg-off-white font-sans text-text-dark">
      {/* Page Hero */}
      <section className="bg-navy px-8 py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(201,168,76,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(201,168,76,.05)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="text-[11px] text-white/40 tracking-widest uppercase mb-5">
            <span>Home</span><span className="mx-1.5 opacity-50">/</span><span className="text-gold">Contact Us</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-black text-white mb-4">
            Let's <span className="text-gold-light">Talk Trade</span>
          </h1>
          <p className="text-sm text-white/60 leading-relaxed max-w-xl mx-auto">
            Whether you're placing a wholesale order, exploring trade consulting, or enquiring about product sourcing — our Cotonou team is ready to assist.
          </p>
          <div className="w-12 h-0.5 bg-gold mx-auto mt-6"></div>
        </div>
      </section>

      {/* Quick Contact Strip */}
      <div className="bg-gold px-8 py-5 flex justify-center gap-6 md:gap-12 flex-wrap">
        <a className="flex items-center gap-2 text-navy hover:underline text-xs font-semibold tracking-wide" href="tel:+22997000000">
          <span className="text-lg">📞</span><span>+229 97 00 00 00</span>
        </a>
        <a className="flex items-center gap-2 text-navy hover:underline text-xs font-semibold tracking-wide" href="mailto:contact@etsbesvid-benin.com">
          <span className="text-lg">✉️</span><span>contact@etsbesvid-benin.com</span>
        </a>
        <a className="flex items-center gap-2 text-navy hover:underline text-xs font-semibold tracking-wide" href="https://wa.me/22997000000" target="_blank" rel="noopener noreferrer">
          <span className="text-lg">💬</span><span>WhatsApp Us</span>
        </a>
      </div>

      {/* Main Framework Sections */}
      <div className="px-4 md:px-8 py-16 max-w-5xl mx-auto grid lg:grid-cols-[1fr_400px] gap-12 items-start">
        
        {/* Contact Form Card Container */}
        <div className="bg-white border border-navy/10 rounded p-8 shadow-xs">
          <div className="text-[10px] font-bold tracking-widest text-gold uppercase mb-2">Send an Enquiry</div>
          <div className="font-serif text-2xl font-bold text-navy mb-2">Get in Touch</div>
          <p className="text-xs text-text-mid leading-relaxed mb-8">
            Fill in the form and our team will respond within 48 business hours. For urgent matters, please call or WhatsApp directly.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-dark">Full Name <span className="text-gold">*</span></label>
                <input 
                  type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                  placeholder="e.g. Jean-Pierre Kossou"
                  className={`w-100 px-3 py-2.5 border text-xs bg-off-white rounded outline-none transition-all focus:border-gold focus:bg-white ${errors.fullName ? 'border-error' : 'border-navy/15'}`} 
                />
                {errors.fullName && <span className="text-[11px] text-error">Please enter your full name.</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-dark">Company / Business</label>
                <input 
                  type="text" name="company" value={formData.company} onChange={handleChange}
                  placeholder="e.g. Kossou Trading Ltd" 
                  className="w-100 px-3 py-2.5 border border-navy/15 text-xs bg-off-white rounded outline-none transition-all focus:border-gold focus:bg-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-dark">Email Address <span className="text-gold">*</span></label>
                <input 
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="you@example.com" 
                  className={`w-100 px-3 py-2.5 border text-xs bg-off-white rounded outline-none transition-all focus:border-gold focus:bg-white ${errors.email ? 'border-error' : 'border-navy/15'}`}
                />
                {errors.email && <span className="text-[11px] text-error">Please enter a valid email address.</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-dark">Phone / WhatsApp</label>
                <input 
                  type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="+229 00 00 00 00" 
                  className="w-100 px-3 py-2.5 border border-navy/15 text-xs bg-off-white rounded outline-none transition-all focus:border-gold focus:bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-dark">Enquiry Type <span className="text-gold">*</span></label>
              <select 
                name="subject" value={formData.subject} onChange={handleChange}
                className={`w-100 px-3 py-2.5 border text-xs bg-off-white rounded outline-none cursor-pointer transition-all focus:border-gold focus:bg-white ${errors.subject ? 'border-error' : 'border-navy/15'}`}
              >
                <option value="" disabled>Select an enquiry type…</option>
                <option value="wholesale-quote">Wholesale Clothing — Request a Quote</option>
                <option value="product-code">Specific Bale / Product Code Enquiry</option>
                <option value="trade-consulting">Trade Consulting — Benin / Nigeria</option>
                <option value="agri-food">Agri-Food Product Sourcing</option>
                <option value="logistics">Logistics &amp; Shipping</option>
                <option value="partnership">Business Partnership</option>
                <option value="other">Other / General Enquiry</option>
              </select>
              {errors.subject && <span className="text-[11px] text-error">Please select an enquiry type.</span>}
            </div>

            {showBaleGroup && (
              <div className="flex flex-col gap-1.5 animate-fadeIn">
                <label className="text-xs font-bold text-text-dark">Bale / Product Code(s)</label>
                <input 
                  type="text" name="baleCode" value={formData.baleCode} onChange={handleChange}
                  placeholder="e.g. MTS, BTS, WDR" 
                  className="w-100 px-3 py-2.5 border border-navy/15 text-xs bg-off-white rounded outline-none focus:border-gold focus:bg-white"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-dark">Your Country <span className="text-gold">*</span></label>
              <select 
                name="country" value={formData.country} onChange={handleChange}
                className={`w-100 px-3 py-2.5 border text-xs bg-off-white rounded outline-none cursor-pointer transition-all focus:border-gold focus:bg-white ${errors.country ? 'border-error' : 'border-navy/15'}`}
              >
                <option value="" disabled>Select your country…</option>
                <option>Bénin</option><option>Nigeria</option><option>Togo</option>
                <option>Ghana</option><option>Côte d'Ivoire</option><option>Sénégal</option>
                <option>Mali</option><option>Burkina Faso</option><option>Niger</option>
                <option>Cameroun</option><option>France</option><option>Germany</option>
                <option>United Kingdom</option><option>United States</option><option>Other</option>
              </select>
              {errors.country && <span className="text-[11px] text-error">Please select your country.</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-dark">Message <span className="text-gold">*</span></label>
              <textarea 
                name="message" value={formData.message} onChange={handleChange}
                placeholder="Describe your requirements — product type, quantity, destination, timeline..."
                className={`w-100 px-3 py-2.5 border text-xs bg-off-white rounded outline-none min-h-[120px] resize-y transition-all focus:border-gold focus:bg-white ${errors.message ? 'border-error' : 'border-navy/15'}`}
              />
              {errors.message && <span className="text-[11px] text-error">Please enter a message (min. 20 characters).</span>}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" id="consent" name="consent" checked={formData.consent} onChange={handleChange}
                className="w-4 h-4 accent-navy shrink-0 cursor-pointer" 
              />
              <label htmlFor="consent" className="text-xs text-text-mid font-medium cursor-pointer select-none">
                I agree to be contacted by ETS Besvid Benin regarding this enquiry.
              </label>
            </div>
            {errors.consent && <span className="text-[11px] text-error block">Please tick the consent box to continue.</span>}

            <button 
              type="submit" disabled={isSubmitting}
              className="w-100 mt-4 py-3.5 bg-navy text-gold-light hover:bg-navy-mid disabled:opacity-60 disabled:cursor-not-allowed rounded text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <span>{isSubmitting ? 'Sending…' : 'Send Enquiry'}</span>
              {!isSubmitting && <span className="transform transition-transform group-hover:translate-x-1">→</span>}
            </button>

            {/* Alert Status Bands */}
            {submitStatus === 'success' && (
              <div className="mt-4 p-4 rounded text-xs bg-success/10 border border-success/30 text-success flex gap-2">
                <span>✅</span>
                <span><strong>Message sent!</strong> Our team will reply within 48 business hours. For urgent matters, call or WhatsApp us directly.</span>
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="mt-4 p-4 rounded text-xs bg-error/10 border border-error/30 text-error flex gap-2">
                <span>⚠️</span>
                <span><strong>Something went wrong.</strong> Please try again or contact us by phone or email.</span>
              </div>
            )}
          </form>
        </div>

        {/* Sidebar Information Column */}
        <div className="flex flex-col gap-5">
          
          <a className="bg-[#128C7E] hover:bg-[#075E54] rounded p-5 flex items-center gap-4 text-white transition-colors" href="https://wa.me/22997000000" target="_blank" rel="noopener noreferrer">
            <span className="text-3xl">💬</span>
            <div>
              <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-0.5">Chat with us on</div>
              <div className="font-serif text-lg font-bold">WhatsApp</div>
              <div className="text-[11px] text-white/65">Fastest reply · Usually within 1–2 hrs</div>
            </div>
          </a>

          <div className="bg-white border border-navy/10 rounded p-6">
            <div className="font-serif text-base font-bold text-navy mb-5 pb-3 border-b-2 border-gold">Our Office</div>
            <div className="space-y-4">
              <div className="flex gap-3.5 items-start">
                <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-sm shrink-0">📍</div>
                <div>
                  <div className="text-[10px] font-bold tracking-wide text-text-light uppercase mb-0.5">Address</div>
                  <div className="text-xs text-text-dark leading-relaxed">ETS Besvid Benin<br />Quartier Zogbo, Cotonou<br />République du Bénin</div>
                </div>
              </div>
              <div className="flex gap-3.5 items-start">
                <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-sm shrink-0">📞</div>
                <div>
                  <div className="text-[10px] font-bold tracking-wide text-text-light uppercase mb-0.5">Phone</div>
                  <div className="text-xs space-y-0.5 font-medium">
                    <a href="tel:+22997000000" className="text-navy hover:text-gold block">+229 97 00 00 00</a>
                    <a href="tel:+22990000000" className="text-navy hover:text-gold block">+229 90 00 00 00</a>
                  </div>
                </div>
              </div>
              <div className="flex gap-3.5 items-start">
                <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-sm shrink-0">✉️</div>
                <div>
                  <div className="text-[10px] font-bold tracking-wide text-text-light uppercase mb-0.5">Email</div>
                  <div className="text-xs font-medium"><a href="mailto:contact@etsbesvid-benin.com" className="text-navy hover:text-gold">contact@etsbesvid-benin.com</a></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-navy/10 rounded p-6">
            <div className="font-serif text-base font-bold text-navy mb-5 pb-3 border-b-2 border-gold">Business Hours</div>
            <div className="space-y-2.5">
              {hoursHTML.map((item, index) => (
                <React.Fragment key={index}>
                  {item.showDivider && <div className="h-px bg-navy/5 my-1.5" />}
                  <div className={`flex justify-between text-xs ${item.isToday ? 'font-bold' : ''}`}>
                    <span className={item.isToday ? 'text-navy' : 'text-text-mid'}>
                      {item.day}{item.isToday ? ' (Today)' : ''}
                    </span>
                    <span className={item.isToday ? 'text-gold' : 'text-text-dark'}>
                      {item.h}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Interactive Map Block */}
          <div className="bg-navy rounded overflow-hidden">
            <iframe 
              className="w-full h-[190px] border-0 block" 
              loading="lazy" 
              allowFullScreen 
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31781.48398177!2d2.3707!3d6.3654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1023552a5bb85f87%3A0x56f4fc1cf6707ec7!2sCotonou%2C%20Benin!5e0!3m2!1sen!2s!4v1700000000000"
              title="ETS Besvid Benin — Cotonou location"
            />
            <div className="p-4 flex items-center justify-between">
              <div className="text-[11px] text-white/55 leading-tight">Quartier Zogbo<br />Cotonou, Bénin</div>
              <a className="text-[11px] font-semibold text-gold-light hover:text-gold" href="https://maps.google.com/?q=Cotonou,Benin" target="_blank" rel="noopener noreferrer">Open in Maps →</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}