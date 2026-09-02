export type Lang = "es" | "pt";

export const translations = {
  es: {
    nav: { home: "Inicio", plans: "Áreas de Actuación", about: "El Estudio", diff: "Profesionales", contact: "Contacto", cta: "Contacto" },
    hero: {
      badge: "Estudio Jurídico · Sant'Ana do Livramento, RS",
      title1: "Defensa legal con", title2: "criterio y cercanía",
      desc: "Asesoría jurídica ética y estratégica en Brasil. Acompañamos a personas, familias y empresas con soluciones claras, honorarios transparentes y atención profesional en español y portugués.",
      ctaPlans: "Ver Áreas de Actuación", ctaWhats: "WhatsApp",
    },
    about: {
      kicker: "El Estudio", title: "Abogacía consciente, ética y estratégica",
      body: "Somos un estudio jurídico con sede en Sant'Ana do Livramento, dedicado a brindar asesoría y representación jurídica exclusivamente en Brasil, con tiempo, ética y excelencia técnica. Atendemos en español y portugués, con enfoque preventivo y estrategias adaptadas a cada caso.",
      mission: "Misión", missionBody: "Defender los derechos de nuestros clientes en Brasil con rigor técnico, transparencia y un trato humano real.",
      vision: "Visión", visionBody: "Ser un estudio jurídico de referencia en Rio Grande do Sul, reconocido por la solidez de sus estrategias y el cuidado con cada cliente.",
      philosophy: "Filosofía", philosophyBody: "No perseguimos volumen: buscamos resultados reales y relaciones de confianza duraderas con cada persona que atendemos.",
    },
    plans: {
      kicker: "Áreas de Actuación", title: "Servicios jurídicos a tu medida",
      subtitle: "Asesoría jurídica en Brasil, con honorarios claros, atención cercana y comunicación en español o portugués.",
      perYear: "desde", popular: "Más solicitado", consult: "Consultar por WhatsApp",
      footnote: "Valores de referencia en reales (R$). Cada caso se cotiza tras la consulta inicial. Los servicios jurídicos se prestan exclusivamente en Brasil.",
      items: [
        { name: "Consulta Jurídica", age: "Orientación inicial", price: "R$ 250", old: "", features: ["Análisis del caso en reunión", "Revisión de documentación", "Opinión legal por escrito", "Recomendación de estrategia", "Presupuesto detallado"] },
        { name: "Derecho de Familia", age: "Divorcios, pensiones, sucesiones", price: "R$ 1.900", old: "", features: ["Consulta inicial ampliada", "Redacción de acuerdos", "Representación judicial en Brasil", "Trámite de inventario", "Acompañamiento en audiencias"] },
        { name: "Empresarial y Contratos", age: "PyMEs y emprendedores", price: "R$ 2.500", old: "", popular: true, features: ["Constitución de empresa en Brasil", "Revisión y redacción de contratos", "Asesoría laboral preventiva", "Compliance básico", "Atención mensual (consultas ilimitadas)"] },
        { name: "Derecho Civil", age: "Personas, familias y empresas", price: "Consultar", old: "", features: ["Análisis jurídico del caso", "Obligaciones y contratos", "Responsabilidad civil", "Negociación y acuerdos", "Representación judicial en Brasil"] },
      ],
    },
    diff: {
      kicker: "Profesionales", title: "Experiencia, ética y atención cercana",
      subtitle: "Nuestro equipo combina rigor técnico, claridad y atención personalizada para cada asunto jurídico dentro de Brasil.",
      items: [
        { t: "Honorarios transparentes", d: "Presupuesto claro antes de comenzar, sin sorpresas." }, { t: "Bilingüe ES/PT", d: "Nos comunicamos contigo en español o portugués con claridad." },
        { t: "Enfoque preventivo", d: "Evitar el conflicto es siempre más económico que litigarlo." }, { t: "Educación del cliente", d: "Te explicamos cada paso en lenguaje simple." },
        { t: "Actuación en Brasil", d: "Asesoría y representación jurídica dentro del territorio brasileño." }, { t: "Trato humano", d: "Relaciones de confianza a largo plazo con cada cliente." },
      ],
    },
    contact: {
      kicker: "Contacto", title: "Te esperamos en Livramento", location: "Ubicación", address1: "Rua Uruguai, 1248 · Sala 2", address2: "Sant'Ana do Livramento, RS", parking: "Estacionamiento disponible frente al edificio",
      howto: "Cómo llegar", howto1: "Sant'Ana do Livramento, RS", howto2: "Rio Grande do Sul · Brasil", howto3: "Atención presencial en Sala 2",
      hours: "Horarios", hours1: "Lunes a viernes: 9:00 – 18:00", hours2: "Sábados: 9:00 – 12:00 (con cita)", hours3: "Urgencias fuera de horario por WhatsApp", whats: "WhatsApp",
    },
    footer: "\n",
    brand: { name1: "Estudio", name2: "Jurídico", logoUrl: "" },
    whatsapp: { number: "5555999278466", display: "5555999278466" }, media: { heroImage: "", gallery: [] as string[] },
    theme: { primary: "", primaryForeground: "", secondary: "", accent: "", background: "", foreground: "", muted: "", mutedForeground: "", border: "" },
  },
  pt: {
    nav: { home: "Início", plans: "Áreas de Atuação", about: "O Escritório", diff: "Profissionais", contact: "Contato", cta: "Contato" },
    hero: { badge: "Escritório de Advocacia · Sant'Ana do Livramento, RS", title1: "Defesa jurídica com", title2: "critério e proximidade", desc: "Assessoria jurídica ética e estratégica no Brasil. Acompanhamos pessoas, famílias e empresas com soluções claras, honorários transparentes e atendimento profissional em português e espanhol.", ctaPlans: "Ver Áreas de Atuação", ctaWhats: "WhatsApp" },
    about: { kicker: "O Escritório", title: "Advocacia consciente, ética e estratégica", body: "Somos um escritório de advocacia com sede em Sant'Ana do Livramento, dedicado a prestar assessoria e representação jurídica exclusivamente no Brasil, com tempo, ética e excelência técnica. Atendemos em português e espanhol, com foco preventivo e estratégias adaptadas a cada caso.", mission: "Missão", missionBody: "Defender os direitos dos nossos clientes no Brasil com rigor técnico, transparência e um atendimento humano real.", vision: "Visão", visionBody: "Ser um escritório de advocacia de referência no Rio Grande do Sul, reconhecido pela solidez das estratégias e pelo cuidado com cada cliente.", philosophy: "Filosofia", philosophyBody: "Não buscamos volume: buscamos resultados reais e relações de confiança duradouras com cada pessoa que atendemos." },
    plans: { kicker: "Áreas de Atuação", title: "Serviços jurídicos sob medida", subtitle: "Assessoria jurídica no Brasil, com honorários claros, atendimento próximo e comunicação em português ou espanhol.", perYear: "a partir de", popular: "Mais procurado", consult: "Consultar via WhatsApp", footnote: "Valores de referência em reais (R$). Cada caso é orçado após a consulta inicial. Os serviços jurídicos são prestados exclusivamente no Brasil.", items: [
      { name: "Consulta Jurídica", age: "Orientação inicial", price: "R$ 250", old: "", features: ["Análise do caso em reunião", "Revisão da documentação", "Parecer jurídico por escrito", "Recomendação de estratégia", "Orçamento detalhado"] },
      { name: "Direito de Família", age: "Divórcios, pensões, inventários", price: "R$ 1.900", old: "", features: ["Consulta inicial ampliada", "Redação de acordos", "Representação judicial no Brasil", "Trâmite de inventário", "Acompanhamento em audiências"] },
      { name: "Empresarial e Contratos", age: "PMEs e empreendedores", price: "R$ 2.500", old: "", popular: true, features: ["Constituição de empresa no Brasil", "Revisão e redação de contratos", "Assessoria trabalhista preventiva", "Compliance básico", "Atendimento mensal (consultas ilimitadas)"] },
      { name: "Direito Civil", age: "Pessoas, famílias e empresas", price: "Consultar", old: "", features: ["Análise jurídica do caso", "Obrigações e contratos", "Responsabilidade civil", "Negociação e acordos", "Representação judicial no Brasil"] },
    ] },
    diff: { kicker: "Profissionais", title: "Experiência, ética e atendimento próximo", subtitle: "Nossa equipe combina rigor técnico, clareza e atendimento personalizado para cada questão jurídica dentro do Brasil.", items: [{ t: "Honorários transparentes", d: "Orçamento claro antes de começar, sem surpresas." }, { t: "Bilíngue PT/ES", d: "Nos comunicamos com você em português ou espanhol com clareza." }, { t: "Foco preventivo", d: "Evitar o conflito é sempre mais barato do que litigar." }, { t: "Educação do cliente", d: "Explicamos cada passo em linguagem simples." }, { t: "Atuação no Brasil", d: "Assessoria e representação jurídica dentro do território brasileiro." }, { t: "Atendimento humano", d: "Relações de confiança de longo prazo com cada cliente." }] },
    contact: { kicker: "Contato", title: "Esperamos você em Livramento", location: "Endereço", address1: "Rua Uruguai, 1248 · Sala 2", address2: "Sant'Ana do Livramento, RS", parking: "Estacionamento disponível em frente ao prédio", howto: "Como chegar", howto1: "Sant'Ana do Livramento, RS", howto2: "Rio Grande do Sul · Brasil", howto3: "Atendimento presencial na Sala 2", hours: "Horários", hours1: "Segunda a sexta: 9:00 – 18:00", hours2: "Sábados: 9:00 – 12:00 (com hora marcada)", hours3: "Urgências fora do horário via WhatsApp", whats: "WhatsApp" },
    footer: "\n", brand: { name1: "Escritório", name2: "Jurídico", logoUrl: "" }, whatsapp: { number: "5555999278466", display: "5555999278466" }, media: { heroImage: "", gallery: [] as string[] }, theme: { primary: "", primaryForeground: "", secondary: "", accent: "", background: "", foreground: "", muted: "", mutedForeground: "", border: "" },
  },
} as const;