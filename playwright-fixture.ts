import { expect, test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, run) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await run(page);

    expect(pageErrors, "Unexpected runtime errors were emitted in the browser").toEqual([]);
  },
});

export { expect };
