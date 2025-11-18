describe('Happy path (integration outline)', () => {
  test.skip('create → pay intent → webhook success → confirm → complete', async () => {
    // This test requires running product-service and payment-service.
    // Outline only: use supertest to post to /api/orders, then pay, webhook, confirm, complete.
  });
});

