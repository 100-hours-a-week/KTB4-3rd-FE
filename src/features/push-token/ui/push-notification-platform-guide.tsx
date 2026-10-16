export function PushNotificationPlatformGuide() {
  return (
    <details className="relative z-20 mt-4 rounded-xl bg-[var(--color-bg-layer-fill)] px-4 py-3 select-none">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--color-fg-neutral)]">
        푸시 알림이 오지 않나요?
      </summary>
      <div className="absolute top-full left-0 z-30 mt-1 w-full rounded-xl bg-[var(--color-bg-layer-fill)] p-4 text-sm text-[var(--color-fg-neutral-muted)] shadow-lg">
        <section>
          <h2 className="font-semibold text-[var(--color-fg-neutral)]">
            Mac에서 Chrome을 사용하는 경우
          </h2>
          <ol className="mt-1 list-inside list-decimal space-y-1">
            <li>Chrome에서 모여타 사이트 알림을 허용해주세요.</li>
            <li>시스템 설정 → 알림 → Google Chrome에서 알림 허용과 배너 표시를 켜주세요.</li>
            <li>집중 모드가 켜져 있다면 모여타 알림이 허용되어 있는지 확인해주세요.</li>
          </ol>
        </section>
        <section>
          <h2 className="font-semibold text-[var(--color-fg-neutral)]">iPhone에서 사용하는 경우</h2>
          <p className="mt-1">
            iOS 16.4 이상에서 Safari로 모여타를 열고 공유 → 홈 화면에 추가를 선택한 다음, 홈 화면의
            모여타 아이콘으로 실행해주세요. 웹 푸시는 홈 화면에 추가한 웹 앱에서 사용할 수 있습니다.
          </p>
          <p className="mt-1">
            알림 권한을 허용한 뒤 설정 → 알림 → 모여타에서 알림과 배너를 켜주세요.
          </p>
        </section>
      </div>
    </details>
  );
}
