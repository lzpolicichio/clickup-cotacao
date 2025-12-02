// Quote management system for ClickUp licenses and addons
// Uses CONFIG from config.js

// Quote state
let quoteItems = [];
let quoteIdCounter = 1;

// Storage Manager for persistence
const StorageManager = {
    STORAGE_KEY: 'clickup_quotes_history',
    CURRENT_KEY: 'clickup_current_quote',
    
    // Save current quote to localStorage (auto-save)
    saveCurrentQuote() {
        const currentData = {
            items: quoteItems,
            counter: quoteIdCounter,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(this.CURRENT_KEY, JSON.stringify(currentData));
    },
    
    // Load current quote from localStorage
    loadCurrentQuote() {
        const data = localStorage.getItem(this.CURRENT_KEY);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                quoteItems = parsed.items || [];
                quoteIdCounter = parsed.counter || 1;
                return true;
            } catch (e) {
                console.error('Error loading quote:', e);
                return false;
            }
        }
        return false;
    },
    
    // Clear current quote
    clearCurrentQuote() {
        localStorage.removeItem(this.CURRENT_KEY);
    },
    
    // Save named quote to history
    saveToHistory(name) {
        if (quoteItems.length === 0) {
            alert('Adicione itens à cotação antes de salvar');
            return null;
        }
        
        const history = this.getHistory();
        const quoteTotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
        
        const savedQuote = {
            id: Date.now(),
            name: name || `Cotação ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`,
            items: JSON.parse(JSON.stringify(quoteItems)), // Deep copy
            total: quoteTotal,
            timestamp: new Date().toISOString(),
            itemCount: quoteItems.length
        };
        
        history.unshift(savedQuote);
        
        // Keep only last 50 quotes
        if (history.length > 50) {
            history.length = 50;
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        return savedQuote;
    },
    
    // Get all saved quotes
    getHistory() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },
    
    // Load a quote from history
    loadFromHistory(id) {
        const history = this.getHistory();
        const quote = history.find(q => q.id === id);
        if (quote) {
            quoteItems = JSON.parse(JSON.stringify(quote.items)); // Deep copy
            quoteIdCounter = Math.max(...quoteItems.map(i => i.id), 0) + 1;
            this.saveCurrentQuote();
            renderQuote();
            showNotification('Cotação carregada com sucesso!');
            return true;
        }
        return false;
    },
    
    // Delete quote from history
    deleteFromHistory(id) {
        const history = this.getHistory();
        const filtered = history.filter(q => q.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
        renderHistory();
        showNotification('Cotação excluída');
    }
};

// Get quantity-based discount
function getQuantityDiscount(quantity) {
    const tier = CONFIG.quantityDiscounts.find(t => quantity >= t.min && quantity <= t.max);
    return tier ? tier.discount : 0;
}

// Format currency in USD
function formatCurrency(value) {
    return new Intl.NumberFormat(CONFIG.currency.locale, {
        style: 'currency',
        currency: CONFIG.currency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Calculate license item
function calculateLicenseItem(data) {
    const license = CONFIG.licenses[data.licenseType];
    const contract = CONFIG.contractDurations[data.contractDuration];
    
    // Calculate base price (monthly in USD)
    let monthlyPrice = license.basePrice * data.quantity;
    
    // Apply contract duration multiplier
    monthlyPrice *= contract.multiplier;
    
    // Total for contract period
    const baseTotal = monthlyPrice * contract.months;
    const subtotal = baseTotal;
    
    // Apply quantity discount
    const quantityDiscount = getQuantityDiscount(data.quantity);
    
    // Apply commercial discount
    const commercialDiscount = data.discountLevel;
    
    // Total discount (cumulative)
    const totalDiscountRate = (quantityDiscount + commercialDiscount - (quantityDiscount * commercialDiscount / 100));
    const discountAmount = subtotal * (totalDiscountRate / 100);
    
    // Final total
    const total = subtotal - discountAmount;
    const monthlyAverage = total / contract.months;
    const perUserPerMonth = monthlyAverage / data.quantity;
    
    return {
        id: quoteIdCounter++,
        type: 'license',
        name: license.name,
        description: license.description,
        contract: contract,
        quantity: data.quantity,
        baseTotal: baseTotal,
        subtotal: subtotal,
        quantityDiscount: quantityDiscount,
        commercialDiscount: commercialDiscount,
        totalDiscountRate: totalDiscountRate,
        discountAmount: discountAmount,
        total: total,
        monthlyAverage: monthlyAverage,
        perUserPerMonth: perUserPerMonth
    };
}

// Calculate addon item
function calculateAddonItem(data) {
    const addon = CONFIG.addons[data.addonType];
    const contract = CONFIG.contractDurations[data.contractDuration];
    
    // Calculate addon price (monthly in USD)
    let monthlyPrice = addon.pricePerUser * data.quantity;
    
    // Apply contract duration multiplier
    monthlyPrice *= contract.multiplier;
    
    // Total for contract period
    const baseTotal = monthlyPrice * contract.months;
    const subtotal = baseTotal;
    
    // Apply quantity discount
    const quantityDiscount = getQuantityDiscount(data.quantity);
    
    // Apply commercial discount
    const commercialDiscount = data.discountLevel;
    
    // Total discount (cumulative)
    const totalDiscountRate = (quantityDiscount + commercialDiscount - (quantityDiscount * commercialDiscount / 100));
    const discountAmount = subtotal * (totalDiscountRate / 100);
    
    // Final total
    const total = subtotal - discountAmount;
    const monthlyAverage = total / contract.months;
    const perUserPerMonth = monthlyAverage / data.quantity;
    
    return {
        id: quoteIdCounter++,
        type: 'addon',
        name: addon.name,
        description: addon.description,
        contract: contract,
        quantity: data.quantity,
        baseTotal: baseTotal,
        subtotal: subtotal,
        quantityDiscount: quantityDiscount,
        commercialDiscount: commercialDiscount,
        totalDiscountRate: totalDiscountRate,
        discountAmount: discountAmount,
        total: total,
        monthlyAverage: monthlyAverage,
        perUserPerMonth: perUserPerMonth
    };
}

// Add item to quote
function addToQuote() {
    const productType = document.getElementById('productType').value;
    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    const contractDuration = document.getElementById('contractDuration').value;
    const discountLevel = parseFloat(document.getElementById('discountLevel').value) || 0;
    
    // Validation
    if (quantity < 1) {
        alert('Por favor, informe uma quantidade válida');
        return;
    }
    
    if (discountLevel < 0 || discountLevel > 100) {
        alert('O desconto deve estar entre 0 e 100%');
        return;
    }
    
    let item;
    
    if (productType === 'license') {
        const licenseType = document.getElementById('licenseType').value;
        
        if (!licenseType) {
            alert('Por favor, selecione um tipo de licença');
            return;
        }
        
        item = calculateLicenseItem({
            licenseType,
            quantity,
            contractDuration,
            discountLevel
        });
    } else if (productType === 'addon') {
        const addonType = document.getElementById('addonType').value;
        
        if (!addonType) {
            alert('Por favor, selecione um add-on');
            return;
        }
        
        item = calculateAddonItem({
            addonType,
            quantity,
            contractDuration,
            discountLevel
        });
    }
    
    // Add to quote
    quoteItems.push(item);
    
    // Update UI
    renderQuote();
    
    // Auto-save to localStorage
    StorageManager.saveCurrentQuote();
    
    // Show success feedback
    showNotification('Item adicionado à cotação!');
}

// Remove item from quote
function removeFromQuote(itemId) {
    quoteItems = quoteItems.filter(item => item.id !== itemId);
    renderQuote();
    StorageManager.saveCurrentQuote();
    showNotification('Item removido da cotação');
}

// Clear entire quote
function clearQuote() {
    if (quoteItems.length === 0) return;
    
    if (confirm('Deseja realmente limpar toda a cotação?')) {
        quoteItems = [];
        renderQuote();
        StorageManager.clearCurrentQuote();
        showNotification('Cotação limpa');
    }
}

// Render quote items
function renderQuote() {
    const emptyQuote = document.getElementById('emptyQuote');
    const quoteItemsContainer = document.getElementById('quoteItems');
    const quoteSummary = document.getElementById('quoteSummary');
    
    if (quoteItems.length === 0) {
        emptyQuote.style.display = 'block';
        quoteItemsContainer.innerHTML = '';
        quoteSummary.style.display = 'none';
        return;
    }
    
    emptyQuote.style.display = 'none';
    quoteSummary.style.display = 'block';
    
    // Render items
    quoteItemsContainer.innerHTML = quoteItems.map(item => {
        const itemIcon = item.type === 'license' ? '📦' : '🔌';
        const itemTypeLabel = item.type === 'license' ? 'Licença' : 'Add-on';
        
        return `
        <div class="quote-item ${item.type === 'addon' ? 'addon-item-card' : ''}" data-id="${item.id}">
            <div class="quote-item-header">
                <div class="quote-item-title">
                    <span class="item-icon">${itemIcon}</span>
                    <strong>${item.name}</strong> - ${item.quantity} usuário${item.quantity > 1 ? 's' : ''}
                    <span class="contract-badge">${item.contract.name}</span>
                </div>
                <button class="btn-remove" onclick="removeFromQuote(${item.id})">✕</button>
            </div>
            <div class="quote-item-details">
                <div class="detail-row type-row">
                    <span>${itemTypeLabel}:</span>
                    <span>${item.description}</span>
                </div>
                <div class="detail-row">
                    <span>Valor base:</span>
                    <span>${formatCurrency(item.baseTotal)}</span>
                </div>
                ${item.totalDiscountRate > 0 ? `
                <div class="detail-row discount-row">
                    <span>Desconto (${item.totalDiscountRate.toFixed(1)}%):</span>
                    <span>-${formatCurrency(item.discountAmount)}</span>
                </div>
                ` : ''}
                <div class="detail-row total-row">
                    <span>Total:</span>
                    <span>${formatCurrency(item.total)}</span>
                </div>
                <div class="detail-row monthly-row">
                    <span>Média mensal:</span>
                    <span>${formatCurrency(item.monthlyAverage)}/mês</span>
                </div>
                <div class="detail-row user-monthly-row">
                    <span>Por usuário/mês:</span>
                    <span>${formatCurrency(item.perUserPerMonth)}/usuário</span>
                </div>
            </div>
        </div>
    `;
    }).join('');
    
    // Calculate and display quote totals
    const quoteSubtotal = quoteItems.reduce((sum, item) => sum + item.subtotal, 0);
    const quoteTotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
    
    document.getElementById('quoteSubtotal').textContent = formatCurrency(quoteSubtotal);
    document.getElementById('quoteTotal').textContent = formatCurrency(quoteTotal);
}

// Show notification
function showNotification(message) {
    // Simple alert for now - can be enhanced with toast notifications
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Print quotation
function printQuotation() {
    if (quoteItems.length === 0) {
        alert('Adicione itens à cotação antes de imprimir');
        return;
    }
    window.print();
}

// Export to PDF (placeholder)
function exportToPDF() {
    if (quoteItems.length === 0) {
        alert('Adicione itens à cotação antes de exportar');
        return;
    }
    alert('Função de exportação PDF em desenvolvimento.\nPor enquanto, use o botão Imprimir e salve como PDF.');
}

// Save current quote to history
function saveQuoteToHistory() {
    const name = prompt('Digite um nome para esta cotação:', `Cotação ${new Date().toLocaleDateString('pt-BR')}`);
    if (name === null) return; // User cancelled
    
    const saved = StorageManager.saveToHistory(name);
    if (saved) {
        showNotification(`Cotação "${saved.name}" salva com sucesso!`);
        renderHistory();
    }
}

// Toggle history panel
function toggleHistoryPanel() {
    const panel = document.getElementById('historyPanel');
    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        renderHistory();
    }
}

// Render history panel
function renderHistory() {
    const historyContainer = document.getElementById('historyList');
    if (!historyContainer) {
        console.error('History container not found');
        return;
    }
    
    const history = StorageManager.getHistory();
    
    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="empty-history">Nenhuma cotação salva ainda</p>';
        return;
    }
    
    historyContainer.innerHTML = history.map(quote => {
        const date = new Date(quote.timestamp);
        const dateStr = date.toLocaleDateString('pt-BR');
        const timeStr = date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
        
        return `
            <div class="history-item">
                <div class="history-item-header">
                    <div class="history-item-info">
                        <strong>${quote.name}</strong>
                        <small>${dateStr} às ${timeStr}</small>
                    </div>
                    <div class="history-item-actions">
                        <button onclick="loadQuoteFromHistory(${quote.id})" class="btn-load" title="Carregar">
                            📂
                        </button>
                        <button onclick="deleteQuoteFromHistory(${quote.id})" class="btn-delete-history" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="history-item-details">
                    <span>${quote.itemCount} item${quote.itemCount > 1 ? 's' : ''}</span>
                    <span class="history-total">${formatCurrency(quote.total)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Load quote from history
function loadQuoteFromHistory(id) {
    if (quoteItems.length > 0) {
        if (!confirm('A cotação atual será substituída. Deseja continuar?')) {
            return;
        }
    }
    StorageManager.loadFromHistory(id);
    toggleHistoryPanel();
}

// Delete quote from history
function deleteQuoteFromHistory(id) {
    if (confirm('Deseja realmente excluir esta cotação do histórico?')) {
        StorageManager.deleteFromHistory(id);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load saved quote on startup
    if (StorageManager.loadCurrentQuote()) {
        renderQuote();
    }
    
    // Bind event listeners
    const addBtn = document.getElementById('addToQuoteBtn');
    const clearBtn = document.getElementById('clearQuoteBtn');
    const printBtn = document.getElementById('printBtn');
    const saveBtn = document.getElementById('saveQuoteBtn');
    const historyBtn = document.getElementById('historyBtn');
    
    if (addBtn) addBtn.addEventListener('click', addToQuote);
    if (clearBtn) clearBtn.addEventListener('click', clearQuote);
    if (printBtn) printBtn.addEventListener('click', printQuotation);
    if (saveBtn) saveBtn.addEventListener('click', saveQuoteToHistory);
    if (historyBtn) historyBtn.addEventListener('click', toggleHistoryPanel);
    
    // Export button (may not exist in new version)
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportToPDF);
    
    // Toggle between license and addon fields
    document.getElementById('productType').addEventListener('change', (e) => {
        const licenseGroup = document.getElementById('licenseGroup');
        const addonGroup = document.getElementById('addonGroup');
        
        if (e.target.value === 'license') {
            licenseGroup.style.display = 'block';
            addonGroup.style.display = 'none';
            document.getElementById('addonType').value = '';
        } else if (e.target.value === 'addon') {
            licenseGroup.style.display = 'none';
            addonGroup.style.display = 'block';
            document.getElementById('licenseType').value = '';
        }
    });
    
    // Allow Enter key to add to quote
    document.querySelectorAll('.input-field').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addToQuote();
            }
        });
    });
    
    // Initialize empty quote display
    renderQuote();
});
