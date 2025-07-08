const fs = require('fs');

console.log('Reading migration file...');
const content = fs.readFileSync('migration.sql', 'utf8');

const statements = content
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

console.log('Total statements:', statements.length);

console.log('\nFirst 10 statements:');
statements.slice(0, 10).forEach((s, i) => {
    console.log(`${i + 1}: ${s.substring(0, 100).replace(/\n/g, ' ')}${s.length > 100 ? '...' : ''}`);
});

// Cari statement CREATE TABLE
console.log('\nCREATE TABLE statements:');
statements.forEach((s, i) => {
    if (s.toLowerCase().includes('create table')) {
        console.log(`Statement ${i + 1}: ${s.substring(0, 200).replace(/\n/g, ' ')}...`);
    }
});
