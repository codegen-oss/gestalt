/**
 * @fileoverview Prefer Box: prevent HTML tags supported in Box through the `as` prop
 */

// @flow strict
import { getHtmlTag, hasImport, buildProps } from './eslintASTHelpers.js';
import { renameTagWithPropsFixer, updateGestaltImportFixer } from './eslintASTFixers.js';
import { type ESLintRule } from './eslintFlowTypes.js';

export const SUPPORTED_HTML_TAGS = [
  'article',
  'aside',
  'details',
  'figcaption',
  'figure',
  'footer',
  'header',
  'main',
  'nav',
  'section',
  'summary',
];

const rule: ESLintRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: `Prefer Box: prevent HTML tags supported in Box through the \`as\` prop: ${SUPPORTED_HTML_TAGS.join(
        ', ',
      )}, instead',
      category: 'Gestalt alternatives`,
      recommended: true,
      url: 'https://gestalt.pinterest.systems/Eslint%20Plugin#gestaltprefer-box-as-tag',
    },
    fixable: 'code',
    schema: ([]: $ReadOnlyArray<empty>),
    messages: {
      disallowed: `Use <Box as="{{ tagName }}"></Box>.`,
    },
  },

  create(context) {
    let programNode;
    let gestaltImportNode;
    let isImportFixerExecuted = false;

    const importDeclarationFnc = (node) => {
      if (!node) return;

      const isGestaltImportNode = hasImport({ importNode: node, path: 'gestalt' });

      if (!isGestaltImportNode) return;

      gestaltImportNode = node;
    };

    const jSXElementFnc = (node) => {
      const tagName = getHtmlTag({ elementNode: node });

      if (!SUPPORTED_HTML_TAGS.includes(tagName)) return null;

      return context.report({
        node,
        messageId: 'disallowed',
        data: { tagName },
        fix: (fixer) => {
          const tagFixers = renameTagWithPropsFixer({
            additionalPropsString: buildProps({
              context,
              elementNode: node,
              newPropsString: `as="${tagName}"`,
            }),
            context,
            fixer,
            elementNode: node,
            newComponentName: 'Box',
            tagName,
          });

          const importFixers = updateGestaltImportFixer({
            context,
            fixer,
            gestaltImportNode,
            newComponentName: 'Box',
            programNode,
          });

          const fixers = !isImportFixerExecuted ? [...tagFixers, importFixers] : tagFixers;
          isImportFixerExecuted = true;
          return fixers;
        },
      });
    };

    return {
      Program: (node) => {
        programNode = node;
      },
      ImportDeclaration: importDeclarationFnc,
      JSXElement: jSXElementFnc,
    };
  },
};

export default rule;
