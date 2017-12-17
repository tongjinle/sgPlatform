function delay(sec:number = 2000){
    return new Promise(resolve=>{
        setTimeout(resolve,sec);
    });
}

export default delay;