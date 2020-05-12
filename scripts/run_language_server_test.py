import os, sys, pathlib, threading
from common import *


def setup_projects(config):
    install_dir = config["install_dir"]
    create_dir(install_dir)
    devtools_project = DevtoolsProject(install_dir)
    llvm_project = LLVMProject(install_dir)

    projects = [devtools_project, llvm_project]
    for project in projects:
        project.initialize()
        project.build()

    config[LLVM_PROJECT_NAME] = llvm_project
    config[DEVTOOLS_PROJECT_NAME] = devtools_project


def run_e2e_test(config):
    devtools_url = os.path.join(config["install_dir"], "devtools",
                                "devtools-frontend")
    timeout = 60
    language_server = threading.Thread(target=run_language_server,
                                       args=(config[LLVM_PROJECT_NAME],
                                             devtools_url, timeout))
    # Language server will time out after timeout
    language_server.start()

    print("Starting e2e test..")
    config[DEVTOOLS_PROJECT_NAME].run()
    print("Done with e2e test")

    print("Waiting for language server to time out..")
    language_server.join()


def main():
    config = get_default_config()
    setup_projects(config)
    run_e2e_test(config)


if __name__ == "__main__":
    main()
