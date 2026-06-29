# Velora Product Requirements Document

Version: 1.1<br>
Status: Draft<br>
Date: 2026-06-29

## 1. Executive Summary

Velora is an AI-powered fashion discovery, outfit creation, and future virtual try-on platform. The MVP focuses on centralized product discovery, outfit creation, wishlist management, saved outfits, and external retailer redirection.

The MVP will validate whether style-conscious online shoppers want one place to discover products across multiple fashion brands, combine products into outfits, save purchase ideas, and continue to retailer websites with more confidence.

The MVP will not include AI virtual try-on, AI stylist recommendations, checkout, payments, social features, AR experiences, or advanced recommendation systems.

After MVP validation, Velora's next product direction is a Digital Wardrobe that lets users
store products they already own and combine them with catalog products in outfits. Virtual
try-on remains a separate, later AI phase that depends on validated wardrobe behavior,
explicit user consent, and a suitable privacy and technical foundation.

## 2. Vision

Velora helps users discover fashion products across multiple brands, combine them into complete outfits, and make more confident purchasing decisions.

The platform simplifies fashion discovery by allowing users to explore, compare, save, and organize products from different retailers in one place before purchasing.

Velora's MVP focuses on outfit creation and fashion discovery, making online shopping more efficient, inspiring, and personalized.

## 3. Target Users

Velora's primary MVP users are style-conscious online shoppers aged 18-35 who frequently browse multiple fashion brands before making a purchase.

These users are typically Gen Z and Millennial consumers who use platforms like Instagram, TikTok, and Pinterest for fashion inspiration and often compare products across different retailers.

They want to create complete outfits, save ideas, and make more confident purchasing decisions without switching between multiple shopping websites.

The initial MVP will focus primarily on women's fashion shoppers, with expansion into men's fashion and broader audiences in later stages.

## 4. User Problems

1. Fashion products are scattered across multiple brand websites, making discovery time-consuming and fragmented.
2. Users struggle to visualize how products from different brands work together as a complete outfit.
3. Comparing products, styles, and prices across retailers requires switching between multiple websites and apps.
4. Users often lose track of products, outfit ideas, and inspiration while browsing online.
5. Fashion inspiration from social media platforms is disconnected from real, purchasable products, making it difficult to turn inspiration into buying decisions.

## 5. MVP Scope

The MVP goal is to validate whether users want a centralized fashion discovery and outfit-building platform before investing in AI-powered experiences.

### 5.1 Included In MVP

- Product discovery across multiple brands
- Product search and filtering
- Product detail pages
- Outfit creation
- Outfit saving and management
- Wishlist / favorites
- External product redirection to partner retailers
- User accounts and profiles

### 5.2 Excluded From MVP

- AI virtual try-on
- AI stylist recommendations
- Social features such as following, comments, and feeds
- User-generated content marketplace
- In-app checkout and payments
- AR experiences
- Advanced recommendation engine
- Men's fashion support initially
- Brand partnership dashboards
- Creator and influencer tools

## 6. User Flows

The MVP should focus on helping users move from product discovery to outfit creation and ultimately to retailer purchase decisions with as few steps as possible.

### 6.1 MVP User Flows

1. Browse/search products -> open product detail -> redirect to retailer.
2. Browse/search products -> save products to wishlist -> view and manage wishlist.
3. Select products from multiple brands -> create outfit -> save outfit.
4. View saved outfits -> edit outfit -> delete outfit.
5. Sign up/log in -> manage profile, wishlist, and saved outfits.

### 6.2 Post-MVP User Flows

1. Discover curated outfit inspiration -> open outfit -> view included products -> save outfit or purchase products.
2. Add an owned product to Digital Wardrobe -> review or edit item details -> save item.
3. Browse Digital Wardrobe -> open an owned product -> add it to a new or existing outfit.
4. Build an outfit using catalog products and wardrobe products -> save -> edit or reuse the outfit.
5. In a later AI phase, provide required try-on inputs and consent -> select a supported outfit or product -> request virtual try-on -> review or delete the result.

### 6.3 User Flow Rationale

The MVP should focus exclusively on validating the core behavior: discovering products, creating outfits, saving them, and visiting retailer websites.

Curated inspiration can be introduced later as an engagement and growth feature once the core workflow is validated.

## 7. Core Features

### 7.1 Core MVP Features

- User accounts and authentication
- User profile
- Product catalog
- Product search
- Product filtering by brand, category, price, source platform, and color
- Product detail page
- Wishlist / favorites
- Outfit builder
- Saved outfits
- Edit/delete outfits
- External retailer redirect

### 7.2 Post-MVP Features

- Digital Wardrobe
- User-owned wardrobe products
- Outfit builder support for catalog products and wardrobe products
- Optional profile foundation for future try-on, without collecting unnecessary body data
- Curated outfit inspiration
- AI virtual try-on in a later phase

### 7.3 Feature Scope Rationale

Curated outfit inspiration is valuable, but it requires additional content management and operational effort. For the initial MVP, the primary goal is to validate whether users want to discover products across brands, build outfits, save them, and continue to retailer websites.

If users actively create and save outfits, curated inspiration can be introduced later as a growth and engagement feature.

## 8. Business Model

The MVP will focus primarily on user validation and engagement rather than immediate monetization.

### 8.1 Primary Near-Term Business Model

- Affiliate commissions from retailer referrals and purchases
- Revenue generated when users click through to partner retailers and complete purchases

### 8.2 Future Business Models

- Sponsored product placements
- Featured brand campaigns
- Brand partnership programs
- Premium subscription features
- AI-powered styling subscriptions
- Advanced wardrobe management tools

### 8.3 MVP Monetization Strategy

The MVP does not require active monetization from day one. Success will be measured by user engagement, outfit creation, wishlist activity, and retailer referral behavior.

Once product-market fit is validated, affiliate partnerships will become the first revenue stream, followed by premium features and brand-focused monetization opportunities.

## 9. Success Metrics

These targets are intended for MVP validation and can be adjusted as real usage data becomes available.

### 9.1 Acquisition

- 1,000 registered users within the first 3 months

### 9.2 Engagement

- Average of 5+ product detail views per active user
- Average of 3+ wishlist saves per active user
- Average of 1+ outfit created per active user
- Average of 2+ products added to an outfit

### 9.3 Retention

- 25%+ returning user rate within 30 days
- 15%+ weekly active user retention

### 9.4 Conversion

- 20%+ retailer redirect click-through rate
- 10%+ of users create at least one outfit
- 30%+ of outfit creators save at least one outfit

### 9.5 Product Validation Signals

- Users consistently create outfits using products from multiple brands
- Users return to edit, save, or reuse outfits
- Retailer redirects demonstrate purchase intent

## 10. Product Data Strategy

Velora will use a hybrid product data approach for the MVP.

### 10.1 MVP Development Stage

- Use seeded product data stored in the backend database
- Product data should mimic real-world fashion products
- Include realistic brands, categories, pricing, images, and retailer URLs

### 10.2 MVP Pre-Launch Validation Stage

- Replace a portion of the seeded catalog with real product data from a small number of partner retailers or approved data sources
- Start with a limited catalog rather than attempting broad marketplace coverage

### 10.3 Product Data Rationale

The development phase should prioritize speed and product validation. However, before user testing and public launch, the experience should include real purchasable products so that outfit creation and retailer redirect behavior can be measured accurately.

The goal is to avoid complex integrations early while still validating real shopping behavior before scaling.

## 11. Authentication Requirements

### 11.1 MVP Authentication Requirements

- Sign up with email and password
- Log in with email and password
- Log out
- Password reset
- View and edit basic profile information
- Wishlist and saved outfits tied to the user account

### 11.2 Post-MVP Authentication Features

- Social login such as Google, Apple, etc.
- Profile photo
- Style preferences onboarding
- Personalized fashion preferences
- Preference-based recommendations

### 11.3 Authentication Rationale

Password reset is a standard user expectation and reduces account recovery friction. It is a relatively small implementation effort compared to the trust and usability benefits it provides.

Style preferences onboarding should remain Post-MVP because Velora's initial goal is to validate product discovery and outfit-building behavior before introducing personalization features.

## 12. Product Catalog Requirements

### 12.1 MVP Product Categories

- Tops
- Bottoms
- Dresses
- Outerwear
- Shoes
- Bags
- Accessories

### 12.2 MVP Filters

- Brand
- Category
- Price range
- Source platform
- Color

### 12.3 Post-MVP Filters

- Size availability
- Fit type
- Material
- Sustainability attributes

### 12.4 Catalog Rationale

Color is one of the most important factors when building outfits and can be reliably represented even with seeded product data.

Size data is often inconsistent across brands, regions, and retailers. Introducing size filtering too early may create poor user experiences and increase data management complexity.

The MVP should focus on helping users discover products and create outfits, while keeping catalog management simple and reliable.

## 13. Outfit Builder Requirements

### 13.1 MVP Outfit Builder Behavior

- Users can add products from the catalog or wishlist to an outfit
- Outfit name is required
- Outfits can contain multiple products
- Products can come from different brands and retailers
- Users can save, edit, and delete outfits
- Users can add or remove products at any time

### 13.2 Outfit Builder Guidance

- Display product categories included in the outfit
- Optionally show missing categories, such as no shoes or no bag
- Provide soft suggestions only

### 13.3 Not Enforced In MVP

- No required categories
- No maximum number of products per category
- No restrictions on the number of shoes, bags, or accessories
- No outfit scoring system
- No style validation rules

### 13.4 Outfit Builder Rationale

The MVP goal is to understand how users naturally build outfits and which product combinations they create. Enforcing fashion rules too early could restrict user behavior and reduce learning opportunities.

Future versions may introduce AI-powered outfit recommendations, outfit scoring, category guidance, and styling suggestions based on real user behavior data.

## 14. Wishlist Requirements

### 14.1 MVP Wishlist Behavior

- Users can favorite and unfavorite products from catalog pages and product detail pages
- Wishlist displays all saved products
- Users can remove products from their wishlist
- Users can add wishlist products directly to an outfit
- Wishlist is tied to the user account
- Basic sorting is allowed, such as newest saved and oldest saved

### 14.2 Not Included In MVP

- Multiple wishlist collections
- Named collections
- Shared wishlists
- Collaborative wishlists
- Public wishlists

### 14.3 Wishlist Rationale

The MVP should focus on validating whether users save products, return to them later, and use them to create outfits.

Multiple collections introduce additional complexity without helping validate the core product behavior.

If users actively save products and engage with their wishlist, future versions can introduce collections, sharing, and collaborative features. The wishlist data model should support future collection-based organization without requiring major schema changes.

## 15. Product Detail Requirements

### 15.1 Required Product Detail Information

- Product image
- Product title
- Brand
- Category
- Price
- Color
- Source platform / retailer
- External retailer button
- Favorite / unfavorite button
- Add to outfit action

### 15.2 Optional Product Detail Information

- Product description
- Available colors, if data exists
- Product tags, if data exists

### 15.3 Product Detail Rationale

Product descriptions can provide useful context and improve product discovery, but they should not be required because data quality may vary across sources.

The product detail page should remain focused on helping users evaluate products, save them, add them to outfits, and continue to retailer websites.

The MVP should gracefully support products with or without descriptions.

## 16. External Retailer Redirect Requirements

### 16.1 MVP Redirect Behavior

- Every product must have a `productUrl`
- Users can tap a clear call-to-action such as "View at Retailer"
- The application opens the retailer website in the user's browser
- Velora records a redirect event before opening the retailer URL

### 16.2 Redirect Event Data

- `userId`, if authenticated
- `productId`
- `outfitId`, if redirect originated from an outfit
- `timestamp`
- `sourceScreen`, such as catalog, product detail, wishlist, or outfit
- Retailer / platform

### 16.3 Not Included In MVP

- Checkout handling
- Payment processing
- Order tracking
- Conversion attribution beyond redirects

### 16.4 Redirect Rationale

Retailer redirects are one of the most important validation signals for Velora.

A redirect demonstrates purchase intent and helps measure whether product discovery, wishlist usage, and outfit creation lead users toward shopping decisions.

Redirect tracking is also essential for future affiliate partnerships, revenue measurement, and product analytics.

## 17. Analytics Requirements

Event tracking should be included as an MVP product requirement from the first version of the product.

### 17.1 Authentication Events

- User Registered
- User Logged In
- User Logged Out
- Password Reset Requested

### 17.2 Discovery Events

- Product Viewed
- Product Searched
- Product Filter Applied

### 17.3 Wishlist Events

- Product Favorited
- Product Unfavorited

### 17.4 Outfit Events

- Outfit Created
- Outfit Saved
- Outfit Edited
- Outfit Deleted
- Product Added To Outfit
- Product Removed From Outfit

### 17.5 Retail Events

- Retailer Redirect Clicked

### 17.6 Event Data Requirements

Each event should capture:

- `userId`, if authenticated
- `timestamp`
- Event type
- Related entity ID, such as `productId` or `outfitId`
- Source screen when applicable

### 17.7 Analytics Rationale

Analytics is not just a reporting feature. It is essential for understanding user behavior, validating product-market fit, prioritizing future development, and measuring the effectiveness of product discovery and outfit creation workflows.

Without event tracking, Velora would be unable to determine which features create value and which user actions lead to retailer engagement.

## 18. Platform Strategy

### 18.1 MVP Platforms

#### User-Facing

- iOS app
- Android app

#### Internal Tools

- Web-based admin panel
- Product management
- Product import and seed management
- Basic analytics dashboard
- Redirect analytics review

### 18.2 Not Included In MVP

- Public web application
- Customer-facing web experience
- Desktop application

### 18.3 Platform Rationale

The primary user experience should be mobile-first because outfit creation and fashion discovery naturally fit mobile behavior.

However, an internal web admin tool will significantly simplify product management, catalog updates, seed data maintenance, and analytics review without introducing the complexity of a full customer-facing web platform.

The MVP should validate user behavior on mobile while providing operational tools for the Velora team.

## 19. Admin Panel Requirements

The MVP admin panel should be limited to internal Velora administrators only.

### 19.1 Authentication

- Internal admin login only
- No public registration
- No partner or brand accounts

### 19.2 Product Management

- View product list
- Create products
- Edit products
- Delete products
- Search products
- Filter products
- Import products from structured files such as CSV or JSON

### 19.3 Analytics

- View user registration counts
- View product view counts
- View wishlist activity
- View outfit creation activity
- View retailer redirect counts
- View basic event analytics

### 19.4 Catalog Management

- Manage product categories
- Manage brands
- Manage source platforms

### 19.5 Not Included In MVP

- Brand dashboards
- Partner accounts
- Role-based permissions
- Multi-admin roles
- Affiliate management tools
- Revenue reporting
- Content management system

### 19.6 Admin Panel Rationale

The admin panel should exist only to support Velora operations during MVP validation.

Its primary purpose is to manage product data, monitor user behavior, and review analytics.

Partner access, brand tools, and advanced permissions should only be introduced after product-market fit has been validated.

## 20. Non-Functional Requirements

The MVP should provide a reliable and professional user experience while avoiding unnecessary complexity. These requirements establish a quality baseline that supports future growth and protects user trust.

### 20.1 User Experience

- Mobile-first experience for iOS and Android
- Consistent and intuitive navigation
- Responsive interactions and smooth scrolling
- Graceful handling of empty states, loading states, and errors

### 20.2 Performance

- Product catalog screens should load within 2 seconds under normal conditions
- Product search and filtering responses should complete within 1 second
- Product detail pages should load within 2 seconds
- Analytics tracking must not block user actions
- Product images should be optimized and lazy-loaded when appropriate

### 20.3 Reliability

- Core features such as authentication, wishlist, outfits, and product browsing should remain functional even if analytics tracking fails
- Error handling should prevent application crashes
- Basic monitoring and error logging should be available

### 20.4 Security

- Passwords must be securely hashed and never stored in plain text
- Authentication endpoints must be protected against common abuse patterns
- Input validation must be enforced on both frontend and backend
- User data must only be accessible by the authenticated owner
- Admin functionality must be restricted to authorized administrators

### 20.5 Technical Quality

- Type-safe frontend and backend development
- Structured API architecture
- Clean separation of business logic and presentation logic
- Backend architecture should support future scaling without premature optimization

## 21. Post-MVP Considerations

The following areas are intentionally outside the MVP scope but may become important after the core discovery and outfit-building behavior is validated:

- AI virtual try-on
- Digital Wardrobe
- User-owned products
- Mixed catalog and wardrobe outfits
- AI stylist recommendations
- Curated outfit inspiration
- Social features
- User-generated content marketplace
- In-app checkout and payments
- AR experiences
- Advanced recommendation engine
- Men's fashion support
- Brand partnership dashboards
- Creator and influencer tools
- Social login
- Profile photo
- Style preferences onboarding
- Personalized fashion preferences
- Preference-based recommendations
- Size availability filtering
- Fit type filtering
- Material filtering
- Sustainability attribute filtering
- Multiple wishlist collections
- Shared or collaborative wishlists
- Brand dashboards
- Partner accounts
- Role-based permissions
- Affiliate management tools
- Revenue reporting
- Content management system

## 22. Post-MVP Product Roadmap

The roadmap below does not change the MVP scope, MVP success metrics, or existing MVP user
flows. Phase 2 should begin only after Velora validates the current discovery, wishlist,
outfit, and retailer-redirect behavior.

### 22.1 Phase 2: Digital Wardrobe

#### Objective

Extend Velora from purchase planning into ongoing outfit organization by allowing users to
store products they already own and combine those products with catalog products.

#### Planned Scope

- A private Digital Wardrobe owned by the authenticated user
- Create, view, edit, archive, and remove user-owned wardrobe products
- At least one user-provided image per wardrobe product
- Basic wardrobe product information such as name, category, and color
- Optional descriptive information when known, without requiring retailer data
- Outfit builder support for both catalog products and wardrobe products
- Saved outfits that clearly identify the source of each included item
- Wardrobe-specific empty, loading, upload, and error states
- Wardrobe activity analytics defined separately from MVP analytics

#### Phase 2 Boundaries

- Wardrobe products are private by default.
- A wardrobe product does not require price, retailer, `productUrl`, or affiliate metadata.
- Adding a wardrobe product does not make it part of Velora's public product catalog.
- Catalog product redirects remain available only for catalog products.
- Phase 2 does not include AI generation, body-image processing, virtual try-on, public
  wardrobes, wardrobe sharing, resale, or marketplace behavior.

#### Core User Flows

1. Open Digital Wardrobe -> add item -> provide image and basic details -> save item.
2. Open wardrobe item -> edit details or replace image -> save changes.
3. Open wardrobe item -> archive or delete item -> confirm action.
4. Start outfit -> choose from catalog and wardrobe sources -> add items -> name and save outfit.
5. Open saved outfit -> distinguish catalog and owned items -> add or remove either item type.
6. Open a catalog product -> add to outfit containing wardrobe products.
7. Open a wardrobe product -> add to outfit containing catalog products.

#### User Profile Foundation

The base `User` account should remain focused on identity and authentication. Any future
try-on data should be stored in a separate, optional profile boundary rather than adding
sensitive fields directly to the core user record.

Phase 2 may prepare the relationship and consent model for a future try-on profile, but it
must not collect body images, measurements, or other sensitive attributes solely because
they may be useful later.

### 22.2 Phase 3: AI Virtual Try-On

#### Objective

Allow a consenting user to generate a visual preview of supported catalog or wardrobe items
on a user-provided representation after the Digital Wardrobe and mixed-outfit workflows have
been validated.

#### Entry Criteria

- Phase 2 demonstrates sustained wardrobe creation and mixed-outfit usage.
- Supported garment categories and input-image requirements are defined.
- A privacy impact assessment and consent flow are approved.
- Data retention and deletion behavior are operational.
- The selected model or provider meets acceptable quality, latency, cost, and safety targets.

#### Planned Scope

- An optional try-on profile separate from the base user account
- Explicit consent before body-image or measurement processing
- Private upload of required user media
- Selection of supported catalog or wardrobe products for try-on
- Asynchronous try-on request processing with visible progress and failure states
- Private result review, retry where appropriate, and deletion
- Clear indication that results are visual estimates, not fit or sizing guarantees

#### Phase 3 Boundaries

- Virtual try-on is not part of MVP or Phase 2.
- It does not guarantee garment fit, sizing, fabric behavior, or purchase outcome.
- It does not introduce AR, checkout, payment, social sharing, or public body-image content.
- Unsupported categories or insufficient source images should be rejected before processing.
- AI-generated results must not silently replace catalog or wardrobe source images.

#### Core User Flows

1. Open try-on -> review data use and limitations -> provide explicit consent.
2. Create or update try-on profile -> upload required private media -> validate input quality.
3. Select a supported catalog or wardrobe item -> request try-on -> monitor processing status.
4. Review result -> retry with corrected input when allowed -> save temporarily or delete.
5. Withdraw consent or delete try-on profile -> remove associated private inputs and results
   according to the retention policy.

## 23. Post-MVP Technical Risks

### 23.1 Digital Wardrobe Risks

- User images may be low quality, inconsistent, duplicated, or incorrectly categorized.
- Image upload, transformation, storage, and deletion add operational cost and failure modes.
- Mixed catalog and wardrobe outfit items require a stable discriminated API shape while
  preserving existing MVP outfit behavior.
- Catalog products can become inactive while saved outfits still reference them; wardrobe
  products can be archived or deleted while outfits reference them.
- Category and color normalization may be unreliable for user-entered data.
- Large private image libraries may create storage, bandwidth, and backup cost.

### 23.2 Virtual Try-On Risks

- Model quality may vary by body type, skin tone, pose, garment category, and image quality.
- Multi-item outfits, layered garments, accessories, and loose or reflective materials may
  not be supported reliably.
- Processing latency and compute cost may make synchronous requests impractical.
- Third-party AI providers can introduce data residency, retention, availability, and
  vendor-lock-in concerns.
- Generated results may create misleading expectations about fit, sizing, or appearance.
- AI input and output moderation, abuse handling, and support workflows require definition.

## 24. Post-MVP Privacy Considerations

### 24.1 Digital Wardrobe

- Wardrobe records and images must be private to the owning user by default.
- Object storage must not expose permanent public URLs for user-owned images.
- Uploads must use authenticated, time-limited access and validated file types and sizes.
- Image metadata that is not needed, including location metadata, should be removed.
- Users must be able to delete wardrobe items and associated media.
- Product analytics should use stable entity IDs and must not copy private image content into
  event metadata or logs.

### 24.2 Virtual Try-On

- Body images, measurements, and generated try-on results must be treated as sensitive user
  data even when local law does not classify every field identically.
- Consent must be explicit, purpose-specific, versioned, and revocable.
- Velora should collect only inputs required by the selected try-on capability.
- Input media, generated outputs, signed URLs, and provider credentials must not appear in
  application logs or generic analytics metadata.
- Retention periods must be defined separately for source media, generated results, failed
  jobs, and provider-side copies.
- Account deletion, consent withdrawal, and try-on profile deletion must trigger documented
  deletion workflows across Velora storage and any processors.
- Third-party processors require documented data handling, deletion, security, and data
  residency review before production use.
- AI results must remain private unless a separate sharing feature is explicitly approved.

## 25. Open Questions And Future Refinement Areas

The following areas require refinement during product design, technical planning, or user
testing:

1. Which specific retailers or approved data sources should be used during pre-launch validation?
2. What minimum admin analytics dashboard is required for the first internal release?
3. What exact profile fields should be editable in the MVP?
4. What event analytics storage and reporting approach should be used while keeping implementation simple?
5. What product image hosting and optimization approach should be used for seeded and real product data?
6. What launch geography and currency assumptions should be used for initial product pricing?
7. What password reset delivery mechanism should be used for MVP account recovery?
8. Which Digital Wardrobe fields are required versus optional after user research?
9. Should deleting a wardrobe item remove it from outfits or retain a minimal historical snapshot?
10. Which garment categories and input-image standards can meet the Phase 3 quality threshold?
11. Should Virtual Try-On begin with an approved provider or a separately operated AI service?
12. What retention periods and launch geographies apply to try-on inputs and generated results?
