// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    // modules: [
    //     ['element-ui/nuxt', { cdn: true, css: false }]
    // ],
    devServer: {
        port: 8889,
    },
    devtools: { enabled: true },
    app: {
        head:{
            title: 'My-library3 (in config)'
        },
    },
    build: {

    }
});
