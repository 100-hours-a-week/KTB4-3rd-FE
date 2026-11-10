import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Map } from '@/shared/ui/map';
import { loadKakaoMaps } from '@/shared/ui/map/model/map-loader';

describe('지도 SDK preload', () => {
  it('서버 렌더링에서 실제 SDK 요청과 동일한 주소를 preload한다', () => {
    const html = renderToString(<Map apiKey="javascript-key" />);
    const container = document.createElement('div');
    container.innerHTML = html;
    const preload = container.querySelector<HTMLLinkElement>('link[rel="preload"][as="script"]');

    expect(preload).not.toBeNull();
    expect(container.querySelector('script[data-kakao-map-bootstrap]')).not.toBeNull();
    expect(
      container.querySelector('link[rel="preconnect"][href="https://t1.kakaocdn.net"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('link[rel="preconnect"][href="https://mts.kakaocdn.net"]'),
    ).not.toBeNull();
    void loadKakaoMaps('javascript-key').catch(() => {});
    const script = document.querySelector<HTMLScriptElement>('script[data-moyeota-kakao-map]');
    expect(script).not.toBeNull();
    expect(preload?.href).toBe(script?.src);
    script?.dispatchEvent(new Event('error'));
  });

  it('키가 없으면 SDK를 preload하지 않는다', () => {
    const html = renderToString(<Map apiKey="" />);

    expect(html).not.toContain('rel="preload"');
    expect(html).not.toContain('data-kakao-map-bootstrap');
  });

  it('키에 HTML 태그가 있어도 부트스트랩 스크립트를 벗어나지 않는다', () => {
    const unsafeKey = '</script><script>bad()</script>';
    const html = renderToString(<Map apiKey={unsafeKey} />);
    const container = document.createElement('div');
    container.innerHTML = html;

    expect(container.querySelectorAll('script')).toHaveLength(1);
    expect(container.querySelector('script')?.textContent).not.toContain('</script>');
  });
});
