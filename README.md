# 🏠 RentHub — Full-Stack MERN Rental Marketplace

RentHub is a modern, production-grade peer-to-peer rental marketplace built with the **MERN stack** (MongoDB, Express, React, Node.js). It enables users to list, discover, and rent physical assets—ranging from professional camera equipment, camping & outdoor gear, and musical instruments to gaming consoles and vehicles—with automated date availability and conflict prevention.

---

## 🚀 Key Modules & Implemented Features

### 1. 🔐 Authentication & Role-Based Access Control (RBAC)
- **JWT-Based Authentication:** Stateless session management with JSON Web Tokens signed server-side and stored securely in client storage.
- **Bcrypt Password Security:** Automatic salt generation and password hashing before MongoDB persistence.
- **Dual User Persona (Renter & Owner Modes):** Seamless single-account persona switching between browsing rentals and managing hosted assets.
- **Dedicated Admin Portal:** Separate credential-authenticated admin ecosystem for site-wide content moderation and category governance.
- **Route Protections:** Frontend route guards (`ProtectedRoute`, `AdminRoute`) and Express middleware (`protectUser`, `protectAdmin`).

---

### 2. 🗂️ Category Governance Module
- **Category Schema:** MongoDB model storing category `name`, `description`, `icon`, `slug`, and active listing counters.
- **Admin Category Management:** Admin portal interface to add, inspect, edit, and safely delete categories.
- **Live Sync Counters:** Real-time aggregation counting total published rental items per category.
- **Catalog Navigation:** Dynamic category filter pills in Explore and Home pages.

---

### 3. 📦 Complete Listing Management
- **Rich Listing Schema:** Captures `title`, `description`, `category`, `rentalPricePerDay`, `location`, `images`, `deposit`, `amenities`, `rules`, and `availability`.
- **Multi-Step Creation Wizard (`/listings/new`):**
  - Step 1: Basic info (title, category, location).
  - Step 2: Pricing, refundable security deposit, and custom rental rules.
  - Step 3: Photos (multi-URL input and compressed local file previews).
  - Step 4: Live interactive card preview before publishing.
- **Owner Listing Management (`/my-listings`):**
  - Quick toggle to activate or deactivate listings without deleting.
  - Delete with confirmation dialog.
- **Edit Listing (`/listings/:id/edit`):** Pre-populated edit form with backend ownership verification (`listing.owner === req.user._id`).
- **Owner Exclusion:** Renters exploring the catalog automatically have their own listings filtered out from renter search results.

---

### 4. 🔍 Explore Catalog & Discovery Engine
- **Search & Filters:**
  - Full-text keyword search across titles, descriptions, and locations.
  - Category filtering with active pill indicators.
  - Price sorting (Low to High, High to Low).
- **Responsive Card Grid:**
  - CSS Grid with strict equalized card dimensions and baseline-aligned price footers.
  - High-res photo container with fixed uniform height.
  - Category pill in the top-left with truncation safeguards.
  - Dedicated top-right wishlist heart toggle.
  - Bottom-left status badge (`Available` / `Rented`) eliminating overlapping elements.
- **Zero-Shift Skeletons:** Animated pulse loading skeletons matching the exact dimensions of listing cards.

---

### 5. 🖼️ Listing Detail View & E-Commerce Lightbox Gallery
- **Detail View (`/listings/:id`):** Fetches listing details with populated owner profile, category icon, specs, and safety guidelines.
- **Stable 3-Image Mosaic:** Static slot layout displaying the cover photo and stacked side thumbnails without layout shifts or image duplication.
- **Full-Screen Lightbox Viewer:**
  - Uncropped e-commerce style full-screen modal.
  - Photo counter (e.g., `1 / 3`), item title, and close button.
  - Previous / Next navigation buttons and bottom thumbnail carousel.
  - Keyboard shortcuts: `ArrowLeft`, `ArrowRight` to cycle images, and `Escape` to close.
  - Background body scroll locking when active.

---

### 6. 📅 Rental Booking System (The Marketplace Engine)
Transforming RentHub from a simple listing board into a true peer-to-peer rental platform:
- **MongoDB Booking Model:**
  - Relational references: `renter`, `listing`, `owner`.
  - Date intervals: `startDate`, `endDate`, and calculated `days`.
  - Server-calculated financials: `dailyRate`, `basePrice`, `deposit`, 5% `serviceFee`, and `totalPrice`. Client prices are never trusted.
  - Strict lifecycle statuses: `pending`, `confirmed`, `rejected`, `cancelled`, `completed`.
- **Mathematical Overlap Prevention:**
  $$\text{existing.startDate} < \text{requested.endDate} \quad \text{AND} \quad \text{existing.endDate} > \text{requested.startDate}$$
  - Conflicting dates for `pending` and `confirmed` bookings are rejected with **409 Conflict**.
  - Cancelled and rejected bookings immediately release those dates.
- **Self-Booking Guard:** Owners are blocked from booking their own items with **400 Bad Request**.
- **Live Calendar Availability (`GET /api/bookings/listing/:id/booked-dates`):**
  - Displays upcoming reserved date tags on the detail page.
  - Proactively warns renters and disables the "Reserve" button if selected dates overlap with an active reservation.
- **Renter "My Rentals" Portal (`/bookings`):**
  - Tab filters: *All*, *Pending*, *Confirmed*, *Completed*, *Cancelled*.
  - Full rental receipts with breakdown of base rent, security deposit, and escrow fees.
  - One-click cancellation with reason recording.
- **Host "Owner Dashboard" (`/dashboard`):**
  - Live revenue analytics tallying total confirmed payouts.
  - Pending booking inquiries metric with active alert badges.
  - Accept & Confirm or Decline with optional reason modal.
  - Mark Completed action to conclude rentals.
  - Real-time updates: Automatic 15-second background polling, auto-refresh on window focus, and manual "Refresh Requests" button.

---

### 7. 🗓️ Interactive Availability Calendar & Schedule Engine
- **Airbnb-Style Visual Date Picker (`AvailabilityCalendarPicker.jsx`):**
  - Interactive month matrix with quick chevron navigation (`<` and `>`).
  - Color-coded day states: available (emerald), booked reservations (rose with strikethrough), owner blackout/maintenance (purple), and past days (disabled).
  - Two-click range selection (`Check-in` &rarr; `Check-out`) with live hover highlight ribbon.
  - Active conflict interception: prevents selecting date ranges spanning across already reserved days.
  - Fully responsive with desktop embedded section and mobile bottom-sheet modal.
- **Host Listing Schedule & Management (`OwnerListingCalendarModal.jsx`):**
  - Accessible via "Calendar" button on each item in `/my-listings` and "View Schedule" on `/dashboard`.
  - Color-coded reservation timeline (🟡 Pending, 🟢 Confirmed, ⚪ Completed, 🟣 Blackout).
  - One-click booking detail inspection with renter profile, contact info, notes, and direct Accept/Decline/Complete actions.
  - Custom owner blackout date management (`POST /api/bookings/listing/:id/blocked-dates`) for item maintenance or personal use.

---

### 8. ☁️ Cloudinary Multi-Image Upload & CDN Management
- **Cloudinary CDN Integration:** Direct stream uploads from in-memory Multer buffers directly to Cloudinary cloud infrastructure (`renthub/listings`).
- **Drag-and-Drop Uploader (`ImageUploader.jsx`):**
  - Interactive multi-file dropzone with drag-over visual cues.
  - Automatic image optimization, WebP compression, and max-width scaling (1600px).
  - Slot #1 designated as primary Cover Photo with prominent badge.
  - Reorder controls (Move Left `<` / Move Right `>`) and one-click "Set as Cover".
  - Async deletion from Cloudinary CDN when photos are removed.
  - Fallback option to paste direct web URLs.
- **Integrated Wizards:** Available on both the listing creation wizard (`/listings/new`) and edit portal (`/listings/:id/edit`).

### 9. 💳 Payment Gateway, Escrow Custody & Security Deposits (Test Mode)
- **Decoupled Financial Ledger:** Decouples financial status (`unpaid`, `escrow_held`, `refunded`, `payout_released`) from booking reservation lifecycle (`pending`, `confirmed`, `rejected`, `cancelled`, `completed`).
- **Escrow Accounting & Protection:**
  - Formula: $\text{Total Paid} = \text{Base Rental Charge} + \text{Refundable Security Deposit} + 5\% \text{ Platform Service Fee}$.
  - Server-side price authority: prevents client-side price manipulation by calculating fees directly from listing daily rates and rental dates.
  - Transparent Escrow Custody: funds remain locked in platform escrow during the active rental term to safeguard both parties.
- **Automated Lifecycle Custody Transfers:**
  - **Cancellation / Rejection:** 100% full refund automatically issued back to renter (`refunded_to_renter`).
  - **Rental Completion:** Base rental earnings automatically disbursed to host (`released_to_host`), and refundable security deposit returned to renter (`depositStatus: refunded`).
- **Interactive Checkout (`RentHubCheckoutModal.jsx`):**
  - Instant sandbox checkout supporting Card (pre-filled test card), UPI (`success@okaxis`), and NetBanking.
  - Live itemized fee breakdown, trust badges, and simulated 1.2s gateway authorization.
- **Itemized Digital Receipts (`PaymentReceiptModal.jsx`):**
  - Renter and host view of transaction reference IDs, date stamps, escrow custody indicators, and deposit return proofs.

### 10. 🔔 Real-Time In-App Notification Center
- **Event-Driven Lifecycle Triggers:**
  - **Booking Requests:** Hosts receive immediate alerts when renters place a booking on their inventory (`/owner/dashboard`).
  - **Status Transitions:** Renters are notified instantly upon booking approval, rejection, or completion (`/bookings`).
  - **Escrow & Financial Ledger:** Real-time alerts when renter funds are locked in escrow, refunds are processed, or host payouts are released.
  - **Cancellations:** Automatic notices to the counterpart whenever a cancellation or rescheduling occurs.
- **Interactive Navbar Bell Dropdown (`NotificationDropdown.jsx`):**
  - Live unread notification counter badge (e.g. `2 new`) with animated pulse.
  - Auto-polling background synchronization (20s interval + window focus sync).
  - Quick actions: mark individual items as read, mark all read, delete single notification.
  - One-click navigation directly to relevant booking or host console.
- **Dedicated Notification Center (`NotificationsPage.jsx`):**
  - Filter tabs ("All", "Unread", "Bookings", "Payments").
  - Relative time indicators ("just now", "10m ago", "2h ago"), visual category icons, and "Clear all" control.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Lucide Icons, Axios |
| **Backend** | Node.js, Express.js, Mongoose (MongoDB ODM), JWT, Bcrypt.js, CORS, Dotenv |
| **Database** | MongoDB Atlas (Multi-node replica set cluster) |
| **Architecture** | RESTful API, Controller-Service-Model Pattern, Component-Driven UI |

---

## 📁 Project Structure

```
rentHub/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── adminController.js       # Admin authentication & stats
│   │   │   ├── authController.js        # User signup, login & profile
│   │   │   ├── bookingController.js     # Booking creation, overlap check & status lifecycle
│   │   │   ├── categoryController.js    # Category CRUD & listing counts
│   │   │   ├── listingController.js     # Listing CRUD, ownership & search filters
│   │   │   ├── notificationController.js# Real-time alert notifications & unread counts
│   │   │   └── paymentController.js     # Checkout session, escrow authorization & payout releases
│   │   ├── middleware/
│   │   │   ├── adminAuthMiddleware.js   # Admin JWT protection
│   │   │   └── userAuthMiddleware.js    # User JWT verification
│   │   ├── models/
│   │   │   ├── AdminModel.js            # Admin credentials schema
│   │   │   ├── BookingModel.js          # Rental booking & price schema
│   │   │   ├── CategoryModel.js         # Category taxonomy schema
│   │   │   ├── ListingModel.js          # Rental listing schema
│   │   │   ├── NotificationModel.js     # Notification alerts & read status schema
│   │   │   ├── PaymentModel.js          # Financial transaction & escrow ledger schema
│   │   │   └── UserModel.js             # User accounts schema
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   ├── listingRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   └── paymentRoutes.js
│   │   ├── app.js                       # Express app configuration & middleware
│   │   └── server.js                    # Database connection & server bootstrap
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                      # Button, Card, Modal, StatusBadge, Rating, PriceDisplay, etc.
│   │   │   ├── Container.jsx            # Responsive layout wrapper
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx               # Navigation bar with role badges & links
│   │   │   ├── NotificationDropdown.jsx # Real-time alerts popover with live unread counter
│   │   │   ├── PaymentReceiptModal.jsx  # Itemized digital receipt & refund breakdown modal
│   │   │   ├── ProtectedRoute.jsx       # Route guard for authenticated users
│   │   │   └── RentHubCheckoutModal.jsx # Simulated Card, UPI & NetBanking escrow checkout
│   │   ├── pages/
│   │   │   ├── admin/                   # Admin login & dashboard
│   │   │   ├── user/
│   │   │   │   ├── owner/               # CreateListing, EditListing, MyListings, OwnerDashboard
│   │   │   │   ├── ExplorePage.jsx      # Catalog search, category filters & price sorting
│   │   │   │   ├── HomePage.jsx         # Landing page with hero, categories & popular rentals
│   │   │   │   ├── ListingDetailPage.jsx# Single listing view, e-commerce gallery & booking modal
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── MyBookingsPage.jsx   # Renter portal for active & past reservations
│   │   │   │   └── RegisterPage.jsx
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx            # Application routing table
│   │   └── utils/
│   │       ├── api.js                   # Axios client with bearer token interceptor
│   │       └── auth.js                  # Auth helpers (getUser, setAuth, logout)
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── README.md
```

---

## 📡 Key REST API Endpoints

### 🔑 Authentication
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT |
| `GET` | `/api/auth/profile` | Protected | Fetch current user profile |

### 🗂️ Categories
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | List all categories with item counts |
| `POST` | `/api/categories` | Admin | Create a new category |
| `PUT` | `/api/categories/:id` | Admin | Update category details |
| `DELETE` | `/api/categories/:id` | Admin | Delete a category |

### 📦 Listings
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/listings` | Public | Explore listings with search, category & sort |
| `GET` | `/api/listings/:id` | Public | Fetch listing details by ID |
| `POST` | `/api/listings` | Protected | Create a new rental listing |
| `GET` | `/api/listings/my-listings` | Protected | Get listings created by logged-in owner |
| `PUT` | `/api/listings/:id` | Protected | Edit listing (Owner only) |
| `PATCH` | `/api/listings/:id/status` | Protected | Toggle active/inactive status (Owner only) |
| `DELETE` | `/api/listings/:id` | Protected | Delete listing (Owner only) |

### 📅 Rental Bookings
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Protected | Submit rental booking request (Overlap checked) |
| `GET` | `/api/bookings/my-rentals` | Protected | View renter's active & past reservations |
| `GET` | `/api/bookings/owner-requests` | Protected | View incoming booking requests (Host only) |
| `GET` | `/api/bookings/listing/:id/booked-dates` | Public | Get unavailable date ranges (bookings + blackouts) |
| `GET` | `/api/bookings/listing/:id/owner-calendar` | Protected | Get full booking history & blackouts for host calendar |
| `POST` | `/api/bookings/listing/:id/blocked-dates` | Protected | Add owner blackout dates (maintenance / personal) |
| `DELETE` | `/api/bookings/listing/:id/blocked-dates/:dateId` | Protected | Remove owner blackout dates |
| `GET` | `/api/bookings/:id` | Protected | Get single booking receipt details |
| `PATCH` | `/api/bookings/:id/status` | Protected | State transition: confirm, reject, complete, or cancel |

### ☁️ Media & Uploads
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/upload/images` | Protected | Upload up to 10 photos to Cloudinary CDN |
| `DELETE` | `/api/upload/image` | Protected | Delete image asset from Cloudinary |

### 💳 Payments & Escrow Ledger
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/checkout-session` | Protected | Compute server-calculated itemized bill for checkout |
| `POST` | `/api/payments/process` | Protected | Process payment authorization & lock funds in platform escrow |
| `GET` | `/api/payments/booking/:bookingId` | Protected | Fetch transaction ledger, escrow status & receipt for booking |
| `POST` | `/api/payments/booking/:bookingId/refund` | Protected | Trigger escrow refund on cancellation or host rejection |
| `POST` | `/api/payments/booking/:bookingId/release-payout` | Protected | Release host payout and return deposit upon rental completion |

### 🔔 Notifications
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Protected | Fetch paginated notification history for authenticated user |
| `GET` | `/api/notifications/unread-count` | Protected | Lightweight unread badge counter for navbar bell |
| `PATCH` | `/api/notifications/:id/read` | Protected | Mark a single notification as read |
| `PATCH` | `/api/notifications/mark-all-read` | Protected | Mark all user notifications as read |
| `DELETE` | `/api/notifications/:id` | Protected | Delete a specific notification |
| `DELETE` | `/api/notifications/clear-all` | Protected | Clear entire notification inbox for user |

---

## ⚙️ Local Setup & Installation

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**
- **MongoDB Atlas** database cluster (or local MongoDB)
- **Cloudinary Account** (for media hosting)

### 2. Backend Setup
1. Open terminal and navigate to `backend`:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
3. Start the backend development server:
   ```bash
   npm run dev
   # Runs on http://localhost:5000
   ```

### 3. Frontend Setup
1. In a new terminal, navigate to `frontend`:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   # Runs on http://localhost:5173
   ```

---

## 🔮 Upcoming Roadmap

- [x] **Cloudinary Multi-Photo Uploads:** Direct cloud image uploads from mobile and desktop with automated optimization.
- [x] **Payments and Deposits (Test Mode):** Track rental payments, refundable security deposit escrow custody, automated refunds upon cancellation/rejection, and host payout release upon rental completion.
- [x] **Notifications:** In-app notification center with real-time navbar counter, categorized alerts for approvals, rejections, cancellations, and escrow receipts.
- [ ] **Reviews & Ratings Engine:** Verified renter reviews and aggregate star ratings per completed booking.
- [ ] **Location and Discovery:** Location-based filtering, distance/area search, and map integration.
- [ ] **Production Readiness:** Rate limiting, security headers, validation audits, and deployment configuration.

---

## 📄 License
This project is developed for academic and educational purposes under the MIT License.