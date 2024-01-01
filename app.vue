<!--
 * @Author: Merlin
 * @Date: 2023-12-30 10:38:50
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-01 16:29:15
 * @Description: 
-->
<template>
    <Navigation class="nav" ></Navigation>
    <main class="main-part">
        <NuxtPage />
    </main>
</template>

<script setup>

useHead({
    title: 'haha',
    link: [{
        rel: 'stylesheet',
        type: 'text/css',
        href: 'https://cdn.jsdelivr.net/npm/reset-css@5.0.2/reset.min.css',
    }, {
        rel: 'stylesheet',
        type: 'text/css',
        href: 'https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.2/css/all.min.css',
    } ],
});
if (process.client){
    // var camera = window.FontAwesome.icon({ prefix: 'fas', iconName: 'camera' });
    // console.log("camera", camera);

}
</script>

<style lang="scss" >
body > #__nuxt{
    // display: flex;
    --nav-width: 55px;
    // min-height: 100vh;
    position: relative;
    .nav{
        width: var(--nav-width);
        flex: 0 0 auto;
        position: absolute;
        inset: 0 auto 0 0;
    }
    .main-part{
        margin-left: var(--nav-width);
        height: 100vh;
        overflow-y: auto;
    }
}
</style>
