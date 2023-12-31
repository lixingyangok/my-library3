<!--
 * @Author: Merlin
 * @Date: 2023-12-30 14:21:39
 * @LastEditors: Merlin
 * @LastEditTime: 2023-12-30 16:05:11
 * @Description: 
-->
<template>
    <NuxtLayout name="border" >
        <h1>
            cc/index.vue
        </h1>
        <div>
            <button @click="enableCustomLayout">
                换肤
            </button>
        </div>
    </NuxtLayout>
</template>

<script setup lang="ts">



// definePageMeta({
//     layout: false,
// });

let coat = 'shadow';
// enableCustomLayout();
function enableCustomLayout () {
    let newName = coat === 'shadow' ? 'border' : 'shadow';
    console.log("换", newName);
    setPageLayout(coat);
    coat = newName;
}

</script>

