import AxeBuilder from "@axe-core/playwright";
import { test as base } from "@playwright/test";

type AxeFixture = {
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<AxeFixture>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page }).withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
      ]);

    await use(makeAxeBuilder);
  },
});

type AxeResult = {
  id: string;
  nodes: {
    target: unknown;
  }[];
};

type AxeResults = {
  violations: AxeResult[];
};

export function violationFingerprints(accessibilityScanResults: AxeResults) {
  const violationFingerprints = accessibilityScanResults.violations?.map(
    (violation: AxeResult) => ({
      rule: violation.id,
      // These are CSS selectors which uniquely identify each element with
      // a violation of the rule in question.
      targets: violation.nodes.map((node) => node.target),
    }),
  );

  return JSON.stringify(violationFingerprints, null, 2);
}

export { expect } from "@playwright/test";
