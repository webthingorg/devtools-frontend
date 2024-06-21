// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Lantern from '../types/lantern.js';

import {NetworkAnalyzer} from './NetworkAnalyzer.js';
import {TcpConnection} from './TcpConnection.js';

const DEFAULT_SERVER_RESPONSE_TIME = 30;
const TLS_SCHEMES = ['https', 'wss'];

// Each origin can have 6 simulatenous connections open
// https://cs.chromium.org/chromium/src/net/socket/client_socket_pool_manager.cc?type=cs&q="int+g_max_sockets_per_group"
const CONNECTIONS_PER_ORIGIN = 6;

export class ConnectionPool {
  _options: Required<Lantern.Simulation.Options>;
  _records: Lantern.NetworkRequest[];
  _connectionsByOrigin: Map<string, TcpConnection[]>;
  _connectionsByRequest: Map<Lantern.NetworkRequest, TcpConnection>;
  _connectionsInUse: Set<TcpConnection>;
  _connectionReusedByRequestId: Map<string, boolean>;

  constructor(records: Lantern.NetworkRequest[], options: Required<Lantern.Simulation.Options>) {
    this._options = options;

    this._records = records;
    this._connectionsByOrigin = new Map();
    this._connectionsByRequest = new Map();
    this._connectionsInUse = new Set();
    this._connectionReusedByRequestId = NetworkAnalyzer.estimateIfConnectionWasReused(records, {
      forceCoarseEstimates: true,
    });

    this._initializeConnections();
  }

  connectionsInUse(): TcpConnection[] {
    return Array.from(this._connectionsInUse);
  }

  _initializeConnections(): void {
    const connectionReused = this._connectionReusedByRequestId;
    const additionalRttByOrigin = this._options.additionalRttByOrigin;
    const serverResponseTimeByOrigin = this._options.serverResponseTimeByOrigin;

    const recordsByOrigin = NetworkAnalyzer.groupByOrigin(this._records);
    for (const [origin, requests] of recordsByOrigin.entries()) {
      const connections = [];
      const additionalRtt = additionalRttByOrigin.get(origin) || 0;
      const responseTime = serverResponseTimeByOrigin.get(origin) || DEFAULT_SERVER_RESPONSE_TIME;

      for (const request of requests) {
        if (connectionReused.get(request.requestId)) {
          continue;
        }

        const isTLS = TLS_SCHEMES.includes(request.parsedURL.scheme);
        const isH2 = request.protocol === 'h2';
        const connection = new TcpConnection(
            this._options.rtt + additionalRtt,
            this._options.throughput,
            responseTime,
            isTLS,
            isH2,
        );

        connections.push(connection);
      }

      if (!connections.length) {
        throw new Error(`Could not find a connection for origin: ${origin}`);
      }

      // Make sure each origin has minimum number of connections available for max throughput.
      // But only if it's not over H2 which maximizes throughput already.
      const minConnections = connections[0].isH2() ? 1 : CONNECTIONS_PER_ORIGIN;
      while (connections.length < minConnections) {
        connections.push(connections[0].clone());
      }

      this._connectionsByOrigin.set(origin, connections);
    }
  }

  _findAvailableConnectionWithLargestCongestionWindow(connections: TcpConnection[]): TcpConnection|null {
    let maxConnection: TcpConnection|null = null;
    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i];

      // Connections that are in use are never available.
      if (this._connectionsInUse.has(connection)) {
        continue;
      }

      // This connection is a match and is available! Update our max if it has a larger congestionWindow
      const currentMax = (maxConnection?.congestionWindow) || -Infinity;
      if (connection.congestionWindow > currentMax) {
        maxConnection = connection;
      }
    }

    return maxConnection;
  }

  /**
   * This method finds an available connection to the origin specified by the network request or null
   * if no connection was available. If returned, connection will not be available for other network
   * records until release is called.
   */
  acquire(request: Lantern.NetworkRequest): TcpConnection|null {
    if (this._connectionsByRequest.has(request)) {
      throw new Error('Record already has a connection');
    }

    const origin = request.parsedURL.securityOrigin;
    const connections = this._connectionsByOrigin.get(origin) || [];
    const connectionToUse = this._findAvailableConnectionWithLargestCongestionWindow(connections);

    if (!connectionToUse) {
      return null;
    }

    this._connectionsInUse.add(connectionToUse);
    this._connectionsByRequest.set(request, connectionToUse);
    return connectionToUse;
  }

  /**
   * Return the connection currently being used to fetch a request. If no connection
   * currently being used for this request, an error will be thrown.
   */
  acquireActiveConnectionFromRequest(request: Lantern.NetworkRequest): TcpConnection {
    const activeConnection = this._connectionsByRequest.get(request);
    if (!activeConnection) {
      throw new Error('Could not find an active connection for request');
    }

    return activeConnection;
  }

  release(request: Lantern.NetworkRequest): void {
    const connection = this._connectionsByRequest.get(request);
    this._connectionsByRequest.delete(request);
    if (connection) {
      this._connectionsInUse.delete(connection);
    }
  }
}
