import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { renderAddressOrTx } from "../hooks/util";

const sanitizeOutput = (message: string) => {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && message.includes("EOF while parsing an object")) {
    return null;
  }
  return message;
};

export const ChatMessage = ({
  message,
  direction,
}: {
  message: string;
  direction: "incoming" | "outgoing" | "agent";
}) => {
  // Process the message to identify addresses and transactions
  const embeddedMessage = renderAddressOrTx(message);
  const sanitizedMessage = sanitizeOutput(embeddedMessage);

  if (!sanitizedMessage) {
    return null;
  }

  return (
    <div
      className={`
        rounded-lg px-4 py-2 my-2
        break-words word-break-all overflow-hidden
        ${direction === "outgoing" ? "rounded-3xl bg-[#2f2f2f]/40 ml-auto" : "max-w-full"}
      `}
      style={{
        wordBreak: "break-word",
        overflowWrap: "break-word",
      }}
    >
      <ReactMarkdown
        className="markdown-content"
        components={{
          p: ({ children, ...props }) => (
            <p
              className="my-2"
              style={{
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
              {...props}
            >
              {children}
            </p>
          ),
          h1: ({ ...props }) => (
            <h1 className="text-xl font-bold my-3" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-lg font-bold my-3" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-md font-bold my-2" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="list-disc pl-6 my-2" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal pl-6 my-2" {...props} />
          ),
          li: ({ children, ...props }) => (
            <li className="my-1" {...props}>
              {children}
            </li>
          ),
          a: ({ ...props }) => (
            <a
              className="text-blue-400 underline"
              style={{
                wordBreak: "break-all",
                display: "inline-block",
                maxWidth: "100%",
              }}
              {...props}
            />
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-gray-500 pl-4 my-2 italic overflow-hidden"
              {...props}
            >
              {children}
            </blockquote>
          ),
          code: ({ ...props }) => (
            <code
              className="block bg-transparent rounded overflow-x-auto"
              style={{
                wordBreak: "break-all",
                whiteSpace: "pre-wrap",
              }}
              {...props}
            />
          ),
          pre: ({ ...props }) => (
            <pre
              className="bg-transparent rounded overflow-x-auto"
              style={{
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                maxWidth: "100%",
              }}
              {...props}
            />
          ),
          table: ({ ...props }) => (
            <table className="border-collapse my-3 w-full" {...props} />
          ),
          th: ({ ...props }) => (
            <th
              className="border border-gray-600 px-2 py-1 bg-gray-800"
              {...props}
            />
          ),
          td: ({ children, ...props }) => (
            <td className="border border-gray-600 px-2 py-1" {...props}>
              {children}
            </td>
          ),
          hr: ({ ...props }) => (
            <hr className="my-4 border-gray-600" {...props} />
          ),
        }}
        rehypePlugins={[rehypeRaw]}
      >
        {embeddedMessage}
      </ReactMarkdown>
    </div>
  );
};
