import React, { useState, useEffect } from 'react';
import { Search, Loader2, Package } from 'lucide-react';

const CATEGORIES = ["All Categories", "Premium Bales", "Bulk Magazines", "Industrial Rags"];

export default function Products() {
  // 1. Dynamic state matrices ready to accept database arrays
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // 2. Database Fetching Pipeline
  useEffect(() => {
    async function fetchInventory() {
      try {
        setLoading(true);
        
        // TODO: Replace this URL string with your actual local or cloud API endpoint 
        // e.g., fetch('http://localhost:5000/api/inventory') or '/api/products'
        const response = await fetch('/api/products');
        
        if (!response.ok) {
          throw new Error(`Database connection failed: ${response.status}`);
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.warn("API Endpoint not found yet. Initializing safe baseline fallback for ui verification.");
        
        // SAFE FALLBACK: Keeps UI working gracefully before backend database integration
        setProducts([
          {
            id: "db-mock-1",
            name: "Premium Men's Mix Bales",
            category: "Premium Bales",
            weight: "45kg - 55kg Standard",
            origin: "European Sorting Plants",
            grade: "Grade A Premium",
            image: "/images/bales-mens-mix.jpg",
            description: "Highly sorted selection of modern men's shirts, denim trousers, and light jackets. Sourced live via admin dashboard inventory."
          },
          {
            id: "db-mock-2",
            name: "Summer Dresses Variety Mix",
            category: "Premium Bales",
            weight: "45kg Standard",
            origin: "Western Europe",
            grade: "Grade A",
            image: "/images/bales-summer-dress.jpg",
            description: "Bright, lightweight summer assortments including cotton dresses, skirts, and ladies' blouses."
          },
          {
            id: "db-mock-3",
            name: "Premium Men's Mix Bales",
            category: "Premium Bales",
            weight: "45kg - 55kg Standard",
            origin: "European Sorting Plants",
            grade: "Grade A Premium",
            image: "/images/bales-mens-mix.jpg",
            description: "Highly sorted selection of modern men's shirts, denim trousers, and light jackets. Optimized for immediate retail floor placement."
          },
          {
            id: "db-mock-4",
            name: "Summer Dresses Variety Mix",
            category: "Premium Bales",
            weight: "45kg Standard",
            origin: "Western Europe",
            grade: "Grade A",
            image: "/images/bales-summer-dress.jpg",
            description: "Bright, lightweight summer assortments including cotton dresses, skirts, and ladies' blouses. Checked for zero tears or deep staining."
          },
          {
            id: "db-mock-5",
            name: "Giant Stock Magazine Bale Type 1",
            category: "Bulk Magazines",
            weight: "500kg Industrial Block",
            origin: "Direct European Import",
            grade: "Mixed Grade A/B Bulk",
            image: "/images/bale-500kg-magazine-1.jpg",
            description: "Massive volume distribution blocks. Perfect for large-scale wholesale traders who run independent sorting operations in local markets."
          },
          {
            id: "db-mock-6",
            name: "Giant Stock Magazine Bale Type 2",
            category: "Bulk Magazines",
            weight: "500kg Industrial Block",
            origin: "Direct European Import",
            grade: "Grade B Value Block",
            image: "/images/bale-500kg-magazine-2.jpg",
            description: "High-volume stock consolidated for regional distribution networks looking for maximum fabric quantity per freight container."
          },
          {
            id: "db-mock-7",
            name: "Commercial Sorting Heaps / Rags",
            category: "Industrial Rags",
            weight: "Custom Bulk Freight",
            origin: "Grading Line Output",
            grade: "Industrial Cotton Segment",
            image: "/images/sorting-heaps-rags-1.jpg",
            description: "Pure cotton and mixed fiber fabric fragments sorted specifically for industrial wiping, recycling lines, or raw textile repurposing."
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchInventory();
  }, []);

  // 3. Multi-layered client-side filtering matrix
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      (product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesCategory = selectedCategory === "All Categories" || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-off-white text-navy font-sans pb-20">
      
      {/* HEADER HERO ROW */}
      <section className="bg-navy text-white py-12 border-b-2 border-gold">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="font-serif text-3xl font-bold tracking-tight">Wholesale Product Catalog</h1>
          <p className="text-white/60 text-xs md:text-sm mt-2 max-w-xl">
            Live database sync with our central storage magazines. Inventory items are weight-verified directly by admin stock management.
          </p>
        </div>
      </section>

      {/* FILTER CONTROLS HUB */}
      <section className="max-w-6xl mx-auto px-6 mt-8">
        <div className="bg-white border border-navy/10 rounded p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Active Search Field */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-navy/40" size={16} />
            <input 
              type="text"
              placeholder="Search live stock database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-off-white border border-navy/10 rounded pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-gold font-medium text-navy placeholder:text-navy/40"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                  selectedCategory === category 
                    ? 'bg-navy text-gold border-navy shadow-xs' 
                    : 'bg-off-white text-navy/70 border-navy/5 hover:bg-navy/5'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* INVENTORY DISPLAY GRID OR SPINNER */}
      <main className="max-w-6xl mx-auto px-6 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 text-navy/60">
            <Loader2 className="animate-spin text-gold" size={32} />
            <p className="text-xs font-bold tracking-widest uppercase">Connecting to stock inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-navy/10 rounded p-12 text-center text-navy/50 font-medium text-sm">
            No live inventory items match your active parameters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id || product._id} className="bg-white border border-navy/10 rounded overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col">
                
                {/* Product Image Frame */}
                <div className="h-48 bg-navy relative overflow-hidden group">
                  <img 
                    src={product.image || '/images/placeholder-bale.jpg'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  {product.grade && (
                    <span className="absolute top-3 left-3 bg-navy/90 text-gold font-bold text-[9px] uppercase tracking-widest px-2 py-1 rounded border border-white/10">
                      {product.grade}
                    </span>
                  )}
                </div>

                {/* Info Metadata Block */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] text-gold font-bold uppercase tracking-wider block">{product.category}</span>
                    <h3 className="font-serif text-base font-bold leading-snug text-navy">{product.name}</h3>
                    <p className="text-xs text-navy/70 leading-relaxed line-clamp-3">{product.description}</p>
                  </div>

                  {/* Specification Table Segment */}
                  <div className="border-t border-navy/5 pt-3 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-navy/50 font-medium">Size/Weight:</span>
                      <span className="font-bold text-navy">{product.weight || product.size || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy/50 font-medium">Origin:</span>
                      <span className="font-bold text-navy">{product.origin || 'Imported'}</span>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}