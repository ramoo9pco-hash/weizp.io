/* ================= FORM SUBMISSION ================= */
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMsg');

  errorMsg.textContent = '';

  if (!username || !password) {
    errorMsg.textContent = '❌ All fields are required';
    errorMsg.style.color = '#ef4444';
    return;
  }

  if (username.length < 3) {
    errorMsg.textContent = '❌ Invalid username';
    errorMsg.style.color = '#ef4444';
    return;
  }

  if (password.length < 6) {
    errorMsg.textContent = '❌ Invalid password';
    errorMsg.style.color = '#ef4444';
    return;
  }

  adminLogin(username, password);
});

/* ================= ADMIN LOGIN FUNCTION ================= */
async function adminLogin(username, password) {
  const errorMsg = document.getElementById('errorMsg');
  const loginBtn = document.querySelector('.login-btn');

  try {
    errorMsg.textContent = '🔐 Authenticating...';
    errorMsg.style.color = '#3498db';
    loginBtn.disabled = true;
    loginBtn.textContent = '🔐 Logging in...';

    const response = await fetch("/api/admin/login", {
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
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUsername', data.username);
      localStorage.setItem('adminLoginTime', new Date().toISOString());

      errorMsg.textContent = '✅ Login successful! Redirecting...';
      errorMsg.style.color = '#2ecc71';

      setTimeout(() => {
        window.location.href = 'admin.html';
      }, 1000);

    } else {
      errorMsg.textContent = '❌ ' + data.message;
      errorMsg.style.color = '#ef4444';
      loginBtn.disabled = false;
      loginBtn.textContent = '🔐 Login to Admin Panel';
    }

  } catch (error) {
    console.error("Admin Login Error:", error);
    errorMsg.textContent = '❌ Server not responding! Please try again later.';
    errorMsg.style.color = '#ef4444';
    loginBtn.disabled = false;
    loginBtn.textContent = '🔐 Login to Admin Panel';
  }
}

/* ================= TOGGLE PASSWORD VISIBILITY ================= */
function togglePassword() {
  const passwordInput = document.getElementById('password');
  const eyeIcon = document.getElementById('eyeIcon');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeIcon.textContent = '🙈';
  } else {
    passwordInput.type = 'password';
    eyeIcon.textContent = '👁️';
  }
}

/* ================= CHECK IF ALREADY LOGGED IN ================= */
document.addEventListener('DOMContentLoaded', function() {
  const adminToken = localStorage.getItem('adminToken');

  if (adminToken) {
    verifyAdminToken(adminToken);
  }
});

/* ================= VERIFY EXISTING TOKEN ================= */
async function verifyAdminToken(token) {
  try {
    const response = await fetch("/api/admin/users", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await response.json();

    if (data.success) {
      window.location.href = 'admin.html';
    } else {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUsername');
      localStorage.removeItem('adminLoginTime');
    }

  } catch (error) {
    console.error("Token Verify Error:", error);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminLoginTime');
  }
}