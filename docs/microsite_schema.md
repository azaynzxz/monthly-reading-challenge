/hello Microsite — Updated Architecture & Dynamic Catalogue BlueprintThis blueprint outlines the project structure, Google Apps Script integration, visual layouts, data schema, icon sources (lucide-react for UI and Simple Icons CDN API for social brand logos), modal behaviors, and strict adherence to your centralized Design System & Branding Guidelines.1. Project Directory FiletreeThe tree incorporates API services for Google Apps Script, dynamic shop catalogue routes, modal components, lucide-react UI icons, external social logo API fetching, and centralized design system token mappings.hello-microsite/
├── public/
│   ├── favicon.ico
│   └── images/
│       ├── avatar.jpg
│       └── placeholder-item.jpg   # Placeholder image for loading state
│
├── src/
│   ├── api/                       # Service hooks / API fetchers
│   │   ├── fetchCatalogue.js      # Google Apps Script Web App fetcher
│   │   └── fetchSocialIcon.js     # Helper for CDN social SVG URLs (cdn.simpleicons.org)
│   │
│   ├── data/
│   │   ├── profile.json           # User bio, avatar path, social links & handles
│   │   └── primary-links.json     # WhatsApp community & main CTAs configuration
│   │
│   ├── components/
│   │   ├── ProfileHeader.jsx      # Avatar, Name, Handle, Bio
│   │   ├── SocialIconBar.jsx      # Compact row of social icons (fetched via API)
│   │   ├── LinkCard.jsx           # Standard interactive link button (Lucide icons)
│   │   ├── CatalogueGrid.jsx      # Shared grid component (Shop & Free Resources)
│   │   ├── ProductCard.jsx        # Individual card displaying image, price & link
│   │   ├── ComingSoonModal.jsx    # Pop-up modal triggered by "Coming Soon" elements
│   │   └── Footer.jsx             # Copyright, website link, legal disclaimers
│   │
│   ├── pages/ (or app/)
│   │   └── hello/
│   │       ├── index.jsx          # Main microsite (/hello)
│   │       ├── shop/
│   │       │   └── index.jsx      # Dynamic Catalogue Page (/hello/shop)
│   │       └── freebies/          # Prepared Catalogue Layout (/hello/freebies)
│   │           └── index.jsx      # Uses CatalogueGrid + Coming Soon Modal
│   │
│   └── styles/
│       ├── globals.css            # Base Tailwind imports & CSS custom properties
│       ├── design-tokens.css      # Shared Design System variables (Colors, Typography)
│       └── microsite.css
│
├── .gitignore
├── package.json
└── tailwind.config.js             # Tailwind extended with Design System tokens
2. Design System & Branding Guidelines IntegrationAll UI elements, layout components, and interaction states must strictly adhere to the central Design System & Branding Documentation (specified in your project's main design system MD file).Key Integration Rules:Color Palette & Tokens: Use primary, secondary, accent, surface, and border CSS variables/Tailwind utility classes defined in the design system (e.g., brand primary button colors, background surfaces, dark/light mode standards).Typography: Maintain font family stacks, font weights, scale sizes, and line-heights mandated by the brand style guide.Component Styling: Card borders, rounded corners (border-radius), shadow elevations, and hover/active transitions must match existing brand components.Brand Assets & Voice: Use official logos, brand iconography rules, and brand voice guidelines for all text strings.3. Icon Strategy & Free External Social APIA. UI Icons (lucide-react)All interface icons follow the design system's stroke width and sizing tokens while using the lucide-react icon library:Shop / Catalogue: <ShoppingBag />Freebies / Resources: <Gift />Community / Messaging: <MessageCircle />Modal Close: <X />Back Navigation: <ArrowLeft />External Links: <ExternalLink />Coming Soon Badge: <Sparkles /> or <Clock />B. Social Brand Logos (Simple Icons CDN API)Instead of storing manual static SVG assets locally, social brand logos are dynamically fetched via the free, open-source Simple Icons CDN, styled according to design system hex/color rules:Base Endpoint: https://cdn.simpleicons.org/{slug}/{color}Instagram: https://cdn.simpleicons.org/instagram/ffffffTikTok: https://cdn.simpleicons.org/tiktok/ffffffYouTube: https://cdn.simpleicons.org/youtube/ffffffFacebook: https://cdn.simpleicons.org/facebook/ffffffWhatsApp: https://cdn.simpleicons.org/whatsapp/ffffff4. Visual Layout ArchitectureA. Main Page (/hello)+-------------------------------------------------------+
|                     [ AVATAR ]                        |
|                  @yourhandle                          |
|             "Creator | Digital Products"              |
|                                                       |
|   [IG API]  [TT API]  [YT API]  [FB API]  [WA API]    |  <-- Social API Row
+-------------------------------------------------------+
|  PRIORITY CTAs (Styled with Design System Tokens)    |
|  +-------------------------------------------------+  |
|  | [MessageCircle] Join WhatsApp Community         |  |
|  +-------------------------------------------------+  |
|  | [Gift] Free Resources (Triggers "Coming Soon")  |  |
|  +-------------------------------------------------+  |
|  | [ShoppingBag] Browse Shop Catalogue (/hello/shop)|  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
|                      [ FOOTER ]                       |
|           2026 Your Name • Main Website Link          |
+-------------------------------------------------------+
5. Shop & Free Resources Catalogue Sub-Page (/hello/shop & /hello/freebies)Both sections share the exact same UI grid layout component (CatalogueGrid.jsx), styled with brand grid spacing and card definitions.+-------------------------------------------------------+
|  <- Back to /hello                                    |
|  [ShoppingBag] Product Catalogue / Freebies           |
+-------------------------------------------------------+
|  +-----------------------+   +-----------------------+  |
|  | [ Image Preview ]     |   | [ Image Preview ]     |  |
|  | Product Title         |   | Product Title         |  |
|  | ~~Rp 250.000~~ Rp 150.000|  | ~~Rp 100.000~~ Free  |  |
|  | [ Buy / View Button ] |   | [ Download Button ]   |  |
|  +-----------------------+   +-----------------------+  |
|  +-----------------------+   +-----------------------+  |
|  | [ Image Preview ]     |   | [ Image Preview ]     |  |
|  | Product Title         |   | Product Title         |  |
|  | Rp 190.000            |   | Coming Soon           |  |
|  | [ Buy / View Button ] |   | [ Triggers Modal ]    |  |
|  +-----------------------+   +-----------------------+  |
+-------------------------------------------------------+
6. Pop-up Modal ("Coming Soon") BehaviorWhen a user clicks on a "Coming Soon" free resource or unreleased item, a modal styled with design system overlays and dialog rules appears:+---------------------------------------------------+
|  [X] Close                                        |
|                                                   |
|   [Sparkles] Coming Soon!                         |
|   This resource is currently under construction.  |
|   Join our WhatsApp community to get notified     |
|   the moment it drops!                            |
|                                                   |
|   [ [MessageCircle] Join WhatsApp Group Now ]     |
+---------------------------------------------------+
7. Data Integration & Apps Script SchemaA. Google Spreadsheet SchemaYour Google Sheet powering the Google Apps Script Web App must have the following column headers:Column AColumn BColumn CColumn DColumn Eproduct_idlinkimagepricesale_pricePROD-001https://tokopedia.com/item1https://domain.com/img1.jpgRp 250.000Rp 150.000PROD-002https://shopee.co.id/item2https://domain.com/img2.jpgRp 190.000nullB. Google Apps Script Endpoint (doGet)Deploy your Apps Script as a Web App (Anyone can access) returning JSON data format:function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const result = [];
  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    let item = {};
    headers.forEach((header, index) => {
      item[header] = row[index];
    });
    result.push(item);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
C. Frontend Catalogue JSON StructureOutput produced by the Apps Script execution and consumed by CatalogueGrid.jsx:[
  {
    "product_id": "prod_001",
    "link": "https://checkout-or-external-link.com/item-1",
    "image": "https://drive.google.com/uc?id=IMAGE_FILE_ID",
    "price": "Rp 290.000",
    "sale_price": "Rp 190.000"
  },
  {
    "product_id": "freebie_001",
    "link": "#coming-soon",
    "image": "https://drive.google.com/uc?id=IMAGE_FILE_ID",
    "price": "Free",
    "sale_price": ""
  }
]
8. Implementation Checklist[x] Structure priority link buttons (lucide-react icons used).[x] Configure Simple Icons CDN (https://cdn.simpleicons.org/{slug}) for social media branding.[x] Enforce project Design System & Branding tokens (design-tokens.css / Tailwind extensions).[x] Design reusable CatalogueGrid component to serve both /hello/shop and /hello/freebies.[x] Setup Google Apps Script doGet() function to return sheet rows as JSON.[x] Connect frontend dynamic fetcher to populate product grid using product_id, image, price, sale_price, and link.[x] Build ComingSoonModal.jsx pop-up to convert "Coming Soon" clicks into WhatsApp group joins.[x] Format prices to Rupiah (Rp).