const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Resend } = require('resend');

admin.initializeApp();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret
});

// Initialize Resend
const resend = new Resend(functions.config().resend.api_key);

// Create Razorpay Order
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  try {
    const { name, email, phone, schoolName, codingExperience, motivation, goals } = data;

    // Validate input
    if (!name || !email || !phone || !schoolName || !codingExperience || !motivation || !goals) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Create registration document (pending payment)
    const registrationRef = await admin.firestore().collection('registrations').add({
      name,
      email,
      phone,
      schoolName,
      codingExperience,
      motivation,
      goals,
      paymentStatus: 'pending',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: 150000, // ₹1,500 in paise
      currency: 'INR',
      receipt: registrationRef.id,
      notes: {
        registrationId: registrationRef.id,
        name: name,
        email: email
      }
    });

    // Update registration with order ID
    await registrationRef.update({
      razorpayOrderId: order.id
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      registrationId: registrationRef.id
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Verify Razorpay Payment
exports.verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = data;

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', functions.config().razorpay.key_secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid payment signature');
    }

    // Update registration status
    const registrationRef = admin.firestore().collection('registrations').doc(registrationId);
    const registration = await registrationRef.get();

    if (!registration.exists) {
      throw new functions.https.HttpsError('not-found', 'Registration not found');
    }

    await registrationRef.update({
      paymentStatus: 'completed',
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paidAmount: 150000,
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send confirmation email
    const registrationData = registration.data();
    await sendConfirmationEmail(registrationData);

    return { success: true, message: 'Payment verified successfully' };
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Send confirmation email
async function sendConfirmationEmail(registration) {
  try {
    await resend.emails.send({
      from: 'ML Bootcamp <onboarding@resend.dev>', // Use your verified domain later
      to: registration.email,
      subject: 'Welcome to ML Bootcamp! Registration Confirmed',
      html: `
        <h1>Welcome to the ML Bootcamp!</h1>
        <p>Hi ${registration.name},</p>
        <p>Thank you for registering for the 1-week ML Bootcamp. Your payment of ₹1,500 has been confirmed.</p>

        <h2>Registration Details:</h2>
        <ul>
          <li><strong>Name:</strong> ${registration.name}</li>
          <li><strong>Email:</strong> ${registration.email}</li>
          <li><strong>Phone:</strong> ${registration.phone}</li>
          <li><strong>School:</strong> ${registration.schoolName}</li>
          <li><strong>Experience Level:</strong> ${registration.codingExperience}</li>
        </ul>

        <p>We'll send you the bootcamp schedule and joining details within 24 hours!</p>

        <p>Get ready for an exciting learning journey!</p>

        <p>Best regards,<br>Divya Rajparia<br>ML Bootcamp Instructor</p>
      `
    });
    console.log('Confirmation email sent to:', registration.email);
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - email failure shouldn't fail the payment
  }
}

// Razorpay Webhook Handler
exports.handleRazorpayWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const webhookSecret = functions.config().razorpay.webhook_secret;
    const webhookSignature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const orderId = payload.payment.entity.order_id;

      // Find registration by order ID
      const snapshot = await admin.firestore()
        .collection('registrations')
        .where('razorpayOrderId', '==', orderId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const registration = doc.data();

        // If not already completed (backup check)
        if (registration.paymentStatus !== 'completed') {
          await doc.ref.update({
            paymentStatus: 'completed',
            razorpayPaymentId: payload.payment.entity.id,
            paidAmount: payload.payment.entity.amount,
            paidAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Send confirmation email (backup)
          await sendConfirmationEmail(registration);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal error');
  }
});
