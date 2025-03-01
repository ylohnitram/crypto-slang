/**
 * HLAVNÍ TŘÍDA APLIKACE
 * @class Obsluhuje funkcionalitu slovníku včetně vyhledávání, routování a zobrazování termínů
 */
class CryptoSlangDecoder {
    /**
     * Inicializuje aplikaci
     * @constructor
     */
    constructor() {
        /** @member {Array} terms - Načtené termíny */
        this.terms = [];
        
        /** @member {Object|null} currentTerm - Aktuálně zobrazený termín */
        this.currentTerm = null;
        
        this.init();
    }

    /**
     * Hlavní inicializační metoda
     * @async
     * @method
     */
    async init() {
        await this.nacistTerminy();
        this.nastavitVyhledavani();
        this.nastavitRouting();
        this.zobrazitVsechnyTerminy();
    }

    /**
     * Načte termíny z JSON souboru
     * @async
     * @method
     * @throws {Error} Pokud se nepodaří načíst data
     */
    async nacistTerminy() {
        try {
            const odpoved = await fetch('data/terms.json');
            if (!odpoved.ok) throw new Error('Chyba při čtení souboru');
            
            this.terms = await odpoved.json();
            
            this.terms.forEach(termin => {
                termin.slug = termin.term
                    .toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/ /g, '-')
                    .replace(/[^\w-]+/g, '');
            });
        } catch (chyba) {
            console.error('Chyba:', chyba);
            this.zobrazitChybu('Data se nepodařilo načíst. Zkuste obnovit stránku.');
        }
    }

    /**
     * Nastaví vyhledávací funkcionalitu s debounce
     * @method
     */
    nastavitVyhledavani() {
        const vyhledavaciPole = document.getElementById('searchInput');
        
        // Obnovení stavu z URL
        const initialSearch = window.location.hash.match(/#search=(.+)/)?.[1];
        if (initialSearch) {
            const decodedSearch = decodeURIComponent(initialSearch);
            vyhledavaciPole.value = decodedSearch;
            this.zobrazitVysledky(this.filtrovatTerminy(decodedSearch));
        }

        let timeout;
        vyhledavaciPole.addEventListener('input', (udalost) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const dotaz = udalost.target.value.trim().toLowerCase();
                window.location.hash = dotaz ? `#search=${encodeURIComponent(dotaz)}` : '#';
                this.zobrazitVysledky(this.filtrovatTerminy(dotaz));
            }, 300);
        });
    }

    /**
     * Filtruje termíny podle dotazu
     * @method
     * @param {string} dotaz - Hledaný výraz
     * @returns {Array} Filtrované termíny
     */
    filtrovatTerminy(dotaz) {
        return this.terms.filter(termin =>
            termin.term.toLowerCase().includes(dotaz) ||
            termin.definition.toLowerCase().includes(dotaz) ||
            termin.category.toLowerCase().includes(dotaz)
        );
    }

    /**
     * Nastaví routing pro SPA navigaci
     * @method
     */
    nastavitRouting() {
        window.addEventListener('hashchange', () => this.zpracovatRoute());
        window.addEventListener('popstate', () => this.zpracovatRoute());
        this.zpracovatRoute();
    }

    /**
     * Zpracuje aktuální URL hash
     * @method
     */
    zpracovatRoute() {
        const hash = window.location.hash.substring(1);

        // Zpracování vyhledávacího dotazu
        if (hash.startsWith('search=')) {
            const dotaz = decodeURIComponent(hash.split('=')[1]);
            this.zobrazitVysledky(this.filtrovatTerminy(dotaz));
            document.getElementById('searchInput').value = dotaz;
            return;
        }

	// Zpracování detailu termínu
        const [route, slug] = hash.split('/');
        if (route === 'term' || route === 'termin') {
            this.zpracovatTerminRoute(slug);
        } else {
            this.zobrazitVsechnyTerminy();
        }
    }

    /**
     * Zobrazí detail termínu podle slugu
     * @method
     * @param {string} slug - Identifikátor termínu
     */
    zpracovatTerminRoute(slug) {
        const decodedSlug = decodeURIComponent(slug);
        const termin = this.terms.find(t => t.slug === decodedSlug);
        
        if (termin) {
            this.currentTerm = termin;
            this.zobrazitTermin(termin);
            this.aktualizovatSEO({
                title: `${termin.term} | CryptoSlangDecoder`,
                description: termin.definition.slice(0, 160)
            });
        } else {
            this.zobrazitVsechnyTerminy();
        }
    }

    /**
     * Vykreslí všechny termíny
     * @method
     */
    zobrazitVsechnyTerminy() {
        this.zobrazitVysledky(this.terms);
        this.aktualizovatSEO({
            title: 'Crypto Slang Decoder',
            description: 'Kompletní slovník krypto termínů'
        });
    }

    /**
     * Generuje HTML pro zobrazení výsledků
     * @method
     * @param {Array} terminy - Pole termínů k zobrazení
     */
    zobrazitVysledky(terminy) {
        const container = document.getElementById('results');
        container.innerHTML = terminy.length > 0
            ? terminy.map(termin => this.vytvoritTerminKartu(termin)).join('')
            : '<div class="no-results">Žádné výsledky...</div>';
    }

    /**
     * Vytvoří HTML karty termínu
     * @method
     * @param {Object} termin - Termín k zobrazení
     * @returns {string} HTML karta
     */
    vytvoritTerminKartu(termin) {
        const safeSlug = encodeURIComponent(termin.slug)
            .replace(/'/g, "%27")
            .replace(/"/g, "%22");

        return `
            <div class="term-card" onclick="app.navigovatNaTermin('${safeSlug}')">
                <div class="term-header">
                    ${termin.term}
                    <span class="term-category">${termin.category}</span>
                </div>
                <p class="term-definition">${termin.definition.slice(0, 100).trim()}..</p>
            </div>
        `;
    }

    /**
     * Zobrazí detailní pohled termínu
     * @method
     * @param {Object} termin - Termín k zobrazení
     */
    zobrazitTermin(termin) {
        const container = document.getElementById('results');
        container.innerHTML = `
            <div class="term-card">
                <div class="term-header">
                    ${termin.term}
                    <span class="term-category">${termin.category}</span>
                </div>
                <div class="term-body">
                    <p class="term-definition">${this.prolinkovatTerminy(termin.definition)}</p>
                    ${termin.example ? `
                    <div class="term-example">
                        📌 Příklad: <em>${termin.example}</em>
                    </div>` : ''}
                    <button class="copy-btn" onclick="app.kopirovatTermin(${JSON.stringify(termin).replace(/</g, '&lt;')})">
                        📋 Kopírovat
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Prolinkuje termíny v textu na jejich detaily
     * @method
     * @param {string} text - Text k prolinkování
     * @returns {string} Prolinkovaný text
     */
    prolinkovatTerminy(text) {
        const termsPattern = this.terms
            .map(t => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|');
        const regex = new RegExp(`\\b(${termsPattern})\\b`, 'gi');
        
        return text.replace(regex, (shoda) => {
            const termin = this.terms.find(t => t.term.toLowerCase() === shoda.toLowerCase());
            return termin ? `<a href="#/term/${encodeURIComponent(termin.slug)}" class="internal-link">${shoda}</a>` : shoda;  // Změněno z '#/termin/' na '#/term/'
        });
    }

    /**
     * Aktualizuje SEO metadata
     * @method
     * @param {Object} param0 - SEO parametry
     * @param {string} param0.title - Titulek stránky
     * @param {string} param0.description - Popis stránky
     */
    aktualizovatSEO({ title, description }) {
        document.title = title;
        document.querySelector('meta[name="description"]').setAttribute('content', description);
    }

    /**
     * Naviguje na detail termínu
     * @method
     * @param {string} slug - Identifikátor termínu
     */
    navigovatNaTermin(slug) {
        const currentSearch = window.location.hash.startsWith('#search=') 
            ? window.location.hash 
            : '';
        window.history.pushState({ search: currentSearch }, '');
        window.location.hash = `#/term/${slug}`;  // Změněno z '#/termin/' na '#/term/'
    }

    /**
     * Zkopíruje termín do schránky
     * @method
     * @param {Object} termin - Termín ke kopírování
     */
    kopirovatTermin(termin) {
        const text = `${termin.term} (${termin.category})\n\n${termin.definition}${termin.example ? `\n\nPříklad: ${termin.example}` : ''}`;
        navigator.clipboard.writeText(text)
            .then(() => this.zobrazitToast('Zkopírováno!', 'success'))
            .catch(() => this.zobrazitToast('Chyba při kopírování', 'error'));
    }

    /**
     * Zobrazí toast notifikaci
     * @method
     * @param {string} zprava - Text zprávy
     * @param {string} typ - Typ notifikace (success/error/info)
     */
    zobrazitToast(zprava, typ) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${typ}`;
        toast.textContent = zprava;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * Zobrazí globální chybovou zprávu
     * @method
     * @param {string} zprava - Text chyby
     */
    zobrazitChybu(zprava) {
        const chyba = document.createElement('div');
        chyba.className = 'global-error';
        chyba.innerHTML = `
            ❌ ${zprava}
            <button onclick="this.parentElement.remove()">×</button>
        `;
        document.body.prepend(chyba);
    }
}

// Inicializace aplikace
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CryptoSlangDecoder();
});
