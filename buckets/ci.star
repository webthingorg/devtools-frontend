load('//lib/builders.star',
    'dtf_builder',
    'dtf_acls',
    'dtf_defaults',
    'dtf_dimensions',
)

bucket_name = 'ci'
service_account = 'devtools-frontend-ci-builder@chops-service-accounts.iam.gserviceaccount.com'


luci.bucket(
    name = bucket_name,
    acls = [
        dtf_acls.readers,
        acl.entry(
            roles = acl.BUILDBUCKET_TRIGGERER,
            users = [
                service_account,
                'luci-scheduler@appspot.gserviceaccount.com',
            ]
        ),
    ],
)

ci_builders = []

def ci_builder(**kvargs):
    category = kvargs.pop('console_category')
    dtf_builder(
        bucket = bucket_name,
        mastername = "client.devtools-frontend.integration",
        service_account = service_account,
        schedule = "triggered",
        **kvargs
    )
    ci_builders.append((kvargs['name'], category))

ci_builder(
    name = 'DevTools Linux',
    recipe_name = 'chromium_integration',
    dimensions = dtf_dimensions.default_ubuntu,
    execution_timeout = 2 * time.hour,
    console_category = 'Linux'
)

ci_builder(
    name= "Stand-alone Linux",
    recipe_name= "devtools/devtools-frontend",
    dimensions= dtf_dimensions.default_ubuntu,
    execution_timeout = 2 * time.hour,
    console_category = 'Linux'
)

dtf_builder(
    name="Auto-roll - devtools deps",
    bucket = bucket_name,
    mastername="client.devtools-frontend.integration",
    service_account='devtools-ci-autoroll-builder@chops-service-accounts.iam.gserviceaccount.com',
    schedule = "0 3,12 * * *",
    recipe_name="v8/auto_roll_v8_deps",
    dimensions= dtf_dimensions.default_ubuntu,
    execution_timeout = 2 * time.hour
)

luci.console_view(
    name = "main",
    title = "Main",
    repo = dtf_defaults.repo,
    refs = ["refs/heads/master"],
    favicon = dtf_defaults.favicon,
    header = {
        'tree_status_host': 'devtools-status.appspot.com'
    },
    entries = [
        luci.console_view_entry(builder = name, category= category)
        for name, category in ci_builders
    ]
)

luci.list_view(
    name = "infra",
    title = "Infra",
    favicon = dtf_defaults.favicon,
    entries =[luci.list_view_entry(builder="Auto-roll - devtools deps")],
)

luci.gitiles_poller(
    name = 'devtools-frontend-trigger',
    bucket = bucket_name,
    repo = dtf_defaults.repo,
    refs = ['refs/heads/master'],
    triggers = [name for name, _ in ci_builders]
)
