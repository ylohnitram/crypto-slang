document.addEventListener('DOMContentLoaded', function() {
    // Přímý přístup k DOM elementům pro karty termínů
    document.querySelectorAll('.term-card').forEach(card => {
        card.addEventListener('click', function() {
            // Získat název termínu z karty
            const termName = this.querySelector('.term-header').textContent.trim();
            
            // Najít odpovídající termín v JSON
            fetch('data/terms.json')
                .then(response => response.json())
                .then(terms => {
                    const term = terms.find(t => t.term === termName);
                    if (term) {
                        // Zobrazit detail termínu přímo
                        const container = document.getElementById('results');
                        container.innerHTML = `
                            <div class="term-card">
                                <div class="term-header">
                                    ${term.term}
                                    <span class="term-category">${term.category}</span>
                                </div>
                                <div class="term-body">
                                    <p class="term-definition">${term.definition}</p>
                                    ${term.example ? `
                                    <div class="term-example">
                                        📌 Příklad: <em>${term.example}</em>
                                    </div>` : ''}
                                </div>
                            </div>
                        `;
                    }
                });
        });
    });
    
    // Kontrola hash URL při načtení
    if (window.location.hash.includes('/term/') || window.location.hash.includes('/termin/')) {
        const slug = window.location.hash.split('/').pop();
        if (slug) {
            fetch('data/terms.json')
                .then(response => response.json())
                .then(terms => {
                    const term = terms.find(t => {
                        const termSlug = t.term
                            .toLowerCase()
                            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                            .replace(/ /g, '-')
                            .replace(/[^\w-]+/g, '');
                        return termSlug === decodeURIComponent(slug);
                    });
                    
                    if (term) {
                        // Zobrazit detail termínu
                        const container = document.getElementById('results');
                        container.innerHTML = `
                            <div class="term-card">
                                <div class="term-header">
                                    ${term.term}
                                    <span class="term-category">${term.category}</span>
                                </div>
                                <div class="term-body">
                                    <p class="term-definition">${term.definition}</p>
                                    ${term.example ? `
                                    <div class="term-example">
                                        📌 Příklad: <em>${term.example}</em>
                                    </div>` : ''}
                                </div>
                            </div>
                        `;
                    }
                });
        }
    }
});