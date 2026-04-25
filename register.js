/* ================= FORM SUBMISSION ================= */
document.getElementById('registerForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorMsg = document.getElementById('errorMsg');

  errorMsg.textContent = '';

  if (!username || !password || !confirmPassword) {
    errorMsg.textContent = 'All fields are required';
    errorMsg.style.color = '#ef4444';
    return;
  }

  if (username.length < 3) {
    errorMsg.textContent = 'Username must be at least 3 characters';
    errorMsg.style.color = '#ef4444';
    return;
  }

  if (password.length < 6) {
    errorMsg.textContent = 'Password must be at least 6 characters';
    errorMsg.style.color = '#ef4444';
    return;
  }

  if (password !== confirmPassword) {
    errorMsg.textContent = 'Passwords do not match';
    errorMsg.style.color = '#ef4444';
    return;
  }

  registerUser(username, password);
});

/* ================= REGISTER USER FUNCTION ================= */
async function registerUser(username, password) {
  const errorMsg = document.getElementById('errorMsg');

  try {
    errorMsg.textContent = 'Creating account...';
    errorMsg.style.color = '#3498db';

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    const data = await response.json();

    if (data.success) {
      alert('✅ Registration Successful! Please login.');
      window.location.href = 'login.html';
    } else {
      errorMsg.textContent = '❌ ' + data.message;
      errorMsg.style.color = '#ef4444';
    }

  } catch (error) {
    console.error("Error:", error);
    errorMsg.textContent = '❌ Server not responding! Please try again later.';
    errorMsg.style.color = '#ef4444';
  }
}

/* ================= CHECK IF ALREADY LOGGED IN ================= */
document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  if (token && username) {
    window.location.href = 'dashboard.html';
  }
});