# Structura: System Objectives (Refined Version)

## 1. Platform Interface and User Management

### 1.1 Develop a Responsive User Interface on Desktop
**Objective:** Create an intuitive and responsive desktop interface that provides optimal user experience for store owners, customers, and administrators.

**Implementation:**
- Developed using React.js with Tailwind CSS for responsive design
- Implemented collapsible sidebar navigation for easy access to dashboard features
- Designed responsive layouts that adapt to different desktop screen sizes
- Ensured consistent UI/UX across all pages (Dashboard, Store Management, Orders, Products, etc.)
- Utilized modern CSS Grid and Flexbox for flexible layouts

### 1.2 Provide Customizable Store Templates
**Objective:** Enable users to modify store layout, product categories, and branding elements without requiring coding knowledge.

**Implementation:**
- Implemented a visual Site Builder (`SiteBuilder.jsx`) that allows drag-and-drop customization
- Provided multiple pre-designed templates (Bladesmith, Pottery, Balisong, etc.)
- Enabled customization of:
  - Store branding (logo, colors, fonts)
  - Hero section content and styling
  - Product categories and organization
  - Background images and themes
  - Text styling and layout
- Real-time preview functionality for immediate feedback

---

## 2. Product, Order, and Payment Management

### 2.1 Enable Store Owners to Upload and Manage Products
**Objective:** Provide a comprehensive product management system where store owners can easily add, edit, and organize their products with images, pricing, and descriptions.

**Implementation:**
- Product upload interface with image support via Supabase Storage
- Product fields include: name, description, price, stock quantity, category, images
- Real-time stock management with automatic updates upon order creation
- Product activation/deactivation controls
- Bulk product management capabilities

### 2.2 Develop an Order Management System with Real-Time Status Updates
**Objective:** Implement a robust order tracking system that provides real-time status updates throughout the order lifecycle.

**Implementation:**
- Order status workflow: `Pending` → `Processing` → `Shipped` → `Completed`
- Real-time status updates visible to both customers and store owners
- Order details page showing complete order information
- Customer order tracking via email verification system
- Store owner dashboard with comprehensive order management interface
- Order history and filtering capabilities

### 2.3 Implement Secure GCash Payment Workflow with COD Option
**Objective:** Create a secure payment system that supports both GCash (with QR code and manual verification) and Cash on Delivery (COD) options, ensuring safe and reliable transaction processing.

**Implementation:**

**GCash Payment Method:**
- Store owners can upload their GCash QR code image for display to customers
- Customers scan QR code and make payment via GCash app
- Manual payment submission process:
  - Customer submits payment reference number from GCash transaction
  - Customer uploads payment receipt screenshot
  - Store owner verifies payment by matching reference number and receipt details
  - Payment status updated to "verified" upon successful verification
- Secure handling of payment information and receipts

**Cash on Delivery (COD) Option:**
- Customers can select COD as payment method during checkout
- Payment collection occurs upon delivery of items
- Store owner confirms payment completion after successful delivery
- Payment status tracking for COD orders (pending → completed)

**Security Features:**
- Secure file upload for payment receipts
- Payment reference validation
- Order-payment matching system
- Encrypted data storage

---

## 3. Tools for Entrepreneurs

### 3.1 Enable Multi-Channel Selling Through Social Media Integration
**Objective:** Allow store owners to expand their reach by easily sharing their stores on various social media platforms, enabling multi-channel selling opportunities.

**Implementation:**
- Dedicated "Share Store" page (`ShareSocial.jsx`) with social media integration
- One-click sharing to major platforms:
  - Facebook (via share dialog)
  - Twitter/X (via tweet intent)
  - WhatsApp (via message link)
  - Instagram (via URL copy and paste)
- Automatic generation of shareable store URLs
- Open Graph meta tags for rich previews when shared
- Copy-to-clipboard functionality for easy link sharing
- Integration in store publish page for immediate sharing after publication

---

## 4. Compliance with ISO Standards

### 4.1 Ensure Development Follows Relevant ISO/IEC Standards
**Objective:** Design and develop Structura in accordance with international software quality and security standards to ensure reliability, security, and user satisfaction.

**Implementation:**

**ISO/IEC 25010: Software Quality Requirements**
- **Usability:** Intuitive user interface design, clear navigation, and user-friendly workflows for all user types (store owners, customers, administrators)
- **Reliability:** Error handling mechanisms, transaction rollback on failures, data validation, and consistent system behavior
- **Performance Efficiency:** Optimized database queries, efficient file storage (Supabase), and responsive page load times
- **Security:** JWT-based authentication, encrypted password storage, secure API endpoints, role-based access control (RBAC)

**ISO/IEC 27001: Information Security Management**
- Secure handling of customer data and transactions
- Encrypted storage of sensitive information (passwords, payment references)
- Secure file upload and storage for payment receipts
- Protected API endpoints with authentication middleware
- Secure session management and token-based authentication
- Data privacy compliance in handling customer information

**ISO 9241-210: Human-Centered Design for Interactive Systems**
- User-centered design approach focusing on store owner and customer needs
- Intuitive navigation and clear information architecture
- Accessibility considerations in UI design
- Consistent visual design language across all pages
- Feedback mechanisms for user actions (success messages, error notifications)
- Responsive design principles for optimal viewing experience

**Compliance Documentation:**
- System architecture documentation
- Security measures documentation
- User interface design guidelines
- Database schema documentation
- API endpoint documentation

---

## Summary

All objectives have been successfully implemented and are fully functional in the Structura platform. The system provides a comprehensive e-commerce store builder solution that enables entrepreneurs to create, customize, and manage their online stores efficiently while maintaining high standards of quality, security, and user experience as specified in the ISO/IEC standards.

