export type EcontServiceError = {
  type?: string;
  message?: string;
  fields?: string[];
  innerErrors?: EcontServiceError[];
};

export class EcontAppError extends Error {
  code: string;
  field?: string;
  title: string;
  suggestion?: string;
  retryable: boolean;
  httpStatus: number;
  raw?: unknown;

  constructor(params: {
    code: string;
    title: string;
    message: string;
    field?: string;
    suggestion?: string;
    retryable?: boolean;
    httpStatus?: number;
    raw?: unknown;
  }) {
    super(params.message);
    this.name = 'EcontAppError';
    this.code = params.code;
    this.title = params.title;
    this.field = params.field;
    this.suggestion = params.suggestion;
    this.retryable = params.retryable ?? false;
    this.httpStatus = params.httpStatus ?? 400;
    this.raw = params.raw;
  }
}

export type NormalizedShipmentStatus =
  | 'prepared'
  | 'accepted'
  | 'in_transit'
  | 'in_office'
  | 'out_for_delivery'
  | 'delivered'
  | 'returning'
  | 'returned'
  | 'cancelled'
  | 'unknown';

export type ShipmentDraftConfig = {
  senderProfileId?: string;
  weight?: number;
  packageCount?: number;
  description?: string;
  deliveryPayer?: 'receiver' | 'sender';
  payAfterAccept?: boolean;
  payAfterTest?: boolean;
  smsNotification?: boolean;
  emailNotification?: boolean;
  receiverOfficeCode?: string;
  receiverOfficeName?: string;
  receiverCityId?: number;
  receiverCityName?: string;
  receiverAddress?: {
    street?: string;
    num?: string;
    other?: string;
    postCode?: string;
  };
  codOverrideAmount?: number;
  codOverrideConfirmed?: boolean;
};

export type EcontCity = {
  id: number;
  name: string;
  nameEn?: string;
  postCode?: string;
  regionName?: string;
  regionNameEn?: string;
};

export type EcontOffice = {
  id?: number;
  code: string;
  name: string;
  nameEn?: string;
  address?: {
    fullAddress?: string;
    fullAddressEn?: string;
    street?: string;
    num?: string;
    other?: string;
    quarter?: string;
    city?: { name?: string; postCode?: string };
    [key: string]: unknown;
  };
  phones?: string[];
};

export type LabelCreateResponse = {
  label?: {
    shipmentNumber?: string | null;
    pdfURL?: string;
    totalPrice?: number;
    currency?: string;
    expectedDeliveryDate?: number;
    services?: unknown[];
  };
  payAfterAcceptIgnored?: string | null;
  delayedDeliveryWarning?: string;
};

export type ShipmentStatusEntry = {
  status?: {
    shipmentNumber?: string;
    shortDeliveryStatus?: string;
    shortDeliveryStatusEn?: string;
    trackingEvents?: Array<Record<string, unknown>>;
    pdfURL?: string;
    cdCollectedAmount?: number | null;
    cdCollectedCurrency?: string | null;
    cdCollectedTime?: number | string | null;
    cdPaidAmount?: number | null;
    cdPaidCurrency?: string | null;
    cdPaidTime?: number | string | null;
    totalPrice?: number | null;
    senderDueAmount?: number | null;
    receiverDueAmount?: number | null;
    deliveryTime?: number | string | null;
    expectedDeliveryDate?: number | string | null;
    createdTime?: number | string | null;
    sendTime?: number | string | null;
  } | null;
  error?: EcontServiceError | null;
};

export type PaymentReportRow = {
  num?: number | string;
  type?: string;
  payType?: string;
  payDate?: string;
  amount?: number;
  currency?: string;
  createdTime?: string;
};
