import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../utils/axios';
import { getImageUrl } from '../utils/imageUrl';
import { regions, getProvincesByRegion, getCityMunByProvince, getBarangayByMun } from 'phil-reg-prov-mun-brgy';

// Template mapping
const templateFileMap = {
  bladesmith: 'struvaris.html',
  pottery: 'truvara.html',
  balisong: 'ructon.html',
  weavery: 'urastra.html',
  woodcarving: 'caturis.html'
};

const PublishedStore = () => {
  const { domain } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const iframeRef = React.useRef(null);
  
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
    shipping: 0,
    shippingMin: 0,
    shippingMax: 0
  });
  const [regionsList] = useState(regions);
  const [provincesList, setProvincesList] = useState([]);
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [barangaysList, setBarangaysList] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Ref to store callback function for order button clicks
  const orderButtonCallbackRef = React.useRef(null);
  
  // Create a global function that the iframe can call
  useEffect(() => {
    // Store the callback in window so iframe can access it
    window.openOrderModal = (product) => {
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
    
    return () => {
      delete window.openOrderModal;
    };
  }, []);

  useEffect(() => {
    const fetchStore = async () => {
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
                  <img src="${imageUrl}" alt="${product.name || 'Product'}" class="product-image" />
                  <div class="product-info">
                    <h3 class="product-title">${product.name || 'Product'}</h3>
                    <p class="product-description">${descText}</p>
                    <div class="product-footer">
                      <span class="product-price">₱${price.toFixed(2)}</span>
                      <button class="product-button">Order</button>
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
              }

              const imageEl = card.querySelector('.product-image, img, .product-image img');
              if (imageEl) {
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
              const orderButton = card.querySelector('.product-button, button');
              if (orderButton) {
                // Remove any existing handlers
                orderButton.onclick = null;
                // Clone the product to avoid closure issues
                const productCopy = JSON.parse(JSON.stringify(product));
                
                // Try multiple methods to ensure click works
                orderButton.onclick = (e) => {
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
                
                // Ensure button is fully clickable
                orderButton.style.cursor = 'pointer';
                orderButton.style.pointerEvents = 'auto';
                orderButton.style.zIndex = '9999';
                orderButton.style.position = 'relative';
                orderButton.disabled = false;
                orderButton.removeAttribute('disabled');
                orderButton.setAttribute('data-product-id', product.id || index);
                orderButton.setAttribute('type', 'button');
                orderButton.setAttribute('tabindex', '0');
                
                // Remove any CSS that might block clicks
                const card = orderButton.closest('.product-card, .product');
                if (card) {
                  card.style.pointerEvents = 'auto';
                  card.style.position = 'relative';
                  card.style.zIndex = '1';
                }
              }
            });
            
            // Add click handlers to ALL product buttons in the template (including existing ones)
            // This ensures buttons that weren't updated in the loop above still get handlers
            const allProductButtons = iframeDoc.querySelectorAll('.product-button, .product-card button, .product button');
            allProductButtons.forEach((button, btnIndex) => {
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
                  
                  // Ensure button is fully clickable
                  button.style.cursor = 'pointer';
                  button.style.pointerEvents = 'auto';
                  button.style.zIndex = '9999';
                  button.style.position = 'relative';
                  button.disabled = false;
                  button.removeAttribute('disabled');
                  button.setAttribute('data-product-id', matchingProduct.id || btnIndex);
                  button.setAttribute('type', 'button');
                  button.setAttribute('tabindex', '0');
                  
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
                    const buttons = document.querySelectorAll('.product-button, .product-card button, .product button');
                    buttons.forEach(function(button) {
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
                      
                      button.style.cursor = 'pointer';
                      button.style.pointerEvents = 'auto';
                      button.disabled = false;
                    });
                  }
                  
                  setupOrderButtons();
                  setTimeout(setupOrderButtons, 100);
                  setTimeout(setupOrderButtons, 500);
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

        // Update logo with store name and add click handler
        const logo = iframeDoc.querySelector('.logo, .navbar .logo');
        if (logo) {
          logo.textContent = store.storeName || 'Store';
          logo.onclick = (e) => {
            e.preventDefault();
            iframeDoc.querySelector('.hero, body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          };
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
        if (target && (target.classList.contains('product-button') || target.closest('.product-button'))) {
          const button = target.classList.contains('product-button') ? target : target.closest('.product-button');
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

    try {
      if (!selectedProduct || !store) {
        setOrderError('Product or store information missing');
        return;
      }

      // Validate required fields
      if (!orderData.customerName || !orderData.customerEmail || !orderData.paymentMethod) {
        setOrderError('Please fill in all required fields');
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

      // Add timeout to prevent 503 errors
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
      
      try {
        const response = await apiClient.post('/orders', orderPayload, {
          signal: controller.signal,
          timeout: 25000
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
      } catch (apiError) {
        clearTimeout(timeoutId);
        throw apiError;
      }
    } catch (err) {
      console.error('Error creating order:', err);
      if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
        setOrderError('Request timed out. Please check your connection and try again.');
      } else if (err.response?.status === 503) {
        setOrderError('Service temporarily unavailable. Please try again in a moment.');
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

                  {/* Shipping Fee Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Fee (₱)</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={orderData.shippingMin || orderData.shipping || 0}
                            onChange={(e) => {
                              const min = parseFloat(e.target.value) || 0;
                              handleOrderChange('shippingMin', min);
                              if (!orderData.shippingMax || min > orderData.shippingMax) {
                                handleOrderChange('shipping', min);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={orderData.shippingMax || orderData.shipping || 0}
                            onChange={(e) => {
                              const max = parseFloat(e.target.value) || 0;
                              handleOrderChange('shippingMax', max);
                              if (!orderData.shippingMin || max < orderData.shippingMin) {
                                handleOrderChange('shipping', max);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Enter Your Shipping Fee</label>
                        <input
                          type="number"
                          min={orderData.shippingMin || 0}
                          max={orderData.shippingMax || 999999}
                          step="0.01"
                          value={orderData.shipping}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            const min = parseFloat(orderData.shippingMin) || 0;
                            const max = parseFloat(orderData.shippingMax) || 999999;
                            if (value >= min && value <= max) {
                              handleOrderChange('shipping', value);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter amount within range"
                        />
                        {(orderData.shippingMin || orderData.shippingMax) && (
                          <p className="text-xs text-gray-500 mt-1">
                            Range: ₱{parseFloat(orderData.shippingMin || 0).toFixed(2)} - ₱{parseFloat(orderData.shippingMax || 0).toFixed(2)}
                          </p>
                        )}
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
                        <span>GCash</span>
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
                        <span>PayPal</span>
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
                // Inject a script that sets up click handlers
                const script = iframeDoc.createElement('script');
                script.textContent = `
                  (function() {
                    function setupOrderButtons() {
                      const buttons = document.querySelectorAll('.product-button, .product-card button, .product button');
                      buttons.forEach(function(button) {
                        if (button.hasAttribute('data-handler-attached')) return;
                        button.setAttribute('data-handler-attached', 'true');
                        
                        button.addEventListener('click', function(e) {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Try to call parent function
                          try {
                            if (window.parent && window.parent.openOrderModal) {
                              const card = button.closest('.product-card, .product');
                              if (card) {
                                const titleEl = card.querySelector('.product-title, h3, h4, .product-name');
                                const productName = titleEl ? titleEl.textContent.trim() : '';
                                
                                // Send product name to parent
                                window.parent.postMessage({
                                  type: 'OPEN_ORDER_MODAL',
                                  productName: productName
                                }, '*');
                                
                                // Also try direct call
                                if (window.parent.openOrderModal) {
                                  // We'll need to get product data from parent
                                  window.parent.postMessage({
                                    type: 'GET_PRODUCT_BY_NAME',
                                    productName: productName
                                  }, '*');
                                }
                              }
                            }
                          } catch (err) {
                            console.error('Error in button click:', err);
                          }
                        }, true);
                      });
                    }
                    
                    // Run immediately
                    setupOrderButtons();
                    
                    // Also run after a delay to catch dynamically added buttons
                    setTimeout(setupOrderButtons, 500);
                    setTimeout(setupOrderButtons, 1000);
                    setTimeout(setupOrderButtons, 2000);
                    
                    // Watch for new buttons
                    const observer = new MutationObserver(setupOrderButtons);
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

