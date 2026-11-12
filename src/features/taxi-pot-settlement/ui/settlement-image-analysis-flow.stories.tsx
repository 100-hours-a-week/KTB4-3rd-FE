import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import {
  TaxiMeterAmountDialog,
  TaxiMeterAnalysisDialog,
  TransferConfirmationAnalysisDialog,
  TransferConfirmationRecognitionFailedDialog,
} from '@/features/taxi-pot-settlement';

type MeterScenario =
  | 'SUBMITTED'
  | 'DELAYED_10S'
  | 'PASSED'
  | 'FAILED_CAN_RETRY'
  | 'FAILED_NO_RETRIES'
  | 'MANUAL_ENTRY'
  | 'MANUAL_SAVED';
type TransferResult = 'PENDING' | 'ANALYZING' | 'PASSED' | 'FAILED';

type MeterStoryArgs = {
  scenario: MeterScenario;
};

type TransferStoryArgs = {
  result: TransferResult;
};

type StorybookArgs = {
  scenario: MeterScenario | TransferResult;
};

function ResultNotice({ children }: { children: string }) {
  return (
    <div className="rounded-xl bg-[var(--color-bg-layer-fill)] p-6 text-center text-[var(--color-fg-neutral)]">
      {children}
    </div>
  );
}

const meterScenarioDetails: Record<MeterScenario, { label: string; description: string }> = {
  SUBMITTED: {
    label: '1. 제출 응답: 분석 중',
    description:
      'POST /settlements/{id}/meter-image가 202와 ANALYZING을 반환했습니다. 분석 대기 모달을 엽니다.',
  },
  DELAYED_10S: {
    label: '2. 10초 경과: 결과 지연',
    description:
      '분석 결과 WebSocket 이벤트가 아직 오지 않았습니다. 대기 모달에 수동 입력 버튼이 추가됩니다.',
  },
  PASSED: {
    label: '3-A. WebSocket 결과: PASSED',
    description:
      'METER_ANALYSIS_FINISHED(PASSED)를 받으면 대기 모달을 닫습니다. 이후 서버의 정산 요청 메시지를 기다립니다.',
  },
  FAILED_CAN_RETRY: {
    label: '3-B. WebSocket 결과: FAILED, 재시도 가능',
    description:
      'METER_ANALYSIS_FINISHED(FAILED)를 받았고 남은 사진 제출 횟수가 있습니다. 금액 입력 또는 사진 재촬영을 선택할 수 있습니다.',
  },
  FAILED_NO_RETRIES: {
    label: '3-C. WebSocket 결과: FAILED, 횟수 소진',
    description:
      'FAILED 결과와 remaining_meter_attempts=0을 받았습니다. 사진 재촬영 없이 금액 입력만 가능합니다.',
  },
  MANUAL_ENTRY: {
    label: '4. 수동 금액 입력',
    description: '지연 중 수동 입력을 선택했거나, 인식 실패 후 직접 입력을 선택한 상태입니다.',
  },
  MANUAL_SAVED: {
    label: '5. 수동 금액 저장 완료',
    description: 'PUT /settlements/{id}/amount가 성공했습니다. 미터 분석은 MANUAL로 종료됩니다.',
  },
};

function MeterResultStory({ scenario }: MeterStoryArgs) {
  const [currentScenario, setCurrentScenario] = useState(scenario);
  const [amount, setAmount] = useState('');
  const detail = meterScenarioDetails[currentScenario];
  const waiting = currentScenario === 'SUBMITTED' || currentScenario === 'DELAYED_10S';
  const amountEntry =
    currentScenario === 'MANUAL_ENTRY' ||
    currentScenario === 'FAILED_CAN_RETRY' ||
    currentScenario === 'FAILED_NO_RETRIES';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col gap-5 bg-[var(--color-bg-layer-default)] p-6 text-[var(--color-fg-neutral)]">
      <header className="flex flex-col gap-2">
        <p className="m-0 text-sm font-semibold text-[var(--color-fg-brand)]">
          미터기 사진 제출 흐름
        </p>
        <h1 className="m-0 text-2xl font-bold">{detail.label}</h1>
        <p className="m-0 text-sm leading-6">{detail.description}</p>
      </header>

      <section
        aria-label="전체 흐름"
        className="rounded-xl border border-[var(--color-stroke-neutral-weak)] p-4"
      >
        <h2 className="m-0 mb-2 text-sm font-bold">전체 흐름</h2>
        <ol className="m-0 flex flex-col gap-1 pl-5 text-sm leading-6">
          <li>미터기 사진을 S3에 올리고 image_key로 정산 사진 제출 API를 호출합니다.</li>
          <li>
            202 응답은 분석 대기 상태입니다. 10초 동안 결과가 없으면 수동 입력 선택지를 보여줍니다.
          </li>
          <li>settlement WebSocket의 PASSED / FAILED 이벤트로 결과 모달을 분기합니다.</li>
          <li>
            FAILED는 남은 횟수에 따라 재촬영 버튼을 제공하고, 횟수가 없으면 수동 입력만 허용합니다.
          </li>
          <li>수동 입력 저장 성공 후 MANUAL 상태로 정산을 이어갑니다.</li>
        </ol>
      </section>

      <section aria-label="시나리오 선택" className="flex flex-wrap gap-2">
        {(Object.keys(meterScenarioDetails) as MeterScenario[]).map((nextScenario) => (
          <button
            key={nextScenario}
            className={`rounded-lg border px-3 py-2 text-left text-xs ${currentScenario === nextScenario ? 'border-[var(--color-stroke-brand)] bg-[var(--color-bg-brand-weak)]' : 'border-[var(--color-stroke-neutral-weak)]'}`}
            onClick={() => setCurrentScenario(nextScenario)}
            type="button"
          >
            {meterScenarioDetails[nextScenario].label}
          </button>
        ))}
      </section>

      {currentScenario === 'PASSED' ? (
        <ResultNotice>
          분석 성공: 대기 모달이 닫혔습니다. 정산 요청 메시지를 기다립니다.
        </ResultNotice>
      ) : null}
      {currentScenario === 'MANUAL_SAVED' ? (
        <ResultNotice>
          수동 금액 저장 완료: 정산 상태가 MANUAL로 바뀌고 정산 요청이 이어집니다.
        </ResultNotice>
      ) : null}
      {currentScenario === 'FAILED_CAN_RETRY' ? (
        <p className="m-0 text-xs">remaining_meter_attempts: 1</p>
      ) : null}
      {currentScenario === 'FAILED_NO_RETRIES' ? (
        <p className="m-0 text-xs">remaining_meter_attempts: 0</p>
      ) : null}

      <TaxiMeterAnalysisDialog
        delayed={currentScenario === 'DELAYED_10S'}
        onManualEntry={() => setCurrentScenario('MANUAL_ENTRY')}
        open={waiting}
      />
      <TaxiMeterAmountDialog
        allowRetakePhoto={currentScenario === 'FAILED_CAN_RETRY'}
        onRetakePhoto={() => {
          setAmount('');
          setCurrentScenario('SUBMITTED');
        }}
        onSettle={() => setCurrentScenario('MANUAL_SAVED')}
        onValueChange={setAmount}
        open={amountEntry}
        recognitionFailed={
          currentScenario === 'FAILED_CAN_RETRY' || currentScenario === 'FAILED_NO_RETRIES'
        }
        value={amount}
      />
    </main>
  );
}

function TransferResultStory({ result }: TransferStoryArgs) {
  const [open, setOpen] = useState(true);

  if (result === 'PASSED') {
    return <ResultNotice>분석 성공: 대기 모달을 닫습니다.</ResultNotice>;
  }

  return result === 'FAILED' ? (
    <>
      <TransferConfirmationRecognitionFailedDialog
        onOpenChange={setOpen}
        onReselectPhoto={() => setOpen(false)}
        open={open}
      />
      {open ? null : (
        <ResultNotice>
          사진 재선택을 눌렀습니다. 새 사진 업로드 후 분석이 다시 시작됩니다.
        </ResultNotice>
      )}
    </>
  ) : (
    <TransferConfirmationAnalysisDialog open={open} />
  );
}

const meta: Meta<StorybookArgs> = {
  title: 'Features/TaxiPotSettlement/ImageAnalysisResultFlow',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const MeterAnalysisResults: Story = {
  args: { scenario: 'DELAYED_10S' },
  parameters: {
    docs: {
      description: {
        story:
          '시나리오를 선택해 202 제출 응답 직후, 10초 지연, WebSocket PASSED/FAILED, 재촬영 횟수 소진, 수동 입력까지 한 흐름으로 확인합니다. 지연 상태의 수동 입력 버튼과 실패 상태의 재촬영 버튼을 직접 눌러 다음 단계로 이동할 수 있습니다.',
      },
    },
  },
  argTypes: {
    scenario: {
      control: 'select',
      options: [
        'SUBMITTED',
        'DELAYED_10S',
        'PASSED',
        'FAILED_CAN_RETRY',
        'FAILED_NO_RETRIES',
        'MANUAL_ENTRY',
        'MANUAL_SAVED',
      ],
    },
  },
  render: (args) => (
    <MeterResultStory key={args.scenario} scenario={args.scenario as MeterScenario} />
  ),
};

export const TransferProofResults: Story = {
  args: { scenario: 'PENDING' },
  argTypes: {
    scenario: {
      control: 'select',
      options: ['PENDING', 'ANALYZING', 'PASSED', 'FAILED'],
    },
  },
  render: (args) => (
    <TransferResultStory key={args.scenario} result={args.scenario as TransferResult} />
  ),
};
