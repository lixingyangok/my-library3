
// ↓ 
export async function Sleep(ms=0){
    await new Promise((resolve, reject) => {
        setTimeout(resolve, ms)
    });
}


