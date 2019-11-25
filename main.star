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

[lucicfg.emit(dest = f, data = io.read_file(f)) for f in (
    'commit-queue.cfg',
    'luci-logdog.cfg',
    'luci-milo.cfg',
)]

luci.project(
    name = 'devtools-frontend',
    buildbucket = 'cr-buildbucket.appspot.com',
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
        )
    ],
)

exec('//buckets/ci.star')
exec('//buckets/try.star')