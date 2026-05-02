import serverless from 'serverless-http';
import express from 'express';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
const app = express();

app.use(express.json());

app.get('/api/stock/:symbol', async (req, res) => {
  try {
    let symbol = req.params.symbol.toUpperCase();
    if (!symbol.endsWith('.NS') && !symbol.endsWith('.BO')) {
      symbol += '.NS';
    }
    const quote: any = await yahooFinance.quote(symbol);
    if (!quote) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    res.json({
      symbol: quote.symbol,
      longName: quote.longName || quote.shortName || symbol,
      price: quote.regularMarketPrice,
      currency: quote.currency
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ error: 'Failed to fetch stock info' });
  }
});

export const handler = serverless(app);
