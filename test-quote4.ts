import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
yahooFinance.quote('AAPL.NS').then(res => console.log(JSON.stringify(res, null, 2))).catch(e => console.error(e));
