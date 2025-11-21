import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios';
import { getImageUrl } from '../utils/imageUrl';
import { PASSWORD_REQUIREMENTS_TEXT, passwordMeetsRequirements } from '../utils/passwordRules';
import { regions, getProvincesByRegion, getCityMunByProvince, getBarangayByMun } from 'phil-reg-prov-mun-brgy';
import { useAuth } from '../context/AuthContext';
import { FaUserCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

// Template mapping
const templateFileMap = {
  bladesmith: 'struvaris.html',
  pottery: 'truvara.html',
  balisong: 'ructon.html',
  fireandsteel: 'fireandsteel.html',
  carved: 'carved.html',
  revolve: 'revolve.html',
  bladebinge: 'bladebinge.html'
};

const PublishedStore = () => {
  const { domain } = useParams();
  const navigate = useNavigate();
  const { login: loginContext, user } = useAuth();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [categoriesDropdownPosition, setCategoriesDropdownPosition] = useState({ top: 120, left: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const iframeRef = React.useRef(null);
  const categoriesDropdownRef = React.useRef(null);
  
  // Login/Register modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showInitialLoginModal, setShowInitialLoginModal] = useState(false);
  const [modalMode, setModalMode] = useState('login'); // 'login' or 'register'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginNotice, setLoginNotice] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [pendingOrderProduct, setPendingOrderProduct] = useState(null);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendVerificationLoading, setResendVerificationLoading] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartSearchTerm, setCartSearchTerm] = useState('');
  
  const storeLogoUrl = React.useMemo(() => {
    if (!store) return null;
    const logoSource = store.logo || store?.content?.branding?.logo;
    if (!logoSource) return null;
    return getImageUrl(logoSource);
  }, [store]);
  
  // Helper function to get customer data
  const getCustomerData = () => {
    let customerData = customerInfo;
    
    if (!customerData) {
      try {
        const stored = localStorage.getItem('customerInfo');
        if (stored) {
          customerData = JSON.parse(stored);
        }
      } catch (err) {
        console.warn('Unable to parse stored customer info:', err);
      }
    }
    
    if (!customerData && user && user.type === 'customer') {
      customerData = user;
    }
    
    return customerData;
  };
  
  // Helper function to pre-fill order form with customer info
  const prefillOrderForm = (product) => {
    const customerData = getCustomerData();
    const weightValue = product && product.weight ? parseFloat(product.weight) : 0;
    let defaultWeightBand = '';
    
    if (weightValue > 0) {
      if (weightValue <= 0.5) defaultWeightBand = '0-0.5';
      else if (weightValue > 0.5 && weightValue <= 1) defaultWeightBand = '0.5-1';
      else if (weightValue > 1 && weightValue <= 3) defaultWeightBand = '1-3';
      else if (weightValue >= 5 && weightValue <= 6) defaultWeightBand = '5-6';
    }
    
    return {
      customerName: customerData ? `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim() : '',
      customerEmail: customerData?.email || '',
      customerPhone: customerData?.phone || '',
      quantity: 1,
      paymentMethod: 'gcash',
      region: '',
      province: '',
      municipality: '',
      barangay: '',
      weightBand: defaultWeightBand,
      shipping: 0,
      paymentReference: ''
    };
  };

  const cartModalProducts = React.useMemo(() => {
    if (!Array.isArray(products)) return [];
    if (!cartSearchTerm.trim()) return products;
    const term = cartSearchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const name = (product.name || '').toLowerCase();
      const category = (product.category || '').toLowerCase();
      return name.includes(term) || category.includes(term);
    });
  }, [products, cartSearchTerm]);

  const closeCartModal = () => {
    setShowCartModal(false);
    setCartSearchTerm('');
  };

  const handleCartOrderClick = (product) => {
    if (!product) return;
    setSelectedProduct(product);
    setOrderData(prefillOrderForm(product));
    setProvincesList([]);
    setMunicipalitiesList([]);
    setBarangaysList([]);
    setOrderError('');
    setOrderSuccess(false);
    setShowCartModal(false);
    setShowOrderModal(true);
  };
  
  // Register form state
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  
  // Order modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    quantity: 1,
    paymentMethod: 'gcash',
    region: '',
    province: '',
    municipality: '',
    barangay: '',
    weightBand: '', // e.g. '0-0.5', '0.5-1', '1-3', '5-6'
    shipping: 0,
    paymentReference: '' // Reference code inputted by buyer
  });
  const [regionsList] = useState(regions);
  const [provincesList, setProvincesList] = useState([]);
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [barangaysList, setBarangaysList] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderReferenceNumber, setOrderReferenceNumber] = useState(null);

  // Helper: classify destination area based on region/province
  const getDestinationArea = (regionCode, provinceCode) => {
    if (!regionCode) return null;
    const code = String(regionCode);

    // Metro Manila (NCR)
    if (code === '13') return 'Metro Manila';

    // Visayas regions (Region VI, VII, VIII)
    if (['06', '07', '08'].includes(code)) return 'Visayas';

    // Mindanao regions (IX, X, XI, XII, XIII/Caraga, BARMM)
    if (['09', '10', '11', '12', '16', '17', '15'].includes(code)) return 'Mindanao';

    // Island provinces (special handling) - based on province name
    if (provinceCode && provincesList && provincesList.length > 0) {
      const prov = provincesList.find(p => String(p.prov_code) === String(provinceCode));
      const name = prov?.name?.toUpperCase() || '';
      const islandProvinces = ['PALAWAN', 'BATANES', 'SIQUIJOR', 'CAMIGUIN', 'GUIMARAS', 'DINAGAT', 'BASILAN', 'SULU', 'TAWI-TAWI'];
      if (islandProvinces.some(island => name.includes(island))) {
        return 'Island';
      }
    }

    // Default: Luzon
    return 'Luzon';
  };

  // Helper: shipping rate table by weight band and destination
  const getShippingRate = (weightBand, destinationArea) => {
    if (!weightBand || !destinationArea) return 0;

    const rates = {
      '0-0.5': {
        'Visayas': 85,
        'Metro Manila': 100,
        'Luzon': 100,
        'Mindanao': 105,
        'Island': 115
      },
      '0.5-1': {
        'Visayas': 155,
        'Metro Manila': 180,
        'Luzon': 180,
        'Mindanao': 175,
        'Island': 185
      },
      '1-3': {
        'Visayas': 180,
        'Metro Manila': 200,
        'Luzon': 200,
        'Mindanao': 200,
        'Island': 210
      },
      '5-6': {
        'Visayas': 455,
        'Metro Manila': 500,
        'Luzon': 500,
        'Mindanao': 475,
        'Island': 485
      }
    };

    return rates[weightBand]?.[destinationArea] || 0;
  };
  
  // Ref to store callback function for order button clicks
  const orderButtonCallbackRef = React.useRef(null);

  useEffect(() => {
    if (!showCategoriesModal) return;

    const handleClickOutside = (event) => {
      if (
        categoriesDropdownRef.current &&
        !categoriesDropdownRef.current.contains(event.target)
      ) {
        setShowCategoriesModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoriesModal]);

  // Automatically calculate shipping fee when address or weight changes
  useEffect(() => {
    try {
      if (!orderData.region || !orderData.weightBand) {
        return;
      }
      const destinationArea = getDestinationArea(orderData.region, orderData.province);
      const rate = getShippingRate(orderData.weightBand, destinationArea);
      if (rate && !Number.isNaN(rate)) {
        setOrderData(prev => ({
          ...prev,
          shipping: rate
        }));
      }
    } catch (err) {
      console.error('Error calculating shipping rate:', err);
    }
  }, [orderData.region, orderData.province, orderData.weightBand]);
  
  // Create a global function that the iframe can call
  useEffect(() => {
    // Store the callback in window so iframe can access it
    window.openOrderModal = (product) => {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      
      if (!token) {
        // User not logged in - show login modal first, store product for later
        setPendingOrderProduct(product);
        setShowLoginModal(true);
        return;
      }
      
      // User is logged in - open order modal directly
      setSelectedProduct(product);
      setShowOrderModal(true);
      setOrderData(prefillOrderForm(product));
      setProvincesList([]);
      setMunicipalitiesList([]);
      setBarangaysList([]);
      setOrderError('');
      setOrderSuccess(false);
      setOrderReferenceNumber(null);
    };
    
    return () => {
      delete window.openOrderModal;
    };
  }, []);

  // Show login modal immediately when page loads (if not logged in)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && !loading) {
      if (!customerInfo) {
        const timer = setTimeout(() => {
          setShowInitialLoginModal(true);
          setModalMode('login');
        }, 500);
        return () => clearTimeout(timer);
      }
    } else if (token && customerInfo) {
      setShowInitialLoginModal(false);
    }
  }, [loading, customerInfo]);
  
  const startCustomerVerification = (email, message) => {
    if (!email) {
      setRegisterError('Email is required for verification.');
      return;
    }
    setVerificationEmail(email);
    setVerificationCode('');
    setVerificationError('');
    setVerificationMessage(message || `Enter the 6-digit code sent to ${email}.`);
    setModalMode('verify');
    setShowInitialLoginModal(true);
    setShowLoginModal(false);
    setLoginError('');
    setLoginNotice('');
    setRegisterError('');
  };

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginNotice('');
    setLoginLoading(true);

    try {
      const response = await apiClient.post('/auth/customer/login', {
        email: loginEmail,
        password: loginPassword
      });

      if (response.data.token) {
        // Store the token in localStorage
        const token = response.data.token;
        localStorage.setItem('token', token);
        
        // Update auth context
        loginContext(response.data.user);
        
        // Store customer info for pre-filling order form
        const loggedInCustomer = response.data.user;
        setCustomerInfo(loggedInCustomer);
        localStorage.setItem('customerInfo', JSON.stringify(loggedInCustomer));
        
        // Clear form
        setLoginEmail('');
        setLoginPassword('');
        
        // Close both modals
        setShowLoginModal(false);
        setShowInitialLoginModal(false);
        setVerificationMessage('');
        setVerificationError('');
        setVerificationCode('');
        setVerificationEmail('');
        
        // If there was a pending order, open the order modal now
        if (pendingOrderProduct) {
          // Small delay to ensure state is updated
          setTimeout(() => {
            window.openOrderModal(pendingOrderProduct);
            setPendingOrderProduct(null);
          }, 100);
        }
      } else {
        setLoginError('No token received from server');
      }
    } catch (error) {
      const msg = error.response?.data?.message;
      if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
        startCustomerVerification(loginEmail, msg || 'Please verify your email to continue.');
      } else {
        setLoginError(msg || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle registration submission
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');

    // Validate passwords match
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }

    if (!passwordMeetsRequirements(registerForm.password)) {
      setRegisterError(PASSWORD_REQUIREMENTS_TEXT);
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await apiClient.post('/auth/customer/register', {
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        email: registerForm.email,
        password: registerForm.password
      });

      setRegisterError('');
      setRegisterForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      startCustomerVerification(
        registerForm.email,
        response.data?.message || 'We sent a verification code to your email.'
      );
    } catch (error) {
      setRegisterError(
        error.response?.data?.message || 
        'An error occurred during registration. Please try again.'
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleCustomerVerification = async (e) => {
    e.preventDefault();
    if (!verificationEmail) {
      setVerificationError('Email is required.');
      return;
    }
    if (!verificationCode || verificationCode.length < 4) {
      setVerificationError('Please enter the verification code.');
      return;
    }
    setVerificationError('');
    setVerificationLoading(true);
    try {
      const payload = { email: verificationEmail, code: verificationCode.trim() };
      const response = await apiClient.post('/auth/customer/verify', payload);
      setVerificationMessage(response.data?.message || 'Email verified! Please log in.');
      setLoginNotice('Email verified! Please log in to continue.');
      setModalMode('login');
      setLoginEmail(verificationEmail);
      setVerificationCode('');
    } catch (error) {
      setVerificationError(
        error.response?.data?.message || 'Verification failed. Please check the code and try again.'
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCustomerVerification = async () => {
    if (!verificationEmail) {
      setVerificationError('Email is required.');
      return;
    }
    setVerificationError('');
    setResendVerificationLoading(true);
    try {
      const response = await apiClient.post('/auth/customer/resend-verification', { email: verificationEmail });
      setVerificationMessage(response.data?.message || 'We sent a new code to your email.');
    } catch (error) {
      setVerificationError(
        error.response?.data?.message || 'Unable to resend code right now. Please try again shortly.'
      );
    } finally {
      setResendVerificationLoading(false);
    }
  };

  useEffect(() => {
    const fetchStore = async () => {
      // Store is publicly accessible - no authentication required to view
      try {
        // Decode the domain from URL params first (React Router may have encoded it)
        const decodedDomain = decodeURIComponent(domain || '');
        // Then encode it for the API call to handle spaces and special characters
        const encodedDomain = encodeURIComponent(decodedDomain);
        
        console.log('🔍 Fetching store with domain:', decodedDomain);
        console.log('🔍 Encoded domain for API:', encodedDomain);
        
        const response = await apiClient.get(
          `/stores/public/${encodedDomain}`
        );
        
        console.log('✅ Store fetched:', response.data?.storeName, 'Domain:', response.data?.domainName);

        setStore(response.data);
        
        // Update Open Graph meta tags for social media sharing
        const storeUrl = window.location.href;
        const storeTitle = response.data?.storeName || 'Check out this store!';
        const storeDescription = response.data?.description || 'Visit this amazing online store';
        const storeImage = response.data?.content?.background?.image 
          ? getImageUrl(response.data.content.background.image) 
          : `${window.location.origin}/logoweb.png`;
        
        // Update or create Open Graph meta tags
        const updateMetaTag = (property, content) => {
          let meta = document.querySelector(`meta[property="${property}"]`);
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
          }
          meta.setAttribute('content', content);
        };
        
        // Standard meta tags
        updateMetaTag('og:title', storeTitle);
        updateMetaTag('og:description', storeDescription);
        updateMetaTag('og:image', storeImage);
        updateMetaTag('og:url', storeUrl);
        updateMetaTag('og:type', 'website');
        
        // Twitter Card meta tags
        updateMetaTag('twitter:card', 'summary_large_image');
        updateMetaTag('twitter:title', storeTitle);
        updateMetaTag('twitter:description', storeDescription);
        updateMetaTag('twitter:image', storeImage);
        
        // Update page title
        document.title = storeTitle;
        
        console.log('📦 Store loaded:', response.data);
        console.log('📦 Store content:', response.data.content);
        console.log('📦 Background settings:', response.data.content?.background);
        
        // Fetch products from the Products API for this store
        let fetchedProducts = [];
        try {
          const productsResponse = await apiClient.get(
            `/products/public/${response.data.id}`
          );
          fetchedProducts = productsResponse.data || [];
          setProducts(fetchedProducts);
          setFilteredProducts(fetchedProducts);
        } catch (productsError) {
          console.error('Error fetching products:', productsError);
          // If products API fails, use products from store.content as fallback
          fetchedProducts = response.data.content?.products || [];
          setProducts(fetchedProducts);
          setFilteredProducts(fetchedProducts);
        }

        // Fetch categories for this store
        try {
          const categoriesResponse = await apiClient.get(
            `/products/public/${response.data.id}/categories`
          );
          setCategories(categoriesResponse.data || []);
        } catch (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          // Extract categories from fetched products if API fails
          const productCategories = fetchedProducts
            .map(p => p.category)
            .filter(c => c && c.trim() !== '');
          setCategories([...new Set(productCategories)].sort());
        }
        
        // Load the template file
        const templateFile = templateFileMap[response.data.templateId] || 'struvaris.html';
        try {
          const templateResponse = await fetch(`/templates/${templateFile}`);
          if (!templateResponse.ok) {
            throw new Error(`Template file not found: ${templateFile}`);
          }
          const html = await templateResponse.text();
          setHtmlContent(html);
        } catch (templateError) {
          console.error('Error loading template:', templateError);
          setError(`Template file not found: ${templateFile}. Please check if the template exists.`);
        }
      } catch (error) {
        console.error('Error fetching published store:', error);
        console.error('Error details:', error.response?.data);
        
        if (error.response?.status === 404) {
          setError('Store not found or not published. Make sure the store is published and the domain name is correct.');
        } else if (error.response?.status === 403) {
          setError('Access denied. This store may not be published yet.');
        } else {
          setError(`Error loading store: ${error.response?.data?.message || error.message}`);
        }
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    if (domain) {
      fetchStore();
    } else {
      setError('No domain specified in URL');
      setLoading(false);
    }
  }, [domain]);

  // Filter products by category
  useEffect(() => {
    if (selectedCategory === '') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === selectedCategory));
    }
  }, [products, selectedCategory]);

  // Handle category selection
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowCategoriesModal(false);
    // Scroll to products section after a short delay
    setTimeout(() => {
      const productsSection = iframeRef.current?.contentDocument?.querySelector('.products, .products-section, #products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Clear category filter
  const clearCategoryFilter = () => {
    setSelectedCategory('');
    setShowCategoriesModal(false);
  };

  // Listen for postMessage from iframe to show categories modal
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SHOW_CATEGORIES') {
        if (event.data.rect && iframeRef.current) {
          try {
            const iframeRect = iframeRef.current.getBoundingClientRect();
            const rect = event.data.rect;
            const topOffset = iframeRect.top + rect.bottom + window.scrollY + 8;
            const leftOffset = iframeRect.left + rect.left + rect.width / 2 + window.scrollX;
            setCategoriesDropdownPosition({ top: topOffset, left: leftOffset });
          } catch (err) {
            console.warn('Could not calculate dropdown position:', err);
            setCategoriesDropdownPosition({ top: 120, left: null });
          }
        } else {
          setCategoriesDropdownPosition({ top: 120, left: null });
        }
        setShowCategoriesModal(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Update callback ref whenever products or state setters change
  useEffect(() => {
    orderButtonCallbackRef.current = (product) => {
      setSelectedProduct(product);
      setShowOrderModal(true);
      setOrderData(prefillOrderForm(product));
      setProvincesList([]);
      setMunicipalitiesList([]);
      setBarangaysList([]);
      setOrderError('');
      setOrderSuccess(false);
      setOrderReferenceNumber(null);
    };
  }, [products]);

  // Update iframe with store content
  useEffect(() => {
    if (!store || !htmlContent || !iframeRef.current) return;
    
    // Use category filter when selected, otherwise fall back to full list
    const baseProducts = products.length > 0 ? products : (store.content?.products || []);
    const displayProducts = selectedCategory ? filteredProducts : baseProducts;

    const updateIframe = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      
      let iframeDoc;
      try {
        iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      } catch (err) {
        console.error('Cannot access iframe document:', err);
        return;
      }
      
      if (!iframeDoc) return;

      try {
        // Write the HTML content first if not already written
        if (!iframeDoc.body || iframeDoc.body.children.length === 0) {
          iframeDoc.open();
          iframeDoc.write(htmlContent);
          iframeDoc.close();
          // Wait a bit then update
          setTimeout(updateIframe, 100);
          return;
        }

        // Apply background settings
        const backgroundSettings = store.content?.background || { type: 'color', color: '#0a0a0a' };
        console.log('🎨 Applying background settings:', backgroundSettings);
        console.log('🎨 Store content:', store.content);
        console.log('🎨 Background type:', backgroundSettings.type);
        console.log('🎨 Background image:', backgroundSettings.image);
        console.log('🎨 Background color:', backgroundSettings.color);
        
        const body = iframeDoc.body;
        if (body) {
          if (backgroundSettings.type === 'color') {
            body.style.setProperty('background-color', backgroundSettings.color || '#0a0a0a', 'important');
            body.style.setProperty('background-image', 'none', 'important');
            console.log('✅ Applied color background:', backgroundSettings.color);
          } else if (backgroundSettings.type === 'image' && backgroundSettings.image) {
            // Handle both full URLs and relative paths
            let imageUrl = backgroundSettings.image;
            console.log('🖼️ Original image URL:', imageUrl);
            
            // If it's already a full URL, use it; otherwise get full URL
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
              imageUrl = getImageUrl(imageUrl) || imageUrl;
            }
            
            console.log('🖼️ Final image URL:', imageUrl);
            // Use setProperty with important flag to override any template styles
            body.style.setProperty('background-image', `url("${imageUrl}")`, 'important');
            body.style.setProperty('background-repeat', backgroundSettings.repeat || 'no-repeat', 'important');
            body.style.setProperty('background-size', backgroundSettings.size || 'cover', 'important');
            body.style.setProperty('background-position', backgroundSettings.position || 'center', 'important');
            body.style.setProperty('background-color', backgroundSettings.color || '#0a0a0a', 'important');
            body.style.setProperty('background-attachment', 'scroll', 'important');
            
            console.log('✅ Applied image background to body');
            // Verify the style was applied
            const appliedBg = body.style.getPropertyValue('background-image');
            console.log('✅ Body background-image style:', appliedBg);
          } else {
            console.warn('⚠️ No background image found, using default color');
            body.style.setProperty('background-color', backgroundSettings.color || '#0a0a0a', 'important');
            body.style.setProperty('background-image', 'none', 'important');
          }
        }

        // Don't apply to html element - only body should have background
        const html = iframeDoc.documentElement;
        if (html) {
          html.style.setProperty('background-image', 'none', 'important');
          html.style.setProperty('background-color', 'transparent', 'important');
        }
        
        // Remove default template background images (like the sunglasses in hero::before)
        // We need to inject CSS to override the ::before pseudo-element
        let overrideStyle = iframeDoc.getElementById('background-override-style');
        if (!overrideStyle) {
          overrideStyle = iframeDoc.createElement('style');
          overrideStyle.id = 'background-override-style';
          iframeDoc.head.appendChild(overrideStyle);
        }
        
        // Aggressively remove ALL default background images from hero section
        overrideStyle.textContent = `
          /* Remove hero::before pseudo-element completely */
          .hero::before {
            background-image: none !important;
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            content: none !important;
            position: absolute !important;
            width: 0 !important;
            height: 0 !important;
          }
          
          /* Remove hero::after as well */
          .hero::after {
            background-image: none !important;
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            content: none !important;
          }
          
          /* Remove any default hero background - make it transparent */
          .hero {
            background-image: none !important;
            background: transparent !important;
          }
          
          /* Remove background from any hero children */
          .hero > * {
            background-image: none !important;
          }
          
          /* Remove background from body if it has a default image */
          body {
            background-image: none !important;
          }
        `;
        
        // If we have a custom background, ensure it's applied ONLY to body (not html, not hero)
        if (backgroundSettings.type === 'image' && backgroundSettings.image) {
          let imageUrl = backgroundSettings.image;
          if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
            imageUrl = getImageUrl(imageUrl) || imageUrl;
          }
          overrideStyle.textContent += `
            /* Ensure custom background is visible ONLY on body */
            body {
              background-image: url("${imageUrl}") !important;
              background-repeat: ${backgroundSettings.repeat || 'no-repeat'} !important;
              background-size: ${backgroundSettings.size || 'cover'} !important;
              background-position: ${backgroundSettings.position || 'center'} !important;
              background-attachment: scroll !important;
            }
            
            /* Ensure html doesn't have background */
            html {
              background-image: none !important;
              background-color: transparent !important;
            }
          `;
        }

        // Update hero section - prioritize store form data over content
        const heroContent = store.content?.hero || {};
        
        // Use store name from form if hero title is empty or not set
        const heroTitle = (heroContent.title && heroContent.title.trim()) 
          ? heroContent.title.trim() 
          : (store.storeName || 'Store');
        
        const heroH1 = iframeDoc.querySelector('.hero h1, h1.hero-title');
        if (heroH1) {
          heroH1.textContent = heroTitle;
        }

        // Use store description from form if hero subtitle is empty or not set
        const heroP = iframeDoc.querySelector('.hero .hero-content p, .hero p, .hero-subtitle');
        if (heroP) {
          let subtitleText = '';
          if (heroContent.subtitle && heroContent.subtitle.trim()) {
            subtitleText = heroContent.subtitle.replace(/^<p>|<\/p>$/g, '').trim();
          }
          
          // If no subtitle in content, use store description from form
          if (!subtitleText && store.description && store.description.trim()) {
            subtitleText = store.description.trim();
          }
          
          if (subtitleText) {
            // Check if it contains HTML tags
            if (subtitleText.includes('<')) {
              heroP.innerHTML = subtitleText;
            } else {
              heroP.textContent = subtitleText;
            }
          }
        }

        // Apply saved element states (visibility and position)
        const elementStates = store.content?.elementStates || {};
        if (Object.keys(elementStates).length > 0) {
          console.log('🎨 Applying element states:', elementStates);
          
          // First, ensure all elements have data-move-id attributes
          const selectors = [
            '.hero h1', '.hero h2', '.hero h3', '.hero p', '.hero .title', '.hero .subtitle',
            '.welcome-title', 'h1', 'h2', 'h3', 'p', '.product-title', '.section-title', '.headline', '.subhead',
            'button', '.button', '.cta-button', '.hero button', '.hero .button', 'a.button', 'a.cta-button'
          ];
          
          // Assign IDs to elements that match selectors (using same logic as SiteBuilder)
          selectors.forEach(sel => {
            iframeDoc.querySelectorAll(sel).forEach((el, idx) => {
              if (!el.getAttribute('data-move-id')) {
                const text = (el.textContent || '').trim().slice(0, 60);
                const tag = el.tagName.toLowerCase();
                const className = (el.className || '').toString().trim();
                const id = `${tag}-${className}-${text}`.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '').slice(0, 50) || `${tag}-${idx}`;
                el.setAttribute('data-move-id', id);
              }
            });
          });
          
          // Helper function to apply state to an element
          const applyStateToElement = (el, state) => {
            // Apply deletion first (highest priority)
            if (state.deleted === true) {
              el.setAttribute('data-deleted', 'true');
              el.style.display = 'none';
              return; // Don't apply other states if deleted
            }
            
            // Apply visibility
            if (state.display === 'none') {
              el.style.display = 'none';
            } else if (state.display === '') {
              el.style.display = '';
            }
            
            // Apply position (from move mode)
            if (state.offsetLeft !== undefined && state.offsetLeft !== '0') {
              el.setAttribute('data-offset-left', state.offsetLeft);
            }
            if (state.offsetTop !== undefined && state.offsetTop !== '0') {
              el.setAttribute('data-offset-top', state.offsetTop);
            }
            
            // Apply transform
            if (state.transform) {
              el.style.transform = state.transform;
            } else if (state.offsetLeft !== undefined && state.offsetTop !== undefined) {
              // Reconstruct transform from offsets if transform not saved
              const left = parseFloat(state.offsetLeft || '0');
              const top = parseFloat(state.offsetTop || '0');
              if (left !== 0 || top !== 0) {
                el.style.transform = `translate(${left}px, ${top}px)`;
                // Ensure position is relative if element was moved
                if (el.style.position === 'static' || !el.style.position) {
                  el.style.position = 'relative';
                }
              }
            }
          };

          // Apply saved states
          Object.keys(elementStates).forEach(id => {
            const state = elementStates[id];
            let el = iframeDoc.querySelector(`[data-move-id="${id}"]`);
            
            if (el) {
              applyStateToElement(el, state);
              console.log(`✅ Applied state to element ${id} (found by ID):`, state);
            } else {
              // Try to find by metadata (tag, className, text) if ID not found
              let found = false;
              
              if (state.selector) {
                const elements = iframeDoc.querySelectorAll(state.selector);
                elements.forEach((el) => {
                  if (found) return; // Only apply to first match
                  
                  const text = (el.textContent || '').trim().slice(0, 60);
                  const tag = el.tagName.toLowerCase();
                  const className = (el.className || '').toString().trim();
                  
                  // Match by tag, className, and text if available
                  const tagMatch = !state.tag || tag === state.tag;
                  const classMatch = !state.className || className === state.className || className.includes(state.className);
                  const textMatch = !state.text || text === state.text || text.includes(state.text) || state.text.includes(text);
                  
                  if (tagMatch && (classMatch || textMatch)) {
                    el.setAttribute('data-move-id', id);
                    applyStateToElement(el, state);
                    found = true;
                    console.log(`✅ Applied state to element ${id} (found by metadata):`, state);
                    // If deleted, also mark it
                    if (state.deleted === true) {
                      el.setAttribute('data-deleted', 'true');
                    }
                  }
                });
              }
              
              if (!found) {
                console.warn(`⚠️ Could not find element with ID ${id} or matching metadata:`, state);
              }
            }
          });
          
          console.log('✅ Element states applied');
        }

        // Update CTA button - try multiple selectors
        const ctaButtonSelectors = [
          '.hero .cta-button',
          '.cta-button',
          '.hero button',
          'button.cta-button',
          '.hero-content button',
          '.hero button.cta-button'
        ];
        
        let ctaButton = null;
        for (const selector of ctaButtonSelectors) {
          ctaButton = iframeDoc.querySelector(selector);
          if (ctaButton) break;
        }
        
        if (ctaButton) {
          const buttonText = heroContent.buttonText || 'Shop Now';
          ctaButton.textContent = buttonText;
          ctaButton.innerHTML = buttonText;
          
          // Ensure button is visible and clickable
          if (ctaButton.style) {
            ctaButton.style.display = 'inline-block';
            ctaButton.style.visibility = 'visible';
            ctaButton.style.opacity = '1';
            ctaButton.style.cursor = 'pointer';
            ctaButton.style.pointerEvents = 'auto';
          }
          
          // Add click handler to scroll to products section
          ctaButton.onclick = (e) => {
            e.preventDefault();
            const productsSection = iframeDoc.querySelector('.products, .products-section, #products, section.products');
            if (productsSection) {
              productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              // Fallback: scroll to first product card
              const firstProduct = iframeDoc.querySelector('.product-card, .product');
              if (firstProduct) {
                firstProduct.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
          };
          
          // Make sure button is not disabled
          ctaButton.disabled = false;
          ctaButton.removeAttribute('disabled');
          
          console.log('CTA button updated:', buttonText, 'Button element:', ctaButton);
        } else {
          // Try to find any button in hero section as fallback
          const heroButtons = iframeDoc.querySelectorAll('.hero button, .hero-content button');
          if (heroButtons.length > 0) {
            const button = heroButtons[0];
            const buttonText = heroContent.buttonText || 'Shop Now';
            button.textContent = buttonText;
            button.innerHTML = buttonText;
            
            // Add click handler
            button.onclick = (e) => {
              e.preventDefault();
              const productsSection = iframeDoc.querySelector('.products, .products-section, #products');
              if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            };
            
            button.style.display = 'inline-block';
            button.style.cursor = 'pointer';
            button.disabled = false;
            
            console.log('CTA button found via fallback selector:', button);
          } else {
            console.warn('No CTA button found in hero section. Available buttons:', iframeDoc.querySelectorAll('button'));
          }
        }

        // Update products - use products from API (Products table) or fallback to content
        if (displayProducts && Array.isArray(displayProducts) && displayProducts.length > 0) {
          const darkBackgroundTemplates = ['bladebinge', 'struvaris', 'ructon'];
          const priceColor = store?.templateId === 'bladebinge' ? '#c9a961' : '#111';
          let descriptionColor = '#666';
          if (store?.templateId === 'bladebinge') {
            descriptionColor = '#c9a961';
          } else if (darkBackgroundTemplates.includes(store?.templateId)) {
            descriptionColor = '#999';
          }

          const ensureProductCardStyles = () => {
            try {
              if (!iframeDoc.getElementById('structura-published-style')) {
                const style = iframeDoc.createElement('style');
                style.id = 'structura-published-style';
                style.textContent = `
                  /* Normalize product info layout across templates */
                  .product-card, .product { background: transparent !important; border: none !important; }
                  .product-info, .product-title, .product-description { width: 100% !important; float: none !important; clear: both !important; }
                  .product-info {
                    background: #fff !important;
                    border-radius: 14px !important;
                    padding: 1.25rem !important;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
                  }
                  .product-title { margin: 0 0 .5rem 0; }
                  .product-description { 
                    display: -webkit-box; 
                    -webkit-line-clamp: 4; 
                    -webkit-box-orient: vertical; 
                    overflow: hidden; 
                    line-height: 1.6; 
                    color: ${descriptionColor} !important; 
                    margin: .5rem 0 1rem; 
                    white-space: normal; 
                    word-break: normal; 
                  }
                  .product-price, .price { font-weight: 700; color: ${priceColor} !important; font-size: 1.05rem; }
                  .product-footer { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-top: .5rem; }
                  .product-footer .product-button { cursor: pointer; padding: .5rem .75rem; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; }
                `;
                (iframeDoc.head || iframeDoc.body).appendChild(style);
              }
            } catch (_) {}
          };

          ensureProductCardStyles();

          // Find products section/container
          const productsSection = iframeDoc.querySelector('.products, .products-section, #products, section.products');
          const productGrid = iframeDoc.querySelector('.product-grid, .products-grid, .products .product-grid');
          const productContainer = productGrid || productsSection;
          
          if (productContainer) {
            // Get existing product cards
            const existingCards = Array.from(productContainer.querySelectorAll('.product-card, .product'));
            
            // Update existing cards and create new ones for additional products
            displayProducts.forEach((product, index) => {
              let card;
              
              const resolvedImageUrl = product.image && product.image !== '/imgplc.jpg'
                ? (product.image.startsWith('http') ? product.image : getImageUrl(product.image) || product.image)
                : '/imgplc.jpg';
              const price = parseFloat(product.price) || 0;
              let descPreview = product.description || '';
              descPreview = descPreview.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
              const escapeHtml = (value = '') => value
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
              const safeTitle = escapeHtml(product.name || 'Product');
              const safeDescPreview = escapeHtml(descPreview);
              
              const cardTemplate = `
                <div class="product-image">
                  <img src="${resolvedImageUrl}" alt="${safeTitle}" />
                </div>
                <div class="product-info">
                  <h3 class="product-title">${safeTitle}</h3>
                  <p class="product-description">${safeDescPreview}</p>
                  <div class="product-footer" style="display:flex; align-items:center; justify-content:space-between; gap:.5rem;">
                    <span class="product-price">₱${price.toFixed(2)}</span>
                    <div style="display:flex; gap:.5rem;">
                      <button class="product-button order-button" style="padding:.5rem .75rem; border-radius:8px;">Order</button>
                    </div>
                  </div>
                </div>
              `;
              
              if (existingCards[index]) {
                // Update existing card
                card = existingCards[index];
                if (!card.classList.contains('product-card')) {
                  card.classList.add('product-card');
                }
                const hasStandardLayout = card.querySelector('.product-info') && card.querySelector('.product-image');
                if (!hasStandardLayout) {
                  card.innerHTML = cardTemplate;
                }
              } else {
                // Create new product card
                card = iframeDoc.createElement('div');
                card.className = 'product-card';
                card.innerHTML = cardTemplate;
                
                // Append new card to container
                productContainer.appendChild(card);
              }
              
              // Update card content (for both existing and newly created cards)
              const titleEl = card.querySelector('.product-title, h3, h4');
              if (titleEl) {
                titleEl.textContent = product.name || '';
              }

              // Ensure an Add-to-Cart button exists alongside Order in existing template cards
              try {
                /* Cart button intentionally disabled per requirements */
              } catch (e) {
                // non-fatal if DOM differs
              }

              const priceEl = card.querySelector('.product-price, .price');
              if (priceEl) {
                const price = parseFloat(product.price) || 0;
                priceEl.textContent = `₱${price.toFixed(2)}`;
              }

              const descEl = card.querySelector('.product-description, .description, p');
              if (descEl && product.description) {
                let descText = product.description;
                if (descText.includes('<p>')) {
                  descText = descText.replace(/^<p>|<\/p>$/g, '').trim();
                  descEl.innerHTML = descText;
                } else {
                  descEl.textContent = descText;
                }
                try { descEl.classList.add('product-description'); } catch(_) {}
              }

              // Update image - check both wrapped and unwrapped image structures
              let imageEl = card.querySelector('.product-image img');
              if (!imageEl) {
                // Check if .product-image itself is an img tag
                const productImageDiv = card.querySelector('.product-image');
                if (productImageDiv && productImageDiv.tagName === 'IMG') {
                  imageEl = productImageDiv;
                } else {
                  // Fallback to any img tag
                  imageEl = card.querySelector('img');
                }
              }
              if (imageEl && imageEl.tagName === 'IMG') {
                if (product.image && product.image !== '/imgplc.jpg') {
                  const imageUrl = product.image.startsWith('http') 
                    ? product.image 
                    : getImageUrl(product.image) || product.image;
                  imageEl.src = imageUrl;
                  imageEl.alt = product.name || 'Product';
                  imageEl.style.display = 'block';
                }
              }

              // Remove category labels from product cards
              const categoryEl = card.querySelector('.product-category');
              if (categoryEl) {
                categoryEl.style.display = 'none';
                categoryEl.remove();
              }
              
              // Add click handler to Order/Inquire button
              const orderButton = card.querySelector('.product-button, .add-to-cart, button');
              if (orderButton) {
                // Ensure button has both classes for compatibility
                if (!orderButton.classList.contains('product-button')) {
                  orderButton.classList.add('product-button');
                }
                // Ensure button is visible
                orderButton.style.display = 'inline-block';
                orderButton.style.visibility = 'visible';
                orderButton.style.opacity = '1';
                
                // Remove any existing handlers
                orderButton.onclick = null;
                // Clone the product to avoid closure issues
                const productCopy = JSON.parse(JSON.stringify(product));
                
                // Try multiple methods to ensure click works
                orderButton.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // Proceed with order modal only
                  // Method 1: Call parent's global function
                  try {
                    if (window.parent && window.parent.openOrderModal) {
                      window.parent.openOrderModal(productCopy);
                      return;
                    }
                  } catch (err) {
                    console.log('Cannot access parent.openOrderModal:', err);
                  }
                  
                  // Method 2: Use postMessage
                  try {
                    if (window.parent && window.parent !== window) {
                      window.parent.postMessage({
                        type: 'OPEN_ORDER_MODAL',
                        product: productCopy
                      }, '*');
                    }
                  } catch (err) {
                    console.log('PostMessage failed:', err);
                  }
                  
                  // Method 3: Direct call if same origin
                  try {
                    if (window.parent && typeof window.parent.openOrderModal === 'function') {
                      window.parent.openOrderModal(productCopy);
                    }
                  } catch (err) {
                    console.log('Direct call failed:', err);
                  }
                };

                // Also add event listener as backup
                orderButton.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    if (window.parent && window.parent.openOrderModal) {
                      window.parent.openOrderModal(productCopy);
                    } else if (window.parent && window.parent !== window) {
                      window.parent.postMessage({
                        type: 'OPEN_ORDER_MODAL',
                        product: productCopy
                      }, '*');
                    }
                  } catch (err) {
                    console.error('Order button click error:', err);
                  }
                }, { capture: true, once: false });

                // Ensure button is fully clickable and visible
                orderButton.style.cursor = 'pointer';
                orderButton.style.pointerEvents = 'auto';
                orderButton.style.zIndex = '9999';
                orderButton.style.position = 'relative';
                orderButton.style.display = 'inline-block';
                orderButton.style.visibility = 'visible';
                orderButton.style.opacity = '1';
                orderButton.disabled = false;
                orderButton.removeAttribute('disabled');
                orderButton.setAttribute('data-product-id', product.id || index);
                orderButton.setAttribute('type', 'button');
                orderButton.setAttribute('tabindex', '0');
              }
              
              // Cart feature removed: no cart button or nav link injected
            });
            
            // Add click handlers to ALL product buttons in the template (including existing ones)
            // This ensures buttons that weren't updated in the loop above still get handlers
            const allProductButtons = iframeDoc.querySelectorAll('.product-button, .add-to-cart, .product-card button, .product button');
            allProductButtons.forEach((button, btnIndex) => {
              // Skip CTA buttons in hero section
              if (button.closest('.hero') && button.classList.contains('cta-button')) {
                return;
              }
              
              // Ensure button has both classes for compatibility
              if (!button.classList.contains('product-button')) {
                button.classList.add('product-button');
              }
              if (!button.classList.contains('add-to-cart')) {
                button.classList.add('add-to-cart');
              }
              
              // Ensure button is visible
              button.style.display = 'inline-block';
              button.style.visibility = 'visible';
              button.style.opacity = '1';
              
              // Skip if already has a handler (from the loop above)
              if (button.hasAttribute('data-product-id')) {
                return;
              }
              
              // Find the corresponding product for this button by matching card content
              const card = button.closest('.product-card, .product');
              if (card) {
                // Try to find the product by matching title/name
                const titleEl = card.querySelector('.product-title, h3, h4, .product-name');
                const productName = titleEl ? titleEl.textContent.trim() : '';
                
                // Find matching product
                let matchingProduct = displayProducts.find(p => 
                  p.name && p.name.trim() === productName
                );
                
                // If no match by name, try by index position
                if (!matchingProduct) {
                  const allCards = Array.from(productContainer.querySelectorAll('.product-card, .product'));
                  const cardIndex = allCards.indexOf(card);
                  if (cardIndex >= 0 && cardIndex < displayProducts.length) {
                    matchingProduct = displayProducts[cardIndex];
                  }
                }
                
                // If we found a matching product, attach the handler
                if (matchingProduct) {
                  // Remove any existing handlers
                  button.onclick = null;
                  // Clone the product to avoid closure issues
                  const productCopy = JSON.parse(JSON.stringify(matchingProduct));
                  
                  // Try multiple methods to ensure click works
                  button.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Method 1: Call parent's global function
                    try {
                      if (window.parent && window.parent.openOrderModal) {
                        window.parent.openOrderModal(productCopy);
                        return;
                      }
                    } catch (err) {
                      console.log('Cannot access parent.openOrderModal:', err);
                    }
                    
                    // Method 2: Use postMessage
                    try {
                      if (window.parent && window.parent !== window) {
                        window.parent.postMessage({
                          type: 'OPEN_ORDER_MODAL',
                          product: productCopy
                        }, '*');
                      }
                    } catch (err) {
                      console.log('PostMessage failed:', err);
                    }
                  };
                  
                  // Also add event listener as backup
                  button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    try {
                      if (window.parent && window.parent.openOrderModal) {
                        window.parent.openOrderModal(productCopy);
                      } else if (window.parent && window.parent !== window) {
                        window.parent.postMessage({
                          type: 'OPEN_ORDER_MODAL',
                          product: productCopy
                        }, '*');
                      }
                    } catch (err) {
                      console.error('Order button click error:', err);
                    }
                  }, { capture: true, once: false });
                  
                  // Ensure button is fully clickable and visible
                  button.style.cursor = 'pointer';
                  button.style.pointerEvents = 'auto';
                  button.style.zIndex = '9999';
                  button.style.position = 'relative';
                  button.style.display = 'inline-block';
                  button.style.visibility = 'visible';
                  button.style.opacity = '1';
                  button.disabled = false;
                  button.removeAttribute('disabled');
                  button.setAttribute('data-product-id', matchingProduct.id || btnIndex);
                  button.setAttribute('type', 'button');
                  button.setAttribute('tabindex', '0');
                  
                  // Ensure minimum button styling if template CSS doesn't apply
                  const computedStyle = window.getComputedStyle ? window.getComputedStyle(button) : null;
                  if (computedStyle && (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0')) {
                    button.style.display = 'inline-block';
                    button.style.visibility = 'visible';
                    button.style.opacity = '1';
                  }
                  
                  // Remove any CSS that might block clicks
                  const card = button.closest('.product-card, .product');
                  if (card) {
                    card.style.pointerEvents = 'auto';
                    card.style.position = 'relative';
                    card.style.zIndex = '1';
                  }
                }
              }
            });
            
            // Remove any extra cards that exceed the number of products
            const allCards = Array.from(productContainer.querySelectorAll('.product-card, .product'));
            if (allCards.length > displayProducts.length) {
              for (let i = displayProducts.length; i < allCards.length; i++) {
                allCards[i].remove();
              }
            }
            
            console.log(`✅ Updated/created ${displayProducts.length} products in published store`);
            
            // Inject click handler script after products are updated
            try {
              const script = iframeDoc.createElement('script');
              script.textContent = `
                (function() {
                  function setupOrderButtons() {
                    const buttons = document.querySelectorAll('.product-button, .add-to-cart, .product-card button, .product button, button.add-to-cart');
                    buttons.forEach(function(button) {
                      // Skip CTA buttons (they have separate handlers)
                      if (button.closest('.hero') && button.classList.contains('cta-button')) return;
                      if (button.hasAttribute('data-handler-attached-v2')) return;
                      button.setAttribute('data-handler-attached-v2', 'true');
                      
                      // Remove existing onclick to avoid duplicates
                      button.onclick = null;
                      
                      button.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        
                        const card = button.closest('.product-card, .product');
                        if (card) {
                          const titleEl = card.querySelector('.product-title, h3, h4, .product-name');
                          const productName = titleEl ? titleEl.textContent.trim() : '';
                          
                          // Send product name to parent via postMessage
                          if (window.parent && window.parent !== window) {
                            window.parent.postMessage({
                              type: 'OPEN_ORDER_MODAL',
                              productName: productName
                            }, '*');
                          }
                        }
                      }, true);
                      
                      // Also set onclick as backup
                      button.onclick = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const card = button.closest('.product-card, .product');
                        if (card) {
                          const titleEl = card.querySelector('.product-title, h3, h4, .product-name');
                          const productName = titleEl ? titleEl.textContent.trim() : '';
                          if (window.parent && window.parent !== window) {
                            window.parent.postMessage({
                              type: 'OPEN_ORDER_MODAL',
                              productName: productName
                            }, '*');
                          }
                        }
                      };
                      
                      // Make button clearly interactive
                      button.style.cursor = 'pointer';
                      button.style.pointerEvents = 'auto';
                      button.disabled = false;
                    });
                  }
                  
                  // Setup CTA buttons (scroll to products)
                  function setupCTAButtons() {
                    const ctaButtons = document.querySelectorAll('.hero .cta-button, .cta-button');
                    ctaButtons.forEach(function(button) {
                      if (button.hasAttribute('data-cta-handler-v2')) return;
                      button.setAttribute('data-cta-handler-v2', 'true');
                      
                      button.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        try {
                          const productsSection = document.querySelector('.products, .products-section, .featured-products');
                          if (productsSection) {
                            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          } else {
                            const firstProduct = document.querySelector('.product-card, .product');
                            if (firstProduct) {
                              firstProduct.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }
                        } catch (err) {
                          console.error('Error scrolling to products:', err);
                        }
                      }, true);
                      
                      button.style.cursor = 'pointer';
                      button.style.pointerEvents = 'auto';
                    });
                  }
                  
                  function setupAllButtons() {
                    setupOrderButtons();
                    setupCTAButtons();
                  }
                  
                  setupAllButtons();
                  setTimeout(setupAllButtons, 100);
                  setTimeout(setupAllButtons, 500);
                })();
              `;
              iframeDoc.head.appendChild(script);
            } catch (err) {
              console.error('Error injecting order button script:', err);
            }
          } else {
            console.warn('⚠️ Products section not found in template');
          }
        } else {
          console.warn('No products to display');
        }

        // Update branding/logo area (nav + footer)
        const logoDisplayName = store.storeName || 'Store';
        const injectLogoContent = (element, { clickable = false, maxHeight = 110, center = false } = {}) => {
          if (!element) return;
          if (storeLogoUrl) {
            const logoImg = iframeDoc.createElement('img');
            logoImg.src = storeLogoUrl;
            logoImg.alt = logoDisplayName;
            logoImg.style.maxHeight = `${maxHeight}px`;
            logoImg.style.objectFit = 'contain';
            logoImg.style.display = 'block';
            logoImg.style.width = 'auto';
            logoImg.style.maxWidth = '200px';
            element.innerHTML = '';
            if (center) {
              element.style.display = 'flex';
              element.style.justifyContent = 'center';
              element.style.alignItems = 'center';
            }
            element.appendChild(logoImg);
          } else {
            element.textContent = logoDisplayName;
            if (element.textContent.includes('Truvara')) {
              element.textContent = element.textContent.replace(/Truvara/gi, logoDisplayName);
            }
          }
          if (clickable) {
            element.onclick = (e) => {
              e.preventDefault();
              iframeDoc.querySelector('.hero, body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
            element.style.cursor = 'pointer';
          }
        };
        
        const logo = iframeDoc.querySelector('.logo, .navbar .logo');
        injectLogoContent(logo, { clickable: true, maxHeight: 110 });
        
        const footerLogo = iframeDoc.querySelector('.footer-logo, footer .footer-logo, footer .logo');
        injectLogoContent(footerLogo, { clickable: false, maxHeight: 60, center: true });
        
        if (!storeLogoUrl) {
          // Replace any remaining "Truvara" text in navbar and footer areas only when using text logo
          const navbar = iframeDoc.querySelector('.navbar, nav');
          if (navbar) {
            navbar.innerHTML = navbar.innerHTML.replace(/Truvara/gi, logoDisplayName);
          }
          
        const footerElement = iframeDoc.querySelector('footer');
          if (footerElement) {
            const footerHTML = footerElement.innerHTML;
            footerElement.innerHTML = footerHTML.replace(/Truvara(?!\s*©)/gi, logoDisplayName);
          }
        }

        // Add navigation link functionality and remove About/Gallery links
        // Add click handlers to navigation links
        const navLinks = iframeDoc.querySelectorAll('.nav-links a, .navbar a, nav a, header nav a');
        navLinks.forEach(link => {
          const linkText = link.textContent.trim().toLowerCase();
          
          // Skip if it's the logo (already handled above)
          if (link.classList.contains('logo')) return;

          // Handle Categories link click
          if (linkText === 'categories' || linkText.includes('categor')) {
            link.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              // Trigger categories modal in parent window
              try {
                if (window.parent && window.parent.postMessage) {
                  const rect = link.getBoundingClientRect();
                  window.parent.postMessage({ 
                    type: 'SHOW_CATEGORIES',
                    rect: {
                      top: rect.top,
                      left: rect.left,
                      width: rect.width,
                      height: rect.height,
                      bottom: rect.bottom
                    }
                  }, '*');
                }
              } catch (err) {
                console.error('Cannot post message to parent:', err);
              }
              return false;
            };
            return;
          }
          
          // Remove About and Gallery links
          if (linkText === 'about' || linkText === 'gallery') {
            link.style.display = 'none';
            link.remove();
            return;
          }
          
          link.onclick = (e) => {
            e.preventDefault();
            
            let targetSection = null;
            
            switch(linkText) {
              case 'home':
                targetSection = iframeDoc.querySelector('.hero, body');
                break;
              case 'shop now':
              case 'shopnow':
              case 'products':
                targetSection = iframeDoc.querySelector('.products, .products-section, #products, section.products');
                break;
              case 'contact':
                // Contact section or footer
                targetSection = iframeDoc.querySelector('.contact, .contact-section, #contact, section.contact, footer');
                break;
              default:
                // Try to find by text content
                targetSection = iframeDoc.querySelector(`#${linkText}, .${linkText}, section.${linkText}`);
            }
            
            if (targetSection) {
              targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              // Final fallback: scroll based on link type
              if (linkText === 'home') {
                iframeDoc.querySelector('.hero, body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else if (linkText === 'shop now' || linkText === 'shopnow' || linkText === 'products') {
                const productsSection = iframeDoc.querySelector('.products, .products-section, #products, section.products');
                if (productsSection) {
                  productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  // Fallback: scroll to first product card
                  const firstProduct = iframeDoc.querySelector('.product-card, .product');
                  if (firstProduct) {
                    firstProduct.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }
              } else if (linkText === 'contact') {
                // Scroll to footer for contact
                const footer = iframeDoc.querySelector('footer');
                if (footer) {
                  footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
            }
          };
          
          // Ensure links are clickable
          link.style.cursor = 'pointer';
          link.style.pointerEvents = 'auto';
        });

        // Ensure nav icon styles exist
        if (!iframeDoc.getElementById('structura-nav-icon-style')) {
          const navIconStyle = iframeDoc.createElement('style');
          navIconStyle.id = 'structura-nav-icon-style';
          navIconStyle.textContent = `
            .nav-icons {
              display: flex;
              gap: 1rem;
              align-items: center;
              margin-left: 1.5rem;
            }
            .nav-icon {
              border: none;
              background: transparent;
              padding: 0.35rem;
              border-radius: 999px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: background 0.2s ease, transform 0.2s ease;
            }
            .nav-icon svg {
              width: 22px;
              height: 22px;
              fill: #7f53ac;
            }
            .nav-icon:hover {
              background: rgba(127, 83, 172, 0.12);
              transform: translateY(-1px);
            }
          `;
          iframeDoc.head.appendChild(navIconStyle);
        }
        
        const navWrapper = iframeDoc.querySelector('.nav-content, .navbar, nav');
        if (navWrapper) {
          let navIconsWrapper = navWrapper.querySelector('.nav-icons');
          if (!navIconsWrapper) {
            navIconsWrapper = iframeDoc.createElement('div');
            navIconsWrapper.className = 'nav-icons';
            navWrapper.appendChild(navIconsWrapper);
          }
          navIconsWrapper.innerHTML = `
            <button type="button" class="nav-icon" data-icon="search" aria-label="Search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 2a8 8 0 105.3 14.3l4.7 4.7 1.4-1.4-4.7-4.7A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z"/>
              </svg>
            </button>
            <button type="button" class="nav-icon" data-icon="account" aria-label="Account">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.4 0-8 2.4-8 5.3V21h16v-1.7c0-2.9-3.6-5.3-8-5.3z"/>
              </svg>
            </button>
            <button type="button" class="nav-icon" data-icon="cart" aria-label="Cart">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 20a2 2 0 104 0 2 2 0 00-4 0zm9 0a2 2 0 104 0 2 2 0 00-4 0zM6.2 5l-.3-2H2v2h2l2.4 9.4c.2.9 1 1.6 2 1.6H19v-2H8.9l-.2-1H19c.9 0 1.7-.6 1.9-1.5L22.7 6H6.2z"/>
              </svg>
            </button>
          `;
        }

        // Handle nav icons (Search, Account, Cart)
        const navIcons = iframeDoc.querySelectorAll('.nav-icons .nav-icon, .nav-icons button[data-icon]');
        navIcons.forEach(icon => {
          if (!icon || icon.getAttribute('data-nav-icon-handler') === 'true') return;
          icon.setAttribute('data-nav-icon-handler', 'true');
          const ariaLabel = (icon.getAttribute('aria-label') || icon.getAttribute('title') || '').toLowerCase();
          const iconText = icon.textContent.trim();
          const iconType = icon.getAttribute('data-icon') || ariaLabel || iconText;
          
          if (iconType.includes('cart') || iconType === 'cart') {
            icon.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCartModal(true);
              setCartSearchTerm('');
            };
            icon.style.cursor = 'pointer';
            return;
          }
          
          // Handle Account icon - show profile
          if (iconType.includes('account') || iconType === 'account') {
            icon.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Show profile modal
              const customerData = getCustomerData();
              if (customerData) {
                // Create and show profile modal
                const profileModal = iframeDoc.createElement('div');
                profileModal.id = 'profile-modal';
                profileModal.style.cssText = `
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  background: rgba(0, 0, 0, 0.7);
                  z-index: 10000;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                `;
                
                const profileContent = iframeDoc.createElement('div');
                profileContent.style.cssText = `
                  background: #1a1a1a;
                  color: #e0e0e0;
                  padding: 2rem;
                  border-radius: 8px;
                  max-width: 400px;
                  width: 90%;
                  position: relative;
                `;
                
                profileContent.innerHTML = `
                  <button id="close-profile" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: #e0e0e0; font-size: 1.5rem; cursor: pointer;">×</button>
                  <h2 style="color: #c9a961; margin-bottom: 1.5rem; font-size: 1.5rem;">Profile</h2>
                  <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                      <strong style="color: #c9a961;">Name:</strong>
                      <p style="margin-top: 0.25rem;">${customerData.firstName || ''} ${customerData.lastName || ''}</p>
                    </div>
                    <div>
                      <strong style="color: #c9a961;">Email:</strong>
                      <p style="margin-top: 0.25rem;">${customerData.email || ''}</p>
                    </div>
                    ${customerData.phone ? `
                    <div>
                      <strong style="color: #c9a961;">Phone:</strong>
                      <p style="margin-top: 0.25rem;">${customerData.phone}</p>
                    </div>
                    ` : ''}
                  </div>
                `;
                
                profileModal.appendChild(profileContent);
                iframeDoc.body.appendChild(profileModal);
                
                // Close button handler
                const closeBtn = profileModal.querySelector('#close-profile');
                closeBtn.onclick = () => profileModal.remove();
                profileModal.onclick = (e) => {
                  if (e.target === profileModal) profileModal.remove();
                };
              } else {
                // Not logged in, show login modal
                setShowLoginModal(true);
                setModalMode('login');
              }
            };
            icon.style.cursor = 'pointer';
            return;
          }
          
          // Handle Search icon
          if (iconType.includes('search') || iconType === 'search') {
            icon.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Create search modal
              const searchModal = iframeDoc.createElement('div');
              searchModal.id = 'search-modal';
              searchModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding-top: 5rem;
              `;
              
              const searchContent = iframeDoc.createElement('div');
              searchContent.style.cssText = `
                background: #1a1a1a;
                color: #e0e0e0;
                padding: 2rem;
                border-radius: 8px;
                max-width: 600px;
                width: 90%;
                position: relative;
              `;
              
              searchContent.innerHTML = `
                <button id="close-search" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: #e0e0e0; font-size: 1.5rem; cursor: pointer;">×</button>
                <h2 style="color: #c9a961; margin-bottom: 1.5rem; font-size: 1.5rem;">Search Products</h2>
                <input 
                  type="text" 
                  id="search-input" 
                  placeholder="Search products..." 
                  style="width: 100%; padding: 0.75rem; background: #0a0a0a; border: 1px solid #333; color: #e0e0e0; border-radius: 4px; font-size: 1rem;"
                  autofocus
                />
                <div id="search-results" style="margin-top: 1.5rem; max-height: 400px; overflow-y: auto;"></div>
              `;
              
              searchModal.appendChild(searchContent);
              iframeDoc.body.appendChild(searchModal);
              
              const searchInput = searchContent.querySelector('#search-input');
              const searchResults = searchContent.querySelector('#search-results');
              
              // Get products from parent window or use postMessage
              const productsData = displayProducts || [];
              
              // Search function
              const performSearch = (query) => {
                if (!query || query.trim() === '') {
                  searchResults.innerHTML = '';
                  return;
                }
                
                const queryLower = query.toLowerCase().trim();
                const filteredProducts = productsData.filter(p => 
                  (p.name && p.name.toLowerCase().includes(queryLower)) ||
                  (p.description && p.description.toLowerCase().includes(queryLower))
                );
                
                if (filteredProducts.length === 0) {
                  searchResults.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No products found</p>';
                  return;
                }
                
                searchResults.innerHTML = filteredProducts.map(product => {
                  const imageUrl = product.image && product.image !== '/imgplc.jpg'
                    ? (product.image.startsWith('http') ? product.image : (window.parent && window.parent.getImageUrl ? window.parent.getImageUrl(product.image) : product.image))
                    : '/imgplc.jpg';
                  const price = parseFloat(product.price) || 0;
                  const descText = (product.description || '').replace(/<[^>]*>/g, '').substring(0, 100);
                  
                  return `
                    <div class="search-result-item" style="display: flex; gap: 1rem; padding: 1rem; border-bottom: 1px solid #333; cursor: pointer; transition: background 0.2s;" 
                         onmouseover="this.style.background='#0a0a0a'" 
                         onmouseout="this.style.background='transparent'">
                      <img src="${imageUrl}" alt="${product.name || 'Product'}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;" />
                      <div style="flex: 1;">
                        <h3 style="color: #c9a961; margin-bottom: 0.5rem; font-size: 1rem;">${(product.name || 'Product').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h3>
                        <p style="color: #999; font-size: 0.875rem; margin-bottom: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                          ${descText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}...
                        </p>
                        <p style="color: #c9a961; font-weight: 700; font-size: 1.125rem;">₱${price.toFixed(2)}</p>
                      </div>
                    </div>
                  `;
                }).join('');
                
                // Add click handlers to search results
                searchResults.querySelectorAll('.search-result-item').forEach((item, index) => {
                  item.onclick = () => {
                    const product = filteredProducts[index];
                    searchModal.remove();
                    // Open order modal for selected product via postMessage
                    if (window.parent && window.parent !== window) {
                      window.parent.postMessage({
                        type: 'OPEN_ORDER_MODAL',
                        product: product
                      }, '*');
                    }
                  };
                });
              };
              
              // Search on input
              searchInput.oninput = (e) => performSearch(e.target.value);
              
              // Close button handler
              const closeBtn = searchContent.querySelector('#close-search');
              closeBtn.onclick = () => searchModal.remove();
              searchModal.onclick = (e) => {
                if (e.target === searchModal) searchModal.remove();
              };
              
              // Focus input
              searchInput.focus();
            };
            icon.style.cursor = 'pointer';
            return;
          }
        });

        // Update store name in any visible places
        const storeNameElements = iframeDoc.querySelectorAll('[data-store-name]');
        storeNameElements.forEach(el => {
          el.textContent = store.storeName;
        });

        // Remove About section if it exists (we don't want it in published websites)
        const aboutSection = iframeDoc.querySelector('.about, .about-section, #about, section.about');
        if (aboutSection) {
          aboutSection.remove();
        }

        // Create or update Contact section
        let contactSection = iframeDoc.querySelector('.contact, .contact-section, #contact, section.contact');
        const hasAddress = store.barangay || store.municipality || store.province || store.region;
        if (!contactSection && (store.contactEmail || store.phone || hasAddress)) {
          const footer = iframeDoc.querySelector('footer');
          if (footer) {
            contactSection = iframeDoc.createElement('section');
            contactSection.className = 'contact-section';
            contactSection.id = 'contact';
            contactSection.style.cssText = 'padding: 8rem 5%; max-width: 1400px; margin: 0 auto; background: #1a1a1a; color: #e0e0e0;';
            
            const contactContent = iframeDoc.createElement('div');
            contactContent.style.cssText = 'text-align: center; max-width: 800px; margin: 0 auto;';
            
            const contactTitle = iframeDoc.createElement('h2');
            contactTitle.textContent = 'Contact Us';
            contactTitle.style.cssText = 'font-size: 3rem; font-weight: 300; letter-spacing: 4px; margin-bottom: 2rem; color: #c9a961; text-transform: uppercase;';
            
            const contactLine = iframeDoc.createElement('div');
            contactLine.style.cssText = 'width: 100px; height: 2px; background: #c9a961; margin: 0 auto 3rem;';
            
            const contactInfo = iframeDoc.createElement('div');
            contactInfo.style.cssText = 'display: flex; flex-direction: column; gap: 2rem; align-items: center;';
            
            // Address - Convert codes to names (handle both codes and names)
            const addressParts = [];
            let regionName = store.region;
            let provinceName = store.province;
            let municipalityName = store.municipality;
            let barangayName = store.barangay;
            
            // Helper function to check if value is a code (numeric) or name (text)
            const isCode = (value) => {
              if (!value) return false;
              // If it's all digits or matches code pattern (like "041014"), it's a code
              return /^\d+$/.test(value.toString().trim());
            };
            
            // Convert region code to name
            if (store.region && isCode(store.region)) {
              const region = regions.find(r => r.reg_code === store.region);
              regionName = region?.name || store.region;
            } else if (store.region) {
              regionName = store.region; // Already a name
            }
            
            // Convert province code to name
            if (store.province) {
              if (isCode(store.province) && store.region) {
                const regionCode = isCode(store.region) ? store.region : regions.find(r => r.name === store.region)?.reg_code || store.region;
                const provinces = getProvincesByRegion(regionCode);
                const province = provinces.find(p => p.prov_code === store.province);
                provinceName = province?.name || store.province;
              } else {
                provinceName = store.province; // Already a name
              }
            }
            
            // Convert municipality code to name
            if (store.municipality) {
              if (isCode(store.municipality) && store.province) {
                const provinceCode = isCode(store.province) ? store.province : (() => {
                  const regionCode = isCode(store.region) ? store.region : regions.find(r => r.name === store.region)?.reg_code || store.region;
                  const provinces = getProvincesByRegion(regionCode);
                  return provinces.find(p => p.name === store.province)?.prov_code || store.province;
                })();
                const municipalities = getCityMunByProvince(provinceCode);
                const municipality = municipalities.find(m => m.mun_code === store.municipality);
                municipalityName = municipality?.name || store.municipality;
              } else {
                municipalityName = store.municipality; // Already a name
              }
            }
            
            // Convert barangay code to name
            if (store.barangay) {
              if (isCode(store.barangay) && store.municipality) {
                const municipalityCode = isCode(store.municipality) ? store.municipality : (() => {
                  const provinceCode = isCode(store.province) ? store.province : (() => {
                    const regionCode = isCode(store.region) ? store.region : regions.find(r => r.name === store.region)?.reg_code || store.region;
                    const provinces = getProvincesByRegion(regionCode);
                    return provinces.find(p => p.name === store.province)?.prov_code || store.province;
                  })();
                  const municipalities = getCityMunByProvince(provinceCode);
                  return municipalities.find(m => m.name === store.municipality)?.mun_code || store.municipality;
                })();
                const barangays = getBarangayByMun(municipalityCode);
                const barangaysArray = barangays?.data || barangays || [];
                const barangay = Array.isArray(barangaysArray) 
                  ? barangaysArray.find(b => (b.brgy_code || b.code || b.brgyCode) === store.barangay)
                  : null;
                barangayName = barangay?.name || barangay?.brgy_name || barangay?.brgyName || store.barangay;
              } else {
                barangayName = store.barangay; // Already a name
              }
            }
            
            if (barangayName) addressParts.push(barangayName);
            if (municipalityName) addressParts.push(municipalityName);
            if (provinceName) addressParts.push(provinceName);
            if (regionName) addressParts.push(regionName);
            
            if (addressParts.length > 0) {
              const addressDiv = iframeDoc.createElement('div');
              addressDiv.style.cssText = 'font-size: 1rem; color: #999;';
              addressDiv.innerHTML = `<strong style="color: #c9a961; display: block; margin-bottom: 0.5rem;">Address:</strong>${addressParts.join(', ')}`;
              contactInfo.appendChild(addressDiv);
            }
            
            // Email
            if (store.contactEmail) {
              const emailDiv = iframeDoc.createElement('div');
              emailDiv.style.cssText = 'font-size: 1rem; color: #999;';
              const emailLink = iframeDoc.createElement('a');
              emailLink.href = `mailto:${store.contactEmail}`;
              emailLink.textContent = store.contactEmail;
              emailLink.style.cssText = 'color: #c9a961; text-decoration: none; transition: color 0.3s;';
              emailLink.onmouseover = () => emailLink.style.color = '#e0e0e0';
              emailLink.onmouseout = () => emailLink.style.color = '#c9a961';
              emailDiv.innerHTML = `<strong style="color: #c9a961; display: block; margin-bottom: 0.5rem;">Email:</strong>`;
              emailDiv.appendChild(emailLink);
              contactInfo.appendChild(emailDiv);
            }
            
            // Phone
            if (store.phone) {
              const phoneDiv = iframeDoc.createElement('div');
              phoneDiv.style.cssText = 'font-size: 1rem; color: #999;';
              const phoneLink = iframeDoc.createElement('a');
              phoneLink.href = `tel:${store.phone}`;
              phoneLink.textContent = store.phone;
              phoneLink.style.cssText = 'color: #c9a961; text-decoration: none; transition: color 0.3s;';
              phoneLink.onmouseover = () => phoneLink.style.color = '#e0e0e0';
              phoneLink.onmouseout = () => phoneLink.style.color = '#c9a961';
              phoneDiv.innerHTML = `<strong style="color: #c9a961; display: block; margin-bottom: 0.5rem;">Phone:</strong>`;
              phoneDiv.appendChild(phoneLink);
              contactInfo.appendChild(phoneDiv);
            }
            
            contactContent.appendChild(contactTitle);
            contactContent.appendChild(contactLine);
            contactContent.appendChild(contactInfo);
            contactSection.appendChild(contactContent);
            footer.parentNode.insertBefore(contactSection, footer);
          }
        } else if (contactSection) {
          // Update existing Contact section
          if (store.contactEmail) {
            const emailElements = contactSection.querySelectorAll('[data-store-email], .contact-email, a[href^="mailto:"]');
            emailElements.forEach(el => {
              if (el.tagName === 'A' && el.href.startsWith('mailto:')) {
                el.href = `mailto:${store.contactEmail}`;
                el.textContent = store.contactEmail;
              } else {
                el.textContent = store.contactEmail;
              }
            });
          }
          
          if (store.phone) {
            const phoneElements = contactSection.querySelectorAll('[data-store-phone], .contact-phone, a[href^="tel:"]');
            phoneElements.forEach(el => {
              if (el.tagName === 'A' && el.href.startsWith('tel:')) {
                el.href = `tel:${store.phone}`;
                el.textContent = store.phone;
              } else {
                el.textContent = store.phone;
              }
            });
          }
          
          // Update address - Convert codes to names (handle both codes and names)
          let regionName = store.region;
          let provinceName = store.province;
          let municipalityName = store.municipality;
          let barangayName = store.barangay;
          
          // Helper function to check if value is a code (numeric) or name (text)
          const isCode = (value) => {
            if (!value) return false;
            // If it's all digits or matches code pattern (like "041014"), it's a code
            return /^\d+$/.test(value.toString().trim());
          };
          
          // Convert region code to name
          if (store.region && isCode(store.region)) {
            const region = regions.find(r => r.reg_code === store.region);
            regionName = region?.name || store.region;
          } else if (store.region) {
            regionName = store.region; // Already a name
          }
          
          // Convert province code to name
          if (store.province) {
            if (isCode(store.province) && store.region) {
              const regionCode = isCode(store.region) ? store.region : regions.find(r => r.name === store.region)?.reg_code || store.region;
              const provinces = getProvincesByRegion(regionCode);
              const province = provinces.find(p => p.prov_code === store.province);
              provinceName = province?.name || store.province;
            } else {
              provinceName = store.province; // Already a name
            }
          }
          
          // Convert municipality code to name
          if (store.municipality) {
            if (isCode(store.municipality) && store.province) {
              const provinceCode = isCode(store.province) ? store.province : (() => {
                const regionCode = isCode(store.region) ? store.region : regions.find(r => r.name === store.region)?.reg_code || store.region;
                const provinces = getProvincesByRegion(regionCode);
                return provinces.find(p => p.name === store.province)?.prov_code || store.province;
              })();
              const municipalities = getCityMunByProvince(provinceCode);
              const municipality = municipalities.find(m => m.mun_code === store.municipality);
              municipalityName = municipality?.name || store.municipality;
            } else {
              municipalityName = store.municipality; // Already a name
            }
          }
          
          // Convert barangay code to name
          if (store.barangay) {
            if (isCode(store.barangay) && store.municipality) {
              const municipalityCode = isCode(store.municipality) ? store.municipality : (() => {
                const provinceCode = isCode(store.province) ? store.province : (() => {
                  const regionCode = isCode(store.region) ? store.region : regions.find(r => r.name === store.region)?.reg_code || store.region;
                  const provinces = getProvincesByRegion(regionCode);
                  return provinces.find(p => p.name === store.province)?.prov_code || store.province;
                })();
                const municipalities = getCityMunByProvince(provinceCode);
                return municipalities.find(m => m.name === store.municipality)?.mun_code || store.municipality;
              })();
              const barangays = getBarangayByMun(municipalityCode);
              const barangaysArray = barangays?.data || barangays || [];
              const barangay = Array.isArray(barangaysArray) 
                ? barangaysArray.find(b => (b.brgy_code || b.code || b.brgyCode) === store.barangay)
                : null;
              barangayName = barangay?.name || barangay?.brgy_name || barangay?.brgyName || store.barangay;
            } else {
              barangayName = store.barangay; // Already a name
            }
          }
          
          const addressParts = [];
          if (barangayName) addressParts.push(barangayName);
          if (municipalityName) addressParts.push(municipalityName);
          if (provinceName) addressParts.push(provinceName);
          if (regionName) addressParts.push(regionName);
          
          if (addressParts.length > 0) {
            const addressText = addressParts.join(', ');
            const addressElements = contactSection.querySelectorAll('[data-store-address], .contact-address, .address');
            addressElements.forEach(el => {
              el.textContent = addressText;
            });
          }
        }

        // Update domain name if shown anywhere
        if (store.domainName) {
          const domainElements = iframeDoc.querySelectorAll('[data-store-domain]');
          domainElements.forEach(el => {
            el.textContent = store.domainName;
          });
        }

        // Replace footer copyright text with new copyright (without store name/domain)
        const newCopyright = `© 2025 - Structura Team from Faith Colleges`;
        
        console.log('🔄 Replacing footer copyright:', newCopyright);
        
        // Find footer element
        const footer = iframeDoc.querySelector('footer');
        if (footer) {
          console.log('✅ Footer found, updating copyright...');
          
          // Strategy 1: Direct replacement of paragraphs containing old copyright text
          const footerParagraphs = footer.querySelectorAll('p');
          footerParagraphs.forEach(p => {
            const originalText = p.textContent || p.innerHTML || '';
            // Check if this paragraph contains old copyright patterns
            if (originalText.includes('©') && (
              originalText.includes('2024') || 
              originalText.includes('Truvara') || 
              originalText.includes('Ceramic Studio') ||
              originalText.includes('Crafted with artistry') ||
              originalText.includes('Store Domain')
            )) {
              console.log('🔄 Replacing copyright in paragraph:', originalText);
              p.textContent = newCopyright;
              // Also update innerHTML to ensure it's replaced
              if (p.innerHTML.includes('©')) {
                p.innerHTML = p.innerHTML.replace(/©\s*\d{4}[^<]*/gi, newCopyright);
              }
            }
          });
          
          // Strategy 2: Replace copyright text in footer HTML (handles nested HTML)
          const footerHTML = footer.innerHTML;
          if (footerHTML.includes('©') && (
            footerHTML.includes('2024') || 
            footerHTML.includes('Truvara') || 
            footerHTML.includes('Ceramic Studio') ||
            footerHTML.includes('Store Domain')
          )) {
            console.log('🔄 Replacing copyright in footer HTML');
            
            // Replace known patterns
            footer.innerHTML = footer.innerHTML.replace(
              /©\s*2024[^<]*Truvara[^<]*Ceramic\s*Studio[^<]*/gi,
              newCopyright
            );
            footer.innerHTML = footer.innerHTML.replace(
              /©\s*\d{4}[^<]*?Truvara[^<]*/gi,
              newCopyright
            );
            footer.innerHTML = footer.innerHTML.replace(
              /©\s*\d{4}[^<]*?Ceramic\s*Studio[^<]*/gi,
              newCopyright
            );
            footer.innerHTML = footer.innerHTML.replace(
              /©\s*2025[^<]*Store\s*Domain[^<]*Structura\s*Team[^<]*/gi,
              newCopyright
            );
            footer.innerHTML = footer.innerHTML.replace(
              /©\s*\d{4}[^<]*Store\s*Domain[^<]*/gi,
              newCopyright
            );
            footer.innerHTML = footer.innerHTML.replace(
              /©\s*2024[^<]*?(?=<|$)/gi,
              (match) => {
                if (!match.includes('Structura Team')) {
                  return newCopyright;
                }
                return match;
              }
            );
          }
        } else {
          console.warn('⚠️ Footer element not found in template');
        }
        
        // Strategy 3: Fallback - Replace any copyright text in entire document
        if (!iframeDoc.body.textContent.includes('Structura Team from Faith Colleges')) {
          console.log('🔄 Fallback: Searching entire document for copyright text');
          const allParagraphs = iframeDoc.querySelectorAll('p');
          allParagraphs.forEach(p => {
            const text = p.textContent || '';
            if (text.includes('©') && text.match(/\d{4}/) && !text.includes('Structura Team')) {
              if (text.includes('Truvara') || text.includes('Ceramic Studio') || text.includes('2024') || text.includes('Store Domain')) {
                console.log('🔄 Replacing copyright in paragraph:', text);
                p.textContent = newCopyright;
              }
            }
          });
        }
        
        console.log('✅ Footer copyright replacement completed');

      } catch (error) {
        console.error('Error updating iframe:', error);
      }
    };

    // Wait for iframe to load and retry if needed
    let retryCount = 0;
    const maxRetries = 5;
    
    const tryUpdate = () => {
      updateIframe();
      retryCount++;
      if (retryCount < maxRetries) {
        // Retry after a short delay to catch late-loading elements
        setTimeout(tryUpdate, 500);
      }
    };
    
    // Initial delay to let iframe load
    const timer1 = setTimeout(tryUpdate, 200);
    
    // Also listen for iframe load event
    const iframe = iframeRef.current;
    const handleLoad = () => {
      setTimeout(updateIframe, 100);
    };
    
    if (iframe) {
      iframe.addEventListener('load', handleLoad);
    }
    
    return () => {
      clearTimeout(timer1);
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
      }
    };
  }, [store, htmlContent, products, filteredProducts, selectedCategory, storeLogoUrl]);

  // Listen for messages from iframe to open order modal
  useEffect(() => {
    const handleMessage = (event) => {
      // Accept messages from same origin or any origin (for iframe)
      if (event.data && event.data.type === 'OPEN_ORDER_MODAL') {
        let product = null;
        
        // If product object is sent directly
        if (event.data.product) {
          product = event.data.product;
        } 
        // If product name is sent, find the product
        else if (event.data.productName) {
          product = products.find(p => 
            p.name && p.name.trim() === event.data.productName.trim()
          ) || (products.length > 0 ? products[0] : null);
        }
        
        if (product) {
          setSelectedProduct(product);
          setShowOrderModal(true);
          setOrderData(prefillOrderForm(product));
          setProvincesList([]);
          setMunicipalitiesList([]);
          setBarangaysList([]);
          setOrderError('');
          setOrderSuccess(false);
        }
      }
      
      // Handle product lookup request
      if (event.data && event.data.type === 'GET_PRODUCT_BY_NAME' && event.data.productName) {
        const product = products.find(p => 
          p.name && p.name.trim() === event.data.productName.trim()
        );
        if (product && event.source) {
          event.source.postMessage({
            type: 'PRODUCT_DATA',
            product: product
          }, '*');
        }
      }
    };

    // Also listen for clicks directly on the iframe
    const handleIframeClick = (e) => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;
      
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const target = e.target;
        
        // Check if click is on a product button
        if (target && (target.classList.contains('product-button') || target.classList.contains('add-to-cart') || target.closest('.product-button') || target.closest('.add-to-cart'))) {
          const button = (target.classList.contains('product-button') || target.classList.contains('add-to-cart')) ? target : (target.closest('.product-button') || target.closest('.add-to-cart'));
          const card = button.closest('.product-card, .product');
          
          if (card) {
            const titleEl = card.querySelector('.product-title, h3, h4, .product-name');
            const productName = titleEl ? titleEl.textContent.trim() : '';
            
            // Find matching product
            const matchingProduct = products.find(p => 
              p.name && p.name.trim() === productName
            ) || (products.length > 0 ? products[0] : null);
            
            if (matchingProduct) {
              setSelectedProduct(matchingProduct);
              setShowOrderModal(true);
              setOrderData(prefillOrderForm(matchingProduct));
              setProvincesList([]);
              setMunicipalitiesList([]);
              setBarangaysList([]);
              setOrderError('');
              setOrderSuccess(false);
            }
          }
        }
      } catch (err) {
        // Cross-origin error, ignore
      }
    };

    window.addEventListener('message', handleMessage);
    // Try to listen for clicks on the iframe (may not work due to cross-origin)
    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', () => {
        try {
          const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
          if (iframeDoc) {
            iframeDoc.addEventListener('click', handleIframeClick, true);
          }
        } catch (err) {
          // Cross-origin, use postMessage only
        }
      });
    }
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (iframeRef.current) {
        try {
          const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
          if (iframeDoc) {
            iframeDoc.removeEventListener('click', handleIframeClick, true);
          }
        } catch (err) {
          // Ignore
        }
      }
    };
  }, [products]);

  // Store is publicly accessible - no authentication required to view

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Store Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || 'This store is not available or has not been published yet.'}
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>URL: <code className="bg-gray-200 px-2 py-1 rounded">{window.location.href}</code></p>
            <p className="mt-2">Domain from URL: <code className="bg-gray-200 px-2 py-1 rounded">{domain}</code></p>
          </div>
          <a 
            href="/" 
            className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  // Handle order form changes
  const handleOrderChange = (field, value) => {
    if (field === 'region') {
      setProvincesList(getProvincesByRegion(value));
      setMunicipalitiesList([]);
      setBarangaysList([]);
      setOrderData(prev => ({ ...prev, [field]: value, province: '', municipality: '', barangay: '' }));
    } else if (field === 'province') {
      setMunicipalitiesList(getCityMunByProvince(value));
      setBarangaysList([]);
      setOrderData(prev => ({ ...prev, [field]: value, municipality: '', barangay: '' }));
    } else if (field === 'municipality') {
      const barangaysData = getBarangayByMun(value);
      const barangaysArray = barangaysData?.data || barangaysData || [];
      setBarangaysList(Array.isArray(barangaysArray) ? barangaysArray.map(brgy => ({
        brgy_code: brgy.brgy_code || brgy.code || brgy.brgyCode || '',
        name: (brgy.name || brgy.brgy_name || brgy.brgyName || '').toUpperCase()
      })) : []);
      setOrderData(prev => ({ ...prev, [field]: value, barangay: '' }));
    } else {
      setOrderData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle order submission
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setOrderError('');
    setOrderLoading(true);

    // Check authentication before submitting order
    const token = localStorage.getItem('token');
    if (!token) {
      setOrderError('Please log in to place an order');
      setOrderLoading(false);
      setShowOrderModal(false);
      setShowLoginModal(true);
      setPendingOrderProduct(selectedProduct);
      return;
    }

    try {
      if (!selectedProduct || !store) {
        setOrderError('Product or store information missing');
        setOrderLoading(false);
        return;
      }

      // Validate required fields
      if (!orderData.customerName || !orderData.customerEmail || !orderData.paymentMethod) {
        setOrderError('Please fill in all required fields');
        setOrderLoading(false);
        return;
      }

      // Validate payment reference for GCash
      if (orderData.paymentMethod === 'gcash' && !orderData.paymentReference) {
        setOrderError('Please enter the payment reference number from your GCash payment');
        setOrderLoading(false);
        return;
      }

      if (!orderData.region || !orderData.province || !orderData.municipality || !orderData.barangay) {
        setOrderError('Please select complete shipping address');
        return;
      }

      // Build shipping address with names
      const regionName = regionsList.find(r => r.reg_code === orderData.region)?.name || orderData.region;
      const provinceName = provincesList.find(p => p.prov_code === orderData.province)?.name || orderData.province;
      const municipalityName = municipalitiesList.find(m => m.mun_code === orderData.municipality)?.name || orderData.municipality;
      const barangayName = barangaysList.find(b => b.name === orderData.barangay)?.name || orderData.barangay;
      
      const shippingAddress = {
        region: orderData.region,
        regionName: regionName,
        province: orderData.province,
        provinceName: provinceName,
        municipality: orderData.municipality,
        municipalityName: municipalityName,
        barangay: orderData.barangay,
        barangayName: barangayName
      };

      // Create order
      const orderPayload = {
        storeId: store.id,
        items: [{
          productId: selectedProduct.id,
          quantity: parseInt(orderData.quantity) || 1
        }],
        shippingAddress,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone || '',
        paymentMethod: orderData.paymentMethod,
        paymentReference: orderData.paymentReference || '', // Payment reference from buyer
        shipping: parseFloat(orderData.shipping) || 0
      };

      // Retry logic for 503 errors
      let retries = 3;
      let lastError = null;
      
      while (retries > 0) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          try {
            const response = await apiClient.post('/orders', orderPayload, {
              signal: controller.signal,
              timeout: 30000,
              headers: {
                'Content-Type': 'application/json'
              }
            });
            clearTimeout(timeoutId);

            // Store the reference number from the response
            if (response.data?.orderNumber) {
              setOrderReferenceNumber(response.data.orderNumber);
            }

            setOrderSuccess(true);
            setOrderError('');
            
            // Close modal after 5 seconds (increased to give time to see reference number)
            setTimeout(() => {
              setShowOrderModal(false);
              setOrderSuccess(false);
              setOrderReferenceNumber(null);
              setSelectedProduct(null);
            }, 5000);
            
            return; // Success, exit retry loop
          } catch (apiError) {
            clearTimeout(timeoutId);
            lastError = apiError;
            
            // Only retry on 503 errors
            if (apiError.response?.status === 503 && retries > 1) {
              retries--;
              // Wait before retrying (exponential backoff)
              const delay = (4 - retries) * 1000; // 1s, 2s, 3s
              await new Promise(resolve => setTimeout(resolve, delay));
              continue; // Retry
            } else {
              throw apiError; // Don't retry for other errors
            }
          }
        } catch (apiError) {
          lastError = apiError;
          if (apiError.response?.status !== 503 || retries === 1) {
            throw apiError; // Don't retry
          }
          retries--;
          // Wait before retrying
          const delay = (4 - retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // If we get here, all retries failed
      throw lastError;
    } catch (err) {
      console.error('Error creating order:', err);
      if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
        setOrderError('Request timed out. Please check your connection and try again.');
      } else if (err.response?.status === 503) {
        setOrderError('Service temporarily unavailable. The server may be restarting. Please try again in a few moments.');
      } else if (err.response?.status === 400) {
        setOrderError(err.response?.data?.message || 'Invalid order data. Please check all fields.');
      } else if (err.response?.status === 404) {
        setOrderError('Store or product not found. Please refresh the page.');
      } else {
        setOrderError(err.response?.data?.message || 'Failed to create order. Please try again.');
      }
    } finally {
      setOrderLoading(false);
    }
  };

  // Calculate order total
  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    const subtotal = parseFloat(selectedProduct.price || 0) * (parseInt(orderData.quantity) || 1);
    const shipping = parseFloat(orderData.shipping) || 0;
    return subtotal + shipping;
  };

  return (
    <>
      {/* Initial Login/Register Modal - shown on page load */}
      {showInitialLoginModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 text-center">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => {
                    setShowInitialLoginModal(false);
                    setModalMode('login');
                    setVerificationError('');
                    setVerificationMessage('');
                    setVerificationCode('');
                    setLoginNotice('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-800">
                  {modalMode === 'verify'
                    ? 'Verify your email'
                    : modalMode === 'login'
                      ? 'Welcome Back!'
                      : 'Join Us Today'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {modalMode === 'verify'
                    ? `Enter the verification code we sent to ${verificationEmail || 'your email'}.`
                    : modalMode === 'login'
                      ? '✨ Log in to explore our amazing products and start shopping'
                      : '🎉 Create your account to discover exclusive products and special offers'}
                </p>
              </div>
            </div>

            {/* Tabs for Login/Register */}
            {modalMode !== 'verify' && (
              <div className="flex border-b mb-4">
                <button
                  onClick={() => {
                    setModalMode('login');
                    setLoginError('');
                    setRegisterError('');
                    setLoginNotice('');
                  }}
                  className={`flex-1 py-2 px-4 text-center font-medium ${
                    modalMode === 'login'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setModalMode('register');
                    setLoginError('');
                    setRegisterError('');
                    setLoginNotice('');
                  }}
                  className={`flex-1 py-2 px-4 text-center font-medium ${
                    modalMode === 'register'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Register
                </button>
              </div>
            )}

            {/* Verification Form */}
            {modalMode === 'verify' && (
              <form onSubmit={handleCustomerVerification}>
                <div className="space-y-3 mb-4">
                  <input
                    type="email"
                    value={verificationEmail}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  />
                  <input
                    type="text"
                    name="verificationCode"
                    id="customer-verification-code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 tracking-[0.3em] text-center text-lg"
                  />
                </div>
                {verificationError && (
                  <div className="text-red-600 text-sm mb-3">
                    {verificationError}
                  </div>
                )}
                {verificationMessage && (
                  <div className="text-green-600 text-sm mb-3">
                    {verificationMessage}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={verificationLoading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verificationLoading ? 'Verifying...' : 'Verify Email'}
                </button>
                <button
                  type="button"
                  onClick={handleResendCustomerVerification}
                  disabled={resendVerificationLoading}
                  className="w-full mt-3 px-4 py-2 border border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendVerificationLoading ? 'Sending...' : 'Resend code'}
                </button>
                <div className="mt-4 text-center text-sm text-gray-600">
                  Wrong email?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('register');
                      setVerificationError('');
                      setVerificationMessage('');
                      setVerificationCode('');
                    }}
                    className="text-purple-600 font-semibold hover:underline"
                  >
                    Register again
                  </button>
                </div>
              </form>
            )}

            {/* Login Form */}
            {modalMode === 'login' && (
              <form onSubmit={handleLogin}>
                <div className="space-y-3 mb-4">
                  <input
                    type="email"
                    name="loginEmail"
                    id="store-login-email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="loginPassword"
                      id="store-login-password"
                      placeholder="Password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                </div>
                {loginError && (
                  <div className="text-red-600 text-sm mb-4">
                    {loginError}
                  </div>
                )}
                {loginNotice && (
                  <div className="text-green-600 text-sm mb-4">
                    {loginNotice}
                  </div>
                )}
                <button 
                  type="submit" 
                  disabled={loginLoading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loginLoading ? 'Signing in...' : 'LOGIN'}
                </button>
                <div className="mt-4 text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('register');
                      setLoginError('');
                      setRegisterError('');
                      setLoginNotice('');
                    }}
                    className="text-purple-600 font-semibold hover:underline"
                  >
                    Sign up
                  </button>
                </div>
              </form>
            )}

            {/* Register Form */}
            {modalMode === 'register' && (
              <form onSubmit={handleRegister}>
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    name="firstName"
                    id="modal-register-firstname"
                    placeholder="First Name"
                    value={registerForm.firstName}
                    onChange={e => setRegisterForm(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    autoComplete="given-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    name="lastName"
                    id="modal-register-lastname"
                    placeholder="Last Name"
                    value={registerForm.lastName}
                    onChange={e => setRegisterForm(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    autoComplete="family-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="email"
                    name="email"
                    id="modal-register-email"
                    placeholder="Email"
                    value={registerForm.email}
                    onChange={e => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    autoComplete="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      name="password"
                      id="modal-register-password"
                      placeholder="Password"
                      value={registerForm.password}
                      onChange={e => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      autoComplete="new-password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showRegisterPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {PASSWORD_REQUIREMENTS_TEXT}
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      id="modal-register-confirm-password"
                      placeholder="Confirm Password"
                      value={registerForm.confirmPassword}
                      onChange={e => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      autoComplete="new-password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                </div>
                {registerError && (
                  <div className="text-red-600 text-sm mb-4">
                    {registerError}
                  </div>
                )}
                <button 
                  type="submit" 
                  disabled={registerLoading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registerLoading ? 'Creating Account...' : 'REGISTER'}
                </button>
                <div className="mt-4 text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('login');
                      setLoginError('');
                      setRegisterError('');
                      setLoginNotice('');
                    }}
                    className="text-purple-600 font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Login Modal - shown when user tries to order without being logged in */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Login Required</h2>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setPendingOrderProduct(null);
                  setLoginError('');
                  setLoginNotice('');
                  setModalMode('login');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Please log in to place an order for this product.
            </p>
            {pendingOrderProduct && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Product:</strong> {pendingOrderProduct.name}
                </p>
                {pendingOrderProduct.price && (
                  <p className="text-sm text-gray-700">
                    <strong>Price:</strong> ₱{parseFloat(pendingOrderProduct.price).toLocaleString()}
                  </p>
                )}
              </div>
            )}
            <form onSubmit={handleLogin}>
              <div className="space-y-3 mb-4">
                  <input
                    type="email"
                    name="loginEmail"
                    id="modal-login-email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="loginPassword"
                    id="modal-login-password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>
              {loginError && (
                <div className="text-red-600 text-sm mb-4">
                  {loginError}
                </div>
              )}
              {loginNotice && (
                <div className="text-green-600 text-sm mb-4">
                  {loginNotice}
                </div>
              )}
              <button 
                type="submit" 
                disabled={loginLoading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? 'Signing in...' : 'LOGIN'}
              </button>
              <div className="mt-4 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-purple-600 font-semibold hover:underline"
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowInitialLoginModal(true);
                    setModalMode('register');
                    setLoginError('');
                    setRegisterError('');
                    setLoginNotice('');
                    setPendingOrderProduct(null);
                  }}
                >
                  Sign up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCartModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeCartModal}
        >
          <div 
            className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Quick Cart</h2>
                <p className="text-sm text-gray-500">
                  I-browse ang mga produkto at mag-place ng order sa isang click.
                </p>
              </div>
              <button
                onClick={closeCartModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-hidden flex-1">
              {products.length > 0 ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hanapin ang produkto
                    </label>
                    <input
                      type="text"
                      value={cartSearchTerm}
                      onChange={(e) => setCartSearchTerm(e.target.value)}
                      placeholder="Hal. Balisong, Ceramic Mug, Premium Blade"
                      autoFocus
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '55vh' }}>
                    {cartModalProducts.length > 0 ? (
                      cartModalProducts.map((product, index) => (
                        <div
                          key={product.id || `${product.name || 'product'}-${index}`}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col md:flex-row md:items-center gap-4"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-lg">
                              {product.name || 'Untitled product'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              ₱{parseFloat(product.price || 0).toFixed(2)}
                              {product.category ? ` • ${product.category}` : ''}
                            </p>
                            {product.description && (
                              <p className="text-sm text-gray-500 mt-2">
                                {product.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2" style={{ minWidth: '140px' }}>
                            {product.stock !== undefined && (
                              <span className="text-xs text-gray-500">
                                Stock: {product.stock}
                              </span>
                            )}
                            <button
                              onClick={() => handleCartOrderClick(product)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Order
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-12">
                        <p>Walang produkto na tumugma sa "{cartSearchTerm}".</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-16">
                  <p>Wala pang mga produktong naka-publish ang store na ito.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && selectedProduct && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !orderLoading && setShowOrderModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Place Your Order</h2>
                <button
                  onClick={() => !orderLoading && setShowOrderModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  disabled={orderLoading}
                >
                  ×
                </button>
              </div>

              {/* Product Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{selectedProduct.name}</h3>
                <p className="text-gray-600 mb-2">Price: ₱{parseFloat(selectedProduct.price || 0).toFixed(2)}</p>
                {selectedProduct.stock !== undefined && (
                  <p className="text-sm text-gray-500">Stock Available: {selectedProduct.stock}</p>
                )}
              </div>

              {orderSuccess ? (
                <div className="text-center py-8">
                  <div className="text-green-600 text-5xl mb-4">✓</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h3>
                  {orderReferenceNumber && (
                    <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-purple-800 mb-1">Transaction Reference Number:</p>
                      <p className="text-2xl font-bold text-purple-900 font-mono">{orderReferenceNumber}</p>
                      <p className="text-xs text-purple-700 mt-2">Please provide this reference number when making payment</p>
                    </div>
                  )}
                  <p className="text-gray-600">Thank you for your order. The store owner will contact you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  {/* Customer Information */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={orderData.customerName}
                          onChange={(e) => handleOrderChange('customerName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          required
                          value={orderData.customerEmail}
                          onChange={(e) => handleOrderChange('customerEmail', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={orderData.customerPhone}
                          onChange={(e) => handleOrderChange('customerPhone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct.stock || 999}
                      required
                      value={orderData.quantity}
                      onChange={(e) => handleOrderChange('quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Shipping Address</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                        <select
                          required
                          value={orderData.region}
                          onChange={(e) => handleOrderChange('region', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select Region</option>
                          {regionsList.map((region) => (
                            <option key={region.reg_code} value={region.reg_code}>
                              {region.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                        <select
                          required
                          value={orderData.province}
                          onChange={(e) => handleOrderChange('province', e.target.value)}
                          disabled={!orderData.region}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        >
                          <option value="">Select Province</option>
                          {provincesList.map((province) => (
                            <option key={province.prov_code} value={province.prov_code}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Municipality *</label>
                        <select
                          required
                          value={orderData.municipality}
                          onChange={(e) => handleOrderChange('municipality', e.target.value)}
                          disabled={!orderData.province}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        >
                          <option value="">Select Municipality</option>
                          {municipalitiesList.map((municipality) => (
                            <option key={municipality.mun_code} value={municipality.mun_code}>
                              {municipality.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
                        <select
                          required
                          value={orderData.barangay}
                          onChange={(e) => handleOrderChange('barangay', e.target.value)}
                          disabled={!orderData.municipality}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        >
                          <option value="">Select Barangay</option>
                          {barangaysList.map((barangay) => (
                            <option key={barangay.brgy_code} value={barangay.name}>
                              {barangay.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Fee - Domestic rates by weight and destination */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Shipping Fee</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Package Weight *</label>
                        <select
                          required
                          value={orderData.weightBand}
                          onChange={(e) => handleOrderChange('weightBand', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select weight range</option>
                          <option value="0-0.5">500g and below</option>
                          <option value="0.5-1">500g - 1kg</option>
                          <option value="1-3">1kg - 3kg</option>
                          <option value="5-6">5kg - 6kg</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Shipping fee is automatically calculated based on weight and destination (Visayas, Metro Manila, Luzon, Mindanao, Island).
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Calculated Shipping Fee</label>
                        <input
                          type="text"
                          readOnly
                          value={orderData.shipping ? `₱${parseFloat(orderData.shipping).toFixed(2)}` : 'Select weight and address to see shipping fee'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Payment Method *</h3>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="gcash"
                          checked={orderData.paymentMethod === 'gcash'}
                          onChange={(e) => handleOrderChange('paymentMethod', e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium">GCash</div>
                          <div className="text-xs text-gray-500">
                            Scan the QR code below to pay via GCash.
                          </div>
                        </div>
                      </label>
                      
                      {/* GCash QR Code */}
                      {orderData.paymentMethod === 'gcash' && selectedProduct && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-green-500">
                          <div className="text-center mb-3">
                            <h4 className="font-semibold text-gray-800 mb-1">GCash Payment QR Code</h4>
                            <p className="text-sm text-gray-600">Scan this QR code with your GCash app</p>
                          </div>
                          <div className="flex justify-center mb-3">
                            <div className="bg-white p-4 rounded-lg">
                              {/* Display uploaded GCash QR code from store content */}
                              {store?.content?.payment?.gcashQrImage || store?.content?.gcashQrImage ? (
                                <img
                                  src={store.content.payment?.gcashQrImage || store.content.gcashQrImage}
                                  alt="GCash QR Code"
                                  className="w-48 h-48 object-contain"
                                  style={{ maxWidth: '200px', maxHeight: '200px' }}
                                />
                              ) : (
                                <div className="w-48 h-48 flex items-center justify-center text-gray-500 text-sm text-center p-4">
                                  <p>Please upload your GCash QR code in Payment Settings</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-center text-sm text-gray-700 mb-4">
                            <p><strong>Amount:</strong> ₱{calculateTotal().toFixed(2)}</p>
                            {store?.phone && (
                              <p className="mt-1"><strong>GCash Number:</strong> {store.phone}</p>
                            )}
                          </div>
                          {/* Payment Reference Code Input */}
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Payment Reference Number *
                            </label>
                            <input
                              type="text"
                              required
                              value={orderData.paymentReference}
                              onChange={(e) => handleOrderChange('paymentReference', e.target.value)}
                              placeholder="Enter the reference number from your GCash payment"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Enter the reference number shown in your GCash app after payment
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₱{((parseFloat(selectedProduct.price || 0) * (parseInt(orderData.quantity) || 1)).toFixed(2))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>₱{parseFloat(orderData.shipping || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                        <span>Total:</span>
                        <span>₱{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {orderError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {orderError}
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowOrderModal(false)}
                      disabled={orderLoading}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={orderLoading}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {orderLoading ? 'Processing...' : 'Place Order'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Categories Dropdown */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div
            ref={categoriesDropdownRef}
            style={{
              position: 'absolute',
              top: categoriesDropdownPosition.top,
              ...(categoriesDropdownPosition.left !== null
                ? { left: categoriesDropdownPosition.left, transform: 'translateX(-50%)' }
                : { right: 24 })
            }}
            className="pointer-events-auto w-60 bg-white rounded-xl border border-gray-200 shadow-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="categories-select">
                Categories
              </label>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                aria-label="Close categories"
              >
                ×
              </button>
            </div>
            {categories.length > 0 ? (
              <>
                <select
                  id="categories-select"
                  value={selectedCategory || '__all'}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '__all') {
                      clearCategoryFilter();
                    } else {
                      handleCategoryClick(value);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="__all">All Categories ({products.length})</option>
                  {categories.map((category) => {
                    const categoryCount = products.filter(p => p.category === category).length;
                    return (
                      <option key={category} value={category}>
                        {category} ({categoryCount})
                      </option>
                    );
                  })}
                </select>
              </>
            ) : (
              <p className="text-gray-600 text-sm text-center py-2">
                No categories available yet.
              </p>
            )}
          </div>
        </div>
      )}

      <div 
        className="w-full h-screen" 
        style={{ overflow: 'hidden', position: 'relative' }}
        onClick={(e) => {
          // Handle clicks on the iframe container
          const iframe = iframeRef.current;
          if (!iframe) return;
          
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (!iframeDoc) return;
            
            // Get click coordinates relative to iframe
            const rect = iframe.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Find element at click position in iframe
            const elementAtPoint = iframeDoc.elementFromPoint(x, y);
            if (!elementAtPoint) return;
            
            // Check if click is on a product button
            const button = elementAtPoint.closest('.product-button, button');
            if (button && (button.classList.contains('product-button') || button.closest('.product-card'))) {
              e.preventDefault();
              e.stopPropagation();
              
              // Find the product card
              const card = button.closest('.product-card, .product');
              if (card) {
                const titleEl = card.querySelector('.product-title, h3, h4, .product-name');
                const productName = titleEl ? titleEl.textContent.trim() : '';
                
                // Find matching product
                const matchingProduct = products.find(p => 
                  p.name && p.name.trim() === productName
                ) || (products.length > 0 ? products[0] : null);
                
                if (matchingProduct) {
                  setSelectedProduct(matchingProduct);
                  setShowOrderModal(true);
                  setOrderData(prefillOrderForm(matchingProduct));
                  setProvincesList([]);
                  setMunicipalitiesList([]);
                  setBarangaysList([]);
                  setOrderError('');
                  setOrderSuccess(false);
                }
              }
            }
          } catch (err) {
            // Cross-origin error, ignore
            console.log('Cannot access iframe content:', err);
          }
        }}
      >
        
        <iframe
          ref={iframeRef}
          src={`/templates/${templateFileMap[store.templateId] || 'struvaris.html'}`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            pointerEvents: 'auto'
          }}
          title={store.storeName}
          scrolling="yes"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation"
          onLoad={() => {
            // Trigger update when iframe loads
            if (iframeRef.current && htmlContent) {
              const event = new Event('updatePreview');
              window.dispatchEvent(event);
            }
            
            // Also inject a script to handle button clicks directly in iframe
            try {
              const iframe = iframeRef.current;
              const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
              if (iframeDoc) {
                // Inject a script that sets up click handlers for all buttons
                const script = iframeDoc.createElement('script');
                script.textContent = `
                  (function() {
                    // Setup product buttons (Add to Cart, Order, etc.)
                    function setupOrderButtons() {
                      const buttons = document.querySelectorAll('.product-button, .add-to-cart, .product-card button, .product button, button.add-to-cart');
                      buttons.forEach(function(button) {
                        // Skip CTA buttons (they have separate handlers)
                        if (button.closest('.hero') && button.classList.contains('cta-button')) return;
                        if (button.hasAttribute('data-handler-attached')) return;
                        button.setAttribute('data-handler-attached', 'true');
                        
                        button.addEventListener('click', function(e) {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Try to call parent function
                          try {
                            const card = button.closest('.product-card, .product');
                            if (card) {
                              const titleEl = card.querySelector('.product-title, h3, h4, .product-name');
                              const productName = titleEl ? titleEl.textContent.trim() : '';
                              
                              // Send product name to parent via postMessage
                              if (window.parent && window.parent !== window) {
                                window.parent.postMessage({
                                  type: 'OPEN_ORDER_MODAL',
                                  productName: productName
                                }, '*');
                              }
                            }
                          } catch (err) {
                            console.error('Error in button click:', err);
                          }
                        }, true);
                        
                        // Make button clearly interactive
                        button.style.cursor = 'pointer';
                        button.style.pointerEvents = 'auto';
                      });
                    }
                    
                    // Setup CTA buttons (Hero section buttons - scroll to products)
                    function setupCTAButtons() {
                      const ctaButtons = document.querySelectorAll('.hero .cta-button, .cta-button');
                      ctaButtons.forEach(function(button) {
                        if (button.hasAttribute('data-cta-handler-attached')) return;
                        button.setAttribute('data-cta-handler-attached', 'true');
                        
                        button.addEventListener('click', function(e) {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          try {
                            // Find products section
                            const productsSection = document.querySelector('.products, .products-section, .featured-products');
                            if (productsSection) {
                              productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else {
                              // Fallback: scroll to first product
                              const firstProduct = document.querySelector('.product-card, .product');
                              if (firstProduct) {
                                firstProduct.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }
                          } catch (err) {
                            console.error('Error scrolling to products:', err);
                          }
                        }, true);
                        
                        button.style.cursor = 'pointer';
                        button.style.pointerEvents = 'auto';
                      });
                    }
                    
                    // Setup all buttons
                    function setupAllButtons() {
                      setupOrderButtons();
                      setupCTAButtons();
                    }
                    
                    // Run immediately
                    setupAllButtons();
                    
                    // Also run after delays to catch dynamically added buttons
                    setTimeout(setupAllButtons, 500);
                    setTimeout(setupAllButtons, 1000);
                    setTimeout(setupAllButtons, 2000);
                    
                    // Watch for new buttons
                    const observer = new MutationObserver(setupAllButtons);
                    observer.observe(document.body, { childList: true, subtree: true });
                  })();
                `;
                iframeDoc.head.appendChild(script);
              }
            } catch (err) {
              console.error('Error injecting script:', err);
            }
          }}
        />
      </div>
    </>
  );
};

export default PublishedStore;


