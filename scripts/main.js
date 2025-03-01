/**
 * HLAVNÍ TŘÍDA APLIKACE
 * @class Obsluhuje veškerou funkcionalitu slovníku
 */
class CryptoSlangDecoder {
    constructor() {
        this.terms = []; // Načtené termíny
        this.currentTerm = null; // Aktuální termín
        this.init();
    }

    /**
     * INICIALIZACE APLIKACE
     * @async
     */
    async init() {
        await this.nacistTerminy();
        this.nastavitVyhledavani();
        this.nastavitRouting();
        this.zobrazitVsechnyTerminy();
    }

    /**
     * NAČTENÍ TERMÍNŮ Z JSON
     * @method
     */
    async nacistTerminy() {
        try {
            const odpoved = await fetch('data/terms.json');
            if (!odpoved.ok) throw new Error('Chyba při čtení souboru');
            this.terms = await odpoved.json();

            // Generování URL slugů
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
     * NASTAVENÍ VYHLEDÁVACÍHO POLÍČKA
     * @method
     */
    nastavitVyhledavani() {
        const vyhledavaciPole = document.getElementById('searchInput');

        // Obnovení vyhledávání z URL
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
     * FILTRACE TERMÍNŮ
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
     * NASTAVENÍ ROUTINGU
     * @method
     */
    nastavitRouting() {
        window.addEventListener('hashchange', () => this.zpracovatRoute());
        window.addEventListener('popstate', () => this.zpracovatRoute());
        this.zpracovatRoute();
    }

    /**
     * ZPRACOVÁNÍ ROUTY
     * @method
     */
    zpracovatRoute() {
        const hash = window.location.hash.substring(1);

        // Zpracování vyhledávání
        if (hash.startsWith('search=')) {
            const dotaz = decodeURIComponent(hash.split('=')[1]);
            const filtrovane = this.filtrovatTerminy(dotaz);
            this.zobrazitVysledky(filtrovane);
            document.getElementById('searchInput').value = dotaz;
            return;
        }

        // Zpracování detailu termínu
        const [route, slug] = hash.split('/');
        switch (route) {
            case 'termin':
                this.zpracovatTerminRoute(slug);
                break;
            default:
                this.zobrazitVsechnyTerminy();
        }
    }

    /**
     * ZOBRAZENÍ DETAILU TERMÍNU
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
     * ZOBRAZENÍ VŠECH TERMÍNŮ
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
     * VYGENEROVÁNÍ VÝSLEDKŮ
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
     * VYTVOŘENÍ KARTY TERMÍNU
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
                <p class="term-definition">${termin.definition.slice(0, 100)}...</p>
            </div>
        `;
    }

    /**
     * ZOBRAZENÍ PLNÉHO DETAILU
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
     * PROLINKOVÁNÍ TERMÍNŮ V TEXTU
     * @method
     * @param {string} text - Text k prolinkování
     * @returns {string} Text s odkazy
     */
    prolinkovatTerminy(text) {
        const termsPattern = this.terms
            .map(t => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|');
        const regex = new RegExp(`\\b(${termsPattern})\\b`, 'gi');

        return text.replace(regex, (shoda) => {
            const termin = this.terms.find(t => t.term.toLowerCase() === shoda.toLowerCase());
            return termin ? `<a href="#/termin/${encodeURIComponent(termin.slug)}" class="internal-link">${shoda}</a>` : shoda;
        });
    }

    /**
     * AKTUALIZACE SEO
     * @method
     * @param {Object} param0 - SEO parametry
     */
    aktualizovatSEO({ title, description }) {
        document.title = title;
        document.querySelector('meta[name="description"]').content = description;
    }

    /**
     * NAVIGACE NA TERMÍN
     * @method
     * @param {string} slug - Identifikátor termínu
     */
    navigovatNaTermin(slug) {
        window.history.pushState({}, '', window.location.href); // Uložení stavu
        window.location.hash = `#/termin/${slug}`;
    }

    /**
     * KOPÍROVÁNÍ TERMÍNU
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
     * TOAST NOTIFIKACE
     * @method
     * @param {string} zprava - Text zprávy
     * @param {string} typ - Typ notifikace
     */
    zobrazitToast(zprava, typ) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${typ}`;
        toast.textContent = zprava;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * ZOBRAZENÍ CHYBY
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