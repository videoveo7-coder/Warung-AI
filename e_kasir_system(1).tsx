import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingBag, 
  BarChart3, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Camera, 
  Upload, 
  Printer, 
  Search, 
  CreditCard, 
  DollarSign, 
  QrCode, 
  TrendingUp, 
  Package, 
  Receipt, 
  X, 
  Eye, 
  Clock, 
  Store,
  UserCheck,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';

const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Kopi Susu Gula Aren',
    price: 18000,
    stock: 24,
    category: 'Minuman',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'prod-2',
    name: 'Croissant Butter',
    price: 22000,
    stock: 8,
    category: 'Makanan',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'prod-3',
    name: 'Matcha Latte Ice',
    price: 24000,
    stock: 15,
    category: 'Minuman',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'prod-4',
    name: 'French Fries Crispy',
    price: 15000,
    stock: 3,
    category: 'Cemilan',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'prod-5',
    name: 'Americano Ice',
    price: 16000,
    stock: 30,
    category: 'Minuman',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'prod-6',
    name: 'Club Sandwich',
    price: 28000,
    stock: 12,
    category: 'Makanan',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=400'
  }
];

const INITIAL_TRANSACTIONS = [
  {
    id: 'TRX-1001',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toLocaleString('id-ID'),
    items: [
      { id: 'prod-1', name: 'Kopi Susu Gula Aren', price: 18000, qty: 2 }
    ],
    subtotal: 36000,
    tax: 3600,
    total: 39600,
    paymentMethod: 'QRIS',
    proofImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=300',
    customerImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'TRX-1002',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toLocaleString('id-ID'),
    items: [
      { id: 'prod-2', name: 'Croissant Butter', price: 22000, qty: 1 },
      { id: 'prod-5', name: 'Americano Ice', price: 16000, qty: 1 }
    ],
    subtotal: 38000,
    tax: 3800,
    total: 41800,
    paymentMethod: 'Cash',
    proofImage: null,
    customerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'remote'
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('ekasir_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('ekasir_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'Minuman',
    image: ''
  });
  
  // Checkout & Payment Photos State
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [proofImage, setProofImage] = useState(null);
  const [customerImage, setCustomerImage] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);
  
  // Image Viewer Modal State
  const [previewModalData, setPreviewModalData] = useState(null); // { title: string, imgUrl: string }

  // Camera Capture Modal State
  const [cameraTarget, setCameraTarget] = useState(null); // 'proof' | 'customer' | null
  const videoRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);

  // Sync state to local storage for persistence
  useEffect(() => {
    localStorage.setItem('ekasir_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ekasir_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const startCamera = async (target) => {
    setCameraTarget(target);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Gagal mengakses kamera:", err);
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
      setCameraTarget(null);
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setCameraTarget(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');

    if (cameraTarget === 'proof') {
      setProofImage(dataUrl);
    } else if (cameraTarget === 'customer') {
      setCustomerImage(dataUrl);
    }
    stopCamera();
  };

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prevCart;
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const product = products.find((p) => p.id === id);
            const newQty = item.qty + delta;
            if (newQty <= 0) return null;
            if (product && newQty > product.stock) return item;
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const taxAmount = useMemo(() => cartSubtotal * 0.1, [cartSubtotal]);
  const cartTotal = useMemo(() => cartSubtotal + taxAmount, [cartSubtotal, taxAmount]);

  const handleProductImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e, setTargetState) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTargetState(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock) return;

    const created = {
      id: `prod-${Date.now()}`,
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock, 10),
      category: newProduct.category,
      image: newProduct.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'
    };

    setProducts((prev) => [created, ...prev]);
    setIsAddProductOpen(false);
    setNewProduct({ name: '', price: '', stock: '', category: 'Minuman', image: '' });
  };

  const handleProcessPayment = () => {
    if (cart.length === 0) return;

    // Deduct stocks
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const cartItem = cart.find((item) => item.id === p.id);
        if (cartItem) {
          return { ...p, stock: p.stock - cartItem.qty };
        }
        return p;
      })
    );

    // Create new Transaction with both Proof and Customer Photos
    const newTx = {
      id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('id-ID'),
      items: cart,
      subtotal: cartSubtotal,
      tax: taxAmount,
      total: cartTotal,
      paymentMethod,
      proofImage: paymentMethod !== 'Cash' ? proofImage : (proofImage || null),
      customerImage: customerImage || null
    };

    setTransactions((prev) => [newTx, ...prev]);
    setActiveReceipt(newTx);

    // Reset Cart & Photos
    setCart([]);
    setProofImage(null);
    setCustomerImage(null);
    setPaymentMethod('Cash');
  };

  const categories = ['Semua', 'Minuman', 'Makanan', 'Cemilan'];
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalOmzet = useMemo(() => {
    return transactions.reduce((acc, t) => acc + t.total, 0);
  }, [transactions]);

  const totalTransactionsCount = transactions.length;

  const lowStockItems = useMemo(() => {
    return products.filter((p) => p.stock <= 5);
  }, [products]);

  const topSellingProduct = useMemo(() => {
    const counts = {};
    transactions.forEach((tx) => {
      tx.items.forEach((it) => {
        counts[it.name] = (counts[it.name] || 0) + it.qty;
      });
    });
    let topName = 'Belum Ada';
    let maxQty = 0;
    Object.entries(counts).forEach(([name, qty]) => {
      if (qty > maxQty) {
        maxQty = qty;
        topName = name;
      }
    });
    return { name: topName, qty: maxQty };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
                Warung AI
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Realtime Monitoring Active
                </span>
                <span>•</span>
                <span>Cabang: Melaris Timur</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pos'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Kasir (POS)
            </button>
            <button
              onClick={() => setActiveTab('remote')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'remote'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Pantau Jarak Jauh
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'pos' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-800 p-4 rounded-2xl border border-slate-700/60 shadow-sm">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari menu produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900/60 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsAddProductOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors ml-auto shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Produk Baru
                  </button>
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => product.stock > 0 && addToCart(product)}
                    className={`group bg-slate-800 rounded-2xl border border-slate-700/60 overflow-hidden cursor-pointer flex flex-col justify-between transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 ${
                      product.stock === 0 ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <div className="relative h-32 w-full bg-slate-900 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur text-xs font-medium text-slate-300 px-2 py-0.5 rounded-md">
                        {product.category}
                      </span>
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="absolute top-2 right-2 bg-amber-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Sisa {product.stock}
                        </span>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center font-bold text-red-400 text-xs">
                          Stok Habis
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h3 className="font-semibold text-sm text-slate-100 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {product.name}
                      </h3>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-bold text-sm text-emerald-400">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] text-slate-400">Stok: {product.stock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart & Dual Photo Upload Drawer */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700/60 p-4 flex flex-col h-[calc(100vh-120px)] sticky top-20 shadow-xl overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <h2 className="font-bold text-base text-slate-100">Pesanan Aktif</h2>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold">
                  {cart.reduce((a, b) => a + b.qty, 0)} Items
                </span>
              </div>

              {/* Items List */}
              <div className="flex-1 min-h-[140px] max-h-[260px] overflow-y-auto my-3 space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-8">
                    <ShoppingBag className="w-10 h-10 opacity-30" />
                    <p className="text-xs">Keranjang masih kosong</p>
                    <p className="text-[11px] text-slate-600 text-center">Pilih produk untuk menambah transaksi</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-700/40"
                    >
                      <div className="flex-1 pr-2">
                        <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{item.name}</h4>
                        <span className="text-xs text-emerald-400 font-medium">
                          Rp {(item.price * item.qty).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-700 rounded-lg bg-slate-800">
                          <button
                            onClick={() => updateCartQty(item.id, -1)}
                            className="px-2 py-0.5 text-slate-300 hover:text-white text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-semibold text-slate-100">{item.qty}</span>
                          <button
                            onClick={() => updateCartQty(item.id, 1)}
                            className="px-2 py-0.5 text-slate-300 hover:text-white text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Summary calculation */}
              <div className="border-t border-slate-700 pt-3 space-y-3">
                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pajak PB1 (10%)</span>
                    <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-700/40">
                    <span>Total Pembayaran</span>
                    <span className="text-emerald-400">Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'Cash', label: 'Tunai', icon: DollarSign },
                      { id: 'QRIS', label: 'QRIS', icon: QrCode },
                      { id: 'Transfer', label: 'Transfer', icon: CreditCard }
                    ].map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium border transition-all ${
                            paymentMethod === method.id
                              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-0.5" />
                          {method.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DUAL PHOTO UPLOAD BOX (FOTO BUKTI & FOTO KONSUMEN) */}
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" /> Foto Transaksi & Pembeli
                    </span>
                    <span className="text-[10px] bg-teal-950 text-teal-400 border border-teal-800 px-1.5 py-0.5 rounded">
                      Pantau Remote
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* 1. Foto Bukti Bayar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-300">1. Bukti Struk</span>
                        {paymentMethod !== 'Cash' && <span className="text-amber-400">*Wajib</span>}
                      </div>
                      
                      {proofImage ? (
                        <div className="relative h-24 rounded-lg overflow-hidden border border-emerald-500 group">
                          <img src={proofImage} alt="Bukti" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setPreviewModalData({ title: 'Foto Bukti Pembayaran', imgUrl: proofImage })}
                              className="p-1 bg-slate-800 text-slate-200 rounded hover:text-white"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setProofImage(null)}
                              className="p-1 bg-red-600 text-white rounded hover:bg-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="absolute bottom-1 left-1 bg-emerald-950/80 text-emerald-300 text-[9px] px-1 rounded">
                            Bukti Bayar
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <label className="border border-dashed border-slate-700 hover:border-emerald-500 rounded-lg p-2 text-center cursor-pointer bg-slate-800/60 hover:bg-slate-800 transition-colors block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, setProofImage)}
                              className="hidden"
                            />
                            <Upload className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                            <span className="text-[10px] text-slate-300 block font-medium">Upload Struk</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => startCamera('proof')}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] py-1 rounded-lg flex items-center justify-center gap-1"
                          >
                            <Camera className="w-3 h-3 text-emerald-400" /> Foto Kamera
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 2. Foto Konsumen / Pembeli */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-300">2. Foto Pembeli</span>
                        <span className="text-slate-500">Opsional</span>
                      </div>

                      {customerImage ? (
                        <div className="relative h-24 rounded-lg overflow-hidden border border-teal-500 group">
                          <img src={customerImage} alt="Konsumen" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setPreviewModalData({ title: 'Foto Pembeli / Konsumen', imgUrl: customerImage })}
                              className="p-1 bg-slate-800 text-slate-200 rounded hover:text-white"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomerImage(null)}
                              className="p-1 bg-red-600 text-white rounded hover:bg-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="absolute bottom-1 left-1 bg-teal-950/80 text-teal-300 text-[9px] px-1 rounded">
                            Konsumen
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <label className="border border-dashed border-slate-700 hover:border-teal-500 rounded-lg p-2 text-center cursor-pointer bg-slate-800/60 hover:bg-slate-800 transition-colors block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, setCustomerImage)}
                              className="hidden"
                            />
                            <UserCheck className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                            <span className="text-[10px] text-slate-300 block font-medium">Upload Konsumen</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => startCamera('customer')}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] py-1 rounded-lg flex items-center justify-center gap-1"
                          >
                            <Camera className="w-3 h-3 text-teal-400" /> Ambil Foto
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Payment Button */}
                <button
                  disabled={cart.length === 0}
                  onClick={handleProcessPayment}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Printer className="w-4 h-4" />
                  Proses & Cetak Struk
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800 border border-slate-700/60 p-4 rounded-2xl relative overflow-hidden shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Total Omzet Hari Ini</p>
                    <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
                      Rp {totalOmzet.toLocaleString('id-ID')}
                    </h3>
                  </div>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-slate-400 gap-1">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Synchronized Live
                  </span>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700/60 p-4 rounded-2xl relative overflow-hidden shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Total Transaksi</p>
                    <h3 className="text-2xl font-extrabold text-slate-100 mt-1">
                      {totalTransactionsCount} Transaksi
                    </h3>
                  </div>
                  <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl">
                    <Receipt className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-slate-400 gap-1">
                  <span>Kasir Aktif: Melaris Terminal 1</span>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700/60 p-4 rounded-2xl relative overflow-hidden shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Produk Terlaris</p>
                    <h3 className="text-lg font-bold text-slate-100 mt-1 line-clamp-1">
                      {topSellingProduct.name}
                    </h3>
                  </div>
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-cyan-300 font-semibold gap-1">
                  Terjual: {topSellingProduct.qty} porsi
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700/60 p-4 rounded-2xl relative overflow-hidden shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Peringatan Stok Rendah</p>
                    <h3 className="text-2xl font-extrabold text-amber-400 mt-1">
                      {lowStockItems.length} Produk
                    </h3>
                  </div>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-amber-400/80 gap-1">
                  Perlu Restock Segera
                </div>
              </div>
            </div>

            {/* Content Split: Live Transaction Feed & Low Stock Warning */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Live Transactions Feed with Dual Photo Viewers */}
              <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-400" />
                    <h2 className="font-bold text-base text-slate-100">Pemantauan Transaksi & Foto Konsumen</h2>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Updates
                  </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-slate-900/70 p-4 rounded-xl border border-slate-700/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-600 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-emerald-400">{tx.id}</span>
                          <span className="text-xs text-slate-400">• {tx.timestamp}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              tx.paymentMethod === 'Cash'
                                ? 'bg-slate-700 text-slate-300'
                                : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                            }`}
                          >
                            {tx.paymentMethod}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-1">
                          {tx.items.map((i) => `${i.name} (${i.qty}x)`).join(', ')}
                        </p>
                      </div>

                      {/* Photo Thumbnails in Remote Feed */}
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                        <div className="flex items-center gap-2">
                          {tx.proofImage ? (
                            <button
                              onClick={() => setPreviewModalData({ title: `Bukti Bayar - ${tx.id}`, imgUrl: tx.proofImage })}
                              className="group relative w-10 h-10 rounded-lg overflow-hidden border border-emerald-500/50 bg-slate-800 flex items-center justify-center hover:ring-2 hover:ring-emerald-400 transition-all"
                              title="Lihat Foto Bukti Pembayaran"
                            >
                              <img src={tx.proofImage} alt="Struk" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          ) : (
                            <span className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/40 flex items-center justify-center text-[9px] text-slate-600 text-center leading-tight">
                              No Struk
                            </span>
                          )}

                          {tx.customerImage ? (
                            <button
                              onClick={() => setPreviewModalData({ title: `Foto Pembeli - ${tx.id}`, imgUrl: tx.customerImage })}
                              className="group relative w-10 h-10 rounded-lg overflow-hidden border border-teal-500/50 bg-slate-800 flex items-center justify-center hover:ring-2 hover:ring-teal-400 transition-all"
                              title="Lihat Foto Pembeli / Konsumen"
                            >
                              <img src={tx.customerImage} alt="Konsumen" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                <UserCheck className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          ) : (
                            <span className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/40 flex items-center justify-center text-[9px] text-slate-600 text-center leading-tight">
                              No Foto
                            </span>
                          )}
                        </div>

                        <div className="text-right ml-2">
                          <span className="block text-[11px] text-slate-400">Total</span>
                          <span className="font-extrabold text-emerald-400 text-sm">
                            Rp {tx.total.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventory Status */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700/60 p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
                  <Package className="w-5 h-5 text-amber-400" />
                  <h2 className="font-bold text-base text-slate-100">Status Stok Produk</h2>
                </div>

                <div className="space-y-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-xl border border-slate-700/30"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-800"
                        />
                        <div>
                          <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{product.name}</h4>
                          <span className="text-[11px] text-slate-400">Rp {product.price.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          product.stock <= 5
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {product.stock} pcs
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="font-bold text-slate-100 text-base">Tambah Produk Baru</h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Espresso Double"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="20000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kategori</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Minuman">Minuman</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Cemilan">Cemilan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Foto Produk</label>
                <div className="flex flex-col gap-2">
                  <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-3 text-center transition-colors bg-slate-900/50 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>Upload foto dari HP / Komputer</span>
                    </div>
                  </div>
                  {newProduct.image && (
                    <div className="relative h-24 w-full rounded-xl overflow-hidden border border-slate-700">
                      <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-1">
              <h2 className="font-extrabold text-lg">Warung AI</h2>
              <p className="text-xs text-slate-500">Jl. Malioboro No. 42, Yogyakarta</p>
              <p className="text-[10px] text-slate-400">{activeReceipt.timestamp}</p>
            </div>
            
            <div className="border-t border-b border-dashed border-slate-300 py-3 text-xs space-y-2">
              <div className="flex justify-between font-mono text-[11px] text-slate-600">
                <span>ID: {activeReceipt.id}</span>
                <span>Metode: {activeReceipt.paymentMethod}</span>
              </div>
              {activeReceipt.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span>
                    {it.name} x{it.qty}
                  </span>
                  <span>Rp {(it.price * it.qty).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            <div className="text-xs space-y-1 pt-1 font-medium">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>Rp {activeReceipt.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Pajak PB1 (10%)</span>
                <span>Rp {activeReceipt.tax.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t">
                <span>Total</span>
                <span>Rp {activeReceipt.total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Display Photos in Receipt */}
            {(activeReceipt.proofImage || activeReceipt.customerImage) && (
              <div className="border-t border-slate-200 pt-3 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Dokumentasi Foto Transaksi:</p>
                <div className="grid grid-cols-2 gap-2">
                  {activeReceipt.proofImage && (
                    <div className="text-center">
                      <img
                        src={activeReceipt.proofImage}
                        alt="Bukti Struk"
                        className="w-full h-16 object-cover rounded border border-slate-200"
                      />
                      <span className="text-[9px] text-slate-400">Bukti Bayar</span>
                    </div>
                  )}
                  {activeReceipt.customerImage && (
                    <div className="text-center">
                      <img
                        src={activeReceipt.customerImage}
                        alt="Konsumen"
                        className="w-full h-16 object-cover rounded border border-slate-200"
                      />
                      <span className="text-[9px] text-slate-400">Foto Pembeli</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setActiveReceipt(null)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow"
              >
                <CheckCircle className="w-4 h-4" /> Transaksi Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {cameraTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-4 space-y-3 border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                {cameraTarget === 'proof' ? 'Foto Bukti Pembayaran / Struk' : 'Foto Konsumen / Pembeli'}
              </h3>
              <button onClick={stopCamera} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 py-2 rounded-xl text-xs text-slate-300 bg-slate-700 hover:bg-slate-600"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-1 shadow-md"
              >
                <Camera className="w-4 h-4" /> Ambil Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {previewModalData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl max-w-lg w-full p-4 space-y-3 border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-200">{previewModalData.title}</h3>
              <button
                onClick={() => setPreviewModalData(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-900 max-h-[70vh] flex items-center justify-center p-1">
              <img src={previewModalData.imgUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}