export type ShipmentRowHighlight = 'latest' | 'created' | 'none';

export function shipmentRowHighlight(params: {
  hasLabel: boolean;
  shipmentId?: string | null;
  latestShipmentId?: string | null;
}): ShipmentRowHighlight {
  if (!params.hasLabel) return 'none';
  if (params.shipmentId && params.latestShipmentId && params.shipmentId === params.latestShipmentId) {
    return 'latest';
  }
  return 'created';
}

export function latestCreatedFromTimestamps<T extends { id: string; createdAt: string }>(
  created: T[]
): T | null {
  if (created.length === 0) return null;
  return created.reduce((latest, row) =>
    new Date(row.createdAt).getTime() > new Date(latest.createdAt).getTime() ? row : latest
  );
}
