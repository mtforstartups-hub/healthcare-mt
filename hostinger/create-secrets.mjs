import {randomBytes} from 'node:crypto';
console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString('hex')}`);
console.log(`INTAKE_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}`);
console.error('Keep the existing INTAKE_ENCRYPTION_KEY if the database already holds enquiries.');
