export const professionalContactCopy = {
  es: {
    kicker: "Equipo profesional",
    title: "Contacto directo por WhatsApp",
    description: "Elige con quién deseas comunicarte. Cada botón abre una conversación directa con la persona seleccionada.",
    direct: "WhatsApp directo",
    action: "Contactar",
    aria: (name: string) => `Contactar por WhatsApp con ${name}`,
    footerAria: (name: string) => `WhatsApp de ${name}`,
  },
  pt: {
    kicker: "Equipe profissional",
    title: "Contato direto pelo WhatsApp",
    description: "Escolha com quem deseja falar. Cada botão abre uma conversa direta com a pessoa selecionada.",
    direct: "WhatsApp direto",
    action: "Entrar em contato",
    aria: (name: string) => `Entrar em contato pelo WhatsApp com ${name}`,
    footerAria: (name: string) => `WhatsApp de ${name}`,
  },
} as const;

export type ProfessionalContactLang = keyof typeof professionalContactCopy;
