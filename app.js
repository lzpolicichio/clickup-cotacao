// Quote management system for ClickUp licenses and addons
// Uses CONFIG from config.js

// Quote state
let quoteItems = [];
let quoteIdCounter = 1;

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
    
    // Show success feedback
    showNotification('Item adicionado à cotação!');
}

// Remove item from quote
function removeFromQuote(itemId) {
    quoteItems = quoteItems.filter(item => item.id !== itemId);
    renderQuote();
    showNotification('Item removido da cotação');
}

// Clear entire quote
function clearQuote() {
    if (quoteItems.length === 0) return;
    
    if (confirm('Deseja realmente limpar toda a cotação?')) {
        quoteItems = [];
        renderQuote();
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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addToQuoteBtn').addEventListener('click', addToQuote);
    document.getElementById('clearQuoteBtn').addEventListener('click', clearQuote);
    document.getElementById('printBtn').addEventListener('click', printQuotation);
    document.getElementById('exportBtn').addEventListener('click', exportToPDF);
    
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
