import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/PotteryStore.css';

const PotteryStore = () => {
    const featuredProducts = [
        {
            id: 1,
            name: 'Hand-Thrown Ceramic Vase',
            price: 89.99,
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Vases',
            description: 'Unique hand-thrown ceramic vase with natural glaze finish',
            dimensions: '8" x 6" x 6"',
            material: 'Stoneware'
        },
        {
            id: 2,
            name: 'Artistic Tea Set',
            price: 149.99,
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Tea Sets',
            description: 'Complete tea set with hand-painted floral design',
            dimensions: 'Set of 4 cups, 1 teapot',
            material: 'Porcelain'
        },
        {
            id: 3,
            name: 'Decorative Bowl',
            price: 69.99,
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Bowls',
            description: 'Hand-carved decorative bowl with unique pattern',
            dimensions: '10" diameter x 4" height',
            material: 'Earthenware'
        },
        {
            id: 4,
            name: 'Ceramic Plant Pot',
            price: 45.99,
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            category: 'Plant Pots',
            description: 'Modern ceramic plant pot with drainage hole',
            dimensions: '6" diameter x 5" height',
            material: 'Stoneware'
        }
    ];

    const categories = [
        {
            id: 1,
            name: 'Vases',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 2,
            name: 'Tea Sets',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 3,
            name: 'Bowls',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 4,
            name: 'Plant Pots',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        }
    ];

    return (
        <div className="pottery-store">
            <header className="header">
                <div className="logo">Clay & Soul</div>
                <nav className="nav">
                    <Link to="/">Home</Link>
                    <Link to="/gallery">Gallery</Link>
                    <Link to="/workshops">Workshops</Link>
                    <Link to="/custom-orders">Custom Orders</Link>
                    <Link to="/contact">Contact</Link>
                </nav>
            </header>

            <section className="hero">
                <div className="hero-content">
                    <h1>Art in Clay</h1>
                    <p>Handcrafted ceramic pieces that bring art into your everyday life</p>
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
                                    <p><strong>Dimensions:</strong> {product.dimensions}</p>
                                    <p><strong>Material:</strong> {product.material}</p>
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
                    <h2>Join Our Workshops</h2>
                    <p>Learn the art of pottery in our hands-on workshops</p>
                    <div className="workshop-types">
                        <div className="workshop-type">
                            <h3>Beginner's Class</h3>
                            <p>Perfect for first-time potters</p>
                            <Link to="/workshops/beginner" className="workshop-link">Learn More</Link>
                        </div>
                        <div className="workshop-type">
                            <h3>Advanced Techniques</h3>
                            <p>For experienced potters</p>
                            <Link to="/workshops/advanced" className="workshop-link">Learn More</Link>
                        </div>
                        <div className="workshop-type">
                            <h3>Private Sessions</h3>
                            <p>One-on-one instruction</p>
                            <Link to="/workshops/private" className="workshop-link">Learn More</Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="process">
                <h2>Our Process</h2>
                <div className="process-steps">
                    <div className="step">
                        <i className="fas fa-hands"></i>
                        <h3>Hand-Thrown</h3>
                        <p>Each piece is carefully crafted by hand</p>
                    </div>
                    <div className="step">
                        <i className="fas fa-paint-brush"></i>
                        <h3>Glazed</h3>
                        <p>Unique glazes for distinctive finishes</p>
                    </div>
                    <div className="step">
                        <i className="fas fa-fire"></i>
                        <h3>Kiln-Fired</h3>
                        <p>High-temperature firing for durability</p>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>About Clay & Soul</h3>
                        <p>Creating unique ceramic pieces that bring beauty to your everyday life.</p>
                    </div>
                    <div className="footer-section">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><Link to="/gallery">Gallery</Link></li>
                            <li><Link to="/workshops">Workshops</Link></li>
                            <li><Link to="/custom-orders">Custom Orders</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h3>Contact Us</h3>
                        <p>Email: studio@clayandsoul.com</p>
                        <p>Phone: (555) 123-4567</p>
                        <p>Address: 123 Clay Street, Artisan City</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 Clay & Soul. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PotteryStore; 