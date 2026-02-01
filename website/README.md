# 🌐 VaultZero Website - Demo & Dashboard

The VaultZero website is a Next.js 14 application that demonstrates the passwordless authentication system and provides a developer dashboard.

## 🎯 Overview

The website serves as:
- **Live Demo**: Showcase VaultZero's authentication capabilities
- **Developer Dashboard**: Integration management and analytics
- **Documentation Site**: Interactive guides and API docs
- **Testing Interface**: Try the system without coding

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- VaultZero Core backend running

### Installation

```bash
cd website
npm install
```

### Running

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test
```

The website will be available at [http://localhost:3001](http://localhost:3001)

## 📁 Project Structure

```
website/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── demo/              # Live demo
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # UI components
│   ├── auth/              # Auth components
│   └── dashboard/         # Dashboard widgets
├── lib/                   # Utilities
│   ├── sdk.ts             # VaultZero SDK integration
│   └── utils.ts           # Helper functions
├── public/                # Static assets
└── styles/                # Global styles
```

## 🔑 Key Features

### Live Demo
- Interactive authentication flow
- QR code generation and scanning
- Real-time status updates
- Field customization

### Developer Dashboard
- Application management
- API key generation
- Usage analytics
- Integration logs

### Documentation
- Getting started guides
- API reference
- Code examples
- Best practices

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Core Backend
NEXT_PUBLIC_CORE_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=VaultZero

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your_ga_id
```

## 🎨 Pages

### Home (`/`)
- Product overview
- Feature highlights
- Call to action
- Quick demo

### Demo (`/demo`)
- Live authentication test
- Customizable fields
- QR code display
- Success/error states

### Dashboard (`/dashboard`)
- Application list
- API keys
- Usage statistics
- Integration settings

### Docs (`/docs`)
- Installation guide
- Quick start
- API reference
- Examples

## 🧩 Components

### QRCodeDisplay
Displays QR codes for authentication:
```tsx
<QRCodeDisplay
  qrCodeUrl={qrCodeUrl}
  sessionId={sessionId}
  onScan={() => console.log('Scanned')}
  onExpire={() => console.log('Expired')}
/>
```

### AuthFlow
Complete authentication flow component:
```tsx
<AuthFlow
  onSuccess={(user) => console.log('Success', user)}
  onError={(error) => console.log('Error', error)}
  requestedFields={['name', 'email']}
/>
```

### DashboardCard
Dashboard statistics card:
```tsx
<DashboardCard
  title="Active Users"
  value="1,234"
  change="+12%"
  trend="up"
/>
```

## 🛠️ Technologies

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animations |
| **Chart.js** | Data visualization |
| **VaultZero SDK** | Authentication integration |

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests with Playwright
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📱 Responsive Design

The website is fully responsive:
- **Mobile**: Optimized for small screens
- **Tablet**: Adapted layouts
- **Desktop**: Full feature set

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Docker
```bash
# Build image
docker build -t vaultzero-website .

# Run container
docker run -p 3001:3001 vaultzero-website
```

### Manual
```bash
# Build
npm run build

# Start
npm start
```

## 🔧 Development

### Adding a New Page

1. Create file in `app/` directory
2. Implement page component
3. Add navigation link
4. Test responsiveness

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow design system colors
- Maintain consistent spacing
- Ensure accessibility (a11y)

### Code Organization

- Keep components small and focused
- Use TypeScript for type safety
- Extract reusable logic to hooks
- Document complex components

## 🎨 Design System

### Colors
```css
--primary: #3B82F6
--secondary: #8B5CF6
--success: #10B981
--error: #EF4444
--warning: #F59E0B
--bg: #F9FAFB
--text: #111827
```

### Typography
- **Headings**: Inter font
- **Body**: Inter font
- **Code**: JetBrains Mono

## 📊 Performance

- **Lighthouse Score**: 95+
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Core Web Vitals**: All green

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Connection Issues
- Verify Core backend is running
- Check NEXT_PUBLIC_CORE_URL
- Review CORS settings

### Style Not Applying
```bash
# Rebuild Tailwind
npx tailwindcss -i ./styles/globals.css -o ./styles/output.css
```

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines

---

**Part of [VaultZero](../README.md)** - Experience passwordless authentication 🚀
