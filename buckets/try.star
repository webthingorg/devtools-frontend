
luci.bucket(
    name = 'try',
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


luci.builder(
    name= "devtools_frontend_linux_blink_light_rel",
    swarming_tags = ["vpython:native-python-wrapper"],
    dimensions = {
        "host_class":"baremetal",
        "os":"Ubuntu-16.04",
    },
    executable = luci.recipe(
      name= "chromium_trybot",
      cipd_package= "infra/recipe_bundles/chromium.googlesource.com/chromium/tools/build",
      cipd_version= "refs/heads/master",
    ),
    properties = {
        "mastername":"tryserver.devtools-frontend"
    },
    execution_timeout = 2 * time.hour,
    service_account = "devtools-frontend-try-builder@chops-service-accounts.iam.gserviceaccount.com",
    build_numbers = True,
    bucket = "try"
)

luci.builder(
    name= "devtools_frontend_linux_blink_rel",
    swarming_tags = ["vpython:native-python-wrapper"],
    dimensions = {
        "os":"Ubuntu-16.04",
    },
    executable = luci.recipe(
      name= "chromium_trybot",
      cipd_package= "infra/recipe_bundles/chromium.googlesource.com/chromium/tools/build",
      cipd_version= "refs/heads/master",
    ),
    properties = {
        "mastername":"tryserver.devtools-frontend"
    },
    execution_timeout = 2 * time.hour,
    service_account = "devtools-frontend-try-builder@chops-service-accounts.iam.gserviceaccount.com",
    build_numbers = True,
    bucket = "try"
)

luci.builder(
    name= "devtools_frontend_linux_rel",
    swarming_tags = ["vpython:native-python-wrapper"],
    dimensions = {
        "os":"Ubuntu-16.04",
    },
    executable = luci.recipe(
      name= "devtools/devtools-frontend",
      cipd_package= "infra/recipe_bundles/chromium.googlesource.com/chromium/tools/build",
      cipd_version= "refs/heads/master",
    ),
    properties = {
        "mastername":"tryserver.devtools-frontend"
    },
    execution_timeout = 2 * time.hour,
    service_account = "devtools-frontend-try-builder@chops-service-accounts.iam.gserviceaccount.com",
    bucket = "try"
)

luci.builder(
    name= "devtools_frontend_presubmit",
    swarming_tags = ["vpython:native-python-wrapper"],
    dimensions = {
        "os":"Ubuntu-16.04",
    },
    executable = luci.recipe(
      name= "run_presubmit",
      cipd_package= "infra/recipe_bundles/chromium.googlesource.com/chromium/tools/build",
      cipd_version= "refs/heads/master",
    ),
    properties = {
        "mastername":"tryserver.devtools-frontend",
        "runhooks":True,
        "solution_name":"devtools-frontend"
    },
    priority = 25,
    execution_timeout = 5 * time.minute,
    service_account = "devtools-frontend-try-builder@chops-service-accounts.iam.gserviceaccount.com",
    bucket = "try"
)


luci.builder(
    name= "dtf_presubmit_win64",
    swarming_tags = ["vpython:native-python-wrapper"],
    dimensions = {
        "cpu":"x86-64",
        "os":"Windows-10",
    },
    executable = luci.recipe(
      name= "run_presubmit",
      cipd_package= "infra/recipe_bundles/chromium.googlesource.com/chromium/tools/build",
      cipd_version= "refs/heads/master",
    ),
    properties = {
        "mastername":"tryserver.devtools-frontend",
        "runhooks":True,
        "solution_name":"devtools-frontend"
    },
    priority = 25,
    execution_timeout = 5 * time.minute,
    service_account = "devtools-frontend-try-builder@chops-service-accounts.iam.gserviceaccount.com",
    bucket = "try"
)