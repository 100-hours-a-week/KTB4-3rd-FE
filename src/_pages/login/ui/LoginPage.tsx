import { KakaoLoginButton } from '@/features/login/ui/KakaoLoginButton';
import { Logo } from '@/shared/ui/logo';
import { PageLayout } from '@/shared/ui/page-layout';
import { VStack } from '@/shared/ui/stack';

export function LoginPage() {
  return (
    <PageLayout>
      <VStack className="flex-1" align="center" justify="center">
        <Logo size="min(300px, calc(100vw - 40px))" />
      </VStack>
      <KakaoLoginButton />
    </PageLayout>
  );
}
