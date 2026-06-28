// Servera /i/-landningssidan för alla /i/<handle>-vägar (universal/app link).
// URL:en behålls oförändrad så klient-JS:en kan läsa handle ur location.pathname.
// Cloudflare Pages _redirects 200-proxy var opålitlig för subpath-splat; en
// Pages Function med ASSETS-bindningen är det robusta sättet att serva en sida
// för dynamiska sökvägar.
export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  url.pathname = '/i/';
  return env.ASSETS.fetch(new Request(url, request));
}
