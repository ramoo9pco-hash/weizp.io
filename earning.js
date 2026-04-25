/* ================= GLOBAL VARIABLES ================= */
let timerInterval = null;
let currentEarningData = null;

/* ================= AUTH CHECK ================= */
function checkAuth() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  if (!token || !username) { window.location.href = 'login.html'; return false; }
  return true;
}

/* ================= GET AUTH HEADERS ================= */
function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + localStorage.getItem('token')
  };
}

/* ================= HANDLE AUTH ERROR ================= */
function handleAuthError(data) {
  if (data.authError) {
    alert("⚠️ Session expired! Please login again.");
    ['token', 'username', 'balance', 'loginTime'].forEach(k => localStorage.removeItem(k));
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
  fetchEarningData();
  fetchReward();
}

/* ================= FETCH EARNING DATA ================= */
async function fetchEarningData() {
  try {
    const response = await fetch("/api/user/earning-data", { method: "GET", headers: getAuthHeaders() });
    const data = await response.json();
    if (handleAuthError(data)) return;

    if (data.success) {
      currentEarningData = data;

      document.getElementById('totalBalance').textContent = data.balance.toFixed(2);
      document.getElementById('totalProfit').textContent = data.totalProfit.toFixed(2);
      document.getElementById('profitRate').textContent = data.rate + "%";
      document.getElementById('profitBasedOn').textContent = "$" + data.balance.toFixed(2);
      document.getElementById('todayProfit').textContent = "$" + data.dailyProfit.toFixed(2);
      document.getElementById('claimAmount').textContent = "$" + data.dailyProfit.toFixed(2);
      document.getElementById('transferAvailable').textContent = "$" + data.totalProfit.toFixed(2) + " USDT";

      const statusEl = document.getElementById('profitStatus');
      const claimBtn = document.getElementById('claimProfitBtn');

      if (data.balance <= 0) {
        statusEl.textContent = "❌ No Balance";
        statusEl.style.color = "#ef4444";
        claimBtn.disabled = true;
      } else if (data.canClaim) {
        statusEl.textContent = "✅ Ready to Claim";
        statusEl.style.color = "#2ecc71";
        claimBtn.disabled = false;
      } else {
        statusEl.textContent = "⏳ Wait for next cycle";
        statusEl.style.color = "#f59e0b";
        claimBtn.disabled = true;
      }

      updateProfitProgress(data);

      if (!data.canClaim && data.timeRemaining > 0) {
        startTimer(data.timeRemaining);
      } else if (data.canClaim) {
        document.getElementById('timerHours').textContent = "00";
        document.getElementById('timerMinutes').textContent = "00";
        document.getElementById('timerSeconds').textContent = "00";
        document.getElementById('profitProgressBar').style.width = "100%";
        document.getElementById('profitProgressText').textContent = "100%";
      }

      const transferBtn = document.getElementById('transferBtn');
      transferBtn.disabled = !data.canTransfer;
      transferBtn.style.opacity = data.canTransfer ? "1" : "0.5";
      transferBtn.style.cursor = data.canTransfer ? "pointer" : "not-allowed";

      document.getElementById('statToday').textContent = "$" + data.stats.today.toFixed(2);
      document.getElementById('statWeek').textContent = "$" + data.stats.week.toFixed(2);
      document.getElementById('statMonth').textContent = "$" + data.stats.month.toFixed(2);
      document.getElementById('statAllTime').textContent = "$" + data.stats.allTime.toFixed(2);

      highlightCurrentRate(data.balance);
      updateRecentActivity(data.recentHistory);
    }
  } catch (error) {
    console.error("Fetch Earning Data Error:", error);
  }
}

/* ================= UPDATE PROFIT PROGRESS ================= */
function updateProfitProgress(data) {
  if (data.canClaim) {
    document.getElementById('profitProgressBar').style.width = "100%";
    document.getElementById('profitProgressText').textContent = "100%";
    return;
  }
  if (data.timeRemaining > 0) {
    const totalTime = 24 * 60 * 60 * 1000;
    const elapsed = totalTime - data.timeRemaining;
    const percentage = Math.min((elapsed / totalTime) * 100, 100);
    document.getElementById('profitProgressBar').style.width = percentage + "%";
    document.getElementById('profitProgressText').textContent = Math.floor(percentage) + "%";
  }
}

/* ================= START COUNTDOWN TIMER ================= */
function startTimer(timeRemaining) {
  if (timerInterval) clearInterval(timerInterval);
  let remaining = timeRemaining;

  function updateTimerDisplay() {
    if (remaining <= 0) {
      clearInterval(timerInterval);
      document.getElementById('timerHours').textContent = "00";
      document.getElementById('timerMinutes').textContent = "00";
      document.getElementById('timerSeconds').textContent = "00";
      fetchEarningData();
      return;
    }
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    document.getElementById('timerHours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('timerMinutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('timerSeconds').textContent = seconds.toString().padStart(2, '0');

    const totalTime = 24 * 60 * 60 * 1000;
    const elapsed = totalTime - remaining;
    const percentage = Math.min((elapsed / totalTime) * 100, 100);
    document.getElementById('profitProgressBar').style.width = percentage + "%";
    document.getElementById('profitProgressText').textContent = Math.floor(percentage) + "%";

    remaining -= 1000;
  }

  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

/* ================= CHECK PROFIT ================= */
async function checkProfit() {
  if (!checkAuth()) return;
  try {
    const response = await fetch("/api/user/check-profit", { method: "GET", headers: getAuthHeaders() });
    const data = await response.json();
    if (handleAuthError(data)) return;

    if (data.success) {
      document.getElementById('profitRate').textContent = data.rate + "%";
      document.getElementById('profitBasedOn').textContent = "$" + data.balance.toFixed(2);
      document.getElementById('todayProfit').textContent = "$" + data.dailyProfit.toFixed(2);
      document.getElementById('claimAmount').textContent = "$" + data.dailyProfit.toFixed(2);

      if (data.balance <= 0) { alert("❌ Your balance is $0.00. No profit available."); return; }

      if (data.canClaim) {
        alert(`📊 Your profit is ready!\n\nRate: ${data.rate}%\nBalance: $${data.balance.toFixed(2)}\nProfit: $${data.dailyProfit.toFixed(2)}\n\nClick "Claim" to collect!`);
        document.getElementById('claimProfitBtn').disabled = false;
      } else {
        const hours = Math.floor(data.timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((data.timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        alert(`⏳ Next profit available in ${hours}h ${minutes}m\n\nRate: ${data.rate}%\nExpected Profit: $${data.dailyProfit.toFixed(2)}`);
      }
    } else {
      alert("❌ " + data.message);
    }
  } catch (error) {
    alert("❌ Server not responding!");
  }
}

/* ================= CLAIM PROFIT ================= */
async function claimProfit() {
  if (!checkAuth()) return;
  try {
    const response = await fetch("/api/user/claim-profit", { method: "POST", headers: getAuthHeaders() });
    const data = await response.json();
    if (handleAuthError(data)) return;

    if (data.success) {
      alert(`✅ ${data.message}\n\nProfit: $${data.profit.toFixed(2)}\nTotal Profit: $${data.totalProfit.toFixed(2)}`);
      document.getElementById('claimProfitBtn').disabled = true;
      fetchEarningData();
    } else {
      if (data.timeRemaining) {
        const hours = Math.floor(data.timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((data.timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        alert(`⏳ ${data.message}\n\nNext profit in: ${hours}h ${minutes}m`);
      } else {
        alert("❌ " + data.message);
      }
    }
  } catch (error) {
    alert("❌ Server not responding!");
  }
}

/* ================= TRANSFER PROFIT TO BALANCE ================= */
async function transferProfit() {
  if (!checkAuth()) return;
  const amount = parseFloat(document.getElementById('transferAmount').value);
  const transferMsg = document.getElementById('transferMsg');
  transferMsg.textContent = '';

  if (!amount || isNaN(amount)) { transferMsg.textContent = '❌ Please enter a valid amount'; transferMsg.style.color = '#ef4444'; return; }
  if (amount < 30) { transferMsg.textContent = '❌ Minimum transfer amount is $30'; transferMsg.style.color = '#ef4444'; return; }
  if (currentEarningData && amount > currentEarningData.totalProfit) { transferMsg.textContent = '❌ Insufficient profit balance'; transferMsg.style.color = '#ef4444'; return; }

  transferMsg.textContent = 'Transferring...';
  transferMsg.style.color = '#3498db';

  try {
    const response = await fetch("/api/user/transfer-profit", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount })
    });
    const data = await response.json();
    if (handleAuthError(data)) return;

    if (data.success) {
      transferMsg.textContent = `✅ ${data.message}`;
      transferMsg.style.color = '#2ecc71';
      document.getElementById('transferAmount').value = '';
      fetchEarningData();
      alert(`✅ $${amount.toFixed(2)} transferred to balance!\n\nNew Balance: $${data.newBalance.toFixed(2)}\nRemaining Profit: $${data.newTotalProfit.toFixed(2)}`);
    } else {
      transferMsg.textContent = `❌ ${data.message}`;
      transferMsg.style.color = '#ef4444';
    }
  } catch (error) {
    transferMsg.textContent = '❌ Server not responding!';
    transferMsg.style.color = '#ef4444';
  }
}

/* ================= FETCH REWARD ================= */
async function fetchReward() {
  if (!checkAuth()) return;
  try {
    const response = await fetch("/api/user/reward", { method: "GET", headers: getAuthHeaders() });
    const data = await response.json();
    if (handleAuthError(data)) return;

    if (data.success && data.hasReward) {
      const reward = data.reward;
      if (!reward.confirmed) {
        showRewardNotification(reward);
      } else if (reward.approvalStatus === 'pending') {
        showRewardWaiting(reward);
      } else if (reward.approvalStatus === 'approved') {
        showRewardApproved(reward);
      } else if (reward.approvalStatus === 'rejected') {
        showRewardRejected(reward);
      } else {
        showRewardInProgress(reward);
      }
    } else {
      document.getElementById('rewardNotification').style.display = 'none';
      document.getElementById('rewardBox').style.display = 'none';
    }
  } catch (error) {
    console.error("Fetch Reward Error:", error);
  }
}

/* ================= SHOW REWARD NOTIFICATION ================= */
function showRewardNotification(reward) {
  document.getElementById('rewardNotification').style.display = 'flex';
  document.getElementById('rewardBox').style.display = 'none';
  document.getElementById('rewardNotifMessage').textContent = reward.message;
}

/* ================= SHOW REWARD IN PROGRESS ================= */
function showRewardInProgress(reward) {
  document.getElementById('rewardNotification').style.display = 'none';
  document.getElementById('rewardBox').style.display = 'block';
  document.getElementById('rewardInProgress').style.display = 'block';
  document.getElementById('rewardWaiting').style.display = 'none';
  document.getElementById('rewardApproved').style.display = 'none';
  document.getElementById('rewardRejected').style.display = 'none';

  document.getElementById('rewardMessage').textContent = reward.message;
  document.getElementById('standardAmount').textContent = "$" + reward.standardAmount.toFixed(2);
  document.getElementById('rewardAmount').textContent = "$" + reward.rewardAmount.toFixed(2);
  document.getElementById('completedAmount').textContent = "$" + reward.completedAmount.toFixed(2);
  document.getElementById('requirementAmount').textContent = "$" + reward.requirement.toFixed(2);
  document.getElementById('withdrawableAmount').textContent = "$" + (reward.withdrawableAmount || 0).toFixed(2);

  // Timer
  if (reward.confirmedAt) {
    const endTime = new Date(new Date(reward.confirmedAt).getTime() + (reward.timeLimit * 60 * 60 * 1000));
    const timeLeft = endTime - new Date();
    if (timeLeft > 0) {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      document.getElementById('rewardTimeLeft').textContent = `${days}d ${hours}h ${minutes}m`;
      document.getElementById('rewardTimeLeft').style.color = "#ffffff";
    } else {
      document.getElementById('rewardTimeLeft').textContent = "Time expired";
      document.getElementById('rewardTimeLeft').style.color = "#ef4444";
    }
  }

  // Progress based on completedAmount vs standardAmount
  const progress = reward.standardAmount > 0
    ? Math.min((reward.completedAmount / reward.standardAmount) * 100, 100)
    : 0;
  document.getElementById('rewardProgressBar').style.width = progress + "%";
  document.getElementById('rewardProgressBar').style.background = "linear-gradient(90deg, #f59e0b, #f97316)";
  document.getElementById('rewardProgressText').textContent = Math.floor(progress) + "%";

  const statusEl = document.getElementById('rewardStatus');
  const claimBtn = document.getElementById('claimRewardBtn');

  // Claim allowed when completedAmount >= standardAmount
  if (reward.completed && !reward.claimed) {
    claimBtn.style.display = 'block';
    statusEl.textContent = "Completed ✅";
    statusEl.style.color = "#2ecc71";
    statusEl.style.background = "rgba(46, 204, 113, 0.15)";
  } else {
    claimBtn.style.display = 'none';
    statusEl.textContent = "In Progress ⏳";
    statusEl.style.color = "#f59e0b";
    statusEl.style.background = "rgba(245, 158, 11, 0.15)";
  }
}

/* ================= SHOW REWARD WAITING ================= */
function showRewardWaiting(reward) {
  document.getElementById('rewardNotification').style.display = 'none';
  document.getElementById('rewardBox').style.display = 'block';
  document.getElementById('rewardInProgress').style.display = 'none';
  document.getElementById('rewardWaiting').style.display = 'block';
  document.getElementById('rewardApproved').style.display = 'none';
  document.getElementById('rewardRejected').style.display = 'none';
  document.getElementById('waitingRewardAmount').textContent = "$" + reward.rewardAmount.toFixed(2);
  document.getElementById('waitingWithdrawable').textContent = "$" + (reward.withdrawableAmount || 0).toFixed(2);
}

/* ================= SHOW REWARD APPROVED ================= */
function showRewardApproved(reward) {
  document.getElementById('rewardNotification').style.display = 'none';
  document.getElementById('rewardBox').style.display = 'block';
  document.getElementById('rewardInProgress').style.display = 'none';
  document.getElementById('rewardWaiting').style.display = 'none';
  document.getElementById('rewardApproved').style.display = 'block';
  document.getElementById('rewardRejected').style.display = 'none';
  document.getElementById('approvedRewardAmount').textContent = "$" + reward.rewardAmount.toFixed(2);
}

/* ================= SHOW REWARD REJECTED ================= */
function showRewardRejected() {
  document.getElementById('rewardNotification').style.display = 'none';
  document.getElementById('rewardBox').style.display = 'block';
  document.getElementById('rewardInProgress').style.display = 'none';
  document.getElementById('rewardWaiting').style.display = 'none';
  document.getElementById('rewardApproved').style.display = 'none';
  document.getElementById('rewardRejected').style.display = 'block';
}

/* ================= CONFIRM REWARD (No popup - direct show reward) ================= */
async function confirmReward() {
  if (!checkAuth()) return;
  try {
    const response = await fetch("/api/user/confirm-reward", { method: "POST", headers: getAuthHeaders() });
    const data = await response.json();
    if (handleAuthError(data)) return;

    if (data.success) {
      // Hide notification immediately, fetch and show reward box
      document.getElementById('rewardNotification').style.display = 'none';
      fetchReward();
      fetchEarningData();
    } else {
      alert("❌ " + data.message);
    }
  } catch (error) {
    alert("❌ Server not responding!");
  }
}

/* ================= CLAIM REWARD ================= */
async function claimReward() {
  if (!checkAuth()) return;
  try {
    const response = await fetch("/api/user/claim-reward", { method: "POST", headers: getAuthHeaders() });
    const data = await response.json();
    if (handleAuthError(data)) return;

    if (data.success) {
      alert("✅ Reward claimed!\n\nYour request has been sent to admin for approval.");
      fetchReward();
    } else {
      alert("❌ " + data.message);
    }
  } catch (error) {
    alert("❌ Server not responding!");
  }
}

/* ================= HIGHLIGHT CURRENT RATE ================= */
function highlightCurrentRate(balance) {
  document.querySelectorAll('.rate-row').forEach(row => row.classList.remove('active'));

  let activeId = 'rate-0-1000';
  if (balance >= 5000000) activeId = 'rate-5000000';
  else if (balance >= 1000000) activeId = 'rate-1000000-5000000';
  else if (balance >= 500000) activeId = 'rate-500000-1000000';
  else if (balance >= 100000) activeId = 'rate-100000-500000';
  else if (balance >= 50000) activeId = 'rate-50000-100000';
  else if (balance >= 20000) activeId = 'rate-20000-50000';
  else if (balance >= 10000) activeId = 'rate-10000-20000';
  else if (balance >= 5000) activeId = 'rate-5000-10000';
  else if (balance >= 2000) activeId = 'rate-2000-5000';
  else if (balance >= 1000) activeId = 'rate-1000-2000';

  const activeRow = document.getElementById(activeId);
  if (activeRow) {
    activeRow.classList.add('active');
    const rateValue = activeRow.querySelector('.rate-value');
    if (rateValue && !rateValue.textContent.includes('←')) {
      rateValue.textContent = rateValue.textContent + ' ← You';
    }
  }
}

/* ================= UPDATE RECENT ACTIVITY ================= */
function updateRecentActivity(history) {
  const activityList = document.getElementById('activityList');
  if (!history || history.length === 0) {
    activityList.innerHTML = '<p class="no-activity">No activity yet</p>';
    return;
  }

  activityList.innerHTML = '';
  history.slice(0, 5).forEach(item => {
    let icon = '', iconClass = '', title = '', amountClass = '', amountPrefix = '';
    switch (item.type) {
      case 'profit_claim': icon = '🟢'; iconClass = 'profit'; title = 'Profit Claimed'; amountClass = 'positive'; amountPrefix = '+$'; break;
      case 'transfer': icon = '🔵'; iconClass = 'transfer'; title = 'Transferred to Balance'; amountClass = 'negative'; amountPrefix = '$'; break;
      case 'reward': icon = '🎁'; iconClass = 'reward'; title = 'Reward Claim'; amountClass = 'pending'; amountPrefix = '$'; break;
      default: icon = '⚪'; iconClass = 'profit'; title = 'Transaction'; amountClass = 'positive'; amountPrefix = '$';
    }

    const date = new Date(item.date);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    let dateText = diffDays === 0
      ? 'Today ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : diffDays === 1 ? 'Yesterday' : diffDays + ' days ago';

    activityList.insertAdjacentHTML('beforeend', `
      <div class="activity-item">
        <div class="activity-icon ${iconClass}">${icon}</div>
        <div class="activity-details">
          <p class="activity-title">${title}</p>
          <p class="activity-date">${dateText}</p>
        </div>
        <span class="activity-amount ${amountClass}">${amountPrefix}${item.amount.toFixed(2)}</span>
      </div>
    `);
  });
}

/* ================= LOGOUT ================= */
function logout() {
  ['username', 'balance', 'token', 'loginTime'].forEach(k => localStorage.removeItem(k));
  window.location.href = 'login.html';
}

/* ================= INITIALIZE ================= */
document.addEventListener('DOMContentLoaded', function () {
  loadUserData();
  setInterval(fetchEarningData, 30000);
  setInterval(fetchReward, 30000);
});