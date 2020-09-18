// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

type MutationType = 'ADD'|'REMOVE';
interface ExpectedMutation {
  type?: MutationType, element: string, max?: number,
}

const gatherMatchingNodesForExpectedMutation =
    (expectedMutation: ExpectedMutation, observedMutations: MutationRecord[]): Node[] => {
      const matchingNodes: Node[] = [];

      observedMutations.forEach(observed => {
        let nodesToCheck: Node[] = [];
        if (expectedMutation.type) {
          nodesToCheck = Array.from(expectedMutation.type === 'ADD' ? observed.addedNodes : observed.removedNodes);
        } else {
          nodesToCheck = [...Array.from(observed.addedNodes), ...Array.from(observed.removedNodes)];
        }
        nodesToCheck
            .filter(node => {
              return node.nodeName.toLowerCase() === expectedMutation.element;
            })
            .forEach(node => matchingNodes.push(node));
      });

      return matchingNodes;
    };

interface MutationCount {
  ADD: number, REMOVE: number,
}

const getAllMutationCounts = (observedMutations: MutationRecord[]): Map<string, MutationCount> => {
  const trackedMutations = new Map<string, MutationCount>();

  observedMutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      const element = node.nodeName.toLowerCase();
      const mutationsForElement = trackedMutations.get(element) || {ADD: 0, REMOVE: 0};
      mutationsForElement.ADD += 1;
      trackedMutations.set(element, mutationsForElement);
    });
    mutation.removedNodes.forEach(node => {
      const element = node.nodeName.toLowerCase();
      const mutationsForElement = trackedMutations.get(element) || {ADD: 0, REMOVE: 0};
      mutationsForElement.REMOVE += 1;
      trackedMutations.set(element, mutationsForElement);
    });
  });

  return trackedMutations;
};

/**
 * Check that a given component causes the expected amount of mutations. Useful
 * when testing a component to ensure it's updating the DOM performantly and not
 * unnecessarily.
 */
export const withMutations = async(
    expectedMutations: ExpectedMutation[], element: ShadowRoot,
    fn: (shadowRoot: ShadowRoot) => void): Promise<void> => {
  const observedMutations: MutationRecord[] = [];
  const mutationObserver = new MutationObserver(entries => {
    entries.forEach(entry => {
      if (entry.addedNodes.length || entry.removedNodes.length) {
        observedMutations.push(entry);
      }
    });
  });

  mutationObserver.observe(element, {
    subtree: true,
    attributes: true,
    childList: true,
  });

  await fn(element);

  const records = mutationObserver.takeRecords();
  records.forEach(entry => {
    if (entry.addedNodes.length || entry.removedNodes.length) {
      observedMutations.push(entry);
    }
  });
  mutationObserver.disconnect();

  if (expectedMutations.length === 0) {
    if (observedMutations.length !== 0) {
      const debugOutput: string[] = [];
      const mutationCounts = getAllMutationCounts(observedMutations);
      Array.from(mutationCounts.entries()).forEach(([elem, mutations]) => {
        let output = `${elem}: `;
        const addMutations = mutations.ADD;
        if (addMutations) {
          output += `${addMutations} additions`;
        }
        const removeMutations = mutations.REMOVE;
        if (removeMutations) {
          output += ` ${removeMutations} removals`;
        }
        debugOutput.push(output);
      });
      assert.fail(`Expected no mutations, but got ${observedMutations.length}: \n${debugOutput.join('\n')}`);
    }
    return;
  }

  expectedMutations.forEach(expectedMutation => {
    const matchingNodes = gatherMatchingNodesForExpectedMutation(expectedMutation, observedMutations);

    const amountOfMatchingMutations = matchingNodes.length;
    const maxMutationsAllowed = expectedMutation.max || 10;
    if (amountOfMatchingMutations > maxMutationsAllowed) {
      assert.fail(`Expected no more than ${maxMutationsAllowed} mutations for ${
          expectedMutation.type || 'ADD/REMOVE'} ${expectedMutation.element}, but got ${amountOfMatchingMutations}`);
    }
  });
};

/**
 * Ensure that a code block runs whilst making no mutations to the DOM. Given an
 * element and a callback, it will execute the callback function and ensure
 * afterwards that a MutatonObserver saw no changes.
 */
export const withNoMutations = async(element: ShadowRoot, fn: (shadowRoot: ShadowRoot) => void): Promise<void> => {
  return await withMutations([], element, fn);
};
