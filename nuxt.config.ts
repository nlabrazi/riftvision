// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    blizzardClientId: '',
    blizzardClientSecret: '',
  },

  modules: ['@nuxt/hints', '@nuxt/image', '@nuxt/ui'],

  fonts: {
    families: [{ name: 'Rajdhani', provider: 'local' }],
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'RiftVision — Copilote Tactique LoL Second-Screen',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
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
