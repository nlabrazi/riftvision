// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ['@nlabrazi/nuxt-layer'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    health: {
      service: 'riftvision',
    },
    blizzardClientId: '',
    blizzardClientSecret: '',
    scanSecret: '',
    adminSecret: '',
    public: {
      umami: {
        websiteId: '9d922071-eac3-4bc7-9d97-2fc822c63bda',
        domains: 'riftvision.nabster.dev',
      },
      site: {
        name: 'RiftVision',
        url: 'https://riftvision.nabster.dev',
        description: 'Portail multijeu, encyclopédies et compagnon de partie',
      },
    },
  },

  modules: ['@nuxt/hints', '@nuxt/image', '@nuxt/ui'],

  fonts: {
    families: [{ name: 'Rajdhani', provider: 'local' }],
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'RiftVision — Vos jeux, vos parties',
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&display=swap',
        },
      ],
    },
  },
})
