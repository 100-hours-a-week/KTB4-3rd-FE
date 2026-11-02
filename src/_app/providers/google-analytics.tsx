import Script from 'next/script';

type GoogleAnalyticsProps = {
  gaId: string;
};

export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  const safeId = JSON.stringify(gaId).replace(/</g, '\\u003c');

  return (
    <>
      <Script
        id="google-analytics-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
            function gtag() { window.dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', ${safeId}, { send_page_view: false });
            gtag('event', 'page_view', {
              page_location: window.location.href,
              page_title: document.title,
              page_referrer: document.referrer
            });`,
        }}
      />
      <Script
        id="google-analytics-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
        strategy="lazyOnload"
      />
    </>
  );
}
