load('//lib/builders.star', 'dtf_builder')

bucket_name = 'try'

luci.bucket(
    name = bucket_name,
    acls = [
        acl.entry(
            roles = acl.BUILDBUCKET_READER,
            groups = 'all',
        ),
        acl.entry(
            roles = acl.BUILDBUCKET_TRIGGERER,
            groups = 'project-devtools-committers',
        ),
        acl.entry(
            roles = acl.BUILDBUCKET_TRIGGERER,
            groups = 'service-account-cq',
        ),
    ],
)

def try_builder(**kvargs):
    dtf_builder(
        bucket = bucket_name,
        mastername = "tryserver.devtools-frontend",
        service_account = "devtools-frontend-try-builder@chops-service-accounts.iam.gserviceaccount.com",
        **kvargs
    )

try_builder(
    name= "devtools_frontend_linux_blink_light_rel",
    recipe_name = "chromium_trybot",
    dimensions = {
        "host_class":"baremetal",
        "os":"Ubuntu-16.04",
    },
    execution_timeout = 2 * time.hour,
    build_numbers = True,
)

try_builder(
    name= "devtools_frontend_linux_blink_rel",
    recipe_name = "chromium_trybot",
    dimensions = {
        "os":"Ubuntu-16.04",
    },
    execution_timeout = 2 * time.hour,
    build_numbers = True,
)

try_builder(
    name= "devtools_frontend_linux_rel",
    recipe_name = "devtools/devtools-frontend",
    dimensions = {
        "os":"Ubuntu-16.04",
    },
    execution_timeout = 2 * time.hour,
)

try_builder(
    name= "devtools_frontend_presubmit",
    recipe_name = "run_presubmit",
    dimensions = {
        "os":"Ubuntu-16.04",
    },
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
    dimensions = {
        "cpu":"x86-64",
        "os":"Windows-10",
    },
    properties = {
        "runhooks":True,
        "solution_name":"devtools-frontend"
    },
    priority = 25,
    execution_timeout = 5 * time.minute,
)

"""
luci.list_view(
    name = "tryserver",
    title = "Tryserver",
    favicon = "https://storage.googleapis.com/chrome-infra-public/logo/devtools.png",
    entries =[ 
        luci.list_view_entry(builder=b) for b in [
            'devtools_frontend_presubmit',
            'dtf_presubmit_win64',
            'devtools_frontend_linux_blink_rel',
            'devtools_frontend_linux_blink_light_rel',
            'devtools_frontend_linux_rel',
        ]
    ]
)
"""

luci.console_view(
    name = "tryserver",
    title = "Tryserver",
    repo = "https://chromium.googlesource.com/devtools/devtools-frontend",
    refs = ["refs/heads/master"],
    favicon = "https://storage.googleapis.com/chrome-infra-public/logo/devtools.png",
     header = {
        'tree_status_host': 'devtools-status.appspot.com'
    },
    entries =[ 
        luci.console_view_entry(builder=b) for b in [
            'devtools_frontend_presubmit',
            'dtf_presubmit_win64',
            'devtools_frontend_linux_blink_rel',
            'devtools_frontend_linux_blink_light_rel',
            'devtools_frontend_linux_rel',
        ]
    ]
)