<!--
 * @Author: 李星阳
 * @Date: 2021-12-04 15:18:43
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-28 20:26:18
 * @Description: 
-->
<template>
    <nav class="outter" >
        <ul class="nav-ul" >
            <li v-for="(cur,idx) of aRoutes" :key="idx" >
                <NuxtLink class="link" :to="cur.path">
                    <i class="icon" :class="cur.icon_"/>
                    <span class="name" >{{cur.name_}}</span>
                </NuxtLink>
            </li>
        </ul>
        <!-- <button @click="$root.f5()">刷新</button><br/>
        <button @click="toF5()">刷新</button> -->
    </nav>
</template>

<script>

export const routes = [{
    path: '/',
    name_: '首页',
    icon_: 'fas fa-desktop',
    // icon_: 'fas fa-poll',
},{
    path: '/shelf',
    name_: '书架',
    icon_: 'fas fa-folder-open',
},{
    path: '/study-lounge',
    name: 'studyLounge',
    name_: '听写',
    icon_: 'fas fa-paper-plane',
},{
    path: '/dictionary',
    name_: '字典',
    icon_: 'fas fa-book',
},{
    path: '/database',
    name_: '数据',
    icon_: 'fas fa-database',
},{
    path: '/empty',
    name_: 'empty',
    icon_: 'fas fa-book',
}
// {
//     path: '/dashboard',
//     name: 'dashboard',
//     name_: '统计',
//     icon_: 'fas fa-chart-pie',
// },{
//     path: '/settings',
//     name_: '设置',
//     icon_: 'fas fa-cog',
// },{
//     path: '/tools',
//     redirect: '/tools/alarm-clock',
//     name_: '工具',
//     icon_: 'fas fa-grip-horizontal',
//     // children: aTools,
// }, 
];


export default {
    name: 'navigation',
    data(){
        return {
            aRoutes: routes,
        };
    },
    created(){

    },
    methods: {
        async toF5(){
            console.clear();
            console.log('\n\n已刷新========================');
            this.$root.f5()
        },
    },
};
</script>

<style scoped src="./style/navigation.scss">
</style>