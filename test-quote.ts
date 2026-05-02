import yahooFinance from 'yahoo-finance2';
yahooFinance.quote('AAPL').then(() => console.log('success')).catch(e => console.error('ERROR:', e.message));
