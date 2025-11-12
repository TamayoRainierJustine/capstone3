import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/BladesmithStore.css';

const BladesmithStore = () => {
    const featuredProducts = [
        {
            id: 1,
            name: 'Custom Damascus Steel Sword',
            price: 1299.99,
            image: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Swords',
            description: 'Hand-forged Damascus steel with custom handle'
        },
        {
            id: 2,
            name: 'Viking Style Axe',
            price: 599.99,
            image: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Axes',
            description: 'Authentic Viking design with leather-wrapped handle'
        },
        {
            id: 3,
            name: 'Japanese Katana',
            price: 899.99,
            image: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Swords',
            description: 'Traditional folded steel with ray skin handle'
        },
        {
            id: 4,
            name: 'Custom Hunting Knife',
            price: 299.99,
            image: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Knives',
            description: 'High-carbon steel with custom sheath'
        }
    ];

    const categories = [
        {
            id: 1,
            name: 'Swords',
            image: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 2,
            name: 'Axes',
            image: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 3,
            name: 'Knives',
            image: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 4,
            name: 'Custom Orders',
            image: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        }
    ];

    return (
        <div className="bladesmith-store">
            <header className="header">
                <div className="logo">Iron Forge</div>
                <nav className="nav">
                    <Link to="/">Home</Link>
                    <Link to="/products">Products</Link>
                    <Link to="/custom-orders">Custom Orders</Link>
                    <Link to="/gallery">Gallery</Link>
                    <Link to="/contact">Contact</Link>
                </nav>
            </header>

            <section className="hero">
                <div className="hero-content">
                    <h1>Forged in Tradition</h1>
                    <p>Handcrafted blades and weapons of exceptional quality</p>
                    <button className="cta-button">View Collection</button>
                </div>
            </section>

            <section className="featured-products">
                <h2>Featured Creations</h2>
                <div className="products-grid">
                    {featuredProducts.map(product => (
                        <div key={product.id} className="product-card">
                            <div className="product-image">
                                <img src={product.image} alt={product.name} />
                            </div>
                            <div className="product-info">
                                <h3>{product.name}</h3>
                                <span className="category">{product.category}</span>
                                <p className="description">{product.description}</p>
                                <div className="price">${product.price}</div>
                                <button className="add-to-cart">Inquire Now</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="categories">
                <h2>Browse by Category</h2>
                <div className="categories-grid">
                    {categories.map(category => (
                        <div key={category.id} className="category-card">
                            <img src={category.image} alt={category.name} />
                            <div className="category-overlay">
                                <h3>{category.name}</h3>
                                <Link to={`/category/${category.id}`} className="category-link">
                                    View Collection
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="features">
                <div className="feature">
                    <i className="fas fa-fire"></i>
                    <h3>Hand Forged</h3>
                    <p>Traditional techniques</p>
                </div>
                <div className="feature">
                    <i className="fas fa-tools"></i>
                    <h3>Custom Orders</h3>
                    <p>Personalized designs</p>
                </div>
                <div className="feature">
                    <i className="fas fa-medal"></i>
                    <h3>Quality Guaranteed</h3>
                    <p>Lifetime warranty</p>
                </div>
            </section>

            <section className="custom-orders">
                <div className="custom-orders-content">
                    <h2>Custom Orders</h2>
                    <p>Have a specific design in mind? Let's create your perfect blade.</p>
                    <Link to="/custom-orders" className="custom-order-button">
                        Start Your Design
                    </Link>
                </div>
            </section>

            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>About Iron Forge</h3>
                        <p>Master craftsmen creating exceptional blades and weapons since 1995.</p>
                    </div>
                    <div className="footer-section">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><Link to="/products">All Products</Link></li>
                            <li><Link to="/custom-orders">Custom Orders</Link></li>
                            <li><Link to="/gallery">Gallery</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h3>Contact Us</h3>
                        <p>Email: forge@ironforge.com</p>
                        <p>Phone: (555) 123-4567</p>
                        <p>Address: 123 Forge Street, Blacksmith City</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 Iron Forge. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default BladesmithStore; 