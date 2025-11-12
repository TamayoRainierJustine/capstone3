import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/BalisongStore.css';
// import RichTextEditor from '../../components/RichTextEditor';
import { EditorState, convertToRaw, ContentState } from 'draft-js';

function EditableText({ value, onChange, tag = 'span', className = '', ...props }) {
  const Tag = tag;
  return (
    <Tag
      className={className}
      contentEditable
      suppressContentEditableWarning
      onBlur={e => onChange(e.target.innerText)}
      {...props}
    >
      {value}
    </Tag>
  );
}

function EditableLink({ link, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <EditableText
        value={link.name}
        onChange={val => onChange({ ...link, name: val })}
        style={{ minWidth: 60, fontWeight: 500 }}
      />
      <span style={{ color: '#888' }}>/</span>
      <EditableText
        value={link.link}
        onChange={val => onChange({ ...link, link: val })}
        style={{ minWidth: 80, color: '#3b82f6', fontSize: 13 }}
      />
    </div>
  );
}

function EditableImage({ src, onChange, className = '', ...props }) {
  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        onChange(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block' }}>
      <img src={src} alt="" style={{ cursor: 'pointer', maxWidth: '100%' }} onClick={() => document.getElementById('img-upload').click()} {...props} />
      <input
        id="img-upload"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageChange}
      />
      <button
        type="button"
        style={{ position: 'absolute', top: 4, right: 4, background: '#fff', border: '1px solid #ccc', borderRadius: 4, fontSize: 12, padding: '2px 6px', cursor: 'pointer' }}
        onClick={() => document.getElementById('img-upload').click()}
      >
        Edit
      </button>
    </div>
  );
}

function EditableHeroBg({ bgImage, onChange }) {
  const handleBgChange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        onChange(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
      <input
        id="hero-bg-upload"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleBgChange}
      />
      <button
        type="button"
        style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 4, fontSize: 12, padding: '2px 8px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
        onClick={() => document.getElementById('hero-bg-upload').click()}
      >
        Edit Hero Background
      </button>
    </div>
  );
}

const BalisongStore = ({
  hero,
  featuredProducts,
  categories,
  features,
  tutorials,
  footer,
  onContentChange
}) => {
  // Helper to update nested content
  const update = (section, value) => {
    if (onContentChange) onContentChange(section, value);
  };

  // Fallback: convert plain string to Draft.js raw object for RichTextEditor
  const getDraftValue = (val) => {
    if (!val) return '';
    try {
      JSON.parse(val); // If it's already a raw object string, return as is
      return val;
    } catch {
      // Convert plain string to Draft.js raw object string
      const state = EditorState.createWithContent(ContentState.createFromText(val));
      return JSON.stringify(convertToRaw(state.getCurrentContent()));
    }
  };

  // Editable header state
  const handleLogoChange = val => {
    update('footer', { ...footer, logo: val });
  };
  const handleNavLinkChange = (idx, newLink) => {
    const newLinks = [...footer.quickLinks];
    newLinks[idx] = newLink;
    update('footer', { ...footer, quickLinks: newLinks });
  };
  const handleHeroBgChange = img => {
    update('hero', { ...hero, bgImage: img });
  };

    return (
        <div className="balisong-store">
            <header className="header">
        <div className="logo">
          <EditableText
            value={footer.logo || 'BladeCraft'}
            onChange={handleLogoChange}
            className="logo-text"
          />
        </div>
                <nav className="nav">
          {footer.quickLinks.map((link, idx) => (
            <span key={link.name + idx} style={{ display: 'inline-block', marginRight: 8 }}>
              <Link to={link.link}>{link.name}</Link>
              <EditableLink
                link={link}
                onChange={newLink => handleNavLinkChange(idx, newLink)}
              />
            </span>
          ))}
                </nav>
            </header>

      <section
        className="hero"
        style={{
          position: 'relative',
          background: hero.bgImage ? `url(${hero.bgImage}) center/cover no-repeat` : undefined,
          minHeight: 320,
        }}
      >
        <EditableHeroBg bgImage={hero.bgImage} onChange={handleHeroBgChange} />
                <div className="hero-content">
          <EditableText
            tag="h1"
            value={hero.title}
            className="hero-title"
            onChange={val => update('hero', { ...hero, title: val })}
          />
          <EditableText
            tag="p"
            value={hero.subtitle}
            className="hero-subtitle"
            onChange={val => update('hero', { ...hero, subtitle: val })}
          />
          <EditableText
            tag="button"
            value={hero.cta}
            className="cta-button"
            onChange={val => update('hero', { ...hero, cta: val })}
          />
                </div>
            </section>

            <section className="featured-products">
                <h2>Featured Pieces</h2>
                <div className="products-grid">
          {featuredProducts.map((product, idx) => (
                        <div key={product.id} className="product-card">
                            <div className="product-image">
                <EditableImage
                  src={product.image}
                  onChange={val => {
                    const newProducts = [...featuredProducts];
                    newProducts[idx] = { ...product, image: val };
                    update('featuredProducts', newProducts);
                  }}
                />
                            </div>
                            <div className="product-info">
                <EditableText
                  tag="h3"
                  value={product.name}
                  onChange={val => {
                    const newProducts = [...featuredProducts];
                    newProducts[idx] = { ...product, name: val };
                    update('featuredProducts', newProducts);
                  }}
                />
                <EditableText
                  tag="span"
                  value={product.category}
                  className="category"
                  onChange={val => {
                    const newProducts = [...featuredProducts];
                    newProducts[idx] = { ...product, category: val };
                    update('featuredProducts', newProducts);
                  }}
                />
                <EditableText
                  tag="p"
                  value={product.description}
                  className="description"
                  onChange={val => {
                    const newProducts = [...featuredProducts];
                    newProducts[idx] = { ...product, description: val };
                    update('featuredProducts', newProducts);
                  }}
                />
                                <div className="specifications">
                                    <h4>Specifications</h4>
                                    <ul>
                    {Object.entries(product.specifications).map(([spec, val]) => (
                      <li key={spec}>
                        <strong>{spec.charAt(0).toUpperCase() + spec.slice(1)}:</strong>{' '}
                        <EditableText
                          value={val}
                          onChange={newVal => {
                            const newProducts = [...featuredProducts];
                            newProducts[idx] = {
                              ...product,
                              specifications: { ...product.specifications, [spec]: newVal }
                            };
                            update('featuredProducts', newProducts);
                          }}
                        />
                      </li>
                    ))}
                                    </ul>
                                </div>
                <div className="price">
                  <EditableText
                    value={product.price}
                    onChange={val => {
                      const newProducts = [...featuredProducts];
                      newProducts[idx] = { ...product, price: val };
                      update('featuredProducts', newProducts);
                    }}
                  />
                </div>
                                <button className="add-to-cart">Add to Cart</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="categories">
                <h2>Browse Categories</h2>
                <div className="categories-grid">
          {categories.map((category, idx) => (
                        <div key={category.id} className="category-card">
              <EditableImage
                src={category.image}
                onChange={val => {
                  const newCategories = [...categories];
                  newCategories[idx] = { ...category, image: val };
                  update('categories', newCategories);
                }}
              />
                            <div className="category-overlay">
                <EditableText
                  tag="h3"
                  value={category.name}
                  onChange={val => {
                    const newCategories = [...categories];
                    newCategories[idx] = { ...category, name: val };
                    update('categories', newCategories);
                  }}
                />
                                <Link to={`/category/${category.id}`} className="category-link">
                                    View Collection
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="features">
        {features.map((feature, idx) => (
          <div className="feature" key={idx}>
            <i className={feature.icon}></i>
            <EditableText
              tag="h3"
              value={feature.title}
              onChange={val => {
                const newFeatures = [...features];
                newFeatures[idx] = { ...feature, title: val };
                update('features', newFeatures);
              }}
            />
            <EditableText
              tag="p"
              value={feature.description}
              onChange={val => {
                const newFeatures = [...features];
                newFeatures[idx] = { ...feature, description: val };
                update('features', newFeatures);
              }}
            />
                </div>
        ))}
            </section>

            <section className="tutorials">
                <div className="tutorials-content">
          <EditableText
            tag="h2"
            value={tutorials.title}
            onChange={val => update('tutorials', { ...tutorials, title: val })}
          />
          <EditableText
            tag="p"
            value={tutorials.subtitle}
            onChange={val => update('tutorials', { ...tutorials, subtitle: val })}
          />
                    <div className="tutorial-types">
            {tutorials.types.map((type, idx) => (
              <div className="tutorial-type" key={idx}>
                <EditableText
                  tag="h3"
                  value={type.title}
                  onChange={val => {
                    const newTypes = [...tutorials.types];
                    newTypes[idx] = { ...type, title: val };
                    update('tutorials', { ...tutorials, types: newTypes });
                  }}
                />
                <EditableText
                  tag="p"
                  value={type.description}
                  onChange={val => {
                    const newTypes = [...tutorials.types];
                    newTypes[idx] = { ...type, description: val };
                    update('tutorials', { ...tutorials, types: newTypes });
                  }}
                />
                <Link to={type.link} className="tutorial-link">
                  <EditableText
                    value={type.cta}
                    onChange={val => {
                      const newTypes = [...tutorials.types];
                      newTypes[idx] = { ...type, cta: val };
                      update('tutorials', { ...tutorials, types: newTypes });
                    }}
                  />
                </Link>
                        </div>
            ))}
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
            <EditableText
              tag="h3"
              value={footer.aboutTitle}
              onChange={val => update('footer', { ...footer, aboutTitle: val })}
            />
            <EditableText
              tag="p"
              value={footer.aboutText}
              onChange={val => update('footer', { ...footer, aboutText: val })}
            />
                    </div>
                    <div className="footer-section">
                        <h3>Quick Links</h3>
                        <ul>
              {footer.quickLinks.map(link => (
                <li key={link.name}><Link to={link.link}>{link.name}</Link></li>
              ))}
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h3>Contact Us</h3>
            <EditableText
              tag="p"
              value={footer.contact.email}
              onChange={val => update('footer', { ...footer, contact: { ...footer.contact, email: val } })}
            />
            <EditableText
              tag="p"
              value={footer.contact.phone}
              onChange={val => update('footer', { ...footer, contact: { ...footer.contact, phone: val } })}
            />
            <EditableText
              tag="p"
              value={footer.contact.address}
              onChange={val => update('footer', { ...footer, contact: { ...footer.contact, address: val } })}
            />
                    </div>
                </div>
                <div className="footer-bottom">
          <EditableText
            tag="p"
            value={footer.copyright}
            onChange={val => update('footer', { ...footer, copyright: val })}
          />
                </div>
            </footer>
        </div>
    );
};

export default BalisongStore; 