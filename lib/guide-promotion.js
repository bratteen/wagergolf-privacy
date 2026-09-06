// Guide articles use flat Markdown sections. Keep the first explanation and
// practical rules together, then offer the app before the longer discussion.
// In Stableford this puts the offer after the complete points table.
function insertGuidePromotion(content, promotion, image) {
  // Move an existing copy of the preview into the offer. Keep different
  // screenshots and illustrations in the article; they add their own context.
  const html = String(content ?? '').replace(/<figure\b[^>]*>[\s\S]*?<\/figure\s*>/gi, (figure) => {
    const classes = figure.match(/^<figure\b[^>]*\bclass=["']([^"']*)["']/i)?.[1]?.split(/\s+/) || [];
    const source = figure.match(/<img\b[^>]*\bsrc=["']([^"']*)["']/i)?.[1];
    return image && classes.includes('guide-figure') && source === image ? '' : figure;
  });
  const headings = [...html.matchAll(/<h2\b[^>]*>/gi)];
  const position = headings[2]?.index ?? html.length;
  return `${html.slice(0, position)}${promotion}${html.slice(position)}`;
}

module.exports = { insertGuidePromotion };
