import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Route for fetching stock data
  app.get('/api/stock/:symbol', async (req, res) => {
    try {
      const originalSymbol = req.params.symbol.toUpperCase();
      let quote: any = await yahooFinance.quote(originalSymbol, {}, { validateResult: false } as any).catch(() => null);
      
      if (!quote && !originalSymbol.includes('.')) {
        quote = await yahooFinance.quote(originalSymbol + '.NS', {}, { validateResult: false } as any).catch(() => null);
        
        if (!quote) {
           quote = await yahooFinance.quote(originalSymbol + '.BO', {}, { validateResult: false } as any).catch(() => null);
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
