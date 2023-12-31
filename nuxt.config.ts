// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devServer: {
        port: 8889,
    },
    devtools: { enabled: true },
    app: {
        head:{
            title: 'My-library3 (in config)'
        },
    },
});
