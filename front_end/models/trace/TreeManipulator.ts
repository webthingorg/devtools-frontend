// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import type * as Handlers from './handlers/handlers.js';
import type * as Types from './types/types.js';

type EntryToNodeMap =
    Map<Handlers.ModelHandlers.Renderer.RendererEntry, Handlers.ModelHandlers.Renderer.RendererEntryNode>;

export interface UserTreeAction {
  type: 'MERGE_FUNCTION'|'COLLAPSE_FUNCTION';
  entry: Handlers.ModelHandlers.Renderer.RendererEntry;
}

export class TreeManipulator {
  readonly #thread: Handlers.ModelHandlers.Renderer.RendererThread;
  #lastVisibleEntries: readonly Handlers.ModelHandlers.Renderer.RendererEntry[]|null = null;
  #entryToNode: EntryToNodeMap;
  #activeActions: UserTreeAction[] = [];

  constructor(
      thread: Handlers.ModelHandlers.Renderer.RendererThread,
      entryToNode: EntryToNodeMap,
  ) {
    this.#thread = thread;
    this.#entryToNode = entryToNode;
  }

  applyUserAction(action: UserTreeAction): void {
    this.#activeActions.push(action);
    // Clear the last list of visible entries - this invalidates the cache and
    // ensures that the visible list will be recalculated, which we have to do
    // now we have changed the list of actions.
    this.#lastVisibleEntries = null;
  }

  visibleEntries(): readonly Types.TraceEvents.TraceEventData[] {
    if (this.#activeActions.length === 0) {
      return this.#thread.entries;
    }
    return this.#calculateVisibleEntries();
  }

  #calculateVisibleEntries(): readonly Types.TraceEvents.TraceEventData[] {
    if (this.#lastVisibleEntries) {
      return this.#lastVisibleEntries;
    }
    if (!this.#thread.tree) {
      // We need a tree to be able to calculate user actions, if we do not have
      // it, just return all the entries.
      return this.#thread.entries;
    }
    // We apply each user action in turn to the set of all entries, and mark
    // any that should be hidden by adding them to this set. We do this to
    // ensure we minimise the amount of passes through the list of all entries.
    // Another approach would be to use splice() to remove items from the
    // array, but doing this would be a mutation of the arry for every hidden
    // event. Instead, we add entries to this set, and at the very end loop
    // through the entries array once to filter out any that should be hidden.
    const entriesToHide = new Set<Handlers.ModelHandlers.Renderer.RendererEntry>();

    const entries = [...this.#thread.entries];
    for (const action of this.#activeActions) {
      if (action.type === 'MERGE_FUNCTION') {
        // The entry that was clicked on is merged into its parent. All its
        // children remain visible, so we just have to hide the entry that was
        // selected.
        entriesToHide.add(action.entry);
      } else if (action.type === 'COLLAPSE_FUNCTION') {
        // The entry itself remains visible, but all of its ancestors are hidden.
        const entryNode = this.#entryToNode.get(action.entry);
        if (!entryNode) {
          // Invalid node was given, just ignore and move on.
          continue;
        }
        const allAncestors = this.#findAllAncestorsOfNode(this.#thread.tree, entryNode);
        allAncestors.forEach(ancestor => entriesToHide.add(ancestor));
      }
    }

    // Now we have applied all actions, loop through the list of entries and
    // remove any that are marked as hidden.
    //
    // We cache this under lastVisibleEntries - if this function is called
    // again and the user actions have not changed, we can avoid recalculating
    // this and just return the last one. This cache is automatically cleared
    // when the user actions are changed.
    this.#lastVisibleEntries = entries.filter(entry => {
      return entriesToHide.has(entry) === false;
    });

    return this.#lastVisibleEntries;
  }

  #findAllAncestorsOfNode(
      tree: Handlers.ModelHandlers.Renderer.RendererTree,
      root: Handlers.ModelHandlers.Renderer.RendererEntryNode): Handlers.ModelHandlers.Renderer.RendererEntry[] {
    const ancestors: Handlers.ModelHandlers.Renderer.RendererEntry[] = [];

    // Walk through all the ancestors, starting at the root node.
    const childIds: Handlers.ModelHandlers.Renderer.RendererEntryNodeId[] = Array.from(root.childrenIds);
    while (childIds.length > 0) {
      const id = childIds.shift();
      if (!id) {
        break;
      }
      const childNode = tree.nodes.get(id);
      if (childNode) {
        ancestors.push(childNode.entry);
        const newChildIds = Array.from(childNode.childrenIds);
        childIds.push(...newChildIds);
      }
    }

    return ancestors;
  }
}
