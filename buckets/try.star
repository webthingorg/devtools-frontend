load('//lib/builders.star',
    'dtf_builder',
    'dtf_acls',
    'dtf_defaults',
    'dtf_dimensions',
)

bucket_name = 'try'

luci.bucket(
    name = bucket_name,
    acls = [
        dtf_acls.readers,
        acl.entry(
            roles = acl.BUILDBUCKET_TRIGGERER,
            groups = [
                'project-devtools-committers',
                'service-account-cq',
            ]
        ),
    ],
)

try_builders = []

def try_builder(**kvargs):
    dtf_builder(
        bucket = bucket_name,
        mastername = "tryserver.devtools-frontend",
        service_account = "devtools-frontend-try-builder@chops-service-accounts.iam.gserviceaccount.com",
        **kvargs
    )
    try_builders.append(kvargs['name'])

try_builder(
    name= "devtools_frontend_presubmit",
    recipe_name = "run_presubmit",
    dimensions = dtf_dimensions.ubuntu,
    properties = {
        "runhooks":True,
        "solution_name":"devtools-frontend"
    },
    priority = 25,
    execution_timeout = 5 * time.minute,
)

try_builder(
    name= "dtf_presubmit_win64",
    recipe_name = "run_presubmit",
    dimensions = dtf_dimensions.win10,
    properties = {
        "runhooks":True,
        "solution_name":"devtools-frontend"
    },
    priority = 25,
    execution_timeout = 5 * time.minute,
)

try_builder(
    name= "devtools_frontend_linux_blink_rel",
    recipe_name = "chromium_trybot",
    dimensions = dtf_dimensions.ubuntu,
    execution_timeout = 2 * time.hour,
    build_numbers = True,
)

try_builder(
    name= "devtools_frontend_linux_blink_light_rel",
    recipe_name = "chromium_trybot",
    dimensions = dtf_dimensions.baremetal_ubuntu,
    execution_timeout = 2 * time.hour,
    build_numbers = True,
)

try_builder(
    name= "devtools_frontend_linux_rel",
    recipe_name = "devtools/devtools-frontend",
    dimensions = dtf_dimensions.ubuntu,
    execution_timeout = 2 * time.hour,
)

luci.list_view(
    name = "tryserver",
    title = "Tryserver",
    favicon = dtf_defaults.favicon,
    entries =[luci.list_view_entry(builder=b) for b in try_builders],
)

"""
luci.console_view(
    name = "tryserver",
    title = "Tryserver",
    repo = dtf_defaults.repo,
    refs = ["refs/heads/master"],
    favicon = dtf_defaults.favicon,
    header = {
        'tree_status_host': 'devtools-status.appspot.com'
    },
    entries =[luci.console_view_entry(builder=b) for b in try_builders]
)
"""