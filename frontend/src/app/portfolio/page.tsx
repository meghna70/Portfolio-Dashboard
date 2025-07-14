'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    ColumnDef,
    useReactTable,
    getCoreRowModel,
    flexRender,
} from '@tanstack/react-table';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, XAxis, YAxis, Bar, CartesianGrid } from 'recharts';
import { Stock } from '@/types/stock';

//Adding different colors to the entioned sectors
const COLORS = ["e29578", "8ecae6", "83c5be", "006d77", "ffddd2"]

export default function PortfolioPage() {
    const [data, setData] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
   
    const sectorMap: Record<string, string> = {
        'HDFC Bank': 'Financial Sector',
        'Bajaj Finance': 'Financial Sector',
        'ICICI Bank': 'Financial Sector',
        'Bajaj Housing': 'Financial Sector',
        'Savani Financials': 'Financial Sector',
        'LTI Mindtree': 'Tech Sector',
        'KPIT Tech': 'Tech Sector',
        'Tata Tech': 'Tech Sector',
        'BLS E-Services': 'Tech Sector',
        'Tanla': 'Tech Sector',
        'Dmart': 'Consumer',
        'Tata Consumer': 'Consumer',
        'Pidilite': 'Consumer',
        'Tata Power': 'Power',
        'KPI Green': 'Power',
        'Suzlon': 'Power',
        'Gensol': 'Power',
        'Hariom Pipes': 'Pipe Sector',
        'Astral': 'Pipe Sector',
        'Polycab': 'Pipe Sector',
        'Clean Science': 'Others',
        'Deepak Nitrite': 'Others',
        'Fine Organic': 'Others',
        'Gravita': 'Others',
        'SBI Life': 'Others',
    };

    const [selectedSector, setSelectedSector] = useState<string>('All');

    const totalInvestment = data?.reduce((sum, stock) => sum + stock.purchasePrice * stock.quantity, 0);

    const sectors: string[] = useMemo(() => {
        const uniqueSectors = Array.from(new Set(data.map((d: Stock) => d.sector)));
        return ['All', ...uniqueSectors];
    }, [data]);
    // to find unique sectors in case of user inputs

    // FILTERS
    const filteredData: Stock[] = useMemo(() => { // using use memo  
        return selectedSector === 'All' ? data : data.filter((d: Stock) => d.sector === selectedSector);
    }, [data, selectedSector]);

    //PIE DATA
    const pieData = useMemo(() => {
        return data.reduce((acc: { name: string; value: number }[], stock: Stock) => {

            const existing_rec = acc.find(s => s.name === stock.sector);
            const inv = stock.purchasePrice * stock.quantity;
            if (existing_rec) existing_rec.value += inv;
            else acc.push({ name: stock.sector, value: inv });
            return acc;
        }, []);

    }, [data]);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                const res = await fetch('/api/stocks'); // fetch is called in api/stocks/route
                const json = await res.json();
                const modified = json.map((stock: Stock) => ({
                    ...stock,
                    sector: sectorMap[stock.name] || 'Others',
                }));

                if (!isMounted) return; //check 
                setData(modified);
                setIsLoading(false);
            } catch (e) {
                console.error(e);
                setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
        //every 15 secs 
    }, []);


    const sectorSummary = useMemo(() => {

        const summary: Record<string, { investment: number; presentValue: number; gainLoss: number }> = {};

        data.forEach(stock => {
            const investment = stock.purchasePrice * stock.quantity;
            const presentValue = stock.cmp * stock.quantity;
            const gainLoss = presentValue - investment;
            const sector = stock.sector;
            if (!summary[sector]) {
                summary[sector] = { investment: 0, presentValue: 0, gainLoss: 0 };
            }
            summary[sector].investment += investment;
            summary[sector].presentValue += presentValue;
            summary[sector].gainLoss += gainLoss;
        });
        return summary;

        //sector calculation 

        //presentValue = CMP * QUANT
        // investment = purchase price at the time * quant
    
    }, [data]);

    console.log("sectorSummary", sectorSummary)

    const columns: ColumnDef<Stock>[] = [
        {
            header: 'Stock',
            accessorKey: 'name',
            cell: info => {
                const stockName = info.getValue<string>();
                return (
                       {stockName}
                );
            },
        },
        { header: 'Purchase price', accessorKey: 'purchasePrice' },
        { header: 'Qty', accessorKey: 'quantity' },
        {
            header: 'Investment',
            accessorFn: row => row.purchasePrice * row.quantity,
            cell: info => `₹${info.getValue<number>()?.toFixed(2)}`,
        },
        {
            header: 'Portfolio %',
            accessorFn: row => (row.purchasePrice * row.quantity * 100) / totalInvestment,
            cell: info => `${info.getValue<number>().toFixed(2)}%`,
        },
        { header: 'Exchange', accessorKey: 'exchange' },
        { header: 'CMP', accessorKey: 'cmp' },
        {
            header: 'Present Value',
            accessorFn: row => row.cmp * row.quantity,
            cell: info => `₹${info.getValue<number>()?.toFixed(2)}`,
        },
        {
            header: 'Gain/Loss',
            accessorFn: row => (row.cmp * row.quantity) - (row.purchasePrice * row.quantity),
            cell: info => {
                const value = info.getValue<number>();
                return <span style={{ color: value >= 0 ? 'green' : 'red' }}>₹{value.toFixed(2)}</span>;
            },
        },
        { header: 'P/E Ratio', accessorKey: 'peRatio' },
        { header: 'Earnings', accessorKey: 'earnings' },
    ];

    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const skeletonStyle: React.CSSProperties = {
        backgroundColor: '#e5e7eb',
        borderRadius: '6px',
        animation: 'pulse 1.5s infinite',
    };

    return (
        <main style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            <style>
                {`
          @keyframes pulse {
            0% { opacity: 1 }
            50% { opacity: 0.4 }
            100% { opacity: 1 }
          }
        `}
            </style>

            <div style={{ fontFamily: "Poppins", maxWidth: '1280px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                    📊 Portfolio Dashboard
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                    {sectors.map(sector => (
                        <button
                            key={sector}
                            onClick={() => setSelectedSector(sector)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '9999px',
                                fontSize: '14px',
                                border: '1px solid',
                                cursor: 'pointer',
                                backgroundColor: selectedSector === sector ? '#2563eb' : '#fff',
                                color: selectedSector === sector ? '#fff' : '#374151',
                                borderColor: selectedSector === sector ? '#2563eb' : '#d1d5db',
                                boxShadow: selectedSector === sector ? '0 2px 8px rgba(0,0,0,0.1)' : '',
                            }}
                        >
                            {sector}
                        </button>
                    ))}
                </div>
                {selectedSector !== 'All' && (
                    <div style={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        fontSize: '14px'
                    }}>
                        <h3 style={{ marginBottom: '12px', fontWeight: 600, fontSize: '16px', color: '#374151' }}>
                            📚 {selectedSector} Summary
                        </h3>
                        <p>💰 Total Investment: ₹{sectorSummary[selectedSector]?.investment.toFixed(2)}</p>
                        <p>📈 Present Value: ₹{sectorSummary[selectedSector]?.presentValue.toFixed(2)}</p>
                        <p style={{ color: sectorSummary[selectedSector]?.gainLoss >= 0 ? 'green' : 'red' }}>
                            {sectorSummary[selectedSector]?.gainLoss >= 0 ? '🟢 Gain' : '🔻 Loss'}: ₹{sectorSummary[selectedSector]?.gainLoss.toFixed(2)}
                        </p>
                        <div style={{ height: '300px', marginTop: '16px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={filteredData.map(stock => ({
                                        name: stock.name,
                                        investment: stock.purchasePrice * stock.quantity,
                                        presentValue: stock.cmp * stock.quantity,
                                        gainLoss: (stock.cmp - stock.purchasePrice) * stock.quantity
                                    }))}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const { name, investment, presentValue, gainLoss } = payload[0].payload;
                                            return (
                                                <div style={{ backgroundColor: '#fff', padding: '12px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '13px' }}>
                                                    <strong>📚 {name} Summary</strong><br />
                                                    💰 Total Investment: ₹{investment.toFixed(2)}<br />
                                                    📈 Present Value: ₹{presentValue.toFixed(2)}<br />
                                                    <span style={{ color: gainLoss >= 0 ? 'green' : 'red' }}>
                                                        {gainLoss >= 0 ? '🟢 Gain' : '🔻 Loss'}: ₹{gainLoss.toFixed(2)}
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }} />
                                    <Legend />
                                    <Bar dataKey="investment" fill="#8884d8" name="Investment" />
                                    <Bar dataKey="presentValue" fill="#82ca9d" name="Present Value" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}


                <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    backgroundColor: '#fff',
                    padding: '16px',
                    marginBottom: '36px'
                }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                        📈 Sector Allocation
                    </h2>
                    {isLoading ? (
                        <div style={{ ...skeletonStyle, height: '300px', width: '100%' }} />
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    label
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>


                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                    <div style={{
                        overflowX: 'auto',
                        border: '1px solid #e5e7eb',
                        borderRadius: '16px',
                        backgroundColor: '#fff',
                        padding: '8px'
                    }}>
                        {isLoading ? (
                            <div>
                                {[...Array(6)].map((item, idx) => (
                                    <div key={idx} style={{ ...skeletonStyle, height: '32px', marginBottom: '12px' }} />
                                ))}
                            </div>
                        ) : (
                            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f3f4f6', textTransform: 'uppercase', fontSize: '12px', color: '#4b5563' }}>
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map(header => (
                                                <th key={header.id} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map(row => (
                                        <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            {row.getVisibleCells().map(cell => (
                                                <td key={cell.id} style={{ padding: '12px 16px', color: '#1f2937' }}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>


                </div>
            </div>
        </main>
    );
}
