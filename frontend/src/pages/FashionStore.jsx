import React from 'react';
import { useParams } from 'react-router-dom';
import '../styles/FashionStore.css';

const FashionStore = () => {
  const { templateId } = useParams();

  return (
    <div className="fashion-store">
      <header className="header">
        <div className="logo">FASHION</div>
        <nav className="nav">
          <a href="#home">Home</a>
          <a href="#shop">Shop</a>
          <a href="#collections">Collections</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>New Collection 2024</h1>
          <p>Discover the latest trends in fashion</p>
          <button className="cta-button">Shop Now</button>
        </div>
      </section>

      <section className="products">
        <h2>Featured Products</h2>
        <div className="product-grid">
          <div className="product-card">
            <div className="product-image">
              <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b" alt="Fashion Item" />
            </div>
            <h3>Summer Dress</h3>
            <p className="price">$89.99</p>
          </div>
          <div className="product-card">
            <div className="product-image">
              <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f" alt="Fashion Item" />
            </div>
            <h3>Designer Handbag</h3>
            <p className="price">$199.99</p>
          </div>
          <div className="product-card">
            <div className="product-image">
              <img src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2" alt="Fashion Item" />
            </div>
            <h3>Casual Jacket</h3>
            <p className="price">$129.99</p>
          </div>
        </div>
      </section>

      <section className="categories">
        <h2>Shop by Category</h2>
        <div className="category-grid">
          <div className="category-card">
            <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b" alt="Women's Fashion" />
            <div className="category-overlay">
              <h3>Women</h3>
            </div>
          </div>
          <div className="category-card">
            <img src="https://images.unsplash.com/photo-1617137968427-85924c800a22" alt="Men's Fashion" />
            <div className="category-overlay">
              <h3>Men</h3>
            </div>
          </div>
          <div className="category-card">
            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f" alt="Accessories" />
            <div className="category-overlay">
              <h3>Accessories</h3>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>About Us</h3>
            <p>Your premier destination for fashion and style. We bring you the latest trends and timeless classics.</p>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#shop">Shop</a></li>
              <li><a href="#collections">Collections</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <p>Email: info@fashionstore.com</p>
            <p>Phone: (555) 123-4567</p>
            <p>Address: 123 Fashion St, Style City</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Fashion Store. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default FashionStore; 