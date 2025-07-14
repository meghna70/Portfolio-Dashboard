// app/portfolio/[stockName]/page.tsx

interface Props {
  params: { stockName: string };
}

export default async function StockDetailPage({ params }: Props) {
  console.log("params:", params); 

  return (
    <div>
     
    </div>
  );
}
