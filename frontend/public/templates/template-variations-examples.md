# HTML Template Structure Variations

This document shows different HTML structural layouts you can use for templates while maintaining SiteBuilder compatibility.

## Current Structure (Standard)
- Hero: Centered, vertical stack (h1, p, button)
- Products: Grid layout
- Navigation: Horizontal top bar

## Variation 1: Split-Screen Hero Layout

```html
<!-- Hero Section - Split Screen -->
<section class="hero" style="display: flex; min-height: 100vh;">
    <!-- Left Side: Image -->
    <div class="hero-image" style="flex: 1; background: url(...); background-size: cover;"></div>
    
    <!-- Right Side: Content -->
    <div class="hero-content" style="flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 5rem;">
        <h1>Store Title</h1>
        <p>Subtitle text here</p>
        <button class="cta-button">Shop Now</button>
    </div>
</section>
```

## Variation 2: Two-Column Hero with Badge

```html
<!-- Hero Section - Two Column with Badge -->
<section class="hero" style="padding: 8rem 5%; text-align: center;">
    <div class="hero-badge" style="display: inline-block; padding: 0.5rem 1.5rem; background: rgba(...); margin-bottom: 2rem;">
        Featured Collection
    </div>
    <div class="hero-content" style="max-width: 1200px; margin: 0 auto;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;">
            <div style="text-align: left;">
                <h1>Main Title</h1>
                <p style="margin: 1.5rem 0;">Subtitle description</p>
            </div>
            <div style="text-align: right;">
                <button class="cta-button">Explore</button>
                <p style="margin-top: 1rem; font-size: 0.9rem;">Additional info</p>
            </div>
        </div>
    </div>
</section>
```

## Variation 3: Masonry Product Grid

```html
<!-- Products Section - Masonry Layout -->
<section class="products">
    <div class="section-header">
        <h2 class="section-title">Our Products</h2>
    </div>
    <div class="product-grid" style="columns: 3; column-gap: 2rem;">
        <div class="product-card" style="break-inside: avoid; margin-bottom: 2rem; display: inline-block; width: 100%;">
            <img src="..." class="product-image" style="width: 100%; height: auto;">
            <div class="product-info">
                <h3 class="product-title">Product Name</h3>
                <p class="product-description">Description</p>
                <div class="product-footer">
                    <span class="product-price">$99</span>
                    <button class="product-button">Order</button>
                </div>
            </div>
        </div>
        <!-- More products... -->
    </div>
</section>
```

## Variation 4: Alternating Left-Right Product Layout

```html
<!-- Products Section - Alternating Layout -->
<section class="products">
    <div class="section-header">
        <h2 class="section-title">Featured Items</h2>
    </div>
    <div class="products-list" style="max-width: 1200px; margin: 0 auto;">
        <!-- Product 1: Image Left, Content Right -->
        <div class="product-card" style="display: flex; gap: 3rem; margin-bottom: 5rem; align-items: center;">
            <div class="product-image-container" style="flex: 1;">
                <img src="..." class="product-image" style="width: 100%; height: 400px; object-fit: cover; border-radius: 10px;">
            </div>
            <div class="product-info" style="flex: 1;">
                <h3 class="product-title">Product 1</h3>
                <p class="product-description">Description here</p>
                <div class="product-footer">
                    <span class="product-price">$199</span>
                    <button class="product-button">Order</button>
                </div>
            </div>
        </div>
        
        <!-- Product 2: Content Left, Image Right (reversed) -->
        <div class="product-card" style="display: flex; gap: 3rem; margin-bottom: 5rem; align-items: center; flex-direction: row-reverse;">
            <div class="product-image-container" style="flex: 1;">
                <img src="..." class="product-image" style="width: 100%; height: 400px; object-fit: cover; border-radius: 10px;">
            </div>
            <div class="product-info" style="flex: 1;">
                <h3 class="product-title">Product 2</h3>
                <p class="product-description">Description here</p>
                <div class="product-footer">
                    <span class="product-price">$249</span>
                    <button class="product-button">Order</button>
                </div>
            </div>
        </div>
    </div>
</section>
```

## Variation 5: Sidebar Navigation

```html
<!-- Navigation - Sidebar Style -->
<nav class="navbar" style="position: fixed; left: 0; top: 0; width: 250px; height: 100vh; background: ...; padding: 3rem 2rem;">
    <a href="#" class="logo" style="display: block; margin-bottom: 4rem; font-size: 2rem;">Logo</a>
    <div class="nav-links" style="display: flex; flex-direction: column; gap: 2rem;">
        <a href="#">Home</a>
        <a href="#">Shop</a>
        <a href="#">About</a>
        <a href="#">Contact</a>
    </div>
</nav>

<!-- Main Content (with left margin for sidebar) -->
<main style="margin-left: 250px;">
    <section class="hero">
        <!-- Hero content here -->
    </section>
</main>
```

## Variation 6: Minimal Centered Layout

```html
<!-- Hero - Ultra Minimal -->
<section class="hero" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center;">
    <div class="hero-content" style="max-width: 600px;">
        <div style="border: 1px solid currentColor; padding: 3rem 5rem; display: inline-block;">
            <h1 style="font-size: 3rem; margin-bottom: 1rem;">Title</h1>
            <div style="width: 60px; height: 1px; background: currentColor; margin: 2rem auto;"></div>
            <p style="margin-bottom: 2rem;">Subtitle</p>
            <button class="cta-button" style="border: 1px solid; background: transparent; padding: 1rem 3rem;">Shop</button>
        </div>
    </div>
</section>
```

## Variation 7: Large Image Hero with Overlay Text

```html
<!-- Hero - Full Background Image with Overlay -->
<section class="hero" style="position: relative; min-height: 100vh; background: url(...) center/cover;">
    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5);"></div>
    <div class="hero-content" style="position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: white;">
        <h1 style="font-size: 5rem; margin-bottom: 2rem;">Title</h1>
        <p style="font-size: 1.5rem; margin-bottom: 3rem; max-width: 700px;">Subtitle description</p>
        <button class="cta-button">Shop Now</button>
    </div>
</section>
```

## Variation 8: Carousel/Slider Products

```html
<!-- Products - Horizontal Scroll -->
<section class="products">
    <div class="section-header">
        <h2 class="section-title">Featured Products</h2>
    </div>
    <div class="product-grid" style="display: flex; gap: 2rem; overflow-x: auto; padding: 2rem 0; scroll-snap-type: x mandatory;">
        <div class="product-card" style="min-width: 300px; scroll-snap-align: start;">
            <img src="..." class="product-image" style="width: 100%; height: 300px; object-fit: cover;">
            <div class="product-info">
                <h3 class="product-title">Product</h3>
                <p class="product-description">Description</p>
                <div class="product-footer">
                    <span class="product-price">$99</span>
                    <button class="product-button">Order</button>
                </div>
            </div>
        </div>
        <!-- More products scroll horizontally -->
    </div>
</section>
```

## Important Notes for SiteBuilder Compatibility

Keep these class names for SiteBuilder to work:
- `.hero` or `.hero-content` - Hero section container
- `.hero h1` - Title element
- `.hero p` or `.hero-content p` - Subtitle element  
- `.cta-button` - Call-to-action button
- `.products`, `.featured-products`, or `.products-section` - Products container
- `.product-grid` or `.products-grid` - Product grid container
- `.product-card` - Individual product card
- `.product-image` - Product image
- `.product-info` - Product information container
- `.product-title` - Product name
- `.product-description` - Product description
- `.product-price` - Product price
- `.product-button` or `.add-to-cart` - Order button

