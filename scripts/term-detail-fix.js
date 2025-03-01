/**
 * OPRAVNÝ SKRIPT PRO KLIKATELNÉ KARTY
 * Řeší problém s nefungujícím přechodem na detail termínů
 * Umístění: scripts/term-detail-fix.js
 */

document.addEventListener('DOMContentLoaded', function() {
    // Počkáme na inicializaci aplikace
    setTimeout(function() {
        // Získáme kontejner s výsledky
        const resultsContainer = document.getElementById('results');
        
        if (resultsContainer) {
            // Přidáme event listener na kontejner, který bude delegovat události na karty
            resultsContainer.addEventListener('click', function(event) {
                // Najdeme nejbližší předek kliknutého elementu, který má třídu 'term-card'
                const termCard = event.target.closest('.term-card');
                
                if (termCard) {
                    // Extrahujeme term název a kategorii
                    const termHeader = termCard.querySelector('.term-header');
                    if (termHeader) {
                        // Získáme název termínu z prvního textového uzlu hlavičky
                        const termName = termHeader.childNodes[0].textContent.trim();
                        console.log('Kliknuto na termín:', termName);
                        
                        // Najdeme odpovídající termín v datech aplikace
                        if (window.app && window.app.terms) {
                            const term = window.app.terms.find(t => t.term === termName);
                            
                            if (term) {
                                // Použijeme existující metodu pro zobrazení detailu
                                window.app.zobrazitTermin(term);
                                window.app.currentTerm = term;
                                
                                // Aktualizujeme URL pro účely historie
                                const slug = term.slug || term.term.toLowerCase()
                                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                    .replace(/ /g, '-')
                                    .replace(/[^\w-]+/g, '');
                                
                                // Aktualizujeme URL bez vyvolání další navigace
                                window.history.pushState(
                                    { term: term.term }, 
                                    '', 
                                    `#/term/${encodeURIComponent(slug)}`
                                );
                                
                                // Aktualizujeme SEO metadata
                                window.app.aktualizovatSEO({
                                    title: `${term.term} | CryptoSlangDecoder`,
                                    description: term.definition.slice(0, 160)
                                });
                                
                                console.log('URL aktualizováno na:', window.location.hash);
                            }
                        }
                    }
                }
            });
            
            console.log('Event delegace nainstalována na kontejner výsledků');
        } else {
            console.error('Kontejner výsledků nebyl nalezen');
        }
    }, 1000); // Dáváme aplikaci čas na inicializaci
});
