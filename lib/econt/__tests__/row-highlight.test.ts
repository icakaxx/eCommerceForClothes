import { describe, expect, it } from 'vitest';
import { latestCreatedFromTimestamps, shipmentRowHighlight } from '@/lib/econt/row-highlight';

describe('shipment row highlighting', () => {
  it('leaves orders without a label uncolored', () => {
    expect(
      shipmentRowHighlight({ hasLabel: false, shipmentId: null, latestShipmentId: 'a' })
    ).toBe('none');
  });

  it('marks the latest created shipment', () => {
    expect(
      shipmentRowHighlight({ hasLabel: true, shipmentId: 's2', latestShipmentId: 's2' })
    ).toBe('latest');
  });

  it('marks older created shipments as created, not latest', () => {
    expect(
      shipmentRowHighlight({ hasLabel: true, shipmentId: 's1', latestShipmentId: 's2' })
    ).toBe('created');
  });

  it('picks the latest by actual creation timestamp', () => {
    const latest = latestCreatedFromTimestamps([
      { id: 'older', createdAt: '2026-11-05T10:00:00.000Z' },
      { id: 'newest', createdAt: '2026-11-05T12:00:00.000Z' },
      { id: 'middle', createdAt: '2026-11-05T11:00:00.000Z' },
    ]);
    expect(latest?.id).toBe('newest');
  });

  it('moves previous latest off yellow after a newer label', () => {
    const first = latestCreatedFromTimestamps([
      { id: 's1', createdAt: '2026-11-05T10:00:00.000Z' },
    ]);
    expect(shipmentRowHighlight({ hasLabel: true, shipmentId: 's1', latestShipmentId: first?.id })).toBe(
      'latest'
    );

    const afterSecond = latestCreatedFromTimestamps([
      { id: 's1', createdAt: '2026-11-05T10:00:00.000Z' },
      { id: 's2', createdAt: '2026-11-05T10:05:00.000Z' },
    ]);
    expect(afterSecond?.id).toBe('s2');
    expect(
      shipmentRowHighlight({ hasLabel: true, shipmentId: 's1', latestShipmentId: afterSecond?.id })
    ).toBe('created');
    expect(
      shipmentRowHighlight({ hasLabel: true, shipmentId: 's2', latestShipmentId: afterSecond?.id })
    ).toBe('latest');
    expect(
      shipmentRowHighlight({ hasLabel: false, shipmentId: null, latestShipmentId: afterSecond?.id })
    ).toBe('none');
  });
});
