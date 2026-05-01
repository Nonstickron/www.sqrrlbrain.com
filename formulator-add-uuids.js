/* Add stable UUIDs to all recipes that don't have one */
const fs = require('fs');
const { randomUUID } = require('crypto');

const PATH = __dirname + '/formulator-data.json';
const store = JSON.parse(fs.readFileSync(PATH, 'utf8'));

let added = 0;
store.recipes.forEach(r => {
  if (!r.uuid) { r.uuid = randomUUID(); added++; }
});

fs.writeFileSync(PATH, JSON.stringify(store, null, 2), 'utf8');
console.log(`Done — added UUIDs to ${added} recipes.`);
