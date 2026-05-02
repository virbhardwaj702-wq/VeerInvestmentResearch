import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
yahooFinance.quote('AAPL').then(() => console.log('success AAPL')).catch(e => console.error('ERROR AAPL:', e.message));
yahooFinance.quote('AAPL.NS').then(() => console.log('success AAPL.NS')).catch(e => console.error('ERROR AAPL.NS:', e.message));
