const URL_REGEX = /(^|[\s(])((https?:\/\/[^\s)<]+))/g;
const MARKDOWN_LINK_TOKEN_PREFIX = '__md_link_token_';

export const linkifyPlainUrls = (text) => {
  const source = String(text || '');
  const preserved = [];

  const masked = source.replace(/\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g, (match) => {
    const token = `${MARKDOWN_LINK_TOKEN_PREFIX}${preserved.length}__`;
    preserved.push(match);
    return token;
  });

  const linked = masked.replace(URL_REGEX, (_full, prefix, url) => {
    const cleaned = url.replace(/[),.;!?]+$/, '');
    const trailing = url.slice(cleaned.length);
    return `${prefix}[${cleaned}](${cleaned})${trailing}`;
  });

  return linked.replace(
    new RegExp(`${MARKDOWN_LINK_TOKEN_PREFIX}(\\d+)__`, 'g'),
    (token, index) => preserved[Number(index)] || token
  );
};

export const normalizeReferenceFormatting = (text) => {
  const source = String(text || '');
  const lines = source.split('\n');

  const transformed = lines.map((line) => {
    let match = line.match(/^\s*[-*]\s+([^\n-]+?)\s+-\s+(https?:\/\/\S+)(\s+-\s+.*)?$/);
    if (match) {
      const name = match[1].trim();
      const url = match[2].trim().replace(/[),.;!?]+$/, '');
      const desc = (match[3] || '').trim();
      const prefix = line.match(/^\s*[-*]\s+/)?.[0] || '- ';
      return `${prefix}[${name}](${url})${desc ? ` ${desc}` : ''}`;
    }

    match = line.match(/^\s*\d+\.\s+([^\n-]+?)\s+-\s+(https?:\/\/\S+)(\s+-\s+.*)?$/);
    if (match) {
      const name = match[1].trim();
      const url = match[2].trim().replace(/[),.;!?]+$/, '');
      const desc = (match[3] || '').trim();
      const prefix = line.match(/^\s*\d+\.\s+/)?.[0] || '1. ';
      return `${prefix}[${name}](${url})${desc ? ` ${desc}` : ''}`;
    }

    return line;
  });

  return transformed.join('\n');
};
