import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QuillEditor from '../components/QuillEditor';
import { regions, getProvincesByRegion, getCityMunByProvince, getBarangayByMun } from 'phil-reg-prov-mun-brgy';
import apiClient from '../utils/axios';
import { getImageUrl } from '../utils/imageUrl';
import '../styles/SiteBuilder.css';

// Template mapping
const templateFileMap = {
  bladesmith: 'struvaris.html',
  pottery: 'truvara.html',
  balisong: 'ructon.html',
  weavery: 'urastra.html',
  woodcarving: 'caturis.html'
};

const templateNames = {
  bladesmith: 'Struvaris',
  pottery: 'Truvara',
  balisong: 'Ructon',
  weavery: 'Urastra',
  woodcarving: 'Caturis'
};

// Template-specific default background colors
const templateDefaultColors = {
  bladesmith: '#0a0a0a', // Dark black
  pottery: '#faf8f3', // Warm beige
  balisong: '#0f0f23', // Dark blue
  weavery: '#ffffff', // White
  woodcarving: '#f5efe6' // Light beige
};

export default function SiteBuilder() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const templateIdFromUrl = searchParams.get('template');
  
  const [templateId, setTemplateId] = useState(templateIdFromUrl || 'bladesmith');
  const [templateFile, setTemplateFile] = useState(templateFileMap[templateIdFromUrl || 'bladesmith'] || 'struvaris.html');
  const [status, setStatus] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const iframeRef = useRef(null);
  const [storeId, setStoreId] = useState(null);
  
  // Products state
  const [products, setProducts] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: null
  });
  const [productImagePreview, setProductImagePreview] = useState(null);
  
  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    storeName: '',
    description: '',
    domainName: '',
    region: '',
    province: '',
    municipality: '',
    barangay: '',
    contactEmail: '',
    phone: ''
  });
  
  // Location dropdowns state
  const [regionsList] = useState(regions);
  const [provincesList, setProvincesList] = useState([]);
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [barangaysList, setBarangaysList] = useState([]);
  
  // Content state - these will be editable
  // Initialize with empty values - will be populated from store data or user input
  const [heroContent, setHeroContent] = useState({
    title: '',
    subtitle: '',
    buttonText: 'Shop Now',
    // Text styling
    titleStyle: {
      fontFamily: 'Arial, sans-serif',
      fontSize: '3rem',
      fontWeight: 'bold',
      color: '#ffffff',
      fontStyle: 'normal',
      textDecoration: 'none'
    },
    subtitleStyle: {
      fontFamily: 'Arial, sans-serif',
      fontSize: '1.2rem',
      fontWeight: 'normal',
      color: '#e0e0e0',
      fontStyle: 'normal',
      textDecoration: 'none'
    },
    buttonStyle: {
      fontFamily: 'Arial, sans-serif',
      fontSize: '1rem',
      fontWeight: '600',
      color: '#000000',
      backgroundColor: '#c9a961',
      fontStyle: 'normal',
      textDecoration: 'none'
    }
  });
  

  // Background settings state
  const [backgroundSettings, setBackgroundSettings] = useState({
    type: 'color', // 'color' or 'image'
    color: templateDefaultColors[templateIdFromUrl || 'bladesmith'] || '#0a0a0a', // Template-specific default
    image: '', // Base64 or URL
    repeat: 'no-repeat',
    size: 'cover',
    position: 'center'
  });

  useEffect(() => {
    if (templateIdFromUrl && templateFileMap[templateIdFromUrl]) {
      const newTemplateId = templateIdFromUrl;
      setTemplateId(newTemplateId);
      setTemplateFile(templateFileMap[newTemplateId]);
      // Update background color to match template default when template changes
      // Only update if current color matches the old template's default or is empty
      setBackgroundSettings(prev => {
        const defaultColor = templateDefaultColors[newTemplateId] || '#0a0a0a';
        // Check if current color matches any template default (user hasn't customized)
        const matchesAnyDefault = Object.values(templateDefaultColors).includes(prev.color);
        return {
          ...prev,
          color: matchesAnyDefault || !prev.color ? defaultColor : prev.color
        };
      });
    }
  }, [templateIdFromUrl]);

  // Load existing store data
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await apiClient.get('/stores');

        if (response.data && response.data.length > 0) {
          const storeData = response.data[0];
          setStoreId(storeData.id);
          setStoreSettings({
            storeName: storeData.storeName || '',
            description: storeData.description || '',
            domainName: storeData.domainName || '',
            region: storeData.region || '',
            province: storeData.province || '',
            municipality: storeData.municipality || '',
            barangay: storeData.barangay || '',
            contactEmail: storeData.contactEmail || '',
            phone: storeData.phone || ''
          });

          // Update template ID if it exists in store data
          if (storeData.templateId && templateFileMap[storeData.templateId]) {
            setTemplateId(storeData.templateId);
            setTemplateFile(templateFileMap[storeData.templateId]);
          }

          // Load saved content if exists, otherwise use store form data
          if (storeData.content) {
            if (storeData.content.hero) {
              // Use saved hero content, but fallback to store data if empty
              const savedHero = storeData.content.hero;
              setHeroContent({
                title: savedHero.title && savedHero.title.trim() ? savedHero.title : (storeData.storeName || ''),
                subtitle: savedHero.subtitle && savedHero.subtitle.trim() ? savedHero.subtitle : (storeData.description ? `<p>${storeData.description}</p>` : ''),
                buttonText: savedHero.buttonText && savedHero.buttonText.trim() ? savedHero.buttonText : 'Shop Now',
                titleStyle: savedHero.titleStyle || {
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  fontStyle: 'normal',
                  textDecoration: 'none'
                },
                subtitleStyle: savedHero.subtitleStyle || {
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1.2rem',
                  fontWeight: 'normal',
                  color: '#e0e0e0',
                  fontStyle: 'normal',
                  textDecoration: 'none'
                },
                buttonStyle: savedHero.buttonStyle || {
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#000000',
                  backgroundColor: '#c9a961',
                  fontStyle: 'normal',
                  textDecoration: 'none'
                }
              });
            } else {
              // No saved hero content, use store form data
              setHeroContent({
                title: storeData.storeName || '',
                subtitle: storeData.description ? `<p>${storeData.description}</p>` : '',
                buttonText: 'Shop Now',
                titleStyle: {
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  fontStyle: 'normal',
                  textDecoration: 'none'
                },
                subtitleStyle: {
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1.2rem',
                  fontWeight: 'normal',
                  color: '#e0e0e0',
                  fontStyle: 'normal',
                  textDecoration: 'none'
                },
                buttonStyle: {
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#000000',
                  backgroundColor: '#c9a961',
                  fontStyle: 'normal',
                  textDecoration: 'none'
                }
              });
            }
            if (storeData.content.background) {
              setBackgroundSettings(storeData.content.background);
            } else {
              // No saved background, use template default
              const defaultColor = templateDefaultColors[storeData.templateId || templateId] || '#0a0a0a';
              setBackgroundSettings({
                type: 'color',
                color: defaultColor,
                image: '',
                repeat: 'no-repeat',
                size: 'cover',
                position: 'center'
              });
            }
          } else {
            // No saved content at all, initialize with store form data
            setHeroContent({
              title: storeData.storeName || '',
              subtitle: storeData.description ? `<p>${storeData.description}</p>` : '',
              buttonText: 'Shop Now',
              titleStyle: {
                fontFamily: 'Arial, sans-serif',
                fontSize: '3rem',
                fontWeight: 'bold',
                color: '#ffffff',
                fontStyle: 'normal',
                textDecoration: 'none'
              },
              subtitleStyle: {
                fontFamily: 'Arial, sans-serif',
                fontSize: '1.2rem',
                fontWeight: 'normal',
                color: '#e0e0e0',
                fontStyle: 'normal',
                textDecoration: 'none'
              },
              buttonStyle: {
                fontFamily: 'Arial, sans-serif',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#000000',
                backgroundColor: '#c9a961',
                fontStyle: 'normal',
                textDecoration: 'none'
              }
            });
            // Use template default background
            const defaultColor = templateDefaultColors[storeData.templateId || templateId] || '#0a0a0a';
            setBackgroundSettings({
              type: 'color',
              color: defaultColor,
              image: '',
              repeat: 'no-repeat',
              size: 'cover',
              position: 'center'
            });
          }

          // Load products
          try {
            const productsResponse = await apiClient.get('/products');
            if (productsResponse.data) {
              setProducts(productsResponse.data || []);
            }
          } catch (productsError) {
            console.error('Error fetching products:', productsError);
          }

          // Load location dropdowns based on existing data
          if (storeData.region) {
            setProvincesList(getProvincesByRegion(storeData.region));
            if (storeData.province) {
              setMunicipalitiesList(getCityMunByProvince(storeData.province));
              if (storeData.municipality) {
                const barangaysData = getBarangayByMun(storeData.municipality);
                const barangaysArray = barangaysData?.data || barangaysData || [];
                setBarangaysList(Array.isArray(barangaysArray) ? barangaysArray.map(brgy => ({
                  brgy_code: brgy.brgy_code || brgy.code || brgy.brgyCode || '',
                  name: (brgy.name || brgy.brgy_name || brgy.brgyName || '').toUpperCase()
                })) : []);
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching store data:', error);
        console.error('   Error response:', error.response?.data);
        console.error('   Error status:', error.response?.status);
        console.error('   Error message:', error.message);
        if (error.response?.data) {
          console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
        }
      }
    };

    fetchStoreData();
  }, []);


  // Load HTML template content
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const response = await fetch(`/templates/${templateFile}`);
        const html = await response.text();
        setHtmlContent(html);
      } catch (error) {
        console.error('Error loading template:', error);
      }
    };
    loadTemplate();
  }, [templateFile]);

  // Update iframe with current content in real-time
  useEffect(() => {
    if (!htmlContent || !iframeRef.current) return;

    const updateIframe = () => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;

      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // Update hero section with styles
        // Use store name if hero title is empty, otherwise use hero title
        const displayTitle = heroContent.title || storeSettings.storeName || '';
        const heroH1 = iframeDoc.querySelector('.hero h1');
        if (heroH1) {
          heroH1.textContent = displayTitle;
          // Apply title styles
          if (heroContent.titleStyle) {
            heroH1.style.fontFamily = heroContent.titleStyle.fontFamily || 'Arial, sans-serif';
            heroH1.style.fontSize = heroContent.titleStyle.fontSize || '3rem';
            heroH1.style.fontWeight = heroContent.titleStyle.fontWeight || 'bold';
            heroH1.style.color = heroContent.titleStyle.color || '#ffffff';
            heroH1.style.fontStyle = heroContent.titleStyle.fontStyle || 'normal';
            heroH1.style.textDecoration = heroContent.titleStyle.textDecoration || 'none';
          }
        }

        // Update hero subtitle/paragraph with styles - try multiple selectors
        let heroP = iframeDoc.querySelector('.hero p, .hero-content p, .hero .hero-content p');
        
        // If no paragraph exists, create one (some templates don't have it)
        if (!heroP) {
          const heroContentDiv = iframeDoc.querySelector('.hero-content, .hero');
          const heroH1 = iframeDoc.querySelector('.hero h1');
          if (heroContentDiv && heroH1) {
            heroP = iframeDoc.createElement('p');
            // Insert after h1, before button or hero-line
            const heroLine = heroContentDiv.querySelector('.hero-line');
            if (heroLine) {
              heroContentDiv.insertBefore(heroP, heroLine);
            } else {
              const ctaButton = heroContentDiv.querySelector('.cta-button');
              if (ctaButton) {
                heroContentDiv.insertBefore(heroP, ctaButton);
              } else {
                heroH1.insertAdjacentElement('afterend', heroP);
              }
            }
          }
        }
        
        if (heroP) {
          // Remove wrapping <p> tags from Quill content if present
          let subtitleText = heroContent.subtitle || '';
          // If subtitle is empty, use store description
          if (!subtitleText || subtitleText.trim() === '' || subtitleText === '<p></p>') {
            subtitleText = storeSettings.description || '';
          } else {
            subtitleText = subtitleText.replace(/^<p>|<\/p>$/g, '').trim();
          }
          heroP.innerHTML = subtitleText || '';
          // Apply subtitle styles
          if (heroContent.subtitleStyle) {
            heroP.style.fontFamily = heroContent.subtitleStyle.fontFamily || 'Arial, sans-serif';
            heroP.style.fontSize = heroContent.subtitleStyle.fontSize || '1.2rem';
            heroP.style.fontWeight = heroContent.subtitleStyle.fontWeight || 'normal';
            heroP.style.color = heroContent.subtitleStyle.color || '#e0e0e0';
            heroP.style.fontStyle = heroContent.subtitleStyle.fontStyle || 'normal';
            heroP.style.textDecoration = heroContent.subtitleStyle.textDecoration || 'none';
          }
        }

        // Update button text with styles
        const ctaButton = iframeDoc.querySelector('.hero .cta-button');
        if (ctaButton) {
          ctaButton.textContent = heroContent.buttonText;
          // Apply button styles
          if (heroContent.buttonStyle) {
            ctaButton.style.fontFamily = heroContent.buttonStyle.fontFamily || 'Arial, sans-serif';
            ctaButton.style.fontSize = heroContent.buttonStyle.fontSize || '1rem';
            ctaButton.style.fontWeight = heroContent.buttonStyle.fontWeight || '600';
            ctaButton.style.color = heroContent.buttonStyle.color || '#000000';
            ctaButton.style.backgroundColor = heroContent.buttonStyle.backgroundColor || '#c9a961';
            ctaButton.style.fontStyle = heroContent.buttonStyle.fontStyle || 'normal';
            ctaButton.style.textDecoration = heroContent.buttonStyle.textDecoration || 'none';
          }
        }

        // Apply background settings
        const body = iframeDoc.body;
        if (body) {
          if (backgroundSettings.type === 'color') {
            body.style.backgroundColor = backgroundSettings.color || '#0a0a0a';
            body.style.backgroundImage = 'none';
          } else if (backgroundSettings.type === 'image' && backgroundSettings.image) {
            // Use getImageUrl to convert relative paths to full URLs
            const imageUrl = backgroundSettings.image.startsWith('http') 
              ? backgroundSettings.image 
              : getImageUrl(backgroundSettings.image);
            body.style.backgroundImage = `url(${imageUrl})`;
            body.style.backgroundRepeat = backgroundSettings.repeat || 'no-repeat';
            body.style.backgroundSize = backgroundSettings.size || 'cover';
            body.style.backgroundPosition = backgroundSettings.position || 'center';
            body.style.backgroundColor = backgroundSettings.color || '#0a0a0a'; // Fallback color
          }
        }

        // Also apply to html element
        const html = iframeDoc.documentElement;
        if (html) {
          if (backgroundSettings.type === 'color') {
            html.style.backgroundColor = backgroundSettings.color || '#0a0a0a';
            html.style.backgroundImage = 'none';
          } else if (backgroundSettings.type === 'image' && backgroundSettings.image) {
            // Use getImageUrl to convert relative paths to full URLs
            const imageUrl = backgroundSettings.image.startsWith('http') 
              ? backgroundSettings.image 
              : getImageUrl(backgroundSettings.image);
            html.style.backgroundImage = `url(${imageUrl})`;
            html.style.backgroundRepeat = backgroundSettings.repeat || 'no-repeat';
            html.style.backgroundSize = backgroundSettings.size || 'cover';
            html.style.backgroundPosition = backgroundSettings.position || 'center';
            html.style.backgroundColor = backgroundSettings.color || '#0a0a0a';
          }
        }

        // Update products in real-time
        const productsSection = iframeDoc.querySelector('.featured-products, .products, .products-section');
        if (productsSection) {
          const productsGrid = productsSection.querySelector('.products-grid, .product-grid');
          if (productsGrid && products.length > 0) {
            // Clear existing product cards (but keep the structure)
            const existingCards = productsGrid.querySelectorAll('.product-card');
            existingCards.forEach(card => card.remove());
            
            // Add products dynamically
            products.filter(p => p.isActive !== false).forEach((product, index) => {
              const productCard = iframeDoc.createElement('div');
              productCard.className = 'product-card';
              productCard.innerHTML = `
                <div class="product-image">
                  <img src="${product.image ? (product.image.startsWith('http') ? product.image : getImageUrl(product.image)) : 'https://via.placeholder.com/300'}" alt="${product.name || 'Product'}" />
                </div>
                <div class="product-info">
                  <h3>${product.name || 'Product'}</h3>
                  <p class="description">${product.description || ''}</p>
                  <div class="price">₱${parseFloat(product.price || 0).toFixed(2)}</div>
                  <button class="add-to-cart" type="button">Order</button>
                </div>
              `;
              productsGrid.appendChild(productCard);
            });
          }
        }

        // If iframe hasn't loaded the content yet, write it first
        if (!iframeDoc.body || iframeDoc.body.children.length === 0) {
          iframeDoc.open();
          iframeDoc.write(htmlContent);
          iframeDoc.close();
          // Wait a bit then update
          setTimeout(updateIframe, 50);
        }
      } catch (error) {
        console.error('Error updating iframe:', error);
        // Fallback: try rewriting the HTML
        try {
          let updatedHtml = htmlContent;
          updatedHtml = updatedHtml.replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${heroContent.title}</h1>`);
          const subtitleText = heroContent.subtitle.replace(/^<p>|<\/p>$/g, '').trim();
          updatedHtml = updatedHtml.replace(/<p>[\s\S]*?<\/p>\s*<button/, `<p>${subtitleText}</p>\n            <button`);
          updatedHtml = updatedHtml.replace(/<button[^>]*class="cta-button"[^>]*>[\s\S]*?<\/button>/, `<button class="cta-button">${heroContent.buttonText}</button>`);
          
          const iframeDoc = iframe.contentDocument;
          iframeDoc.open();
          iframeDoc.write(updatedHtml);
          iframeDoc.close();
        } catch (fallbackError) {
          console.error('Fallback update also failed:', fallbackError);
        }
      }
    };

    // Immediate update for real-time preview
    const updateImmediately = () => {
      if (iframeRef.current?.contentDocument?.body) {
        updateIframe();
      } else {
        // If iframe not ready, wait a bit
        setTimeout(updateIframe, 50);
      }
    };
    
    updateImmediately();
    
    // Also listen for iframe load events
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', updateIframe);
      return () => {
        iframe.removeEventListener('load', updateIframe);
      };
    }
  }, [htmlContent, heroContent, backgroundSettings, products, storeSettings]);

  const handleStyleChange = (element, property, value) => {
    setHeroContent(prev => ({
      ...prev,
      [element]: {
        ...prev[element],
        [property]: value
      }
    }));
  };

  const handleHeroChange = (field, value) => {
    setHeroContent(prev => ({ ...prev, [field]: value }));
  };

  // Product management functions
  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setProductForm(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', productForm.price);
      formData.append('stock', productForm.stock || 0);
      if (productForm.image) {
        formData.append('image', productForm.image);
      }

      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setStatus('Product updated successfully!');
      } else {
        await apiClient.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setStatus('Product added successfully!');
      }
      
      await fetchProducts();
      setShowAddProduct(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', stock: '', image: null });
      setProductImagePreview(null);
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Error: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock || '',
      image: null
    });
    setProductImagePreview(product.image ? getImageUrl(product.image) : null);
    setShowAddProduct(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiClient.delete(`/products/${id}`);
      await fetchProducts();
      setStatus('Product deleted successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Error: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setStatus(''), 5000);
    }
  };



  const handleStoreSettingsChange = (field, value) => {
    // Handle location cascading dropdowns
    if (field === 'region') {
      setProvincesList(getProvincesByRegion(value));
      setMunicipalitiesList([]);
      setBarangaysList([]);
      setStoreSettings(prev => ({ ...prev, [field]: value, province: '', municipality: '', barangay: '' }));
    } else if (field === 'province') {
      setMunicipalitiesList(getCityMunByProvince(value));
      setBarangaysList([]);
      setStoreSettings(prev => ({ ...prev, [field]: value, municipality: '', barangay: '' }));
    } else if (field === 'municipality') {
      const barangaysData = getBarangayByMun(value);
      const barangaysArray = barangaysData?.data || barangaysData || [];
      setBarangaysList(Array.isArray(barangaysArray) ? barangaysArray.map(brgy => ({
        brgy_code: brgy.brgy_code || brgy.code || brgy.brgyCode || '',
        name: (brgy.name || brgy.brgy_name || brgy.brgyName || '').toUpperCase()
      })) : []);
      setStoreSettings(prev => ({ ...prev, [field]: value, barangay: '' }));
    } else {
      setStoreSettings(prev => ({ ...prev, [field]: value }));
      
      // Sync store name with hero title in real-time if hero title is empty
      if (field === 'storeName' && (!heroContent.title || heroContent.title.trim() === '')) {
        setHeroContent(prev => ({ ...prev, title: value }));
      }
      
      // Sync store description with hero subtitle in real-time if subtitle is empty
      if (field === 'description' && (!heroContent.subtitle || heroContent.subtitle.trim() === '' || heroContent.subtitle === '<p></p>')) {
        setHeroContent(prev => ({ ...prev, subtitle: `<p>${value}</p>` }));
      }
    }
  };

  const handleSaveStoreSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus('Error: Please log in to save settings');
        return;
      }

      if (!storeId) {
        setStatus('Error: No store found. Please create a store first.');
        return;
      }

      const payload = {
        templateId,
        ...storeSettings
      };

      await apiClient.put(`/stores/${storeId}`, payload);

      setStatus('Store settings saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (e) {
      setStatus('Error saving store settings: ' + (e.response?.data?.message || e.message));
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus('Error: Please log in to save');
        return;
      }

      if (!storeId) {
        setStatus('Error: No store found. Please create a store first.');
        return;
      }

      // Save store settings first
      await handleSaveStoreSettings();
      
      // Save template content (hero, background) to backend - products are managed separately
      const content = {
        hero: heroContent,
        background: backgroundSettings
      };

      console.log('💾 Saving content with background settings:', backgroundSettings);
      console.log('💾 Full content object:', content);
      console.log('💾 Background type:', backgroundSettings.type);
      console.log('💾 Background image:', backgroundSettings.image);
      console.log('💾 Background color:', backgroundSettings.color);

      await apiClient.put(`/stores/${storeId}/content`, 
        { content },
      );

      setStatus('Content saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (e) {
      setStatus('Error saving: ' + (e.response?.data?.message || e.message));
      setTimeout(() => setStatus(''), 5000);
    }
  };

  // React Quill toolbar configuration for hero subtitle
  const heroSubtitleToolbar = [
    [{ 'header': [2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ];


  return (
    <div className="site-builder-editor" style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex' }}>
      {/* Sidebar for editing */}
      <div className="editor-sidebar" style={{
        width: '400px',
        background: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '2rem',
        overflowY: 'auto',
        maxHeight: '100vh'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {templateNames[templateId] || 'Template Editor'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Customize your store content
          </p>
        </div>

        {/* Store Settings Section */}
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
              Store Settings
            </h3>
            {storeId && (
              <button
                onClick={handleSaveStoreSettings}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Save
              </button>
            )}
          </div>
          
          {!storeId && (
            <p style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: '1rem' }}>
              Create a store first to edit settings
            </p>
          )}

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Store Name
              </label>
              <input
                type="text"
                value={storeSettings.storeName}
                onChange={(e) => handleStoreSettingsChange('storeName', e.target.value)}
                disabled={!storeId}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: storeId ? 'white' : '#f3f4f6'
                }}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Description
              </label>
              <textarea
                value={storeSettings.description}
                onChange={(e) => handleStoreSettingsChange('description', e.target.value)}
                disabled={!storeId}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  background: storeId ? 'white' : '#f3f4f6'
                }}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Domain Name
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="text"
                  value={storeSettings.domainName}
                  onChange={(e) => handleStoreSettingsChange('domainName', e.target.value)}
                  disabled={!storeId}
                  style={{
                    width: '70%',
                    padding: '0.375rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    background: storeId ? 'white' : '#f3f4f6'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>.structura.com</span>
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Region
              </label>
              <select
                value={storeSettings.region}
                onChange={(e) => handleStoreSettingsChange('region', e.target.value)}
                disabled={!storeId}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: storeId ? 'white' : '#f3f4f6'
                }}
              >
                <option value="">Select Region</option>
                {regionsList.map(region => (
                  <option key={region.reg_code} value={region.reg_code}>{region.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Province
              </label>
              <select
                value={storeSettings.province}
                onChange={(e) => handleStoreSettingsChange('province', e.target.value)}
                disabled={!storeId || !provincesList.length}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: (storeId && provincesList.length) ? 'white' : '#f3f4f6'
                }}
              >
                <option value="">Select Province</option>
                {provincesList.map(province => (
                  <option key={province.prov_code} value={province.prov_code}>{province.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Municipality/City
              </label>
              <select
                value={storeSettings.municipality}
                onChange={(e) => handleStoreSettingsChange('municipality', e.target.value)}
                disabled={!storeId || !municipalitiesList.length}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: (storeId && municipalitiesList.length) ? 'white' : '#f3f4f6'
                }}
              >
                <option value="">Select Municipality/City</option>
                {municipalitiesList.map(mun => (
                  <option key={mun.mun_code} value={mun.mun_code}>{mun.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Barangay
              </label>
              <select
                value={storeSettings.barangay}
                onChange={(e) => handleStoreSettingsChange('barangay', e.target.value)}
                disabled={!storeId || !barangaysList.length}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: (storeId && barangaysList.length) ? 'white' : '#f3f4f6'
                }}
              >
                <option value="">Select Barangay</option>
                {barangaysList.map((brgy, idx) => (
                  <option
                    key={brgy.brgy_code || brgy.code || brgy.brgyName || brgy.name || idx}
                    value={brgy.name}
                  >
                    {brgy.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Contact Email
              </label>
              <input
                type="email"
                value={storeSettings.contactEmail}
                onChange={(e) => handleStoreSettingsChange('contactEmail', e.target.value)}
                disabled={!storeId}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: storeId ? 'white' : '#f3f4f6'
                }}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={storeSettings.phone}
                onChange={(e) => handleStoreSettingsChange('phone', e.target.value)}
                disabled={!storeId}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: storeId ? 'white' : '#f3f4f6'
                }}
              />
            </div>
          </div>
        </div>

        {/* Hero Section Editor */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            Hero Section
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Title
            </label>
            <input
              type="text"
              value={heroContent.title}
              onChange={(e) => handleHeroChange('title', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Subtitle
            </label>
            <QuillEditor
              value={heroContent.subtitle}
              onChange={(value) => handleHeroChange('subtitle', value)}
              toolbar={heroSubtitleToolbar}
              style={{
                background: 'white',
                borderRadius: '0.375rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Button Text
            </label>
            <input
              type="text"
              value={heroContent.buttonText}
              onChange={(e) => handleHeroChange('buttonText', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* Text Styling Section - Right after Hero Section for visibility */}
        <div className="text-styling-section" style={{ 
          marginBottom: '2rem', 
          padding: '1.5rem', 
          background: 'white',
          backgroundImage: 'none',
          borderRadius: '0.5rem', 
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            marginBottom: '1.5rem',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>🎨</span> Text Styling
          </h3>

          {/* Title Styling */}
          <div style={{ 
            marginBottom: '1.25rem', 
            padding: '1.25rem', 
            background: 'white', 
            borderRadius: '0.5rem', 
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <h4 style={{ 
              fontSize: '0.9375rem', 
              fontWeight: '600', 
              marginBottom: '1rem', 
              color: '#1f2937', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <span style={{ fontSize: '1.125rem' }}>📝</span> Title Styling
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Font Family</label>
                <select
                  value={heroContent.titleStyle?.fontFamily || 'Arial, sans-serif'}
                  onChange={(e) => handleStyleChange('titleStyle', 'fontFamily', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="'Courier New', monospace">Courier New</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                  <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                  <option value="Impact, sans-serif">Impact</option>
                  <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Font Size</label>
                <input
                  type="text"
                  value={heroContent.titleStyle?.fontSize || '3rem'}
                  onChange={(e) => handleStyleChange('titleStyle', 'fontSize', e.target.value)}
                  placeholder="3rem"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Font Weight</label>
                <select
                  value={heroContent.titleStyle?.fontWeight || 'bold'}
                  onChange={(e) => handleStyleChange('titleStyle', 'fontWeight', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="300">Light</option>
                  <option value="600">Semi-Bold</option>
                  <option value="700">Bold</option>
                  <option value="800">Extra Bold</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Font Style</label>
                <select
                  value={heroContent.titleStyle?.fontStyle || 'normal'}
                  onChange={(e) => handleStyleChange('titleStyle', 'fontStyle', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                  <option value="oblique">Oblique</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '0' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Text Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                <input
                  type="color"
                  value={heroContent.titleStyle?.color || '#ffffff'}
                  onChange={(e) => handleStyleChange('titleStyle', 'color', e.target.value)}
                  style={{
                    width: '45px',
                    height: '40px',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                    flexShrink: 0
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <input
                  type="text"
                  value={heroContent.titleStyle?.color || '#ffffff'}
                  onChange={(e) => handleStyleChange('titleStyle', 'color', e.target.value)}
                  placeholder="#ffffff"
                  style={{
                    width: '100px',
                    padding: '0.5rem 0.5rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>
          </div>

          {/* Subtitle Styling */}
          <div style={{ 
            marginBottom: '1.25rem', 
            padding: '1.25rem', 
            background: 'white', 
            borderRadius: '0.5rem', 
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <h4 style={{ 
              fontSize: '0.9375rem', 
              fontWeight: '600', 
              marginBottom: '1rem', 
              color: '#1f2937', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <span style={{ fontSize: '1.125rem' }}>✏️</span> Subtitle Styling
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Font Family</label>
                <select
                  value={heroContent.subtitleStyle?.fontFamily || 'Arial, sans-serif'}
                  onChange={(e) => handleStyleChange('subtitleStyle', 'fontFamily', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="'Courier New', monospace">Courier New</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                  <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                  <option value="Impact, sans-serif">Impact</option>
                  <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Font Size</label>
                <input
                  type="text"
                  value={heroContent.subtitleStyle?.fontSize || '1.2rem'}
                  onChange={(e) => handleStyleChange('subtitleStyle', 'fontSize', e.target.value)}
                  placeholder="1.2rem"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Font Weight</label>
                <select
                  value={heroContent.subtitleStyle?.fontWeight || 'normal'}
                  onChange={(e) => handleStyleChange('subtitleStyle', 'fontWeight', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="300">Light</option>
                  <option value="600">Semi-Bold</option>
                  <option value="700">Bold</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Font Style</label>
                <select
                  value={heroContent.subtitleStyle?.fontStyle || 'normal'}
                  onChange={(e) => handleStyleChange('subtitleStyle', 'fontStyle', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                  <option value="oblique">Oblique</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '0' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Text Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                <input
                  type="color"
                  value={heroContent.subtitleStyle?.color || '#e0e0e0'}
                  onChange={(e) => handleStyleChange('subtitleStyle', 'color', e.target.value)}
                  style={{
                    width: '45px',
                    height: '40px',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                    flexShrink: 0
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <input
                  type="text"
                  value={heroContent.subtitleStyle?.color || '#e0e0e0'}
                  onChange={(e) => handleStyleChange('subtitleStyle', 'color', e.target.value)}
                  placeholder="#e0e0e0"
                  style={{
                    width: '100px',
                    padding: '0.5rem 0.5rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>
          </div>

          {/* Button Styling */}
          <div style={{ 
            padding: '1.25rem', 
            background: 'white', 
            borderRadius: '0.5rem', 
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <h4 style={{ 
              fontSize: '0.9375rem', 
              fontWeight: '600', 
              marginBottom: '1rem', 
              color: '#1f2937', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <span style={{ fontSize: '1.125rem' }}>🔘</span> Button Styling
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Font Family</label>
                <select
                  value={heroContent.buttonStyle?.fontFamily || 'Arial, sans-serif'}
                  onChange={(e) => handleStyleChange('buttonStyle', 'fontFamily', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="'Courier New', monospace">Courier New</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                  <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                  <option value="Impact, sans-serif">Impact</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Font Size</label>
                <input
                  type="text"
                  value={heroContent.buttonStyle?.fontSize || '1rem'}
                  onChange={(e) => handleStyleChange('buttonStyle', 'fontSize', e.target.value)}
                  placeholder="1rem"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Font Weight</label>
                <select
                  value={heroContent.buttonStyle?.fontWeight || '600'}
                  onChange={(e) => handleStyleChange('buttonStyle', 'fontWeight', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="600">Semi-Bold</option>
                  <option value="700">Bold</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Text Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                  <input
                    type="color"
                    value={heroContent.buttonStyle?.color || '#000000'}
                    onChange={(e) => handleStyleChange('buttonStyle', 'color', e.target.value)}
                    style={{
                      width: '45px',
                      height: '40px',
                      border: '2px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none',
                      flexShrink: 0
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <input
                    type="text"
                    value={heroContent.buttonStyle?.color || '#000000'}
                    onChange={(e) => handleStyleChange('buttonStyle', 'color', e.target.value)}
                    placeholder="#000000"
                    style={{
                      width: '100px',
                      padding: '0.5rem 0.5rem',
                      border: '2px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      transition: 'all 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', color: '#4b5563' }}>Background Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                <input
                  type="color"
                  value={heroContent.buttonStyle?.backgroundColor || '#c9a961'}
                  onChange={(e) => handleStyleChange('buttonStyle', 'backgroundColor', e.target.value)}
                  style={{
                    width: '45px',
                    height: '40px',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                    flexShrink: 0
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <input
                  type="text"
                  value={heroContent.buttonStyle?.backgroundColor || '#c9a961'}
                  onChange={(e) => handleStyleChange('buttonStyle', 'backgroundColor', e.target.value)}
                  placeholder="#c9a961"
                  style={{
                    width: '100px',
                    padding: '0.5rem 0.5rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Background Customization */}
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            Background Settings
          </h3>
          
          {/* Background Type Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Background Type
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setBackgroundSettings(prev => ({ ...prev, type: 'color' }))}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: `2px solid ${backgroundSettings.type === 'color' ? '#8b5cf6' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  background: backgroundSettings.type === 'color' ? '#ede9fe' : 'white',
                  color: backgroundSettings.type === 'color' ? '#8b5cf6' : '#374151',
                  cursor: 'pointer',
                  fontWeight: backgroundSettings.type === 'color' ? '600' : '400'
                }}
              >
                Color
              </button>
              <button
                onClick={() => setBackgroundSettings(prev => ({ ...prev, type: 'image' }))}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: `2px solid ${backgroundSettings.type === 'image' ? '#8b5cf6' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  background: backgroundSettings.type === 'image' ? '#ede9fe' : 'white',
                  color: backgroundSettings.type === 'image' ? '#8b5cf6' : '#374151',
                  cursor: 'pointer',
                  fontWeight: backgroundSettings.type === 'image' ? '600' : '400'
                }}
              >
                Image
              </button>
            </div>
          </div>

          {/* Color Background Options */}
          {backgroundSettings.type === 'color' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Background Color
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="color"
                  value={backgroundSettings.color || '#0a0a0a'}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    console.log('🎨 Color background changed to:', newColor);
                    setBackgroundSettings(prev => {
                      const updated = { ...prev, color: newColor, type: 'color' };
                      console.log('🎨 Updated background settings:', updated);
                      return updated;
                    });
                  }}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={backgroundSettings.color || '#0a0a0a'}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    console.log('🎨 Color background text changed to:', newColor);
                    setBackgroundSettings(prev => {
                      const updated = { ...prev, color: newColor, type: 'color' };
                      console.log('🎨 Updated background settings:', updated);
                      return updated;
                    });
                  }}
                  placeholder="#0a0a0a"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
          )}

          {/* Image Background Options */}
          {backgroundSettings.type === 'image' && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Background Image
                </label>
                <div style={{
                  width: '100%',
                  height: '120px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '0.375rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  background: '#fff',
                  position: 'relative'
                }}>
                  {backgroundSettings.image ? (
                    <>
                      <img
                        src={backgroundSettings.image.startsWith('http') 
                          ? backgroundSettings.image 
                          : getImageUrl(backgroundSettings.image)}
                        alt="Background preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          console.error('Failed to load background image:', backgroundSettings.image);
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        onClick={() => setBackgroundSettings(prev => ({ ...prev, image: '' }))}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>No image selected</span>
                  )}
                </div>
                <label
                  htmlFor="background-image-upload"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: '#fff',
                    color: '#374151',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.background = '#fff'}
                >
                  {backgroundSettings.image ? 'Change Image' : 'Upload Image'}
                </label>
                <input
                  id="background-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (!file.type.startsWith('image/')) {
                        alert('Please select an image file');
                        return;
                      }
                      const maxSize = 5 * 1024 * 1024; // 5MB
                      if (file.size > maxSize) {
                        alert('Image size must be less than 5MB');
                        return;
                      }
                      
                      try {
                        // Upload image to server
                        const token = localStorage.getItem('token');
                        if (!token) {
                          alert('Please log in to upload images');
                          return;
                        }
                        
                        const formData = new FormData();
                        formData.append('image', file);
                        
                        const response = await apiClient.post('/stores/background/upload', formData, {
                          headers: {
                            'Content-Type': 'multipart/form-data'
                          }
                        });
                        
                        // Save just the relative path (not full URL) for portability
                        // The full URL will be constructed when displaying
                        const newImageUrl = response.data.imageUrl;
                        console.log('📸 Background image uploaded, URL:', newImageUrl);
                        setBackgroundSettings(prev => {
                          const updated = { ...prev, image: newImageUrl, type: 'image' };
                          console.log('📸 Updated background settings:', updated);
                          // The useEffect will automatically update the preview when backgroundSettings changes
                          return updated;
                        });
                        setStatus('Background image uploaded successfully!');
                        setTimeout(() => setStatus(''), 3000);
                      } catch (error) {
                        console.error('Error uploading background image:', error);
                        alert('Failed to upload image. Please try again.');
                      }
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <p style={{ marginTop: '0.25rem', fontSize: '0.65rem', color: '#6b7280' }}>
                  JPG, PNG, or GIF (max 5MB). You can also paste an image URL.
                </p>
                <input
                  type="text"
                  placeholder="Or enter image URL (e.g., https://example.com/image.jpg)"
                  value={backgroundSettings.image 
                    ? (backgroundSettings.image.startsWith('http') 
                        ? backgroundSettings.image 
                        : getImageUrl(backgroundSettings.image))
                    : ''}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (value) {
                      // If it's a full URL, save it as-is; if it's a relative path, save just the path
                      if (value.startsWith('http')) {
                        setBackgroundSettings(prev => ({ ...prev, image: value, type: 'image' }));
                      } else if (value.startsWith('/')) {
                        setBackgroundSettings(prev => ({ ...prev, image: value, type: 'image' }));
                      } else {
                        // Assume it's a full URL if it doesn't start with /
                        setBackgroundSettings(prev => ({ ...prev, image: value, type: 'image' }));
                      }
                    } else {
                      // Allow clearing the field
                      setBackgroundSettings(prev => ({ ...prev, image: '' }));
                    }
                  }}
                  onBlur={(e) => {
                    // When user finishes typing, ensure type is set to 'image' if there's a value
                    if (e.target.value.trim()) {
                      setBackgroundSettings(prev => ({ ...prev, type: 'image' }));
                    }
                  }}
                  style={{
                    width: '100%',
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Image Settings */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Background Size
                </label>
                <select
                  value={backgroundSettings.size || 'cover'}
                  onChange={(e) => setBackgroundSettings(prev => ({ ...prev, size: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="auto">Auto</option>
                  <option value="100% 100%">Stretch</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Background Position
                </label>
                <select
                  value={backgroundSettings.position || 'center'}
                  onChange={(e) => setBackgroundSettings(prev => ({ ...prev, position: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="top left">Top Left</option>
                  <option value="top right">Top Right</option>
                  <option value="bottom left">Bottom Left</option>
                  <option value="bottom right">Bottom Right</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Fallback Color (if image fails to load)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={backgroundSettings.color || '#0a0a0a'}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      console.log('🎨 Fallback color changed to:', newColor);
                      setBackgroundSettings(prev => {
                        const updated = { ...prev, color: newColor };
                        console.log('🎨 Updated background settings:', updated);
                        return updated;
                      });
                    }}
                    style={{
                      width: '60px',
                      height: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={backgroundSettings.color || '#0a0a0a'}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      console.log('🎨 Fallback color text changed to:', newColor);
                      setBackgroundSettings(prev => {
                        const updated = { ...prev, color: newColor };
                        console.log('🎨 Updated background settings:', updated);
                        return updated;
                      });
                    }}
                    placeholder="#0a0a0a"
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Products Management Section */}
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
              Products ({products.length})
            </h3>
            <button
              onClick={() => {
                setShowAddProduct(!showAddProduct);
                if (showAddProduct) {
                  setEditingProduct(null);
                  setProductForm({ name: '', description: '', price: '', stock: '', image: null });
                  setProductImagePreview(null);
                }
              }}
              style={{
                padding: '0.375rem 0.75rem',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {showAddProduct ? 'Cancel' : '+ Add Product'}
            </button>
          </div>

          {/* Add/Edit Product Form */}
          {showAddProduct && (
            <form onSubmit={handleProductSubmit} style={{ marginBottom: '1rem', padding: '1rem', background: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h4>
              
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                  Product Name
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.375rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.375rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '0.375rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                    Stock
                  </label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                    required
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.375rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                  Product Image
                </label>
                {productImagePreview && (
                  <img
                    src={productImagePreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      maxHeight: '120px',
                      objectFit: 'cover',
                      borderRadius: '0.25rem',
                      marginBottom: '0.5rem'
                    }}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProductImageChange}
                  required={!editingProduct}
                  style={{
                    width: '100%',
                    padding: '0.375rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          )}

          {/* Products List */}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {products.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', padding: '1rem' }}>
                No products yet. Add your first product!
              </p>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    padding: '0.75rem',
                    background: 'white',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}
                >
                  <img
                    src={product.image ? (product.image.startsWith('http') ? product.image : getImageUrl(product.image)) : 'https://via.placeholder.com/60'}
                    alt={product.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '0.25rem'
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.name}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      ₱{parseFloat(product.price || 0).toFixed(2)}
                    </p>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem',
                      background: product.isActive !== false ? '#d1fae5' : '#fee2e2',
                      color: product.isActive !== false ? '#065f46' : '#dc2626'
                    }}>
                      {product.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <button
                      onClick={() => handleEditProduct(product)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        fontSize: '0.65rem',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        borderRadius: '0.25rem',
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        color: '#dc2626'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Save Button */}
        <div>
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'linear-gradient(45deg, #8B5CF6, #4C1D95)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            Save Changes
          </button>
          {status && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: status.includes('Error') ? '#fee2e2' : '#d1fae5',
              color: status.includes('Error') ? '#dc2626' : '#065f46',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              {status}
            </div>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="editor-preview" style={{ flex: 1, background: '#f3f4f6', padding: '2rem' }}>
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          height: 'calc(100vh - 4rem)'
        }}>
          <iframe
            ref={iframeRef}
            src={`/templates/${templateFile}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="Template Preview"
            onLoad={() => {
              // Trigger update when iframe loads
              if (iframeRef.current && htmlContent) {
                const event = new Event('updatePreview');
                window.dispatchEvent(event);
              }
            }}
          />
        </div>
        </div>
    </div>
  );
} 