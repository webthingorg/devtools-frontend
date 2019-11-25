#!/usr/bin/env lucicfg
# Tell lucicfg what files it is allowed to touch
lucicfg.config(
    config_dir = 'generated',
    tracked_files = [
        'commit-queue.cfg',
        'cr-buildbucket.cfg',
        'luci-logdog.cfg',
        'luci-milo.cfg',
        'luci-scheduler.cfg',
        'project.cfg',
        'devtools-status.cfg'
    ],
    fail_on_warnings = True,
)

luci.project(
    name = 'devtools-frontend',
    buildbucket = 'cr-buildbucket.appspot.com',
    logdog = "luci-logdog",
    milo = "luci-milo",
    scheduler = 'luci-scheduler',
    swarming = 'chromium-swarm.appspot.com',
    acls = [
        acl.entry(
            [
                acl.BUILDBUCKET_READER,
                acl.LOGDOG_READER,
                acl.PROJECT_CONFIGS_READER,
                acl.SCHEDULER_READER,
            ],
            groups = ["all"],
        ),
        acl.entry(
            [acl.SCHEDULER_OWNER],
            groups = ['project-v8-admins']
        ),
        acl.entry(
            [acl.LOGDOG_WRITER],
            groups = ['luci-logdog-chromium-writers']
        )
    ],
)

luci.milo(
    logo =  "https://storage.googleapis.com/chrome-infra-public/logo/devtools.svg",
)

luci.logdog(gs_bucket = "chromium-luci-logdog")


luci.cq(
    submit_max_burst = 1,
    submit_burst_delay = 60 * time.second,
    status_host = "chromium-cq-status.appspot.com",
)

luci.cq_group(
    name = "master",
    watch = cq.refset(
        repo = "https://chromium.googlesource.com/devtools/devtools-frontend",
        refs = ["refs/heads/master"]
    ),
    acls = [
        acl.entry(
            [acl.CQ_COMMITTER],
            groups = ['project-devtools-committers']
        ),
        acl.entry(
            [acl.CQ_DRY_RUNNER],
            groups = ['project-devtools-committers']
        )
    ],
    allow_submit_with_open_deps = None,
    allow_owner_if_submittable = None,
    tree_status_host = "devtools-status.appspot.com",
    retry_config = cq.retry_config(
        single_quota = 2,
        global_quota = 4,
        failure_weight = 2,
        transient_failure_weight = 1,
        timeout_weight = 4,
    ),
    cancel_stale_tryjobs = None,
    verifiers = [
        luci.cq_tryjob_verifier(builder = 'devtools_frontend_linux_blink_light_rel'),
        luci.cq_tryjob_verifier(builder = 'devtools_frontend_linux_rel'),
        luci.cq_tryjob_verifier(builder = 'devtools_frontend_presubmit', disable_reuse = True),
        luci.cq_tryjob_verifier(builder = 'dtf_presubmit_win64', disable_reuse = True)
    ],
)

luci.cq_group(
    name = "infra/config",
    watch = cq.refset(
        repo = "https://chromium.googlesource.com/devtools/devtools-frontend",
        refs = ["refs/heads/infra/config"]
    ),
    acls = [
        acl.entry(
            [acl.CQ_COMMITTER],
            groups = ['project-devtools-committers']
        ),
        acl.entry(
            [acl.CQ_DRY_RUNNER],
            groups = ['project-devtools-committers']
        )
    ],
    allow_submit_with_open_deps = None,
    allow_owner_if_submittable = None,
    retry_config = cq.retry_config(
        single_quota = 2,
        global_quota = 4,
        failure_weight = 2,
        transient_failure_weight = 1,
        timeout_weight = 4,
    ),
    cancel_stale_tryjobs = None,
    verifiers = [
        luci.cq_tryjob_verifier(builder = "devtools_frontend_presubmit", disable_reuse = True)
    ],
)


exec('//buckets/ci.star')
exec('//buckets/try.star')