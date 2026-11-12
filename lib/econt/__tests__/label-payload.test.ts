import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildLabelPayload, type BuildLabelParams } from '@/lib/econt/labels';

function sampleParams(overrides: Partial<BuildLabelParams> = {}): BuildLabelParams {
  return {
    mode: 'validate',
    sender: {
      name: 'Иван Иванов',
      phones: ['0879000000'],
      officeCode: '1111',
    },
    receiver: {
      name: 'Мария Петрова',
      phones: ['0888123456'],
      deliveryType: 'office',
      officeCode: '2222',
    },
    draft: {
      packageCount: 1,
      description: 'Дреха',
      payAfterAccept: true,
      payAfterTest: true,
      smsNotification: true,
      weight: 1,
    },
    codAmount: 59,
    deliveryPayer: 'receiver',
    ...overrides,
  };
}

function unchangedCoreFields(payload: ReturnType<typeof buildLabelPayload>) {
  const label = payload.label as Record<string, unknown>;
  const services = label.services as Record<string, unknown>;
  const instructions = label.instructions as Array<Record<string, unknown>>;
  const returnParams = (instructions[0].returnInstructionParams as Record<string, unknown>) ?? {};

  return {
    mode: payload.mode,
    senderClient: label.senderClient,
    senderOfficeCode: label.senderOfficeCode,
    receiverClient: label.receiverClient,
    receiverOfficeCode: label.receiverOfficeCode,
    packCount: label.packCount,
    shipmentType: label.shipmentType,
    weight: label.weight,
    sizeUnder60cm: label.sizeUnder60cm,
    shipmentDescription: label.shipmentDescription,
    payAfterAccept: label.payAfterAccept,
    payAfterTest: label.payAfterTest,
    paymentSenderMethod: label.paymentSenderMethod,
    paymentReceiverMethod: label.paymentReceiverMethod,
    cdAmount: services.cdAmount,
    cdType: services.cdType,
    cdCurrency: services.cdCurrency,
    instructionType: instructions[0].type,
    rejectAction: returnParams.rejectAction,
    rejectOriginalParcelPaySide: returnParams.rejectOriginalParcelPaySide,
    rejectReturnParcelPaySide: returnParams.rejectReturnParcelPaySide,
  };
}

describe('Econt createLabel payload — SMS and one-way delivery', () => {
  it('maps smsNotification onto label.services.smsNotification', () => {
    const payload = buildLabelPayload(sampleParams());
    const services = (payload.label as Record<string, unknown>).services as Record<string, unknown>;
    expect(services.smsNotification).toBe(true);
  });

  it('keeps the receiver phone in receiverClient.phones', () => {
    const payload = buildLabelPayload(sampleParams());
    const receiverClient = (payload.label as Record<string, unknown>).receiverClient as {
      phones: string[];
    };
    expect(receiverClient.phones).toEqual(['0888123456']);
  });

  it('does not request an automatic two-way / extra return parcel', () => {
    const payload = buildLabelPayload(sampleParams());
    const label = payload.label as Record<string, unknown>;
    const services = label.services as Record<string, unknown>;
    const instructions = label.instructions as Array<Record<string, unknown>>;
    const returnParams = instructions[0].returnInstructionParams as Record<string, unknown>;

    expect(services.twoWayShipment).toBeUndefined();
    expect(returnParams.returnParcelDestination).toBeUndefined();
    expect(returnParams.returnParcelPaymentSide).toBeUndefined();
    expect(returnParams.printReturnParcel).toBeUndefined();
    expect(label.printReturnParcel).toBeUndefined();
  });

  it('keeps inspection and testing before payment', () => {
    const payload = buildLabelPayload(sampleParams());
    const label = payload.label as Record<string, unknown>;
    expect(label.payAfterAccept).toBe(true);
    expect(label.payAfterTest).toBe(true);
  });

  it('keeps return-to-sender when the original parcel is refused', () => {
    const payload = buildLabelPayload(sampleParams());
    const instructions = (payload.label as Record<string, unknown>).instructions as Array<
      Record<string, unknown>
    >;
    const returnParams = instructions[0].returnInstructionParams as Record<string, unknown>;
    expect(instructions[0].type).toBe('return');
    expect(returnParams.rejectAction).toBe('return_to_sender');
    expect(returnParams.rejectOriginalParcelPaySide).toBe('receiver');
    expect(returnParams.rejectReturnParcelPaySide).toBe('receiver');
  });

  it('leaves all other API fields unchanged besides SMS and two-way options', () => {
    const payload = buildLabelPayload(sampleParams());
    expect(unchangedCoreFields(payload)).toEqual({
      mode: 'validate',
      senderClient: { name: 'Иван Иванов', phones: ['0879000000'] },
      senderOfficeCode: '1111',
      receiverClient: { name: 'Мария Петрова', phones: ['0888123456'] },
      receiverOfficeCode: '2222',
      packCount: 1,
      shipmentType: 'pack',
      weight: 1,
      sizeUnder60cm: true,
      shipmentDescription: 'Дреха',
      payAfterAccept: true,
      payAfterTest: true,
      paymentSenderMethod: '',
      paymentReceiverMethod: 'cash',
      cdAmount: 59,
      cdType: 'get',
      cdCurrency: 'EUR',
      instructionType: 'return',
      rejectAction: 'return_to_sender',
      rejectOriginalParcelPaySide: 'receiver',
      rejectReturnParcelPaySide: 'receiver',
    });
  });

  it('omits smsNotification when the saved draft does not enable it', () => {
    const payload = buildLabelPayload(
      sampleParams({ draft: { packageCount: 1, description: 'Дреха', smsNotification: false } })
    );
    const services = (payload.label as Record<string, unknown>).services as Record<string, unknown>;
    expect(services.smsNotification).toBeUndefined();
  });
});
