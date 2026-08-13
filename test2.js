const url = 'https://script.google.com/macros/s/AKfycbzIAQsdtWl1gIYv8i_OrcbFG9pPrAKVmHVZk2TsAFfxSmb9QYY9hSUWfNWQPcvlfWCbkA/exec';
fetch(url).then(r=>r.json()).then(d => {
  const k = d.filter(i => JSON.stringify(i).toLowerCase().includes('kamaya'));
  console.log('Kamaya matches:', k.length);
  if(k.length > 0) console.log(k[0]);
}).catch(console.error);
