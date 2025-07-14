require('dotenv').config();
const express = require('express');
const yahooFinance = require('yahoo-finance2').default;

const path = require('path');
const axios = require('axios')

const app = express();
const PORT = process.env.PORT || 3001;
const cors = require('cors');
app.use(cors());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Suppress Yahoo survey warning
yahooFinance.suppressNotices(['yahooSurvey']);

// Cache to reduce API load
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper: delay to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const stocks = [
  // Your stocks list here
  { name: 'HDFC Bank', yahooSymbol: 'HDB', googleSymbol: 'HDFCBANK:NSE', purchasePrice: 1550, quantity: 10, exchange: 'NSE' },
  { name: 'Bajaj Finance', yahooSymbol: 'BAJFINANCE.NS', googleSymbol: 'BAJFINANCE:NSE', purchasePrice: 7200, quantity: 4, exchange: 'NSE' },
  { name: 'ICICI Bank', yahooSymbol: 'IBN', googleSymbol: 'ICICIBANK:NSE', purchasePrice: 950, quantity: 8, exchange: 'NSE' },
  { name: 'Bajaj Housing', yahooSymbol: 'BAJAJHFL.BO', googleSymbol: 'BAJAJHFL:BOM', purchasePrice: 4800, quantity: 5, exchange: 'BSE' },
  { name: 'Savani Financials', yahooSymbol: 'SAVFI.BO', googleSymbol: '511577:BOM', purchasePrice: 40, quantity: 500, exchange: 'BSE' },

  // Tech Sector
  { name: 'LTI Mindtree', yahooSymbol: 'LTIM.NS', googleSymbol: 'LTIM:NSE', purchasePrice: 6000, quantity: 2, exchange: 'NSE' },
  { name: 'KPIT Tech', yahooSymbol: 'KPITTECH.NS', googleSymbol: 'KPITTECH:NSE', purchasePrice: 1300, quantity: 3, exchange: 'NSE' },
  { name: 'Tata Tech', yahooSymbol: 'TATATECH.BO', googleSymbol: '544028:BOM', purchasePrice: 1200, quantity: 10, exchange: 'BSE' },
  { name: 'BLS E-Services', yahooSymbol: 'BLSE.NS', googleSymbol: 'BLSE:NSE', purchasePrice: 300, quantity: 15, exchange: 'NSE' },
  { name: 'Tanla', yahooSymbol: 'TANLA.NS', googleSymbol: 'TANLA:NSE', purchasePrice: 950, quantity: 7, exchange: 'NSE' },

  // Consumer
  { name: 'Dmart', yahooSymbol: 'DMART.NS', googleSymbol: 'DMART:NSE', purchasePrice: 3600, quantity: 2, exchange: 'NSE' },
  { name: 'Tata Consumer', yahooSymbol: 'TATACONSUM.NS', googleSymbol: 'TATACONSUM:NSE', purchasePrice: 1050, quantity: 6, exchange: 'NSE' },
  { name: 'Pidilite', yahooSymbol: 'PIDILITIND.NS', googleSymbol: 'PIDILITIND:NSE', purchasePrice: 2800, quantity: 4, exchange: 'NSE' },

  // Power
  { name: 'Tata Power', yahooSymbol: 'TATAPOWER.NS', googleSymbol: 'TATAPOWER:NSE', purchasePrice: 240, quantity: 50, exchange: 'NSE' },
  { name: 'KPI Green', yahooSymbol: 'KPIGREEN.NS', googleSymbol: 'KPIGREEN:NSE', purchasePrice: 900, quantity: 10, exchange: 'NSE' },
  { name: 'Suzlon', yahooSymbol: 'SUZLON.NS', googleSymbol: 'SUZLON:NSE', purchasePrice: 45, quantity: 200, exchange: 'NSE' },
  { name: 'Gensol', yahooSymbol: 'GENSOL.NS', googleSymbol: 'GENSOL:NSE', purchasePrice: 1600, quantity: 3, exchange: 'NSE' },

  // Pipe Sector
  { name: 'Hariom Pipes', yahooSymbol: 'HARIOMPIPE.NS', googleSymbol: 'HARIOMPIPE:NSE', purchasePrice: 500, quantity: 5, exchange: 'NSE' },
  { name: 'Astral', yahooSymbol: 'ASTRAL.NS', googleSymbol: 'ASTRAL:NSE', purchasePrice: 2200, quantity: 3, exchange: 'NSE' },
  { name: 'Polycab', yahooSymbol: 'POLYCAB.NS', googleSymbol: 'POLYCAB:NSE', purchasePrice: 4500, quantity: 2, exchange: 'NSE' },

  // Others
  { name: 'Clean Science', yahooSymbol: 'CLEAN.NS', googleSymbol: 'CLEAN:NSE', purchasePrice: 1500, quantity: 4, exchange: 'NSE' },
  { name: 'Deepak Nitrite', yahooSymbol: 'DEEPAKNTR.NS', googleSymbol: 'ICICIBANK:NSE', purchasePrice: 2200, quantity: 3, exchange: 'NSE' },
  { name: 'Fine Organic', yahooSymbol: 'FINEORG.NS', googleSymbol: 'FINEORG:NSE', purchasePrice: 4900, quantity: 1, exchange: 'NSE' },
  { name: 'Gravita', yahooSymbol: 'GRAVITA.NS', googleSymbol: 'GRAVITA:NSE', purchasePrice: 800, quantity: 5, exchange: 'NSE' },
  { name: 'SBI Life', yahooSymbol: 'SBILIFE.NS', googleSymbol: 'SBILIFE:NSE', purchasePrice: 1350, quantity: 6, exchange: 'NSE' },
];


async function getGoogleFinanceStats(symbol) {
  const now = Date.now();
  if (cache.has(symbol)) {
    const { data, timestamp } = cache.get(symbol);
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }
  }

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`;
    const fundamentalsUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${process.env.FINNHUB_API_KEY}`;

    const [quoteRes, fundamentalsRes] = await Promise.all([
      axios.get(url),
      axios.get(fundamentalsUrl)
    ]);

    const cmp = quoteRes.data.c ?? 0;
    const peRatio = fundamentalsRes.data.metric?.peNormalizedAnnual ?? 0;
    const eps = fundamentalsRes.data.metric?.epsNormalizedAnnual ?? 0;

    const data = { cmp, peRatio, eps };
    cache.set(symbol, { data, timestamp: now });
    return data;
  } catch (err) {
    console.error(`Finnhub fetch failed for ${symbol}:`, err.message);
    return { cmp: 0, peRatio: 0, eps: 0 };
  }
}


async function getFinancialData(yahooSymbol, googleSymbol) {
  const now = Date.now();
  if (cache.has(yahooSymbol)) {
    const { data, timestamp } = cache.get(yahooSymbol);
    if (now - timestamp < CACHE_TTL) return data;
  }

  try {
    const fetchOptions = { timeout: 15000 };

    // Fetch Yahoo data first (used if fallback is needed)
    const quote = await yahooFinance.quote(yahooSymbol, { fetchOptions });
    const summary = await yahooFinance.quoteSummary(yahooSymbol, {
      modules: ['defaultKeyStatistics', 'financialData'],
      fetchOptions
    });
    // console.log("summary", summary)
    // console.log("quote", quote)

    let cmp = 0;
    let peRatio = 0;
    let eps = 0;

    // Try Google Finance (Finnhub)
    try {
      const googleData = await getGoogleFinanceStats(googleSymbol);
      if (googleData.cmp && googleData.cmp > 0) cmp = googleData.cmp;
      if (googleData.peRatio && googleData.peRatio > 0) peRatio = googleData.peRatio;
      if (googleData.eps && googleData.eps > 0) eps = googleData.eps;
    } catch (err) {
      console.warn(`Fallback to Yahoo for ${yahooSymbol}:`, err.message);
    }

    // // If Google failed or returned 0s, fallback to Yahoo
    //  cmp = quote.regularMarketPrice ?? 0;
    if (!peRatio) peRatio = summary.defaultKeyStatistics?.forwardPE ?? 0;
    if (!eps) eps = summary.defaultKeyStatistics?.trailingEps ?? 0;

    const data = { cmp:  quote.regularMarketPrice , peRatio, earnings: eps };
    cache.set(yahooSymbol, { data, timestamp: now });
    return data;

  } catch (err) {
    console.error(`Error fetching data for ${yahooSymbol}:`, err.message);
    return { cmp: 0, peRatio: 0, earnings: 0 };
  }
}


// API endpoint
app.get('/api/stocks', async (_req, res) => {
  try {
    const enriched = [];

    for (const stock of stocks) {
      const { cmp, peRatio, earnings } = await getFinancialData(stock.yahooSymbol, stock.googleSymbol);

      const totalEarnings = earnings * stock.quantity;


      enriched.push({ ...stock, cmp, peRatio, earnings: totalEarnings });
      await delay(300); // delay to avoid spam
    }

    res.json(enriched);
  } catch (err) {
    console.error('Error in /api/stocks route:', err);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
