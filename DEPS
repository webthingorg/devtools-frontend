# Copyright 2019 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

vars = {
  'build_revision': 'f3d0ca5f46b7b190dbbdc6be508ca11dd5c54302',
  'build_url': 'https://chromium.googlesource.com/chromium/src/build.git',

  'buildtools_revision': '74cfb57006f83cfe050817526db359d5c8a11628',
  'buildtools_url': 'https://chromium.googlesource.com/chromium/src/buildtools.git',

  'depot_tools_url': 'https://chromium.googlesource.com/chromium/tools/depot_tools',
  'depot_tools_revision': '72fbaf4d465e86222c92a21283a0d7406ca05323',

  'inspector_protocol_url': 'https://chromium.googlesource.com/deps/inspector_protocol',
  'inspector_protocol_revision': '51e2aa7bd607ed1472970251b1f1db917c907233',

  'clang_format_url': '/chromium/llvm-project/cfe/tools/clang-format.git',
  'clang_format_revision': '96636aa0e9f047f17447f2d45a094d0b59ed7917',

  'chromium_git': 'https://chromium.googlesource.com',

  # GN CIPD package version.
  'gn_version': 'git_revision:152c5144ceed9592c20f0c8fd55769646077569b',

  # Also, if you change these, update buildtools/DEPS too. Also update the
  # libc++ svn_revision in //buildtools/deps_revisions.gni.
  'clang_format_revision': '96636aa0e9f047f17447f2d45a094d0b59ed7917',

  # Chromium build number for unit tests. It should be regularly updated to
  # the content of https://commondatastorage.googleapis.com/chromium-browser-snapshots/Linux_x64/LAST_CHANGE
  'chromium_build': '691584',
}

# Only these hosts are allowed for dependencies in this DEPS file.
# If you need to add a new host, contact chrome infrastracture team.
allowed_hosts = [
  'chromium.googlesource.com',
]

deps = {
  'buildtools':
    Var('buildtools_url') + '@' + Var('buildtools_revision'),

  'buildtools/clang_format/script':
    Var('chromium_git') + Var('clang_format_url') + '@' +
    Var('clang_format_revision'),

  'buildtools/linux64': {
    'packages': [
      {
        'package': 'gn/gn/linux-amd64',
        'version': Var('gn_version'),
      }
    ],
    'dep_type': 'cipd',
    'condition': 'host_os == "linux"',
  },
  'buildtools/mac': {
    'packages': [
      {
        'package': 'gn/gn/mac-amd64',
        'version': Var('gn_version'),
      }
    ],
    'dep_type': 'cipd',
    'condition': 'host_os == "mac"',
  },
  'buildtools/win': {
    'packages': [
      {
        'package': 'gn/gn/windows-amd64',
        'version': Var('gn_version'),
      }
    ],
    'dep_type': 'cipd',
    'condition': 'host_os == "win"',
  },

  'devtools-frontend/build':
    Var('build_url') + '@' + Var('build_revision'),

  'devtools-frontend/third_party/depot_tools':
    Var('depot_tools_url') + '@' + Var('depot_tools_revision'),

  'devtools-frontend/third_party/inspector_protocol':
    Var('inspector_protocol_url') + '@' + Var('inspector_protocol_revision'),

}

hooks = [
  # Pull down Node binaries for WebUI toolchain.
  {
    'name': 'node_linux64',
    'pattern': '.',
    'condition': 'host_os == "linux"',
    'action': [ 'python',
                'devtools-frontend/third_party/depot_tools/download_from_google_storage.py',
                '--no_resume',
                '--extract',
                '--no_auth',
                '--bucket', 'chromium-nodejs/10.15.3',
                '-s', 'devtools-frontend/third_party/node/linux/node-linux-x64.tar.gz.sha1',
    ],
  },
  {
    'name': 'node_mac',
    'pattern': '.',
    'condition': 'host_os == "mac"',
    'action': [ 'python',
                'devtools-frontend/third_party/depot_tools/download_from_google_storage.py',
                '--no_resume',
                '--extract',
                '--no_auth',
                '--bucket', 'chromium-nodejs/10.15.3',
                '-s', 'devtools-frontend/third_party/node/mac/node-darwin-x64.tar.gz.sha1',
    ],
  },
  {
    'name': 'node_win',
    'pattern': '.',
    'condition': 'host_os == "win"',
    'action': [ 'python',
                'devtools-frontend/third_party/depot_tools/download_from_google_storage.py',
                '--no_resume',
                '--no_auth',
                '--bucket', 'chromium-nodejs/10.15.3',
                '-s', 'devtools-frontend/third_party/node/win/node.exe.sha1',
    ],
  },

  {
    # Ensure that the DEPS'd "depot_tools" has its self-update capability
    # disabled.
    'name': 'disable_depot_tools_selfupdate',
    'pattern': '.',
    'action': [
        'python',
        'devtools-frontend/third_party/depot_tools/update_depot_tools_toggle.py',
        '--disable',
    ],
  },

  # Pull clang-format binaries using checked-in hashes.
  {
    'name': 'clang_format_win',
    'pattern': '.',
    'condition': 'host_os == "win"',
    'action': [ 'python',
                'devtools-frontend/third_party/depot_tools/download_from_google_storage.py',
                '--no_resume',
                '--no_auth',
                '--bucket', 'chromium-clang-format',
                '-s', 'buildtools/win/clang-format.exe.sha1',
    ],
  },
  {
    'name': 'clang_format_mac',
    'pattern': '.',
    'condition': 'host_os == "mac"',
    'action': [ 'python',
                'devtools-frontend/third_party/depot_tools/download_from_google_storage.py',
                '--no_resume',
                '--no_auth',
                '--bucket', 'chromium-clang-format',
                '-s', 'buildtools/mac/clang-format.sha1',
    ],
  },
  {
    'name': 'clang_format_linux',
    'pattern': '.',
    'condition': 'host_os == "linux"',
    'action': [ 'python',
                'devtools-frontend/third_party/depot_tools/download_from_google_storage.py',
                '--no_resume',
                '--no_auth',
                '--bucket', 'chromium-clang-format',
                '-s', 'buildtools/linux64/clang-format.sha1',
    ],
  },

  # Pull chromium from common storage
  {
    'name': 'chromium_linux',
    'pattern': '.',
    'condition': 'host_os == "linux"',
    'action': [ 'python',
                'devtools-frontend/scripts/download_chromium.py',
                'https://commondatastorage.googleapis.com/chromium-browser-snapshots/Linux_x64/' + Var('chromium_build') + '/chrome-linux.zip',
                'devtools-frontend/third_party/chrome',
                'chrome-linux/chrome',
                Var('chromium_build'),
    ],
  },
]
