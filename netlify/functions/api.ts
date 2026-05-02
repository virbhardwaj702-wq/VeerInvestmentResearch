import serverless from 'serverless-http';
import express from 'express';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
const app = express();

app.use(express.json());

app.get(['/api/stock/:symbol', '/.netlify/functions/api/stock/:symbol'], async (req, res) => {
  try {
    const originalSymbol = req.params.symbol.toUpperCase();
    let quote: any = await yahooFinance.quote(originalSymbol).catch(() => null);
    
    // If original symbol not found, and it doesn't have an Indian suffix, try adding .NS
    if (!quote && !originalSymbol.includes('.')) {
      quote = await yahooFinance.quote(originalSymbol + '.NS').catch(() => null);
      
      // If STILL not found, try adding .BO
      if (!quote) {
          quote = await yahooFinance.quote(originalSymbol + '.BO').catch(() => null);
      }
    }

    if (!quote) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    res.json({
      symbol: quote.symbol,
      longName: quote.longName || quote.shortName || quote.symbol,
      price: quote.regularMarketPrice,
      currency: quote.currency
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ error: 'Failed to fetch stock info' });
  }
});

export const handler = serverless(app);
