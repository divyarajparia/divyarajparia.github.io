# ML Bootcamp Setup - Next Steps

## ✅ What's Been Completed

1. **Firebase Functions** (Node.js) - Created with Razorpay integration
2. **Frontend Pages** - bootcamp.html, register.html, success.html, cancel.html
3. **Form Styles** - Added to style.css with emerald theme
4. **JavaScript** - firebase-config.js and register.js with validation
5. **Navigation** - Added "ML Bootcamp" link to all 6 existing pages
6. **API Keys** - Configured in Firebase Functions config

## 🔧 Next Steps (YOU NEED TO DO THESE)

### Step 1: Get Firebase Web App Config (5 minutes)

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: "Machine Learning Bootcamp"
3. Click the gear icon (⚙️) next to "Project Overview"
4. Select "Project Settings"
5. Scroll down to "Your apps"
6. Click "Web" icon (</>) if not already created, or select existing web app
7. Copy the `firebaseConfig` object
8. Open `js/firebase-config.js` and replace the placeholder config with your actual config

**Your config should look like:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",  // Your actual API key
  authDomain: "machine-learning-bootcam-956e6.firebaseapp.com",
  projectId: "machine-learning-bootcam-956e6",
  storageBucket: "machine-learning-bootcam-956e6.firebasestorage.app",
  messagingSenderId: "123...",  // Your actual messaging sender ID
  appId: "1:123..."  // Your actual app ID
};
```

### Step 2: Deploy Firebase Functions (10 minutes)

```bash
cd "D:\Divya IITH\divyarajparia.github.io"

# Deploy Firestore rules and Functions
firebase deploy --only firestore,functions

# This will:
# - Deploy your Cloud Functions
# - Set up Firestore security rules
# - Give you URLs for your functions
```

**Important:** Note the function URLs after deployment. They'll look like:
```
https://asia-south1-machine-learning-bootcam-956e6.cloudfunctions.net/createRazorpayOrder
https://asia-south1-machine-learning-bootcam-956e6.cloudfunctions.net/verifyRazorpayPayment
```

### Step 3: Configure Razorpay Webhook (5 minutes)

1. Go to Razorpay Dashboard: https://dashboard.razorpay.com
2. Navigate to Settings → Webhooks
3. Click "Add New Webhook"
4. Webhook URL: `https://asia-south1-machine-learning-bootcam-956e6.cloudfunctions.net/handleRazorpayWebhook`
5. Active Events: Select "payment.captured"
6. Secret: Create a random strong secret (save it!)
7. Click "Create Webhook"

8. Update Firebase config with webhook secret:
```bash
firebase functions:config:set razorpay.webhook_secret="YOUR_WEBHOOK_SECRET_HERE"
firebase deploy --only functions
```

### Step 4: Test Locally (Optional but Recommended) (15 minutes)

```bash
# Terminal 1: Start Firebase Emulators
firebase emulators:start

# Terminal 2: Serve website locally
npx http-server . -p 8080

# Open browser: http://localhost:8080
# Test the registration flow with Razorpay test credentials
```

**Test Credentials:**
- UPI: success@razorpay
- Card: 4111 1111 1111 1111
- CVV: 123
- Expiry: Any future date (e.g., 12/25)
- OTP: 1234

### Step 5: Deploy to GitHub Pages (5 minutes)

```bash
# Add all new files
git add .

# Commit
git commit -m "Add ML Bootcamp registration with Razorpay payment integration"

# Push to GitHub (auto-deploys to GitHub Pages)
git push origin main
```

**Wait 2-3 minutes** for GitHub Pages to deploy. Then visit:
https://divyarajparia.github.io/bootcamp.html

### Step 6: Test Production Payment (10 minutes)

1. Go to https://divyarajparia.github.io/register.html
2. Fill out the form with test data
3. Submit and complete payment with Razorpay test credentials
4. Verify:
   - Payment completes successfully
   - Redirected to success page
   - Email received (check spam folder)
   - Registration appears in Firestore database

### Step 7: Switch to Live Mode (When Ready)

1. Complete Razorpay KYC verification
2. Get Live API keys from Razorpay Dashboard
3. Update Firebase config:
```bash
firebase functions:config:set \
  razorpay.key_id="rzp_live_..." \
  razorpay.key_secret="YOUR_LIVE_SECRET"

firebase deploy --only functions
```

4. Update `js/register.js` line 191:
```javascript
key: 'rzp_live_YOUR_KEY_ID', // Change from rzp_test_ to rzp_live_
```

5. Set up custom email domain in Resend (optional)

## 📝 Important Files

- **Functions:** `functions/index.js` - Backend logic
- **Frontend:**
  - `bootcamp.html` - Landing page
  - `register.html` - Registration form
  - `success.html` - Payment success
  - `cancel.html` - Payment cancelled
- **JavaScript:**
  - `js/firebase-config.js` - Firebase initialization (UPDATE THIS!)
  - `js/register.js` - Form validation and payment
- **Styles:** `style.css` - All styling

## 🔒 Security Files (DO NOT COMMIT)

Add these to `.gitignore`:
```
rzp-key.csv
resenf api key.csv
functions/node_modules/
functions/.env
functions/.env.local
```

## 💰 Pricing

- **Bootcamp:** ₹1,500 per registration
- **Razorpay Fee:** 2% (₹30 per registration)
- **Firebase:** Free tier (more than enough for bootcamp)
- **Resend:** Free tier (3000 emails/month)

## 🐛 Troubleshooting

### Functions not deploying?
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Payment not working?
- Check browser console for errors (F12)
- Verify Firebase config is correct
- Ensure Razorpay test keys are active
- Check Firebase Functions logs: `firebase functions:log`

### Email not sending?
- Verify Resend API key is correct
- Check Firebase Functions logs for errors
- Emails might be in spam folder

## 📞 Support

If you encounter issues:
1. Check Firebase Console → Functions → Logs
2. Check browser DevTools Console (F12)
3. Review Firebase Functions logs: `firebase functions:log`

## 🎉 You're Almost Done!

Complete Steps 1-6 above and your bootcamp registration will be live!

The system will:
✅ Accept registrations 24/7
✅ Process payments securely via Razorpay
✅ Send confirmation emails automatically
✅ Store all data in Firestore
✅ Work on mobile and desktop

Good luck with your bootcamp! 🚀
