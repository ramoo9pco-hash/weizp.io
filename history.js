/* ================= GLOBAL VARIABLES ================= */
let allHistory = [];
let currentFilter = 'all';

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

  fetchBalanceAndProfit();
  fetchHistory();
}

/* ================= FETCH BALANCE AND PROFIT ================= */
async function fetchBalanceAndProfit() {
  try {
    const response = await fetch("/api/user/earning-data", {
      method: "GET",
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (handleAuthError(data)) return;

    if (data.success) {
      document.getElementById('totalBalance').textContent = data.balance.toFixed(2);
      document.getElementById('totalProfit').textContent = data.totalProfit.toFixed(2);
    } else {
      document.getElementById('totalBalance').textContent = "0.00";
      document.getElementById('totalProfit').textContent = "0.00";
    }

  } catch (error) {
    console.error("Fetch Balance Error:", error);
    document.getElementById('totalBalance').textContent = "0.00";
    document.getElementById('totalProfit').textContent = "0.00";
  }
}

/* ================= FETCH HISTORY ================= */
async function fetchHistory() {
  const historyList = document.getElementById('historyList');

  historyList.innerHTML = '<div class="loading-text">Loading history...</div>';

  try {
    const response = await fetch("/api/user/history", {
      method: "GET",
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (handleAuthError(data)) return;

    if (data.success) {
      allHistory = data.history;
      displayHistory(allHistory);
    } else {
      historyList.innerHTML = '<div class="loading-text">Failed to load history</div>';
    }

  } catch (error) {
    console.error("Fetch History Error:", error);
    historyList.innerHTML = '<div class="loading-text">Server not responding</div>';
  }
}

/* ================= FILTER HISTORY ================= */
function filterHistory(type, btn) {
  currentFilter = type;

  const allBtns = document.querySelectorAll('.filter-btn');
  allBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (type === 'all') {
    displayHistory(allHistory);
  } else {
    const filtered = allHistory.filter(item => item.type === type);
    displayHistory(filtered);
  }
}

/* ================= DISPLAY HISTORY ================= */
function displayHistory(history) {
  const historyList = document.getElementById('historyList');
  const noResults = document.getElementById('noResults');
  const transactionCount = document.getElementById('transactionCount');

  transactionCount.textContent = history.length;

  if (!history || history.length === 0) {
    historyList.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';
  historyList.innerHTML = '';

  history.forEach(item => {
    let icon = '';
    let iconClass = '';
    let title = '';
    let amountClass = '';
    let amountPrefix = '';
    let statusClass = '';
    let statusText = '';
    let extraInfo = '';

    switch (item.type) {
      case 'profit_claim':
        icon = '🟢';
        iconClass = 'profit';
        title = 'Profit Claimed';
        amountClass = 'positive';
        amountPrefix = '+$';
        statusClass = 'completed';
        statusText = 'Completed ✅';
        if (item.rate) {
          extraInfo = `<p>Rate: <span>${item.rate}%</span></p>`;
        }
        break;

      case 'transfer':
        icon = '🔵';
        iconClass = 'transfer';
        title = 'Transfer to Balance';
        amountClass = 'neutral';
        amountPrefix = '$';
        statusClass = 'completed';
        statusText = 'Completed ✅';
        break;

      case 'withdraw':
        icon = '🔴';
        iconClass = 'withdraw';
        title = 'Withdrawal';
        amountClass = 'negative';
        amountPrefix = '-$';

        if (item.status === 'pending') {
          statusClass = 'pending';
          statusText = 'Pending ⏳';
        } else if (item.status === 'approved') {
          statusClass = 'approved';
          statusText = 'Approved ✅';
        } else if (item.status === 'rejected') {
          statusClass = 'rejected';
          statusText = 'Rejected ❌';
        } else {
          statusClass = 'completed';
          statusText = 'Completed ✅';
        }

        if (item.walletAddress) {
          const shortWallet = item.walletAddress.substring(0, 8) + '...' + item.walletAddress.substring(item.walletAddress.length - 6);
          extraInfo = `<p>To: <span class="history-item-wallet">${shortWallet}</span></p>`;
        }
        break;

      case 'reward':
        icon = '🟡';
        iconClass = 'reward';
        title = 'Reward';
        amountClass = 'reward-color';
        amountPrefix = '$';

        if (item.status === 'pending') {
          statusClass = 'pending';
          statusText = 'Pending ⏳';
        } else if (item.status === 'approved') {
          statusClass = 'approved';
          statusText = 'Approved ✅';
        } else if (item.status === 'rejected') {
          statusClass = 'rejected';
          statusText = 'Rejected ❌';
        } else if (item.status === 'none') {
          statusClass = 'pending';
          statusText = 'In Progress ⏳';
        } else {
          statusClass = 'completed';
          statusText = 'Completed ✅';
        }

        if (item.message) {
          extraInfo = `<p>Note: <span>${item.message}</span></p>`;
        }
        break;

      case 'deposit':
        icon = '💰';
        iconClass = 'deposit';
        title = 'Deposit';
        amountClass = 'positive';
        amountPrefix = '+$';
        statusClass = 'completed';
        statusText = 'Completed ✅';
        break;

      default:
        icon = '⚪';
        iconClass = 'profit';
        title = 'Transaction';
        amountClass = 'neutral';
        amountPrefix = '$';
        statusClass = 'completed';
        statusText = 'Completed ✅';
    }

    const date = new Date(item.date);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let dateText = '';
    if (diffDays === 0) {
      dateText = 'Today ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      dateText = 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      dateText = diffDays + ' days ago';
    } else {
      dateText = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    const historyItem = `
      <div class="history-item">
        <div class="history-item-header">
          <div class="history-item-left">
            <div class="history-item-icon ${iconClass}">${icon}</div>
            <div>
              <p class="history-item-title">${title}</p>
              <p class="history-item-date">${dateText}</p>
            </div>
          </div>
          <div class="history-item-amount ${amountClass}">
            ${amountPrefix}${item.amount.toFixed(2)}
          </div>
        </div>
        <div class="history-item-details">
          <div class="history-item-info">
            ${extraInfo}
          </div>
          <span class="history-item-status ${statusClass}">${statusText}</span>
        </div>
      </div>
    `;

    historyList.insertAdjacentHTML('beforeend', historyItem);
  });
}

/* ================= LOGOUT ================= */
function logout() {
  localStorage.removeItem('username');
  localStorage.removeItem('balance');
  localStorage.removeItem('token');
  localStorage.removeItem('loginTime');
  window.location.href = 'login.html';
}

/* ================= INITIALIZE ================= */
document.addEventListener('DOMContentLoaded', function() {
  loadUserData();

  setInterval(fetchHistory, 30000);
  setInterval(fetchBalanceAndProfit, 30000);
});