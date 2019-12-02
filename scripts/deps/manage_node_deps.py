# Copyright 2019 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Helper to manage DEPS.
"""

import os
import os.path as path
import json
import shutil
import subprocess
import sys

scripts_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(scripts_path)

import devtools_paths

# List all DEPS here.
DEPS = {
    "@types/chai": "4.2.0",
    "@types/mocha": "5.2.7",
    "chai": "4.2.0",
    "escodegen": "1.12.0",
    "eslint": "6.0.1",
    "esprima": "git+https://git@github.com/ChromeDevTools/esprima.git#4d0f0e18bd8d3731e5f931bf573af3394cbf7cbe",
    "handlebars": "4.3.1",
    "karma": "4.2.0",
    "karma-chai": "0.1.0",
    "karma-chrome-launcher": "3.1.0",
    "karma-coverage-istanbul-instrumenter": "1.0.1",
    "karma-coverage-istanbul-reporter": "2.1.0",
    "karma-mocha": "1.3.0",
    "karma-typescript": "4.1.1",
    "mocha": "6.2.0",
    "puppeteer": "2.0.0",
    "rollup": "1.23.1",
    "typescript": "3.5.3",
    "yargs": "15.0.2"
}


def popen(arguments, cwd=None):
    return subprocess.Popen(arguments, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)


def strip_private_fields():
    # npm adds private fields which need to be stripped.
    pattern = path.join(devtools_paths.node_modules_path(), 'package.json')
    packages = []
    for root, dirnames, filenames in os.walk(devtools_paths.node_modules_path()):
        for filename in filter(lambda f: f == 'package.json', filenames):
            packages.append(path.join(root, filename))

    for pkg in packages:
        with open(pkg, 'r+') as pkg_file:
            prop_removal_count = 0
            try:
                pkg_data = json.load(pkg_file)

                # Remove anything that begins with an underscore, as these are
                # the private fields in a package.json
                for key in pkg_data.keys():
                    if key.find(u'_') == 0:
                        pkg_data.pop(key)
                        prop_removal_count = prop_removal_count + 1

                pkg_file.truncate(0)
                pkg_file.seek(0)
                json.dump(pkg_data, pkg_file, indent=2, sort_keys=True)
                print("(%s): %s" % (prop_removal_count, pkg))
            except:
                print('Unable to fix: %s' % pkg)
                return True

    return False


def install_missing_deps():
    with open(devtools_paths.package_lock_json_path(), 'r+') as pkg_lock_file:
        try:
            pkg_lock_data = json.load(pkg_lock_file)
            existing_deps = pkg_lock_data[u'dependencies']
            new_deps = []

            # Find any new DEPS and add them in.
            for dep, version in DEPS.items():
                if not (existing_deps[dep] and existing_deps[dep]['version'] == version):
                    new_deps.append("%s@%s" % (dep, version))

            # Now install.
            if len(new_deps) > 0:
                exec_command = ['npm', 'install', '--save-dev']
                exec_command.extend(new_deps)

                npm_proc_result = subprocess.check_call(exec_command, cwd=devtools_paths.root_path())
                if npm_proc_result != 0:
                    return True

        except Exception as exception:
            print('Unable to fix: %s' % exception)
            return True
    return False


def append_package_json_entries():
    with open(devtools_paths.package_json_path(), 'r+') as pkg_file:
        try:
            pkg_data = json.load(pkg_file)

            # Replace the dev deps.
            pkg_data[u'devDependencies'] = DEPS

            pkg_file.truncate(0)
            pkg_file.seek(0)
            json.dump(pkg_data, pkg_file, indent=2, sort_keys=True)

        except:
            print('Unable to fix: %s' % sys.exc_info()[0])
            return True
    return False


def remove_package_json_entries():
    with open(devtools_paths.package_json_path(), 'r+') as pkg_file:
        try:
            pkg_data = json.load(pkg_file)

            # Remove the dependencies and devDependencies from the root package.json
            # so that they can't be used to overwrite the node_modules managed by this file.
            for key in pkg_data.keys():
                if key.find(u'dependencies') == 0 or key.find(u'devDependencies') == 0:
                    pkg_data.pop(key)

            pkg_file.truncate(0)
            pkg_file.seek(0)
            json.dump(pkg_data, pkg_file, indent=2, sort_keys=True)
        except:
            print('Unable to fix: %s' % pkg)
            return True
    return False


def install_deps():
    errors_found = append_package_json_entries()
    if errors_found:
        return True

    errors_found = install_missing_deps()
    if errors_found:
        return True

    # Run the CI version of npm, which prevents updates to the versions of modules.
    exec_command = ['npm', 'ci']

    errors_found = False
    npm_proc_result = subprocess.check_call(exec_command, cwd=devtools_paths.root_path())
    if npm_proc_result != 0:
        errors_found = True

    # If npm fails, bail here, otherwise attempt to strip private fields.
    if errors_found:
        return True

    errors_found = strip_private_fields()
    if errors_found:
        return True

    errors_found = remove_package_json_entries()
    return errors_found


npm_errors_found = install_deps()

if npm_errors_found:
    print('npm installation failed')
else:
    print('npm installation successful')
