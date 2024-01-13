/*
 * @Author: Merlin
 * @Date: 2024-01-01 19:59:31
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-13 15:10:47
 * @Description: 
 */
export default defineNuxtPlugin(nuxtApp => {
    // Doing something with nuxtApp
    import('https://cdn.jsdelivr.net/npm/@element-plus/nuxt@1.0.7/+esm').then(res=>{
        console.log("element", );
        console.log(res);
    });
});



