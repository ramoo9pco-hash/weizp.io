/* ================= FORM SUBMISSION ================= */
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMsg');

  errorMsg.textContent = '';

  if (!username || !password) {
    errorMsg.textContent = 'All fields are required';
    return;
  }

  if (username.length < 3) {
    errorMsg.textContent = 'Invalid username';
    return;
  }

  if (password.length < 6) {
    errorMsg.textContent = 'Invalid password';
    return;
  }

  loginUser(username, password);
});

/* ================= LOGIN USER FUNCTION ================= */
async function loginUser(username, password) {
  const errorMsg = document.getElementById('errorMsg');

  try {
    errorMsg.textContent = 'Logging in...';
    errorMsg.style.color = '#3498db';

    const response = await fetch("/api/login", {
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
      localStorage.setItem('username', data.username);
      localStorage.setItem('balance', data.balance);
      localStorage.setItem('token', data.token);
      localStorage.setItem('loginTime', new Date().toISOString());

      alert('✅ Login Successful!');
      window.location.href = 'dashboard.html';
    } else {
      errorMsg.textContent = '❌ ' + data.message;
      errorMsg.style.color = '#ef4444';
    }

  } catch (error) {
    console.error("Login Error:", error);
    errorMsg.textContent = '❌ Server not responding! Please try again later.';
    errorMsg.style.color = '#ef4444';
  }
}

/* ================= CHECK IF ALREADY LOGGED IN ================= */
document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  if (token && username) {
    verifyToken(token);
  }
});

/* ================= VERIFY EXISTING TOKEN ================= */
async function verifyToken(token) {
  try {
    const response = await fetch("/api/user/balance", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await response.json();

    if (data.success) {
      window.location.href = 'dashboard.html';
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('balance');
      localStorage.removeItem('loginTime');
    }

  } catch (error) {
    console.error("Token Verify Error:", error);
  }
}