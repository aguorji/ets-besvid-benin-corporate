import React, { useState } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import Contact from './pages/Contact';
import About from './pages/About';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [selectedBaleCode, setSelectedBaleCode] = useState('');

  // Handler to smoothly pass inventory codes straight into the contact submission form
  const handleSelectBaleCode = (code) => {
    setSelectedBaleCode(code);
    setActivePage('contact');
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {activePage === 'home' && (
        <Home setActivePage={setActivePage} />
      )}
      
      {activePage === 'products' && (
        <Products selectBaleCode={handleSelectBaleCode} />
      )}
      
      {activePage === 'about' && (
        <About setActivePage={setActivePage} />
      )}
      
      {activePage === 'contact' && (
        <Contact predefinedCode={selectedBaleCode} />
      )}

      {/* Fallback layout box if an unregistered page string somehow gets passed */}
      {!(['home', 'products', 'about', 'contact'].includes(activePage)) && (
        <div className="max-w-md mx-auto text-center py-20">
          <h2 className="font-serif text-xl font-bold">Section Coming Soon</h2>
          <button 
            onClick={() => setActivePage('home')} 
            className="mt-4 text-xs text-gold uppercase underline font-bold"
          >
            Return Home
          </button>
        </div>
      )}
    </Layout>
  );
}