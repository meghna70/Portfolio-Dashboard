'use client';

import { useEffect, useState } from 'react';
import { Stock } from '@/types/stock';

interface Props {
  params: { stockName: string };
}

export default function StockDetailPage({ params }: Props) {
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStock = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/stocks', { cache: 'no-store' });
      const stocks: Stock[] = await res.json();
      const found = stocks.find(s => s.name === decodeURIComponent(params.stockName));
      setStock(found ?? null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stock:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
    const interval = setInterval(fetchStock, 15000); // Auto-refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main style={styles.main}>
        <h1 style={styles.title}>Loading stock data...</h1>
      </main>
    );
  }

  if (!stock) {
    return (
      <main style={styles.main}>
        <h1 style={{ ...styles.title, color: 'red' }}>Stock not found 😢</h1>
      </main>
    );
  }

  const gainLoss = (stock.cmp * stock.quantity) - (stock.purchasePrice * stock.quantity);

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>{stock.name} 📈</h1>
        <p style={styles.info}>Exchange: <strong>{stock.exchange}</strong></p>
        <p style={styles.info}>Quantity: <strong>{stock.quantity}</strong></p>
        <p style={styles.info}>Buy Price: ₹{stock.purchasePrice}</p>
        <p style={styles.info}>CMP (Live): <strong style={{ color: '#2563eb' }}>₹{stock.cmp}</strong></p>
        <p style={styles.info}>P/E Ratio: {stock.peRatio}</p>
        <p style={styles.info}>Earnings: {stock.earnings}</p>
        <p style={styles.info}>
          Gain/Loss: <strong style={{ color: gainLoss >= 0 ? 'green' : 'red' }}>
            ₹{gainLoss.toFixed(2)}
          </strong>
        </p>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    padding: '2rem',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
    padding: '2rem',
    width: '100%',
    maxWidth: '600px',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: '#111827',
  },
  info: {
    fontSize: '1rem',
    color: '#374151',
    marginBottom: '0.75rem',
  },
};
