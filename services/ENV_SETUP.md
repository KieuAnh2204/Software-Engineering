# Environment Variables for Microservices

## 🔐 Security Best Practices

### Local Development:
1. Copy `.env.example` to `.env` for each service
2. Update values in `.env` with your actual credentials
3. NEVER commit `.env` files to Git

### Production:
1. Use environment variables from your hosting platform
2. Use strong, random JWT secrets (min 32 characters)
3. Use production MongoDB connection strings
4. Enable HTTPS only

## 📝 Required Variables by Service:

### All Services:
- `NODE_ENV`: Environment (development/production)
- `PORT`: Service port number
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens

### Payment Service Additional:
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

## 🚀 Quick Setup:

```powershell
# Copy example files to actual .env
Copy-Item services/user-service/.env.example services/user-service/.env
Copy-Item services/product-service/.env.example services/product-service/.env
Copy-Item services/order-service/.env.example services/order-service/.env
Copy-Item services/payment-service/.env.example services/payment-service/.env
```

Then edit each `.env` file with your actual values.

## 🔒 Git Security:

The `.gitignore` file already excludes:
- `.env` (actual credentials)
- `.env.local`
- `.env.*.local`

But INCLUDES:
- `.env.example` (template for team)
