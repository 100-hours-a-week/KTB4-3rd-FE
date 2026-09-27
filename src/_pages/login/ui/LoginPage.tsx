import { KakaoLoginButton } from '@/features/login/ui/KakaoLoginButton';
import {
  bottomActionFixedClassName,
  bottomActionScrollPaddingClassName,
} from '@/shared/ui/bottom-action-button';
import { Logo } from '@/shared/ui/logo';
import { PageLayout } from '@/shared/ui/page-layout';
import { VStack } from '@/shared/ui/stack';

export function LoginPage() {
  return (
    <PageLayout
      contentClassName={bottomActionScrollPaddingClassName}
      footer={<KakaoLoginButton className={bottomActionFixedClassName} />}
    >
      <VStack className="flex-1" align="center" justify="center">
        <Logo size="min(300px, calc(100vw - 40px))" />
      </VStack>
    </PageLayout>
  );
}
