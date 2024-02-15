
import { defineStore } from 'pinia';

export const useSettingStore = defineStore('setting', {
    state: () => {
        const obj = {
            sEnVoice: '',
            sZhVoice: '',
        };
        return obj;
    },
    getters: {
        // double: (state) => state.count * 2,
    },
    actions: {
        // increment() { this.count++ },
    },
    persist: {
        storage: persistedState.localStorage,
    },
});



