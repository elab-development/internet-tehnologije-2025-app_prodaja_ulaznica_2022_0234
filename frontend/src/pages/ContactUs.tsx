import { useState } from 'react';
import { useAlert } from '../hooks/useAlert';
import { api } from '../services/api';
import Master from '../Components/layout/Master';
import Section from '../Components/Section/Section';
import Heading from '../Components/Heading/Heading';
import Input from '../components/form/Input';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Kupovina karata
  {
    category: 'Kupovina karata',
    question: 'Kako mogu kupiti kartu?',
    answer: 'Da biste kupili kartu, potrebno je da se registrujete i prijavite na naš sistem. Nakon toga, izaberite događaj koji vas interesuje, odaberite tip karte i pratite uputstva za kupovinu. Plaćanje je moguće putem kreditne kartice ili drugih dostupnih metoda plaćanja.'
  },
  {
    category: 'Kupovina karata',
    question: 'Šta je red čekanja i kako funkcioniše?',
    answer: 'Red čekanja se aktivira kada je potražnja za kartama velika. Kada uđete u red čekanja, dobićete poziciju i obaveštenje kada dođete na red. Nakon što dobijete pristup, imate ograničeno vreme da završite kupovinu.'
  },
  {
    category: 'Kupovina karata',
    question: 'Koliko vremena imam da završim kupovinu?',
    answer: 'Nakon što rezervišete karte, imate ograničeno vreme (obično 10-15 minuta) da završite plaćanje. Ako ne završite kupovinu u tom roku, karte će biti oslobođene i ponovo dostupne drugim korisnicima.'
  },
  {
    category: 'Kupovina karata',
    question: 'Mogu li kupiti više karata odjednom?',
    answer: 'Da, možete kupiti više karata u jednoj transakciji. Maksimalan broj karata po kupovini zavisi od pravila organizatora događaja.'
  },
  // Plaćanje
  {
    category: 'Plaćanje',
    question: 'Koji načini plaćanja su dostupni?',
    answer: 'Prihvatamo plaćanje kreditnim i debitnim karticama (Visa, MasterCard, Maestro). U zavisnosti od događaja, mogu biti dostupne i druge opcije plaćanja.'
  },
  {
    category: 'Plaćanje',
    question: 'Da li je moje plaćanje sigurno?',
    answer: 'Da, sva plaćanja se obrađuju putem sigurnih, sertifikovanih platnih sistema. Vaši podaci o kartici se ne čuvaju na našim serverima i koriste se najnoviji standardi zaštite podataka.'
  },
  {
    category: 'Plaćanje',
    question: 'Šta ako plaćanje ne prođe?',
    answer: 'Ako plaćanje ne uspe, vaša rezervacija ostaje aktivna dok ne istekne sesija. Pokušajte ponovo sa drugim načinom plaćanja ili proverite da li imate dovoljno sredstava na računu.'
  },
  // Otkazivanje i povraćaj
  {
    category: 'Otkazivanje i povraćaj',
    question: 'Mogu li otkazati rezervaciju?',
    answer: 'Da, možete otkazati rezervaciju pre nego što završite plaćanje. Nakon uspešnog plaćanja, mogućnost otkazivanja zavisi od politike organizatora događaja.'
  },
  {
    category: 'Otkazivanje i povraćaj',
    question: 'Kako mogu dobiti povraćaj novca?',
    answer: 'Povraćaj novca je moguć u skladu sa politikom otkazivanja organizatora. Kontaktirajte našu korisničku podršku sa brojem narudžbine za više informacija.'
  },
  // Korisnički nalog
  {
    category: 'Korisnički nalog',
    question: 'Kako se registrujem?',
    answer: 'Kliknite na dugme "Registracija" u gornjem desnom uglu stranice. Unesite vaše ime, email adresu i izaberite lozinku. Nakon potvrde email adrese, vaš nalog će biti aktiviran.'
  },
  {
    category: 'Korisnički nalog',
    question: 'Zaboravio/la sam lozinku. Šta da radim?',
    answer: 'Na stranici za prijavu kliknite na "Zaboravljena lozinka". Unesite vašu email adresu i poslaćemo vam link za resetovanje lozinke.'
  },
  {
    category: 'Korisnički nalog',
    question: 'Gde mogu videti svoje kupljene karte?',
    answer: 'Sve vaše kupljene karte možete videti u sekciji "Moje karte" nakon prijave na vaš nalog. Tamo možete preuzeti karte u elektronskom formatu.'
  },
];

const HelpContact: React.FC = () => {
  const { showAlert } = useAlert();
  const [activeCategory, setActiveCategory] = useState<string>('Sve');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const categories = ['Sve', ...Array.from(new Set(faqData.map(f => f.category)))];

  const filteredFAQ = activeCategory === 'Sve' 
    ? faqData 
    : faqData.filter(f => f.category === activeCategory);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/contact', contactForm);
      showAlert({
        type: 'success',
        text: 'Vaša poruka je uspešno poslata! Odgovorićemo vam u najkraćem roku.',
        show: true,
      });
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: error.response?.data?.message || 'Greška pri slanju poruke. Molimo pokušajte ponovo.',
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <Master>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Heading type={1} color="text-white" text="Pomoć i Kontakt" />
          <p className="text-xl mt-4 text-blue-100 max-w-2xl mx-auto">
            Pronađite odgovore na najčešća pitanja ili nas kontaktirajte direktno
          </p>
        </div>
      </div>

      <Section className="container mx-auto px-4 py-12">
        {/* Quick Help Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Kupovina karata</h3>
            <p className="text-gray-600 text-sm">Saznajte kako da kupite karte za omiljene događaje</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Plaćanje</h3>
            <p className="text-gray-600 text-sm">Informacije o sigurnom plaćanju i metodama</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Korisnički nalog</h3>
            <p className="text-gray-600 text-sm">Upravljanje nalogom i vašim kartama</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <Heading type={2} color="text-gray-800" text="Često postavljana pitanja" />
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mt-6 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQ.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <span className="font-medium text-gray-800">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transform transition ${
                      expandedFAQ === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                    <span className="inline-block mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {faq.category}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Heading type={2} color="text-gray-800" text="Kontaktirajte nas" />
            <p className="text-gray-600 mt-2 mb-6">
              Niste pronašli odgovor? Pošaljite nam poruku i odgovorićemo vam u najkraćem roku.
            </p>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ime i prezime
                </label>
                <Input
                  name="name"
                  type="text"
                  value={contactForm.name}
                  onChange={handleContactChange}
                  required
                  maxLength={100}
                  placeholder="Vaše ime"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email adresa
                </label>
                <Input
                  name="email"
                  type="email"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  required
                  maxLength={100}
                  placeholder="vas@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tema
                </label>
                <select
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleContactChange as any}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="">Izaberite temu</option>
                  <option value="kupovina">Kupovina karata</option>
                  <option value="placanje">Plaćanje</option>
                  <option value="otkazivanje">Otkazivanje / Povraćaj</option>
                  <option value="tehnicka-podrska">Tehnička podrška</option>
                  <option value="ostalo">Ostalo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poruka
                </label>
                <textarea
                  name="message"
                  value={contactForm.message}
                  onChange={handleContactChange}
                  required
                  maxLength={1000}
                  rows={5}
                  placeholder="Opišite vaš problem ili pitanje..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Slanje...' : 'Pošalji poruku'}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div>
            <Heading type={2} color="text-gray-800" text="Kontakt informacije" />
            <p className="text-gray-600 mt-2 mb-6">
              Možete nas kontaktirati i direktno putem sledećih kanala:
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Email</h4>
                  <p className="text-gray-600">podrska@ticketing.rs</p>
                  <p className="text-sm text-gray-500">Odgovaramo u roku od 24h</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Telefon</h4>
                  <p className="text-gray-600">+381 11 123 4567</p>
                  <p className="text-sm text-gray-500">Pon-Pet: 09:00 - 17:00</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Adresa</h4>
                  <p className="text-gray-600">Jove Ilića 154</p>
                  <p className="text-gray-600">11000 Beograd, Srbija</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Radno vreme podrške</h4>
                  <p className="text-gray-600">Ponedeljak - Petak: 09:00 - 17:00</p>
                  <p className="text-gray-600">Subota: 10:00 - 14:00</p>
                  <p className="text-sm text-gray-500">Nedelja: zatvoreno</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-8 pt-6 border-t">
              <h4 className="font-semibold text-gray-800 mb-4">Pratite nas</h4>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center hover:bg-pink-700 transition"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition"
                  aria-label="X (Twitter)"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </Master>
  );
};

export default HelpContact;