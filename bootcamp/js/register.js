// Registration Form Handler

// Form elements
const form = document.getElementById('registration-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnLoading = document.getElementById('btn-loading');

// Character counters
const motivationTextarea = document.getElementById('motivation');
const goalsTextarea = document.getElementById('goals');
const motivationCount = document.getElementById('motivation-count');
const goalsCount = document.getElementById('goals-count');

// Update character count
motivationTextarea.addEventListener('input', () => {
  const length = motivationTextarea.value.length;
  motivationCount.textContent = `${length}/50`;
  motivationCount.style.color = length >= 50 ? 'var(--primary-emerald)' : 'var(--text-muted)';
});

goalsTextarea.addEventListener('input', () => {
  const length = goalsTextarea.value.length;
  goalsCount.textContent = `${length}/30`;
  goalsCount.style.color = length >= 30 ? 'var(--primary-emerald)' : 'var(--text-muted)';
});

// Validation functions
const validators = {
  fullName: (value) => {
    if (value.length < 2) {
      return 'Name must be at least 2 characters';
    }
    return '';
  },
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  },
  phone: (value) => {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid 10-digit phone number';
    }
    return '';
  },
  schoolName: (value) => {
    if (value.length < 3) {
      return 'School name must be at least 3 characters';
    }
    return '';
  },
  codingExperience: (value) => {
    if (!value) {
      return 'Please select your coding experience level';
    }
    return '';
  },
  motivation: (value) => {
    if (value.length < 50) {
      return `Please write at least 50 characters (${50 - value.length} more needed)`;
    }
    return '';
  },
  goals: (value) => {
    if (value.length < 30) {
      return `Please write at least 30 characters (${30 - value.length} more needed)`;
    }
    return '';
  },
  terms: (checked) => {
    if (!checked) {
      return 'You must agree to the terms and conditions';
    }
    return '';
  }
};

// Show error message
function showError(fieldName, message) {
  const errorElement = document.getElementById(`${fieldName}-error`);
  if (errorElement) {
    errorElement.textContent = message;
  }
}

// Clear error message
function clearError(fieldName) {
  const errorElement = document.getElementById(`${fieldName}-error`);
  if (errorElement) {
    errorElement.textContent = '';
  }
}

// Validate single field
function validateField(fieldName) {
  const field = document.getElementById(fieldName);
  if (!field) return true;

  const value = field.type === 'checkbox' ? field.checked : field.value;
  const error = validators[fieldName](value);

  if (error) {
    showError(fieldName, error);
    return false;
  } else {
    clearError(fieldName);
    return true;
  }
}

// Add real-time validation
['fullName', 'email', 'phone', 'schoolName', 'codingExperience', 'motivation', 'goals'].forEach(fieldName => {
  const field = document.getElementById(fieldName);
  if (field) {
    field.addEventListener('blur', () => validateField(fieldName));
  }
});

// Validate entire form
function validateForm() {
  let isValid = true;
  const fields = ['fullName', 'email', 'phone', 'schoolName', 'codingExperience', 'motivation', 'goals', 'terms'];

  fields.forEach(fieldName => {
    if (!validateField(fieldName)) {
      isValid = false;
    }
  });

  return isValid;
}

// Show loading state
function setLoading(loading) {
  submitBtn.disabled = loading;
  btnText.style.display = loading ? 'none' : 'inline';
  btnLoading.style.display = loading ? 'inline' : 'none';
}

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validate form
  if (!validateForm()) {
    alert('Please fix the errors in the form before submitting.');
    return;
  }

  setLoading(true);

  try {
    // Get form data
    const formData = {
      name: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim().replace(/\s/g, ''),
      schoolName: document.getElementById('schoolName').value.trim(),
      codingExperience: document.getElementById('codingExperience').value,
      motivation: document.getElementById('motivation').value.trim(),
      goals: document.getElementById('goals').value.trim()
    };

    console.log('Creating Razorpay order...', formData);

    // Call Firebase Function to create Razorpay order
    const createRazorpayOrder = functions.httpsCallable('createRazorpayOrder');
    const result = await createRazorpayOrder(formData);

    console.log('Order created:', result.data);

    // Configure Razorpay options
    const options = {
      key: window.RAZORPAY_KEY_ID, // Loaded from config.js
      amount: result.data.amount,
      currency: result.data.currency,
      name: 'ML Bootcamp',
      description: '1-Week Machine Learning Bootcamp',
      order_id: result.data.orderId,
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
        paylater: false,
        cardless_emi: false
      },
      handler: async function (response) {
        console.log('Payment successful:', response);

        try {
          // Verify payment
          const verifyPayment = functions.httpsCallable('verifyRazorpayPayment');
          const verifyResult = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            registrationId: result.data.registrationId
          });

          console.log('Payment verified:', verifyResult.data);

          // Redirect to success page
          window.location.href = 'success.html';
        } catch (error) {
          console.error('Payment verification failed:', error);
          alert('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          setLoading(false);
        }
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone
      },
      notes: {
        registrationId: result.data.registrationId
      },
      theme: {
        color: '#10b981'
      },
      modal: {
        ondismiss: function() {
          console.log('Payment cancelled');
          setLoading(false);
        }
      }
    };

    // Open Razorpay checkout
    const razorpay = new Razorpay(options);
    razorpay.open();

  } catch (error) {
    console.error('Error:', error);
    alert('Registration failed: ' + error.message + '. Please try again.');
    setLoading(false);
  }
});

console.log('Registration form script loaded');
