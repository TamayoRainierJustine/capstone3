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
              <div
                ref={el => productRefs.current[`price-${index}`] = el}
                contentEditable
                suppressContentEditableWarning
                className="product-price"
                onBlur={handleBlur}
                dangerouslySetInnerHTML={{ __html: product.price }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
} 