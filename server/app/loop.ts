class Loop {
    isRun: boolean;
    timer: NodeJS.Timer;
    interval: number;
    handler: () => void;
    constructor() {
        this.isRun = false;
    }

    start(): void {
        if (!this.isRun && this.handler && this.interval > 0) {
            this.timer = setInterval(this.handler, this.interval);
            this.isRun = true;
        }
    }

    stop(): void {
        if (this.isRun) {
            clearInterval(this.timer);
        }
    }
}
export default Loop;