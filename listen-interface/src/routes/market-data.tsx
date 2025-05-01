import { createFileRoute } from '@tanstack/react-router';
import { MarketData } from '../components/MarketData';

export const Route = createFileRoute('/market-data')();

export default function MarketDataPage() {
  return (
    <div className="p-4">
      <MarketData />
    </div>
  );
}
