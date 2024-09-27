// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Protocol from '../../../generated/protocol.js';
import {type Warning} from '../handlers/WarningsHandler.js';
import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';

import {type InsightResult, type InsightSetContext, type RequiredData} from './types.js';

export function deps(): ['Warnings', 'Renderer'] {
  return ['Warnings', 'Renderer'];
}

export type ForcedReflowInsightResult = InsightResult<{
  topLevelFunctionCallData: Types.Events.CallFrame | Protocol.Runtime.CallFrame | undefined,
  aggregatedBottomUpData: Types.Events.BottomUpCallStack[],
}>;

function aggregateForcedReflow(
    data: Map<Warning, Types.Events.Event[]>,
    entryToNodeMap: Map<Types.Events.Event, Helpers.TreeHelpers.TraceEntryNode>):
    [Types.Events.CallFrame|Protocol.Runtime.CallFrame|undefined, Types.Events.BottomUpCallStack[]] {
  const aggregatedMap = new Map<string, Types.Events.ForcedReflowAggregatedData>();
  const bottomUpDataMap = new Map<string, Types.Events.BottomUpCallStack>();
  const forcedReflowEvents = data.get('FORCED_REFLOW');

  if (forcedReflowEvents && forcedReflowEvents.length > 0) {
    forcedReflowEvents.forEach(e => {
      // Gather the stack traces by searching in the tree
      const traceNode = entryToNodeMap.get(e);

      let stackTrace: Types.Events.CallFrame[]|undefined;
      let recalcTraceCallFrame: Types.Events.CallFrame|undefined = undefined;
      let bottomUpDataId = '';
      let recalcDataId;
      if (Types.Events.isUpdateLayoutTree(e)) {
        stackTrace = e.args.beginData?.stackTrace;
        if (stackTrace) {
          recalcTraceCallFrame = stackTrace[0];
          recalcDataId = recalcTraceCallFrame.scriptId + ':' + recalcTraceCallFrame.lineNumber + ':' +
              recalcTraceCallFrame.columnNumber;
        }
      }

      // Compute call stack fully
      if (traceNode) {
        let bottomUpData: (Types.Events.CallFrame|Protocol.Runtime.CallFrame)[] = [];
        let currentNode = traceNode;
        let childStack: Protocol.Runtime.CallFrame[] = [];

        // Some profileCalls maybe constructed as its children in hierarchy tree
        while (currentNode.children.length > 0) {
          let childNode = currentNode.children[0];
          const eventData = childNode.entry;
          if (Types.Events.isProfileCall(eventData)) {
            childStack.push(eventData.callFrame);
          }
          currentNode = childNode;
        }

        // In order to avoid too much information, we only contains 3 levels bottomUp data,
        while (childStack.length > 0 && bottomUpData.length < 3) {
          const traceData = childStack.pop();
          if (traceData) {
            bottomUpData.push(traceData);
          }
        }

        let node = traceNode.parent;
        let previousNode;
        let topLevelFunctionCall;
        while (node) {
          const eventData = node.entry;
          if (Types.Events.isProfileCall(eventData)) {
            if (bottomUpData.length < 3) {
              bottomUpData.push(eventData.callFrame);
            }
          } else {
            // We have finished searching bottom up data
            if (Types.Events.isFunctionCall(eventData) && eventData.args.data &&
                Types.Events.objectIsCallFrame(eventData.args.data)) {
              topLevelFunctionCall = eventData.args.data;
              if (bottomUpData.length == 0) {
                bottomUpData.push(topLevelFunctionCall);
              }
            } else {
              // Sometimes the top level task can be other JSInvocation event
              // then we use the top level profile call as topLevelFunctionCall's data
              const previousData = previousNode?.entry;
              if (previousData && Types.Events.isProfileCall(previousData)) {
                topLevelFunctionCall = previousData.callFrame;
                // pop out the useless data
                if (bottomUpData.length === 3) {
                  bottomUpData.pop();
                }
              }
            }
            break;
          }
          previousNode = node;
          node = node.parent;
        }

        if (!topLevelFunctionCall) {
          const len = bottomUpData.length;
          if (len > 0) {
            topLevelFunctionCall = len === 3 ? bottomUpData.pop() : bottomUpData[len - 1];
          }
        }

        for (var d of bottomUpData) {
          bottomUpDataId += d.scriptId + ':' + d.lineNumber + ':' + d.columnNumber + ':';
        }

        if (topLevelFunctionCall && bottomUpData.length > 0) {
          if (!bottomUpDataMap.has(bottomUpDataId)) {
            bottomUpDataMap.set(bottomUpDataId, {
              bottomUpData: bottomUpData,
              recalcDataSet: new Set<string>(),
              recalcData: [],
            });
          }

          const bottomUpCallStackData = bottomUpDataMap.get(bottomUpDataId);
          if (recalcDataId && recalcTraceCallFrame && bottomUpCallStackData &&
              !bottomUpCallStackData.recalcDataSet.has(recalcDataId)) {
            bottomUpCallStackData.recalcDataSet.add(recalcDataId);
            bottomUpCallStackData.recalcData.push(recalcTraceCallFrame);
          }

          const aggregatedDataId = topLevelFunctionCall.scriptId + ':' + topLevelFunctionCall.lineNumber + ':' +
              topLevelFunctionCall.columnNumber;
          if (!aggregatedMap.has(aggregatedDataId)) {
            aggregatedMap.set(aggregatedDataId, {
              topLevelFunctionCall: topLevelFunctionCall,
              totalTime: 0,
              bottomUpData: new Set<string>(),
            })
          }
          const aggregatedData = aggregatedMap.get(aggregatedDataId);
          if (aggregatedData) {
            aggregatedData.totalTime += (e.dur ?? 0);
            aggregatedData.bottomUpData.add(bottomUpDataId);
          }
        }
      }
    });
  }

  let topTimeConsumingDataId = '';
  let maxTime = 0;
  aggregatedMap.forEach((value, key) => {
    if (value.totalTime > maxTime) {
      maxTime = value.totalTime
      topTimeConsumingDataId = key;
    }
  });

  const aggregatedBottomUpData: Types.Events.BottomUpCallStack[] = [];
  const topFunctionCallData = aggregatedMap.get(topTimeConsumingDataId)?.topLevelFunctionCall;
  const dataSet = aggregatedMap.get(topTimeConsumingDataId)?.bottomUpData;
  if (dataSet) {
    dataSet.forEach((value) => {
      const callStackData = bottomUpDataMap.get(value);
      if (callStackData) {
        aggregatedBottomUpData.push(callStackData);
      }
    })
  }

  return [topFunctionCallData, aggregatedBottomUpData];
}

export function generateInsight(
    traceParsedData: RequiredData<typeof deps>, context: InsightSetContext): ForcedReflowInsightResult {
  const warningsData = traceParsedData.Warnings;
  const entryToNodeMap = traceParsedData.Renderer.entryToNode;

  if (!warningsData) {
    throw new Error('no warnings data');
  }

  if (!entryToNodeMap) {
    throw new Error('no renderer data');
  }

  const [topLevelFunctionCallData, aggregatedBottomUpData] =
      aggregateForcedReflow(warningsData.perWarning, entryToNodeMap);
  return {
  topLevelFunctionCallData:
    topLevelFunctionCallData, aggregatedBottomUpData: aggregatedBottomUpData,
  }
}
