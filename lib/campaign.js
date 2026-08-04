// Kampanjmärkning av butikslänkarna.
//
// Uppslagsordningen är c, sedan utm_campaign, sedan marknadens generiska namn.
// utm_campaign MÅSTE finnas med: betald trafik från Meta och Google Ads landar
// direkt på /dk/?utm_campaign=... och passerar aldrig /go. Utan det steget
// faller all annonstrafik tillbaka på webb-dk och går inte att skilja ut i
// App Store Connect.
//
// Apples kampanjrapport bygger på pt/ct och är Apples egen aggregerade
// förstahandsdata. Den påverkas inte av ATT, till skillnad från
// annonsplattformarnas egen attribution.

/** Samma sanering som functions/go.js. Hålls i synk manuellt: Cloudflare-
 *  funktioner byggs separat och kan inte importera den här modulen. */
function sanitizeCampaign(raw) {
  if (!raw) return "";
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

/** Kampanjen ur en query-sträng, saneringen inkluderad. */
function campaignFromSearch(search) {
  const params = new URLSearchParams(search || "");
  return sanitizeCampaign(params.get("c") || params.get("utm_campaign"));
}

/** Byter ut kampanjen i en butikslänk. App Store bär den i ct, Google Play
 *  inuti den urlencodade referrer-strängen. */
function withCampaign(storeUrl, campaign) {
  if (!campaign) return storeUrl;
  const url = new URL(storeUrl);

  if (url.searchParams.has("ct")) {
    url.searchParams.set("ct", campaign);
  }

  const referrer = url.searchParams.get("referrer");
  if (referrer) {
    const inner = new URLSearchParams(referrer);
    inner.set("utm_campaign", campaign);
    url.searchParams.set("referrer", inner.toString());
  }

  return url.toString();
}

module.exports = { sanitizeCampaign, campaignFromSearch, withCampaign };
