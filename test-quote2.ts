import { YahooFinance } from 'yahoo-finance2';
const yf = new YahooFinance();
yf.quote('AAPL').then(() => console.log('success')).catch(e => console.error('ERROR:', e.message));
