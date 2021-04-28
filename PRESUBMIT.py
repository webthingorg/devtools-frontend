# Copyright (C) 2014 Google Inc. All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are
# met:
#
#     * Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above
# copyright notice, this list of conditions and the following disclaimer
# in the documentation and/or other materials provided with the
# distribution.
#     * Neither the name of Google Inc. nor the names of its
# contributors may be used to endorse or promote products derived from
# this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
# LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
# DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
# THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
"""
DevTools presubmit script

See http://dev.chromium.org/developers/how-tos/depottools/presubmit-scripts
for more details about the presubmit API built into gcl.
"""

import sys
import six
import time

AUTOROLL_ACCOUNT = "devtools-ci-autoroll-builder@chops-service-accounts.iam.gserviceaccount.com"


def _ExecuteSubProcess(input_api, output_api, script_path, args, results):
    if isinstance(script_path, six.string_types):
        script_path = [input_api.python_executable, script_path]

    start_time = time.time()
    process = input_api.subprocess.Popen(script_path + args,
                                         stdout=input_api.subprocess.PIPE,
                                         stderr=input_api.subprocess.STDOUT)
    out, _ = process.communicate()
    end_time = time.time()

    time_difference = end_time - start_time
    time_info = "Script execution time was %.1fs seconds\n" % (time_difference)
    if process.returncode != 0:
        results.append(output_api.PresubmitError(time_info + out))
    else:
        results.append(output_api.PresubmitNotifyResult(time_info + out))
    return results


def _CheckChangesAreExclusiveToDirectory(input_api, output_api):
    if input_api.change.DISABLE_THIRD_PARTY_CHECK != None:
        return []
    results = [output_api.PresubmitNotifyResult('Directory Exclusivity Check:')]

    def IsParentDir(file, dir):
        while file != '':
            if file == dir:
                return True
            file = input_api.os_path.dirname(file)
        return False

    def FileIsInDir(file, dirs):
        for dir in dirs:
            if IsParentDir(file, dir):
                return True

    EXCLUSIVE_CHANGE_DIRECTORIES = [
        [
            'third_party', 'v8',
            input_api.os_path.join('front_end', 'generated')
        ],
        [
            'node_modules',
            'package.json',
            'package-lock.json',
            input_api.os_path.join('scripts', 'deps', 'manage_node_deps.py'),
        ],
        ['OWNERS', input_api.os_path.join('config', 'owner')],
    ]

    affected_files = input_api.LocalPaths()
    num_affected = len(affected_files)
    for dirs in EXCLUSIVE_CHANGE_DIRECTORIES:
        dir_list = ', '.join(dirs)
        affected_in_dir = filter(lambda f: FileIsInDir(f, dirs), affected_files)
        num_in_dir = len(affected_in_dir)
        if num_in_dir == 0:
            continue
        # Addition of new third_party folders must have a new entry in `.gitignore`
        if '.gitignore' in affected_files:
            num_in_dir = num_in_dir + 1
        if num_in_dir < num_affected:
            unexpected_files = [
                file for file in affected_files if file not in affected_in_dir
            ]
            results.append(
                output_api.PresubmitError(
                    ('CLs that affect files in "%s" should be limited to these files/directories.'
                     % dir_list) +
                    ('\nUnexpected files: %s.' % unexpected_files) +
                    '\nYou can disable this check by adding DISABLE_THIRD_PARTY_CHECK=<reason> to your commit message'
                ))
            break

    return results


def _CheckBugAssociation(input_api, output_api, is_committing):
    results = [output_api.PresubmitNotifyResult('Bug Association Check:')]
    bugs = input_api.change.BugsFromDescription()
    message = (
        "Each CL should be associated with a bug, use \'Bug:\' or \'Fixed:\' lines in\n"
        "the footer of the commit description. If you explicitly don\'t want to\n"
        "set a bug, use \'Bug: none\' in the footer of the commit description.\n\n"
        "Note: The footer of the commit description is the last block of lines in\n"
        "the commit description that doesn't contain empty lines. This means that\n"
        "any \'Bug:\' or \'Fixed:\' lines that are eventually followed by an empty\n"
        "line are not detected by this presubmit check.")

    if not bugs:
        if is_committing:
            results.append(output_api.PresubmitError(message))
        else:
            results.append(output_api.PresubmitNotifyResult(message))

    for bug in bugs:
        results.append(output_api.PresubmitNotifyResult(('%s') % bug))

    return results


def _CheckBuildGN(input_api, output_api):
    results = [output_api.PresubmitNotifyResult('Running BUILD.GN check:')]
    script_path = input_api.os_path.join(input_api.PresubmitLocalPath(),
                                         'scripts', 'check_gn.js')
    results.extend(_checkWithNodeScript(input_api, output_api, script_path))
    return results


def _CheckExperimentTelemetry(input_api, output_api):
    experiment_telemetry_files = [
        input_api.os_path.join(input_api.PresubmitLocalPath(), 'front_end',
                               'main', 'MainImpl.ts'),
        input_api.os_path.join(input_api.PresubmitLocalPath(), 'front_end',
                               'core', 'host', 'UserMetrics.ts')
    ]
    affected_main_files = _getAffectedFiles(input_api,
                                            experiment_telemetry_files, [],
                                            ['.js'])
    if len(affected_main_files) == 0:
        return [
            output_api.PresubmitNotifyResult(
                'No affected files for telemetry check')
        ]

    results = [
        output_api.PresubmitNotifyResult('Running Experiment Telemetry check:')
    ]
    script_path = input_api.os_path.join(input_api.PresubmitLocalPath(),
                                         'scripts', 'check_experiments.js')
    results.extend(_checkWithNodeScript(input_api, output_api, script_path))
    return results


def _CheckJSON(input_api, output_api):
    results = [output_api.PresubmitNotifyResult('Running JSON Validator:')]
    script_path = input_api.os_path.join(input_api.PresubmitLocalPath(),
                                         'scripts', 'json_validator',
                                         'validate_module_json.js')
    results.extend(_checkWithNodeScript(input_api, output_api, script_path))
    return results


def _CheckFormat(input_api, output_api):
    node_modules_affected_files = _getAffectedFiles(input_api, [
        input_api.os_path.join(input_api.PresubmitLocalPath(), 'node_modules')
    ], [], [])

    # TODO(crbug.com/1068198): Remove once `git cl format --js` can handle large CLs.
    if (len(node_modules_affected_files) > 0):
        return [output_api.PresubmitNotifyResult('Skipping Format Checks because `node_modules` files are affected.')]

    results = [output_api.PresubmitNotifyResult('Running Format Checks:')]

    return _ExecuteSubProcess(input_api, output_api, ['git', 'cl', 'format', '--js'], [], results)

def _CheckDevToolsStyleJS(input_api, output_api):
    results = [output_api.PresubmitNotifyResult('JS style check:')]
    lint_path = input_api.os_path.join(input_api.PresubmitLocalPath(),
                                       'scripts', 'test',
                                       'run_lint_check_js.js')

    front_end_directory = input_api.os_path.join(
        input_api.PresubmitLocalPath(), 'front_end')
    component_docs_directory = input_api.os_path.join(front_end_directory,
                                                      'ui', 'components',
                                                      'docs')
    inspector_overlay_directory = input_api.os_path.join(
        input_api.PresubmitLocalPath(), 'inspector_overlay')
    test_directory = input_api.os_path.join(input_api.PresubmitLocalPath(),
                                            'test')
    scripts_directory = input_api.os_path.join(input_api.PresubmitLocalPath(),
                                               'scripts')

    default_linted_directories = [
        front_end_directory, test_directory, scripts_directory,
        inspector_overlay_directory
    ]

    eslint_related_files = [
        input_api.os_path.join(input_api.PresubmitLocalPath(), 'node_modules',
                               'eslint'),
        input_api.os_path.join(input_api.PresubmitLocalPath(), 'node_modules',
                               '@typescript-eslint'),
        input_api.os_path.join(input_api.PresubmitLocalPath(), '.eslintrc.js'),
        input_api.os_path.join(input_api.PresubmitLocalPath(),
                               '.eslintignore'),
        input_api.os_path.join(front_end_directory, '.eslintrc.js'),
        input_api.os_path.join(component_docs_directory, '.eslintrc.js'),
        input_api.os_path.join(test_directory, '.eslintrc.js'),
        input_api.os_path.join(scripts_directory, 'test',
                               'run_lint_check_js.py'),
        input_api.os_path.join(scripts_directory, 'test',
                               'run_lint_check_js.js'),
        input_api.os_path.join(scripts_directory, '.eslintrc.js'),
        input_api.os_path.join(scripts_directory, 'eslint_rules'),
    ]

    lint_config_files = _getAffectedFiles(input_api, eslint_related_files, [],
                                          ['.js', '.py', '.eslintignore'])

    should_bail_out, files_to_lint = _getFilesToLint(
        input_api, output_api, lint_config_files, default_linted_directories,
        ['.js', '.ts'], results)
    if should_bail_out:
        return results

    # If there are more than 50 files to check, don't bother and check
    # everything, so as to not run into command line length limits on Windows.
    if len(files_to_lint) > 50:
        files_to_lint = []

    results.extend(
        _checkWithNodeScript(input_api, output_api, lint_path, files_to_lint))
    return results


def _CheckDevToolsStyleCSS(input_api, output_api):
    results = [output_api.PresubmitNotifyResult('CSS style check:')]
    lint_path = input_api.os_path.join(input_api.PresubmitLocalPath(),
                                       'scripts', 'test',
                                       'run_lint_check_css.js')

    front_end_directory = input_api.os_path.join(
        input_api.PresubmitLocalPath(), 'front_end')
    inspector_overlay_directory = input_api.os_path.join(
        input_api.PresubmitLocalPath(), 'inspector_overlay')
    default_linted_directories = [
        front_end_directory, inspector_overlay_directory
    ]

    scripts_directory = input_api.os_path.join(input_api.PresubmitLocalPath(),
                                               'scripts')

    stylelint_related_files = [
        input_api.os_path.join(input_api.PresubmitLocalPath(), 'node_modules',
                               'stylelint'),
        input_api.os_path.join(input_api.PresubmitLocalPath(),
                               '.stylelintrc.json'),
        input_api.os_path.join(input_api.PresubmitLocalPath(),
                               '.stylelintignore'),
        input_api.os_path.join(scripts_directory, 'test',
                               'run_lint_check_css.js'),
    ]

    lint_config_files = _getAffectedFiles(input_api, stylelint_related_files,
                                          [], [])

    css_should_bail_out, css_files_to_lint = _getFilesToLint(
        input_api, output_api, lint_config_files, default_linted_directories,
        ['.css'], results)

    ts_should_bail_out, ts_files_to_lint = _getFilesToLint(
        input_api, output_api, lint_config_files, default_linted_directories,
        ['.ts'], results)

    # If there are more than 50 files to check, don't bother and check
    # everything, so as to not run into command line length limits on Windows.
    if not css_should_bail_out:
        if len(css_files_to_lint) < 50:
            script_args = ["--files"] + css_files_to_lint
        else:
            script_args = []  # The defaults check all CSS files.
        results.extend(
            _checkWithNodeScript(input_api, output_api, lint_path,
                                 script_args))

    if not ts_should_bail_out:
        script_args = ["--syntax", "html"]
        if len(ts_files_to_lint) < 50:
            script_args += ["--files"] + ts_files_to_lint
        else:
            script_args += ["--glob", "front_end/**/*.ts"]
        results.extend(
            _checkWithNodeScript(input_api, output_api, lint_path,
                                 script_args))

    return results


def _CheckDarkModeStyleSheetsUpToDate(input_api, output_api):
    devtools_root = input_api.PresubmitLocalPath()
    devtools_front_end = input_api.os_path.join(devtools_root, 'front_end')
    dark_mode_scripts_folder = input_api.os_path.join(devtools_root, 'scripts',
                                                      'dark_mode')
    dark_mode_script_files = _getAffectedFiles(input_api,
                                               dark_mode_scripts_folder, [],
                                               ['.js'])
    script_arguments = []
    if len(dark_mode_script_files) > 10:
        # If the scripts have changed, we should check all darkmode files as they may need to be updated.
        script_arguments += ['--check-all-files']
    else:
        affected_css_files = _getAffectedFiles(input_api, [devtools_front_end],
                                               [], ['.css'])
        script_arguments += affected_css_files

    results = [output_api.PresubmitNotifyResult('Dark Mode CSS check:')]
    script_path = input_api.os_path.join(input_api.PresubmitLocalPath(),
                                         'scripts', 'dark_mode',
                                         'check_darkmode_css_up_to_date.js')
    results.extend(
        _checkWithNodeScript(input_api, output_api, script_path,
                             script_arguments))
    return results


def _CheckOptimizeSVGHashes(input_api, output_api):
    if not input_api.platform.startswith('linux'):
        return [output_api.PresubmitNotifyResult('Skipping SVG hash check')]

    results = [
        output_api.PresubmitNotifyResult('Running SVG optimization check:')
    ]

    original_sys_path = sys.path
    try:
        sys.path = sys.path + [input_api.os_path.join(input_api.PresubmitLocalPath(), 'scripts', 'build')]
        import devtools_file_hashes
    finally:
        sys.path = original_sys_path

    absolute_local_paths = [af.AbsoluteLocalPath() for af in input_api.AffectedFiles(include_deletes=False)]
    images_src_path = input_api.os_path.join('devtools', 'front_end', 'Images', 'src')
    image_source_file_paths = [path for path in absolute_local_paths if images_src_path in path and path.endswith('.svg')]
    image_sources_path = input_api.os_path.join(input_api.PresubmitLocalPath(), 'front_end', 'Images', 'src')
    hashes_file_name = 'optimize_svg.hashes'
    hashes_file_path = input_api.os_path.join(image_sources_path, hashes_file_name)
    invalid_hash_file_paths = devtools_file_hashes.files_with_invalid_hashes(hashes_file_path, image_source_file_paths)
    if len(invalid_hash_file_paths) == 1:
        return results
    invalid_hash_file_names = [input_api.os_path.basename(file_path) for file_path in invalid_hash_file_paths]
    file_paths_str = ', '.join(invalid_hash_file_names)
    error_message = 'The following SVG files should be optimized using optimize_svg_images script before uploading: \n  - %s' % file_paths_str
    results.append(output_api.PresubmitError(error_message))
    return results



def _CheckGeneratedFiles(input_api, output_api):
    v8_directory_path = input_api.os_path.join(input_api.PresubmitLocalPath(), 'v8')
    blink_directory_path = input_api.os_path.join(input_api.PresubmitLocalPath(), 'third_party', 'blink')
    protocol_location = input_api.os_path.join(blink_directory_path, 'public', 'devtools_protocol')
    scripts_build_path = input_api.os_path.join(input_api.PresubmitLocalPath(), 'scripts', 'build')
    scripts_generated_output_path = input_api.os_path.join(input_api.PresubmitLocalPath(), 'front_end', 'generated')

    generated_aria_path = input_api.os_path.join(scripts_build_path, 'generate_aria.py')
    generated_supported_css_path = input_api.os_path.join(scripts_build_path, 'generate_supported_css.py')
    generated_protocol_path = input_api.os_path.join(scripts_build_path, 'code_generator_frontend.py')
    concatenate_protocols_path = input_api.os_path.join(input_api.PresubmitLocalPath(), 'third_party', 'inspector_protocol',
                                                        'concatenate_protocols.py')

    affected_files = _getAffectedFiles(input_api, [
        v8_directory_path,
        blink_directory_path,
        input_api.os_path.join(input_api.PresubmitLocalPath(), 'third_party', 'pyjson5'),
        generated_aria_path,
        generated_supported_css_path,
        concatenate_protocols_path,
        generated_protocol_path,
        scripts_generated_output_path,
    ], [], ['.pdl', '.json5', '.py', '.js'])

    if len(affected_files) == 0:
        return [
            output_api.PresubmitNotifyResult(
                'No affected files for generated files check')
        ]

    results = [output_api.PresubmitNotifyResult('Running Generated Files Check:')]
    generate_protocol_resources_path = input_api.os_path.join(input_api.PresubmitLocalPath(), 'scripts', 'deps',
                                                              'generate_protocol_resources.py')

    return _ExecuteSubProcess(input_api, output_api, generate_protocol_resources_path, [], results)


def _CollectStrings(input_api, output_api):
    devtools_root = input_api.PresubmitLocalPath()
    devtools_front_end = input_api.os_path.join(devtools_root, 'front_end')
    affected_front_end_files = _getAffectedFiles(input_api,
                                                 [devtools_front_end], [],
                                                 ['.js', '.ts'])
    if len(affected_front_end_files) == 0:
        return [
            output_api.PresubmitNotifyResult(
                'No affected files to run collect-strings')
        ]

    results = [
        output_api.PresubmitNotifyResult('Collecting strings from front_end:')
    ]
    script_path = input_api.os_path.join(devtools_root, 'third_party', 'i18n',
                                         'collect-strings.js')
    results.extend(_checkWithNodeScript(input_api, output_api, script_path))
    results.append(
        output_api.PresubmitNotifyResult(
            'Please commit en-US.json/en-XL.json if changes are generated.'))
    return results


def _CheckNoUncheckedFiles(input_api, output_api):
    results = []
    process = input_api.subprocess.Popen(['git', 'diff', '--exit-code'],
                                         stdout=input_api.subprocess.PIPE,
                                         stderr=input_api.subprocess.STDOUT)
    out, _ = process.communicate()
    if process.returncode != 0:
        files_changed_process = input_api.subprocess.Popen(
            ['git', 'diff', '--name-only'],
            stdout=input_api.subprocess.PIPE,
            stderr=input_api.subprocess.STDOUT)
        files_changed, _ = files_changed_process.communicate()

        return [
            output_api.PresubmitError('You have changed files that need to be committed:'),
            output_api.PresubmitError(files_changed)
        ]
    return []

def _CheckForTooLargeFiles(input_api, output_api):
    """Avoid large files, especially binary files, in the repository since
  git doesn't scale well for those. They will be in everyone's repo
  clones forever, forever making Chromium slower to clone and work
  with."""
    # Uploading files to cloud storage is not trivial so we don't want
    # to set the limit too low, but the upper limit for "normal" large
    # files seems to be 1-2 MB, with a handful around 5-8 MB, so
    # anything over 20 MB is exceptional.
    TOO_LARGE_FILE_SIZE_LIMIT = 20 * 1024 * 1024  # 10 MB
    too_large_files = []
    for f in input_api.AffectedFiles():
        # Check both added and modified files (but not deleted files).
        if f.Action() in ('A', 'M'):
            size = input_api.os_path.getsize(f.AbsoluteLocalPath())
            if size > TOO_LARGE_FILE_SIZE_LIMIT:
                too_large_files.append("%s: %d bytes" % (f.LocalPath(), size))
    if too_large_files:
        message = (
          'Do not commit large files to git since git scales badly for those.\n' +
          'Instead put the large files in cloud storage and use DEPS to\n' +
          'fetch them.\n' + '\n'.join(too_large_files)
        )
        return [output_api.PresubmitError(
            'Too large files found in commit', long_text=message + '\n')]
    else:
        return []


def _RunCannedChecks(input_api, output_api):
    results = []
    results.extend(
        input_api.canned_checks.CheckOwnersFormat(input_api, output_api))
    results.extend(input_api.canned_checks.CheckOwners(input_api, output_api))
    results.extend(
        input_api.canned_checks.CheckChangeHasNoCrAndHasOnlyOneEol(
            input_api, output_api))
    results.extend(
        input_api.canned_checks.CheckChangeHasNoStrayWhitespace(
            input_api, output_api))
    results.extend(
        input_api.canned_checks.CheckGenderNeutral(input_api, output_api))
    return results


def _CommonChecks(input_api, output_api):
    """Checks common to both upload and commit."""
    results = []
    results.extend(
        input_api.canned_checks.CheckAuthorizedAuthor(
            input_api, output_api, bot_allowlist=[AUTOROLL_ACCOUNT]))
    results.extend(_CheckBuildGN(input_api, output_api))
    results.extend(_CheckExperimentTelemetry(input_api, output_api))
    results.extend(_CheckGeneratedFiles(input_api, output_api))
    results.extend(_CheckJSON(input_api, output_api))
    results.extend(_CheckDevToolsStyleJS(input_api, output_api))
    results.extend(_CheckDevToolsStyleCSS(input_api, output_api))

    results.extend(_CheckDarkModeStyleSheetsUpToDate(input_api, output_api))
    results.extend(_CheckFormat(input_api, output_api))
    results.extend(_CheckOptimizeSVGHashes(input_api, output_api))
    results.extend(_CheckChangesAreExclusiveToDirectory(input_api, output_api))
    results.extend(_CheckI18nWasBundled(input_api, output_api))
    # Run the canned checks from `depot_tools` after the custom DevTools checks.
    # The canned checks for example check that lines have line endings. The
    # DevTools presubmit checks automatically fix these issues. If we would run
    # the canned checks before the DevTools checks, they would erroneously conclude
    # that there are issues in the code. Since the canned checks are allowed to be
    # ignored, a confusing message is shown that asks if the failed presubmit can
    # be continued regardless. By fixing the issues before we reach the canned checks,
    # we don't show the message to suppress these errors, which would otherwise be
    # causing CQ to fail.
    results.extend(_RunCannedChecks(input_api, output_api))
    return results


def _SideEffectChecks(input_api, output_api):
    """Check side effects caused by other checks"""
    results = []
    results.extend(_CheckNoUncheckedFiles(input_api, output_api))
    results.extend(_CheckForTooLargeFiles(input_api, output_api))
    return results


def CheckChangeOnUpload(input_api, output_api):
    results = []
    results.extend(_CommonChecks(input_api, output_api))
    results.extend(_CollectStrings(input_api, output_api))
    # Run checks that rely on output from other DevTool checks
    results.extend(_SideEffectChecks(input_api, output_api))
    results.extend(_CheckBugAssociation(input_api, output_api, False))
    return results


def CheckChangeOnCommit(input_api, output_api):
    results = []
    results.extend(_CommonChecks(input_api, output_api))
    results.extend(_CollectStrings(input_api, output_api))
    # Run checks that rely on output from other DevTool checks
    results.extend(_SideEffectChecks(input_api, output_api))
    results.extend(input_api.canned_checks.CheckChangeHasDescription(input_api, output_api))
    results.extend(_CheckBugAssociation(input_api, output_api, True))
    return results


def _getAffectedFiles(input_api, parent_directories, excluded_actions, accepted_endings):  # pylint: disable=invalid-name
    """Return absolute file paths of affected files (not due to an excluded action)
       under a parent directory with an accepted file ending.
    """
    local_paths = [
        f.AbsoluteLocalPath() for f in input_api.AffectedFiles() if all(f.Action() != action for action in excluded_actions)
    ]
    affected_files = [
        file_name for file_name in local_paths if any(parent_directory in file_name for parent_directory in parent_directories) and
        (len(accepted_endings) is 0 or any(file_name.endswith(accepted_ending) for accepted_ending in accepted_endings))
    ]
    return affected_files


def _checkWithNodeScript(input_api, output_api, script_path, script_arguments=[]):  # pylint: disable=invalid-name
    original_sys_path = sys.path
    try:
        sys.path = sys.path + [input_api.os_path.join(input_api.PresubmitLocalPath(), 'scripts')]
        import devtools_paths
    finally:
        sys.path = original_sys_path

    return _ExecuteSubProcess(input_api, output_api, [devtools_paths.node_path(), script_path], script_arguments, [])


def _checkWithTypeScript(input_api,
                         output_api,
                         tsc_arguments,
                         script_path,
                         script_arguments=[]):  # pylint: disable=invalid-name
    original_sys_path = sys.path
    try:
        sys.path = sys.path + [
            input_api.os_path.join(input_api.PresubmitLocalPath(), 'scripts')
        ]
        import devtools_paths
    finally:
        sys.path = original_sys_path

    # First run tsc to compile the TS script that we then run in the _ExecuteSubProcess call
    tsc_compiler_process = input_api.subprocess.Popen(
        [
            devtools_paths.node_path(),
            devtools_paths.typescript_compiler_path()
        ] + tsc_arguments,
        stdout=input_api.subprocess.PIPE,
        stderr=input_api.subprocess.STDOUT)

    out, _ = tsc_compiler_process.communicate()
    if tsc_compiler_process.returncode != 0:
        return [
            output_api.PresubmitError('Error compiling briges regenerator:\n' +
                                      str(out))
        ]

    return _checkWithNodeScript(input_api, output_api, script_path,
                                script_arguments)


def _getFilesToLint(input_api, output_api, lint_config_files,
                    default_linted_directories, accepted_endings, results):
    run_full_check = False
    files_to_lint = []

    # We are changing the lint configuration; run the full check.
    if len(lint_config_files) is not 0:
        results.append(
            output_api.PresubmitNotifyResult('Running full lint check'))
        run_full_check = True
    else:
        # Only run the linter on files that are relevant, to save PRESUBMIT time.
        files_to_lint = _getAffectedFiles(input_api,
                                          default_linted_directories, ['D'],
                                          accepted_endings)

        # Exclude front_end/third_party files.
        files_to_lint = filter(lambda path: "third_party" not in path,
                               files_to_lint)

        if len(files_to_lint) is 0:
            results.append(
                output_api.PresubmitNotifyResult(
                    'No affected files for lint check'))

    should_bail_out = len(files_to_lint) is 0 and not run_full_check
    return should_bail_out, files_to_lint


def _CheckI18nWasBundled(input_api, output_api):
    affected_files = _getAffectedFiles(input_api, [
        input_api.os_path.join(input_api.PresubmitLocalPath(), 'front_end',
                               'third_party', 'i18n', 'lib')
    ], [], ['.js'])

    if len(affected_files) == 0:
        return [
            output_api.PresubmitNotifyResult(
                'No affected files for i18n bundle check')
        ]

    results = [output_api.PresubmitNotifyResult('Running buildi18nBundle.js:')]
    script_path = input_api.os_path.join(input_api.PresubmitLocalPath(),
                                         'scripts', 'localizationV2',
                                         'buildi18nBundle.js')
    results.extend(_checkWithNodeScript(input_api, output_api, script_path))
    return results
// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/* eslint-disable indent */
(function(window) {
  // DevToolsAPI ----------------------------------------------------------------
  /**
   * @unrestricted
   */
  const DevToolsAPIImpl = class {
    constructor() {
      /**
       * @type {number}
       */
      this._lastCallId = 0;
      /**
       * @type {!Object.<number, function(?Object)>}
       */
      this._callbacks = {};
      /**
       * @type {!Array.<!ExtensionDescriptor>}
       */
      this._pendingExtensionDescriptors = [];
      /**
       * @type {?function(!ExtensionDescriptor)}
       */
      this._addExtensionCallback = null;
    }
    /**
     * @param {number} id
     * @param {?Object} arg
     */
    embedderMessageAck(id, arg) {
      const callback = this._callbacks[id];
      delete this._callbacks[id];
      if (callback) {
        callback(arg);
      }
    }
    /**
     * @param {string} method
     * @param {!Array.<*>} args
     * @param {?function(?Object)} callback
     */
    sendMessageToEmbedder(method, args, callback) {
      const callId = ++this._lastCallId;
      if (callback) {
        this._callbacks[callId] = callback;
      }
      const message = {'id': callId, 'method': method};
      if (args.length) {
        message.params = args;
      }
      DevToolsHost.sendMessageToEmbedder(JSON.stringify(message));
    }
    /**
     * @param {string} method
     * @param {!Array<*>} args
     */
    _dispatchOnInspectorFrontendAPI(method, args) {
      const inspectorFrontendAPI = /** @type {!Object<string, function()>} */ (window['InspectorFrontendAPI']);
      inspectorFrontendAPI[method].apply(inspectorFrontendAPI, args);
    }
    // API methods below this line --------------------------------------------
    /**
     * @param {!Array.<!ExtensionDescriptor>} extensions
     */
    addExtensions(extensions) {
      // Support for legacy front-ends (<M41).
      if (window['WebInspector'] && window['WebInspector']['addExtensions']) {
        window['WebInspector']['addExtensions'](extensions);
      } else {
        // The addExtensions command is sent as the onload event happens for
        // DevTools front-end. We should buffer this command until the frontend
        // is ready for it.
        if (this._addExtensionCallback) {
          extensions.forEach(this._addExtensionCallback);
        } else {
          this._pendingExtensionDescriptors.push(...extensions);
        }
      }
    }
    /**
     * @param {string} url
     */
    appendedToURL(url) {
      this._dispatchOnInspectorFrontendAPI('appendedToURL', [url]);
    }
    /**
     * @param {string} url
     */
    canceledSaveURL(url) {
      this._dispatchOnInspectorFrontendAPI('canceledSaveURL', [url]);
    }
    contextMenuCleared() {
      this._dispatchOnInspectorFrontendAPI('contextMenuCleared', []);
    }
    /**
     * @param {string} id
     */
    contextMenuItemSelected(id) {
      this._dispatchOnInspectorFrontendAPI('contextMenuItemSelected', [id]);
    }
    /**
     * @param {number} count
     */
    deviceCountUpdated(count) {
      this._dispatchOnInspectorFrontendAPI('deviceCountUpdated', [count]);
    }
    /**
     * @param {!Adb.Config} config
     */
    devicesDiscoveryConfigChanged(config) {
      this._dispatchOnInspectorFrontendAPI('devicesDiscoveryConfigChanged', [config]);
    }
    /**
     * @param {!Adb.PortForwardingStatus} status
     */
    devicesPortForwardingStatusChanged(status) {
      this._dispatchOnInspectorFrontendAPI('devicesPortForwardingStatusChanged', [status]);
    }
    /**
     * @param {!Array.<!Adb.Device>} devices
     */
    devicesUpdated(devices) {
      this._dispatchOnInspectorFrontendAPI('devicesUpdated', [devices]);
    }
    /**
     * @param {string} message
     */
    dispatchMessage(message) {
      this._dispatchOnInspectorFrontendAPI('dispatchMessage', [message]);
    }
    /**
     * @param {string} messageChunk
     * @param {number} messageSize
     */
    dispatchMessageChunk(messageChunk, messageSize) {
      this._dispatchOnInspectorFrontendAPI('dispatchMessageChunk', [messageChunk, messageSize]);
    }
    enterInspectElementMode() {
      this._dispatchOnInspectorFrontendAPI('enterInspectElementMode', []);
    }
    /**
     * @param {!{r: number, g: number, b: number, a: number}} color
     */
    eyeDropperPickedColor(color) {
      this._dispatchOnInspectorFrontendAPI('eyeDropperPickedColor', [color]);
    }
    /**
     * @param {!Array.<!{fileSystemName: string, rootURL: string, fileSystemPath: string}>} fileSystems
     */
    fileSystemsLoaded(fileSystems) {
      this._dispatchOnInspectorFrontendAPI('fileSystemsLoaded', [fileSystems]);
    }
    /**
     * @param {string} fileSystemPath
     */
    fileSystemRemoved(fileSystemPath) {
      this._dispatchOnInspectorFrontendAPI('fileSystemRemoved', [fileSystemPath]);
    }
    /**
     * @param {?string} error
     * @param {?{type: string, fileSystemName: string, rootURL: string, fileSystemPath: string}} fileSystem
     */
    fileSystemAdded(error, fileSystem) {
      this._dispatchOnInspectorFrontendAPI('fileSystemAdded', [error, fileSystem]);
    }
    /**
     * @param {!Array<string>} changedPaths
     * @param {!Array<string>} addedPaths
     * @param {!Array<string>} removedPaths
     */
    fileSystemFilesChangedAddedRemoved(changedPaths, addedPaths, removedPaths) {
      // Support for legacy front-ends (<M58)
      if (window['InspectorFrontendAPI'] && window['InspectorFrontendAPI']['fileSystemFilesChanged']) {
        this._dispatchOnInspectorFrontendAPI(
            'fileSystemFilesChanged', [changedPaths.concat(addedPaths).concat(removedPaths)]);
      } else {
        this._dispatchOnInspectorFrontendAPI(
            'fileSystemFilesChangedAddedRemoved', [changedPaths, addedPaths, removedPaths]);
      }
    }
    /**
     * @param {number} requestId
     * @param {string} fileSystemPath
     * @param {number} totalWork
     */
    indexingTotalWorkCalculated(requestId, fileSystemPath, totalWork) {
      this._dispatchOnInspectorFrontendAPI('indexingTotalWorkCalculated', [requestId, fileSystemPath, totalWork]);
    }
    /**
     * @param {number} requestId
     * @param {string} fileSystemPath
     * @param {number} worked
     */
    indexingWorked(requestId, fileSystemPath, worked) {
      this._dispatchOnInspectorFrontendAPI('indexingWorked', [requestId, fileSystemPath, worked]);
    }
    /**
     * @param {number} requestId
     * @param {string} fileSystemPath
     */
    indexingDone(requestId, fileSystemPath) {
      this._dispatchOnInspectorFrontendAPI('indexingDone', [requestId, fileSystemPath]);
    }
    /**
     * @param {{type: string, key: string, code: string, keyCode: number, modifiers: number}} event
     */
    keyEventUnhandled(event) {
      event.keyIdentifier = keyCodeToKeyIdentifier(event.keyCode);
      this._dispatchOnInspectorFrontendAPI('keyEventUnhandled', [event]);
    }
    /**
     * @param {function(!ExtensionDescriptor)} callback
     */
    setAddExtensionCallback(callback) {
      this._addExtensionCallback = callback;
      if (this._pendingExtensionDescriptors.length) {
        this._pendingExtensionDescriptors.forEach(this._addExtensionCallback);
        this._pendingExtensionDescriptors = [];
      }
    }
    reattachMainTarget() {
      this._dispatchOnInspectorFrontendAPI('reattachMainTarget', []);
    }
    /**
     * @param {boolean} hard
     */
    reloadInspectedPage(hard) {
      this._dispatchOnInspectorFrontendAPI('reloadInspectedPage', [hard]);
    }
    /**
     * @param {string} url
     * @param {number} lineNumber
     * @param {number} columnNumber
     */
    revealSourceLine(url, lineNumber, columnNumber) {
      this._dispatchOnInspectorFrontendAPI('revealSourceLine', [url, lineNumber, columnNumber]);
    }
    /**
     * @param {string} url
     * @param {string=} fileSystemPath
     */
    savedURL(url, fileSystemPath) {
      this._dispatchOnInspectorFrontendAPI('savedURL', [url, fileSystemPath]);
    }
    /**
     * @param {number} requestId
     * @param {string} fileSystemPath
     * @param {!Array.<string>} files
     */
    searchCompleted(requestId, fileSystemPath, files) {
      this._dispatchOnInspectorFrontendAPI('searchCompleted', [requestId, fileSystemPath, files]);
    }
    /**
     * @param {string} tabId
     */
    setInspectedTabId(tabId) {
      this._inspectedTabIdValue = tabId;
      // Support for legacy front-ends (<M41).
      if (window['WebInspector'] && window['WebInspector']['setInspectedTabId']) {
        window['WebInspector']['setInspectedTabId'](tabId);
      } else {
        this._dispatchOnInspectorFrontendAPI('setInspectedTabId', [tabId]);
      }
    }
    /**
     * @return {string|undefined}
     */
    getInspectedTabId() {
      return this._inspectedTabIdValue;
    }
    /**
     * @param {boolean} useSoftMenu
     */
    setUseSoftMenu(useSoftMenu) {
      this._dispatchOnInspectorFrontendAPI('setUseSoftMenu', [useSoftMenu]);
    }
    /**
     * @param {string} panelName
     */
    showPanel(panelName) {
      this._dispatchOnInspectorFrontendAPI('showPanel', [panelName]);
    }
    /**
     * @param {number} id
     * @param {string} chunk
     * @param {boolean} encoded
     */
    streamWrite(id, chunk, encoded) {
      this._dispatchOnInspectorFrontendAPI('streamWrite', [id, encoded ? this._decodeBase64(chunk) : chunk]);
    }
    /**
     * @param {string} chunk
     * @return {string}
     */
    _decodeBase64(chunk) {
      const request = new XMLHttpRequest();
      request.open('GET', 'data:text/plain;base64,' + chunk, false);
      request.send(null);
      if (request.status === 200) {
        return request.responseText;
      }
      console.error('Error while decoding chunk in streamWrite');
      return '';
    }
  };
  const DevToolsAPI = new DevToolsAPIImpl();
  window.DevToolsAPI = DevToolsAPI;
  // InspectorFrontendHostImpl --------------------------------------------------
  /**
   * Enum for recordPerformanceHistogram
   * Warning: There are three definitions of this enum in the DevTools code base, keep them in sync.
   * @readonly
   * @enum {string}
   */
  const EnumeratedHistogram = {
    ActionTaken: 'DevTools.ActionTaken',
    PanelShown: 'DevTools.PanelShown',
    KeyboardShortcutFired: 'DevTools.KeyboardShortcutFired',
    IssuesPanelOpenedFrom: 'DevTools.IssuesPanelOpenedFrom',
    KeybindSetSettingChanged: 'DevTools.KeybindSetSettingChanged',
    DualScreenDeviceEmulated: 'DevTools.DualScreenDeviceEmulated',
    GridSettingChanged: 'DevTools.GridSettingChanged',
  };
  /**
   * @implements {InspectorFrontendHostAPI}
   * @unrestricted
   */
  const InspectorFrontendHostImpl = class {
    /**
     * @return {string}
     */
    getSelectionBackgroundColor() {
      return '#6e86ff';
    }
    /**
     * @return {string}
     */
    getSelectionForegroundColor() {
      return '#ffffff';
    }
    /**
     * @return {string}
     */
    getInactiveSelectionBackgroundColor() {
      return '#c9c8c8';
    }
    /**
     * @return {string}
     */
    getInactiveSelectionForegroundColor() {
      return '#323232';
    }
    /**
     * @override
     * @return {string}
     */
    platform() {
      return DevToolsHost.platform();
    }
    /**
     * @override
     */
    loadCompleted() {
      DevToolsAPI.sendMessageToEmbedder('loadCompleted', [], null);
      // Support for legacy (<57) frontends.
      if (window.Runtime && window.Runtime.queryParam) {
        const panelToOpen = window.Runtime.queryParam('panel');
        if (panelToOpen) {
          window.DevToolsAPI.showPanel(panelToOpen);
        }
      }
    }
    /**
     * @override
     */
    bringToFront() {
      DevToolsAPI.sendMessageToEmbedder('bringToFront', [], null);
    }
    /**
     * @override
     */
    closeWindow() {
      DevToolsAPI.sendMessageToEmbedder('closeWindow', [], null);
    }
    /**
     * @override
     * @param {boolean} isDocked
     * @param {function()} callback
     */
    setIsDocked(isDocked, callback) {
      DevToolsAPI.sendMessageToEmbedder('setIsDocked', [isDocked], callback);
    }
    /**
     * Requests inspected page to be placed atop of the inspector frontend with specified bounds.
     * @override
     * @param {{x: number, y: number, width: number, height: number}} bounds
     */
    setInspectedPageBounds(bounds) {
      DevToolsAPI.sendMessageToEmbedder('setInspectedPageBounds', [bounds], null);
    }
    /**
     * @override
     */
    inspectElementCompleted() {
      DevToolsAPI.sendMessageToEmbedder('inspectElementCompleted', [], null);
    }
    /**
     * @override
     * @param {string} url
     * @param {string} headers
     * @param {number} streamId
     * @param {function(!InspectorFrontendHostAPI.LoadNetworkResourceResult)} callback
     */
    loadNetworkResource(url, headers, streamId, callback) {
      DevToolsAPI.sendMessageToEmbedder(
          'loadNetworkResource', [url, headers, streamId], /** @type {function(?Object)} */ (callback));
    }
    /**
     * @override
     * @param {function(!Object<string, string>)} callback
     */
    getPreferences(callback) {
      DevToolsAPI.sendMessageToEmbedder('getPreferences', [], /** @type {function(?Object)} */ (callback));
    }
    /**
     * @override
     * @param {string} name
     * @param {string} value
     */
    setPreference(name, value) {
      DevToolsAPI.sendMessageToEmbedder('setPreference', [name, value], null);
    }
    /**
     * @override
     * @param {string} name
     */
    removePreference(name) {
      DevToolsAPI.sendMessageToEmbedder('removePreference', [name], null);
    }
    /**
     * @override
     */
    clearPreferences() {
      DevToolsAPI.sendMessageToEmbedder('clearPreferences', [], null);
    }
    /**
     * @override
     * @param {string} origin
     * @param {string} script
     */
    setInjectedScriptForOrigin(origin, script) {
      DevToolsAPI.sendMessageToEmbedder('registerExtensionsAPI', [origin, script], null);
    }
    /**
     * @override
     * @param {string} url
     */
    inspectedURLChanged(url) {
      DevToolsAPI.sendMessageToEmbedder('inspectedURLChanged', [url], null);
    }
    /**
     * @override
     * @param {string} text
     */
    copyText(text) {
      DevToolsHost.copyText(text);
    }
    /**
     * @override
     * @param {string} url
     */
    openInNewTab(url) {
      DevToolsAPI.sendMessageToEmbedder('openInNewTab', [url], null);
    }
    /**
     * @override
     * @param {string} fileSystemPath
     */
    showItemInFolder(fileSystemPath) {
      DevToolsAPI.sendMessageToEmbedder('showItemInFolder', [fileSystemPath], null);
    }
    /**
     * @override
     * @param {string} url
     * @param {string} content
     * @param {boolean} forceSaveAs
     */
    save(url, content, forceSaveAs) {
      DevToolsAPI.sendMessageToEmbedder('save', [url, content, forceSaveAs], null);
    }
    /**
     * @override
     * @param {string} url
     * @param {string} content
     */
    append(url, content) {
      DevToolsAPI.sendMessageToEmbedder('append', [url, content], null);
    }
    /**
     * @override
     * @param {string} url
     */
    close(url) {
    }
    /**
     * @override
     * @param {string} message
     */
    sendMessageToBackend(message) {
      DevToolsAPI.sendMessageToEmbedder('dispatchProtocolMessage', [message], null);
    }
    /**
     * @override
     * @param {!InspectorFrontendHostAPI.EnumeratedHistogram} actionName
     * @param {number} actionCode
     * @param {number} bucketSize
     */
    recordEnumeratedHistogram(actionName, actionCode, bucketSize) {
      if (!Object.values(EnumeratedHistogram).includes(actionName)) {
        return;
      }
      DevToolsAPI.sendMessageToEmbedder('recordEnumeratedHistogram', [actionName, actionCode, bucketSize], null);
    }
    /**
     * @override
     * @param {string} histogramName
     * @param {number} duration
     */
    recordPerformanceHistogram(histogramName, duration) {
      DevToolsAPI.sendMessageToEmbedder('recordPerformanceHistogram', [histogramName, duration], null);
    }
    /**
     * @override
     * @param {string} umaName
     */
    recordUserMetricsAction(umaName) {
      DevToolsAPI.sendMessageToEmbedder('recordUserMetricsAction', [umaName], null);
    }
    /**
     * @override
     */
    requestFileSystems() {
      DevToolsAPI.sendMessageToEmbedder('requestFileSystems', [], null);
    }
    /**
     * @override
     * @param {string=} type
     */
    addFileSystem(type) {
      DevToolsAPI.sendMessageToEmbedder('addFileSystem', [type || ''], null);
    }
    /**
     * @override
     * @param {string} fileSystemPath
     */
    removeFileSystem(fileSystemPath) {
      DevToolsAPI.sendMessageToEmbedder('removeFileSystem', [fileSystemPath], null);
    }
    /**
     * @override
     * @param {string} fileSystemId
     * @param {string} registeredName
     * @return {?FileSystem}
     */
    isolatedFileSystem(fileSystemId, registeredName) {
      return DevToolsHost.isolatedFileSystem(fileSystemId, registeredName);
    }
    /**
     * @override
     * @param {!FileSystem} fileSystem
     */
    upgradeDraggedFileSystemPermissions(fileSystem) {
      DevToolsHost.upgradeDraggedFileSystemPermissions(fileSystem);
    }
    /**
     * @override
     * @param {number} requestId
     * @param {string} fileSystemPath
     * @param {string} excludedFolders
     */
    indexPath(requestId, fileSystemPath, excludedFolders) {
      // |excludedFolders| added in M67. For backward compatibility,
      // pass empty array.
      excludedFolders = excludedFolders || '[]';
      DevToolsAPI.sendMessageToEmbedder('indexPath', [requestId, fileSystemPath, excludedFolders], null);
    }
    /**
     * @override
     * @param {number} requestId
     */
    stopIndexing(requestId) {
      DevToolsAPI.sendMessageToEmbedder('stopIndexing', [requestId], null);
    }
    /**
     * @override
     * @param {number} requestId
     * @param {string} fileSystemPath
     * @param {string} query
     */
    searchInPath(requestId, fileSystemPath, query) {
      DevToolsAPI.sendMessageToEmbedder('searchInPath', [requestId, fileSystemPath, query], null);
    }
    /**
     * @override
     * @return {number}
     */
    zoomFactor() {
      return DevToolsHost.zoomFactor();
    }
    /**
     * @override
     */
    zoomIn() {
      DevToolsAPI.sendMessageToEmbedder('zoomIn', [], null);
    }
    /**
     * @override
     */
    zoomOut() {
      DevToolsAPI.sendMessageToEmbedder('zoomOut', [], null);
    }
    /**
     * @override
     */
    resetZoom() {
      DevToolsAPI.sendMessageToEmbedder('resetZoom', [], null);
    }
    /**
     * @override
     * @param {string} shortcuts
     */
    setWhitelistedShortcuts(shortcuts) {
      DevToolsAPI.sendMessageToEmbedder('setWhitelistedShortcuts', [shortcuts], null);
    }
    /**
     * @override
     * @param {boolean} active
     */
    setEyeDropperActive(active) {
      DevToolsAPI.sendMessageToEmbedder('setEyeDropperActive', [active], null);
    }
    /**
     * @override
     * @param {!Array<string>} certChain
     */
    showCertificateViewer(certChain) {
      DevToolsAPI.sendMessageToEmbedder('showCertificateViewer', [JSON.stringify(certChain)], null);
    }
    /**
     * Only needed to run Lighthouse on old devtools.
     * @override
     * @param {function()} callback
     */
    reattach(callback) {
      DevToolsAPI.sendMessageToEmbedder('reattach', [], callback);
    }
    /**
     * @override
     */
    readyForTest() {
      DevToolsAPI.sendMessageToEmbedder('readyForTest', [], null);
    }
    /**
     * @override
     */
    connectionReady() {
      DevToolsAPI.sendMessageToEmbedder('connectionReady', [], null);
    }
    /**
     * @override
     * @param {boolean} value
     */
    setOpenNewWindowForPopups(value) {
      DevToolsAPI.sendMessageToEmbedder('setOpenNewWindowForPopups', [value], null);
    }
    /**
     * @override
     * @param {!Adb.Config} config
     */
    setDevicesDiscoveryConfig(config) {
      DevToolsAPI.sendMessageToEmbedder(
          'setDevicesDiscoveryConfig',
          [
            config.discoverUsbDevices, config.portForwardingEnabled, JSON.stringify(config.portForwardingConfig),
            config.networkDiscoveryEnabled, JSON.stringify(config.networkDiscoveryConfig)
          ],
          null);
    }
    /**
     * @override
     * @param {boolean} enabled
     */
    setDevicesUpdatesEnabled(enabled) {
      DevToolsAPI.sendMessageToEmbedder('setDevicesUpdatesEnabled', [enabled], null);
    }
    /**
     * @override
     * @param {string} pageId
     * @param {string} action
     */
    performActionOnRemotePage(pageId, action) {
      DevToolsAPI.sendMessageToEmbedder('performActionOnRemotePage', [pageId, action], null);
    }
    /**
     * @override
     * @param {string} browserId
     * @param {string} url
     */
    openRemotePage(browserId, url) {
      DevToolsAPI.sendMessageToEmbedder('openRemotePage', [browserId, url], null);
    }
    /**
     * @override
     */
    openNodeFrontend() {
      DevToolsAPI.sendMessageToEmbedder('openNodeFrontend', [], null);
    }
    /**
     * @override
     * @param {number} x
     * @param {number} y
     * @param {!Array.<!InspectorFrontendHostAPI.ContextMenuDescriptor>} items
     * @param {!Document} document
     */
    showContextMenuAtPoint(x, y, items, document) {
      DevToolsHost.showContextMenuAtPoint(x, y, items, document);
    }
    /**
     * @override
     * @return {boolean}
     */
    isHostedMode() {
      return DevToolsHost.isHostedMode();
    }
    /**
     * @override
     * @param {function(!ExtensionDescriptor)} callback
     */
    setAddExtensionCallback(callback) {
      DevToolsAPI.setAddExtensionCallback(callback);
    }
    // Backward-compatible methods below this line --------------------------------------------
    /**
     * Support for legacy front-ends (<M65).
     * @return {boolean}
     */
    isUnderTest() {
      return false;
    }
    /**
     * Support for legacy front-ends (<M50).
     * @param {string} message
     */
    sendFrontendAPINotification(message) {
    }
    /**
     * Support for legacy front-ends (<M41).
     * @return {string}
     */
    port() {
      return 'unknown';
    }
    /**
     * Support for legacy front-ends (<M38).
     * @param {number} zoomFactor
     */
    setZoomFactor(zoomFactor) {
    }
    /**
     * Support for legacy front-ends (<M34).
     */
    sendMessageToEmbedder() {
    }
    /**
     * Support for legacy front-ends (<M34).
     * @param {string} dockSide
     */
    requestSetDockSide(dockSide) {
      DevToolsAPI.sendMessageToEmbedder('setIsDocked', [dockSide !== 'undocked'], null);
    }
    /**
     * Support for legacy front-ends (<M34).
     * @return {boolean}
     */
    supportsFileSystems() {
      return true;
    }
    /**
     * Support for legacy front-ends (<M44).
     * @param {number} actionCode
     */
    recordActionTaken(actionCode) {
      // Do not record actions, as that may crash the DevTools renderer.
    }
    /**
     * Support for legacy front-ends (<M44).
     * @param {number} panelCode
     */
    recordPanelShown(panelCode) {
      // Do not record actions, as that may crash the DevTools renderer.
    }
  };
  window.InspectorFrontendHost = new InspectorFrontendHostImpl();
  // DevToolsApp ---------------------------------------------------------------
  function installObjectObserve() {
    /** @type {!Array<string>} */
    const properties = [
      'advancedSearchConfig',
      'auditsPanelSplitViewState',
      'auditsSidebarWidth',
      'blockedURLs',
      'breakpoints',
      'cacheDisabled',
      'colorFormat',
      'consoleHistory',
      'consoleTimestampsEnabled',
      'cpuProfilerView',
      'cssSourceMapsEnabled',
      'currentDockState',
      'customColorPalette',
      'customDevicePresets',
      'customEmulatedDeviceList',
      'customFormatters',
      'customUserAgent',
      'databaseTableViewVisibleColumns',
      'dataGrid-cookiesTable',
      'dataGrid-DOMStorageItemsView',
      'debuggerSidebarHidden',
      'disableDataSaverInfobar',
      'disablePausedStateOverlay',
      'domBreakpoints',
      'domWordWrap',
      'elementsPanelSplitViewState',
      'elementsSidebarWidth',
      'emulation.deviceHeight',
      'emulation.deviceModeValue',
      'emulation.deviceOrientationOverride',
      'emulation.deviceScale',
      'emulation.deviceScaleFactor',
      'emulation.deviceUA',
      'emulation.deviceWidth',
      'emulation.locationOverride',
      'emulation.showDeviceMode',
      'emulation.showRulers',
      'enableAsyncStackTraces',
      'eventListenerBreakpoints',
      'fileMappingEntries',
      'fileSystemMapping',
      'FileSystemViewSidebarWidth',
      'fileSystemViewSplitViewState',
      'filterBar-consoleView',
      'filterBar-networkPanel',
      'filterBar-promisePane',
      'filterBar-timelinePanel',
      'frameViewerHideChromeWindow',
      'heapSnapshotRetainersViewSize',
      'heapSnapshotSplitViewState',
      'hideCollectedPromises',
      'hideNetworkMessages',
      'highlightNodeOnHoverInOverlay',
      'inlineVariableValues',
      'Inspector.drawerSplitView',
      'Inspector.drawerSplitViewState',
      'InspectorView.panelOrder',
      'InspectorView.screencastSplitView',
      'InspectorView.screencastSplitViewState',
      'InspectorView.splitView',
      'InspectorView.splitViewState',
      'javaScriptDisabled',
      'jsSourceMapsEnabled',
      'lastActivePanel',
      'lastDockState',
      'lastSelectedSourcesSidebarPaneTab',
      'lastSnippetEvaluationIndex',
      'layerDetailsSplitView',
      'layerDetailsSplitViewState',
      'layersPanelSplitViewState',
      'layersShowInternalLayers',
      'layersSidebarWidth',
      'messageLevelFilters',
      'messageURLFilters',
      'monitoringXHREnabled',
      'navigatorGroupByFolder',
      'navigatorHidden',
      'networkColorCodeResourceTypes',
      'networkConditions',
      'networkConditionsCustomProfiles',
      'networkHideDataURL',
      'networkLogColumnsVisibility',
      'networkLogLargeRows',
      'networkLogShowOverview',
      'networkPanelSplitViewState',
      'networkRecordFilmStripSetting',
      'networkResourceTypeFilters',
      'networkShowPrimaryLoadWaterfall',
      'networkSidebarWidth',
      'openLinkHandler',
      'pauseOnCaughtException',
      'pauseOnExceptionEnabled',
      'preserveConsoleLog',
      'prettyPrintInfobarDisabled',
      'previouslyViewedFiles',
      'profilesPanelSplitViewState',
      'profilesSidebarWidth',
      'promiseStatusFilters',
      'recordAllocationStacks',
      'requestHeaderFilterSetting',
      'request-info-formData-category-expanded',
      'request-info-general-category-expanded',
      'request-info-queryString-category-expanded',
      'request-info-requestHeaders-category-expanded',
      'request-info-requestPayload-category-expanded',
      'request-info-responseHeaders-category-expanded',
      'resources',
      'resourcesLastSelectedItem',
      'resourcesPanelSplitViewState',
      'resourcesSidebarWidth',
      'resourceViewTab',
      'savedURLs',
      'screencastEnabled',
      'scriptsPanelNavigatorSidebarWidth',
      'searchInContentScripts',
      'selectedAuditCategories',
      'selectedColorPalette',
      'selectedProfileType',
      'shortcutPanelSwitch',
      'showAdvancedHeapSnapshotProperties',
      'showEventListenersForAncestors',
      'showFrameowkrListeners',
      'showHeaSnapshotObjectsHiddenProperties',
      'showInheritedComputedStyleProperties',
      'showMediaQueryInspector',
      'showNativeFunctionsInJSProfile',
      'showUAShadowDOM',
      'showWhitespacesInEditor',
      'sidebarPosition',
      'skipContentScripts',
      'skipStackFramesPattern',
      'sourceMapInfobarDisabled',
      'sourcesPanelDebuggerSidebarSplitViewState',
      'sourcesPanelNavigatorSplitViewState',
      'sourcesPanelSplitSidebarRatio',
      'sourcesPanelSplitViewState',
      'sourcesSidebarWidth',
      'standardEmulatedDeviceList',
      'StylesPaneSplitRatio',
      'stylesPaneSplitViewState',
      'textEditorAutocompletion',
      'textEditorAutoDetectIndent',
      'textEditorBracketMatching',
      'textEditorIndent',
      'textEditorTabMovesFocus',
      'timelineCaptureFilmStrip',
      'timelineCaptureLayersAndPictures',
      'timelineCaptureMemory',
      'timelineCaptureNetwork',
      'timeline-details',
      'timelineEnableJSSampling',
      'timelineOverviewMode',
      'timelinePanelDetailsSplitViewState',
      'timelinePanelRecorsSplitViewState',
      'timelinePanelTimelineStackSplitViewState',
      'timelinePerspective',
      'timeline-split',
      'timelineTreeGroupBy',
      'timeline-view',
      'timelineViewMode',
      'uiTheme',
      'watchExpressions',
      'WebInspector.Drawer.lastSelectedView',
      'WebInspector.Drawer.showOnLoad',
      'workspaceExcludedFolders',
      'workspaceFolderExcludePattern',
      'workspaceInfobarDisabled',
      'workspaceMappingInfobarDisabled',
      'xhrBreakpoints'
    ];
    /**
     * @this {!{_storage: Object, _name: string}}
     */
    function settingRemove() {
      this._storage[this._name] = undefined;
    }
    /**
     * @param {!Object} object
     * @param {function(!Array<!{name: string}>)} observer
     */
    function objectObserve(object, observer) {
      if (window['WebInspector']) {
        const settingPrototype = /** @type {!Object} */ (window['WebInspector']['Setting']['prototype']);
        if (typeof settingPrototype['remove'] === 'function') {
          settingPrototype['remove'] = settingRemove;
        }
      }
      /** @type {!Set<string>} */
      const changedProperties = new Set();
      let scheduled = false;
      function scheduleObserver() {
        if (scheduled) {
          return;
        }
        scheduled = true;
        setImmediate(callObserver);
      }
      function callObserver() {
        scheduled = false;
        const changes = /** @type {!Array<!{name: string}>} */ ([]);
        changedProperties.forEach(function(name) {
          changes.push({name: name});
        });
        changedProperties.clear();
        observer.call(null, changes);
      }
      /** @type {!Map<string, *>} */
      const storage = new Map();
      /**
       * @param {string} property
       */
      function defineProperty(property) {
        if (property in object) {
          storage.set(property, object[property]);
          delete object[property];
        }
        Object.defineProperty(object, property, {
          /**
           * @return {*}
           */
          get: function() {
            return storage.get(property);
          },
          /**
           * @param {*} value
           */
          set: function(value) {
            storage.set(property, value);
            changedProperties.add(property);
            scheduleObserver();
          }
        });
      }
      for (let i = 0; i < properties.length; ++i) {
        defineProperty(properties[i]);
      }
    }
    window.Object.observe = objectObserve;
  }
  /** @type {!Map<number, string>} */
  const staticKeyIdentifiers = new Map([
    [0x12, 'Alt'],
    [0x11, 'Control'],
    [0x10, 'Shift'],
    [0x14, 'CapsLock'],
    [0x5b, 'Win'],
    [0x5c, 'Win'],
    [0x0c, 'Clear'],
    [0x28, 'Down'],
    [0x23, 'End'],
    [0x0a, 'Enter'],
    [0x0d, 'Enter'],
    [0x2b, 'Execute'],
    [0x70, 'F1'],
    [0x71, 'F2'],
    [0x72, 'F3'],
    [0x73, 'F4'],
    [0x74, 'F5'],
    [0x75, 'F6'],
    [0x76, 'F7'],
    [0x77, 'F8'],
    [0x78, 'F9'],
    [0x79, 'F10'],
    [0x7a, 'F11'],
    [0x7b, 'F12'],
    [0x7c, 'F13'],
    [0x7d, 'F14'],
    [0x7e, 'F15'],
    [0x7f, 'F16'],
    [0x80, 'F17'],
    [0x81, 'F18'],
    [0x82, 'F19'],
    [0x83, 'F20'],
    [0x84, 'F21'],
    [0x85, 'F22'],
    [0x86, 'F23'],
    [0x87, 'F24'],
    [0x2f, 'Help'],
    [0x24, 'Home'],
    [0x2d, 'Insert'],
    [0x25, 'Left'],
    [0x22, 'PageDown'],
    [0x21, 'PageUp'],
    [0x13, 'Pause'],
    [0x2c, 'PrintScreen'],
    [0x27, 'Right'],
    [0x91, 'Scroll'],
    [0x29, 'Select'],
    [0x26, 'Up'],
    [0x2e, 'U+007F'],  // Standard says that DEL becomes U+007F.
    [0xb0, 'MediaNextTrack'],
    [0xb1, 'MediaPreviousTrack'],
    [0xb2, 'MediaStop'],
    [0xb3, 'MediaPlayPause'],
    [0xad, 'VolumeMute'],
    [0xae, 'VolumeDown'],
    [0xaf, 'VolumeUp'],
  ]);
  /**
   * @param {number} keyCode
   * @return {string}
   */
  function keyCodeToKeyIdentifier(keyCode) {
    let result = staticKeyIdentifiers.get(keyCode);
    if (result !== undefined) {
      return result;
    }
    result = 'U+';
    const hexString = keyCode.toString(16).toUpperCase();
    for (let i = hexString.length; i < 4; ++i) {
      result += '0';
    }
    result += hexString;
    return result;
  }
  function installBackwardsCompatibility() {
    const majorVersion = getRemoteMajorVersion();
    if (!majorVersion) {
      return;
    }
    /** @type {!Array<string>} */
    const styleRules = [];
    // Shadow DOM V0 polyfill
    if (majorVersion <= 73 && !Element.prototype.createShadowRoot) {
      Element.prototype.createShadowRoot = function() {
        try {
          return this.attachShadow({mode: 'open'});
        } catch (e) {
          // some elements we use to add shadow roots can no
          // longer have shadow roots.
          const fakeShadowHost = document.createElement('span');
          this.appendChild(fakeShadowHost);
          fakeShadowHost.className = 'fake-shadow-host';
          return fakeShadowHost.createShadowRoot();
        }
      };
      const origAdd = DOMTokenList.prototype.add;
      DOMTokenList.prototype.add = function(...tokens) {
        if (tokens[0].startsWith('insertion-point') || tokens[0].startsWith('tabbed-pane-header')) {
          this._myElement.slot = '.' + tokens[0];
        }
        return origAdd.apply(this, tokens);
      };
      const origCreateElement = Document.prototype.createElement;
      Document.prototype.createElement = function(tagName, ...rest) {
        if (tagName === 'content') {
          tagName = 'slot';
        }
        const element = origCreateElement.call(this, tagName, ...rest);
        element.classList._myElement = element;
        return element;
      };
      Object.defineProperty(HTMLSlotElement.prototype, 'select', {
        async set(selector) {
          this.name = selector;
        }
      });
      function overrideCreateElementWithClass() {
        window.removeEventListener('DOMContentLoaded', overrideCreateElementWithClass);
        const origCreateElementWithClass = Document.prototype.createElementWithClass;
        Document.prototype.createElementWithClass = function(tagName, className, ...rest) {
          if (tagName !== 'button' || (className !== 'soft-dropdown' && className !== 'dropdown-button')) {
            return origCreateElementWithClass.call(this, tagName, className, ...rest);
          }
          const element = origCreateElementWithClass.call(this, 'div', className, ...rest);
          element.tabIndex = 0;
          element.role = 'button';
          return element;
        };
      }
      // Document.prototype.createElementWithClass is a DevTools method, so we
      // need to wait for DOMContentLoaded in order to override it.
      if (window.document.head &&
          (window.document.readyState === 'complete' || window.document.readyState === 'interactive')) {
        overrideCreateElementWithClass();
      } else {
        window.addEventListener('DOMContentLoaded', overrideCreateElementWithClass);
      }
    }
    // Custom Elements V0 polyfill
    if (majorVersion <= 73 && !Document.prototype.hasOwnProperty('registerElement')) {
      const fakeRegistry = new Map();
      Document.prototype.registerElement = function(typeExtension, options) {
        const {prototype, extends: localName} = options;
        const document = this;
        const callback = function() {
          const element = document.createElement(localName || typeExtension);
          const skip = new Set(['constructor', '__proto__']);
          for (const key of Object.keys(Object.getOwnPropertyDescriptors(prototype.__proto__ || {}))) {
            if (skip.has(key)) {
              continue;
            }
            element[key] = prototype[key];
          }
          element.setAttribute('is', typeExtension);
          if (element['createdCallback']) {
            element['createdCallback']();
          }
          return element;
        };
        fakeRegistry.set(typeExtension, callback);
        return callback;
      };
      const origCreateElement = Document.prototype.createElement;
      Document.prototype.createElement = function(tagName, fakeCustomElementType) {
        const fakeConstructor = fakeRegistry.get(fakeCustomElementType);
        if (fakeConstructor) {
          return fakeConstructor();
        }
        return origCreateElement.call(this, tagName, fakeCustomElementType);
      };
      // DevTools front-ends mistakenly assume that
      //   classList.toggle('a', undefined) works as
      //   classList.toggle('a', false) rather than as
      //   classList.toggle('a');
      const originalDOMTokenListToggle = DOMTokenList.prototype.toggle;
      DOMTokenList.prototype.toggle = function(token, force) {
        if (arguments.length === 1) {
          force = !this.contains(token);
        }
        return originalDOMTokenListToggle.call(this, token, !!force);
      };
    }
    if (majorVersion <= 66) {
      /** @type {(!function(number, number):Element|undefined)} */
      ShadowRoot.prototype.__originalShadowRootElementFromPoint;
      if (!ShadowRoot.prototype.__originalShadowRootElementFromPoint) {
        ShadowRoot.prototype.__originalShadowRootElementFromPoint = ShadowRoot.prototype.elementFromPoint;
        /**
         *  @param {number} x
         *  @param {number} y
         *  @return {Element}
         */
        ShadowRoot.prototype.elementFromPoint = function(x, y) {
          const originalResult = ShadowRoot.prototype.__originalShadowRootElementFromPoint.apply(this, arguments);
          if (this.host && originalResult === this.host) {
            return null;
          }
          return originalResult;
        };
      }
    }
    if (majorVersion <= 53) {
      Object.defineProperty(window.KeyboardEvent.prototype, 'keyIdentifier', {
        /**
         * @return {string}
         * @this {KeyboardEvent}
         */
        get: function() {
          return keyCodeToKeyIdentifier(this.keyCode);
        }
      });
    }
    if (majorVersion <= 50) {
      installObjectObserve();
    }
    if (majorVersion <= 45) {
      /**
       * @param {string} property
       * @return {!CSSValue|null}
       * @this {CSSStyleDeclaration}
       */
      function getValue(property) {
        // Note that |property| comes from another context, so we can't use === here.
        // eslint-disable-next-line eqeqeq
        if (property == 'padding-left') {
          return /** @type {!CSSValue} */ ({
            /**
             * @return {number}
             * @this {!{__paddingLeft: number}}
             */
            getFloatValue: function() {
              return this.__paddingLeft;
            },
            __paddingLeft: parseFloat(this.paddingLeft)
          });
        }
        throw new Error('getPropertyCSSValue is undefined');
      }
      window.CSSStyleDeclaration.prototype.getPropertyCSSValue = getValue;
      function CSSPrimitiveValue() {
      }
      CSSPrimitiveValue.CSS_PX = 5;
      window.CSSPrimitiveValue = CSSPrimitiveValue;
    }
    if (majorVersion <= 45) {
      styleRules.push('* { min-width: 0; min-height: 0; }');
    }
    if (majorVersion <= 51) {
      // Support for quirky border-image behavior (<M51), see:
      // https://bugs.chromium.org/p/chromium/issues/detail?id=559258
      styleRules.push('.cm-breakpoint .CodeMirror-linenumber { border-style: solid !important; }');
      styleRules.push(
          '.cm-breakpoint.cm-breakpoint-conditional .CodeMirror-linenumber { border-style: solid !important; }');
    }
    if (majorVersion <= 71) {
      styleRules.push(
          '.coverage-toolbar-container, .animation-timeline-toolbar-container, .computed-properties { flex-basis: auto; }');
    }
    if (majorVersion <= 50) {
      Event.prototype.deepPath = undefined;
    }
    if (majorVersion <= 54) {
      window.FileError = /** @type {!function (new: FileError) : ?} */ ({
        NOT_FOUND_ERR: DOMException.NOT_FOUND_ERR,
        ABORT_ERR: DOMException.ABORT_ERR,
        INVALID_MODIFICATION_ERR: DOMException.INVALID_MODIFICATION_ERR,
        NOT_READABLE_ERR: 0  // No matching DOMException, so code will be 0.
      });
    }
    installExtraStyleRules(styleRules);
  }
  /**
   * @return {?number}
   */
  function getRemoteMajorVersion() {
    try {
      const remoteVersion = new URLSearchParams(window.location.search).get('remoteVersion');
      if (!remoteVersion) {
        return null;
      }
      const majorVersion = parseInt(remoteVersion.split('.')[0], 10);
      return majorVersion;
    } catch (e) {
      return null;
    }
  }
  /**
   * @param {!Array<string>} styleRules
   */
  function installExtraStyleRules(styleRules) {
    if (!styleRules.length) {
      return;
    }
    const styleText = styleRules.join('\n');
    document.head.appendChild(createStyleElement(styleText));
    const origCreateShadowRoot = HTMLElement.prototype.createShadowRoot;
    HTMLElement.prototype.createShadowRoot = function(...args) {
      const shadowRoot = origCreateShadowRoot.call(this, ...args);
      shadowRoot.appendChild(createStyleElement(styleText));
      return shadowRoot;
    };
  }
  /**
   * @param {string} styleText
   * @return {!Element}
   */
  function createStyleElement(styleText) {
    const style = document.createElement('style');
    style.textContent = styleText;
    return style;
  }
  installBackwardsCompatibility();
})(window);