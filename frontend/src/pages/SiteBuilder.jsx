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
  fireandsteel: 'fireandsteel.html',
  carved: 'carved.html',
  revolve: 'revolve.html',
  bladebinge: 'bladebinge.html'
};

const templateNames = {
  bladesmith: 'Struvaris',
  pottery: 'Truvara',
  balisong: 'Ructon',
  fireandsteel: 'Fire and Steel',
  carved: 'Carved',
  revolve: 'Revolve',
  bladebinge: 'Blade Binge'
};

// Template-specific default background colors
const templateDefaultColors = {
  bladesmith: '#0a0a0a', // Dark black
  pottery: '#faf8f3', // Warm beige
  balisong: '#0f0f23', // Dark blue
  fireandsteel: '#ffffff', // White (like Fire and Steel website)
  carved: '#fafafa', // Light gray
  revolve: '#ffffff', // White
  bladebinge: '#0a0a0a' // Dark black
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
  // Responsive preview
  const [previewSize, setPreviewSize] = useState('desktop'); // desktop | tablet | mobile
  
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
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    heroSection: true,
    textStyling: false,
    backgroundSettings: false,
    products: true
  });

  // Move Mode - allow dragging/nudging text inside the iframe
  const [moveMode, setMoveMode] = useState(false);
  // Layers (element list)
  const [layers, setLayers] = useState([]);

  // Enable/disable move mode inside iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) return;

    // Helper to inject or remove handlers
    const enableMove = () => {
      try {
        // Avoid duplicate injection
        if (doc.getElementById('__structura-move-mode')) return;
        const script = doc.createElement('script');
        script.id = '__structura-move-mode';
        script.textContent = `
          (function(){
            if (window.__structuraMoveMode) return;
            const state = {
              active: true,
              selected: null,
              dragging: false,
              startX: 0,
              startY: 0,
              baseLeft: 0,
              baseTop: 0
            };

            // History for undo/redo
            const history = [];
            let historyIndex = -1;
            function pushHistory(action){
              // Trim future
              history.splice(historyIndex + 1);
              history.push(action);
              historyIndex = history.length - 1;
            }
            function applyAction(action, direction){
              if (!action) return;
              try{
                if (action.type === 'move' && action.el){
                  const el = document.querySelector('[data-move-id=\"' + action.id + '\"]') || action.el;
                  if (!el) return;
                  const left = direction === 'undo' ? action.from.left : action.to.left;
                  const top = direction === 'undo' ? action.from.top : action.to.top;
                  el.dataset.offsetLeft = String(left);
                  el.dataset.offsetTop = String(top);
                  el.style.transform = 'translate(' + left + 'px,' + top + 'px)';
                }
                if (action.type === 'text' && action.id){
                  const el = document.querySelector('[data-move-id=\"' + action.id + '\"]');
                  if (!el) return;
                  el.innerHTML = direction === 'undo' ? action.from : action.to;
                }
              }catch(_){}
            }
            function undo(){ if (historyIndex >= 0){ const a = history[historyIndex]; historyIndex--; applyAction(a, 'undo'); } }
            function redo(){ if (historyIndex < history.length - 1){ historyIndex++; const a = history[historyIndex]; applyAction(a, 'redo'); } }

            // Add helper styles
            (function addStyles(){
              if (document.getElementById('__structura-move-style')) return;
              const style = document.createElement('style');
              style.id = '__structura-move-style';
              style.textContent = '[data-move-selected]{outline:2px dashed #8B5CF6 !important; cursor: move !important;}'
                + '#__structura-center-v, #__structura-center-h{position:fixed;left:0;top:0;pointer-events:none;z-index:99999;}'
                + '#__structura-center-v{left:50%;top:0;bottom:0;width:0;border-left:1px dashed rgba(239,68,68,0.9);}'
                + '#__structura-center-h{top:50%;left:0;right:0;height:0;border-top:1px dashed rgba(239,68,68,0.9);}';
              document.head.appendChild(style);
            })();

            // Add center guidelines (vertical + horizontal)
            (function addGuides(){
              if (!document.getElementById('__structura-center-v')){
                const v = document.createElement('div');
                v.id = '__structura-center-v';
                document.body.appendChild(v);
              }
              if (!document.getElementById('__structura-center-h')){
                const h = document.createElement('div');
                h.id = '__structura-center-h';
                document.body.appendChild(h);
              }
              if (!document.getElementById('__structura-dist')){
                const d = document.createElement('div');
                d.id = '__structura-dist';
                d.style.position = 'fixed';
                d.style.right = '12px';
                d.style.top = '12px';
                d.style.padding = '6px 8px';
                d.style.background = 'rgba(17,24,39,0.75)';
                d.style.color = '#fff';
                d.style.fontSize = '12px';
                d.style.borderRadius = '6px';
                d.style.pointerEvents = 'none';
                d.style.zIndex = '99999';
                d.style.display = 'none';
                document.body.appendChild(d);
              }
            })();

            // Assign stable ids to selectable elements
            let idSeq = 1;
            function ensureId(el){
              if (!el.getAttribute('data-move-id')){
                el.setAttribute('data-move-id', String(idSeq++));
              }
              return el.getAttribute('data-move-id');
            }

            const selectableSelectors = [
              '.hero h1', '.hero h2', '.hero h3', '.hero p', '.hero .title', '.hero .subtitle',
              '.welcome-title', 'h1', 'h2', 'h3', 'p', '.product-title', '.section-title', '.headline', '.subhead'
            ];

            function isTextNodeElement(el){
              if (!el) return false;
              const style = window.getComputedStyle(el);
              // Heuristic: display inline/inline-block/block and has some text
              return !!(el.textContent && style && (style.display === 'block' || style.display === 'inline' || style.display === 'inline-block'));
            }

            function findSelectable(el){
              if (!el) return null;
              // If matches known selectors
              for (const sel of selectableSelectors){
                if (el.matches && el.matches(sel)) return el;
              }
              // Climb up to find a text element
              let cur = el;
              let steps = 0;
              while (cur && steps < 5){
                if (isTextNodeElement(cur)) return cur;
                cur = cur.parentElement;
                steps++;
              }
              return null;
            }

            function select(el){
              if (state.selected && state.selected !== el){
                state.selected.removeAttribute('data-move-selected');
              }
              state.selected = el;
              if (state.selected){
                state.selected.setAttribute('data-move-selected','true');
                if (!state.selected.style.position || state.selected.style.position === 'static'){
                  state.selected.style.position = 'relative';
                }
                if (!state.selected.dataset.offsetLeft){ state.selected.dataset.offsetLeft = '0'; }
                if (!state.selected.dataset.offsetTop){ state.selected.dataset.offsetTop = '0'; }
              }
            }

            function onMouseDown(e){
              if (!state.active) return;
              // Prevent links/buttons from triggering navigation while moving
              const tag = (e.target.tagName || '').toLowerCase();
              if (tag === 'a' || tag === 'button') {
                e.preventDefault();
              }
              const target = findSelectable(e.target);
              if (!target) return;
              e.preventDefault();
              select(target);
              state.dragging = true;
              state.startX = e.clientX;
              state.startY = e.clientY;
              state.baseLeft = parseFloat(state.selected.dataset.offsetLeft || '0');
              state.baseTop = parseFloat(state.selected.dataset.offsetTop || '0');
            }
            function onMouseMove(e){
              if (!state.active || !state.dragging || !state.selected) return;
              const dx = e.clientX - state.startX;
              const dy = e.clientY - state.startY;
              let newLeft = state.baseLeft + dx;
              let newTop = state.baseTop + dy;
              // Snap to center
              const rect = state.selected.getBoundingClientRect();
              const midX = rect.left + rect.width / 2 + (parseFloat(state.selected.dataset.offsetLeft || '0'));
              const midY = rect.top + rect.height / 2 + (parseFloat(state.selected.dataset.offsetTop || '0'));
              const viewportMidX = window.innerWidth / 2;
              const viewportMidY = window.innerHeight / 2;
              const threshold = 8;
              // compute offsets relative to element's base position
              const curLeft = newLeft;
              const curTop = newTop;
              // Estimate element center after transform relative to viewport
              const elemCenterX = rect.left + rect.width / 2 + (curLeft - (parseFloat(state.selected.dataset.offsetLeft || '0')));
              const elemCenterY = rect.top + rect.height / 2 + (curTop - (parseFloat(state.selected.dataset.offsetTop || '0')));
              if (Math.abs(elemCenterX - viewportMidX) <= threshold){
                // align center horizontally
                const delta = viewportMidX - (rect.left + rect.width / 2);
                newLeft = delta;
              }
              if (Math.abs(elemCenterY - viewportMidY) <= threshold){
                const deltaY = viewportMidY - (rect.top + rect.height / 2);
                newTop = deltaY;
              }
              state.selected.style.transform = 'translate(' + newLeft + 'px,' + newTop + 'px)';
              // Update distance label
              const d = document.getElementById('__structura-dist');
              if (d){
                const dxCenter = Math.round(elemCenterX - viewportMidX);
                const dyCenter = Math.round(elemCenterY - viewportMidY);
                d.textContent = 'ΔX center: ' + dxCenter + 'px, ΔY center: ' + dyCenter + 'px';
                d.style.display = 'block';
              }
            }
            function onMouseUp(e){
              if (!state.active || !state.dragging || !state.selected) return;
              const dx = e.clientX - state.startX;
              const dy = e.clientY - state.startY;
              const newLeft = state.baseLeft + dx;
              const newTop = state.baseTop + dy;
              const id = ensureId(state.selected);
              // Record history
              pushHistory({
                type: 'move',
                id,
                el: state.selected,
                from: { left: parseFloat(state.selected.dataset.offsetLeft || '0'), top: parseFloat(state.selected.dataset.offsetTop || '0') },
                to: { left: newLeft, top: newTop }
              });
              state.selected.dataset.offsetLeft = String(newLeft);
              state.selected.dataset.offsetTop = String(newTop);
              state.dragging = false;
              const d = document.getElementById('__structura-dist');
              if (d) d.style.display = 'none';
            }
            function onClick(e){
              if (!state.active) return;
              const target = findSelectable(e.target);
              if (target){
                select(target);
              }
            }
            function onKeyDown(e){
              if (!state.active || !state.selected) return;
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){
                e.preventDefault();
                if (e.shiftKey) { redo(); } else { undo(); }
                return;
              }
              const step = e.shiftKey ? 10 : 1;
              let left = parseFloat(state.selected.dataset.offsetLeft || '0');
              let top = parseFloat(state.selected.dataset.offsetTop || '0');
              let changed = false;
              if (e.key === 'ArrowLeft'){ left -= step; changed = true; }
              if (e.key === 'ArrowRight'){ left += step; changed = true; }
              if (e.key === 'ArrowUp'){ top -= step; changed = true; }
              if (e.key === 'ArrowDown'){ top += step; changed = true; }
              if (changed){
                e.preventDefault();
                const id = ensureId(state.selected);
                pushHistory({
                  type: 'move',
                  id,
                  el: state.selected,
                  from: { left: parseFloat(state.selected.dataset.offsetLeft || '0'), top: parseFloat(state.selected.dataset.offsetTop || '0') },
                  to: { left, top }
                });
                state.selected.dataset.offsetLeft = String(left);
                state.selected.dataset.offsetTop = String(top);
                state.selected.style.transform = 'translate(' + left + 'px,' + top + 'px)';
              }
            }

            // Inline editing (dblclick to edit text, blur or Ctrl+Enter to finish)
            function onDblClick(e){
              if (!state.active) return;
              const target = findSelectable(e.target);
              if (!target) return;
              e.preventDefault();
              select(target);
              if (!state.selected) return;
              // Make editable
              state.selected.setAttribute('contenteditable','true');
              state.selected.focus();
              // Keep current outline while editing
              const finish = () => {
                if (!state.selected) return;
                const id = ensureId(state.selected);
                pushHistory({
                  type: 'text',
                  id,
                  from: state.selected.getAttribute('data-prev-html') || state.selected.innerHTML,
                  to: state.selected.innerHTML
                });
                state.selected.removeAttribute('contenteditable');
                state.selected.removeAttribute('data-prev-html');
                // Notify parent that content changed
                try {
                  if (window.parent && window.parent !== window){
                    window.parent.postMessage({ type: 'IFRAME_CONTENT_CHANGED' }, '*');
                  }
                } catch(_){}
              };
              const onKey = (ke) => {
                if ((ke.key === 'Enter' && ke.ctrlKey) || (ke.key === 'Escape')) {
                  ke.preventDefault();
                  state.selected.blur();
                }
              };
              state.selected.setAttribute('data-prev-html', state.selected.innerHTML);
              state.selected.addEventListener('keydown', onKey, { capture: true, once: false });
              state.selected.addEventListener('blur', () => {
                state.selected && state.selected.removeEventListener('keydown', onKey, { capture: true });
                finish();
              }, { once: true });
            }

            document.addEventListener('mousedown', onMouseDown, true);
            document.addEventListener('mousemove', onMouseMove, true);
            document.addEventListener('mouseup', onMouseUp, true);
            document.addEventListener('click', onClick, true);
            document.addEventListener('keydown', onKeyDown, true);
            document.addEventListener('dblclick', onDblClick, true);

            window.__structuraMoveMode = {
              disable: function(){
                state.active = false;
                if (state.selected){ state.selected.removeAttribute('data-move-selected'); }
                document.removeEventListener('mousedown', onMouseDown, true);
                document.removeEventListener('mousemove', onMouseMove, true);
                document.removeEventListener('mouseup', onMouseUp, true);
                document.removeEventListener('click', onClick, true);
                document.removeEventListener('keydown', onKeyDown, true);
                document.removeEventListener('dblclick', onDblClick, true);
                // Remove guides
                const v = document.getElementById('__structura-center-v');
                const h = document.getElementById('__structura-center-h');
                if (v) v.remove();
                if (h) h.remove();
              }
            };
          })();
        `;
        doc.head.appendChild(script);
        // Focus iframe document so it receives key events
        if (iframe.contentWindow) { iframe.contentWindow.focus(); }
        if (doc && doc.body && doc.body.focus) { try { doc.body.setAttribute('tabindex','-1'); doc.body.focus(); } catch(_){} }
      } catch (err) {
        console.error('Move mode enable failed:', err);
      }
    };

    const disableMove = () => {
      try {
        if (iframe.contentWindow && iframe.contentWindow.__structuraMoveMode) {
          iframe.contentWindow.__structuraMoveMode.disable();
        }
        const injected = doc.getElementById('__structura-move-mode');
        if (injected) injected.remove();
      } catch (err) {
        console.error('Move mode disable failed:', err);
      }
    };

    if (moveMode) enableMove(); else disableMove();

    return () => {
      disableMove();
    };
  }, [moveMode, htmlContent, templateId]);
  
  // Scan selectable elements in iframe and build layer list
  const refreshLayers = () => {
    try {
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      if (!doc) return;
      const selectors = [
        '.hero h1', '.hero h2', '.hero h3', '.hero p', '.hero .title', '.hero .subtitle',
        '.welcome-title', 'h1', 'h2', 'h3', 'p', '.product-title', '.section-title', '.headline', '.subhead',
        'button', '.button', '.cta-button', '.hero button', '.hero .button', 'a.button', 'a.cta-button'
      ];
      const found = [];
      let idSeq = 1;
      selectors.forEach(sel => {
        doc.querySelectorAll(sel).forEach(el => {
          // Skip if element is marked as deleted
          if (el.getAttribute('data-deleted') === 'true') return;
          
          // assign stable id
          if (!el.getAttribute('data-move-id')) {
            el.setAttribute('data-move-id', String(idSeq++));
          }
          const id = el.getAttribute('data-move-id');
          const text = (el.textContent || '').trim().slice(0, 60);
          const tag = el.tagName.toLowerCase();
          const hidden = el.style.display === 'none';
          const locked = el.getAttribute('data-move-locked') === 'true';
          found.push({ id, text: text || `${tag} element`, hidden, locked, tag });
        });
      });
      setLayers(found);
    } catch (err) {
      console.error('Failed to refresh layers:', err);
    }
  };

  // Select/lock/hide helpers operating inside iframe
  const withIframeEl = (id, fn) => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (!doc) return;
    const el = doc.querySelector(`[data-move-id="${id}"]`);
    if (!el) return;
    fn(el, doc);
  };

  const selectLayer = (id) => {
    withIframeEl(id, (el) => {
      // Clear previous selection
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      doc.querySelectorAll('[data-move-selected]').forEach(x => x.removeAttribute('data-move-selected'));
      el.setAttribute('data-move-selected', 'true');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const toggleLockLayer = (id) => {
    withIframeEl(id, (el) => {
      const locked = el.getAttribute('data-move-locked') === 'true';
      if (locked) {
        el.setAttribute('data-move-locked', 'false');
        el.style.pointerEvents = '';
        el.style.userSelect = '';
      } else {
        el.setAttribute('data-move-locked', 'true');
        el.style.pointerEvents = 'none';
        el.style.userSelect = 'none';
      }
    });
    refreshLayers();
  };

  const toggleHideLayer = (id) => {
    withIframeEl(id, (el) => {
      el.style.display = el.style.display === 'none' ? '' : 'none';
    });
    refreshLayers();
  };

  const deleteLayer = (id) => {
    if (!window.confirm('Are you sure you want to delete this element? This action cannot be undone.')) {
      return;
    }
    withIframeEl(id, (el) => {
      // Mark as deleted instead of actually removing (so we can track it)
      el.setAttribute('data-deleted', 'true');
      el.style.display = 'none';
      // Store original display value in case we need to restore
      if (!el.getAttribute('data-original-display')) {
        el.setAttribute('data-original-display', el.style.display || '');
      }
    });
    refreshLayers();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
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

  // Reusable text style presets
  const [textStylePresets, setTextStylePresets] = useState(() => {
    try {
      const saved = localStorage.getItem('textStylePresets');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return { title: [], subtitle: [], button: [] };
  });
  useEffect(() => {
    try { localStorage.setItem('textStylePresets', JSON.stringify(textStylePresets)); } catch (_) {}
  }, [textStylePresets]);
  const addPreset = (kind, name, style) => {
    setTextStylePresets(prev => ({
      ...prev,
      [kind]: [...prev[kind], { name: name || `${kind} preset ${prev[kind].length + 1}`, style }]
    }));
  };
  const removePreset = (kind, index) => {
    setTextStylePresets(prev => {
      const arr = [...prev[kind]];
      arr.splice(index, 1);
      return { ...prev, [kind]: arr };
    });
  };
  const applyPreset = (kind, index) => {
    const preset = textStylePresets[kind]?.[index];
    if (!preset) return;
    if (kind === 'title') setHeroContent(prev => ({ ...prev, titleStyle: { ...prev.titleStyle, ...preset.style } }));
    if (kind === 'subtitle') setHeroContent(prev => ({ ...prev, subtitleStyle: { ...prev.subtitleStyle, ...preset.style } }));
    if (kind === 'button') setHeroContent(prev => ({ ...prev, buttonStyle: { ...prev.buttonStyle, ...preset.style } }));
  };

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
            if (heroContent.titleStyle.marginTop !== undefined) heroH1.style.marginTop = typeof heroContent.titleStyle.marginTop === 'string' ? heroContent.titleStyle.marginTop : heroContent.titleStyle.marginTop + 'px';
            if (heroContent.titleStyle.marginBottom !== undefined) heroH1.style.marginBottom = typeof heroContent.titleStyle.marginBottom === 'string' ? heroContent.titleStyle.marginBottom : heroContent.titleStyle.marginBottom + 'px';
            if (heroContent.titleStyle.padding !== undefined) heroH1.style.padding = typeof heroContent.titleStyle.padding === 'string' ? heroContent.titleStyle.padding : heroContent.titleStyle.padding + 'px';
            if (heroContent.titleStyle.center) {
              heroH1.style.display = 'block';
              heroH1.style.marginLeft = 'auto';
              heroH1.style.marginRight = 'auto';
              heroH1.style.textAlign = 'center';
            }
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
            if (heroContent.subtitleStyle.marginTop !== undefined) heroP.style.marginTop = typeof heroContent.subtitleStyle.marginTop === 'string' ? heroContent.subtitleStyle.marginTop : heroContent.subtitleStyle.marginTop + 'px';
            if (heroContent.subtitleStyle.marginBottom !== undefined) heroP.style.marginBottom = typeof heroContent.subtitleStyle.marginBottom === 'string' ? heroContent.subtitleStyle.marginBottom : heroContent.subtitleStyle.marginBottom + 'px';
            if (heroContent.subtitleStyle.padding !== undefined) heroP.style.padding = typeof heroContent.subtitleStyle.padding === 'string' ? heroContent.subtitleStyle.padding : heroContent.subtitleStyle.padding + 'px';
            if (heroContent.subtitleStyle.center) {
              heroP.style.display = 'block';
              heroP.style.marginLeft = 'auto';
              heroP.style.marginRight = 'auto';
              heroP.style.textAlign = 'center';
            }
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
            if (heroContent.buttonStyle.marginTop !== undefined) ctaButton.style.marginTop = typeof heroContent.buttonStyle.marginTop === 'string' ? heroContent.buttonStyle.marginTop : heroContent.buttonStyle.marginTop + 'px';
            if (heroContent.buttonStyle.marginBottom !== undefined) ctaButton.style.marginBottom = typeof heroContent.buttonStyle.marginBottom === 'string' ? heroContent.buttonStyle.marginBottom : heroContent.buttonStyle.marginBottom + 'px';
            if (heroContent.buttonStyle.padding !== undefined) ctaButton.style.padding = typeof heroContent.buttonStyle.padding === 'string' ? heroContent.buttonStyle.padding : heroContent.buttonStyle.padding + 'px';
            if (heroContent.buttonStyle.center) {
              ctaButton.style.display = 'block';
              ctaButton.style.marginLeft = 'auto';
              ctaButton.style.marginRight = 'auto';
              ctaButton.style.textAlign = 'center';
            }
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
            try {
              // Clear existing product cards (but keep the structure)
              const existingCards = productsGrid.querySelectorAll('.product-card');
              existingCards.forEach(card => {
                if (card && card.parentNode === productsGrid) {
                  card.remove();
                }
              });
              
              // Verify productsGrid is still a valid parent before adding
              if (productsGrid.parentNode) {
                // Add products dynamically
                products.filter(p => p.isActive !== false).forEach((product, index) => {
                  try {
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
                    // Double-check parent is still valid before appending
                    if (productsGrid.parentNode) {
                      productsGrid.appendChild(productCard);
                    }
                  } catch (cardError) {
                    console.warn('Error adding product card:', cardError);
                  }
                });
              }
            } catch (productsError) {
              console.warn('Error updating products in iframe:', productsError);
            }
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

  const handleSaveHero = async () => {
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

      // Save only hero content to backend
      const content = {
        hero: heroContent
      };

      await apiClient.put(`/stores/${storeId}/content`, 
        { content },
      );

      setStatus('Hero section saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (e) {
      setStatus('Error saving hero: ' + (e.response?.data?.message || e.message));
      setTimeout(() => setStatus(''), 5000);
    }
  };

  // Capture element states (visibility and position) from iframe
  const captureElementStates = () => {
    try {
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      if (!doc) return {};

      const elementStates = {};
      const selectors = [
        '.hero h1', '.hero h2', '.hero h3', '.hero p', '.hero .title', '.hero .subtitle',
        '.welcome-title', 'h1', 'h2', 'h3', 'p', '.product-title', '.section-title', '.headline', '.subhead',
        'button', '.button', '.cta-button', '.hero button', '.hero .button', 'a.button', 'a.cta-button'
      ];

      selectors.forEach(sel => {
        doc.querySelectorAll(sel).forEach((el, idx) => {
          // Get or assign stable id using same logic as refreshLayers and PublishedStore
          let id = el.getAttribute('data-move-id');
          if (!id) {
            // Generate ID using same logic as when applying states
            const text = (el.textContent || '').trim().slice(0, 60);
            const tag = el.tagName.toLowerCase();
            const className = (el.className || '').toString().trim();
            id = `${tag}-${className}-${text}`.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '').slice(0, 50) || `${tag}-${idx}`;
            el.setAttribute('data-move-id', id);
          }

          // Check if element is deleted
          const isDeleted = el.getAttribute('data-deleted') === 'true';

          // Capture visibility state
          const display = el.style.display || '';
          const isHidden = display === 'none';

          // Capture position state (from move mode)
          const offsetLeft = el.getAttribute('data-offset-left') || '0';
          const offsetTop = el.getAttribute('data-offset-top') || '0';
          const transform = el.style.transform || '';

          // Save state if element is deleted, hidden, moved, or has any changes
          if (isDeleted || isHidden || offsetLeft !== '0' || offsetTop !== '0' || transform) {
            elementStates[id] = {
              deleted: isDeleted,
              display: isDeleted || isHidden ? 'none' : '',
              offsetLeft: offsetLeft,
              offsetTop: offsetTop,
              transform: transform,
              selector: sel,
              tag: el.tagName.toLowerCase(),
              className: (el.className || '').toString().trim(),
              text: (el.textContent || '').trim().slice(0, 60)
            };
          }
        });
      });

      return elementStates;
    } catch (err) {
      console.error('Failed to capture element states:', err);
      return {};
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

      // Capture element states (visibility and position) from iframe
      const elementStates = captureElementStates();
      console.log('💾 Captured element states:', elementStates);

      // Save template content (hero, background, element states) to backend - products are managed separately
      const content = {
        hero: heroContent,
        background: backgroundSettings,
        elementStates: elementStates
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
      // Redirect to dashboard after successful save
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
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


  // Responsive preview dimensions
  const previewStyle = (() => {
    if (previewSize === 'mobile') return { maxWidth: '420px' };
    if (previewSize === 'tablet') return { maxWidth: '820px' };
    return { maxWidth: '100%' };
  })();

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

          {/* Responsive preview toggles */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              onClick={() => setPreviewSize('desktop')}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                background: previewSize === 'desktop' ? '#e0e7ff' : 'white',
                cursor: 'pointer',
                fontSize: '0.8125rem'
              }}
            >
              Desktop
            </button>
            <button
              onClick={() => setPreviewSize('tablet')}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                background: previewSize === 'tablet' ? '#e0e7ff' : 'white',
                cursor: 'pointer',
                fontSize: '0.8125rem'
              }}
            >
              Tablet
            </button>
            <button
              onClick={() => setPreviewSize('mobile')}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                background: previewSize === 'mobile' ? '#e0e7ff' : 'white',
                cursor: 'pointer',
                fontSize: '0.8125rem'
              }}
            >
              Mobile
            </button>
          </div>
        </div>

        {/* Layers Section */}
        <div className="layers-section" style={{ 
          marginBottom: '1rem', 
          background: '#f9fafb',
          borderRadius: '0.5rem', 
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => toggleSection('layers')}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1rem',
              cursor: 'pointer',
              background: expandedSections.layers ? '#ede9fe' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', transition: 'transform 0.2s', transform: expandedSections.layers ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ▶
              </span>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                Layers
              </h3>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); refreshLayers(); }}
              style={{ padding: '0.35rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              Refresh
            </button>
          </div>
          
          {expandedSections.layers && (
            <div style={{ padding: '0.75rem 1rem', background: 'white' }}>
              {layers.length === 0 ? (
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>No text elements detected. Click Refresh after the preview loads.</div>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {layers.map(layer => (
                    <div key={layer.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', background: '#fff' }}>
                      <button
                        onClick={() => selectLayer(layer.id)}
                        style={{ textAlign: 'left', flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#1f2937' }}
                        title="Select element"
                      >
                        {layer.text || `Element ${layer.id}`}
                      </button>
                      <button
                        onClick={() => toggleLockLayer(layer.id)}
                        title={layer.locked ? 'Unlock' : 'Lock'}
                        style={{ border: '1px solid #d1d5db', background: layer.locked ? '#fde68a' : 'white', cursor: 'pointer', fontSize: '0.75rem', borderRadius: '0.375rem', padding: '0.25rem 0.5rem' }}
                      >
                        {layer.locked ? '🔒' : '🔓'}
                      </button>
                      <button
                        onClick={() => toggleHideLayer(layer.id)}
                        title={layer.hidden ? 'Show' : 'Hide'}
                        style={{ border: '1px solid #d1d5db', background: layer.hidden ? '#fecaca' : 'white', cursor: 'pointer', fontSize: '0.75rem', borderRadius: '0.375rem', padding: '0.25rem 0.5rem' }}
                      >
                        {layer.hidden ? '👁️' : '👁️‍🗨️'}
                      </button>
                      <button
                        onClick={() => deleteLayer(layer.id)}
                        title="Delete element"
                        style={{ border: '1px solid #fecaca', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontSize: '0.75rem', borderRadius: '0.375rem', padding: '0.25rem 0.5rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hero Section Editor */}
        <div style={{ marginBottom: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleSection('heroSection')}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1rem',
              cursor: 'pointer',
              background: expandedSections.heroSection ? '#ede9fe' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', transition: 'transform 0.2s', transform: expandedSections.heroSection ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ▶
              </span>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                Hero Section
              </h3>
            </div>
          </div>
          
          {expandedSections.heroSection && (
            <div style={{ padding: '1rem' }}>
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
              {storeId && (
                <button
                  onClick={handleSaveHero}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'linear-gradient(45deg, #8B5CF6, #4C1D95)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    marginTop: '0.5rem'
                  }}
                >
                  Save Changes
                </button>
              )}
            </div>
          )}
        </div>

        {/* Text Styling Section - Right after Hero Section for visibility */}
        <div className="text-styling-section" style={{ 
          marginBottom: '1rem', 
          background: '#f9fafb',
          borderRadius: '0.5rem', 
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => toggleSection('textStyling')}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1rem',
              cursor: 'pointer',
              background: expandedSections.textStyling ? '#ede9fe' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', transition: 'transform 0.2s', transform: expandedSections.textStyling ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ▶
              </span>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600',
                margin: 0,
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.125rem' }}>🎨</span> Text Styling
              </h3>
            </div>
          </div>
          
          {expandedSections.textStyling && (
            <div style={{ padding: '1.5rem', background: 'white' }}>
              {/* Move Mode Controls */}
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1f2937' }}>Move Mode</div>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Select text in the preview, then drag with mouse or use Arrow Keys (Shift = 10px)</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={moveMode}
                    onChange={(e) => setMoveMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

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
                  <option value="'Inter', sans-serif">Inter</option>
                  <option value="'Poppins', sans-serif">Poppins</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option value="'Raleway', sans-serif">Raleway</option>
                  <option value="'Lora', serif">Lora</option>
                  <option value="'Merriweather', serif">Merriweather</option>
                  <option value="'Playfair Display', serif">Playfair Display</option>
                  <option value="'Oswald', sans-serif">Oswald</option>
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

            {/* Spacing controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600', color: '#4b5563' }}>Margin Top (px)</label>
                <input type="number" value={heroContent.titleStyle?.marginTop || 0} onChange={(e) => handleStyleChange('titleStyle', 'marginTop', parseInt(e.target.value || '0'))} style={{ width: '100%', padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600', color: '#4b5563' }}>Margin Bottom (px)</label>
                <input type="number" value={heroContent.titleStyle?.marginBottom || 0} onChange={(e) => handleStyleChange('titleStyle', 'marginBottom', parseInt(e.target.value || '0'))} style={{ width: '100%', padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600', color: '#4b5563' }}>Padding (px)</label>
                <input type="number" value={heroContent.titleStyle?.padding || 0} onChange={(e) => handleStyleChange('titleStyle', 'padding', parseInt(e.target.value || '0'))} style={{ width: '100%', padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={() => handleStyleChange('titleStyle', 'center', true)} style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                Center Horizontally
              </button>
              <button onClick={() => handleStyleChange('titleStyle', 'center', false)} style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                Uncenter
              </button>
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

            {/* Title Presets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input id="titlePresetName" type="text" placeholder="Preset name" style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }} />
              <button
                onClick={() => {
                  const el = document.getElementById('titlePresetName');
                  const name = el?.value || '';
                  addPreset('title', name, heroContent.titleStyle);
                  if (el) el.value = '';
                }}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem' }}
              >
                Save Preset
              </button>
            </div>
            {textStylePresets.title?.length > 0 && (
              <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
                {textStylePresets.title.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', borderTop: '1px dashed #e5e7eb', paddingTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.8125rem', color: '#374151' }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => applyPreset('title', i)} style={{ padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '0.375rem', fontSize: '0.75rem', cursor: 'pointer' }}>Apply</button>
                      <button onClick={() => removePreset('title', i)} style={{ padding: '0.25rem 0.5rem', border: '1px solid #fecaca', background: '#fee2e2', color: '#991b1b', borderRadius: '0.375rem', fontSize: '0.75rem', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subtitle Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input id="subtitlePresetName" type="text" placeholder="Preset name" style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }} />
            <button
              onClick={() => {
                const el = document.getElementById('subtitlePresetName');
                const name = el?.value || '';
                addPreset('subtitle', name, heroContent.subtitleStyle);
                if (el) el.value = '';
              }}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem' }}
            >
              Save Preset
            </button>
          </div>
          {textStylePresets.subtitle?.length > 0 && (
            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
              {textStylePresets.subtitle.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', borderTop: '1px dashed #e5e7eb', paddingTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.8125rem', color: '#374151' }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => applyPreset('subtitle', i)} style={{ padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '0.375rem', fontSize: '0.75rem', cursor: 'pointer' }}>Apply</button>
                    <button onClick={() => removePreset('subtitle', i)} style={{ padding: '0.25rem 0.5rem', border: '1px solid #fecaca', background: '#fee2e2', color: '#991b1b', borderRadius: '0.375rem', fontSize: '0.75rem', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  <option value="'Inter', sans-serif">Inter</option>
                  <option value="'Poppins', sans-serif">Poppins</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option value="'Raleway', sans-serif">Raleway</option>
                  <option value="'Lora', serif">Lora</option>
                  <option value="'Merriweather', serif">Merriweather</option>
                  <option value="'Playfair Display', serif">Playfair Display</option>
                  <option value="'Oswald', sans-serif">Oswald</option>
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
                  <option value="'Inter', sans-serif">Inter</option>
                  <option value="'Poppins', sans-serif">Poppins</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option value="'Raleway', sans-serif">Raleway</option>
                  <option value="'Lora', serif">Lora</option>
                  <option value="'Merriweather', serif">Merriweather</option>
                  <option value="'Playfair Display', serif">Playfair Display</option>
                  <option value="'Oswald', sans-serif">Oswald</option>
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

            {/* Button Presets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input id="buttonPresetName" type="text" placeholder="Preset name" style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }} />
              <button
                onClick={() => {
                  const el = document.getElementById('buttonPresetName');
                  const name = el?.value || '';
                  addPreset('button', name, heroContent.buttonStyle);
                  if (el) el.value = '';
                }}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem' }}
              >
                Save Preset
              </button>
            </div>
            {textStylePresets.button?.length > 0 && (
              <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
                {textStylePresets.button.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', borderTop: '1px dashed #e5e7eb', paddingTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.8125rem', color: '#374151' }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => applyPreset('button', i)} style={{ padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '0.375rem', fontSize: '0.75rem', cursor: 'pointer' }}>Apply</button>
                      <button onClick={() => removePreset('button', i)} style={{ padding: '0.25rem 0.5rem', border: '1px solid #fecaca', background: '#fee2e2', color: '#991b1b', borderRadius: '0.375rem', fontSize: '0.75rem', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </div>
          )}
        </div>

        {/* Background Customization */}
        <div style={{ marginBottom: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleSection('backgroundSettings')}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1rem',
              cursor: 'pointer',
              background: expandedSections.backgroundSettings ? '#ede9fe' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', transition: 'transform 0.2s', transform: expandedSections.backgroundSettings ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ▶
              </span>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                Background Settings
              </h3>
            </div>
          </div>
          
          {expandedSections.backgroundSettings && (
            <div style={{ padding: '1rem' }}>
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
          )}
        </div>

        {/* Products Management Section */}
        <div style={{ marginBottom: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleSection('products')}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1rem',
              cursor: 'pointer',
              background: expandedSections.products ? '#ede9fe' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', transition: 'transform 0.2s', transform: expandedSections.products ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ▶
              </span>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                Products ({products.length})
              </h3>
            </div>
            {expandedSections.products && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
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
            )}
          </div>
          
          {expandedSections.products && (
            <div style={{ padding: '1rem' }}>
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
          )}
        </div>

        {/* Save and Exit Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
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
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            Exit
          </button>
        </div>
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

      {/* Preview Area */}
      <div className="editor-preview" style={{ flex: 1, background: '#f3f4f6', padding: '2rem' }}>
        <div style={{
          margin: '0 auto',
          background: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          height: 'calc(100vh - 4rem)',
          width: '100%',
          ...previewStyle
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