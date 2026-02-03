import { useState } from 'react';
import { Link } from 'react-router-dom';
import Master from '../components/layout/Master';
import Section from '../components/section/Section';
import Heading from '../components/heading/Heading';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: 'Kupovina karata',
    question: 'Kako mogu kupiti kartu?',
    answer: 'Da biste kupili kartu, potrebno je da se registrujete i prijavite na nas sistem. Nakon toga, izaberite dogadjaj koji vas interesuje, odaberite tip karte i pratite uputstva za kupovinu. Placanje je moguce putem kreditne kartice ili drugih dostupnih metoda placanja.'
  },
  {
    category: 'Kupovina karata',
    question: 'Sta je red cekanja i kako funkcionise?',
    answer: 'Red cekanja se aktivira kada je potraznja za kartama velika. Kada udjete u red cekanja, dobicete poziciju i obavestenje kada dodjete na red. Nakon sto dobijete pristup, imate ograniceno vreme da zavrsite kupovinu.'
  },
  {
    category: 'Kupovina karata',
    question: 'Koliko vremena imam da zavrsim kupovinu?',
    answer: 'Nakon sto rezervisete karte, imate ograniceno vreme (obicno 10-15 minuta) da zavrsite placanje. Ako ne zavrsite kupovinu u tom roku, karte ce biti oslobodjene i ponovo dostupne drugim korisnicima.'
  },
  {
    category: 'Kupovina karata',
    question: 'Mogu li kupiti vise karata odjednom?',
    answer: 'Da, mozete kupiti vise karata u jednoj transakciji. Maksimalan broj karata po kupovini zavisi od pravila organizatora dogadjaja.'
  },
  {
    category: 'Placanje',
    question: 'Koji nacini placanja su dostupni?',
    answer: 'Prihvatamo placanje kreditnim i debitnim karticama (Visa, MasterCard, Maestro). U zavisnosti od dogadjaja, mogu biti dostupne i druge opcije placanja.'
  },
  {
    category: 'Placanje',
    question: 'Da li je moje placanje sigurno?',
    answer: 'Da, sva placanja se obradjuju putem sigurnih, sertifikovanih platnih sistema. Vasi podaci o kartici se ne cuvaju na nasim serverima i koriste se najnoviji standardi zastite podataka.'
  },
  {
    category: 'Placanje',
    question: 'Sta ako placanje ne prodje?',
    answer: 'Ako placanje ne uspe, vasa rezervacija ostaje aktivna dok ne istekne sesija. Pokusajte ponovo sa drugim nacinom placanja ili proverite da li imate dovoljno sredstava na racunu.'
  },
  {
    category: 'Otkazivanje i povracaj',
    question: 'Mogu li otkazati rezervaciju?',
    answer: 'Da, mozete otkazati rezervaciju pre nego sto zavrsite placanje. Nakon uspesnog placanja, mogucnost otkazivanja zavisi od politike organizatora dogadjaja.'
  },
  {
    category: 'Otkazivanje i povracaj',
    question: 'Kako mogu dobiti povracaj novca?',
    answer: 'Povracaj novca je moguc u skladu sa politikom otkazivanja organizatora. Kontaktirajte nasu korisnicku podrsku sa brojem narudzbine za vise informacija.'
  },
  {
    category: 'Korisnicki nalog',
    question: 'Kako se registrujem?',
    answer: 'Kliknite na dugme "Registracija" u gornjem desnom uglu stranice. Unesite vase ime, email adresu i izaberite lozinku. Nakon potvrde email adrese, vas nalog ce biti aktiviran.'
  },
  {
    category: 'Korisnicki nalog',
    question: 'Zaboravio/la sam lozinku. Sta da radim?',
    answer: 'Na stranici za prijavu kliknite na "Zaboravljena lozinka". Unesite vasu email adresu i poslacemo vam link za resetovanje lozinke.'
  },
  {
    category: 'Korisnicki nalog',
    question: 'Gde mogu videti svoje kupljene karte?',
    answer: 'Sve vase kupljene karte mozete videti u sekciji "Moje karte" nakon prijave na vas nalog. Tamo mozete preuzeti karte u elektronskom formatu.'
  },
];

const Help: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('Sve');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const categories = ['Sve', ...Array.from(new Set(faqData.map(f => f.category)))];

  const filteredFAQ = activeCategory === 'Sve' 
    ? faqData 
    : faqData.filter(f => f.category === activeCategory);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <Master>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Heading type={1} color="text-white" text="Pomoc" />
          <p className="text-xl mt-4 text-blue-100 max-w-2xl mx-auto">
            Pronadjite odgovore na najcesca pitanja
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
            <p className="text-gray-600 text-sm">Saznajte kako da kupite karte za omiljene dogadjaje</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Placanje</h3>
            <p className="text-gray-600 text-sm">Informacije o sigurnom placanju i metodama</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Korisnicki nalog</h3>
            <p className="text-gray-600 text-sm">Upravljanje nalogom i vasim kartama</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <Heading type={2} color="text-gray-800 text-xl" text="Cesto postavljana pitanja" />
          
          {/* Category Filter - All buttons blue with white text */}
          <div className="flex flex-wrap gap-2 mt-6 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium text-white transition ${
                  activeCategory === category
                    ? 'bg-blue-800'
                    : 'bg-blue-600 hover:bg-blue-700'
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
                className=" rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  style={{ backgroundColor: '#2563eb', color: 'white' }}
                  className="w-full px-6 py-4 text-left flex items-center justify-between bg-blue-600 hover:bg-blue-700 transition"
                >
                  <span className="font-medium text-white">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-white transform transition ${
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
                  <div className="px-6 pb-4  bg-white">
                    <p className="text-gray-600 pt-4">{faq.answer}</p>
                    <span className="inline-block mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {faq.category}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Niste pronasli odgovor?</h3>
          <p className="text-gray-600 mb-4">Kontaktirajte nas direktno i rado cemo vam pomoci.</p>
          <Link
            to="/contact"
            style={{ color: 'white' }}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Kontaktirajte nas
          </Link>
        </div>
      </Section>
    </Master>
  );
};

export default Help;