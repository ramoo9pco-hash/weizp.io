/* ================= GLOBAL VARIABLES ================= */
let currentBalance = 0;

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
  fetchWithdrawHistory();
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
      currentBalance = data.balance;
      document.getElementById('userBalance').textContent = data.balance.toFixed(2);
    } else {
      currentBalance = 0;
      document.getElementById('userBalance').textContent = "0.00";
    }

  } catch (error) {
    console.error("Fetch Balance Error:", error);
    currentBalance = 0;
    document.getElementById('userBalance').textContent = "0.00";
  }
}

/* ================= CALCULATE WITHDRAW ================= */
function calculateWithdraw() {
  const amount = parseFloat(document.getElementById('withdrawAmount').value) || 0;

  document.getElementById('summaryAmount').textContent = "$" + amount.toFixed(2);
  document.getElementById('summaryReceive').textContent = "$" + amount.toFixed(2);
}

/* ================= SET MAX AMOUNT ================= */
function setMaxAmount() {
  document.getElementById('withdrawAmount').value = currentBalance.toFixed(2);
  calculateWithdraw();
}

/* ================= SUBMIT WITHDRAW ================= */
async function submitWithdraw() {
  if (!checkAuth()) return;

  const walletAddress = document.getElementById('walletAddress').value.trim();
  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  const withdrawMsg = document.getElementById('withdrawMsg');

  withdrawMsg.textContent = '';

  if (!walletAddress) {
    withdrawMsg.textContent = '❌ Please enter your ERC20 wallet address';
    withdrawMsg.style.color = '#ef4444';
    return;
  }

  if (!walletAddress.startsWith('0x')) {
    withdrawMsg.textContent = '❌ Invalid ERC20 address. Must start with 0x';
    withdrawMsg.style.color = '#ef4444';
    return;
  }

  if (walletAddress.length < 42) {
    withdrawMsg.textContent = '❌ Invalid ERC20 address. Address too short';
    withdrawMsg.style.color = '#ef4444';
    return;
  }

  if (!amount || isNaN(amount)) {
    withdrawMsg.textContent = '❌ Please enter a valid amount';
    withdrawMsg.style.color = '#ef4444';
    return;
  }

  if (amount < 30) {
    withdrawMsg.textContent = '❌ Minimum withdrawal amount is $30';
    withdrawMsg.style.color = '#ef4444';
    return;
  }

  if (amount > currentBalance) {
    withdrawMsg.textContent = `❌ Insufficient balance. Available: $${currentBalance.toFixed(2)}`;
    withdrawMsg.style.color = '#ef4444';
    return;
  }

  const confirmed = confirm(
    `⚠️ PLEASE CONFIRM WITHDRAWAL\n\n` +
    `Amount: $${amount.toFixed(2)} USDT\n` +
    `Network: ERC20\n` +
    `Wallet: ${walletAddress}\n\n` +
    `⚠️ Make sure this is a valid ERC20 address!\n` +
    `⚠️ Wrong address = permanent loss of funds!\n\n` +
    `Do you want to proceed?`
  );

  if (!confirmed) return;

  const doubleConfirm = confirm(
    `🔴 FINAL CONFIRMATION\n\n` +
    `Sending $${amount.toFixed(2)} USDT to:\n` +
    `${walletAddress}\n\n` +
    `This action cannot be undone!\n` +
    `Are you absolutely sure?`
  );

  if (!doubleConfirm) return;

  withdrawMsg.textContent = 'Processing withdrawal...';
  withdrawMsg.style.color = '#3498db';

  try {
    const response = await fetch("/api/user/withdraw", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        amount: amount,
        walletAddress: walletAddress
      })
    });

    const data = await response.json();

    if (handleAuthError(data)) return;

    if (data.success) {
      withdrawMsg.textContent = '✅ ' + data.message;
      withdrawMsg.style.color = '#2ecc71';

      document.getElementById('walletAddress').value = '';
      document.getElementById('withdrawAmount').value = '';
      document.getElementById('summaryAmount').textContent = '$0.00';
      document.getElementById('summaryReceive').textContent = '$0.00';

      fetchBalance();
      fetchWithdrawHistory();

      alert(
        `✅ Withdraw Request Submitted!\n\n` +
        `Amount: $${amount.toFixed(2)} USDT\n` +
        `Wallet: ${walletAddress}\n` +
        `Status: Pending ⏳\n\n` +
        `Your request is being reviewed.\n` +
        `Processing time: 1-24 hours.`
      );

    } else {
      withdrawMsg.textContent = '❌ ' + data.message;
      withdrawMsg.style.color = '#ef4444';
    }

  } catch (error) {
    console.error("Withdraw Error:", error);
    withdrawMsg.textContent = '❌ Server not responding! Please try again.';
    withdrawMsg.style.color = '#ef4444';
  }
}

/* ================= FETCH WITHDRAW HISTORY ================= */
async function fetchWithdrawHistory() {
  const withdrawHistory = document.getElementById('withdrawHistory');

  try {
    const response = await fetch("/api/user/withdrawals", {
      method: "GET",
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (handleAuthError(data)) return;

    if (data.success) {
      if (data.withdrawals.length === 0) {
        withdrawHistory.innerHTML = '<p class="no-history">No withdrawals yet</p>';
        return;
      }

      withdrawHistory.innerHTML = '';

      data.withdrawals.forEach(withdrawal => {
        let statusIcon = '';
        let statusClass = '';
        let statusText = '';

        switch (withdrawal.status) {
          case 'pending':
            statusIcon = '⏳';
            statusClass = 'pending';
            statusText = 'Pending';
            break;
          case 'approved':
            statusIcon = '✅';
            statusClass = 'approved';
            statusText = 'Approved';
            break;
          case 'rejected':
            statusIcon = '❌';
            statusClass = 'rejected';
            statusText = 'Rejected';
            break;
        }

        const date = new Date(withdrawal.createdAt);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let dateText = '';
        if (diffDays === 0) {
          dateText = 'Today ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
          dateText = 'Yesterday';
        } else {
          dateText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        const shortWallet = withdrawal.walletAddress.substring(0, 8) + '...' + withdrawal.walletAddress.substring(withdrawal.walletAddress.length - 6);

        const historyItem = `
          <div class="history-item">
            <div class="history-icon ${statusClass}">${statusIcon}</div>
            <div class="history-details">
              <p class="history-amount">$${withdrawal.amount.toFixed(2)} USDT</p>
              <p class="history-date">${dateText}</p>
              <p class="history-wallet">To: ${shortWallet}</p>
            </div>
            <span class="history-status ${statusClass}">${statusText}</span>
          </div>
        `;

        withdrawHistory.insertAdjacentHTML('beforeend', historyItem);
      });

    } else {
      withdrawHistory.innerHTML = '<p class="no-history">Failed to load history</p>';
    }

  } catch (error) {
    console.error("Fetch History Error:", error);
    withdrawHistory.innerHTML = '<p class="no-history">Failed to load history</p>';
  }
}

/* ================= GO BACK ================= */
function goBack() {
  window.location.href = 'dashboard.html';
}

/* ================= INITIALIZE ================= */
document.addEventListener('DOMContentLoaded', function() {
  loadUserData();

  setInterval(fetchBalance, 30000);
  setInterval(fetchWithdrawHistory, 30000);
});