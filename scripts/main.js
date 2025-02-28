/**
 * Načte termíny z JSON souboru
 * @returns {Promise<Array>} Pole termínů
 */
async function loadTerms() {
    try {
        const response = await fetch('data/terms.json');
        if (!response.ok) throw new Error('Soubor nebyl nalezen');
        return await response.json();
    } catch (error) {
        console.error('Chyba při načítání termínů:', error);
        showErrorToast('Nepodařilo se načíst slovníček. Zkuste to prosím později.');
        return [];
    }
}

/**
 * Zobrazí výsledky vyhledávání
 * @param {Array} terms - Filtrované termíny k zobrazení
 */
function displayResults(terms) {
    const container = document.getElementById('results');
    if (!container) return;

    container.innerHTML = terms.length > 0 
        ? terms.map(createTermCard).join('')
        : '<div class="no-results">Žádné výsledky... Zkuste jiný termín</div>';
}

/**
 * Vytvoří HTML kód pro kartu termínu
 * @param {Object} term - Termín ze slovníku
 * @returns {string} HTML kód
 */
function createTermCard(term) {
    return `
        <div class="term-card">
            <div class="term-header">
                ${term.term}
                <span class="term-category">${term.category}</span>
            </div>
            <div class="term-body">
                <p class="term-definition">${term.definition}</p>
                ${term.example ? `<div class="term-example">📌 Příklad: <em>${term.example}</em></div>` : ''}
                <button class="copy-btn" onclick="copyTermToClipboard(${JSON.stringify(term).replace(/"/g, '&quot;')})">
                    📋 Kopírovat
                </button>
            </div>
        </div>
    `;
}

/**
 * Zkopíruje termín do schránky
 * @param {Object} term - Termín ke zkopírování
 */
function copyTermToClipboard(term) {
    const text = `${term.term} (${term.category}):\n${term.definition}${term.example ? `\n\nPříklad: ${term.example}` : ''}`;
    
    navigator.clipboard.writeText(text)
        .then(() => showSuccessToast('Zkopírováno do schránky!'))
        .catch(() => showErrorToast('Kopírování se nepovedlo'));
}

/**
 * Zobrazí úspěšnou notifikaci
 * @param {string} message - Zpráva k zobrazení
 */
function showSuccessToast(message) {
    showToast(message, '#00ff88');
}

/**
 * Zobrazí chybovou notifikaci
 * @param {string} message - Zpráva k zobrazení
 */
function showErrorToast(message) {
    showToast(message, '#ff4444');
}

/**
 * Obecná funkce pro zobrazení notifikace
 * @param {string} message - Zpráva
 * @param {string} color - Barva pozadí
 */
function showToast(message, color) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.backgroundColor = color;

    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Inicializace aplikace po načtení stránky
document.addEventListener('DOMContentLoaded', async () => {
    // Načtení termínů
    const terms = await loadTerms();
    
    // Nastavení vyhledávání
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = terms.filter(term => 
                term.term.toLowerCase().includes(query) ||
                term.definition.toLowerCase().includes(query) ||
                term.category.toLowerCase().includes(query)
            );
            displayResults(filtered);
        });
    }

    // Počáteční zobrazení všech termínů
    displayResults(terms);
});