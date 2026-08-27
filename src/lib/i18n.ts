export type Lang = "es" | "pt";

export const translations = {
  es: {
    nav: { home: "Inicio", plans: "Servicios", about: "Nosotros", diff: "Diferenciadores", contact: "Contacto", cta: "Agendar Consulta" },
    hero: {
      badge: "Estudio Jurídico · Sant'Ana do Livramento, RS",
      title1: "Defensa legal con", title2: "criterio y cercanía",
      desc: "Asesoría jurídica ética y estratégica en la frontera Brasil–Uruguay. Acompañamos a personas y empresas con soluciones claras, honorarios transparentes y atención en español y portugués.",
      ctaPlans: "Ver Servicios", ctaWhats: "WhatsApp",
    },
    about: {
      kicker: "Quiénes Somos", title: "Abogacía consciente en la Frontera de la Paz",
      body: "Somos un estudio jurídico binacional que nace en Sant'Ana do Livramento con una visión clara: brindar defensa legal con tiempo, ética y excelencia técnica. Atendemos a clientes de Livramento y Rivera en su idioma, con enfoque preventivo y estrategias adaptadas a cada caso.",
      mission: "Misión", missionBody: "Defender los derechos de nuestros clientes con rigor técnico, transparencia y un trato humano real, en ambos lados de la frontera.",
      vision: "Visión", visionBody: "Ser el estudio jurídico de referencia en la Campanha Gaúcha, reconocido por la solidez de sus estrategias y el cuidado con cada cliente.",
      philosophy: "Filosofía", philosophyBody: "No perseguimos volumen: buscamos resultados reales y relaciones de confianza duraderas con cada persona que atendemos.",
    },
    plans: {
      kicker: "Áreas de Práctica", title: "Servicios jurídicos a tu medida",
      subtitle: "Planes de asesoría diseñados para acompañarte a lo largo del proceso, con honorarios claros y atención bilingüe de lunes a sábado.",
      perYear: "desde", popular: "Más solicitado", consult: "Consultar por WhatsApp",
      footnote: "Valores de referencia en reales (R$). Cada caso se cotiza tras la consulta inicial. Atención en español y portugués.",
      items: [
        { name: "Consulta Jurídica", age: "Orientación inicial", price: "R$ 250", old: "", features: ["Análisis del caso en reunión", "Revisión de documentación", "Opinión legal por escrito", "Recomendación de estrategia", "Presupuesto detallado"] },
        { name: "Derecho de Familia", age: "Divorcios, pensiones, sucesiones", price: "R$ 1.900", old: "", features: ["Consulta inicial ampliada", "Redacción de acuerdos", "Representación judicial", "Trámite de inventario", "Acompañamiento en audiencias"] },
        { name: "Empresarial y Contratos", age: "PyMEs y emprendedores", price: "R$ 2.500", old: "", popular: true, features: ["Constitución de empresa", "Revisión y redacción de contratos", "Asesoría laboral preventiva", "Compliance básico", "Atención mensual (consultas ilimitadas)"] },
        { name: "Fronterizo Brasil–Uruguay", age: "Personas y empresas binacionales", price: "R$ 3.200", old: "", features: ["Regularización migratoria", "Doble nacionalidad y residencia", "Contratos internacionales", "Trámites en ambos países", "Coordinación con contadores UY/BR"] },
      ],
    },
    diff: {
      kicker: "¿En qué nos diferenciamos?", title: "Derecho con propósito",
      subtitle: "En la abogacía tradicional se ha perdido la cercanía. Nuestro enfoque devuelve la claridad y la ética a cada caso en la frontera.",
      items: [
        { t: "Honorarios transparentes", d: "Presupuesto claro antes de comenzar, sin sorpresas." }, { t: "Bilingüe ES/PT", d: "Te atendemos en tu idioma, seas de Livramento o de Rivera." },
        { t: "Enfoque preventivo", d: "Evitar el conflicto es siempre más económico que litigarlo." }, { t: "Educación del cliente", d: "Te explicamos cada paso en lenguaje simple." },
        { t: "Experiencia binacional", d: "Casos con implicancias en Brasil y Uruguay." }, { t: "Trato humano", d: "Relaciones de confianza a largo plazo con cada cliente." },
      ],
    },
    contact: {
      kicker: "Contacto", title: "Te esperamos en Livramento", location: "Ubicación", address1: "Rua dos Andradas, 750 · Sala 302", address2: "Centro · Sant'Ana do Livramento, RS", parking: "Estacionamiento disponible frente al edificio",
      howto: "Cómo llegar", howto1: "A 2 cuadras de la Praça Internacional", howto2: "A 5 min en auto desde Rivera (UY)", howto3: "Líneas urbanas: Centro, Wilson y Armour",
      hours: "Horarios", hours1: "Lunes a viernes: 9:00 – 18:00", hours2: "Sábados: 9:00 – 12:00 (con cita)", hours3: "Urgencias fuera de horario por WhatsApp", whats: "WhatsApp",
    },
    footer: "Abogacía consciente · Frontera de la Paz",
    brand: { name1: "Estudio", name2: "Jurídico", logoUrl: "" },
    whatsapp: { number: "", display: "" }, media: { heroImage: "", gallery: [] as string[] },
    theme: { primary: "", primaryForeground: "", secondary: "", accent: "", background: "", foreground: "", muted: "", mutedForeground: "", border: "" },
  },
  pt: {
    nav: { home: "Início", plans: "Serviços", about: "Sobre nós", diff: "Diferenciais", contact: "Contato", cta: "Agendar Consulta" },
    hero: { badge: "Escritório de Advocacia · Sant'Ana do Livramento, RS", title1: "Defesa jurídica com", title2: "critério e proximidade", desc: "Assessoria jurídica ética e estratégica na fronteira Brasil–Uruguai. Acompanhamos pessoas e empresas com soluções claras, honorários transparentes e atendimento em português e espanhol.", ctaPlans: "Ver Serviços", ctaWhats: "WhatsApp" },
    about: { kicker: "Quem Somos", title: "Advocacia consciente na Fronteira da Paz", body: "Somos um escritório de advocacia binacional que nasce em Sant'Ana do Livramento com uma visão clara: oferecer defesa jurídica com tempo, ética e excelência técnica. Atendemos clientes de Livramento e Rivera no seu idioma, com foco preventivo e estratégias adaptadas a cada caso.", mission: "Missão", missionBody: "Defender os direitos dos nossos clientes com rigor técnico, transparência e um atendimento humano real, dos dois lados da fronteira.", vision: "Visão", visionBody: "Ser o escritório de advocacia de referência na Campanha Gaúcha, reconhecido pela solidez das estratégias e pelo cuidado com cada cliente.", philosophy: "Filosofia", philosophyBody: "Não buscamos volume: buscamos resultados reais e relações de confiança duradouras com cada pessoa que atendemos." },
    plans: { kicker: "Áreas de Atuação", title: "Serviços jurídicos sob medida", subtitle: "Planos de assessoria pensados para acompanhar você durante todo o processo, com honorários claros e atendimento bilíngue de segunda a sábado.", perYear: "a partir de", popular: "Mais procurado", consult: "Consultar via WhatsApp", footnote: "Valores de referência em reais (R$). Cada caso é orçado após a consulta inicial. Atendimento em português e espanhol.", items: [
      { name: "Consulta Jurídica", age: "Orientação inicial", price: "R$ 250", old: "", features: ["Análise do caso em reunião", "Revisão da documentação", "Parecer jurídico por escrito", "Recomendação de estratégia", "Orçamento detalhado"] },
      { name: "Direito de Família", age: "Divórcios, pensões, inventários", price: "R$ 1.900", old: "", features: ["Consulta inicial ampliada", "Redação de acordos", "Representação judicial", "Trâmite de inventário", "Acompanhamento em audiências"] },
      { name: "Empresarial e Contratos", age: "PMEs e empreendedores", price: "R$ 2.500", old: "", popular: true, features: ["Constituição de empresa", "Revisão e redação de contratos", "Assessoria trabalhista preventiva", "Compliance básico", "Atendimento mensal (consultas ilimitadas)"] },
      { name: "Fronteiriço Brasil–Uruguai", age: "Pessoas e empresas binacionais", price: "R$ 3.200", old: "", features: ["Regularização migratória", "Dupla nacionalidade e residência", "Contratos internacionais", "Trâmites nos dois países", "Coordenação com contadores UY/BR"] },
    ] },
    diff: { kicker: "No que nos diferenciamos?", title: "Direito com propósito", subtitle: "Na advocacia tradicional a proximidade se perdeu. Nossa abordagem devolve clareza e ética a cada caso na fronteira.", items: [{ t: "Honorários transparentes", d: "Orçamento claro antes de começar, sem surpresas." }, { t: "Bilíngue PT/ES", d: "Atendemos você no seu idioma, seja de Livramento ou de Rivera." }, { t: "Foco preventivo", d: "Evitar o conflito é sempre mais barato do que litigar." }, { t: "Educação do cliente", d: "Explicamos cada passo em linguagem simples." }, { t: "Experiência binacional", d: "Casos com implicações no Brasil e no Uruguai." }, { t: "Atendimento humano", d: "Relações de confiança de longo prazo com cada cliente." }] },
    contact: { kicker: "Contato", title: "Esperamos você em Livramento", location: "Endereço", address1: "Rua dos Andradas, 750 · Sala 302", address2: "Centro · Sant'Ana do Livramento, RS", parking: "Estacionamento disponível em frente ao prédio", howto: "Como chegar", howto1: "A 2 quadras da Praça Internacional", howto2: "A 5 min de carro desde Rivera (UY)", howto3: "Linhas urbanas: Centro, Wilson y Armour", hours: "Horários", hours1: "Segunda a sexta: 9:00 – 18:00", hours2: "Sábados: 9:00 – 12:00 (com hora marcada)", hours3: "Urgências fora do horário via WhatsApp", whats: "WhatsApp" },
    footer: "Advocacia consciente · Fronteira da Paz", brand: { name1: "Escritório", name2: "Jurídico", logoUrl: "" }, whatsapp: { number: "", display: "" }, media: { heroImage: "", gallery: [] as string[] }, theme: { primary: "", primaryForeground: "", secondary: "", accent: "", background: "", foreground: "", muted: "", mutedForeground: "", border: "" },
  },
} as const;
