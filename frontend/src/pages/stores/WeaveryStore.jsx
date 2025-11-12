import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/WeaveryStore.css';

const WeaveryStore = () => {
    const featuredProducts = [
        {
            id: 1,
            name: 'Handwoven Wall Tapestry',
            price: 299.99,
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Tapestries',
            description: 'Large handwoven wall tapestry with natural dyes',
            details: {
                dimensions: '60" x 40"',
                materials: 'Wool, Cotton',
                technique: 'Handwoven'
            }
        },
        {
            id: 2,
            name: 'Woven Throw Blanket',
            price: 189.99,
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Blankets',
            description: 'Soft woven throw blanket with geometric pattern',
            details: {
                dimensions: '50" x 60"',
                materials: 'Alpaca Wool',
                technique: 'Handwoven'
            }
        },
        {
            id: 3,
            name: 'Table Runner Set',
            price: 89.99,
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Table Linens',
            description: 'Set of 2 handwoven table runners',
            details: {
                dimensions: '72" x 12" each',
                materials: 'Linen',
                technique: 'Handwoven'
            }
        },
        {
            id: 4,
            name: 'Decorative Pillow Covers',
            price: 69.99,
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Pillows',
            description: 'Set of 2 handwoven pillow covers',
            details: {
                dimensions: '18" x 18" each',
                materials: 'Cotton, Wool',
                technique: 'Handwoven'
            }
        }
    ];

    const categories = [
        {
            id: 1,
            name: 'Tapestries',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 2,
            name: 'Blankets',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 3,
            name: 'Table Linens',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 4,
            name: 'Pillows',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        }
    ];

    return (
        <div className="weavery-store">
            <header className="header">
                <div className="logo">Thread & Weave</div>
                <nav className="nav">
                    <Link to="/">Home</Link>
                    <Link to="/collection">Collection</Link>
                    <Link to="/workshops">Workshops</Link>
                    <Link to="/custom">Custom</Link>
                    <Link to="/contact">Contact</Link>
                </nav>
            </header>

            <section className="hero">
                <div className="hero-content">
                    <h1>Art in Thread</h1>
                    <p>Handcrafted textiles that bring warmth and beauty to your space</p>
                    <button className="cta-button">Explore Collection</button>
                </div>
            </section>

            <section className="featured-products">
                <h2>Featured Pieces</h2>
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
                                <div className="product-details">
                                    <h4>Details</h4>
                                    <ul>
                                        <li><strong>Dimensions:</strong> {product.details.dimensions}</li>
                                        <li><strong>Materials:</strong> {product.details.materials}</li>
                                        <li><strong>Technique:</strong> {product.details.technique}</li>
                                    </ul>
                                </div>
                                <div className="price">${product.price}</div>
                                <button className="add-to-cart">Add to Cart</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="categories">
                <h2>Browse Collections</h2>
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

            <section className="workshops">
                <div className="workshops-content">
                    <h2>Learn the Craft</h2>
                    <p>Join our workshops and discover the art of weaving</p>
                    <div className="workshop-types">
                        <div className="workshop-type">
                            <h3>Beginner Weaving</h3>
                            <p>Perfect for first-time weavers</p>
                            <Link to="/workshops/beginner" className="workshop-link">Start Learning</Link>
                        </div>
                        <div className="workshop-type">
                            <h3>Advanced Techniques</h3>
                            <p>For experienced weavers</p>
                            <Link to="/workshops/advanced" className="workshop-link">Level Up</Link>
                        </div>
                        <div className="workshop-type">
                            <h3>Natural Dyeing</h3>
                            <p>Learn traditional dyeing methods</p>
                            <Link to="/workshops/dyeing" className="workshop-link">Learn More</Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="process">
                <h2>Our Process</h2>
                <div className="process-steps">
                    <div className="step">
                        <i className="fas fa-spinner"></i>
                        <h3>Hand Spun</h3>
                        <p>Traditional spinning techniques</p>
                    </div>
                    <div className="step">
                        <i className="fas fa-paint-brush"></i>
                        <h3>Natural Dyes</h3>
                        <p>Eco-friendly coloring process</p>
                    </div>
                    <div className="step">
                        <i className="fas fa-hands"></i>
                        <h3>Hand Woven</h3>
                        <p>Artisanal weaving methods</p>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>About Thread & Weave</h3>
                        <p>Creating unique handwoven textiles that bring art into your everyday life.</p>
                    </div>
                    <div className="footer-section">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><Link to="/collection">Collection</Link></li>
                            <li><Link to="/workshops">Workshops</Link></li>
                            <li><Link to="/custom">Custom Orders</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h3>Contact Us</h3>
                        <p>Email: studio@threadandweave.com</p>
                        <p>Phone: (555) 123-4567</p>
                        <p>Address: 123 Weave Street, Artisan City</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 Thread & Weave. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default WeaveryStore; 