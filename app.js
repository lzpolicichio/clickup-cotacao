// Quote management system for ClickUp licenses and addons
// Uses CONFIG from config.js

// Quote state
let quoteItems = [];
let quoteIdCounter = 1;
let currentCurrency = 'usd';
let exchangeRate = 5.50; // Taxa padrão USD → BRL

// Storage Manager for persistence
const StorageManager = {
    STORAGE_KEY: 'clickup_quotes_history',
    CURRENT_KEY: 'clickup_current_quote',
    CURRENCY_KEY: 'clickup_currency_preference',
    EXCHANGE_KEY: 'clickup_exchange_rate',
    
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

// Format currency based on current currency setting
function formatCurrency(value) {
    const currencyConfig = CONFIG.currency[currentCurrency];
    return new Intl.NumberFormat(currencyConfig.locale, {
        style: 'currency',
        currency: currencyConfig.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Calculate BRL price with all taxes and margin
function calculateBRLPrice(usdPrice, quantity) {
    const taxes = CONFIG.taxes;
    
    // 1. Custo em USD (preço base)
    let costUSD = usdPrice;
    
    // 2. Adicionar taxa fixa de importação proporcional
    const fixedFeePerUnit = taxes.importation.fixedFee / Math.max(quantity, 1);
    costUSD += fixedFeePerUnit;
    
    // 3. Converter para BRL
    let costBRL = costUSD * exchangeRate;
    
    // 4. Aplicar impostos de importação sobre o valor em BRL
    const irAmount = costBRL * (taxes.importation.ir / 100);
    const iofAmount = costBRL * (taxes.importation.iof / 100);
    
    const costWithImportTaxes = costBRL + irAmount + iofAmount;
    
    // 5. Calcular total de impostos de comercialização
    const totalCommercializationTax = 
        taxes.commercialization.irpj +
        taxes.commercialization.csll +
        taxes.commercialization.iss +
        taxes.commercialization.pis +
        taxes.commercialization.cofins;
    
    // 6. Calcular preço de venda considerando impostos e margem
    // Fórmula: Preço = Custo / (1 - Impostos% - Margem%)
    const totalDeduction = (totalCommercializationTax + taxes.targetMargin) / 100;
    const sellingPrice = costWithImportTaxes / (1 - totalDeduction);
    
    const commercializationAmount = sellingPrice * (totalCommercializationTax / 100);
    const marginAmount = sellingPrice - costWithImportTaxes - commercializationAmount;
    
    return {
        usdPrice: costUSD,
        exchangeRate: exchangeRate,
        costBRLBeforeTaxes: costBRL,
        costBRLWithImportTaxes: costWithImportTaxes,
        taxes: {
            importation: {
                ir: irAmount,
                iof: iofAmount,
                fixedFee: fixedFeePerUnit * exchangeRate,
                total: irAmount + iofAmount + (fixedFeePerUnit * exchangeRate)
            },
            commercialization: {
                percentage: totalCommercializationTax,
                amount: commercializationAmount
            }
        },
        sellingPrice: sellingPrice,
        margin: marginAmount,
        marginPercentage: taxes.targetMargin
    };
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
    
    // Final total in USD
    const totalUSD = subtotal - discountAmount;
    const monthlyAverage = totalUSD / contract.months;
    const perUserPerMonth = monthlyAverage / data.quantity;
    
    // Calculate BRL if needed
    let brlCalculation = null;
    let finalTotal = totalUSD;
    let finalMonthlyAverage = monthlyAverage;
    let finalPerUserPerMonth = perUserPerMonth;
    
    if (currentCurrency === 'brl') {
        brlCalculation = calculateBRLPrice(totalUSD, data.quantity);
        finalTotal = brlCalculation.sellingPrice;
        finalMonthlyAverage = finalTotal / contract.months;
        finalPerUserPerMonth = finalMonthlyAverage / data.quantity;
    }
    
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
        totalUSD: totalUSD,
        total: finalTotal,
        monthlyAverage: finalMonthlyAverage,
        perUserPerMonth: finalPerUserPerMonth,
        brlCalculation: brlCalculation,
        currency: currentCurrency
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
    
    // Final total in USD
    const totalUSD = subtotal - discountAmount;
    const monthlyAverage = totalUSD / contract.months;
    const perUserPerMonth = monthlyAverage / data.quantity;
    
    // Calculate BRL if needed
    let brlCalculation = null;
    let finalTotal = totalUSD;
    let finalMonthlyAverage = monthlyAverage;
    let finalPerUserPerMonth = perUserPerMonth;
    
    if (currentCurrency === 'brl') {
        brlCalculation = calculateBRLPrice(totalUSD, data.quantity);
        finalTotal = brlCalculation.sellingPrice;
        finalMonthlyAverage = finalTotal / contract.months;
        finalPerUserPerMonth = finalMonthlyAverage / data.quantity;
    }
    
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
        totalUSD: totalUSD,
        total: finalTotal,
        monthlyAverage: finalMonthlyAverage,
        perUserPerMonth: finalPerUserPerMonth,
        brlCalculation: brlCalculation,
        currency: currentCurrency
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
    if (quoteItems.length === 0) {
        showNotification('Não há itens para limpar');
        return;
    }
    
    // Abrir modal de confirmação ao invés de confirm()
    openClearModal();
}

// Open clear confirmation modal
function openClearModal() {
    const modal = document.getElementById('clearConfirmModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Close clear confirmation modal
function closeClearModal() {
    const modal = document.getElementById('clearConfirmModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Confirm and execute clear quote
function confirmClearQuote() {
    quoteItems = [];
    renderQuote();
    StorageManager.clearCurrentQuote();
    closeClearModal();
    showNotification('Cotação limpa com sucesso!');
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
                ${item.brlCalculation ? `
                <div class="brl-breakdown">
                    <h4>💰 Detalhamento BRL</h4>
                    <div class="breakdown-section">
                        <div class="detail-row">
                            <span>Valor em USD:</span>
                            <span>$${item.totalUSD.toFixed(2)}</span>
                        </div>
                        <div class="detail-row">
                            <span>Taxa de câmbio:</span>
                            <span>R$ ${item.brlCalculation.exchangeRate.toFixed(2)}</span>
                        </div>
                        <div class="detail-row">
                            <span>Custo base BRL:</span>
                            <span>${formatCurrency(item.brlCalculation.costBRLBeforeTaxes)}</span>
                        </div>
                    </div>
                    <div class="breakdown-section">
                        <strong>Impostos de Importação:</strong>
                        <div class="detail-row">
                            <span>• IR (15%):</span>
                            <span>${formatCurrency(item.brlCalculation.taxes.importation.ir)}</span>
                        </div>
                        <div class="detail-row">
                            <span>• IOF (0,38%):</span>
                            <span>${formatCurrency(item.brlCalculation.taxes.importation.iof)}</span>
                        </div>
                        <div class="detail-row">
                            <span>• Taxa fixa ($30):</span>
                            <span>${formatCurrency(item.brlCalculation.taxes.importation.fixedFee)}</span>
                        </div>
                        <div class="detail-row total-tax">
                            <span>Total importação:</span>
                            <span>${formatCurrency(item.brlCalculation.taxes.importation.total)}</span>
                        </div>
                    </div>
                    <div class="breakdown-section">
                        <div class="detail-row">
                            <span>Custo + Imp. Importação:</span>
                            <span>${formatCurrency(item.brlCalculation.costBRLWithImportTaxes)}</span>
                        </div>
                    </div>
                    <div class="breakdown-section">
                        <strong>Impostos Comercialização (${item.brlCalculation.taxes.commercialization.percentage.toFixed(2)}%):</strong>
                        <div class="detail-row">
                            <span>• IRPJ + CSLL + ISS + PIS + COFINS:</span>
                            <span>${formatCurrency(item.brlCalculation.taxes.commercialization.amount)}</span>
                        </div>
                    </div>
                    <div class="breakdown-section margin-section">
                        <div class="detail-row">
                            <span><strong>Margem (25%):</strong></span>
                            <span><strong>${formatCurrency(item.brlCalculation.margin)}</strong></span>
                        </div>
                    </div>
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
    openSaveModal();
}

// Open the save modal
function openSaveModal() {
    const modal = document.getElementById('saveQuoteModal');
    const input = document.getElementById('quoteName');
    
    if (!modal || !input) {
        console.error('Modal elements not found');
        return;
    }
    
    // Set default name
    const defaultName = `Cotação ${new Date().toLocaleDateString('pt-BR')}`;
    input.value = defaultName;
    
    // Show modal
    modal.classList.add('active');
    
    // Focus input and select text
    setTimeout(() => {
        input.focus();
        input.select();
    }, 100);
}

// Close the save modal
function closeSaveModal() {
    const modal = document.getElementById('saveQuoteModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Confirm save quote
function confirmSaveQuote() {
    const input = document.getElementById('quoteName');
    const name = input.value.trim();
    
    if (!name) {
        alert('Por favor, digite um nome para a cotação');
        input.focus();
        return;
    }
    
    const saved = StorageManager.saveToHistory(name);
    if (saved) {
        showNotification(`Cotação "${saved.name}" salva com sucesso!`);
        renderHistory();
        closeSaveModal();
    }
}

// Open history modal
function toggleHistoryPanel() {
    const modal = document.getElementById('historyModal');
    modal.classList.add('active');
    renderHistory();
}

// Close history modal
function closeHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Render history modal
function renderHistory() {
    const historyContainer = document.getElementById('historyList');
    if (!historyContainer) {
        console.error('History container not found');
        return;
    }
    
    const history = StorageManager.getHistory();
    
    if (history.length === 0) {
        historyContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <p style="font-size: 48px; margin: 0;">📋</p>
                <p style="margin: 16px 0 8px;">Nenhuma cotação salva ainda</p>
                <p style="font-size: 14px; color: #aaa;">Crie e salve sua primeira cotação para vê-la aqui</p>
            </div>
        `;
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
                            📂 Carregar
                        </button>
                        <button onclick="deleteQuoteFromHistory(${quote.id})" class="btn-delete-history" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="history-item-details">
                    <span>📦 ${quote.itemCount} item${quote.itemCount > 1 ? 's' : ''}</span>
                    <span class="history-total">💰 ${formatCurrency(quote.total)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Load quote from history
function loadQuoteFromHistory(id) {
    // Limpar cotação atual primeiro
    quoteItems = [];
    
    // Carregar cotação do histórico
    StorageManager.loadFromHistory(id);
    
    // Fechar modal de histórico
    closeHistoryModal();
    
    // Mostrar notificação de sucesso
    const history = StorageManager.getHistory();
    const quote = history.find(q => q.id === id);
    if (quote) {
        showNotification(`Cotação "${quote.name}" carregada com sucesso!`);
    }
}

// Delete quote from history
function deleteQuoteFromHistory(id) {
    const history = StorageManager.getHistory();
    const quote = history.find(q => q.id === id);
    
    if (quote && confirm(`Tem certeza que deseja excluir a cotação "${quote.name}"?`)) {
        StorageManager.deleteFromHistory(id);
        renderHistory();
        showNotification('Cotação excluída com sucesso!');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load currency preferences
    const savedCurrency = localStorage.getItem('clickup_currency_preference');
    const savedRate = localStorage.getItem('clickup_exchange_rate');
    
    if (savedCurrency) {
        currentCurrency = savedCurrency;
        const currencySelector = document.getElementById('currencySelector');
        if (currencySelector) currencySelector.value = savedCurrency;
    }
    
    if (savedRate) {
        exchangeRate = parseFloat(savedRate);
        const exchangeRateInput = document.getElementById('exchangeRate');
        if (exchangeRateInput) exchangeRateInput.value = savedRate;
    }
    
    // Show/hide exchange rate input
    toggleExchangeRateInput();
    
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
    
    // Modal event listeners
    const saveModal = document.getElementById('saveQuoteModal');
    const historyModal = document.getElementById('historyModal');
    const clearModal = document.getElementById('clearConfirmModal');
    const quoteNameInput = document.getElementById('quoteName');
    
    // Close modals when clicking outside
    if (saveModal) {
        saveModal.addEventListener('click', (e) => {
            if (e.target === saveModal) {
                closeSaveModal();
            }
        });
    }
    
    if (historyModal) {
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) {
                closeHistoryModal();
            }
        });
    }
    
    if (clearModal) {
        clearModal.addEventListener('click', (e) => {
            if (e.target === clearModal) {
                closeClearModal();
            }
        });
    }
    
    // Allow Enter key to confirm save
    if (quoteNameInput) {
        quoteNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmSaveQuote();
            }
        });
    }
    
    // Allow Esc key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (saveModal && saveModal.classList.contains('active')) {
                closeSaveModal();
            }
            if (historyModal && historyModal.classList.contains('active')) {
                closeHistoryModal();
            }
            if (clearModal && clearModal.classList.contains('active')) {
                closeClearModal();
            }
        }
    });
    
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

// Currency management functions
function toggleExchangeRateInput() {
    const currencySelector = document.getElementById('currencySelector');
    const rateContainer = document.getElementById('exchangeRateContainer');
    
    if (!currencySelector || !rateContainer) return;
    
    if (currencySelector.value === 'brl') {
        rateContainer.style.display = 'block';
    } else {
        rateContainer.style.display = 'none';
    }
}

function handleCurrencyChange() {
    const currencySelector = document.getElementById('currencySelector');
    const exchangeRateInput = document.getElementById('exchangeRate');
    
    if (!currencySelector) return;
    
    const newCurrency = currencySelector.value;
    currentCurrency = newCurrency;
    
    // Save preference
    localStorage.setItem('clickup_currency_preference', newCurrency);
    
    // Update exchange rate if BRL
    if (newCurrency === 'brl' && exchangeRateInput && exchangeRateInput.value) {
        exchangeRate = parseFloat(exchangeRateInput.value);
        localStorage.setItem('clickup_exchange_rate', exchangeRate);
    }
    
    // Toggle exchange rate input visibility
    toggleExchangeRateInput();
    
    // Recalculate all items
    recalculateAllItems();
}

function handleExchangeRateChange() {
    const exchangeRateInput = document.getElementById('exchangeRate');
    
    if (!exchangeRateInput || !exchangeRateInput.value) return;
    
    const newRate = parseFloat(exchangeRateInput.value);
    
    if (newRate > 0) {
        exchangeRate = newRate;
        localStorage.setItem('clickup_exchange_rate', exchangeRate);
        
        // Recalculate all items if in BRL mode
        if (currentCurrency === 'brl') {
            recalculateAllItems();
        }
    }
}

function recalculateAllItems() {
    // Recalculate each item with new currency/exchange rate
    quoteItems = quoteItems.map(item => {
        const data = {
            quantity: item.quantity,
            contractDuration: item.contract.id,
            discountLevel: item.commercialDiscount
        };
        
        if (item.type === 'license') {
            // Find license type ID
            const licenseEntry = Object.entries(CONFIG.licenses).find(([key, val]) => val.name === item.name);
            if (licenseEntry) {
                data.licenseType = licenseEntry[0];
                return calculateLicenseItem(data);
            }
        } else if (item.type === 'addon') {
            // Find addon type ID
            const addonEntry = Object.entries(CONFIG.addons).find(([key, val]) => val.name === item.name);
            if (addonEntry) {
                data.addonType = addonEntry[0];
                return calculateAddonItem(data);
            }
        }
        
        return item;
    });
    
    // Re-render quote
    renderQuote();
    
    // Save updated quote
    StorageManager.saveCurrentQuote();
    
    // Show notification
    const currencyName = CONFIG.currency[currentCurrency].name;
    showNotification(`Cotação atualizada para ${currencyName}`);
}
