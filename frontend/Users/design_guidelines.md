# FoodFast Delivery - Design Guidelines

## Design Approach

**Reference-Based Approach** - Drawing inspiration from leading food delivery platforms (Uber Eats, DoorDash, Deliveroo) with emphasis on appetite appeal and seamless user experience.

**Core Design Principles:**
- Food-first visual hierarchy - imagery drives engagement
- Effortless navigation with minimal friction
- Trust indicators throughout the experience
- Clean, modern aesthetic that doesn't compete with food photography

## Color Palette

**Light Mode:**
- Primary: 142 75% 45% (Fresh green, appetite-friendly)
- Background: 0 0% 100% (Pure white)
- Surface: 0 0% 98% (Off-white cards)
- Text Primary: 220 15% 15% (Near black)
- Text Secondary: 220 10% 45% (Medium gray)
- Border: 220 15% 90% (Light gray)
- Success: 142 70% 45% (Order confirmation)
- Warning: 38 92% 50% (Alerts)

**Dark Mode:**
- Primary: 142 70% 55% (Brighter green for contrast)
- Background: 220 20% 8% (Deep charcoal)
- Surface: 220 15% 12% (Elevated charcoal)
- Text Primary: 0 0% 98% (Near white)
- Text Secondary: 220 10% 70% (Light gray)
- Border: 220 15% 20% (Dark gray)
- Success: 142 70% 50%
- Warning: 38 92% 60%

## Typography

**Font Families:**
- Primary: 'Inter' (UI elements, body text)
- Display: 'Poppins' (headings, restaurant names)

**Scale:**
- Hero: 3.5rem/4rem (56px/64px) font-bold
- H1: 2.5rem (40px) font-bold
- H2: 2rem (32px) font-semibold
- H3: 1.5rem (24px) font-semibold
- Body Large: 1.125rem (18px) font-normal
- Body: 1rem (16px) font-normal
- Small: 0.875rem (14px) font-normal
- Tiny: 0.75rem (12px) font-medium

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Consistent padding: p-4 (cards), p-6 (sections), p-8 (containers)
- Vertical rhythm: gap-4 (tight), gap-6 (standard), gap-8 (loose)
- Section spacing: py-12 mobile, py-20 desktop

**Grid Strategy:**
- Restaurant cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Menu items: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
- Admin tables: Responsive single column with horizontal scroll on mobile

## Component Library

### Customer Interface

**Hero Section:**
- Full-width banner with food photography background
- Centered search bar with location input + cuisine filter
- Overlay gradient (from transparent to bg-black/50)
- CTA: "Find restaurants near you"

**Restaurant Cards:**
- Landscape image (16:9 ratio)
- Restaurant name (H3), cuisine tags, rating stars
- Delivery time + fee badge
- Hover: subtle lift (translate-y-1) + shadow-lg

**Menu Item Cards:**
- Square/portrait food image (1:1 or 4:5)
- Item name, description (2 lines max)
- Price prominent (text-xl font-bold)
- Add to cart button (primary green)

**Shopping Cart:**
- Sticky sidebar on desktop, slide-up sheet on mobile
- Item list with thumbnail, name, quantity controls
- Running subtotal, delivery fee, total
- Prominent checkout button

**Order Status:**
- Stepper/timeline component showing: Order Placed → Preparing → Delivering by Drone → Delivered
- Active step highlighted in primary color
- Real-time status updates

### Admin Dashboard

**Navigation:**
- Collapsible sidebar with icons + labels
- Sections: Dashboard, Restaurants, Menu Items, Orders, Users
- Dark sidebar with primary accent for active items

**Data Tables:**
- Striped rows for readability
- Action buttons (Edit/Delete) on row hover
- Search + filter controls above table
- Pagination at bottom

**Forms:**
- Two-column layout on desktop (label left, input right)
- Single column on mobile
- File upload with preview for images
- Clear validation states

**Order Management:**
- Card-based order list with key details
- Expandable rows for full order details
- Status dropdown with color-coded options
- Order timeline on detail view

## Images Strategy

**Hero Images:**
- Homepage: Large hero (h-96 lg:h-screen max-h-[600px]) featuring vibrant food delivery scene or appetizing cuisine spread
- Restaurant detail: Medium hero (h-64 lg:h-80) with restaurant's signature dish or interior

**Content Images:**
- Restaurant cards: High-quality food photography (required)
- Menu items: Professional food shots on clean backgrounds
- User avatars: Circular, 40px-64px diameter
- Admin: Icons for empty states, no hero needed

**Image Placement:**
- Homepage hero: Full-width, gradient overlay for text readability
- Restaurant grid: Consistent aspect ratios (16:9)
- Menu items: Square format for uniform grid
- Order confirmation: Small delivery icon/illustration

**Treatment:**
- Rounded corners: rounded-lg (cards), rounded-xl (heroes)
- Lazy loading for performance
- Optimized WebP format with JPG fallbacks
- Alt text for accessibility

## Animations

**Minimal, Purposeful Motion:**
- Card hover: transition-transform duration-200
- Button press: scale-95 active state
- Cart updates: Slide-in animation (slide-in-right)
- Page transitions: Fade only (opacity)
- Status changes: Smooth color transitions

**Avoid:** Complex scroll animations, parallax effects, excessive micro-interactions

## Accessibility

- Minimum 4.5:1 contrast ratios
- Focus indicators on all interactive elements (ring-2 ring-primary)
- ARIA labels for icon-only buttons
- Keyboard navigation throughout
- Form inputs with consistent dark mode styling (bg-surface, border-border)

This design creates an appetizing, trustworthy food delivery experience that scales from customer-facing simplicity to admin power-user efficiency.