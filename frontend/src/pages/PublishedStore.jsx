import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../utils/axios';
import { getImageUrl } from '../utils/imageUrl';
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
  const { login: loginContext } = useAuth();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const iframeRef = React.useRef(null);
  
  // Login/Register modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showScrollModal, setShowScrollModal] = useState(false);
  const [modalMode, setModalMode] = useState('login'); // 'login' or 'register'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [pendingOrderProduct, setPendingOrderProduct] = useState(null);
  
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
    shipping: 0
  });
  const [regionsList] = useState(regions);
  const [provincesList, setProvincesList] = useState([]);
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [barangaysList, setBarangaysList] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

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
      
      // Determine default weight band from product weight (in kg), if provided
      let defaultWeightBand = '';
      const weightValue = product && product.weight ? parseFloat(product.weight) : 0;
      if (weightValue > 0) {
        if (weightValue <= 0.5) defaultWeightBand = '0-0.5';
        else if (weightValue > 0.5 && weightValue <= 1) defaultWeightBand = '0.5-1';
        else if (weightValue > 1 && weightValue <= 3) defaultWeightBand = '1-3';
        else if (weightValue >= 5 && weightValue <= 6) defaultWeightBand = '5-6';
      }
      
      // Reset order form
      setOrderData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        quantity: 1,
        paymentMethod: 'gcash',
        region: '',
        province: '',
        municipality: '',
        barangay: '',
        weightBand: defaultWeightBand,
        shipping: 0
      });
      setProvincesList([]);
      setMunicipalitiesList([]);
      setBarangaysList([]);
      setOrderError('');
      setOrderSuccess(false);
    };
    
    return () => {
      delete window.openOrderModal;
    };
  }, []);

  // Scroll detection - show login/register modal when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      const token = localStorage.getItem('token');
      // Only show scroll modal if user is not logged in and hasn't seen it yet
      if (!token && !showScrollModal) {
        // Check both window scroll and iframe scroll
        const windowScroll = window.scrollY || document.documentElement.scrollTop;
        const iframe = iframeRef.current;
        let iframeScroll = 0;
        
        if (iframe && iframe.contentWindow) {
          try {
            iframeScroll = iframe.contentWindow.scrollY || iframe.contentDocument?.documentElement?.scrollTop || 0;
          } catch (e) {
            // Cross-origin or not ready
          }
        }
        
        const totalScroll = Math.max(windowScroll, iframeScroll);
        
        if (totalScroll > 300) {
          setShowScrollModal(true);
          setModalMode('login');
        }
      }
    };

    // Listen to window scroll
    window.addEventListener('scroll', handleScroll, true);
    
    // Also listen to iframe scroll if available
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.addEventListener('scroll', handleScroll, true);
      } catch (e) {
        // Cross-origin or not ready
      }
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.removeEventListener('scroll', handleScroll, true);
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [showScrollModal, iframeRef]);
  
  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await apiClient.post('/auth/login', {
        email: loginEmail,
        password: loginPassword
      });

      if (response.data.token) {
        // Store the token in localStorage
        const token = response.data.token;
        localStorage.setItem('token', token);
        
        // Update auth context
        loginContext(response.data.user);
        
        // Clear form
        setLoginEmail('');
        setLoginPassword('');
        
        // Close both modals
        setShowLoginModal(false);
        setShowScrollModal(false);
        
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
      if (error.response?.status === 403) {
        setLoginError(msg || 'Please verify your email to continue.');
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

    setRegisterLoading(true);

    try {
      const response = await apiClient.post('/auth/register', {
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        email: registerForm.email,
        password: registerForm.password
      });

      // After successful registration, switch to login mode
      setRegisterError('');
      setModalMode('login');
      setLoginEmail(registerForm.email);
      setRegisterForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      // Show success message
      setLoginError('');
      alert('Registration successful! Please log in to continue.');
    } catch (error) {
      setRegisterError(
        error.response?.data?.message || 
        'An error occurred during registration. Please try again.'
      );
    } finally {
      setRegisterLoading(false);
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
        try {
          const productsResponse = await apiClient.get(
            `/products/public/${response.data.id}`
          );
          setProducts(productsResponse.data || []);
        } catch (productsError) {
          console.error('Error fetching products:', productsError);
          // If products API fails, use products from store.content as fallback
          setProducts(response.data.content?.products || []);
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

  // Update callback ref whenever products or state setters change
  useEffect(() => {
    orderButtonCallbackRef.current = (product) => {
      setSelectedProduct(product);
      setShowOrderModal(true);
      
      // Reset order form
      setOrderData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        quantity: 1,
        paymentMethod: 'gcash',
        region: '',
        province: '',
        municipality: '',
        barangay: '',
        shipping: 0
      });
      setProvincesList([]);
      setMunicipalitiesList([]);
      setBarangaysList([]);
      setOrderError('');
      setOrderSuccess(false);
    };
  }, [products]);

  // Update iframe with store content
  useEffect(() => {
    if (!store || !htmlContent || !iframeRef.current) return;
    
    // Use products from API if available, otherwise fallback to store.content.products
    const displayProducts = products.length > 0 ? products : (store.content?.products || []);

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
              
              if (existingCards[index]) {
                // Update existing card
                card = existingCards[index];
              } else {
                // Create new product card
                card = iframeDoc.createElement('div');
                card.className = 'product-card';
                
                // Ensure base styles are present for neat layout (once)
                try {
                  if (!iframeDoc.getElementById('structura-published-style')) {
                    const style = iframeDoc.createElement('style');
                    style.id = 'structura-published-style';
                    style.textContent = `
                      /* Normalize product info layout across templates */
                      .product-info, .product-title, .product-description { width: 100% !important; float: none !important; clear: both !important; }
                      .product-title { margin: 0 0 .5rem 0; }
                      .product-description { 
                        display: -webkit-box; 
                        -webkit-line-clamp: 4; 
                        -webkit-box-orient: vertical; 
                        overflow: hidden; 
                        line-height: 1.6; 
                        color: #444; 
                        margin: .5rem 0 1rem; 
                        white-space: normal; 
                        word-break: normal; 
                      }
                      .product-price, .price { font-weight: 700; color: #111; font-size: 1.05rem; }
                      .product-footer { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-top: .5rem; }
                      .product-footer .product-button { cursor: pointer; padding: .5rem .75rem; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; }
                    `;
                    (iframeDoc.head || iframeDoc.body).appendChild(style);
                  }
                } catch(_) {}
                
                // Create card structure based on template
                const imageUrl = product.image && product.image !== '/imgplc.jpg'
                  ? (product.image.startsWith('http') ? product.image : getImageUrl(product.image) || product.image)
                  : '/imgplc.jpg';
                
                const price = parseFloat(product.price) || 0;
                let descText = product.description || '';
                if (descText.includes('<p>')) {
                  descText = descText.replace(/^<p>|<\/p>$/g, '').trim();
                }
                
                card.innerHTML = `
                  <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name || 'Product'}" />
                  </div>
                  <div class="product-info">
                    <h3 class="product-title">${product.name || 'Product'}</h3>
                    <p class="product-description">${descText}</p>
                    <div class="product-footer" style="display:flex; align-items:center; justify-content:space-between; gap:.5rem;">
                      <span class="product-price">₱${price.toFixed(2)}</span>
                      <div style="display:flex; gap:.5rem;">
                        <button class="product-button order-button" style="padding:.5rem .75rem; border-radius:8px;">Order</button>
                      </div>
                    </div>
                  </div>
                `;
                
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

        // Update logo with store name (from form, not domain name) and add click handler
        const logoDisplayName = store.storeName || 'Store';
        
        const logo = iframeDoc.querySelector('.logo, .navbar .logo');
        if (logo) {
          logo.textContent = logoDisplayName;
          // Also replace any "Truvara" text that might be in the logo
          if (logo.textContent.includes('Truvara')) {
            logo.textContent = logo.textContent.replace(/Truvara/gi, logoDisplayName);
          }
          logo.onclick = (e) => {
            e.preventDefault();
            iframeDoc.querySelector('.hero, body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          };
          console.log('✅ Logo updated to:', logoDisplayName);
        }
        
        // Update footer logo with store name (from form)
        const footerLogo = iframeDoc.querySelector('.footer-logo, footer .footer-logo');
        if (footerLogo) {
          footerLogo.textContent = logoDisplayName;
          // Replace any "Truvara" in footer logo
          if (footerLogo.textContent.includes('Truvara')) {
            footerLogo.textContent = footerLogo.textContent.replace(/Truvara/gi, logoDisplayName);
          }
          console.log('✅ Footer logo updated to:', logoDisplayName);
        }
        
        // Also replace any remaining "Truvara" text in navbar and footer areas
        // Search for "Truvara" in navbar and footer sections
        const navbar = iframeDoc.querySelector('.navbar, nav');
        if (navbar) {
          navbar.innerHTML = navbar.innerHTML.replace(/Truvara/gi, logoDisplayName);
        }
        
        const footerElement = iframeDoc.querySelector('footer');
        if (footerElement) {
          // Replace "Truvara" in footer but preserve copyright text (we'll update that separately)
          const footerHTML = footerElement.innerHTML;
          // Only replace Truvara that's not part of copyright text
          footerElement.innerHTML = footerHTML.replace(/Truvara(?!\s*©)/gi, logoDisplayName);
        }

        // Add navigation link functionality and remove About/Gallery links
        const navLinks = iframeDoc.querySelectorAll('.nav-links a, .navbar a');
        navLinks.forEach(link => {
          const linkText = link.textContent.trim().toLowerCase();
          
          // Skip if it's the logo (already handled above)
          if (link.classList.contains('logo')) return;
          
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
            
            // Address
            const addressParts = [];
            if (store.barangay) addressParts.push(store.barangay);
            if (store.municipality) addressParts.push(store.municipality);
            if (store.province) addressParts.push(store.province);
            if (store.region) addressParts.push(store.region);
            
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
          
          const addressParts = [];
          if (store.barangay) addressParts.push(store.barangay);
          if (store.municipality) addressParts.push(store.municipality);
          if (store.province) addressParts.push(store.province);
          if (store.region) addressParts.push(store.region);
          
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
  }, [store, htmlContent, products]);

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
          
          // Reset order form
          setOrderData({
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            quantity: 1,
            paymentMethod: 'gcash',
            region: '',
            province: '',
            municipality: '',
            barangay: '',
            shipping: 0
          });
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
              setOrderData({
                customerName: '',
                customerEmail: '',
                customerPhone: '',
                quantity: 1,
                paymentMethod: 'gcash',
                region: '',
                province: '',
                municipality: '',
                barangay: '',
                shipping: 0
              });
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
      // Add scroll listener to iframe when it loads
      const setupIframeScrollListener = () => {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iframeDoc) {
              // Listen to scroll events inside iframe
              const scrollHandler = () => {
                const token = localStorage.getItem('token');
                if (!token) {
                  const scrollY = iframe.contentWindow.scrollY || iframeDoc.documentElement.scrollTop || 0;
                  if (scrollY > 300) {
                    setShowScrollModal(true);
                    setModalMode('login');
                  }
                }
              };
              iframe.contentWindow.addEventListener('scroll', scrollHandler, true);
              // Store handler for cleanup
              iframe._scrollHandler = scrollHandler;
            }
          } catch (e) {
            console.log('Cannot access iframe scroll:', e);
          }
        }
      };

      iframeRef.current.addEventListener('load', () => {
        setupIframeScrollListener();
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
          // Remove scroll handler if it exists
          if (iframeRef.current.contentWindow && iframeRef.current._scrollHandler) {
            iframeRef.current.contentWindow.removeEventListener('scroll', iframeRef.current._scrollHandler, true);
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

      if (!orderData.region || !orderData.province || !orderData.municipality || !orderData.barangay) {
        setOrderError('Please select complete shipping address');
        return;
      }

      // Build shipping address
      const shippingAddress = {
        region: orderData.region,
        province: orderData.province,
        municipality: orderData.municipality,
        barangay: orderData.barangay
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

            setOrderSuccess(true);
            setOrderError('');
            
            // Close modal after 3 seconds
            setTimeout(() => {
              setShowOrderModal(false);
              setOrderSuccess(false);
              setSelectedProduct(null);
            }, 3000);
            
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
      {/* Scroll-triggered Login/Register Modal */}
      {showScrollModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowScrollModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {modalMode === 'login' ? 'Login' : 'Create Account'}
              </h2>
              <button
                onClick={() => setShowScrollModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tabs for Login/Register */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => {
                  setModalMode('login');
                  setLoginError('');
                  setRegisterError('');
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

            {/* Login Form */}
            {modalMode === 'login' && (
              <form onSubmit={handleLogin}>
                <div className="space-y-3 mb-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
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
                <button 
                  type="submit" 
                  disabled={loginLoading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loginLoading ? 'Signing in...' : 'LOGIN'}
                </button>
              </form>
            )}

            {/* Register Form */}
            {modalMode === 'register' && (
              <form onSubmit={handleRegister}>
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={registerForm.firstName}
                    onChange={e => setRegisterForm(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={registerForm.lastName}
                    onChange={e => setRegisterForm(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={registerForm.email}
                    onChange={e => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={registerForm.password}
                      onChange={e => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      required
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
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={registerForm.confirmPassword}
                      onChange={e => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
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
                  placeholder="Email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
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
              <button 
                type="submit" 
                disabled={loginLoading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? 'Signing in...' : 'LOGIN'}
              </button>
              <div className="mt-4 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  state={{ returnUrl: window.location.pathname }}
                  className="text-purple-600 font-semibold hover:underline"
                  onClick={() => {
                    setShowLoginModal(false);
                    setPendingOrderProduct(null);
                  }}
                >
                  Sign up
                </Link>
              </div>
            </form>
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
                    <div>
                      <div className="font-medium">GCash</div>
                      <div className="text-xs text-gray-500">
                        You can pay via GCash. After placing your order, the seller will send you their GCash QR code or payment details.
                      </div>
                    </div>
                      </label>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="paypal"
                          checked={orderData.paymentMethod === 'paypal'}
                          onChange={(e) => handleOrderChange('paymentMethod', e.target.value)}
                          className="mr-3"
                        />
                    <div>
                      <div className="font-medium">Cash On Delivery (COD)</div>
                      <div className="text-xs text-gray-500">
                        Pay in cash when your order is delivered.
                      </div>
                    </div>
                      </label>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={orderData.paymentMethod === 'card'}
                          onChange={(e) => handleOrderChange('paymentMethod', e.target.value)}
                          className="mr-3"
                        />
                        <span>Credit/Debit Card</span>
                      </label>
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
                  setOrderData({
                    customerName: '',
                    customerEmail: '',
                    customerPhone: '',
                    quantity: 1,
                    paymentMethod: 'gcash',
                    region: '',
                    province: '',
                    municipality: '',
                    barangay: '',
                    shipping: 0
                  });
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


