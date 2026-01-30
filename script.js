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
    
    // 檢查是否有輸入
    if (!desc || !amount) {
        alert('請輸入項目與金額！');
        return;
    }
    
    // 檢查金額是否為有效數字
    if (isNaN(amount) || parseFloat(amount) <= 0) {
        alert('請輸入有效的金額（大於 0 的數字）！');
        return;
    }
    
    addRecord(desc, amount);
    descInput.value = '';
    amountInput.value = '';
});

// 當點擊匯出按鈕時執行
exportBtn.addEventListener('click', exportToCSV);

// 3. 邏輯區：處理資料存取

// 取得格式化的日期（統一格式：YYYY/MM/DD）
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

// 刪除紀錄功能
function deleteRecord(index) {
    // 彈出視窗確認，避免手滑
    if (!confirm("確定要刪除這筆紀錄嗎？")) return;

    // 1. 取出資料
    const history = JSON.parse(localStorage.getItem('myAccounts')) || [];
    
    // 2. 刪除陣列中指定位置的資料
    history.splice(index, 1);
    
    // 3. 存回 localStorage
    localStorage.setItem('myAccounts', JSON.stringify(history));
    
    // 4. 重新渲染畫面
    renderHistory();
}

// 匯出報表的功能 📊
function exportToCSV() {
    const history = JSON.parse(localStorage.getItem('myAccounts')) || [];
    
    if (history.length === 0) {
        alert("目前沒有紀錄可以匯出喔！");
        return;
    }
    
    // \uFEFF 是為了讓 Excel 正確讀取中文（BOM 標記）
    let csvContent = "\uFEFF日期,項目,金額\n";
    
    history.forEach(item => {
        // 處理項目描述中可能包含的逗號和雙引號
        const safeDesc = `"${item.desc.replace(/"/g, '""')}"`;
        csvContent += `${item.date},${safeDesc},${item.amount}\n`;
    });
    
    // 建立下載連結
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `家庭帳本_${getFormattedDate().replace(/\//g, '')}.csv`;
    link.click();
    
    // 釋放記憶體
    URL.revokeObjectURL(url);
}

// 4. 畫面區：顯示歷史紀錄
function renderHistory() {
    const history = JSON.parse(localStorage.getItem('myAccounts')) || [];
    
    listDiv.innerHTML = '';
    
    // 計算總金額
    let total = 0;
    
    // 如果沒有紀錄，顯示提示訊息
    if (history.length === 0) {
        listDiv.innerHTML = '<p style="color: #999; text-align: center;">尚無任何紀錄</p>';
        // 更新總金額為 0
        if (totalAmountSpan) {
            totalAmountSpan.textContent = '0';
        }
        return;
    }
    
    history.forEach((entry, index) => {
        // 累加總金額
        total += parseFloat(entry.amount);
        
        const recordDiv = document.createElement('div');
        recordDiv.className = 'record-item';
        
        // 格式化金額顯示（加上千分位逗號）
        const formattedAmount = entry.amount.toLocaleString('zh-TW', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        
        recordDiv.innerHTML = `
            <div>
                <span>${entry.date} - ${entry.desc}</span>
                <br>
                <strong>$${formattedAmount}</strong>
            </div>
        `;
        
        // 建立刪除按鈕（使用事件監聽器而非內聯事件）
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '−'; // 使用減號符號
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