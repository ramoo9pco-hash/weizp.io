/* ================= AUTH CHECK ================= */
function checkAuth() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  if (!token || !username) {
    window.location.href = 'login.html';
    return false;
  }

  return true;
}

/* ================= GET AUTH HEADERS ================= */
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  };
}

/* ================= HANDLE AUTH ERROR ================= */
function handleAuthError(data) {
  if (data.authError) {
    alert("⚠️ Session expired! Please login again.");
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('balance');
    localStorage.removeItem('loginTime');
    window.location.href = 'login.html';
    return true;
  }
  return false;
}

/* ================= LOAD USER DATA ================= */
function loadUserData() {
  if (!checkAuth()) return;

  const username = localStorage.getItem('username');
  document.getElementById('username').textContent = `👤 ${username}`;

  fetchBalance();
  fetchDepositWallet();
}

/* ================= FETCH BALANCE ================= */
async function fetchBalance() {
  try {
    const response = await fetch("/api/user/balance", {
      method: "GET",
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (handleAuthError(data)) return;

    if (data.success) {
      document.getElementById('userBalance').textContent = data.balance.toFixed(2);
    } else {
      document.getElementById('userBalance').textContent = "0.00";
    }

  } catch (error) {
    console.error("Fetch Balance Error:", error);
    document.getElementById('userBalance').textContent = "0.00";
  }
}

/* ================= FETCH DEPOSIT WALLET ================= */
async function fetchDepositWallet() {
  const walletLoading = document.getElementById('walletLoading');
  const walletAddressSection = document.getElementById('walletAddressSection');
  const walletError = document.getElementById('walletError');

  walletLoading.style.display = 'block';
  walletAddressSection.style.display = 'none';
  walletError.style.display = 'none';

  try {
    const response = await fetch("/api/user/deposit-wallet", {
      method: "GET",
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (handleAuthError(data)) return;

    walletLoading.style.display = 'none';

    if (data.success) {
      walletAddressSection.style.display = 'block';
      document.getElementById('walletAddress').textContent = data.walletAddress;
    } else {
      walletError.style.display = 'block';
    }

  } catch (error) {
    console.error("Fetch Wallet Error:", error);
    walletLoading.style.display = 'none';
    walletError.style.display = 'block';
  }
}

/* ================= COPY WALLET ADDRESS ================= */
function copyWalletAddress() {
  const walletAddress = document.getElementById('walletAddress').textContent;
  const copyBtn = document.querySelector('.copy-btn');
  const copyIcon = document.getElementById('copyIcon');
  const copyText = document.getElementById('copyText');
  const copyMsg = document.getElementById('copyMsg');

  navigator.clipboard.writeText(walletAddress).then(() => {
    copyBtn.classList.add('copied');
    copyIcon.textContent = '✅';
    copyText.textContent = 'Copied!';
    copyMsg.textContent = '✅ Address copied to clipboard!';
    copyMsg.style.color = '#2ecc71';

    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyIcon.textContent = '📋';
      copyText.textContent = 'Copy';
      copyMsg.textContent = '';
    }, 3000);

  }).catch(() => {
    const textArea = document.createElement('textarea');
    textArea.value = walletAddress;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      copyBtn.classList.add('copied');
      copyIcon.textContent = '✅';
      copyText.textContent = 'Copied!';
      copyMsg.textContent = '✅ Address copied to clipboard!';
      copyMsg.style.color = '#2ecc71';

      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyIcon.textContent = '📋';
        copyText.textContent = 'Copy';
        copyMsg.textContent = '';
      }, 3000);

    } catch (err) {
      copyMsg.textContent = '❌ Failed to copy. Please copy manually.';
      copyMsg.style.color = '#ef4444';
    }

    document.body.removeChild(textArea);
  });
}

/* ================= GO BACK ================= */
function goBack() {
  window.location.href = 'dashboard.html';
}

/* ================= INITIALIZE ================= */
document.addEventListener('DOMContentLoaded', function() {
  loadUserData();

  setInterval(fetchBalance, 30000);
});