/**
 * HLAVNÍ TŘÍDA APLIKACE
 * @class Obsluhuje veškerou funkcionalitu slovníku
 */
class CryptoSlangDecoder {
    constructor() {
      this.terms = []; 
      this.currentTerm = null; 
      this.init();
    }
  
    async init() {
      await this.nacistTerminy();
      this.nastavitVyhledavani();
      this.nastavitRouting();
      this.zobrazitVsechnyTerminy();
    }
  
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
  
    nastavitVyhledavani() {
      const vyhledavaciPole = document.getElementById('searchInput');
      
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
  
    filtrovatTerminy(dotaz) {
      return this.terms.filter(termin =>
        termin.term.toLowerCase().includes(dotaz) ||
        termin.definition.toLowerCase().includes(dotaz) ||
        termin.category.toLowerCase().includes(dotaz)
      );
    }
  
    nastavitRouting() {
      window.addEventListener('hashchange', () => this.zpracovatRoute());
      this.zpracovatRoute();
    }
  
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
  
    zpracovatTerminRoute(slug) {
      const decodedSlug = decodeURIComponent(slug); // 🔥 ZMĚNA: Dekódování slugu
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
  
    zobrazitVsechnyTerminy() {
      this.zobrazitVysledky(this.terms);
      this.aktualizovatSEO({
        title: 'Crypto Slang Decoder - Kompletní slovník',
        description: 'Vysvětlení všech krypto termínů na jednom místě'
      });
    }
  
    zobrazitVysledky(terminy) {
      const container = document.getElementById('results');
      container.innerHTML = terminy.length > 0 
        ? terminy.map(termin => this.vytvoritTerminKartu(termin)).join('')
        : '<div class="no-results">Žádné výsledky... Zkuste jiný termín</div>';
    }
  
    vytvoritTerminKartu(termin) {
      const safeSlug = encodeURIComponent(termin.slug) // 🔥 ZMĚNA: Escapování slugu
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
            <button class="copy-btn" onclick="app.kopirovatTermin(${JSON.stringify(termin)})">
              📋 Kopírovat
            </button>
          </div>
        </div>
      `;
    }
  
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
  
    aktualizovatSEO({ title, description, canonical }) {
      document.title = title;
      document.querySelector('meta[name="description"]').content = description;
      document.querySelector('link[rel="canonical"]').href = canonical || window.location.href;
    }
  
    navigovatNaTermin(slug) {
      window.location.hash = `#/termin/${slug}`;
    }
  
    kopirovatTermin(termin) {
      const text = `${termin.term} (${termin.category})\n\n${termin.definition}${
        termin.example ? `\n\nPříklad: ${termin.example}` : ''
      }`;
      
      navigator.clipboard.writeText(text)
        .then(() => this.zobrazitToast('Zkopírováno!', 'uspech'))
        .catch(() => this.zobrazitToast('Chyba při kopírování', 'chyba'));
    }
  
    zobrazitToast(zprava, typ = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast toast-${typ}`;
      toast.textContent = zprava;
      document.body.appendChild(toast);
      
      setTimeout(() => toast.remove(), 3000);
    }
  
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
  
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new CryptoSlangDecoder();
  });