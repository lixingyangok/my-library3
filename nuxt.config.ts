/*
 * @Author: Merlin
 * @Date: 2023-12-30 10:38:50
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-06 13:55:57
 * @Description: 
 */
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    // modules: [
    //     ['element-ui/nuxt', { cdn: true, css: false }]
    // ],
    ssr: true,
    devServer: {
        port: 8899,
    },
    devtools: { enabled: true },
    app: {
        head:{
            title: 'My-library3 (in config)'
        },
    },
    build: {

    },
});
