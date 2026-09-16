import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  CheckCircle, 
  Printer, 
  ArrowUpRight, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  QrCode, 
  Coins, 
  X,
  RefreshCw,
  Tag
} from 'lucide-react';

const INITIAL_PRODUCTS = [
  { id: 1, name: 'Kopi Espresso', price: 18000, category: 'Minuman', stock: 45, icon: '☕' },
  { id: 2, name: 'Es Teh Manis', price: 8000, category: 'Minuman', stock: 100, icon: '🍹' },
  { id: 3, name: 'Nasi Goreng Spesial', price: 25000, category: 'Makanan', stock: 20, icon: '🍳' },
  { id: 4, name: 'Mie Goreng Seafood', price: 28000, category: 'Makanan', stock: 15, icon: '🍜' },
  { id: 5, name: 'Roti Bakar Cokelat', price: 15000, category: 'Cemilan', stock: 30, icon: '🍞' },
  { id: 6, name: 'Kentang Goreng', price: 12000, category: 'Cemilan', stock: 25, icon: '🍟' },
  { id: 7, name: 'Croissant Butter', price: 22000, category: 'Cemilan', stock: 12, icon: '🥐' },
  { id: 8, name: 'Matcha Latte', price: 24000, category: 'Minuman', stock: 18, icon: '🍵' },
];

const CATEGORIES = ['Semua', 'Makanan', 'Minuman', 'Cemilan'];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('pos'); // 'dashboard', 'pos', 'products', 'history'

  // Data States with LocalStorage Persistence
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('ekasir_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('ekasir_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // POS State
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(10); // Default PPN 10%

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'qris', 'card'
  const [cashAmount, setCashAmount] = useState('');
  const [lastCompletedTransaction, setLastCompletedTransaction] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Product Management Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: 'Makanan',
    stock: '',
    icon: '📦'
  });

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('ekasir_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ekasir_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.qty >= product.stock) return prevCart; // Exceeds stock
        return prevCart.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          const targetProduct = products.find(p => p.id === id);
          const maxStock = targetProduct ? targetProduct.stock : item.stock;

          if (newQty <= 0) return null;
          if (newQty > maxStock) return item;
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const clearCart = () => setCart([]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const taxAmount = useMemo(() => {
    return ((subtotal - discountAmount) * taxPercent) / 100;
  }, [subtotal, discountAmount, taxPercent]);

  const grandTotal = useMemo(() => {
    return subtotal - discountAmount + taxAmount;
  }, [subtotal, discountAmount, taxAmount]);

  const changeAmount = useMemo(() => {
    const cash = parseFloat(cashAmount) || 0;
    return cash - grandTotal;
  }, [cashAmount, grandTotal]);

  const handleProcessPayment = () => {
    if (cart.length === 0) return;

    const newTransaction = {
      id: 'TRX-' + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      items: [...cart],
      subtotal,
      discountAmount,
      taxAmount,
      total: grandTotal,
      paymentMethod,
      cashPaid: paymentMethod === 'cash' ? (parseFloat(cashAmount) || grandTotal) : grandTotal,
      change: paymentMethod === 'cash' ? (changeAmount >= 0 ? changeAmount : 0) : 0
    };

    // Update Product Stock
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const cartItem = cart.find(ci => ci.id === prod.id);
        if (cartItem) {
          return { ...prod, stock: prod.stock - cartItem.qty };
        }
        return prod;
      })
    );

    // Save Transaction & Show Receipt
    setTransactions(prev => [newTransaction, ...prev]);
    setLastCompletedTransaction(newTransaction);
    setIsCheckoutOpen(false);
    setIsReceiptOpen(true);
    setCart([]);
    setCashAmount('');
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
        ...p,
        name: productForm.name,
        price: parseFloat(productForm.price),
        category: productForm.category,
        stock: parseInt(productForm.stock) || 0,
        icon: productForm.icon || '📦'
      } : p));
    } else {
      const newProd = {
        id: Date.now(),
        name: productForm.name,
        price: parseFloat(productForm.price),
        category: productForm.category,
        stock: parseInt(productForm.stock) || 0,
        icon: productForm.icon || '📦'
      };
      setProducts(prev => [...prev, newProd]);
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
    setProductForm({ name: '', price: '', category: 'Makanan', stock: '', icon: '📦' });
  };

  const handleEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      price: prod.price,
      category: prod.category,
      stock: prod.stock,
      icon: prod.icon
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const dashboardStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const todayTransactions = transactions.filter(t => 
      t.date.split('T')[0] === todayStr
    );

    const totalIncomeToday = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactionsCount = transactions.length;

    // Count item occurrences
    const itemCounts = {};
    transactions.forEach(t => {
      t.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
      });
    });

    const topProducts = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      todayIncome: totalIncomeToday,
      todayCount: todayTransactions.length,
      totalCount: totalTransactionsCount,
      topProducts
    };
  }, [transactions]);

  // Filtered Products for POS
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      {}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-5 flex items-center gap-3 border-b border-slate-800">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">E-Kasir Pro</h1>
              <p className="text-xs text-slate-400">Point of Sale System</p>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('pos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'pos' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Kasir (POS)</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'products' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Katalog Produk</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'history' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-5 h-5" />
              <span>Riwayat Transaksi</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="p-3 bg-slate-800/60 rounded-xl text-xs text-slate-400 flex items-center justify-between">
            <span>Status System</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
            </span>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white z-40 px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm">E-Kasir Pro</span>
        </div>
        <div className="flex gap-2 text-xs">
          <button onClick={() => setActiveTab('pos')} className={`px-2.5 py-1.5 rounded-lg ${activeTab === 'pos' ? 'bg-indigo-600' : 'bg-slate-800'}`}>POS</button>
          <button onClick={() => setActiveTab('dashboard')} className={`px-2.5 py-1.5 rounded-lg ${activeTab === 'dashboard' ? 'bg-indigo-600' : 'bg-slate-800'}`}>Dash</button>
          <button onClick={() => setActiveTab('products')} className={`px-2.5 py-1.5 rounded-lg ${activeTab === 'products' ? 'bg-indigo-600' : 'bg-slate-800'}`}>Produk</button>
          <button onClick={() => setActiveTab('history')} className={`px-2.5 py-1.5 rounded-lg ${activeTab === 'history' ? 'bg-indigo-600' : 'bg-slate-800'}`}>Riwayat</button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">

        {/* 1. POS VIEW */}
        {}
        {activeTab === 'pos' && (
          <div className="flex flex-col lg:flex-row h-full">
            
            {/* PRODUCT CATALOG SELECTION */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Point of Sale</h2>
                  <p className="text-sm text-slate-500">Pilih produk untuk ditambahkan ke keranjang</p>
                </div>
                
                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-indigo-400 transition-all cursor-pointer hover:shadow-md flex flex-col justify-between group relative overflow-hidden ${
                      product.stock <= 0 ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <div>
                      <div className="text-4xl mb-3 bg-slate-50 rounded-xl p-3 w-fit text-center group-hover:scale-110 transition-transform">
                        {product.icon}
                      </div>
                      <h3 className="font-semibold text-slate-800 line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-slate-400 mb-2">{product.category}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <span className="font-bold text-indigo-600 text-sm">
                        {formatRupiah(product.price)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-md ${
                        product.stock > 10 ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700 font-medium'
                      }`}>
                        Stok: {product.stock}
                      </span>
                    </div>

                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center font-bold text-white text-xs">
                        STOK HABIS
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SHOPPING CART PANEL */}
            {}
            <div className="w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col h-auto lg:h-full shadow-xl">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Keranjang Belanja</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <ShoppingBag className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
                    <p className="text-sm">Keranjang masih kosong</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <h4 className="font-medium text-slate-800 text-sm">{item.name}</h4>
                          <p className="text-xs text-indigo-600 font-semibold">{formatRupiah(item.price)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold hover:bg-indigo-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Calculation Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-700">{formatRupiah(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>Diskon (%)</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-16 px-2 py-0.5 border border-slate-200 rounded text-right text-xs bg-white"
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Pajak PPN (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-16 px-2 py-0.5 border border-slate-200 rounded text-right text-xs bg-white"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-800">Total Bayar</span>
                  <span className="font-extrabold text-xl text-indigo-600">{formatRupiah(grandTotal)}</span>
                </div>

                <button
                  disabled={cart.length === 0}
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-3"
                >
                  <span>Bayar Sekarang</span>
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. DASHBOARD VIEW */}
        {}
        {activeTab === 'dashboard' && (
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Dashboard Penjualan</h2>
              <p className="text-sm text-slate-500">Ringkasan performa toko hari ini</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Pendapatan Hari Ini</p>
                  <h3 className="text-2xl font-bold text-slate-800">{formatRupiah(dashboardStats.todayIncome)}</h3>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Transaksi Hari Ini</p>
                  <h3 className="text-2xl font-bold text-slate-800">{dashboardStats.todayCount} Transaksi</h3>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total Keseluruhan</p>
                  <h3 className="text-2xl font-bold text-slate-800">{dashboardStats.totalCount} Transaksi</h3>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-lg mb-4">Produk Terlaris</h3>
              {dashboardStats.topProducts.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada transaksi untuk ditampilkan.</p>
              ) : (
                <div className="space-y-3">
                  {dashboardStats.topProducts.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-700 text-sm">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                        Terjual: {item.count} pcs
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. PRODUCTS MANAGEMENT VIEW */}
        {}
        {activeTab === 'products' && (
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Manajemen Katalog Produk</h2>
                <p className="text-sm text-slate-500">Tambah, edit, atau hapus item di toko Anda</p>
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({ name: '', price: '', category: 'Makanan', stock: '', icon: '📦' });
                  setIsProductModalOpen(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-md shadow-indigo-600/20 transition-all text-sm"
              >
                <Plus className="w-4 h-4" /> Tambah Produk
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-4">Produk</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Harga</th>
                      <th className="p-4">Stok</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-slate-50/50">
                        <td className="p-4 flex items-center gap-3">
                          <span className="text-2xl">{product.icon}</span>
                          <span className="font-semibold text-slate-800">{product.name}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-800">{formatRupiah(product.price)}</td>
                        <td className="p-4">
                          <span className={`font-semibold text-xs px-2.5 py-1 rounded-md ${
                            product.stock > 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {product.stock} pcs
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. TRANSACTION HISTORY VIEW */}
        {}
        {activeTab === 'history' && (
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h2>
              <p className="text-sm text-slate-500">Daftar semua transaksi yang pernah dilakukan</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
              {transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-400">Belum ada riwayat transaksi.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="p-4">ID Transaksi</th>
                        <th className="p-4">Tanggal & Waktu</th>
                        <th className="p-4">Metode Bayar</th>
                        <th className="p-4">Total</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map(trx => (
                        <tr key={trx.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-mono font-bold text-indigo-600">{trx.id}</td>
                          <td className="p-4 text-slate-500 text-xs">
                            {new Date(trx.date).toLocaleString('id-ID')}
                          </td>
                          <td className="p-4 uppercase text-xs font-semibold">{trx.paymentMethod}</td>
                          <td className="p-4 font-bold text-slate-800">{formatRupiah(trx.total)}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setLastCompletedTransaction(trx);
                                setIsReceiptOpen(true);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              Cetak Struk
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* CHECKOUT MODAL */}
      {}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-800 mb-1">Pembayaran</h3>
            <p className="text-xs text-slate-400 mb-6">Pilih metode pembayaran dan masukkan jumlah uang</p>

            {/* Total Display */}
            <div className="p-4 bg-indigo-50 rounded-xl mb-6 text-center border border-indigo-100">
              <span className="text-xs text-indigo-600 font-medium">Total Tagihan</span>
              <div className="text-3xl font-extrabold text-indigo-600 mt-0.5">{formatRupiah(grandTotal)}</div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-all ${
                  paymentMethod === 'cash' 
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Coins className="w-5 h-5" /> Tunai
              </button>

              <button
                onClick={() => setPaymentMethod('qris')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-all ${
                  paymentMethod === 'qris' 
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <QrCode className="w-5 h-5" /> QRIS
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-all ${
                  paymentMethod === 'card' 
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <CreditCard className="w-5 h-5" /> Kartu
              </button>
            </div>

            {/* Conditional Input based on Method */}
            {paymentMethod === 'cash' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Uang Diterima (Rp)</label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                  />
                </div>

                {/* Quick Cash Suggestions */}
                <div className="flex gap-2">
                  {[grandTotal, 20000, 50000, 100000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCashAmount(amt.toString())}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600"
                    >
                      {amt === grandTotal ? 'Uang Pas' : formatRupiah(amt)}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-500">Kembalian:</span>
                  <span className={`font-bold ${changeAmount < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {changeAmount < 0 ? 'Uang kurang' : formatRupiah(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'qris' && (
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl mb-6">
                <div className="p-3 bg-white border border-slate-200 rounded-xl mb-2">
                  <QrCode className="w-32 h-32 text-slate-800" />
                </div>
                <p className="text-xs text-slate-500 text-center">Scan QRIS menggunakan Gopay, OVO, Dana, ShopeePay, atau Mobile Banking</p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="p-4 bg-slate-50 rounded-xl mb-6 text-center text-xs text-slate-500">
                Silakan gesek / tap kartu EDC pada mesin pembaca kartu.
              </div>
            )}

            <button
              disabled={paymentMethod === 'cash' && changeAmount < 0}
              onClick={handleProcessPayment}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              Selesaikan Transaksi
            </button>
          </div>
        </div>
      )}

      {/* RECEIPT NOTA MODAL */}
      {}
      {isReceiptOpen && lastCompletedTransaction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsReceiptOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Receipt Layout */}
            <div id="receipt-print" className="font-mono text-xs text-slate-700 space-y-4 pt-2">
              <div className="text-center border-b border-dashed pb-4 border-slate-300">
                <h2 className="text-base font-bold text-slate-900">E-KASIR STORE</h2>
                <p>Jl. Merdeka No. 123, Jakarta</p>
                <p>Telp: 0812-3456-7890</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>No. TRX:</span>
                  <span className="font-bold">{lastCompletedTransaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{new Date(lastCompletedTransaction.date).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t border-b border-dashed py-3 border-slate-300 space-y-2">
                {lastCompletedTransaction.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="flex justify-between text-slate-500">
                      <span>{item.qty} x {formatRupiah(item.price)}</span>
                      <span>{formatRupiah(item.qty * item.price)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculation Summary */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatRupiah(lastCompletedTransaction.subtotal)}</span>
                </div>
                {lastCompletedTransaction.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon</span>
                    <span>-{formatRupiah(lastCompletedTransaction.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pajak PPN</span>
                  <span>{formatRupiah(lastCompletedTransaction.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                  <span>TOTAL</span>
                  <span>{formatRupiah(lastCompletedTransaction.total)}</span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1">
                  <span>Bayar ({lastCompletedTransaction.paymentMethod.toUpperCase()})</span>
                  <span>{formatRupiah(lastCompletedTransaction.cashPaid)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Kembali</span>
                  <span>{formatRupiah(lastCompletedTransaction.change)}</span>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-dashed border-slate-300 text-slate-400 text-[10px]">
                <p>Terima Kasih Atas Kunjungan Anda!</p>
                <p>Barang yang sudah dibeli tidak dapat ditukar</p>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md"
              >
                <Printer className="w-4 h-4" /> Cetak Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-800 mb-4">
              {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Contoh: Es Kopi Susu"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="15000"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Stok</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="50"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Kategori</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Cemilan">Cemilan</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Ikon Emoji</label>
                  <input
                    type="text"
                    value={productForm.icon}
                    onChange={(e) => setProductForm({ ...productForm, icon: e.target.value })}
                    placeholder="☕"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-sm"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}