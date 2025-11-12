import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/WoodCarvingStore.css';

const WoodCarvingStore = () => {
    const featuredProducts = [
        {
            id: 1,
            name: 'Hand-Carved Wooden Bowl',
            price: 249.99,
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Bowls',
            description: 'Beautiful hand-carved wooden bowl with natural grain patterns',
            details: {
                dimensions: '12" diameter x 4" height',
                woodType: 'Black Walnut',
                finish: 'Food-safe oil finish',
                technique: 'Hand-carved'
            }
        },
        {
            id: 2,
            name: 'Decorative Wall Panel',
            price: 399.99,
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Wall Art',
            description: 'Intricately carved wall panel featuring forest scene',
            details: {
                dimensions: '24" x 36"',
                woodType: 'Cherry Wood',
                finish: 'Natural wax finish',
                technique: 'Relief carving'
            }
        },
        {
            id: 3,
            name: 'Wooden Sculpture',
            price: 599.99,
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Sculptures',
            description: 'Abstract wooden sculpture with flowing lines',
            details: {
                dimensions: '18" x 12" x 8"',
                woodType: 'Maple',
                finish: 'Matte lacquer',
                technique: '3D carving'
            }
        },
        {
            id: 4,
            name: 'Carved Wooden Box',
            price: 179.99,
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Boxes',
            description: 'Hand-carved wooden box with hidden compartment',
            details: {
                dimensions: '8" x 6" x 4"',
                woodType: 'Mahogany',
                finish: 'Hand-rubbed oil',
                technique: 'Chip carving'
            }
        }
    ];

    const categories = [
        {
            id: 1,
            name: 'Bowls',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 2,
            name: 'Wall Art',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 3,
            name: 'Sculptures',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 4,
            name: 'Boxes',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        }
    ];

    return (
        <div className="wood-carving-store">
            <header className="header">
                <div className="logo">Wood & Soul</div>
                <nav className="nav">
                    <Link to="/">Home</Link>
                    <Link to="/gallery">Gallery</Link>
                    <Link to="/workshops">Workshops</Link>
                    <Link to="/custom">Custom</Link>
                    <Link to="/contact">Contact</Link>
                </nav>
            </header>

            <section className="hero">
                <div className="hero-content">
                    <h1>Art in Wood</h1>
                    <p>Handcrafted wooden pieces that bring nature's beauty into your space</p>
                    <button className="cta-button">Explore Gallery</button>
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
                                        <li><strong>Wood Type:</strong> {product.details.woodType}</li>
                                        <li><strong>Finish:</strong> {product.details.finish}</li>
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
                    <p>Join our workshops and discover the art of wood carving</p>
                    <div className="workshop-types">
                        <div className="workshop-type">
                            <h3>Beginner Carving</h3>
                            <p>Perfect for first-time carvers</p>
                            <Link to="/workshops/beginner" className="workshop-link">Start Learning</Link>
                        </div>
                        <div className="workshop-type">
                            <h3>Advanced Techniques</h3>
                            <p>For experienced carvers</p>
                            <Link to="/workshops/advanced" className="workshop-link">Level Up</Link>
                        </div>
                        <div className="workshop-type">
                            <h3>Tool Maintenance</h3>
                            <p>Learn proper tool care</p>
                            <Link to="/workshops/maintenance" className="workshop-link">Learn More</Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="process">
                <h2>Our Process</h2>
                <div className="process-steps">
                    <div className="step">
                        <i className="fas fa-tree"></i>
                        <h3>Wood Selection</h3>
                        <p>Carefully chosen premium woods</p>
                    </div>
                    <div className="step">
                        <i className="fas fa-hammer"></i>
                        <h3>Hand Carving</h3>
                        <p>Traditional carving techniques</p>
                    </div>
                    <div className="step">
                        <i className="fas fa-paint-brush"></i>
                        <h3>Finishing</h3>
                        <p>Natural, protective finishes</p>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>About Wood & Soul</h3>
                        <p>Creating unique hand-carved wooden pieces that bring nature's beauty into your everyday life.</p>
                    </div>
                    <div className="footer-section">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><Link to="/gallery">Gallery</Link></li>
                            <li><Link to="/workshops">Workshops</Link></li>
                            <li><Link to="/custom">Custom Orders</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h3>Contact Us</h3>
                        <p>Email: studio@woodandsoul.com</p>
                        <p>Phone: (555) 123-4567</p>
                        <p>Address: 123 Wood Street, Artisan City</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 Wood & Soul. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default WoodCarvingStore; 