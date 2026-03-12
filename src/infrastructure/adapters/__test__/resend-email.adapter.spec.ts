import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn().mockResolvedValue({ data: { id: 'email-id' }, error: null }),
}));

vi.mock('resend', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Resend: vi.fn(function (this: any) {
    this.emails = { send: mockSend };
  }),
}));

import { ResendEmailAdapter } from '../resend-email.adapter.js';

describe('ResendEmailAdapter', () => {
  let adapter: ResendEmailAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new ResendEmailAdapter('test-api-key', 'noreply@example.com');
  });

  it('calls resend emails.send with the correct payload', async () => {
    await adapter.send({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hello</p>',
    });

    expect(mockSend).toHaveBeenCalledOnce();
    expect(mockSend).toHaveBeenCalledWith({
      from: 'noreply@example.com',
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hello</p>',
    });
  });

  it('resolves without throwing on success', async () => {
    await expect(
      adapter.send({ to: 'user@example.com', subject: 'Test', html: '<p>Test</p>' }),
    ).resolves.toBeUndefined();
  });

  it('propagates errors from resend', async () => {
    mockSend.mockRejectedValueOnce(new Error('Resend API error'));

    await expect(
      adapter.send({ to: 'user@example.com', subject: 'Test', html: '<p>Test</p>' }),
    ).rejects.toThrow('Resend API error');
  });
});
