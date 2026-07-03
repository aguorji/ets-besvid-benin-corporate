import React, { useState } from 'react';
import Home from './pages/Home';
import Products from './pages/Products';
import About from './pages/About';
import Contact from './pages/Contact';
import Team from './pages/Team'; // 1. Import the new Team component

export default function App() {
  const [activePage, setActivePage] = useState('home');

  // 2. Simple navigation rendering matrix
  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <Home setActivePage={setActivePage} />;
      case 'products':
        return <Products />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      case 'team':
        return <Team />; // 3. Render it when state switches to 'team'
      default:
        return <Home setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex flex-col justify-between">
      {/* Your Navbar would be here */}
      <header className="bg-navy p-4 border-b border-gold/20">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-white text-xs">
          <button onClick={() => setActivePage('home')} className="font-serif text-gold font-bold text-sm tracking-wider cursor-pointer">
            ETS BESVID BENIN
          </button>
          <nav className="flex gap-4 font-bold uppercase tracking-wider">
            <button onClick={() => setActivePage('home')} className="cursor-pointer hover:text-gold">Home</button>
            <button onClick={() => setActivePage('products')} className="cursor-pointer hover:text-gold">Products</button>
            <button onClick={() => setActivePage('team')} className="cursor-pointer hover:text-gold">Our Team</button>
            <button onClick={() => setActivePage('contact')} className="cursor-pointer hover:text-gold">Contact</button>
          </nav>
        </div>
      </header>

      {/* Main Dynamic Viewport Container */}
      <div className="flex-grow">
        {renderPage()}
      </div>

      {/* Standard Footer */}
      <footer className="bg-navy text-white/40 text-[10px] text-center py-4 border-t border-white/5">
        &copy; 2026 ETS Besvid Benin. All Rights Reserved.
      </footer>
    </div>
  );
}