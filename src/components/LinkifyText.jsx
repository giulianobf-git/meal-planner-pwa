/**
 * Renders text with URLs automatically converted to clickable links.
 * Links open in a new tab / the system browser.
 */
export default function LinkifyText({ text, className = '' }) {
    if (!text) return null;

    // Match http(s) URLs and bare www. URLs
    const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

    const elements = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
        // Push preceding text
        if (match.index > lastIndex) {
            elements.push(
                <span key={`t-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>
            );
        }

        const url = match[0];
        const href = url.startsWith('http') ? url : `https://${url}`;

        elements.push(
            <a
                key={`l-${match.index}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-green-400 underline underline-offset-2 hover:text-green-300 transition-colors break-all"
            >
                {url}
            </a>
        );

        lastIndex = urlRegex.lastIndex;
    }

    // Push remaining text
    if (lastIndex < text.length) {
        elements.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>);
    }

    return <span className={className}>{elements}</span>;
}
