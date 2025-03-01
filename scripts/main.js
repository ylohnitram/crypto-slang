/**
 * HLAVNÍ TŘÍDA APLIKACE
 * @class Obsluhuje veškerou funkcionalitu slovníku
 */
class CryptoSlangDecoder {
    constructor() {
      this.terms = []; // Načtené termíny z JSON
      this.currentTerm = null; // Aktuálně zobrazený termín
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
     * NAČTENÍ TERMÍNŮ Z JSON SOUBORU
     * @method
     */
    async nacistTerminy() {
      try {
        const odpoved = await fetch('data/terms.json');
        if (!odpoved.ok) throw new Error('Chyba při čtení souboru');
        
        this.terms = await odpoved.json();
        
        // Generování "slugů" pro hezké URL
        this.terms.forEach(termin => {
          termin.slug = termin.term
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Odstraní diakritiku
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
      
      // Zpoždění pro optimální výkon (300ms debounce)
      let timeout;
      vyhledavaciPole.addEventListener('input', (udalost) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const dotaz = udalost.target.value.toLowerCase();
          const filtrovane = this.filtrovatTerminy(dotaz);
          this.zobrazitVysledky(filtrovane);
        }, 300);
      });
    }
  
    /**
     * FILTRUJE TERMÍNY PODLE DOTAZU
     * @method
     * @param {string} dotaz - Hledaný výraz
     * @returns {Array} Filtrované termíny
     */
    filtrovatTerminy(dotaz) {
      return this.terms.filter(termin =>
        termin.term.toLowerCase().includes(dotaz) ||
        termin.definice.toLowerCase().includes(dotaz) ||
        termin.kategorie.toLowerCase().includes(dotaz)
      );
    }
  
    /**
     * NASTAVENÍ ROUTINGU (SPRÁVA URL)
     * @method
     */
    nastavitRouting() {
      window.addEventListener('hashchange', () => this.zpracovatRoute());
      this.zpracovatRoute();
    }
  
    /**
     * ZPRACOVÁNÍ AKTIVNÍ ROUTY
     * @method
     */
    zpracovatRoute() {
      const hash = window.location.hash.substring(1);
      const [route, slug] = hash.split('/');
  
      switch(route) {
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
     * @param {string} slug - Identifikátor termínu v URL
     */
    zpracovatTerminRoute(slug) {
      const termin = this.terms.find(t => t.slug === slug);
      
      if (termin) {
        this.currentTerm = termin;
        this.zobrazitTermin(termin);
        this.aktualizovatSEO({
          title: `${termin.term} | CryptoSlangDecoder`,
          description: termin.definice.slice(0, 160)
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
        title: 'Crypto Slang Decoder - Kompletní slovník',
        description: 'Vysvětlení všech krypto termínů na jednom místě'
      });
    }
  
    /**
     * VYGENEROVÁNÍ HTML PRO VÝSLEDKY
     * @method
     * @param {Array} terminy - Pole termínů k zobrazení
     */
    zobrazitVysledky(terminy) {
      const container = document.getElementById('results');
      container.innerHTML = terminy.length > 0 
        ? terminy.map(termin => this.vytvoritTerminKartu(termin)).join('')
        : '<div class="no-results">Žádné výsledky... Zkuste jiný termín</div>';
    }
  
    /**
     * VYTVOŘENÍ HTML KARTY TERMÍNU
     * @method
     * @param {Object} termin - Termín k zobrazení
     * @returns {string} HTML kód karty
     */
    vytvoritTerminKartu(termin) {
      return `
        <div class="term-card" onclick="app.navigovatNaTermin('${termin.slug}')">
          <div class="term-header">
            ${termin.term}
            <span class="term-category">${termin.kategorie}</span>
          </div>
          <p class="term-definition">${termin.definice.slice(0, 100)}...</p>
        </div>
      `;
    }
  
    /**
     * ZOBRAZENÍ PLNÉHO DETAILU TERMÍNU
     * @method
     * @param {Object} termin - Termín k zobrazení
     */
    zobrazitTermin(termin) {
      const container = document.getElementById('results');
      container.innerHTML = `
        <div class="term-card">
          <div class="term-header">
            ${termin.term}
            <span class="term-category">${termin.kategorie}</span>
          </div>
          <div class="term-body">
            <p class="term-definition">${this.prolinkovatTerminy(termin.definice)}</p>
            ${termin.priklad ? `
            <div class="term-example">
              📌 Příklad: <em>${termin.priklad}</em>
            </div>` : ''}
            <button class="copy-btn" onclick="app.kopirovatTermin(${JSON.stringify(termin)})">
              📋 Kopírovat
            </button>
          </div>
        </div>
      `;
    }
  
    /**
     * AUTOMATICKÉ PROLINKOVÁNÍ TERMÍNŮ V TEXTU
     * @method
     * @param {string} text - Text k prolinkování
     * @returns {string} Text s HTML odkazy
     */
    prolinkovatTerminy(text) {
      return text.replace(/(DeFi|NFT|DAO|Web3)/gi, shoda => {
        const termin = this.terms.find(t => t.term.toLowerCase() === shoda.toLowerCase());
        return termin ? `<a href="#/termin/${termin.slug}" class="internal-link">${shoda}</a>` : shoda;
      });
    }
  
    /**
     * AKTUALIZACE SEO META TAGŮ
     * @method
     * @param {Object} param0 - SEO parametry
     */
    aktualizovatSEO({ title, description, canonical }) {
      document.title = title;
      document.querySelector('meta[name="description"]').content = description;
      document.querySelector('link[rel="canonical"]').href = canonical || window.location.href;
    }
  
    /**
     * NAVIGACE NA DETAIL TERMÍNU
     * @method
     * @param {string} slug - Identifikátor termínu
     */
    navigovatNaTermin(slug) {
      window.location.hash = `#/termin/${slug}`;
    }
  
    /**
     * KOPÍROVÁNÍ TERMÍNU DO SCHRÁNKY
     * @method
     * @param {Object} termin - Termín ke kopírování
     */
    kopirovatTermin(termin) {
      const text = `${termin.term} (${termin.kategorie})\n\n${termin.definice}${
        termin.priklad ? `\n\nPříklad: ${termin.priklad}` : ''
      }`;
      
      navigator.clipboard.writeText(text)
        .then(() => this.zobrazitToast('Zkopírováno!', 'uspech'))
        .catch(() => this.zobrazitToast('Chyba při kopírování', 'chyba'));
    }
  
    /**
     * ZOBRAZENÍ TOAST NOTIFIKACE
     * @method
     * @param {string} zprava - Text zprávy
     * @param {string} typ - Typ notifikace (uspech/chyba/info)
     */
    zobrazitToast(zprava, typ = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast toast-${typ}`;
      toast.textContent = zprava;
      document.body.appendChild(toast);
      
      setTimeout(() => toast.remove(), 3000);
    }
  
    /**
     * ZOBRAZENÍ GLOBÁLNÍ CHYBOVÉ ZPRÁVY
     * @method
     * @param {string} zprava - Text chyby
     */
    zobrazitChybu(zprava) {
      const chybovaZprava = document.createElement('div');
      chybovaZprava.className = 'global-error';
      chybovaZprava.innerHTML = `
        ❌ ${zprava}
        <button onclick="this.parentElement.remove()">×</button>
      `;
      document.body.prepend(chybovaZprava);
    }
  }
  
  // Inicializace aplikace po načtení stránky
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new CryptoSlangDecoder();
  });