// Format number with commas for input fields
function formatNumberWithCommas(value) {
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    let integerPart = parts[0];
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return integerPart;
}

// Parse number by removing commas
function parseNumber(value) {
    if (!value) return NaN;
    return parseFloat(value.replace(/,/g, ''));
}

function formatMoney(amount) {
    return "$ " + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function calculateEMI(P, r, n) {
    r = r / 12 / 100;
    n = n * 12;
    if (r === 0) return P / n;
    return P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

function calculateProgressiveEMI(loanAmount, interest, totalTenure, disbursementSchedule, disbursementIndices) {
    let totalEMI = 0;
    let remainingMonths = totalTenure * 12;
    let totalDisbursed = 0;
    let currentEMI = 0;
    let monthsPassed = 0;

    disbursementSchedule.forEach((disbursement, idx) => {
        if (idx > 0) {
            const prevIndex = disbursementIndices[idx - 1];
            const currentIndex = disbursementIndices[idx];
            
            if (currentIndex === 9 && prevIndex === 8) {
                monthsPassed += 12;
            } else {
                monthsPassed += 6;
            }
        }

        const remainingTenureMonths = remainingMonths - monthsPassed;
        
        if (remainingTenureMonths <= 0) return;

        totalDisbursed += disbursement;
        currentEMI = calculateEMI(totalDisbursed, interest, remainingTenureMonths / 12);
        totalEMI = currentEMI;
    });

    return totalEMI;
}

function validatePurchasePrice(value) {
    if (!value || isNaN(value) || value <= 0) {
        return "Please enter a valid purchase price";
    }
    if (value < 100000) {
        return "Property value must be at least SGD100,000";
    }
    return null;
}

function validateLoanAmount(value, purchasePrice) {
    if (!value || isNaN(value) || value <= 0) {
        return "Please enter a valid loan amount";
    }
    if (value < 100000) {
        return "Loan size must be at least SGD100,000";
    }
    if (purchasePrice && value > 0.75 * purchasePrice) {
        return `Loan cannot exceed 75% (${formatMoney(0.75 * purchasePrice)}) of Purchase Price`;
    }
    return null;
}

function validateTenure(value) {
    if (!value || isNaN(value) || value <= 0) {
        return "Please enter a valid tenure";
    }
    if (value < 5) {
        return "Tenure should be at least 5 years";
    }
    if (value > 35) {
        return "Tenure should not exceed 35 years";
    }
    return null;
}

function validateInterest(value) {
    if (!value || isNaN(value)) {
        return "Please enter a valid interest rate";
    }
    if (value < 0.1) {
        return "Interest rate must be at least 0.1%";
    }
    if (value > 10) {
        return "Interest rate cannot exceed 10%";
    }
    return null;
}

function validateCPF(value, purchasePrice, loanAmount) {
    if (isNaN(value)) {
        return "Please enter a valid CPF amount";
    }
    if (purchasePrice && loanAmount && (parseFloat(value) + parseFloat(loanAmount) > 0.95 * purchasePrice)) {
        return `CPF and loan combined cannot exceed 95% (${formatMoney(0.95 * purchasePrice)}) of Purchase Price`;
    }
    return null;
}

document.addEventListener('DOMContentLoaded', function() {
    // Define SORA rates and spread
    const threeMonthSORA = 2.3349; // Placeholder: Update with actual 3M SORA rate
    const spread = 0.28; // Middle of the spread range 0.28%-0.35%
    const spreadRange = "0.28%-0.35%"; // Spread range for display

    // Set default interest rate
    const defaultInterest = (threeMonthSORA + spread).toFixed(2);
    const interestInput = document.getElementById('interest');
    interestInput.value = defaultInterest;

    // Dynamically set the interest note
    const interestNote = document.getElementById('interestNote');
    interestNote.textContent = `Current 3M SORA: ${threeMonthSORA.toFixed(2)}%, Spread range: ${spreadRange}`;

    // Get input elements
    const purchasePriceInput = document.getElementById('purchasePrice');
    const loanAmountInput = document.getElementById('loanAmount');
    const cpfAmountInput = document.getElementById('cpfAmount');
    const tenureInput = document.getElementById('tenure');

    // Add event listeners for comma formatting
    [purchasePriceInput, loanAmountInput, cpfAmountInput].forEach(input => {
        input.addEventListener('input', function(e) {
            const cursorPosition = e.target.selectionStart;
            const valueBefore = e.target.value;
            const formattedValue = formatNumberWithCommas(e.target.value);
            e.target.value = formattedValue;
            
            const commasBeforeCursor = (valueBefore.slice(0, cursorPosition).match(/,/g) || []).length;
            const newCommasBeforeCursor = (formattedValue.slice(0, cursorPosition).match(/,/g) || []).length;
            const cursorAdjustment = newCommasBeforeCursor - commasBeforeCursor;
            e.target.setSelectionRange(cursorPosition + cursorAdjustment, cursorPosition + cursorAdjustment);
            
            validateFieldsOnChange();
        });
    });

    // Purchase Price validation
    const purchasePriceError = document.createElement('div');
    purchasePriceError.className = 'field-error';
    purchasePriceInput.parentNode.insertAdjacentElement('afterend', purchasePriceError);
    
    purchasePriceInput.addEventListener('input', function() {
        const value = parseNumber(this.value);
        const error = validatePurchasePrice(value);
        if (error) {
            purchasePriceError.textContent = error;
            purchasePriceError.style.display = 'block';
        } else {
            purchasePriceError.style.display = 'none';
        }
        
        validateFieldsOnChange();
    });
    
    // Loan Amount validation
    const loanAmountError = document.createElement('div');
    loanAmountError.className = 'field-error';
    loanAmountInput.parentNode.insertAdjacentElement('afterend', loanAmountError);
    
    loanAmountInput.addEventListener('input', function() {
        validateFieldsOnChange();
    });
    
    // Tenure validation
    const tenureError = document.createElement('div');
    tenureError.className = 'field-error';
    tenureInput.parentNode.insertAdjacentElement('afterend', tenureError);
    
    tenureInput.addEventListener('input', function() {
        const value = parseInt(this.value);
        const error = validateTenure(value);
        if (error) {
            tenureError.textContent = error;
            tenureError.style.display = 'block';
        } else {
            tenureError.style.display = 'none';
        }
    });
    
    // Interest Rate validation
    const interestError = document.createElement('div');
    interestError.className = 'field-error';
    interestInput.parentNode.insertAdjacentElement('afterend', interestError);
    
    interestInput.addEventListener('input', function() {
        const value = parseFloat(this.value);
        const error = validateInterest(value);
        if (error) {
            interestError.textContent = error;
            interestError.style.display = 'block';
        } else {
            interestError.style.display = 'none';
        }
    });
    
    // CPF Amount validation
    const cpfAmountError = document.createElement('div');
    cpfAmountError.className = 'field-error';
    cpfAmountInput.parentNode.insertAdjacentElement('afterend', cpfAmountError);
    
    cpfAmountInput.addEventListener('input', function() {
        validateFieldsOnChange();
    });
    
    function validateFieldsOnChange() {
        const purchasePrice = parseNumber(purchasePriceInput.value);
        const loanAmount = parseNumber(loanAmountInput.value);
        const cpfAmount = parseNumber(cpfAmountInput.value) || 0;
        
        const loanError = validateLoanAmount(loanAmount, purchasePrice);
        if (loanError) {
            loanAmountError.textContent = loanError;
            loanAmountError.style.display = 'block';
        } else {
            loanAmountError.style.display = 'none';
        }
        
        const cpfError = validateCPF(cpfAmount, purchasePrice, loanAmount);
        if (cpfError) {
            cpfAmountError.textContent = cpfError;
            cpfAmountError.style.display = 'block';
        } else {
            cpfAmountError.style.display = 'none';
        }
    }
});

function calculate() {
    const purchasePrice = parseNumber(document.getElementById("purchasePrice").value);
    const cpf = parseNumber(document.getElementById("cpfAmount").value) || 0;
    const loan = parseNumber(document.getElementById("loanAmount").value);
    const tenure = parseInt(document.getElementById("tenure").value);
    const interest = parseFloat(document.getElementById("interest").value);
    const errorBox = document.getElementById("error");
    const results = document.getElementById("results");
    
    const purchasePriceError = validatePurchasePrice(purchasePrice);
    const loanAmountError = validateLoanAmount(loan, purchasePrice);
    const tenureError = validateTenure(tenure);
    const interestError = validateInterest(interest);
    const cpfError = validateCPF(cpf, purchasePrice, loan);
    
    if (purchasePriceError || loanAmountError || tenureError || interestError || cpfError) {
        errorBox.style.display = "block";
        errorBox.innerText = purchasePriceError || loanAmountError || tenureError || interestError || cpfError;
        return;
    }
    
    errorBox.style.display = "none";
    results.innerHTML = "";
    
    const cash = purchasePrice - cpf - loan;
    
    const minCashRequired = 0.05 * purchasePrice;
    if (cash < minCashRequired) {
        errorBox.style.display = "block";
        errorBox.innerText = `Minimum cash payment of 5% (${formatMoney(minCashRequired)}) of Purchase Price is required`;
        return;
    }
    
    const summaryContainer = document.createElement("div");
    summaryContainer.className = "summary-container";
    summaryContainer.innerHTML = `
        <h3 class="summary-title">Payment Summary</h3>
        <div class="summary-row">
            <span class="summary-label">Purchase Price</span>
            <span class="summary-value">${formatMoney(purchasePrice)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Cash Payment <span class="percentage">(${(cash/purchasePrice*100).toFixed(1)}%)</span></span>
            <span class="summary-value" style="color: var(--error-color);">${formatMoney(cash)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">CPF Utilization <span class="percentage">(${(cpf/purchasePrice*100).toFixed(1)}%)</span></span>
            <span class="summary-value" style="color: var(--secondary-color);">${formatMoney(cpf)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Loan Amount <span class="percentage">(${(loan/purchasePrice*100).toFixed(1)}%)</span></span>
            <span class="summary-value" style="color: var(--success-color);">${formatMoney(loan)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Loan Tenure</span>
            <span class="summary-value">${tenure} years</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Interest Rate(Floating)</span>
            <span class="summary-value">${interest}% p.a.</span>
        </div>
    `;
    results.appendChild(summaryContainer);
    
    const timelineContainer = document.createElement("div");
    timelineContainer.className = "timeline-container";
    
    const milestones = [
        { stage: "5% - Booking Fee", percentage: 0.05 },
        { stage: "15% - Downpayment", percentage: 0.15 },
        { stage: "10% - Foundation", percentage: 0.10 },
        { stage: "10% - Unit Concrete Framework", percentage: 0.10 },
        { stage: "5% - Brick Wall", percentage: 0.05 },
        { stage: "5% - Ceiling / Roofing", percentage: 0.05 },
        { stage: "5% - Door / Window / Plumbing / Wiring", percentage: 0.05 },
        { stage: "5% - Carpark / Road / Drain", percentage: 0.05 },
        { stage: "25% - Temporary Occupation Permit (TOP)", percentage: 0.25 },
        { stage: "15% - Certificate Of Statutory Completion (CSC)", percentage: 0.15 }
    ];
    
    let remainingCash = cash;
    let remainingCPF = cpf;
    let remainingLoan = loan;
    let cashUsed = 0;
    let cpfUsed = 0;
    let loanUsed = 0;
    let loanDisbursements = [];
    let loanDisbursementIndices = [];
    
    milestones.forEach((milestone, index) => {
        const paymentAmount = milestone.percentage * purchasePrice;
        const resultContainer = document.createElement("div");
        resultContainer.className = "result-container";
        
        const resultHeader = document.createElement("div");
        resultHeader.className = "result-header";
        resultHeader.innerHTML = `
            <h3 class="result-title">${milestone.stage}</h3>
            <div class="milestone-amount">${formatMoney(paymentAmount)}</div>
        `;
        resultContainer.appendChild(resultHeader);
        
        const paymentBreakdown = document.createElement("div");
        paymentBreakdown.className = "payment-breakdown";
        
        let cashPayment = 0;
        let cpfPayment = 0;
        let loanPayment = 0;
        
        if (remainingCash > 0) {
            cashPayment = Math.min(remainingCash, paymentAmount);
            remainingCash -= cashPayment;
            cashUsed += cashPayment;
        }
        
        let remainingToPay = paymentAmount - cashPayment;
        if (remainingToPay > 0 && remainingCPF > 0) {
            cpfPayment = Math.min(remainingCPF, remainingToPay);
            remainingCPF -= cpfPayment;
            cpfUsed += cpfPayment;
        }
        
        remainingToPay = paymentAmount - cashPayment - cpfPayment;
        if (remainingToPay > 0 && remainingLoan > 0) {
            loanPayment = Math.min(remainingLoan, remainingToPay);
            remainingLoan -= loanPayment;
            loanUsed += loanPayment;
            loanDisbursements.push(loanPayment);
            loanDisbursementIndices.push(index);
        }
        
        if (cashPayment > 0) {
            const cashLine = document.createElement("div");
            cashLine.className = "payment-item";
            cashLine.innerHTML = `
                <span class="payment-type cash-type">Cash Payment</span>
                <span class="payment-amount cash">${formatMoney(cashPayment)}</span>
            `;
            paymentBreakdown.appendChild(cashLine);
        }
        
        if (cpfPayment > 0) {
            const cpfLine = document.createElement("div");
            cpfLine.className = "payment-item";
            cpfLine.innerHTML = `
                <span class="payment-type cpf-type">CPF Utilization</span>
                <span class="payment-amount cpf">${formatMoney(cpfPayment)}</span>
            `;
            paymentBreakdown.appendChild(cpfLine);
        }
        
        if (loanPayment > 0) {
            const loanLine = document.createElement("div");
            loanLine.className = "payment-item";
            loanLine.innerHTML = `
                <span class="payment-type loan-type">Loan Drawdown</span>
                <span class="payment-amount loan">${formatMoney(loanPayment)}</span>
            `;
            paymentBreakdown.appendChild(loanLine);
            
            const currentEMI = calculateProgressiveEMI(
                loan, 
                interest, 
                tenure, 
                loanDisbursements, 
                loanDisbursementIndices
            );
            
            const emiSection = document.createElement("div");
            emiSection.className = "monthly-repayment";
            emiSection.innerHTML = `
                <span class="monthly-repayment-label">Monthly Instalment</span>
                <span class="monthly-repayment-amount">${formatMoney(currentEMI)}</span>
            `;
            resultContainer.appendChild(paymentBreakdown);
            resultContainer.appendChild(emiSection);
        } else {
            resultContainer.appendChild(paymentBreakdown);
        }
        
        results.appendChild(resultContainer);
    });
    
    if (Math.abs(cpfUsed - cpf) > 0.01 || Math.abs(loanUsed - loan) > 0.01 || Math.abs(cashUsed - cash) > 0.01) {
        const errorAlert = document.createElement("div");
        errorAlert.className = "error-alert";
        errorAlert.innerHTML = `
            <div class="error-alert-title">Warning: Calculation Discrepancy</div>
            <p>There may be a slight discrepancy in the payment allocation. Please review your inputs.</p>
        `;
        results.insertBefore(errorAlert, results.firstChild.nextSibling);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Function to send height to parent window with extra padding
    function sendHeight() {
        // Get the document height and add some extra padding (20px)
        const height = document.body.scrollHeight + 20;
        
        window.parent.postMessage({
            type: 'setHeight',
            height: height
        }, '*');
    }

    // Send height on important events
    const events = ['load', 'resize', 'input', 'change'];
    events.forEach(event => {
        window.addEventListener(event, sendHeight);
    });
    
    // Watch for DOM changes
    const observer = new MutationObserver(function() {
        // Small delay to ensure all DOM changes are completed
        setTimeout(sendHeight, 50);
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
    });
    
    // Handle height requests from parent
    window.addEventListener('message', function(event) {
        if (event.data.type === 'requestHeight') {
            sendHeight();
        }
    });
    
    // Initial height send with slight delay to ensure full rendering
    setTimeout(sendHeight, 300);
    // Also send after all images and assets are loaded
    window.addEventListener('load', function() {
        setTimeout(sendHeight, 500);
    });
});