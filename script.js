// ==================== script.js ====================

// 1. 宣告區：選取 HTML 元素
const descInput = document.getElementById('desc');
const amountInput = document.getElementById('amount');
const addBtn = document.getElementById('add-btn');
const exportBtn = document.getElementById('export-btn');
const listDiv = document.getElementById('list');
const totalAmountSpan = document.getElementById('total-amount');

// 2. 互動區：設定按鈕指令
addBtn.addEventListener('click', () => {
    const desc = descInput.value.trim();
    const amount = amountInput.value.trim();
    
    if (!desc || !amount) {
        alert('請輸入項目與金額！');
        return;
    }
    
    if (isNaN(amount) || parseFloat(amount) <= 0) {
        alert('請輸入有效的金額（大於 0 的數字）！');
        return;
    }
    
    addRecord(desc, amount);
    descInput.value = '';
    amountInput.value = '';
});

exportBtn.addEventListener('click', exportToCSV);

// 3. 邏輯區：處理資料存取

function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

function addRecord(desc, amount) {
    const history = JSON.parse(localStorage.getItem('myAccounts')) || [];
    
    const newEntry = {
        desc: desc,
        amount: parseFloat(amount),
        date: getFormattedDate()
    };
    
    history.push(newEntry);
    localStorage.setItem('myAccounts', JSON.stringify(history));
    renderHistory();
}

function deleteRecord(index) {
    if (!confirm("確定要刪除這筆紀錄嗎？")) return;

    const history = JSON.parse(localStorage.getItem('myAccounts')) || [];
    history.splice(index, 1);
    localStorage.setItem('myAccounts', JSON.stringify(history));
    renderHistory();
}

function exportToCSV() {
    const history = JSON.parse(localStorage.getItem('myAccounts')) || [];
    
    if (history.length === 0) {
        alert("目前沒有紀錄可以匯出喔！");
        return;
    }
    
    let csvContent = "\uFEFF日期,項目,金額\n";
    
    history.forEach(item => {
        const safeDesc = `"${item.desc.replace(/"/g, '""')}"`;
        csvContent += `${item.date},${safeDesc},${item.amount}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `家庭帳本_${getFormattedDate().replace(/\//g, '')}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// 4. 畫面區：顯示歷史紀錄
// 👇 renderHistory() 放在這裡！
function renderHistory() {
    const history = JSON.parse(localStorage.getItem('myAccounts')) || [];
    
    listDiv.innerHTML = '';
    
    // 計算總金額
    let total = 0;
    
    // 如果沒有紀錄，顯示提示訊息
    if (history.length === 0) {
        listDiv.innerHTML = '<p style="color: #999; text-align: center;">尚無任何紀錄</p>';
        if (totalAmountSpan) {
            totalAmountSpan.textContent = '0';
        }
        return;
    }
    
    history.forEach((entry, index) => {
        total += parseFloat(entry.amount);
        
        const recordDiv = document.createElement('div');
        recordDiv.className = 'record-item';
        
        const formattedAmount = entry.amount.toLocaleString('zh-TW', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        
        recordDiv.innerHTML = `
            <div>
                <span>${entry.date} - ${entry.desc}</span>
                <strong>$${formattedAmount}</strong>
            </div>
        `;
        
        // 建立刪除按鈕（使用減號）
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '−';
        deleteBtn.setAttribute('aria-label', '刪除此筆紀錄');
        deleteBtn.addEventListener('click', () => deleteRecord(index));
        
        recordDiv.appendChild(deleteBtn);
        listDiv.appendChild(recordDiv);
    });
    
    // 更新總金額顯示
    if (totalAmountSpan) {
        totalAmountSpan.textContent = total.toLocaleString('zh-TW', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }
}

// 5. 啟動區
window.addEventListener('load', () => {
    // 渲染歷史紀錄
    renderHistory();
    
    // Service Worker 註冊（PWA 支援）
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('守衛已就位！🛡️', registration.scope);
            })
            .catch((err) => {
                console.error('守衛啟動失敗：', err);
            });
    }
});
```

## 🎯 重點說明

### renderHistory() 的位置邏輯：

1. **在「畫面區」（第 4 部分）**：因為它負責顯示資料到畫面上
2. **在 deleteRecord() 之後**：因為刪除後會呼叫 renderHistory()
3. **在啟動區之前**：因為啟動時會執行 renderHistory()

### 為什麼要這樣安排？
```
宣告 → 互動 → 邏輯 → 畫面 → 啟動
  ↓      ↓      ↓      ↓      ↓
變數   按鈕   資料   顯示   執行