import * as log4js from 'log4js';

log4js.configure({
    appenders: [
        { type: 'console' },
        {
            type: 'dateFile',
            filename: './logs/app.log',
            "maxLogSize": 20480,
            "backups": 3,
            category: 'app'

        }
    ]
});

let ins = log4js.getLogger('app');


export default ins;