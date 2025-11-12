import Store from '../models/store.js';
import Product from '../models/product.js';
import User from '../models/user.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Template mapping
const templateFileMap = {
  bladesmith: 'struvaris.html',
  pottery: 'truvara.html',
  balisong: 'ructon.html',
  weavery: 'urastra.html',
  woodcarving: 'caturis.html'
};

// Serve published store as standalone HTML page (works even if frontend is down)
export const servePublishedStoreHTML = async (req, res) => {
  try {
    const { domain } = req.params;

    // Fetch store data
    const store = await Store.findOne({
      where: { 
        domainName: domain,
        status: 'published'
      },
      include: [{
        model: User,
        attributes: ['email', 'firstName', 'lastName']
      }]
    });

    if (!store) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Store Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #333; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <h1>Store Not Found</h1>
          <p>The store you're looking for doesn't exist or is not published.</p>
        </body>
        </html>
      `);
    }

    // Parse content if it's a string
    const storeData = store.toJSON();
    if (storeData.content && typeof storeData.content === 'string') {
      try {
        storeData.content = JSON.parse(storeData.content);
      } catch (e) {
        console.error('Error parsing store content:', e);
      }
    }

    // Fetch products
    const products = await Product.findAll({
      where: {
        storeId: store.id,
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });

    // Load template HTML
    const templateFile = templateFileMap[store.templateId] || 'struvaris.html';
    const templatePath = path.join(__dirname, '../../frontend/public/templates', templateFile);
    
    let htmlContent;
    try {
      htmlContent = await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      console.error('Error reading template file:', error);
      return res.status(500).send('Error loading store template');
    }

    // Get domain name once at the top (use domain name if available, otherwise store name)
    const domainName = store.domainName || store.storeName || 'Store';
    const logoDisplayName = domainName.toUpperCase(); // Uppercase for logo (like "BROCADE")
    const displayDomainName = domainName.toUpperCase(); // Uppercase for copyright (like "BROCADE")

    // Get hero content
    const heroContent = storeData.content?.hero || {};
    const heroTitle = (heroContent.title && heroContent.title.trim()) 
      ? heroContent.title.trim() 
      : (store.storeName || 'Store');
    
    const heroSubtitle = heroContent.subtitle && heroContent.subtitle.trim()
      ? heroContent.subtitle.replace(/^<p>|<\/p>$/g, '').trim()
      : (store.description || '');

    // Template-specific default background colors
    const templateDefaultColors = {
      bladesmith: '#0a0a0a', // Dark black
      pottery: '#faf8f3', // Warm beige
      balisong: '#0f0f23', // Dark blue
      weavery: '#ffffff', // White
      woodcarving: '#f5efe6' // Light beige
    };

    // Get background settings with template-specific default
    const defaultColor = templateDefaultColors[store.templateId] || '#0a0a0a';
    const backgroundSettings = storeData.content?.background || { type: 'color', color: defaultColor };

    // Replace placeholders in HTML
    htmlContent = htmlContent.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, `<h1>${heroTitle}</h1>`);
    
    // Replace subtitle
    const subtitlePattern = /<p[^>]*class="[^"]*hero[^"]*"[^>]*>[\s\S]*?<\/p>/i;
    if (subtitlePattern.test(htmlContent)) {
      htmlContent = htmlContent.replace(subtitlePattern, `<p>${heroSubtitle}</p>`);
    } else {
      // Try to find any paragraph in hero section
      htmlContent = htmlContent.replace(/(<section[^>]*class="[^"]*hero[^"]*"[^>]*>[\s\S]*?<p[^>]*>)[\s\S]*?(<\/p>)/i, `$1${heroSubtitle}$2`);
    }

    // Replace "Truvara" or any template brand name in logo/navbar with domain name (uppercase)
    htmlContent = htmlContent.replace(/(<[^>]*class="[^"]*logo[^"]*"[^>]*>)[\s\S]*?(<\/[^>]*>)/i, `$1${logoDisplayName}$2`);
    
    // Also replace any hardcoded "Truvara" text in navbar (uppercase)
    htmlContent = htmlContent.replace(/>Truvara</gi, `>${logoDisplayName}<`);
    
    // Replace footer logo/brand name with domain name (uppercase)
    htmlContent = htmlContent.replace(/(<[^>]*class="[^"]*footer-logo[^"]*"[^>]*>)[\s\S]*?(<\/[^>]*>)/i, `$1${logoDisplayName}$2`);
    
    // Replace any "Truvara" in footer (but not in copyright text which will be handled separately)
    htmlContent = htmlContent.replace(/(<footer[^>]*>[\s\S]*?<[^>]*class="[^"]*footer-logo[^"]*"[^>]*>)[\s\S]*?(<\/[^>]*>)/gi, `$1${logoDisplayName}$2`);
    
    // Replace any remaining "Truvara" in navbar and footer (except copyright)
    htmlContent = htmlContent.replace(/Truvara(?!\s*©)/gi, logoDisplayName);

    // Inject background styles
    let backgroundCSS = '';
    if (backgroundSettings.type === 'color') {
      backgroundCSS = `
        body, html {
          background-color: ${backgroundSettings.color || '#0a0a0a'} !important;
          background-image: none !important;
        }
        .hero::before {
          display: none !important;
          background-image: none !important;
        }
      `;
    } else if (backgroundSettings.type === 'image' && backgroundSettings.image) {
      const imageUrl = backgroundSettings.image.startsWith('http') 
        ? backgroundSettings.image 
        : `http://localhost:5000${backgroundSettings.image.startsWith('/') ? backgroundSettings.image : '/' + backgroundSettings.image}`;
      
      backgroundCSS = `
        body, html {
          background-image: url("${imageUrl}") !important;
          background-repeat: ${backgroundSettings.repeat || 'no-repeat'} !important;
          background-size: ${backgroundSettings.size || 'cover'} !important;
          background-position: ${backgroundSettings.position || 'center'} !important;
          background-attachment: fixed !important;
          background-color: ${backgroundSettings.color || '#0a0a0a'} !important;
        }
        .hero::before {
          display: none !important;
          background-image: none !important;
        }
      `;
    }

    // Inject CSS and products into HTML
    const styleInjection = `
      <style id="store-custom-styles">
        ${backgroundCSS}
      </style>
    `;

    // Inject products
    let productsHTML = '';
    if (products && products.length > 0) {
      products.forEach((product, index) => {
        const imageUrl = product.image && product.image !== '/imgplc.jpg'
          ? (product.image.startsWith('http') ? product.image : `http://localhost:5000${product.image}`)
          : '/imgplc.jpg';
        
        const price = parseFloat(product.price) || 0;
        productsHTML += `
          <div class="product-card" style="margin: 20px; padding: 20px; border: 1px solid #333; border-radius: 8px;">
            <img src="${imageUrl}" alt="${product.name}" style="width: 100%; max-width: 300px; height: auto; border-radius: 4px;">
            <h3 style="margin-top: 15px; color: #c9a961;">${product.name || 'Product'}</h3>
            <p style="color: #999; margin: 10px 0;">₱${price.toFixed(2)}</p>
            <p style="color: #ccc; margin: 10px 0;">${product.description ? product.description.replace(/<[^>]*>/g, '').substring(0, 100) : ''}</p>
            <button onclick="openOrderModal('${product.id}', '${product.name}', ${price})" style="padding: 10px 20px; background: #c9a961; color: #000; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">Inquire</button>
          </div>
        `;
      });
    }

    // Insert style and products into HTML
    htmlContent = htmlContent.replace('</head>', `${styleInjection}</head>`);
    
    // Find products section and replace or append products
    const productsSectionPattern = /(<section[^>]*class="[^"]*products[^"]*"[^>]*>[\s\S]*?)(<\/section>)/i;
    if (productsSectionPattern.test(htmlContent)) {
      htmlContent = htmlContent.replace(productsSectionPattern, `$1${productsHTML}$2`);
    } else {
      // Append products section before closing body
      htmlContent = htmlContent.replace('</body>', `<section class="products-section" style="padding: 4rem 5%; background: #0a0a0a; color: #e0e0e0;"><h2 style="text-align: center; color: #c9a961; margin-bottom: 3rem;">Our Products</h2><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 1400px; margin: 0 auto;">${productsHTML}</div></section></body>`);
    }

    // Add contact section
    const hasAddress = store.barangay || store.municipality || store.province || store.region;
    if (store.contactEmail || store.phone || hasAddress) {
      const addressParts = [];
      if (store.barangay) addressParts.push(store.barangay);
      if (store.municipality) addressParts.push(store.municipality);
      if (store.province) addressParts.push(store.province);
      if (store.region) addressParts.push(store.region);

      const contactHTML = `
        <section class="contact-section" style="padding: 8rem 5%; max-width: 1400px; margin: 0 auto; background: #1a1a1a; color: #e0e0e0;">
          <div style="text-align: center; max-width: 800px; margin: 0 auto;">
            <h2 style="font-size: 3rem; font-weight: 300; letter-spacing: 4px; margin-bottom: 2rem; color: #c9a961; text-transform: uppercase;">Contact Us</h2>
            <div style="width: 100px; height: 2px; background: #c9a961; margin: 0 auto 3rem;"></div>
            <div style="display: flex; flex-direction: column; gap: 2rem; align-items: center;">
              ${addressParts.length > 0 ? `<div style="font-size: 1rem; color: #999;"><strong style="color: #c9a961; display: block; margin-bottom: 0.5rem;">Address:</strong>${addressParts.join(', ')}</div>` : ''}
              ${store.contactEmail ? `<div style="font-size: 1rem; color: #999;"><strong style="color: #c9a961; display: block; margin-bottom: 0.5rem;">Email:</strong><a href="mailto:${store.contactEmail}" style="color: #c9a961; text-decoration: none;">${store.contactEmail}</a></div>` : ''}
              ${store.phone ? `<div style="font-size: 1rem; color: #999;"><strong style="color: #c9a961; display: block; margin-bottom: 0.5rem;">Phone:</strong><a href="tel:${store.phone}" style="color: #c9a961; text-decoration: none;">${store.phone}</a></div>` : ''}
            </div>
          </div>
        </section>
      `;
      htmlContent = htmlContent.replace('</body>', `${contactHTML}</body>`);
    }

    // Replace footer copyright text with domain name and new copyright
    // Use displayDomainName which is already defined above (uppercase domain name)
    const newCopyright = `© 2025 ${displayDomainName} - Structura Team from Faith Colleges`;
    
    // AGGRESSIVE replacement strategy to catch all variations of old copyright text
    // Strategy 1: Direct text replacement for known old copyright strings
    const oldCopyrightPatterns = [
      /©\s*2024\s*Truvara\s*Ceramic\s*Studio[^<]*/gi,
      /©\s*2024[^<]*Truvara[^<]*Ceramic\s*Studio[^<]*/gi,
      /©\s*2024[^<]*Truvara[^<]*/gi,
      /Truvara\s*Ceramic\s*Studio[^<]*Crafted\s*with\s*artistry[^<]*/gi,
      /©\s*\d{4}[^<]*Ceramic\s*Studio[^<]*/gi,
    ];
    
    oldCopyrightPatterns.forEach(pattern => {
      htmlContent = htmlContent.replace(pattern, newCopyright);
    });
    
    // Strategy 2: Replace entire footer paragraph containing old copyright
    // This handles the case where the paragraph contains the old copyright text
    htmlContent = htmlContent.replace(
      /(<p[^>]*>)([^<]*©\s*\d{4}[^<]*Truvara[^<]*?)(<\/p>)/gi,
      (match, openTag, content, closeTag) => {
        return openTag + newCopyright + closeTag;
      }
    );
    
    // Strategy 3: Replace copyright text in footer section (handles nested HTML)
    htmlContent = htmlContent.replace(
      /(<footer[^>]*>[\s\S]*?)(©\s*2024[^<]*?Truvara[^<]*?)([\s\S]*?<\/footer>)/gi,
      (match, before, oldCopyright, after) => {
        return before + newCopyright + after;
      }
    );
    
    // Strategy 4: Replace any copyright paragraph with year 2024 in footer
    htmlContent = htmlContent.replace(
      /(<footer[^>]*>[\s\S]*?<p[^>]*>)(©\s*2024[^<]*?)(<\/p>[\s\S]*?<\/footer>)/gi,
      (match, before, oldCopyright, after) => {
        return before + newCopyright + after;
      }
    );
    
    // Strategy 5: Replace any copyright text with year pattern (general fallback)
    if (!htmlContent.includes('Structura Team from Faith Colleges')) {
      htmlContent = htmlContent.replace(
        /(<p[^>]*>[\s\S]*?)(©\s*\d{4}[^<]*?)([\s\S]*?<\/p>)/gi,
        (match, before, oldCopyright, after) => {
          // Only replace if it's clearly a copyright notice and not already updated
          if (oldCopyright && !oldCopyright.includes('Structura Team') && oldCopyright.match(/\d{4}/)) {
            return before + newCopyright + after;
          }
          return match;
        }
      );
    }
    
    // Strategy 6: Final aggressive replacement - replace any copyright symbol with year
    if (!htmlContent.includes('Structura Team from Faith Colleges')) {
      htmlContent = htmlContent.replace(
        /©\s*\d{4}[^<]*?(?=<|$)/gi,
        (match) => {
          // Replace any copyright with year that doesn't contain our new text
          if (!match.includes('Structura Team')) {
            return newCopyright;
          }
          return match;
        }
      );
    }

    // Add order modal script
    const orderModalScript = `
      <script>
        function openOrderModal(productId, productName, productPrice) {
          alert('Order functionality: Please contact us at ${store.contactEmail || store.phone || 'the provided contact information'} to place an order for ' + productName);
        }
      </script>
    `;
    htmlContent = htmlContent.replace('</body>', `${orderModalScript}</body>`);

    // Set content type and send HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);

  } catch (error) {
    console.error('Error serving published store HTML:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #d32f2f; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <h1>Error Loading Store</h1>
        <p>An error occurred while loading the store. Please try again later.</p>
      </body>
      </html>
    `);
  }
};

