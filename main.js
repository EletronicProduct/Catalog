import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Menggabungkan Firebase SDK ke objek window
window.firebase = {
  initializeApp,
  getFirestore,
  collection,
  getDocs,
};

const { createApp, ref, computed, onMounted } = Vue;

createApp({
  setup() {
    const firebaseConfig = {
      apiKey: "AIzaSyBNDz7VwSE-gQkE1NK-sQpiYdNlB1BI46s",
      authDomain: "product-cicilan.firebaseapp.com",
      projectId: "product-cicilan",
      storageBucket: "product-cicilan.firebasestorage.app",
      messagingSenderId: "180951818261",
      appId: "1:180951818261:web:dbce045586d63ee678ee1c",
      measurementId: "G-D1PK016KK9"
    };
    
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.getFirestore(app);

    const products = ref([]);
    const isLoading = ref(true);
    const searchQuery = ref('');
    const selectedCategory = ref('all');
    const selectedProduct = ref(null);
    const selectedImage = ref('');

    const fetchProducts = async () => {
      isLoading.value = true;
      try {
        const productsCollection = firebase.collection(db, 'products');
        const productsSnapshot = await firebase.getDocs(productsCollection);
        products.value = productsSnapshot.docs.map(doc => {
          const data = doc.data();
          const selectedTenor = data.tenorOptions && data.tenorOptions.length > 0 ? data.tenorOptions[0] : null;
          return {
            id: doc.id,
            ...data,
            selectedTenor: selectedTenor
          };
        });
        console.log("Produk berhasil diambil:", products.value);
      } catch (error) {
        console.error("Kesalahan saat mengambil produk:", error);
        alert("Gagal mengambil data produk dari Firebase. Periksa koneksi internet Anda atau konfigurasi Firebase.");
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(fetchProducts);

    const filteredProducts = computed(() => {
      let filtered = products.value;

      if (selectedCategory.value !== 'all') {
        filtered = filtered.filter(product => product.category === selectedCategory.value);
      }

      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(query)
        );
      }
      
      return filtered;
    });

    const setCategory = (category) => {
        selectedCategory.value = category;
    };

    const showProductDetail = (product) => {
      console.log("Kartu produk diklik:", product);
      selectedProduct.value = product;
      selectedImage.value = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : '';
    };
    const closeProductDetail = () => {
      selectedProduct.value = null;
      selectedImage.value = '';
    };

    const handleOrder = () => {
        const pesan = `Halo, saya ingin memesan *${selectedProduct.value.name}* dengan tenor *${selectedProduct.value.selectedTenor} hari*. Total cicilan harian adalah *${formatCurrency(roundDailyPrice(calculateDailyInstallment(selectedProduct.value)))}*.`;
        
        const url = `https://wa.me/6285691009132?text=${encodeURIComponent(pesan)}`;
        
        window.open(url, '_blank');
        closeProductDetail();
    };

    const formatCurrency = (value) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(value);
    };
    
    const calculateDailyInstallment = (product) => {
      if (!product || !product.selectedTenor || !product.category) return 0;
      
      const remainingPrice = product.basePrice - product.downPayment;
      const multiplier = product.multipliers && product.multipliers[product.category] ?
                         product.multipliers[product.category][product.selectedTenor] : 1.0;
      
      return (remainingPrice * multiplier) / product.selectedTenor;
    };

    const roundDailyPrice = (price) => {
      const roundedPrice = Math.round(price);
      
      if (roundedPrice >= 300 && roundedPrice <= 400) return 500;
      if (roundedPrice >= 600 && roundedPrice <= 700) return 500;
      if (roundedPrice >= 800 && roundedPrice <= 900) return 1000;
      
      return Math.round(roundedPrice / 500) * 500;
    };

    return {
      products,
      isLoading,
      searchQuery,
      selectedCategory,
      filteredProducts,
      selectedProduct,
      selectedImage,
      showProductDetail,
      closeProductDetail,
      handleOrder,
      setCategory,
      formatCurrency,
      calculateDailyInstallment,
      roundDailyPrice,
    };
  },
}).mount('#app');
