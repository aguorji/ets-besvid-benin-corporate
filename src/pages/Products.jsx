import React, { useState, useEffect } from 'react';
import { Search, Loader2, Package } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Database Fetching Pipeline
  useEffect(() => {
    async function fetchInventory() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/products');

        if (!response.ok) {
          throw new Error(`Database connection failed: ${response.status}`);
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error("Backend connection error:", err);
        setError("Could not connect to live inventory. Please refresh or try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchInventory();
  }, []);

  // Filter based on itemCode or description
  const filteredProducts = products.filter(product => {
    const codeMatch = product.itemCode?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const descMatch = product.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    return codeMatch || descMatch;
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
              placeholder="Search by item code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-off-white border border-navy/10 rounded pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-gold font-medium text-navy placeholder:text-navy/40"
            />
          </div>

          <div className="text-[11px] font-bold text-navy/50 uppercase tracking-wider">
            Total Items: {filteredProducts.length}
          </div>
        </div>
      </section>

      {/* INVENTORY DISPLAY GRID, ERROR, OR SPINNER */}
      <main className="max-w-6xl mx-auto px-6 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 text-navy/60">
            <Loader2 className="animate-spin text-gold" size={32} />
            <p className="text-xs font-bold tracking-widest uppercase">Connecting to stock inventory...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 text-red-700 rounded p-6 text-center text-xs font-medium">
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-navy/10 rounded p-12 text-center text-navy/50 font-medium text-sm">
            No live inventory items match your active search parameters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product._id || product.id} className="bg-white border border-navy/10 rounded overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col">

                {/* Product Image Frame / Icon */}
                <div className="h-40 bg-navy flex items-center justify-center relative overflow-hidden group">
                  <Package className="text-gold/40 w-16 h-16 transform group-hover:scale-110 transition-transform duration-500" />
                  <span className="absolute bottom-3 left-3 bg-navy/90 text-white font-mono text-[11px] tracking-wider px-2 py-0.5 rounded border border-white/10">
                    {product.itemCode}
                  </span>
                </div>

                {/* Info Metadata Block */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-base font-bold leading-snug text-navy">
                      {product.itemCode}
                    </h3>
                    <p className="text-xs text-navy/70 leading-relaxed min-h-[3rem]">
                      {product.description || "No description provided."}
                    </p>
                  </div>

                  {/* Specification Segment */}
                  <div className="border-t border-navy/5 pt-3 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-navy/50 font-medium">Standard Size:</span>
                      <span className="font-bold text-navy">{product.standardSize || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy/50 font-medium">Unit Type:</span>
                      <span className="font-bold text-navy">{product.unit || 'Bale'}</span>
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
