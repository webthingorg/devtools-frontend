defaults = struct(
    cipd_package= "infra/recipe_bundles/chromium.googlesource.com/chromium/tools/build",
    cipd_version= "refs/heads/master",
    swarming_tags = ["vpython:native-python-wrapper"],
)

def dtf_recipe(
        name, 
        cipd_package = defaults.cipd_package,
        cipd_version = defaults.cipd_version):
    return luci.recipe(
        name = name,
        cipd_package= cipd_package,
        cipd_version= cipd_version,
    )


def dtf_builder(
        recipe_name,
        swarming_tags = defaults.swarming_tags,
        **kvargs):
    mastername = kvargs.pop('mastername')
    properties = kvargs.pop('properties', {})
    properties.update(mastername = mastername)
    kvargs['properties'] = properties
    
    luci.builder(
        swarming_tags= swarming_tags,
        executable =  dtf_recipe(recipe_name),
        **kvargs
    )