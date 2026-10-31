import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface Props {
  markdown: string;
}

export default function MarkdownBody({ markdown }: Props) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ href, children }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noreferrer' : undefined}>
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => (
            <img src={src || ''} alt={alt || ''} loading="lazy" />
          ),
          iframe: ({ title, src, width, height }) => (
            <iframe
              title={typeof title === 'string' ? title : 'Video'}
              src={typeof src === 'string' ? src : undefined}
              width={typeof width === 'string' || typeof width === 'number' ? width : '100%'}
              height={typeof height === 'string' || typeof height === 'number' ? height : 400}
              loading="lazy"
              allowFullScreen
            />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
