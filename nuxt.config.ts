/*
 * @Author: 
 * @Date: 2023-12-30 10:38:50
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-15 14:01:31
 * @Description: 
 */
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    modules: [
        '@pinia/nuxt',
        '@element-plus/nuxt',
        '@pinia-plugin-persistedstate/nuxt',
    ],
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
