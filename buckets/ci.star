load(
  '//lib/builders.star',
  'builder',
  'defaults',
  'dimensions',
  'config_section',
  'builder_descriptor',
  'generate_ci_configs',
)

defaults.build_numbers.set(True)

generate_ci_configs(
    configurations = [
      config_section(
        name="ci",
        branch='refs/heads/master',
        view='Main',
        name_suffix = ''
      ),
      config_section(
        name="chromium",
        repo='https://chromium.googlesource.com/chromium/src',
        branch='refs/heads/master',
        view='Chromium',
        name_suffix = ' (chromium)'
      ),
      config_section(
        name="beta",
        branch='refs/heads/chromium/3987',
        view='Beta',
        name_suffix = ' beta'
      ),
    ],
    builders = [
      builder_descriptor(
        name='DevTools Linux',
        recipe_name='chromium_integration',
        excluded_views=['beta']
      ),
      builder_descriptor(
        name="Stand-alone Linux",
        recipe_name="devtools/devtools-frontend",
      ),
    ]
)

builder(
    name="Auto-roll - devtools deps",
    bucket="ci",
    mastername="client.devtools-frontend.integration",
    service_account='devtools-ci-autoroll-builder@chops-service-accounts.iam.gserviceaccount.com',
    schedule="0 3,12 * * *",
    recipe_name="v8/auto_roll_v8_deps",
    dimensions=dimensions.default_ubuntu,
    execution_timeout=2 * time.hour
)

luci.list_view(
    name="infra",
    title="Infra",
    favicon=defaults.favicon,
    entries =[luci.list_view_entry(builder="Auto-roll - devtools deps")],
)

###
# Chromium side
###
'''
builder(
    name="Chromium Linux",
    bucket="ci",
    mastername="client.devtools-frontend.integration",
    service_account=SERVICE_ACCOUNT,
    recipe_name="chromium_integration",
    dimensions=dimensions.default_ubuntu,
    execution_timeout=2 * time.hour
)

luci.console_view(
    name='chromium',
    title='Chromium',
    repo='https://chromium.googlesource.com/chromium/src',
    refs=['refs/heads/master'],
    favicon=defaults.favicon,
    header={
      'tree_status_host': 'devtools-status.appspot.com'
    },
    entries=[
      luci.console_view_entry(builder='Chromium Linux', category='Linux')
    ]
)

luci.gitiles_poller(
    name='devtools-frontend-trigger-chromium',
    bucket="ci",
    repo='https://chromium.googlesource.com/chromium/src',
    refs=['refs/heads/master'],
    triggers=['Chromium Linux']
)
'''
