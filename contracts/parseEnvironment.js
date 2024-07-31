const fs = require('fs');
const logFilePath = 'deploy.log';
const envFilePath = '.env';

fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the log file:', err);
        process.exit(1);
    }
    const regex = /(\w+)=\s*(0x[0-9a-fA-F]+|[0-9]+(?:\.[0-9]+)?)\b/g;
    let match;
    const envVars = {};

    while ((match = regex.exec(data)) !== null) {
        envVars[match[1]] = match[2];
    }
    fs.readFile(envFilePath, 'utf8', (err, envData) => {
        if (err) {
            console.error('Error reading the .env file:', err);
            process.exit(1);
        }
        let updatedEnvData = envData;
        for (const [key, value] of Object.entries(envVars)) {
            const regex = new RegExp(`^${key}=.*`, 'm');
            if (regex.test(updatedEnvData)) {
                updatedEnvData = updatedEnvData.replace(regex, `${key}=${value}`);
            } else {
                updatedEnvData += `\n${key}=${value}`;
            }
        }
        fs.writeFile(envFilePath, updatedEnvData, 'utf8', (err) => {
            if (err) {
                console.error('Error writing to the .env file:', err);
                process.exit(1);
            }
        });
    });
});