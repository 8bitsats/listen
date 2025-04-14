import { useEffect, useState } from 'react';
import { config } from '../../config';
import ExampleCard from './ExampleCard';

interface Example {
  id: string;
  name: string;
  description: string;
  path: string;
}

export default function ExamplesPage() {
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch examples from the API or use the static list for now
    setExamples([
      {
        id: 'grok_example',
        name: 'Grok Example',
        description: 'Basic example using Grok for reasoning',
        path: 'grok_example.rs'
      },
      {
        id: 'deepseek_loop',
        name: 'Deepseek Loop',
        description: 'Example using Deepseek for reasoning in a loop',
        path: 'deepseek_loop.rs'
      },
      {
        id: 'solana_agent',
        name: 'Solana Agent',
        description: 'Example of a Solana agent',
        path: 'solana_agent.rs'
      },
      {
        id: 'solana_agent_with_interface',
        name: 'Solana Agent with Interface',
        description: 'Example of a Solana agent with interface integration',
        path: 'solana_agent_with_interface.rs'
      },
      {
        id: 'grok_solana_example',
        name: 'Grok Solana Example',
        description: 'Example using Grok with Solana integration',
        path: 'grok_solana_example.rs'
      }
    ]);
    setLoading(false);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Listen Kit Examples</h1>
      <p className="mb-8 text-gray-300">
        These examples demonstrate the capabilities of the Listen Kit. Select an example to view its source code and run it directly from the interface.
      </p>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examples.map((example) => (
            <ExampleCard key={example.id} example={example} />
          ))}
        </div>
      )}
    </div>
  );
}
