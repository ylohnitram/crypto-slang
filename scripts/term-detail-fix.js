/**
 * OPRAVNÝ SKRIPT PRO KLIKATELNÉ KARTY A ZOBRAZENÍ DETAILU
 * Řeší problém s nefungujícím přechodem na detail termínů
 * Umístění: scripts/term-detail-fix.js
 */

(function() {
    // Funkce pro kontrolu, zda je aplikace načtena
    function isAppReady() {
        return window.app && window.app.terms && window.app.terms.length > 0;
    }
    
    // Funkce pro čekání na aplikaci
    function waitForApp(callback, maxAttempts = 20) {
        let attempts = 0;
        
        function checkApp() {
            if (isAppReady()) {
                callback();
                return;
            }
            
            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(checkApp, 200);
            } else {
                console.error('Aplikace se nenačetla v očekávaném čase');
            }
        }
        
        checkApp();
    }
    
    // Kompletní přepsání navigace a zobrazení detailu
    function setupDetailNavigation() {
        console.log('Instaluji nový navigační systém');
        
        // Příprava CSS pro animaci přechodu
        const style = document.createElement('style');
        style.textContent = `
            .term-card {
                transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
            }
            .term-card:hover {
                cursor: pointer;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            }
            .term-detail-view {
                animation: fadeIn 0.3s ease-out;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .back-link {
                margin-top: 15px;
                text-align: center;
            }
            .back-to-list {
                display: inline-block;
                color: #00ff88;
                text-decoration: none;
                padding: 8px 16px;
                border-radius: 6px;
                background: rgba(0, 255, 136, 0.1);
                border: 1px solid rgba(0, 255, 136, 0.2);
                transition: all 0.2s ease;
            }
            .back-to-list:hover {
                background: rgba(0, 255, 136, 0.2);
            }
        `;
        document.head.appendChild(style);
        
        // Získání reference na kontejner výsledků
        const resultsContainer = document.getElementById('results');
        
        if (!resultsContainer) {
            console.error('Kontejner výsledků nenalezen');
            return;
        }
        
        // Funkce pro zobrazení detailu termínu
        function displayTermDetail(term) {
            // Příprava HTML pro detail
            const detailHTML = `
                <div class="term-detail-view">
                    <div class="term-card">
                        <div class="term-header">
                            ${term.term}
                            <span class="term-category">${term.category}</span>
                        </div>
                        <div class="term-body">
                            <p class="term-definition">${linkifyTerms(term.definition)}</p>
                            ${term.example ? `
                            <div class="term-example">
                                📌 Příklad: <em>${term.example}</em>
                            </div>` : ''}
                            <div class="term-actions">
                                <button class="copy-btn" onclick="copyTermToClipboard('${term.term}')">
                                    📋 Kopírovat
                                </button>
                            </div>
                            <div class="back-link">
                                <a href="#" onclick="showAllTerms(); return false;" class="back-to-list">
                                    ⬅️ Zpět na přehled
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Aktualizace obsahu
            resultsContainer.innerHTML = detailHTML;
            
            // Aktualizace URL a metadat
            updateUrlAndMetadata(term);
            
            // Uložení aktuálního termínu do app
            if (window.app) {
                window.app.currentTerm = term;
            }
        }
        
        // Funkce pro prolinkování termínů v textu
        function linkifyTerms(text) {
            if (!window.app || !window.app.terms) return text;
            
            const terms = window.app.terms;
            
            terms.forEach(term => {
                const regex = new RegExp(`\\b${escapeRegExp(term.term)}\\b`, 'gi');
                text = text.replace(regex, `<a href="#/term/${term.slug}" class="term-link">${term.term}</a>`);
            });
            
            return text;
        }
        
        // Pomocná funkce pro escape regulérních výrazů
        function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        
        // Funkce pro aktualizaci URL a metadat
        function updateUrlAndMetadata(term) {
            const slug = term.slug || term.term.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '');
            
            // Aktualizace URL
            window.history.pushState(
                { term: term.term }, 
                '', 
                `#/term/${encodeURIComponent(slug)}`
            );
            
            // Aktualizace titulku a meta dat
            document.title = `${term.term} | CryptoSlangDecoder`;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', term.definition.slice(0, 160));
            }
        }
        
        // Funkce pro návrat na přehled všech termínů
        window.showAllTerms = function() {
            if (window.app) {
                if (window.app.zobrazitVsechnyTerminy) {
                    try {
                        // Zkusíme použít původní metodu
                        window.app.zobrazitVsechnyTerminy();
                    } catch (e) {
                        console.error('Chyba při použití původní metody, používám vlastní implementaci:', e);
                        
                        // Vlastní implementace zobrazení všech termínů
                        const resultsContainer = document.getElementById('results');
                        if (resultsContainer && window.app.terms) {
                            resultsContainer.className = 'results-grid';
                            resultsContainer.innerHTML = window.app.terms.map(term => `
                                <div class="term-card">
                                    <div class="term-header">
                                        ${term.term}
                                        <span class="term-category">${term.category}</span>
                                    </div>
                                    <p class="term-definition">${term.definition.slice(0, 100).trim()}..</p>
                                </div>
                            `).join('');
                        }
                    }
                    
                    // Aktualizace URL a dalších stavových informací
                    window.history.pushState({}, '', '#');
                    document.title = 'Crypto Slang Decoder - Vysvětlení krypto pojmů';
                    const metaDesc = document.querySelector('meta[name="description"]');
                    if (metaDesc) {
                        metaDesc.setAttribute('content', 'Největší slovník krypto termínů s podrobnými vysvětleními a příklady.');
                    }
                    
                    // Reset aktuálního termínu
                    if (window.app) {
                        window.app.currentTerm = null;
                    }
                }
            }
        };
        
        // Funkce pro kopírování termínu do schránky
        window.copyTermToClipboard = function(termName) {
            if (!window.app || !window.app.terms) return;
            
            const term = window.app.terms.find(t => t.term === termName);
            if (!term) return;
            
            const text = `${term.term} (${term.category})\n\n${term.definition}${term.example ? `\n\nPříklad: ${term.example}` : ''}`;
            
            navigator.clipboard.writeText(text)
                .then(() => {
                    // Zobrazení notifikace
                    const toast = document.createElement('div');
                    toast.className = 'toast toast-success';
                    toast.textContent = 'Zkopírováno!';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 3000);
                })
                .catch(err => {
                    console.error('Chyba při kopírování:', err);
                });
        };
        
        // Nastavení event listeneru pro delegaci kliknutí
        resultsContainer.addEventListener('click', function(event) {
            // Kontrola, zda je kliknuto na kartu nebo její potomky
            const termCard = event.target.closest('.term-card');
            
            if (termCard && !event.target.closest('.term-actions') && !event.target.closest('.back-link')) {
                // Zastavení výchozího chování
                event.preventDefault();
                event.stopPropagation();
                
                // Získání názvu termínu
                const termHeader = termCard.querySelector('.term-header');
                if (!termHeader) return;
                
                const termName = termHeader.childNodes[0].textContent.trim();
                console.log('Kliknuto na termín:', termName);
                
                // Nalezení termínu v datech
                const term = window.app.terms.find(t => t.term === termName);
                if (!term) return;
                
                // Zobrazení detailu
                displayTermDetail(term);
            }
            
            // Kontrola kliknutí na odkaz v textu definice
            if (event.target.classList.contains('term-link')) {
                event.preventDefault();
                
                const href = event.target.getAttribute('href');
                const slug = href.split('/').pop();
                
                const term = window.app.terms.find(t => t.slug === decodeURIComponent(slug));
                if (term) {
                    displayTermDetail(term);
                }
            }
        }, true);
        
        // Kontrola, zda je v URL fragment pro detail
        function checkUrlForDetail() {
            const hash = window.location.hash;
            
            if (hash && hash.includes('/term/')) {
                const slug = decodeURIComponent(hash.split('/').pop());
                
                if (slug && window.app && window.app.terms) {
                    const term = window.app.terms.find(t => t.slug === slug);
                    
                    if (term) {
                        console.log('Načítám detail z URL:', term.term);
                        displayTermDetail(term);
                    }
                }
            }
        }
        
        // Při změně URL kontrolujeme, zda nemáme zobrazit detail
        window.addEventListener('hashchange', checkUrlForDetail);
        
        // Zkontrolujeme URL i při inicializaci
        checkUrlForDetail();
        
        console.log('Nový navigační systém je připraven');
    }
    
    // Po načtení stránky spustíme naši funkci
    document.addEventListener('DOMContentLoaded', function() {
        waitForApp(setupDetailNavigation);
    });
})();
