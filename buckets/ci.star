load('//lib/builders.star', 'dtf_builder')

bucket_name = 'ci'

luci.bucket(
    name = bucket_name,
    acls = [
        acl.entry(
            roles = acl.BUILDBUCKET_READER,
            groups = 'all',
        ),
        acl.entry(
            roles = acl.BUILDBUCKET_TRIGGERER,
            users = 'devtools-frontend-ci-builder@chops-service-accounts.iam.gserviceaccount.com',
        ),
        acl.entry(
            roles = acl.BUILDBUCKET_TRIGGERER,
            users = 'luci-scheduler@appspot.gserviceaccount.com',
        ),
    ],
)

luci.gitiles_poller(
    name = 'devtools-frontend-trigger',
    bucket = bucket_name,
    repo = 'https://chromium.googlesource.com/devtools/devtools-frontend',
    refs = ['refs/heads/master'],
    triggers = ['DevTools Linux', 'Stand-alone Linux']
)

def ci_builder(**kvargs):
    dtf_builder(
        bucket = bucket_name,
        mastername = "client.devtools-frontend.integration",
        service_account = "devtools-frontend-ci-builder@chops-service-accounts.iam.gserviceaccount.com",
        schedule = "triggered",
        **kvargs
    )

ci_builder(
    name = 'DevTools Linux',
    recipe_name = 'chromium_integration',
    dimensions = {
        'host_class':'default',
        'os':'Ubuntu-16.04',
    },
    execution_timeout = 2 * time.hour,
)

ci_builder(
    name= "Stand-alone Linux",
    recipe_name= "devtools/devtools-frontend",
    dimensions= {
        "host_class":"default",
        "os":"Ubuntu-16.04"
    },
    execution_timeout = 2 * time.hour,
)