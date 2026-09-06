const ID_ATTRIBUTE = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`=]+))/i;

// Article content contains ordinary, non-nested HTML tables. Wrap them before
// the layout renders so wide tables scroll without changing table semantics.
function responsiveTables(content) {
  const html = String(content ?? '');
  const usedIds = new Set(
    [...html.matchAll(/\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`=]+))/gi)]
      .map((match) => match[1] ?? match[2] ?? match[3]),
  );
  let index = 0;

  return html.replace(/<table\b[^>]*>[\s\S]*?<\/table\s*>/gi, (table) => {
    let captionId;
    const labelledTable = table.replace(/<caption\b([^>]*)>/i, (caption, attributes) => {
      const existingId = attributes.match(ID_ATTRIBUTE);
      if (existingId) {
        captionId = existingId[1] ?? existingId[2] ?? existingId[3];
        return caption;
      }
      do {
        captionId = `article-table-caption-${++index}`;
      } while (usedIds.has(captionId));
      usedIds.add(captionId);
      return `<caption${attributes} id="${captionId}">`;
    });

    // Existing captions provide the accessible name in the article's language.
    // An uncaptained table still scrolls, without adding an unnamed landmark.
    const label = captionId
      ? ` role="region" aria-labelledby="${captionId.replace(/"/g, '&quot;')}"`
      : '';
    return `<div class="table-scroll" tabindex="0"${label}>${labelledTable}</div>`;
  });
}

module.exports = { responsiveTables };
