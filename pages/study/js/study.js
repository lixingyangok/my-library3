
export const useFn = () => {
    const oInstance = getCurrentInstance();
    const oIns = getCurrentInstance();
    const oState = computed(()=>{
        return oInstance.setupState;
    });

    const oFn = {
        showAddingDialog(){
            oInstance.setupState.dialogVisible = true;
        },
        save2DB(){
            const {addingForm} = oIns.setupState;
            console.log("addingForm", addingForm.$dc());
            let aSecond = addingForm.article.trim().split('\n');
            let s02 = aSecond.map(cur => {
                if (!cur) return '';
                const arr = cur.trim().split(/(?<=[.!?"])\s/);
                return arr;
            });
            console.log("s02", );
            console.log(s02);
        },
    };
    return oFn;
}


