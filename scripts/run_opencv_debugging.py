import os, sys, threading
from common import *


def setup_projects(config):
    install_dir = config["install_dir"]
    create_dir(install_dir)
    opencv_project = OpenCVProject(install_dir)
    webcam_project = WebCameraProject(install_dir,
                                      opencv_project.get_bin_dir())
    devtools_project = DevtoolsProject(install_dir)
    llvm_project = LLVMProject(install_dir)

    projects = [devtools_project, opencv_project, webcam_project, llvm_project]
    for project in projects:
        project.initialize()
        project.build()

    config[LLVM_PROJECT_NAME] = llvm_project
    config[WEBCAMERA_PROJECT_NAME] = webcam_project
    config[DEVTOOLS_PROJECT_NAME] = devtools_project


def run_webcamera_server(webcamera_project):
    print("Starting WebCam Server..")
    try:
        webcamera_project.run()
    except Exception as ex:
        print("Webcam Server was shut down unexpectedly.")
        print(ex)
    print("Shutting down Webcam Server")


def print_info(info):
    separator = "============================\n============================"
    print(separator)
    print(info)
    print(separator)


def run_open_cv_test(config):
    webcam_url = os.path.join(config["install_dir"], "WebCamera")
    language_server = threading.Thread(target=run_language_server,
                                       args=(config[LLVM_PROJECT_NAME],
                                             webcam_url))
    webcamera_server = threading.Thread(
        target=run_webcamera_server, args=(config[WEBCAMERA_PROJECT_NAME], ))
    language_server.start()
    webcamera_server.start()

    print_info("Inspect OpenCV.js by opening http://localhost:8000/")

    language_server.join()
    webcamera_server.join()


def main():
    config = get_default_config()
    setup_projects(config)
    run_open_cv_test(config)


if __name__ == "__main__":
    main()
