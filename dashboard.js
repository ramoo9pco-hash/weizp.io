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
}

/* ================= FETCH BALANCE FROM SERVER ================= */
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
      localStorage.setItem('balance', data.balance);
    } else {
      document.getElementById('userBalance').textContent = "0.00";
    }

  } catch (error) {
    console.error("Fetch Balance Error:", error);
    document.getElementById('userBalance').textContent = "0.00";
  }
}

/* ================= LOAD CRYPTO PRICES FROM SERVER ================= */
async function loadCryptoPrices() {
  const cryptoList = document.getElementById('cryptoList');
  cryptoList.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px;">Loading prices...</div>';

  try {
    const response = await fetch("/api/crypto/prices");
    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch prices");
    }

    cryptoList.innerHTML = '';

    result.coins.forEach(coin => {
      const price = coin.current_price;
      const change24h = coin.price_change_percentage_24h || 0;
      const changeClass = change24h >= 0 ? 'positive' : 'negative';
      const changeSymbol = change24h >= 0 ? '↑' : '↓';

      const cryptoCard = `
        <div class="crypto-card">
          <div class="crypto-left">
            <div class="crypto-icon">
              <img src="${coin.image}" alt="${coin.name}" style="width:32px; height:32px; border-radius:50%;">
            </div>
            <div class="crypto-info">
              <h3>${coin.name}</h3>
              <p>${coin.symbol.toUpperCase()}</p>
            </div>
          </div>
          <div class="crypto-right">
            <div class="crypto-price">$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
            <div class="crypto-change ${changeClass}">
              ${changeSymbol} ${Math.abs(change24h).toFixed(2)}%
            </div>
          </div>
        </div>
      `;

      cryptoList.insertAdjacentHTML('beforeend', cryptoCard);
    });

  } catch (error) {
    console.error('Crypto Price Error:', error);
    loadFallbackPrices();
  }
}

/* ================= FALLBACK IF API FAILS ================= */
function loadFallbackPrices() {
  const cryptoList = document.getElementById('cryptoList');
  cryptoList.innerHTML = '';

  const fallbackCoins = [
    { name: "Bitcoin", symbol: "BTC", icon: "₿" },
    { name: "Ethereum", symbol: "ETH", icon: "Ξ" },
    { name: "Binance Coin", symbol: "BNB", icon: "🟡" },
    { name: "Solana", symbol: "SOL", icon: "◎" },
    { name: "Ripple", symbol: "XRP", icon: "✕" },
    { name: "Cardano", symbol: "ADA", icon: "₳" },
    { name: "Dogecoin", symbol: "DOGE", icon: "Ð" },
    { name: "Polygon", symbol: "MATIC", icon: "⬡" },
    { name: "Polkadot", symbol: "DOT", icon: "●" },
    { name: "Litecoin", symbol: "LTC", icon: "Ł" }
  ];

  cryptoList.innerHTML = `
    <div style="text-align: center; color: #f59e0b; padding: 10px; margin-bottom: 10px; background: rgba(245, 158, 11, 0.1); border-radius: 10px;">
      ⚠️ Live prices temporarily unavailable. Retrying in 30 seconds...
    </div>
  `;

  fallbackCoins.forEach(coin => {
    const cryptoCard = `
      <div class="crypto-card">
        <div class="crypto-left">
          <div class="crypto-icon">${coin.icon}</div>
          <div class="crypto-info">
            <h3>${coin.name}</h3>
            <p>${coin.symbol}</p>
          </div>
        </div>
        <div class="crypto-right">
          <div class="crypto-price" style="color: #94a3b8;">Loading...</div>
          <div class="crypto-change" style="color: #94a3b8;">--</div>
        </div>
      </div>
    `;
    cryptoList.insertAdjacentHTML('beforeend', cryptoCard);
  });

  setTimeout(loadCryptoPrices, 30000);
}

/* ================= NAVIGATION FUNCTIONS ================= */
function goToDeposit() {
  window.location.href = 'deposit.html';
}

function goToWithdraw() {
  window.location.href = 'withdraw.html';
}

/* ================= LOGOUT FUNCTION ================= */
function logout() {
  localStorage.removeItem('username');
  localStorage.removeItem('balance');
  localStorage.removeItem('token');
  localStorage.removeItem('loginTime');
  window.location.href = 'login.html';
}

/* ================= INITIALIZE ON PAGE LOAD ================= */
document.addEventListener('DOMContentLoaded', function() {
  loadUserData();
  loadCryptoPrices();

  setInterval(fetchBalance, 10000);
  setInterval(loadCryptoPrices, 60000);
});