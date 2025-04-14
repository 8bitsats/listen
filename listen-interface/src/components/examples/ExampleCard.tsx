import { useState } from 'react';
import { config } from '../../config';

interface Example {
  id: string;
  name: string;
  description: string;
  path: string;
}

interface ExampleCardProps {
  example: Example;
}

export default function ExampleCard({ example }: ExampleCardProps) {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [sourceCode, setSourceCode] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSourceCode = async () => {
    try {
      const response = await fetch(`${config.kitEndpoint}/examples/source?path=${example.path}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch source code: ${response.statusText}`);
      }
      const data = await response.json();
      setSourceCode(data.source);
      setShowSource(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch source code');
    }
  };

  const runExample = async () => {
    setLoading(true);
    setOutput(null);
    setError(null);
    
    try {
      const response = await fetch(`${config.kitEndpoint}/examples/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          example_id: example.id
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to run example: ${response.statusText}`);
      }

      const data = await response.json();
      setOutput(data.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while running the example');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{example.name}</h3>
        <p className="text-gray-400 mb-4">{example.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            onClick={fetchSourceCode}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
          >
            {showSource ? 'Hide Source' : 'View Source'}
          </button>
          
          <button 
            onClick={runExample}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Running...' : 'Run Example'}
          </button>
        </div>

        {showSource && sourceCode && (
          <div className="mb-4">
            <h4 className="text-lg font-medium mb-2">Source Code</h4>
            <pre className="bg-gray-900 p-4 rounded-md overflow-x-auto text-sm">
              <code>{sourceCode}</code>
            </pre>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-md text-red-200">
            {error}
          </div>
        )}

        {output && (
          <div className="mb-4">
            <h4 className="text-lg font-medium mb-2">Output</h4>
            <pre className="bg-gray-900 p-4 rounded-md overflow-x-auto text-sm whitespace-pre-wrap">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
