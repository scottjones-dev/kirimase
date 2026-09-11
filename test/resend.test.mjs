import assert from "node:assert/strict";
import test from "node:test";
import { resendGenerators } from "../dist/commands/add/misc/resend/generators.js";

const REACT_EMAIL_IMPORT_PATTERN = /from "@react-email\/components"/;
const EMAIL_LAYOUT_IMPORT_PATTERN =
  /import \{ EmailLayout \} from "\.\/EmailLayout"/;
const EMAIL_TEMPLATE_EXPORT_PATTERN = /export const EmailTemplate/;
const EMAIL_LAYOUT_EXPORT_PATTERN = /export const EmailLayout/;
const HTML_TAG_PATTERN = /<Html>/;
const HAND_ROLLED_DIV_PATTERN = /<div>/;
const CHILDREN_PLACEHOLDER_PATTERN = /\{children\}/;

test("EmailTemplate uses @react-email/components instead of hand-rolled JSX", () => {
  const output = resendGenerators.generateEmailTemplateComponent();
  assert.match(output, REACT_EMAIL_IMPORT_PATTERN);
  assert.match(output, EMAIL_LAYOUT_IMPORT_PATTERN);
  assert.match(output, EMAIL_TEMPLATE_EXPORT_PATTERN);
  assert.doesNotMatch(output, HAND_ROLLED_DIV_PATTERN);
});

test("EmailLayout wraps children in the react-email Html/Body/Container shell", () => {
  const output = resendGenerators.generateEmailLayoutComponent();
  assert.match(output, REACT_EMAIL_IMPORT_PATTERN);
  assert.match(output, EMAIL_LAYOUT_EXPORT_PATTERN);
  assert.match(output, HTML_TAG_PATTERN);
  assert.match(output, CHILDREN_PLACEHOLDER_PATTERN);
});
