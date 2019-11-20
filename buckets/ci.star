luci.bucket(
    name = 'ci',
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

luci.builder(
    name = 'DevTools Linux',
    executable = luci.recipe(name = 'chromium_integration',
        cipd_package = "infra/recipe_bundles/chromium.googlesource.com/chromium/tools/build",
    cipd_version = "refs/heads/master",),
    properties = {
        'mastername': 'client.devtools-frontend.integration',
    },
    bucket = 'ci',
    dimensions = {
        'host_class':'default', 
        'os':'Ubuntu-16.04', 
    },
    swarming_tags = ['vpython:native-python-wrapper'],
    execution_timeout = 2 * time.hour,
    service_account = "devtools-frontend-ci-builder@chops-service-accounts.iam.gserviceaccount.com"
)

luci.builder(
    name= "Stand-alone Linux",
    swarming_tags= ["vpython:native-python-wrapper"],
    dimensions= {
        "host_class":"default",
        "os":"Ubuntu-16.04"
    },
    executable = luci.recipe(
        name= "devtools/devtools-frontend",
        cipd_package= "infra/recipe_bundles/chromium.googlesource.com/chromium/tools/build",
        cipd_version= "refs/heads/master",
    ),
    properties = {
        'mastername': 'client.devtools-frontend.integration',
    },
    execution_timeout = 2 * time.hour,
    service_account = "devtools-frontend-ci-builder@chops-service-accounts.iam.gserviceaccount.com",
    bucket = 'ci',
)