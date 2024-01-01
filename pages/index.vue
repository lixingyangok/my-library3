<template>
    <h1>
        index.vue 
        <i class="fa fa-solid fa-house"></i>
    </h1>
    <ul>
        <li v-for="cur,idx of 99" :key="cur">
            row: {{ cur }}
        </li>
    </ul>
</template>

<script setup lang="ts">
/* definePageMeta({
    layout: 'default'
}) */
</script>