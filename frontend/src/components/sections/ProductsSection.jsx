import React, { useRef } from 'react';
import './ProductsSection.css';

export default function ProductsSection({ title, products = [], onEdit }) {
  const titleRef = useRef();
  const productRefs = useRef({});

  const handleBlur = () => {
    const updatedProducts = products.map((product, index) => ({
      ...product,
      name: productRefs.current[`name-${index}`]?.innerText || product.name,
      price: productRefs.current[`price-${index}`]?.innerText || product.price,
    }));

    onEdit({
      title: titleRef.current.innerText,
      products: updatedProducts,
    });
  };

  // Static product list for demo
  const demoProducts = [
    { name: 'Sample Product 1', price: '₱500', image: 'https://via.placeholder.com/120' },
    { name: 'Sample Product 2', price: '₱750', image: 'https://via.placeholder.com/120' },
  ];

  return (
    <section className="products-section">
      <h2
        ref={titleRef}
        contentEditable
        suppressContentEditableWarning
        className="products-title"
        onBlur={handleBlur}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div className="products-list">
        {products.map((product, index) => (
          <div key={index} className="product-card">
            <img src={product.image} alt={product.name} className="product-image" />
            <div className="product-info">
              <div
                ref={el => productRefs.current[`name-${index}`] = el}
                contentEditable
                suppressContentEditableWarning
                className="product-name"
                onBlur={handleBlur}
                dangerouslySetInnerHTML={{ __html: product.name }}
              />
              <div className="product-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
                <div
                  ref={el => productRefs.current[`price-${index}`] = el}
                  contentEditable
                  suppressContentEditableWarning
                  className="product-price"
                  onBlur={handleBlur}
                  dangerouslySetInnerHTML={{ __html: product.price }}
                />
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <button className="product-button cart-button add-to-cart" title="Add to Cart" aria-label="Add to Cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.5rem .75rem', borderRadius: 8 }}>
                    <span aria-hidden="true">🛒</span><span className="sr-only" style={{ position: 'absolute', left: -9999 }}>Add to Cart</span>
                  </button>
                  <button className="product-button order-button" style={{ padding: '.5rem .75rem', borderRadius: 8 }}>Order</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
} 