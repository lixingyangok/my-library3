/*
 * @Author: Merlin
 * @Date: 2024-01-01 19:59:31
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-19 20:41:02
 * @Description: 
 */
/* import VueGtag, { trackRouter } from 'vue-gtag-next'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(VueGtag, {
        property: {
            id: 'GA_MEASUREMENT_ID'
        }
    })
    trackRouter(useRouter())
})
 */
export default defineNuxtPlugin((nuxtApp) => {
    // ▼自定义方法
    if (!import.meta.client) return;
    Object.defineProperties(Object.prototype, {
        '$dc': { // deep copy = 深拷贝
            value: function () {
                let val = null;
                try {
                    val = toClone(this);
                } catch (err) {
                    val = JSON.parse(JSON.stringify(this));
                }
                return val;
            },
        },
        // '$cpFrom': { // copy from = 将本对象的值修改为目标对象的值
        //     value: function (source) {
        //         for (let key of Object.keys(this)) {
        //             if (key in source) this[key] = source[key];
        //         }
        //         return this;
        //     },
        // },
    });
});


function toClone(source) {
    if (!source || typeof source != 'object' || !(source instanceof Object)) {
        return source; //不处理非数组、非对象
    }
    const newObj = new source.constructor;
    const iterator = source instanceof Array ? source.entries() : Object.entries(source);
    for (const [key, val] of iterator) {
        newObj[key] = val instanceof Object ? toClone(val) : val;
    }
    // const iLen = iterator.length;
    // while(iLen--){
    //     newObj[iterator[iLen][0]] = iterator[iLen][1] instanceof Object ? toClone(iterator[iLen][1]) : iterator[iLen][1];
    // }
    return newObj;
}
