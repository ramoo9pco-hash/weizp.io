/* ================= GLOBAL VARIABLES ================= */
let editingRewardId = '';

/* ================= AUTH CHECK ================= */
function checkAdminAuth() {
  const adminToken = localStorage.getItem('adminToken');
  const adminUsername = localStorage.getItem('adminUsername');
  if (!adminToken || !adminUsername) { window.location.href = 'admin-login.html'; return false; }
  return true;
}

/* ================= GET ADMIN AUTH HEADERS ================= */
function getAdminHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + localStorage.getItem('adminToken')
  };
}

/* ================= HANDLE ADMIN AUTH ERROR ================= */
function handleAdminAuthError(data) {
  if (data.authError) {
    alert("⚠️ Admin session expired! Please login again.");
    ['adminToken', 'adminUsername', 'adminLoginTime'].forEach(k => localStorage.removeItem(k));
    window.location.href = 'admin-login.html';
    return true;
  }
  return false;
}

/* ================= SWITCH TABS ================= */
function switchTab(tabName, btn) {
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const selectedContent = document.getElementById(tabName + 'Tab');
  if (selectedContent) selectedContent.classList.add('active');
  btn.classList.add('active');
}

/* ================= ADMIN KEY SECTION ================= */
function saveAdminKey() {
  const keyMsg = document.getElementById('keyMsg');
  keyMsg.textContent = '✅ You are already authenticated via secure login!';
  keyMsg.style.color = '#2ecc71';
}

/* ================= VIEW ALL USERS ================= */
async function viewUsers() {
  if (!checkAdminAuth()) return;
  const usersList = document.getElementById('usersList');
  usersList.innerHTML = '<p class="no-data">Loading users...</p>';

  try {
    const response = await fetch("/api/admin/users", { method: "GET", headers: getAdminHeaders() });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;

    if (data.success) {
      usersList.innerHTML = '';
      if (data.users.length === 0) { usersList.innerHTML = '<p class="no-data">No users found</p>'; return; }

      data.users.forEach(user => {
        const walletText = user.assignedWallet
          ? user.assignedWallet.substring(0, 10) + '...' + user.assignedWallet.substring(user.assignedWallet.length - 6)
          : 'No wallet assigned';

        usersList.insertAdjacentHTML('beforeend', `
          <div class="user-card">
            <h3>👤 ${user.username}</h3>
            <p>Balance: <span class="balance-highlight">$${user.balance.toFixed(2)}</span></p>
            <p>Total Profit: <span class="profit-highlight">$${user.totalProfit ? user.totalProfit.toFixed(2) : '0.00'}</span></p>
            <p>Wallet: <span style="color: #3498db; font-size: 11px;">${walletText}</span></p>
            <p>Joined: ${new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        `);
      });
    } else {
      usersList.innerHTML = `<p class="no-data" style="color: #ef4444;">❌ ${data.message}</p>`;
    }
  } catch (error) {
    usersList.innerHTML = '<p class="no-data" style="color: #ef4444;">❌ Server error.</p>';
  }
}

/* ================= UPDATE USER BALANCE ================= */
async function updateBalance() {
  if (!checkAdminAuth()) return;
  const username = document.getElementById('balanceUsername').value.trim();
  const balance = document.getElementById('balanceAmount').value;
  const balanceMsg = document.getElementById('balanceMsg');
  balanceMsg.textContent = '';

  if (!username || balance === '') { balanceMsg.textContent = '❌ All fields are required'; balanceMsg.style.color = '#ef4444'; return; }
  if (balance < 0) { balanceMsg.textContent = '❌ Balance cannot be negative'; balanceMsg.style.color = '#ef4444'; return; }

  balanceMsg.textContent = 'Updating...';
  balanceMsg.style.color = '#3498db';

  try {
    const response = await fetch("/api/admin/update-balance", {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ username, balance: parseFloat(balance) })
    });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;

    if (data.success) {
      balanceMsg.textContent = `✅ ${data.message} - New Balance: $${data.newBalance.toFixed(2)}`;
      balanceMsg.style.color = '#2ecc71';
      document.getElementById('balanceUsername').value = '';
      document.getElementById('balanceAmount').value = '';
    } else {
      balanceMsg.textContent = `❌ ${data.message}`;
      balanceMsg.style.color = '#ef4444';
    }
  } catch (error) {
    balanceMsg.textContent = '❌ Server error.';
    balanceMsg.style.color = '#ef4444';
  }
}

/* ================= ADD WALLETS TO POOL ================= */
async function addWallets() {
  if (!checkAdminAuth()) return;
  const walletsText = document.getElementById('walletAddresses').value.trim();
  const addWalletMsg = document.getElementById('addWalletMsg');
  addWalletMsg.textContent = '';

  if (!walletsText) { addWalletMsg.textContent = '❌ Please enter wallet addresses'; addWalletMsg.style.color = '#ef4444'; return; }

  const wallets = walletsText.split('\n').map(w => w.trim()).filter(w => w !== '');
  if (wallets.length === 0) { addWalletMsg.textContent = '❌ No valid wallet addresses found'; addWalletMsg.style.color = '#ef4444'; return; }

  addWalletMsg.textContent = 'Adding wallets...';
  addWalletMsg.style.color = '#3498db';

  try {
    const response = await fetch("/api/admin/add-wallets", {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ wallets })
    });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;

    if (data.success) {
      addWalletMsg.textContent = `✅ ${data.message}`;
      addWalletMsg.style.color = '#2ecc71';
      document.getElementById('walletAddresses').value = '';
      viewWallets();
    } else {
      addWalletMsg.textContent = `❌ ${data.message}`;
      addWalletMsg.style.color = '#ef4444';
    }
  } catch (error) {
    addWalletMsg.textContent = '❌ Server error.';
    addWalletMsg.style.color = '#ef4444';
  }
}

/* ================= VIEW ALL WALLETS ================= */
async function viewWallets() {
  if (!checkAdminAuth()) return;
  const walletsList = document.getElementById('walletsList');
  walletsList.innerHTML = '<p class="no-data">Loading wallets...</p>';

  try {
    const response = await fetch("/api/admin/wallets", { method: "GET", headers: getAdminHeaders() });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;

    if (data.success) {
      document.getElementById('totalWallets').textContent = data.stats.total;
      document.getElementById('assignedWallets').textContent = data.stats.assigned;
      document.getElementById('availableWallets').textContent = data.stats.available;
      walletsList.innerHTML = '';

      if (data.wallets.length === 0) { walletsList.innerHTML = '<p class="no-data">No wallets added yet.</p>'; return; }

      data.wallets.forEach(wallet => {
        walletsList.insertAdjacentHTML('beforeend', `
          <div class="wallet-card">
            <div class="wallet-card-header">
              <h3>📋 ERC20 Wallet</h3>
              <span class="wallet-card-status ${wallet.isAssigned ? 'assigned' : 'available'}">${wallet.isAssigned ? '🔒 Assigned' : '✅ Available'}</span>
            </div>
            <p class="wallet-address-text">${wallet.address}</p>
            <p>${wallet.isAssigned ? `Assigned to ${wallet.assignedTo}` : 'Available'}</p>
            ${wallet.assignedAt ? `<p>Assigned: ${new Date(wallet.assignedAt).toLocaleDateString()}</p>` : ''}
          </div>
        `);
      });
    } else {
      walletsList.innerHTML = `<p class="no-data" style="color: #ef4444;">❌ ${data.message}</p>`;
    }
  } catch (error) {
    walletsList.innerHTML = '<p class="no-data" style="color: #ef4444;">❌ Server error.</p>';
  }
}

/* ================= CREATE REWARD ================= */
async function createReward() {
  if (!checkAdminAuth()) return;
  const username = document.getElementById('rewardUsername').value.trim();
  const message = document.getElementById('rewardMessage').value.trim();
  const standardAmount = document.getElementById('standardAmount').value;
  const rewardAmount = document.getElementById('rewardAmount').value;
  const requirementAmount = document.getElementById('requirementAmount').value;
  const timeLimit = document.getElementById('rewardTimeLimit').value;
  const createMsg = document.getElementById('createRewardMsg');
  createMsg.textContent = '';

  if (!username || !message || !rewardAmount || !standardAmount || !requirementAmount || !timeLimit) {
    createMsg.textContent = '❌ All fields are required'; createMsg.style.color = '#ef4444'; return;
  }
  if (rewardAmount <= 0 || standardAmount <= 0 || requirementAmount <= 0 || timeLimit <= 0) {
    createMsg.textContent = '❌ All values must be greater than 0'; createMsg.style.color = '#ef4444'; return;
  }

  createMsg.textContent = 'Creating reward...';
  createMsg.style.color = '#3498db';

  try {
    const response = await fetch("/api/admin/create-reward", {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({
        username, message,
        rewardAmount: parseFloat(rewardAmount),
        standardAmount: parseFloat(standardAmount),
        requirement: parseFloat(requirementAmount),
        timeLimit: parseInt(timeLimit)
      })
    });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;

    if (data.success) {
      createMsg.textContent = `✅ ${data.message}`;
      createMsg.style.color = '#2ecc71';
      document.getElementById('rewardUsername').value = '';
      document.getElementById('rewardMessage').value = '';
      document.getElementById('rewardAmount').value = '';
      document.getElementById('standardAmount').value = '';
      document.getElementById('requirementAmount').value = '';
      document.getElementById('rewardTimeLimit').value = '';
      viewRewards();
    } else {
      createMsg.textContent = `❌ ${data.message}`;
      createMsg.style.color = '#ef4444';
    }
  } catch (error) {
    createMsg.textContent = '❌ Server error.';
    createMsg.style.color = '#ef4444';
  }
}

/* ================= VIEW ALL REWARDS ================= */
async function viewRewards() {
  if (!checkAdminAuth()) return;
  const rewardsList = document.getElementById('rewardsList');
  rewardsList.innerHTML = '<p class="no-data">Loading rewards...</p>';

  try {
    const response = await fetch("/api/admin/rewards", { method: "GET", headers: getAdminHeaders() });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;

    if (data.success) {
      rewardsList.innerHTML = '';
      if (data.rewards.length === 0) { rewardsList.innerHTML = '<p class="no-data">No rewards found</p>'; return; }

      data.rewards.forEach(reward => {
        const progress = reward.standardAmount > 0
          ? Math.min((reward.completedAmount / reward.standardAmount) * 100, 100)
          : 0;

        let statusClass = '', statusText = '';
        if (reward.approvalStatus === 'pending') { statusClass = 'pending'; statusText = 'Pending Approval ⏳'; }
        else if (reward.approvalStatus === 'approved') { statusClass = 'completed'; statusText = 'Approved ✅'; }
        else if (reward.approvalStatus === 'rejected') { statusClass = 'not-confirmed'; statusText = 'Rejected ❌'; }
        else if (reward.confirmed) {
          statusClass = reward.completed ? 'completed' : 'confirmed';
          statusText = reward.completed ? 'Completed ✅' : 'Confirmed ✅';
        } else {
          statusClass = 'not-confirmed'; statusText = 'Not Confirmed ❌';
        }

        let timeLeftText = 'Not started';
        if (reward.confirmedAt) {
          const endTime = new Date(new Date(reward.confirmedAt).getTime() + (reward.timeLimit * 60 * 60 * 1000));
          const timeLeft = endTime - new Date();
          if (timeLeft > 0) {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            timeLeftText = `${days}d ${hours}h left`;
          } else {
            timeLeftText = 'Time expired';
          }
        }

        rewardsList.insertAdjacentHTML('beforeend', `
          <div class="reward-card">
            <div class="reward-card-header">
              <h3>👤 ${reward.username}</h3>
              <span class="reward-card-status ${statusClass}">${statusText}</span>
            </div>
            <div class="reward-card-message">${reward.message}</div>
            <div class="reward-card-details">
              <p>Standard Amount: <span>$${reward.standardAmount.toFixed(2)}</span></p>
              <p>Reward Amount: <span class="profit-highlight">$${reward.rewardAmount.toFixed(2)}</span></p>
              <p>Completed: <span class="balance-highlight">$${reward.completedAmount.toFixed(2)}</span></p>
              <p>Requirement: <span>$${reward.requirement.toFixed(2)}</span></p>
              <p>Withdrawable: <span style="color:#2ecc71; font-weight:700;">$${(reward.withdrawableAmount || 0).toFixed(2)}</span></p>
              <p>Time: <span>${timeLeftText}</span></p>
              <p>Confirmed: <span>${reward.confirmed ? '✅ Yes' : '❌ No'}</span></p>
              <p>Claimed: <span>${reward.claimed ? '✅ Yes' : '❌ No'}</span></p>
            </div>
            <div class="reward-card-progress">
              <div class="reward-progress-bar-container">
                <div class="reward-progress-bar" style="width: ${progress}%"></div>
              </div>
              <p class="reward-progress-text">${Math.floor(progress)}%</p>
            </div>

            <!-- Update Completed Amount inline -->
            <div class="completed-update-section">
              <input type="number" id="completedInput_${reward.id}" placeholder="Set completed amount" step="0.01" value="${reward.completedAmount}" style="width:100%;padding:10px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-size:14px;margin-bottom:8px;outline:none;">
              <button class="update-completed-btn" onclick="updateCompleted('${reward.id}')">
                📊 Update Completed Amount
              </button>
            </div>

            <div class="reward-card-actions">
              <button class="edit-btn" onclick="openEditModal('${reward.id}', '${reward.message.replace(/'/g, "\\'")}', ${reward.rewardAmount}, ${reward.standardAmount}, ${reward.completedAmount}, ${reward.requirement}, ${reward.timeLimit})">
                ✏️ Edit
              </button>
              <button class="delete-btn" onclick="deleteReward('${reward.id}')">
                🗑️ Delete
              </button>
            </div>
          </div>
        `);
      });
    } else {
      rewardsList.innerHTML = `<p class="no-data" style="color: #ef4444;">❌ ${data.message}</p>`;
    }
  } catch (error) {
    rewardsList.innerHTML = '<p class="no-data" style="color: #ef4444;">❌ Server error.</p>';
  }
}

/* ================= UPDATE COMPLETED AMOUNT ================= */
async function updateCompleted(rewardId) {
  if (!checkAdminAuth()) return;
  const input = document.getElementById('completedInput_' + rewardId);
  const completedAmount = parseFloat(input.value);

  if (isNaN(completedAmount) || completedAmount < 0) {
    alert('❌ Please enter a valid amount'); return;
  }

  try {
    const response = await fetch("/api/admin/update-completed", {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ rewardId, completedAmount })
    });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;

    if (data.success) {
      alert(`✅ ${data.message}${data.completed ? '\n\n🎉 Reward is now completed! User can claim.' : ''}`);
      viewRewards();
    } else {
      alert(`❌ ${data.message}`);
    }
  } catch (error) {
    alert('❌ Server error.');
  }
}

/* ================= OPEN EDIT MODAL ================= */
function openEditModal(rewardId, message, rewardAmount, standardAmount, completedAmount, requirement, timeLimit) {
  editingRewardId = rewardId;
  document.getElementById('editRewardMessage').value = message;
  document.getElementById('editStandardAmount').value = standardAmount;
  document.getElementById('editRewardAmount').value = rewardAmount;
  document.getElementById('editCompletedAmount').value = completedAmount;
  document.getElementById('editRequirementAmount').value = requirement;
  document.getElementById('editTimeLimit').value = timeLimit;
  document.getElementById('editRewardMsg').textContent = '';
  document.getElementById('editModal').style.display = 'flex';
}

/* ================= CLOSE EDIT MODAL ================= */
function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  editingRewardId = '';
}

/* ================= SAVE EDIT REWARD ================= */
async function saveEditReward() {
  if (!checkAdminAuth()) return;
  const message = document.getElementById('editRewardMessage').value.trim();
  const rewardAmount = document.getElementById('editRewardAmount').value;
  const standardAmount = document.getElementById('editStandardAmount').value;
  const completedAmount = document.getElementById('editCompletedAmount').value;
  const requirementAmount = document.getElementById('editRequirementAmount').value;
  const timeLimit = document.getElementById('editTimeLimit').value;
  const editMsg = document.getElementById('editRewardMsg');
  editMsg.textContent = '';

  if (!message || !rewardAmount || !standardAmount || !requirementAmount || !timeLimit) {
    editMsg.textContent = '❌ All fields are required'; editMsg.style.color = '#ef4444'; return;
  }

  editMsg.textContent = 'Saving...';
  editMsg.style.color = '#3498db';

  try {
    // Save main reward fields
    const response = await fetch("/api/admin/edit-reward", {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({
        rewardId: editingRewardId,
        message,
        rewardAmount: parseFloat(rewardAmount),
        standardAmount: parseFloat(standardAmount),
        requirement: parseFloat(requirementAmount),
        timeLimit: parseInt(timeLimit)
      })
    });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;

    // Also update completed amount
    if (completedAmount !== '' && !isNaN(parseFloat(completedAmount))) {
      await fetch("/api/admin/update-completed", {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ rewardId: editingRewardId, completedAmount: parseFloat(completedAmount) })
      });
    }

    if (data.success) {
      editMsg.textContent = `✅ ${data.message}`;
      editMsg.style.color = '#2ecc71';
      setTimeout(() => { closeEditModal(); viewRewards(); }, 1000);
    } else {
      editMsg.textContent = `❌ ${data.message}`;
      editMsg.style.color = '#ef4444';
    }
  } catch (error) {
    editMsg.textContent = '❌ Server error.';
    editMsg.style.color = '#ef4444';
  }
}

/* ================= DELETE REWARD ================= */
async function deleteReward(rewardId) {
  if (!checkAdminAuth()) return;
  if (!confirm('⚠️ Are you sure you want to delete this reward?')) return;

  try {
    const response = await fetch("/api/admin/delete-reward", {
      method: 'POST', headers: getAdminHeaders(),
      body: JSON.stringify({ rewardId })
    });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;
    if (data.success) { alert(`✅ ${data.message}`); viewRewards(); }
    else alert(`❌ ${data.message}`);
  } catch (error) {
    alert('❌ Server error.');
  }
}

/* ================= VIEW WITHDRAW REQUESTS ================= */
async function viewWithdrawals() {
  if (!checkAdminAuth()) return;
  const withdrawalsList = document.getElementById('withdrawalsList');
  withdrawalsList.innerHTML = '<p class="no-data">Loading requests...</p>';

  try {
    const response = await fetch("/api/admin/withdrawals", { method: "GET", headers: getAdminHeaders() });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;

    if (data.success) {
      withdrawalsList.innerHTML = '';
      if (data.withdrawals.length === 0) { withdrawalsList.innerHTML = '<p class="no-data">No withdrawal requests</p>'; return; }

      data.withdrawals.forEach(withdrawal => {
        let statusClass = '', statusText = '';
        switch (withdrawal.status) {
          case 'pending': statusClass = 'pending'; statusText = 'Pending ⏳'; break;
          case 'approved': statusClass = 'approved'; statusText = 'Approved ✅'; break;
          case 'rejected': statusClass = 'rejected'; statusText = 'Rejected ❌'; break;
        }

        const actionsHtml = withdrawal.status === 'pending' ? `
          <div class="withdrawal-card-actions">
            <button class="approve-btn" onclick="approveWithdraw('${withdrawal._id}', '${withdrawal.username}', ${withdrawal.amount})">✅ Approve</button>
            <button class="reject-btn" onclick="rejectWithdraw('${withdrawal._id}', '${withdrawal.username}', ${withdrawal.amount})">❌ Reject</button>
          </div>
        ` : '';

        withdrawalsList.insertAdjacentHTML('beforeend', `
          <div class="withdrawal-card">
            <div class="withdrawal-card-header">
              <h3>👤 ${withdrawal.username}</h3>
              <span class="withdrawal-card-status ${statusClass}">${statusText}</span>
            </div>
            <div class="withdrawal-card-details">
              <p>Amount: <span class="balance-highlight">$${withdrawal.amount.toFixed(2)}</span></p>
              <p>Network: <span>ERC20</span></p>
              <p>Wallet: <span class="withdrawal-wallet-address">${withdrawal.walletAddress}</span></p>
              <p>Requested: <span>${new Date(withdrawal.createdAt).toLocaleString()}</span></p>
              <p>Processed: <span>${withdrawal.processedAt ? new Date(withdrawal.processedAt).toLocaleString() : 'Not processed'}</span></p>
            </div>
            ${actionsHtml}
          </div>
        `);
      });
    } else {
      withdrawalsList.innerHTML = `<p class="no-data" style="color: #ef4444;">❌ ${data.message}</p>`;
    }
  } catch (error) {
    withdrawalsList.innerHTML = '<p class="no-data" style="color: #ef4444;">❌ Server error.</p>';
  }
}

/* ================= APPROVE WITHDRAW ================= */
async function approveWithdraw(withdrawId, username, amount) {
  if (!checkAdminAuth()) return;
  if (!confirm(`✅ Approve withdrawal for ${username}?\n\nAmount: $${amount.toFixed(2)} USDT`)) return;

  try {
    const response = await fetch("/api/admin/approve-withdraw", {
      method: 'POST', headers: getAdminHeaders(),
      body: JSON.stringify({ withdrawId })
    });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;
    if (data.success) { alert(`✅ ${data.message}`); viewWithdrawals(); }
    else alert(`❌ ${data.message}`);
  } catch (error) {
    alert('❌ Server error.');
  }
}

/* ================= REJECT WITHDRAW ================= */
async function rejectWithdraw(withdrawId, username, amount) {
  if (!checkAdminAuth()) return;
  if (!confirm(`❌ Reject withdrawal for ${username}?\n\nAmount: $${amount.toFixed(2)} USDT\n\nBalance will be restored.`)) return;

  try {
    const response = await fetch("/api/admin/reject-withdraw", {
      method: 'POST', headers: getAdminHeaders(),
      body: JSON.stringify({ withdrawId })
    });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;
    if (data.success) { alert(`✅ ${data.message}`); viewWithdrawals(); }
    else alert(`❌ ${data.message}`);
  } catch (error) {
    alert('❌ Server error.');
  }
}

/* ================= VIEW APPROVAL REQUESTS ================= */
async function viewApprovals() {
  if (!checkAdminAuth()) return;
  const approvalsList = document.getElementById('approvalsList');
  approvalsList.innerHTML = '<p class="no-data">Loading requests...</p>';

  try {
    const response = await fetch("/api/admin/rewards", { method: "GET", headers: getAdminHeaders() });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;

    if (data.success) {
      const pendingRewards = data.rewards.filter(r => r.approvalStatus === 'pending');
      approvalsList.innerHTML = '';

      if (pendingRewards.length === 0) { approvalsList.innerHTML = '<p class="no-data">No pending approval requests</p>'; return; }

      pendingRewards.forEach(reward => {
        approvalsList.insertAdjacentHTML('beforeend', `
          <div class="approval-card">
            <div class="approval-card-header">
              <h3>👤 ${reward.username}</h3>
              <span class="reward-card-status pending">Pending ⏳</span>
            </div>
            <div class="approval-card-details">
              <p>Standard Amount: <span>$${reward.standardAmount.toFixed(2)}</span></p>
              <p>Reward Amount: <span class="profit-highlight">$${reward.rewardAmount.toFixed(2)}</span></p>
              <p>Completed: <span class="balance-highlight">$${reward.completedAmount.toFixed(2)}</span></p>
              <p>Withdrawable: <span style="color:#2ecc71;font-weight:700;">$${(reward.withdrawableAmount || 0).toFixed(2)}</span></p>
              <p>Requirement: <span>$${reward.requirement.toFixed(2)}</span></p>
              <p>Claimed At: <span>${reward.claimedAt ? new Date(reward.claimedAt).toLocaleString() : 'N/A'}</span></p>
              <p>Message: <span>${reward.message}</span></p>
            </div>
            <div class="approval-card-actions">
              <button class="approve-btn" onclick="approveReward('${reward.id}', '${reward.username}', ${reward.rewardAmount})">✅ Approve</button>
              <button class="reject-btn" onclick="rejectReward('${reward.id}', '${reward.username}')">❌ Reject</button>
            </div>
          </div>
        `);
      });
    } else {
      approvalsList.innerHTML = `<p class="no-data" style="color: #ef4444;">❌ ${data.message}</p>`;
    }
  } catch (error) {
    approvalsList.innerHTML = '<p class="no-data" style="color: #ef4444;">❌ Server error.</p>';
  }
}

/* ================= APPROVE REWARD ================= */
async function approveReward(rewardId, username, amount) {
  if (!checkAdminAuth()) return;
  if (!confirm(`✅ Approve reward for ${username}?\n\n$${amount.toFixed(2)} will be added to their balance.`)) return;

  try {
    const response = await fetch("/api/admin/approve-reward", {
      method: 'POST', headers: getAdminHeaders(),
      body: JSON.stringify({ rewardId })
    });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;
    if (data.success) { alert(`✅ ${data.message}`); viewApprovals(); viewRewards(); }
    else alert(`❌ ${data.message}`);
  } catch (error) {
    alert('❌ Server error.');
  }
}

/* ================= REJECT REWARD ================= */
async function rejectReward(rewardId, username) {
  if (!checkAdminAuth()) return;
  if (!confirm(`❌ Reject reward for ${username}?`)) return;

  try {
    const response = await fetch("/api/admin/reject-reward", {
      method: 'POST', headers: getAdminHeaders(),
      body: JSON.stringify({ rewardId })
    });
    const data = await response.json();
    if (handleAdminAuthError(data)) return;
    if (data.success) { alert(`✅ ${data.message}`); viewApprovals(); viewRewards(); }
    else alert(`❌ ${data.message}`);
  } catch (error) {
    alert('❌ Server error.');
  }
}

/* ================= ADMIN LOGOUT ================= */
function adminLogout() {
  ['adminToken', 'adminUsername', 'adminLoginTime'].forEach(k => localStorage.removeItem(k));
  window.location.href = 'admin-login.html';
}

/* ================= INITIALIZE ================= */
document.addEventListener('DOMContentLoaded', function () {
  if (!checkAdminAuth()) return;

  const adminUsername = localStorage.getItem('adminUsername');
  const adminKeyCard = document.querySelector('.admin-key-card');
  if (adminKeyCard) {
    adminKeyCard.innerHTML = `
      <h2>🔐 Admin Session</h2>
      <p style="color: #2ecc71; margin-bottom: 15px;">✅ Logged in as: <strong>${adminUsername}</strong></p>
      <p style="color: #94a3b8; font-size: 12px; margin-bottom: 15px;">⏰ Session expires in 8 hours</p>
      <button class="save-key-btn" onclick="adminLogout()" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
        🚪 Logout Admin
      </button>
    `;
  }
});